import { google } from 'googleapis';
import { getClient } from './auth.js';
import { logger } from './logger.js';

const SHEET_ID = process.env.SHEETS_ID;
const SHEET_NAME = 'Members';

if (!SHEET_ID) {
  throw new Error('Missing SHEETS_ID environment variable');
}

const sheets = google.sheets({ version: 'v4', auth: getClient() });

/**
 * Append a member to the sheet
 * @param {Object} data - { name, email, phone, dateJoined, status }
 * @throws {Error} If append fails
 */
export async function appendMember(data) {
  try {
    const values = [[data.name, data.email, data.phone, data.dateJoined, data.status]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    logger.info(`Member added: ${data.email}`);
  } catch (err) {
    logger.error(`Failed to append member ${data.email}`, err);
    throw new Error('Failed to add member to database');
  }
}

/**
 * Get all members from the sheet
 * @returns {Promise<Array>} Array of member objects
 */
export async function getAllMembers() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    // Skip header row
    const [header, ...members] = rows;
    return members.map(row => ({
      name: row[0] || '',
      email: row[1] || '',
      phone: row[2] || '',
      dateJoined: row[3] || '',
      status: row[4] || '',
    }));
  } catch (err) {
    logger.error('Failed to fetch all members', err);
    throw new Error('Failed to fetch members');
  }
}

/**
 * Find a member by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getMemberByEmail(email) {
  const members = await getAllMembers();
  return members.find(m => m.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Initialize sheet with headers if empty
 */
export async function initializeSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:E1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['Name', 'Email', 'Phone', 'Date Joined', 'Status']] },
      });
      logger.info('Sheet initialized with headers');
    }
  } catch (err) {
    logger.error('Failed to initialize sheet', err);
    throw new Error('Failed to initialize database');
  }
}
