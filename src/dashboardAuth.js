import { logger } from './logger.js';

const VP_EMAIL = process.env.VP_EMAIL;

if (!VP_EMAIL) {
  throw new Error('Missing VP_EMAIL environment variable');
}

/**
 * Middleware to verify request is from authenticated VP
 * Checks session token stored in secure cookie (set by /auth/callback)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function verifyVP(req, res, next) {
  // ponytail: session-based auth; VP email validated at /auth/callback and stored in session
  const vpEmail = req.session?.vpEmail;

  if (!vpEmail || vpEmail.toLowerCase() !== VP_EMAIL.toLowerCase()) {
    logger.warn(`Unauthorized dashboard access: session=${vpEmail || 'none'}`);
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * Get VP email from environment
 * @returns {string}
 */
export function getVPEmail() {
  return VP_EMAIL;
}

/**
 * Set VP session after successful OAuth
 * @param {Object} req - Express request
 * @param {string} userEmail - User email from OAuth provider
 * @returns {boolean} True if user is VP
 */
export function setVPSession(req, userEmail) {
  if (userEmail.toLowerCase() === VP_EMAIL.toLowerCase()) {
    req.session.vpEmail = userEmail;
    return true;
  }
  return false;
}
