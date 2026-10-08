import { Router, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../authMiddleware';
import { db } from '../database';

export const rolRouter = Router();

// GET /api/v1/rols
rolRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const rols = db.getRols();
  return res.json({ success: true, data: rols });
});

// GET /api/v1/rols/:id
rolRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const rol = db.getRolById(id);
  if (!rol) {
    return res.status(404).json({ success: false, error: 'Rapportino ROL non trovato' });
  }
  return res.json({ success: true, data: rol });
});

// POST /api/v1/rols
rolRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const rol = req.body;
  if (!rol || !rol.id) {
    return res.status(400).json({ success: false, error: 'Dati ROL non validi' });
  }

  // Se è presente il sigillo digitale, blocca le modifiche a norma di legge
  if (rol.sigilloDigitale && rol.sigilloDigitale.sha256Hash) {
    rol.bloccatoModifiche = true;
  }

  const saved = db.saveRol(rol);
  return res.json({
    success: true,
    data: saved,
    message: rol.sigilloDigitale
      ? `Rapportino ${rol.numero} salvato e sigillato digitalmente con hash SHA-256.`
      : `Rapportino ${rol.numero} salvato con successo.`,
  });
});

// PATCH /api/v1/rols/:id
rolRouter.patch('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const patch = req.body;

  const existing = db.getRolById(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Rapportino ROL non trovato' });
  }

  // PROTEZIONE INVIOLABILITÀ SIGILLO: se il rapporto è firmato e sigillato digitalmente, è immutabile!
  if (existing.bloccatoModifiche && existing.sigilloDigitale) {
    // Solo l'amministratore può aggiungere note di approvazione o marcare emailInviata, ma NON alterare ore o firma
    const userRole = req.user?.role;
    const isOnlyStatusUpdate =
      Object.keys(patch).every((k) =>
        ['stato', 'noteApprovazione', 'approvatoDaId', 'approvatoIl', 'emailInviataIl', 'emailDestinatario', 'pdfReportGenerato'].includes(k)
      );

    if (!isOnlyStatusUpdate || userRole !== 'amministratore') {
      return res.status(403).json({
        success: false,
        error: '403 - Rapporto Sigillato Immutabile',
        message: 'Il rapporto di lavoro è stato firmato dal cliente e sigillato con hash SHA-256 (art. 2702 c.c.). I contenuti tecnici e orari non sono modificabili.',
      });
    }
  }

  const updated = db.updateRol(id, patch);
  return res.json({ success: true, data: updated });
});

// DELETE /api/v1/rols/:id
rolRouter.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getRolById(id);

  if (existing && existing.bloccatoModifiche && req.user?.role !== 'amministratore') {
    return res.status(403).json({
      success: false,
      error: '403 - Rapporto Sigillato',
      message: 'Impossibile eliminare un rapporto firmato con valore probatorio senza permessi di amministrazione.',
    });
  }

  const deleted = db.deleteRol(id);
  return res.json({ success: deleted });
});
