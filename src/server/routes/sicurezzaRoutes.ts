import { Router, Response } from 'express';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
} from '../authMiddleware';
import { db } from '../database';
import {
  getCruscottoSicurezzaCantiere,
  getRegistroIdoneitaDipendenti,
} from '../../data/mockSicurezza';

export const sicurezzaRouter = Router();

// GET /api/v1/sicurezza/cruscotto/:cantiereId
sicurezzaRouter.get('/cruscotto/:cantiereId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { cantiereId } = req.params;
  const cruscotto = getCruscottoSicurezzaCantiere(cantiereId);
  return res.json({ success: true, data: cruscotto });
});

// GET /api/v1/sicurezza/documenti
sicurezzaRouter.get('/documenti', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const docs = db.getDocumentiSicurezza();
  return res.json({ success: true, data: docs });
});

// GET /api/v1/sicurezza/documenti/:cantiereId
sicurezzaRouter.get('/documenti/:cantiereId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { cantiereId } = req.params;
  const docs = db.getDocumentiSicurezzaByCantiere(cantiereId);
  return res.json({ success: true, data: docs });
});

// POST /api/v1/sicurezza/documenti
sicurezzaRouter.post(
  '/documenti',
  authMiddleware,
  requireRoles('amministratore', 'responsabile'),
  (req: AuthenticatedRequest, res: Response) => {
    const doc = req.body;
    if (!doc || !doc.id || !doc.titolo || !doc.cantiereId) {
      return res.status(400).json({ success: false, error: 'Dati documento sicurezza non validi' });
    }
    const saved = db.saveDocumentoSicurezza(doc);
    return res.json({ success: true, data: saved });
  }
);

// DELETE /api/v1/sicurezza/documenti/:id
sicurezzaRouter.delete(
  '/documenti/:id',
  authMiddleware,
  requireRoles('amministratore'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteDocumentoSicurezza(id);
    return res.json({ success: deleted });
  }
);

// GET /api/v1/sicurezza/idoneita-lavoratori
sicurezzaRouter.get('/idoneita-lavoratori', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const registro = getRegistroIdoneitaDipendenti();
  return res.json({ success: true, data: registro });
});

// GET /api/v1/sicurezza/idoneita-lavoratori/:dipendenteId
sicurezzaRouter.get('/idoneita-lavoratori/:dipendenteId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { dipendenteId } = req.params;
  const registro = getRegistroIdoneitaDipendenti();
  const found = registro.find((r) => r.dipendenteId === dipendenteId);
  if (!found) {
    return res.status(404).json({ success: false, error: 'Lavoratore non trovato nel registro' });
  }
  return res.json({ success: true, data: found });
});
