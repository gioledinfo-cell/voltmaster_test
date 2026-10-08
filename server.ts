import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/database';
import {
  authMiddleware,
  AuthenticatedRequest,
  sanitizeApplicationState,
  sanitizeDipendente,
} from './src/server/authMiddleware';
import {
  initializeUserCredentials,
} from './src/server/passwordUtils';
import { INITIAL_USERS } from './src/data/mockData';

// Router modulari
import { authRouter } from './src/server/routes/authRoutes';
import { cantieriRouter } from './src/server/routes/cantieriRoutes';
import { rolRouter } from './src/server/routes/rolRoutes';
import { presenzeRouter } from './src/server/routes/presenzeRoutes';
import { sicurezzaRouter } from './src/server/routes/sicurezzaRoutes';
import { salRouter } from './src/server/routes/salRoutes';
import { ddtRouter } from './src/server/routes/ddtRoutes';
import { ordiniRouter } from './src/server/routes/ordiniRoutes';
import { auditRouter } from './src/server/routes/auditRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Inizializza archivio credenziali crittografiche
  const allKnownEmails = [
    ...INITIAL_USERS.map((u) => u.email),
    ...db.getDipendenti().map((d: any) => d.email).filter(Boolean),
  ];
  initializeUserCredentials(allKnownEmails);
  console.log(`🔐 Cryptographic credential store initialized with scrypt for ${allKnownEmails.length} users.`);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- MONTAGGIO ROUTER MODULARI EXPRESS (/api/v1/* & /api/*) ---
  app.use('/api/v1/auth', authRouter);
  app.use('/api/auth', authRouter);

  app.use('/api/v1/cantieri', cantieriRouter);
  app.use('/api/cantieri', cantieriRouter);

  app.use('/api/v1/rols', rolRouter);
  app.use('/api/rols', rolRouter);

  app.use('/api/v1/presenze', presenzeRouter);
  app.use('/api/presenze', presenzeRouter);

  app.use('/api/v1/sicurezza', sicurezzaRouter);
  app.use('/api/sicurezza', sicurezzaRouter);

  app.use('/api/v1/sals', salRouter);
  app.use('/api/sals', salRouter);

  app.use('/api/v1/ddts', ddtRouter);
  app.use('/api/ddts', ddtRouter);

  app.use('/api/v1/ordini', ordiniRouter);
  app.use('/api/ordini', ordiniRouter);

  app.use('/api/v1/audit-log', auditRouter);
  app.use('/api/audit-log', auditRouter);

  // --- STATO GLOBALE & DIPENDENTI ---
  app.get('/api/v1/state', authMiddleware, (req: AuthenticatedRequest, res) => {
    const state = db.getState();
    const sanitizedState = sanitizeApplicationState(state, req.user);
    return res.json({
      success: true,
      data: sanitizedState,
    });
  });

  app.post('/api/v1/sync', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (user && user.role === 'operatore' && user.reparto !== 'capocantiere') {
      const newState = req.body;
      const currentState = db.getState();
      const merged = {
        ...currentState,
        rols: newState.rols || currentState.rols,
        presenze: newState.presenze || currentState.presenze,
        lastUpdated: new Date().toISOString(),
      };
      const updated = db.updateState(merged);
      return res.json({
        success: true,
        message: 'Rapportini ROL e presenze sincronizzati con successo.',
        lastUpdated: updated.lastUpdated,
      });
    }

    const newState = req.body;
    if (!newState || typeof newState !== 'object') {
      return res.status(400).json({ error: 'Payload di sincronizzazione non valido' });
    }
    const updated = db.updateState(newState);
    return res.json({
      success: true,
      message: 'Stato sincronizzato con successo sul DB server.',
      lastUpdated: updated.lastUpdated,
    });
  });

  app.get('/api/v1/dipendenti', authMiddleware, (req: AuthenticatedRequest, res) => {
    const dipendenti = db.getDipendenti();
    const sanitized = dipendenti.map((d) => sanitizeDipendente(d, req.user));
    return res.json({ success: true, data: sanitized });
  });

  // --- VITE MIDDLEWARE (DEV MODE) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) {
        return next();
      }

      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production static files serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Full-Stack Express Modular Server running on http://0.0.0.0:${PORT}`);
    console.log(`💾 Persistent Database active with atomic temp-file writes at ./data/cantiere_database.json`);
    console.log(`🛡️ Moduli attivi: Auth, Cantieri, ROLs, Presenze, Sicurezza D.Lgs 81/08, SAL, DDT, Ordini`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
