import express from 'express';
import { addNewsletter, getNewsletters, addJobPosting, getJobPostings } from './newsletterSheets.js';
import { getAllMembers } from './googleSheets.js';
import { verifyVP } from './dashboardAuth.js';
import { logger } from './logger.js';
import { z } from 'zod';

const router = express.Router();

const NewsletterSchema = z.object({
  subject: z.string().min(1, 'Subject required').max(255),
  content: z.string().min(1, 'Content required').max(5000),
  sentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  recipientCount: z.number().int().nonnegative().optional().default(0),
});

const JobSchema = z.object({
  title: z.string().min(1, 'Title required').max(255),
  description: z.string().min(1, 'Description required').max(2000),
  tags: z.string().max(500).optional().default(''),
  postedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

/**
 * GET /newsletters - Get all newsletters (public)
 */
router.get('/newsletters', async (req, res) => {
  try {
    const newsletters = await getNewsletters();
    res.json(newsletters);
  } catch (err) {
    logger.error('Failed to fetch newsletters', err);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

/**
 * POST /newsletters - Add a newsletter (VP only)
 * Body: { subject, content, sentDate, recipientCount? }
 */
router.post('/newsletters', verifyVP, async (req, res) => {
  try {
    const validated = NewsletterSchema.parse(req.body);
    await addNewsletter(validated);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Failed to add newsletter', err);
    res.status(500).json({ error: 'Failed to add newsletter' });
  }
});

/**
 * GET /jobs - Get all job postings, optionally filtered by tag
 * Query: ?tag=backend (optional, max 50 chars)
 */
router.get('/jobs', async (req, res) => {
  try {
    let { tag } = req.query;

    // Validate tag if provided
    if (tag) {
      tag = String(tag).trim();
      if (tag.length === 0 || tag.length > 50) {
        return res.status(400).json({ error: 'Invalid tag' });
      }
    }

    const jobs = await getJobPostings(tag);
    res.json(jobs);
  } catch (err) {
    logger.error('Failed to fetch job postings', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * POST /jobs - Add a job posting (VP only)
 * Body: { title, description, tags?, postedDate }
 */
router.post('/jobs', verifyVP, async (req, res) => {
  try {
    const validated = JobSchema.parse(req.body);
    await addJobPosting(validated);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Failed to add job posting', err);
    res.status(500).json({ error: 'Failed to add job posting' });
  }
});

/**
 * GET /member-list - Get member emails for newsletter subscriptions
 * Returns: { memberEmails: [email1, email2, ...] }
 */
router.get('/member-list', verifyVP, async (req, res) => {
  try {
    const members = await getAllMembers();
    const memberEmails = members
      .filter(m => m.status === 'Active')
      .map(m => m.email);

    res.json({ memberEmails });
  } catch (err) {
    logger.error('Failed to fetch member list', err);
    res.status(500).json({ error: 'Failed to fetch member list' });
  }
});

export default router;
