import { Router, Response } from 'express';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
  sanitizeSal,
} from '../authMiddleware';
import { db } from '../database';

export const salRouter = Router();

// GET /api/v1/sals
salRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const sals = db.getSals();
  const sanitized = sals.map((s) => sanitizeSal(s, req.user));
  return res.json({ success: true, data: sanitized });
});

// POST /api/v1/sals
salRouter.post(
  '/',
  authMiddleware,
  requireRoles('amministratore', 'responsabile'),
  (req: AuthenticatedRequest, res: Response) => {
    const sal = req.body;
    if (!sal || !sal.id) {
      return res.status(400).json({ success: false, error: 'Dati SAL non validi' });
    }
    const saved = db.saveSal(sal);
    return res.json({ success: true, data: saved });
  }
);
