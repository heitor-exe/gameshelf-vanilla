import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';

import authRouter from './routes/auth.js';
import shelfRouter from './routes/shelf.js';
import profileRouter from './routes/profile.js';
import feedRouter from './routes/feed.js';
import igdbRouter from './routes/igdb.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS (Cross-Origin Resource Sharing)
// Permite que o frontend (rodando em outra porta, ex: 3000) consiga fazer requisições para este backend (3001)
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true, // Necessário para permitir o envio de cookies de sessão
}));

// Configuração de limites para o corpo das requisições JSON e URL-encoded.
// Aumentamos o limite para '10mb' para permitir o upload de imagens de avatar convertidas em Base64.
// Sem isso, o express recusa arquivos grandes com erro 413 (Payload Too Large).
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(session({
  store: new (pgSession(session))({
    pool: pgPool,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', authRouter);
app.use('/api/shelf', shelfRouter);
app.use('/api/profile', profileRouter);
app.use('/api/feed', feedRouter);
app.use('/api/igdb', igdbRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`GameShelf backend running on http://localhost:${PORT}`);
  });
}

export default app;
