import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthUrl, handleCallback, loadOrAuthenticateClient } from './auth.js';
import { appendMember, getAllMembers, getMemberByEmail, initializeSheet } from './googleSheets.js';
import { validateMember } from './validation.js';
import { logger } from './logger.js';
import dashboardApi from './dashboardApi.js';
import { initializeEventsSheet } from './dashboardSheets.js';
import { setVPSession } from './dashboardAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

// Session middleware for dashboard auth
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent JS access to cookie
    sameSite: 'strict' // CSRF protection
  }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;

// OAuth flow
app.get('/auth', (req, res) => {
  res.redirect(getAuthUrl());
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }
  try {
    await handleCallback(code);
    logger.info('OAuth callback successful');
    res.send('Authorization successful! You can close this window.');
  } catch (err) {
    logger.error('OAuth callback failed', err);
    res.status(500).send('Authorization failed');
  }
});

// API endpoints
app.post('/api/members', async (req, res) => {
  try {
    const data = validateMember({
      ...req.body,
      dateJoined: req.body.dateJoined || new Date().toISOString().split('T')[0],
    });
    await appendMember(data);
    res.json({ success: true });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to add member' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const members = await getAllMembers();
    res.json(members);
  } catch (err) {
    logger.error('Failed to fetch members', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.get('/api/members/:email', async (req, res) => {
  try {
    const member = await getMemberByEmail(req.params.email);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    logger.error('Failed to fetch member', err);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Dashboard API routes
app.use('/dashboard/api', dashboardApi);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
(async () => {
  try {
    loadOrAuthenticateClient();
    await initializeSheet();
    await initializeEventsSheet();
    app.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
      logger.info(`Authorize at http://localhost:${PORT}/auth`);
      logger.info(`Dashboard at http://localhost:${PORT}/dashboard`);
    });
  } catch (err) {
    logger.error('Startup error', err);
    process.exit(1);
  }
})();
