const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyFollowup } = require('./admissions-followup-dry-run.cjs');
const now = '2026-09-10T15:00:00Z';
const row = {
  id: 'synthetic-1', firstResponseAt: '2026-09-04T15:00:00Z',
  firstDeliveredAt: '2026-09-04T15:00:00Z', lastDeliveredAt: '2026-09-04T15:00:00Z',
  replyState: 'verified_no_reply', followupCount: 0, nextAction: 'Choose records help',
};
test('first response does not hide later follow-up', () => {
  assert.equal(classifyFollowup(row, now).state, 'draft_followup_1');
});
test('weekend does not count as business days', () => {
  assert.equal(classifyFollowup(row, '2026-09-07T15:00:00Z').state, 'wait');
});
test('unknown reply or missing delivery requires review', () => {
  assert.equal(classifyFollowup({ ...row, replyState: 'unknown' }, now).state, 'review');
  assert.equal(classifyFollowup({ ...row, firstDeliveredAt: null }, now).state, 'review');
});
test('opt-out, duplicate and verified payment stop', () => {
  for (const key of ['optedOut', 'duplicate', 'paymentVerified']) {
    assert.equal(classifyFollowup({ ...row, [key]: true }, now).state, 'stop');
  }
});
test('family pause overrides cadence', () => {
  assert.equal(classifyFollowup({ ...row, pauseUntil: '2026-09-20T15:00:00Z' }, now).state, 'wait');
});
test('second follow-up requires first delivered and spacing', () => {
  const next = { ...row, followupCount: 1, lastDeliveredAt: now };
  assert.equal(classifyFollowup(next, '2026-09-15T15:00:00Z').state, 'draft_followup_2');
  assert.equal(classifyFollowup({ ...next, lastDeliveredAt: '2026-09-14T15:00:00Z' }, '2026-09-15T15:00:00Z').state, 'wait');
});
test('old cases never restart automatically', () => {
  assert.equal(classifyFollowup(row, '2026-10-10T15:00:00Z').state, 'review');
});
test('two delivered followups may become dormant, never send again', () => {
  assert.equal(classifyFollowup({ ...row, followupCount: 2, lastDeliveredAt: '2026-09-15T15:00:00Z' }, '2026-09-18T15:00:00Z').state, 'dormant_candidate');
});
test('output omits input PII and always remains draft-only', () => {
  const out = classifyFollowup({ ...row, email: 'synthetic@example.invalid', name: 'Synthetic' }, now);
  assert.equal(out.action, 'draft_only');
  assert.equal(Object.hasOwn(out, 'email'), false);
  assert.equal(Object.hasOwn(out, 'name'), false);
});
