/**
 * Simple structured logging utility
 * In production, replace with pino/winston
 */
export const logger = {
  info: (msg, ...args) => {
    console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...args);
  },
  error: (msg, err) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err);
  },
  warn: (msg, ...args) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...args);
  },
};
