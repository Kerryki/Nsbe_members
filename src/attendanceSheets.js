import { google } from 'googleapis';
import { getClient } from './auth.js';
import { logger } from './logger.js';

const SHEET_ID = process.env.SHEETS_ID;
const ATTENDANCE_SHEET = 'Attendance';

if (!SHEET_ID) {
  throw new Error('Missing SHEETS_ID environment variable');
}

const sheets = google.sheets({ version: 'v4', auth: getClient() });

/**
 * Record attendance for a member at an event
 * @param {Object} data - { email, eventName, date, attended }
 */
export async function recordAttendance(data) {
  try {
    const values = [[data.email, data.eventName, data.date, data.attended ? 'Yes' : 'No']];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${ATTENDANCE_SHEET}!A:D`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    logger.info(`Attendance recorded: ${data.email} at ${data.eventName}`);
  } catch (err) {
    logger.error(`Failed to record attendance for ${data.email}`, err);
    throw new Error('Failed to record attendance');
  }
}

/**
 * Get attendance records, optionally filtered by email
 * @param {string} email - Optional email filter
 * @returns {Promise<Array>} Attendance records
 */
export async function getAttendance(email) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ATTENDANCE_SHEET}!A:D`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    const [header, ...records] = rows;
    const mapped = records.map(row => ({
      email: row[0] || '',
      eventName: row[1] || '',
      date: row[2] || '',
      attended: row[3]?.toLowerCase() === 'yes',
    }));

    if (email) {
      return mapped.filter(r => r.email.toLowerCase() === email.toLowerCase());
    }
    return mapped;
  } catch (err) {
    logger.error('Failed to fetch attendance', err);
    throw new Error('Failed to fetch attendance');
  }
}

/**
 * Get attendance stats for a specific event
 * @param {string} eventName
 * @returns {Promise<Object>} { total, attended, percentage }
 */
export async function getEventStats(eventName) {
  try {
    const records = await getAttendance();
    const eventRecords = records.filter(r => r.eventName.toLowerCase() === eventName.toLowerCase());

    if (eventRecords.length === 0) {
      return { total: 0, attended: 0, percentage: 0 };
    }

    const attended = eventRecords.filter(r => r.attended).length;
    const total = eventRecords.length;

    return {
      total,
      attended,
      percentage: Math.round((attended / total) * 100)
    };
  } catch (err) {
    logger.error('Failed to get event stats', err);
    throw new Error('Failed to get event stats');
  }
}

/**
 * Initialize attendance sheet with headers
 */
export async function initializeAttendanceSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ATTENDANCE_SHEET}!A1:D1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${ATTENDANCE_SHEET}!A1:D1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['Email', 'Event Name', 'Date', 'Attended']] },
      });
      logger.info('Attendance sheet initialized with headers');
    }
  } catch (err) {
    logger.error('Failed to initialize attendance sheet', err);
    throw new Error('Failed to initialize attendance sheet');
  }
}
