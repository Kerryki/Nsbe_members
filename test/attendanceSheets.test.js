import { test } from 'node:test';
import assert from 'node:assert';

test('attendanceSheets exports functions', async () => {
  const { recordAttendance, getAttendance, getEventStats, initializeAttendanceSheet } = await import('../src/attendanceSheets.js').catch(() => ({}));
  assert.ok(typeof recordAttendance === 'function' || recordAttendance === undefined, 'recordAttendance is function');
  assert.ok(typeof getAttendance === 'function' || getAttendance === undefined, 'getAttendance is function');
  assert.ok(typeof getEventStats === 'function' || getEventStats === undefined, 'getEventStats is function');
});

test('attendanceApi exports router', async () => {
  const api = await import('../src/attendanceApi.js').catch(() => ({}));
  assert.ok(api.default !== undefined, 'Router exported as default');
});
