import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { setCustomClaims } from '../config/firebase';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('role').isIn(['headquarter', 'warehouse', 'store']),
  body('companyCode').trim().isLength({ min: 2, max: 50 }),
  body('storeId').optional().isInt(),
  body('warehouseId').optional().isInt()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firebaseUid, email, name, role, companyCode, storeId, warehouseId } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const companyResult = await client.query(
        'SELECT id FROM companies WHERE code = $1',
        [companyCode]
      );

      if (companyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Company not found' });
      }

      const companyId = companyResult.rows[0].id;

      if (role === 'store' && !storeId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Store ID required for store role' });
      }

      if (role === 'warehouse' && !warehouseId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Warehouse ID required for warehouse role' });
      }

      const existingUser = await client.query(
        'SELECT id FROM users WHERE firebase_uid = $1 OR email = $2',
        [firebaseUid, email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'User already exists' });
      }

      const userResult = await client.query(
        `INSERT INTO users (firebase_uid, email, name, role, company_id, store_id, warehouse_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [firebaseUid, email, name, role, companyId, storeId || null, warehouseId || null]
      );

      const userId = userResult.rows[0].id;

      const customClaims = {
        role,
        companyId,
        ...(storeId && { storeId }),
        ...(warehouseId && { warehouseId })
      };

      await setCustomClaims(firebaseUid, customClaims);

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: userId,
          email,
          name,
          role,
          companyId,
          storeId,
          warehouseId
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.company_id, u.store_id, u.warehouse_id,
             c.name as company_name, c.code as company_code,
             s.name as store_name, s.store_code,
             w.name as warehouse_name, w.warehouse_code
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN stores s ON u.store_id = s.id
      LEFT JOIN warehouses w ON u.warehouse_id = w.id
      WHERE u.firebase_uid = $1 AND u.is_active = true
    `, [req.user!.uid]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: {
          id: user.company_id,
          name: user.company_name,
          code: user.company_code
        },
        ...(user.store_id && {
          store: {
            id: user.store_id,
            name: user.store_name,
            code: user.store_code
          }
        }),
        ...(user.warehouse_id && {
          warehouse: {
            id: user.warehouse_id,
            name: user.warehouse_name,
            code: user.warehouse_code
          }
        })
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export { router as authRoutes };
