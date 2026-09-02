import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAuthUrl, handleCallback, loadOrAuthenticateClient } from './auth.js';
import { appendMember, getAllMembers, getMemberByEmail, initializeSheet } from './googleSheets.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
    res.send('Authorization successful! You can close this window.');
  } catch (err) {
    res.status(500).send(`Auth failed: ${err.message}`);
  }
});

// API endpoints
app.post('/api/members', async (req, res) => {
  try {
    const { name, email, phone, dateJoined, status } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }
    await appendMember({ name, email, phone: phone || '', dateJoined: dateJoined || new Date().toISOString().split('T')[0], status: status || 'Active' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const members = await getAllMembers();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
(async () => {
  try {
    loadOrAuthenticateClient();
    await initializeSheet();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Authorize at http://localhost:${PORT}/auth`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
})();
