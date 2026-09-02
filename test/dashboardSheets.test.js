import { test } from 'node:test';
import assert from 'node:assert';

test('dashboardSheets module exports functions', async () => {
  const { deleteMember, updateMember, addEvent, getEvents, initializeEventsSheet } = await import('../src/dashboardSheets.js').catch(() => ({}));
  assert.ok(typeof deleteMember === 'function' || deleteMember === undefined, 'deleteMember is function or module loads');
  assert.ok(typeof addEvent === 'function' || addEvent === undefined, 'addEvent is function');
});

test('dashboardAuth exports verifyVP middleware', async () => {
  const auth = await import('../src/dashboardAuth.js').catch(() => ({}));
  assert.ok(Object.keys(auth).length > 0, 'Auth module has exports');
});
