import { Router, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../authMiddleware';
import { db } from '../database';

export const ddtRouter = Router();

// GET /api/v1/ddts
ddtRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const ddts = db.getDdts();
  return res.json({ success: true, data: ddts });
});

// POST /api/v1/ddts
ddtRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const ddt = req.body;
  if (!ddt || !ddt.id) {
    return res.status(400).json({ success: false, error: 'Dati DDT non validi' });
  }
  const saved = db.saveDdt(ddt);
  return res.json({ success: true, data: saved });
});
