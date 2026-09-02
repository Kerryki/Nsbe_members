import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/auth/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

/**
 * Get the OAuth authorization URL for user login
 * @returns {string}
 */
export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * Handle OAuth callback and persist tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} OAuth tokens
 */
export async function handleCallback(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  // ponytail: tokens stored in token.json for dev; production should use secure storage (e.g., encrypted env vars or secret manager)
  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  }
  return tokens;
}

/**
 * Load cached tokens or initialize client without auth
 * @returns {Object} OAuth2 client
 */
export function loadOrAuthenticateClient() {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
  }
  return oauth2Client;
}

/**
 * Get the current OAuth client
 * @returns {Object} OAuth2 client
 */
export function getClient() {
  return oauth2Client;
}
