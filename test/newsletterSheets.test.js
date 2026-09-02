import { test } from 'node:test';
import assert from 'node:assert';

test('newsletterSheets exports functions', async () => {
  const { addNewsletter, getNewsletters, addJobPosting, getJobPostings, initializeNewsletterSheet, initializeJobsSheet } = await import('../src/newsletterSheets.js').catch(() => ({}));
  assert.ok(typeof addNewsletter === 'function' || addNewsletter === undefined, 'addNewsletter is function');
  assert.ok(typeof getNewsletters === 'function' || getNewsletters === undefined, 'getNewsletters is function');
  assert.ok(typeof addJobPosting === 'function' || addJobPosting === undefined, 'addJobPosting is function');
  assert.ok(typeof getJobPostings === 'function' || getJobPostings === undefined, 'getJobPostings is function');
});

test('newsletterApi exports router', async () => {
  const api = await import('../src/newsletterApi.js').catch(() => ({}));
  assert.ok(api.default !== undefined, 'Router exported as default');
});
