import { Router, Response } from 'express';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
} from '../authMiddleware';
import { db } from '../database';

export const ordiniRouter = Router();

// GET /api/v1/ordini
ordiniRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const ordini = db.getOrdini();
  return res.json({ success: true, data: ordini });
});

// POST /api/v1/ordini
ordiniRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const ordine = req.body;
  if (!ordine || !ordine.id) {
    return res.status(400).json({ success: false, error: 'Dati ordine non validi' });
  }
  const saved = db.saveOrdine(ordine);
  return res.json({ success: true, data: saved });
});

// DELETE /api/v1/ordini/:id
ordiniRouter.delete(
  '/:id',
  authMiddleware,
  requireRoles('amministratore', 'responsabile'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteOrdine(id);
    return res.json({ success: deleted });
  }
);
