import test from 'node:test';
import assert from 'node:assert/strict';
import { transition, due, canReclaim, STATES, shouldRetry } from '../src/job-state.mjs';
import { oneDayWindows, mergeDailyMetrics } from '../src/insights.mjs';

test('cannot replay publication after published', () => {
  assert.equal(transition('SCHEDULED','CLAIMED'), STATES.CLAIMED);
  assert.throws(()=>transition('PUBLISHED','PUBLISHING'), /Invalid/);
  assert.throws(()=>transition('PUBLISHING','PUBLISHING'), /Invalid/);
});
test('due time and lease expiry are UTC-safe', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  assert.ok(due({status:'SCHEDULED',scheduledAt:'2026-10-09T11:00:00Z'},now));
  assert.ok(canReclaim({status:'CLAIMED',leaseUntil:'2026-10-09T11:59:59Z'},now));
  assert.equal(due({status:'CANCELLED',scheduledAt:'2026-10-09T11:00:00Z'},now),false);
});
test('permanent bad parameter not retryable', () => {
  assert.equal(shouldRetry({status:400},1),false);
  assert.equal(shouldRetry({status:429},1),true);
});
test('one-day time windows prevent aggregating a five-day total', () => {
  const windows=oneDayWindows('2026-10-09',2);
  assert.equal(windows.length,2);
  assert.equal(windows[0].until-windows[0].since,86400);
  assert.deepEqual(mergeDailyMetrics({reach:10},{views:20}),{reach:10,views:20});
});
