import express from 'express';
import { deleteMember, updateMember, addEvent, getEvents } from './dashboardSheets.js';
import { appendMember, getAllMembers } from './googleSheets.js';
import { getClient } from './auth.js';
import { verifyVP } from './dashboardAuth.js';
import { logger } from './logger.js';
import { validateMember, validateMemberUpdate, validateEvent } from './validation.js';
import { toCSV } from './csvUtils.js';

const router = express.Router();

// All dashboard routes require VP verification
router.use(verifyVP);

/**
 * GET /dashboard/api/members - Get all members with optional search/filter
 */
/**
 * GET /members - Get all members with optional search/filter
 * Query params:
 *   - search: filter by email, name, student ID, or major
 *   - status: filter by status (Active, Inactive, Pending)
 */
router.get('/members', async (req, res) => {
  try {
    const { search, status } = req.query;
    let members = await getAllMembers();

    if (search) {
      const s = search.toLowerCase();
      members = members.filter(m =>
        m.email.toLowerCase().includes(s) ||
        m.name.toLowerCase().includes(s) ||
        m.studentId.toLowerCase().includes(s) ||
        m.major.toLowerCase().includes(s)
      );
    }

    if (status) {
      members = members.filter(m => m.status === status);
    }

    res.json(members);
  } catch (err) {
    logger.error('Failed to fetch members for dashboard', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * POST /members - Add a member from the dashboard
 */
router.post('/members', async (req, res) => {
  try {
    const client = getClient();
    if (!client.credentials.access_token && !client.credentials.refresh_token) {
      return res.status(503).json({ error: 'Google Sheets authorization required. Visit /auth first.' });
    }

    const validated = validateMember({
      ...req.body,
      dateJoined: req.body.dateJoined || new Date().toISOString().split('T')[0],
    });
    await appendMember(validated);
    res.json({ success: true });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Failed to add member from dashboard', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

/**
 * PUT /members/:email - Update a member
 * Body: { name?, studentId?, phone?, major?, status? } - partial update allowed
 */
router.put('/members/:email', async (req, res) => {
  try {
    const { name, studentId, phone, major, status } = req.body;
    // Validate update data
    const validated = validateMemberUpdate({
      name,
      studentId,
      email: req.params.email,
      phone,
      major,
      status,
    });
    await updateMember(req.params.email, validated);
    res.json({ success: true });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Failed to update member', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

/**
 * DELETE /members/:email - Delete a member by email
 */
router.delete('/members/:email', async (req, res) => {
  try {
    await deleteMember(req.params.email);
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to delete member', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

/**
 * GET /events - Get all events
 */
router.get('/events', async (req, res) => {
  try {
    const events = await getEvents();
    res.json(events);
  } catch (err) {
    logger.error('Failed to fetch events', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /events - Add an event
 * Body: { name, date (YYYY-MM-DD), description? }
 */
router.post('/events', async (req, res) => {
  try {
    const { name, date, description } = req.body;
    // Validate event data
    const validated = validateEvent({ name, date, description });
    await addEvent(validated);
    res.json({ success: true });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Failed to add event', err);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

/**
 * GET /export - Export all members as CSV file
 */
router.get('/export', async (req, res) => {
  try {
    const members = await getAllMembers();
    const csv = toCSV(members, ['name', 'studentId', 'email', 'phone', 'major', 'dateJoined', 'status']);

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="members.csv"');
    res.send(csv);
  } catch (err) {
    logger.error('Failed to export members', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

export default router;
