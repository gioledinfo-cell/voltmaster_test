import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'cantiere-secret-key-2026-super-secure-voltmaster';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  reparto?: string;
  avatar?: string;
  phone?: string;
  qualifiche?: string[];
  assignedClientId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      reparto: user.reparto,
      phone: user.phone,
      qualifiche: user.qualifiche,
      assignedClientId: user.assignedClientId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware di autenticazione JWT rigoroso.
 * BLOCCA qualsiasi bypass non autenticato e token fasulli 'dev-token-'.
 * Garantisce che req.user sia valorizzato con il payload crittografato e firmato.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '401 - Non Autorizzato',
      message: 'Token di autenticazione mancante o formato non valido. Effettuare il login.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      error: '401 - Non Autorizzato',
      message: 'Token JWT vuoto.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: '401 - Token Non Valido o Scaduto',
      message: 'La sessione è scaduta o il token non è valido. Effettuare nuovamente il login.',
    });
  }
}

/**
 * Middleware per autorizzazione basata su ruoli (RBAC)
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '401 - Non Autorizzato',
        message: 'Autenticazione richiesta per accedere a questa risorsa.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: '403 - Accesso Negato',
        message: `Il ruolo aziendale '${req.user.role}' non possiede i permessi per questa operazione.`,
      });
      return;
    }

    next();
  };
}

/**
 * Sanitizzazione e Isolamento Permessi Dati Riservati
 * Gli operai sul campo (ruolo 'operatore') e clienti non devono mai avere visibilità su:
 * - Tariffe orarie e costo orario della manodopera (costoOrario in dipendenti e presenze)
 * - Budget complessivi, margini e costi consuntivati dei cantieri
 * - Totali finanziari e contabilità riservata
 */

export function canAccessFinancialData(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  // Solo l'amministratore e i responsabili di progetto/ufficio tecnico possono vedere i dati finanziari
  return user.role === 'amministratore' || (user.role === 'responsabile' && user.reparto === 'ufficio_tecnico');
}

export function sanitizeCantiere(cantiere: any, user?: AuthenticatedUser): any {
  if (canAccessFinancialData(user)) {
    return cantiere;
  }

  // Maschera informazioni finanziarie riservate per gli operai di campo
  return {
    ...cantiere,
    budgetTotale: 0,
    costiConsuntivati: 0,
    datiFinanziariRiservati: true,
  };
}

export function sanitizeDipendente(dipendente: any, user?: AuthenticatedUser): any {
  if (canAccessFinancialData(user)) {
    return dipendente;
  }

  // Maschera la tariffa / costo orario
  return {
    ...dipendente,
    costoOrario: 0,
    costoRiservato: true,
  };
}

export function sanitizePresenza(presenza: any, user?: AuthenticatedUser): any {
  if (canAccessFinancialData(user)) {
    return presenza;
  }

  // Maschera i costi della presenza oraria
  return {
    ...presenza,
    costoOrario: 0,
    costoTotaleGiornaliero: 0,
    indennitaTrasferta: 0,
    costoRiservato: true,
  };
}

export function sanitizeSal(sal: any, user?: AuthenticatedUser): any {
  if (canAccessFinancialData(user)) {
    return sal;
  }

  // Gli operai vedono solo l'avanzamento percentuale fisico, non i valori monetari in EUR
  return {
    ...sal,
    totaleLavoriAMisura: 0,
    totaleLavoriACorpo: 0,
    totaleLavoriEconomia: 0,
    totaleGeneraleContratto: 0,
    importoSalCorrente: 0,
    importoCertificatoPagamento: 0,
    datiEconomiciRiservati: true,
  };
}

export function sanitizeApplicationState(state: any, user?: AuthenticatedUser): any {
  if (canAccessFinancialData(user)) {
    return state;
  }

  return {
    ...state,
    cantieri: (state.cantieri || []).map((c: any) => sanitizeCantiere(c, user)),
    dipendenti: (state.dipendenti || []).map((d: any) => sanitizeDipendente(d, user)),
    presenze: (state.presenze || []).map((p: any) => sanitizePresenza(p, user)),
    sals: (state.sals || []).map((s: any) => sanitizeSal(s, user)),
  };
}
