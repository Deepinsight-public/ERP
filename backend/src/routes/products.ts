import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('category').optional().trim()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const category = req.query.category as string;

    let whereClause = 'WHERE p.company_id = $1 AND p.is_active = true';
    const queryParams: any[] = [req.user!.companyId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND p.category = $${paramCount}`;
      queryParams.push(category);
    }

    const productsQuery = `
      SELECT p.*, 
             COALESCE(SUM(i.quantity), 0) as total_stock,
             COUNT(i.id) as locations_count
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.name
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      pool.query(productsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const totalPages = Math.ceil(parseInt(countResult.rows[0].total) / limit);

    return res.json({
      products: productsResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', requireRole(['headquarter', 'warehouse']), [
  body('sku').trim().isLength({ min: 1, max: 100 }),
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('category').optional().trim().isLength({ max: 100 }),
  body('unitPrice').isFloat({ min: 0 }),
  body('costPrice').isFloat({ min: 0 }),
  body('barcode').optional().trim()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sku, name, description, category, unitPrice, costPrice, barcode } = req.body;

    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE company_id = $1 AND sku = $2',
      [req.user!.companyId, sku]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(409).json({ error: 'Product with this SKU already exists' });
    }

    const result = await pool.query(
      `INSERT INTO products (company_id, sku, name, description, category, unit_price, cost_price, barcode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user!.companyId, sku, name, description, category, unitPrice, costPrice, barcode]
    );

    return res.status(201).json({ product: result.rows[0] });

  } catch (error) {
    console.error('Product creation error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT p.*, 
              COALESCE(SUM(i.quantity), 0) as total_stock,
              json_agg(
                json_build_object(
                  'location_type', CASE WHEN i.store_id IS NOT NULL THEN 'store' ELSE 'warehouse' END,
                  'location_id', COALESCE(i.store_id, i.warehouse_id),
                  'location_name', COALESCE(s.name, w.name),
                  'quantity', i.quantity,
                  'reserved_quantity', i.reserved_quantity
                )
              ) FILTER (WHERE i.id IS NOT NULL) as inventory_locations
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       LEFT JOIN stores s ON i.store_id = s.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE p.id = $1 AND p.company_id = $2 AND p.is_active = true
       GROUP BY p.id`,
      [productId, req.user!.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product: result.rows[0] });

  } catch (error) {
    console.error('Product fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export { router as productRoutes };
