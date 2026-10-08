import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  generateToken,
  AuthenticatedRequest,
} from '../authMiddleware';
import {
  authenticateUserPassword,
} from '../passwordUtils';
import { INITIAL_USERS } from '../../data/mockData';
import { db } from '../database';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const searchEmail = (email || username || '').trim().toLowerCase();

  if (!searchEmail) {
    return res.status(400).json({
      success: false,
      message: 'Inserisci un indirizzo email o nome utente valido.',
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password obbligatoria. Inserisci la password per completare l\'accesso.',
    });
  }

  const dbDipendenti = db.getDipendenti();
  let userMatch = INITIAL_USERS.find(
    (u) => u.email.toLowerCase() === searchEmail || u.id.toLowerCase() === searchEmail
  );

  if (!userMatch) {
    const dipMatch = dbDipendenti.find(
      (d: any) =>
        (d.email && d.email.toLowerCase() === searchEmail) ||
        (d.id && d.id.toLowerCase() === searchEmail) ||
        (d.matricola && d.matricola.toLowerCase() === searchEmail)
    );
    if (dipMatch) {
      userMatch = {
        id: dipMatch.id,
        name: `${dipMatch.nome} ${dipMatch.cognome}`,
        email: dipMatch.email,
        role:
          dipMatch.reparto === 'contabilita'
            ? 'amministratore'
            : dipMatch.reparto === 'ufficio_tecnico'
            ? 'responsabile'
            : 'operatore',
        reparto: (dipMatch.reparto as any) || 'ufficio_tecnico',
        phone: dipMatch.telefono,
        qualifiche: [dipMatch.ruoloAziendale, ...(dipMatch.patentini || [])],
      };
    }
  }

  if (!userMatch) {
    return res.status(401).json({
      success: false,
      message: 'Credenziali non valide. Utente non trovato nel registro aziendale VoltMaster.',
    });
  }

  // Verifica password con scrypt
  const isPasswordValid = authenticateUserPassword(userMatch.email, password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Password errata. Verifica le credenziali inserite (password predefinita: voltmaster2026).',
    });
  }

  const userPayload = {
    id: userMatch.id,
    name: userMatch.name,
    email: userMatch.email,
    role: userMatch.role,
    reparto: userMatch.reparto,
    phone: userMatch.phone,
    qualifiche: userMatch.qualifiche,
    avatar: userMatch.avatar,
    assignedClientId: userMatch.assignedClientId,
  };

  const token = generateToken(userPayload);

  return res.json({
    success: true,
    token,
    user: userPayload,
    message: 'Autenticazione avvenuta con successo. Token JWT sicuro generato.',
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Sessione non valida o token scaduto.',
    });
  }
  return res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logout completato con successo.',
  });
});
