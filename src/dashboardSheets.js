import { google } from 'googleapis';
import { getClient } from './auth.js';
import { logger } from './logger.js';

const SHEET_ID = process.env.SHEETS_ID;
const MEMBERS_SHEET = 'Members';
const EVENTS_SHEET = 'Events';

if (!SHEET_ID) {
  throw new Error('Missing SHEETS_ID environment variable');
}

const sheets = google.sheets({ version: 'v4', auth: getClient() });

/**
 * Delete a member by email
 * @param {string} email
 */
export async function deleteMember(email) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${MEMBERS_SHEET}!A:G`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) throw new Error('No members found');

    const targetIndex = rows.findIndex(row => (row[2] || '').toLowerCase() === email.toLowerCase());
    if (targetIndex === -1) throw new Error('Member not found');

    // Delete row via batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // ponytail: hardcoded for Members sheet; generalize if multiple sheets
              dimension: 'ROWS',
              startIndex: targetIndex,
              endIndex: targetIndex + 1,
            }
          }
        }]
      }
    });
    logger.info(`Member deleted: ${email}`);
  } catch (err) {
    logger.error(`Failed to delete member ${email}`, err);
    throw new Error('Failed to delete member');
  }
}

/**
 * Update a member by email
 * @param {string} email
 * @param {Object} data - { name, studentId, phone, major, status }
 */
export async function updateMember(email, data) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${MEMBERS_SHEET}!A:G`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) throw new Error('No members found');

    const targetIndex = rows.findIndex(row => (row[2] || '').toLowerCase() === email.toLowerCase());
    if (targetIndex === -1) throw new Error('Member not found');

    const currentRow = rows[targetIndex];
    const updatedRow = [
      data.name || currentRow[0],
      data.studentId !== undefined ? data.studentId : currentRow[1] || '',
      email,
      data.phone !== undefined ? data.phone : currentRow[3] || '',
      data.major !== undefined ? data.major : currentRow[4] || '',
      currentRow[5] || '', // dateJoined unchanged
      data.status || currentRow[6] || 'Active',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${MEMBERS_SHEET}!A${targetIndex + 1}:G${targetIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [updatedRow] },
    });
    logger.info(`Member updated: ${email}`);
  } catch (err) {
    logger.error(`Failed to update member ${email}`, err);
    throw new Error('Failed to update member');
  }
}

/**
 * Add an event
 * @param {Object} data - { name, date, description }
 */
export async function addEvent(data) {
  try {
    const values = [[data.name, data.date, data.description || '']];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${EVENTS_SHEET}!A:C`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    logger.info(`Event added: ${data.name}`);
  } catch (err) {
    logger.error(`Failed to add event ${data.name}`, err);
    throw new Error('Failed to add event');
  }
}

/**
 * Get all events
 * @returns {Promise<Array>}
 */
export async function getEvents() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${EVENTS_SHEET}!A:C`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    const [header, ...events] = rows;
    return events.map(row => ({
      name: row[0] || '',
      date: row[1] || '',
      description: row[2] || '',
    }));
  } catch (err) {
    logger.error('Failed to fetch events', err);
    throw new Error('Failed to fetch events');
  }
}

/**
 * Initialize events sheet with headers if empty
 */
export async function initializeEventsSheet() {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: 'sheets.properties',
    });
    const eventsSheet = spreadsheet.data.sheets?.find(
      sheet => sheet.properties?.title === EVENTS_SHEET,
    );

    if (!eventsSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: { requests: [{ addSheet: { properties: { title: EVENTS_SHEET } } }] },
      });
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${EVENTS_SHEET}!A1:C1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${EVENTS_SHEET}!A1:C1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['Event Name', 'Date', 'Description']] },
      });
      logger.info('Events sheet initialized with headers');
    }
  } catch (err) {
    logger.error('Failed to initialize events sheet', err);
    throw new Error('Failed to initialize events sheet');
  }
}
