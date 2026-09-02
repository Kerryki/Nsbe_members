import express from 'express';
import { recordAttendance, getAttendance, getEventStats, initializeAttendanceSheet } from './attendanceSheets.js';
import { getEvents } from './dashboardSheets.js';
import { getAllMembers } from './googleSheets.js';
import { verifyVP } from './dashboardAuth.js';
import { logger } from './logger.js';

const router = express.Router();

/**
 * GET /attendance - Get attendance records, optionally filtered by email
 * Query: ?email=user@example.com
 */
router.get('/records', async (req, res) => {
  try {
    const { email } = req.query;
    const records = await getAttendance(email);
    res.json(records);
  } catch (err) {
    logger.error('Failed to fetch attendance records', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

/**
 * POST /attendance/mark - Record attendance for a member
 * Body: { email, eventName, date, attended }
 */
router.post('/mark', verifyVP, async (req, res) => {
  try {
    const { email, eventName, date, attended } = req.body;
    if (!email || !eventName || !date) {
      return res.status(400).json({ error: 'Email, event name, and date required' });
    }

    await recordAttendance({
      email,
      eventName,
      date,
      attended: attended === true || attended === 'true'
    });
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to record attendance', err);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

/**
 * GET /attendance/stats/:eventName - Get attendance stats for an event
 */
router.get('/stats/:eventName', async (req, res) => {
  try {
    const stats = await getEventStats(req.params.eventName);
    res.json(stats);
  } catch (err) {
    logger.error('Failed to get event stats', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /attendance/form - Get attendance form data (events + members for dropdown)
 */
router.get('/form', async (req, res) => {
  try {
    const events = await getEvents();
    const members = await getAllMembers();
    res.json({
      events: events.map(e => e.name),
      members: members.map(m => ({ email: m.email, name: m.name }))
    });
  } catch (err) {
    logger.error('Failed to get form data', err);
    res.status(500).json({ error: 'Failed to get form data' });
  }
});

export default router;
