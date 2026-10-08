import { Router, Response } from 'express';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
  sanitizeCantiere,
} from '../authMiddleware';
import { db } from '../database';

export const cantieriRouter = Router();

// GET /api/v1/cantieri
cantieriRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const cantieri = db.getCantieri();
  const sanitized = cantieri.map((c) => sanitizeCantiere(c, req.user));
  return res.json({ success: true, data: sanitized });
});

// GET /api/v1/cantieri/:id
cantieriRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const cantiere = db.getCantiereById(id);
  if (!cantiere) {
    return res.status(404).json({ success: false, error: 'Cantiere non trovato' });
  }
  return res.json({ success: true, data: sanitizeCantiere(cantiere, req.user) });
});

// POST /api/v1/cantieri
cantieriRouter.post(
  '/',
  authMiddleware,
  requireRoles('amministratore', 'responsabile'),
  (req: AuthenticatedRequest, res: Response) => {
    const cantiere = req.body;
    if (!cantiere || !cantiere.id || !cantiere.titolo) {
      return res.status(400).json({ success: false, error: 'Dati cantiere non validi' });
    }
    const saved = db.saveCantiere(cantiere);
    return res.json({ success: true, data: saved });
  }
);

// PATCH /api/v1/cantieri/:id
cantieriRouter.patch(
  '/:id',
  authMiddleware,
  requireRoles('amministratore', 'responsabile'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const patch = req.body;
    if (!patch || typeof patch !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload di aggiornamento non valido' });
    }
    const updated = db.updateCantiere(id, patch);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Cantiere non trovato' });
    }
    return res.json({ success: true, data: updated });
  }
);

// DELETE /api/v1/cantieri/:id
cantieriRouter.delete(
  '/:id',
  authMiddleware,
  requireRoles('amministratore'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteCantiere(id);
    return res.json({ success: deleted });
  }
);
