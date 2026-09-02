import { google } from 'googleapis';
import { getClient } from './auth.js';
import { logger } from './logger.js';

const SHEET_ID = process.env.SHEETS_ID;
const NEWSLETTER_SHEET = 'Newsletters';
const JOBS_SHEET = 'JobPostings';

if (!SHEET_ID) {
  throw new Error('Missing SHEETS_ID environment variable');
}

const sheets = google.sheets({ version: 'v4', auth: getClient() });

/**
 * Add a newsletter entry
 * @param {Object} data - { subject, content, sentDate, recipientCount }
 */
export async function addNewsletter(data) {
  try {
    const values = [[data.subject, data.content, data.sentDate, data.recipientCount || 0]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${NEWSLETTER_SHEET}!A:D`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    logger.info(`Newsletter added: ${data.subject}`);
  } catch (err) {
    logger.error(`Failed to add newsletter ${data.subject}`, err);
    throw new Error('Failed to add newsletter');
  }
}

/**
 * Get all newsletters
 * @returns {Promise<Array>}
 */
export async function getNewsletters() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${NEWSLETTER_SHEET}!A:D`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    const [header, ...records] = rows;
    return records.map(row => ({
      subject: row[0] || '',
      content: row[1] || '',
      sentDate: row[2] || '',
      recipientCount: parseInt(row[3] || '0', 10),
    }));
  } catch (err) {
    logger.error('Failed to fetch newsletters', err);
    throw new Error('Failed to fetch newsletters');
  }
}

/**
 * Add a job posting
 * @param {Object} data - { title, description, tags, postedDate }
 */
export async function addJobPosting(data) {
  try {
    const values = [[data.title, data.description, data.tags || '', data.postedDate]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${JOBS_SHEET}!A:D`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    logger.info(`Job posting added: ${data.title}`);
  } catch (err) {
    logger.error(`Failed to add job posting ${data.title}`, err);
    throw new Error('Failed to add job posting');
  }
}

/**
 * Get all job postings, optionally filtered by tag
 * @param {string} tag - Optional tag filter
 * @returns {Promise<Array>}
 */
export async function getJobPostings(tag) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${JOBS_SHEET}!A:D`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    const [header, ...records] = rows;
    const jobs = records.map(row => ({
      title: row[0] || '',
      description: row[1] || '',
      tags: (row[2] || '').split(',').map(t => t.trim()).filter(t => t),
      postedDate: row[3] || '',
    }));

    if (tag) {
      return jobs.filter(j => j.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }
    return jobs;
  } catch (err) {
    logger.error('Failed to fetch job postings', err);
    throw new Error('Failed to fetch job postings');
  }
}

/**
 * Initialize newsletter sheet with headers
 */
export async function initializeNewsletterSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${NEWSLETTER_SHEET}!A1:D1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${NEWSLETTER_SHEET}!A1:D1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['Subject', 'Content', 'Sent Date', 'Recipient Count']] },
      });
      logger.info('Newsletter sheet initialized');
    }
  } catch (err) {
    logger.error('Failed to initialize newsletter sheet', err);
    // Don't throw; init failure is non-critical
  }
}

/**
 * Initialize job postings sheet with headers
 */
export async function initializeJobsSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${JOBS_SHEET}!A1:D1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${JOBS_SHEET}!A1:D1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['Title', 'Description', 'Tags', 'Posted Date']] },
      });
      logger.info('Jobs sheet initialized');
    }
  } catch (err) {
    logger.error('Failed to initialize jobs sheet', err);
    // Don't throw; init failure is non-critical
  }
}
