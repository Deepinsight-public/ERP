import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', [
  query('storeId').optional().isInt(),
  query('warehouseId').optional().isInt(),
  query('productId').optional().isInt(),
  query('lowStock').optional().isBoolean()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeId, warehouseId, productId, lowStock } = req.query;

    let whereClause = 'WHERE i.company_id = $1';
    const queryParams: any[] = [req.user!.companyId];
    let paramCount = 1;

    if (req.user!.role === 'store' && req.user!.storeId) {
      paramCount++;
      whereClause += ` AND i.store_id = $${paramCount}`;
      queryParams.push(req.user!.storeId);
    } else if (req.user!.role === 'warehouse' && req.user!.warehouseId) {
      paramCount++;
      whereClause += ` AND i.warehouse_id = $${paramCount}`;
      queryParams.push(req.user!.warehouseId);
    } else {
      if (storeId) {
        paramCount++;
        whereClause += ` AND i.store_id = $${paramCount}`;
        queryParams.push(parseInt(storeId as string));
      }

      if (warehouseId) {
        paramCount++;
        whereClause += ` AND i.warehouse_id = $${paramCount}`;
        queryParams.push(parseInt(warehouseId as string));
      }
    }

    if (productId) {
      paramCount++;
      whereClause += ` AND i.product_id = $${paramCount}`;
      queryParams.push(parseInt(productId as string));
    }

    if (lowStock === 'true') {
      whereClause += ' AND i.quantity <= i.reorder_level';
    }

    const inventoryQuery = `
      SELECT i.*, p.name as product_name, p.sku, p.unit_price,
             s.name as store_name, s.store_code,
             w.name as warehouse_name, w.warehouse_code,
             (i.quantity - i.reserved_quantity) as available_quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN stores s ON i.store_id = s.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      ${whereClause}
      ORDER BY p.name, s.name, w.name
    `;

    const result = await pool.query(inventoryQuery, queryParams);

    return res.json({ inventory: result.rows });

  } catch (error) {
    console.error('Inventory fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/adjust', requireRole(['headquarter', 'warehouse']), [
  body('productId').isInt(),
  body('storeId').optional().isInt(),
  body('warehouseId').optional().isInt(),
  body('quantity').isInt(),
  body('reason').trim().isLength({ min: 1, max: 255 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, storeId, warehouseId, quantity, reason } = req.body;

    if ((!storeId && !warehouseId) || (storeId && warehouseId)) {
      return res.status(400).json({ error: 'Must specify either storeId or warehouseId, not both' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingInventory = await client.query(
        `SELECT * FROM inventory 
         WHERE company_id = $1 AND product_id = $2 AND 
               ((store_id = $3 AND warehouse_id IS NULL) OR (warehouse_id = $4 AND store_id IS NULL))`,
        [req.user!.companyId, productId, storeId || null, warehouseId || null]
      );

      let result;
      if (existingInventory.rows.length > 0) {
        result = await client.query(
          `UPDATE inventory 
           SET quantity = quantity + $1, last_updated = CURRENT_TIMESTAMP
           WHERE id = $2 RETURNING *`,
          [quantity, existingInventory.rows[0].id]
        );
      } else {
        result = await client.query(
          `INSERT INTO inventory (company_id, product_id, store_id, warehouse_id, quantity)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [req.user!.companyId, productId, storeId || null, warehouseId || null, Math.max(0, quantity)]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, table_name, record_id, action, new_values)
         VALUES ($1, $2, 'inventory', $3, 'quantity_adjustment', $4)`,
        [req.user!.companyId, req.user!.userId, result.rows[0].id, JSON.stringify({ quantity, reason })]
      );

      await client.query('COMMIT');

      return res.json({ 
        message: 'Inventory adjusted successfully',
        inventory: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Inventory adjustment error:', error);
    return res.status(500).json({ error: 'Failed to adjust inventory' });
  }
});

export { router as inventoryRoutes };
