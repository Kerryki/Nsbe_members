import express from 'express';
import { deleteMember, updateMember, addEvent, getEvents, initializeEventsSheet } from './dashboardSheets.js';
import { getAllMembers } from './googleSheets.js';
import { verifyVP } from './dashboardAuth.js';
import { logger } from './logger.js';

const router = express.Router();

// All dashboard routes require VP verification
router.use(verifyVP);

/**
 * GET /dashboard/api/members - Get all members with optional search/filter
 */
router.get('/members', async (req, res) => {
  try {
    const { search, status } = req.query;
    let members = await getAllMembers();

    if (search) {
      const s = search.toLowerCase();
      members = members.filter(m =>
        m.email.toLowerCase().includes(s) || m.name.toLowerCase().includes(s)
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
 * PUT /dashboard/api/members/:email - Update a member
 */
router.put('/members/:email', async (req, res) => {
  try {
    const { name, phone, status } = req.body;
    await updateMember(req.params.email, { name, phone, status });
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to update member', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

/**
 * DELETE /dashboard/api/members/:email - Delete a member
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
 * GET /dashboard/api/events - Get all events
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
 * POST /dashboard/api/events - Add an event
 */
router.post('/events', async (req, res) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date required' });
    }
    await addEvent({ name, date, description: description || '' });
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to add event', err);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

/**
 * GET /dashboard/api/export - Export members as CSV
 */
router.get('/export', async (req, res) => {
  try {
    const members = await getAllMembers();
    const csv = [
      'Name,Email,Phone,Date Joined,Status',
      ...members.map(m => `"${m.name}","${m.email}","${m.phone}","${m.dateJoined}","${m.status}"`)
    ].join('\n');

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="members.csv"');
    res.send(csv);
  } catch (err) {
    logger.error('Failed to export members', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

export default router;
