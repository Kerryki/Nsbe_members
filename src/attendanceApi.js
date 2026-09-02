import express from 'express';
import { recordAttendance, getAttendance, getEventStats, initializeAttendanceSheet } from './attendanceSheets.js';
import { getEvents } from './dashboardSheets.js';
import { getAllMembers } from './googleSheets.js';
import { verifyVP } from './dashboardAuth.js';
import { logger } from './logger.js';
import { validateAttendance } from './validation.js';

const router = express.Router();

/**
 * GET /records - Get attendance records (VP only)
 * Query: ?email=user@example.com (optional email filter)
 */
router.get('/records', verifyVP, async (req, res) => {
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
 * POST /mark - Record attendance for a member (VP only)
 * Body: { email, eventName, date, attended }
 */
router.post('/mark', verifyVP, async (req, res) => {
  try {
    const validated = validateAttendance({
      email: req.body.email,
      eventName: req.body.eventName,
      date: req.body.date,
      attended: req.body.attended === true || req.body.attended === 'true'
    });

    await recordAttendance(validated);
    res.json({ success: true });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Failed to record attendance', err);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

/**
 * GET /stats/:eventName - Get attendance stats for a specific event
 */
router.get('/stats/:eventName', async (req, res) => {
  try {
    const eventName = req.params.eventName?.trim();
    if (!eventName || eventName.length === 0 || eventName.length > 255) {
      return res.status(400).json({ error: 'Invalid event name' });
    }

    const stats = await getEventStats(eventName);
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
