/** Express app factory (separate from index.ts so it can be tested without listening). */
import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './auth/routes';
import { attachUser } from './auth/session';
import { errorHandler } from './lib/http';
import { adminRouter } from './routes/admin';
import { invitesRouter, leaguesRouter } from './routes/leagues';
import { playersRouter } from './routes/players';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render terminates TLS in front of us
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(attachUser);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/leagues', leaguesRouter);
  app.use('/api/invites', invitesRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // In production, serve the built React app and fall back to index.html for client routes.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(here, '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
