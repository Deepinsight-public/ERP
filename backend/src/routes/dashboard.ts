import express from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    let storeFilter = '';
    let warehouseFilter = '';
    const queryParams = [req.user!.companyId];

    if (req.user!.role === 'store' && req.user!.storeId) {
      storeFilter = ' AND store_id = $2';
      queryParams.push(req.user!.storeId);
    } else if (req.user!.role === 'warehouse' && req.user!.warehouseId) {
      warehouseFilter = ' AND warehouse_id = $2';
      queryParams.push(req.user!.warehouseId);
    }

    const [
      productsResult,
      ordersResult,
      inventoryResult,
      recentOrdersResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM products WHERE company_id = $1 AND is_active = true', [req.user!.companyId]),
      pool.query(`SELECT COUNT(*) as total, order_type FROM orders WHERE company_id = $1${storeFilter}${warehouseFilter} GROUP BY order_type`, queryParams),
      pool.query(`SELECT SUM(quantity) as total_stock, COUNT(*) as locations FROM inventory WHERE company_id = $1${storeFilter}${warehouseFilter}`, queryParams),
      pool.query(`
        SELECT o.*, s.name as store_name, w.name as warehouse_name
        FROM orders o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN warehouses w ON o.warehouse_id = w.id
        WHERE o.company_id = $1${storeFilter}${warehouseFilter}
        ORDER BY o.order_date DESC
        LIMIT 5
      `, queryParams)
    ]);

    const ordersByType = ordersResult.rows.reduce((acc: any, row: any) => {
      acc[row.order_type] = parseInt(row.total);
      return acc;
    }, {});

    const stats: any = {
      totalProducts: parseInt(productsResult.rows[0].total),
      totalStock: parseInt(inventoryResult.rows[0].total_stock || 0),
      inventoryLocations: parseInt(inventoryResult.rows[0].locations || 0),
      orders: {
        purchase: ordersByType.purchase || 0,
        sales: ordersByType.sales || 0,
        transfer: ordersByType.transfer || 0,
        total: Object.values(ordersByType).reduce((sum: any, count: any) => sum + count, 0)
      },
      recentOrders: recentOrdersResult.rows
    };

    if (req.user!.role === 'headquarter') {
      const [storesResult, warehousesResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM stores WHERE company_id = $1 AND is_active = true', [req.user!.companyId]),
        pool.query('SELECT COUNT(*) as total FROM warehouses WHERE company_id = $1 AND is_active = true', [req.user!.companyId])
      ]);

      stats.totalStores = parseInt(storesResult.rows[0].total);
      stats.totalWarehouses = parseInt(warehousesResult.rows[0].total);
    }

    res.json({ stats });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/low-stock', async (req: AuthenticatedRequest, res) => {
  try {
    let locationFilter = '';
    const queryParams = [req.user!.companyId];

    if (req.user!.role === 'store' && req.user!.storeId) {
      locationFilter = ' AND i.store_id = $2';
      queryParams.push(req.user!.storeId);
    } else if (req.user!.role === 'warehouse' && req.user!.warehouseId) {
      locationFilter = ' AND i.warehouse_id = $2';
      queryParams.push(req.user!.warehouseId);
    }

    const result = await pool.query(`
      SELECT i.*, p.name as product_name, p.sku,
             s.name as store_name, s.store_code,
             w.name as warehouse_name, w.warehouse_code
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN stores s ON i.store_id = s.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.company_id = $1 AND i.quantity <= i.reorder_level${locationFilter}
      ORDER BY (i.quantity - i.reorder_level) ASC
      LIMIT 10
    `, queryParams);

    res.json({ lowStockItems: result.rows });

  } catch (error) {
    console.error('Low stock fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

export { router as dashboardRoutes };
