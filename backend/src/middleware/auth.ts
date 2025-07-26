import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase';
import { pool } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    companyId: number;
    storeId?: number;
    warehouseId?: number;
    userId: number;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    const userResult = await pool.query(
      'SELECT id, email, name, role, company_id, store_id, warehouse_id FROM users WHERE firebase_uid = $1 AND is_active = true',
      [decodedToken.uid]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];
    req.user = {
      uid: decodedToken.uid,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      storeId: user.store_id,
      warehouseId: user.warehouse_id,
      userId: user.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireCompanyAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const companyId = parseInt(req.params.companyId || req.body.companyId || req.query.companyId as string);
  
  if (companyId && companyId !== req.user.companyId) {
    res.status(403).json({ error: 'Access denied to this company data' });
    return;
  }

  next();
}
