import { google } from 'googleapis';
import { getClient } from './auth.js';

const SHEET_ID = process.env.SHEETS_ID;
const SHEET_NAME = 'Members';

if (!SHEET_ID) {
  throw new Error('Missing SHEETS_ID environment variable');
}

const sheets = google.sheets({ version: 'v4', auth: getClient() });

export async function appendMember(data) {
  // data = { name, email, phone, dateJoined, status }
  const values = [[data.name, data.email, data.phone, data.dateJoined, data.status]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:E`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

export async function getAllMembers() {
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
}

export async function getMemberByEmail(email) {
  const members = await getAllMembers();
  return members.find(m => m.email.toLowerCase() === email.toLowerCase());
}

export async function initializeSheet() {
  // Create header row if empty
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
  }
}
