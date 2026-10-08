import { Router, Response } from 'express';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
} from '../authMiddleware';
import { db } from '../database';

export const auditRouter = Router();

// GET /api/v1/audit-log
auditRouter.get(
  '/',
  authMiddleware,
  requireRoles('amministratore', 'responsabile'),
  (req: AuthenticatedRequest, res: Response) => {
    return res.json({ success: true, data: db.getAuditLogs() });
  }
);

// POST /api/v1/audit-log
auditRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const entry = req.body;
  if (!entry || !entry.id || !entry.sha256Hash) {
    return res.status(400).json({ success: false, error: 'Payload registro di audit non valido' });
  }
  const saved = db.saveAuditLog(entry);
  return res.json({ success: true, data: saved });
});
