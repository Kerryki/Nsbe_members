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
 * @param {Object} data - { title, description, tags, link, postedDate, deadline }
 */
export async function addJobPosting(data) {
  try {
    const values = [[data.title, data.description, data.tags || '', data.link, data.postedDate, data.deadline]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${JOBS_SHEET}!A:F`,
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
 * Get all job postings, optionally filtered by position and tag
 * @param {string} position - Optional title/position filter
 * @param {string} tag - Optional tag filter
 * @returns {Promise<Array>}
 */
export async function getJobPostings(position, tag) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${JOBS_SHEET}!A:F`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return [];

    const [header, ...records] = rows;
    const isLegacySchema = header[3] === 'Posted Date';
    let jobs = records.map(row => ({
      title: row[0] || '',
      description: row[1] || '',
      tags: (row[2] || '').split(',').map(t => t.trim()).filter(t => t),
      link: isLegacySchema ? '' : row[3] || '',
      postedDate: isLegacySchema ? row[3] || '' : row[4] || '',
      deadline: isLegacySchema ? '' : row[5] || '',
    }));

    if (position) {
      const normalizedPosition = position.toLowerCase();
      jobs = jobs.filter(job => job.title.toLowerCase().includes(normalizedPosition));
    }
    if (tag) {
      const normalizedTag = tag.toLowerCase();
      return jobs.filter(job => job.tags.some(item => item.toLowerCase().includes(normalizedTag)));
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
      range: `${JOBS_SHEET}!A:F`,
    });

    const headers = ['Title', 'Description', 'Tags', 'Link', 'Posted Date', 'Deadline'];
    const currentHeaders = res.data.values?.[0] || [];
    const headersMatch = headers.every((header, index) => currentHeaders[index] === header)
      && currentHeaders.length === headers.length;
    const legacyHeaders = ['Title', 'Description', 'Tags', 'Posted Date'];
    const isLegacySchema = legacyHeaders.every((header, index) => currentHeaders[index] === header)
      && currentHeaders.length === legacyHeaders.length;

    if (isLegacySchema) {
      const migratedRows = (res.data.values || []).slice(1).map(row => [
        row[0] || '',
        row[1] || '',
        row[2] || '',
        '',
        row[3] || 'N/A',
        'N/A',
      ]);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${JOBS_SHEET}!A1:F${migratedRows.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers, ...migratedRows] },
      });
      logger.info('Legacy jobs sheet migrated to the current schema');
    } else if (!headersMatch) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${JOBS_SHEET}!A1:F1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers] },
      });
      logger.info('Jobs sheet headers initialized or updated');
    }
  } catch (err) {
    logger.error('Failed to initialize jobs sheet', err);
    // Don't throw; init failure is non-critical
  }
}
