import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  query('orderType').optional().isIn(['purchase', 'sales', 'transfer'])
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const { status, orderType } = req.query;

    let whereClause = 'WHERE o.company_id = $1';
    const queryParams: any[] = [req.user!.companyId];
    let paramCount = 1;

    if (req.user!.role === 'store' && req.user!.storeId) {
      paramCount++;
      whereClause += ` AND o.store_id = $${paramCount}`;
      queryParams.push(req.user!.storeId);
    } else if (req.user!.role === 'warehouse' && req.user!.warehouseId) {
      paramCount++;
      whereClause += ` AND o.warehouse_id = $${paramCount}`;
      queryParams.push(req.user!.warehouseId);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (orderType) {
      paramCount++;
      whereClause += ` AND o.order_type = $${paramCount}`;
      queryParams.push(orderType);
    }

    const ordersQuery = `
      SELECT o.*, 
             s.name as store_name, s.store_code,
             w.name as warehouse_name, w.warehouse_code,
             u.name as created_by_name,
             COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, s.name, s.store_code, w.name, w.warehouse_code, u.name
      ORDER BY o.order_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `;

    const [ordersResult, countResult] = await Promise.all([
      pool.query(ordersQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const totalPages = Math.ceil(parseInt(countResult.rows[0].total) / limit);

    return res.json({
      orders: ordersResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/', [
  body('orderType').isIn(['purchase', 'sales', 'transfer']),
  body('storeId').optional().isInt(),
  body('warehouseId').optional().isInt(),
  body('customerName').optional().trim().isLength({ max: 255 }),
  body('customerEmail').optional().isEmail(),
  body('customerPhone').optional().trim().isLength({ max: 50 }),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.unitPrice').isFloat({ min: 0 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderType, storeId, warehouseId, customerName, customerEmail, customerPhone, items } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderNumber = `${orderType.toUpperCase()}-${Date.now()}`;
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

      const orderResult = await client.query(
        `INSERT INTO orders (company_id, order_number, order_type, store_id, warehouse_id, 
                           customer_name, customer_email, customer_phone, total_amount, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [req.user!.companyId, orderNumber, orderType, storeId || null, warehouseId || null,
         customerName, customerEmail, customerPhone, totalAmount, req.user!.userId]
      );

      const orderId = orderResult.rows[0].id;

      for (const item of items) {
        const totalPrice = item.quantity * item.unitPrice;
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.productId, item.quantity, item.unitPrice, totalPrice]
        );
      }

      await client.query('COMMIT');

      const fullOrderResult = await pool.query(
        `SELECT o.*, 
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'sku', p.sku,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = $1
         GROUP BY o.id`,
        [orderId]
      );

      return res.status(201).json({ 
        message: 'Order created successfully',
        order: fullOrderResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

export { router as orderRoutes };
