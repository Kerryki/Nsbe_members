import { getClient } from './auth.js';
import { logger } from './logger.js';

const VP_EMAIL = process.env.VP_EMAIL;

if (!VP_EMAIL) {
  throw new Error('Missing VP_EMAIL environment variable');
}

/**
 * Middleware to verify request is from VP's OAuth token
 * In production, extract user email from OAuth token; here simplified for demo
 */
export function verifyVP(req, res, next) {
  // ponytail: simplified check; production should validate OAuth token and extract email
  const userEmail = req.headers['x-user-email'];

  if (!userEmail || userEmail.toLowerCase() !== VP_EMAIL.toLowerCase()) {
    logger.warn(`Unauthorized dashboard access attempt: ${userEmail}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * Get VP dashboard access URL - shows which email can access
 */
export function getVPEmail() {
  return VP_EMAIL;
}
