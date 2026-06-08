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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`GameShelf backend running on http://localhost:${PORT}`);
});
