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
 * @param {Object} data - { name, studentId, email, phone, major, dateJoined, status }
 * @throws {Error} If append fails
 */
export async function appendMember(data) {
  try {
    const values = [[data.name, data.studentId, data.email, data.phone, data.major, data.dateJoined, data.status]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:G`,
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
      range: `${SHEET_NAME}!A:G`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    const firstRow = rows[0].map(value => String(value).trim().toLowerCase());
    const hasHeaderRow = firstRow[0] === 'name'
      && firstRow[1] === 'student id'
      && firstRow[2] === 'email';
    const members = hasHeaderRow ? rows.slice(1) : rows;

    return members.map(row => ({
      name: row[0] || '',
      studentId: row[1] || '',
      email: row[2] || '',
      phone: row[3] || '',
      major: row[4] || '',
      dateJoined: row[5] || '',
      status: row[6] || '',
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
    const headers = ['Name', 'Student ID', 'Email', 'Phone', 'Major', 'Date Joined', 'Status'];
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:G1`,
    });

    const currentHeaders = res.data.values?.[0] || [];
    const isCurrentHeaders = headers.every((header, index) => currentHeaders[index] === header)
      && currentHeaders.length === headers.length;

    if (!isCurrentHeaders) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:G1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers] },
      });
      logger.info('Sheet headers initialized or updated');
    }
  } catch (err) {
    logger.error('Failed to initialize sheet', err);
    throw new Error('Failed to initialize database');
  }
}
