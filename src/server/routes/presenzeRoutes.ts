import { Router, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
  sanitizePresenza,
} from '../authMiddleware';
import { db } from '../database';

export const presenzeRouter = Router();

// GET /api/v1/presenze
presenzeRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const presenze = db.getPresenze();
  const sanitized = presenze.map((p) => sanitizePresenza(p, req.user));
  return res.json({ success: true, data: sanitized });
});

// POST /api/v1/presenze
presenzeRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const presenza = req.body;
  if (!presenza || !presenza.id || !presenza.dipendenteId) {
    return res.status(400).json({ success: false, error: 'Dati presenza cantiere non validi' });
  }

  // Verifica di conformità sanitaria ex art. 41 D.Lgs 81/08
  const dipendenti = db.getDipendenti();
  const dip = dipendenti.find((d) => d.id === presenza.dipendenteId);

  if (dip && dip.visitaMedicaScadenza) {
    const scadenza = new Date(dip.visitaMedicaScadenza);
    const oggi = new Date();
    if (scadenza < oggi && !presenza.forzaInserimento) {
      return res.status(403).json({
        success: false,
        bloccoSicurezza: true,
        error: 'BLOCCO SICUREZZA D.LGS 81/08',
        message: `Attenzione: Il lavoratore ${dip.nome} ${dip.cognome} ha la visita medica scaduta il ${dip.visitaMedicaScadenza}. Timbratura cantiere non consentita.`,
      });
    }
  }

  const saved = db.savePresenza(presenza);
  return res.json({ success: true, data: saved });
});

// DELETE /api/v1/presenze/:id
presenzeRouter.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deletePresenza(id);
  return res.json({ success: deleted });
});
