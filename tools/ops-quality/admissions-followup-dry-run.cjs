// Pure draft queue classification. No network, database, files, or send actions.
const DAY = 86400000;
const STOP = new Set(['rejected', 'withdrawn', 'dormant', 'closed']);

function validDate(value) {
  const date = typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function businessDaysSince(start, now) {
  let count = 0;
  for (let day = new Date(start.getTime() + DAY); day <= now; day = new Date(day.getTime() + DAY)) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) count++;
  }
  return count;
}

// Dates must be timezone-qualified. The caller supplies verified event evidence;
// firstResponseAt/lastContactedAt alone do not prove delivery or lack of reply.
function classifyFollowup(row, nowValue) {
  const now = validDate(nowValue);
  if (!now) throw new Error('A valid explicit time anchor is required');
  const result = (state, reason) => ({ id: row.id, state, reason, action: 'draft_only' });
  if (row.optedOut || row.duplicate || STOP.has(row.status) || row.paymentVerified) {
    return result('stop', 'Closed, duplicate, opted out, or payment verified');
  }
  const pause = validDate(row.pauseUntil);
  if (row.pauseUntil && !pause) return result('review', 'Invalid family pause date');
  if (pause && pause > now) return result('wait', 'Family pause or records ETA');
  if (row.replyState !== 'verified_no_reply') return result('review', 'Reply state is unknown or a reply needs review');
  const first = validDate(row.firstDeliveredAt);
  const last = validDate(row.lastDeliveredAt);
  if (!first || !last || first > last || last > now) return result('review', 'Verified delivery dates missing or inconsistent');
  if (!row.nextAction) return result('review', 'Choose one family next action');
  if (![0, 1, 2].includes(row.followupCount)) return result('review', 'Confirm follow-up count');
  if (now - last >= 30 * DAY) return result('review', 'Old inquiry needs human relevance check before recontact');
  if (row.followupCount === 2) {
    return now - first >= 14 * DAY
      ? result('dormant_candidate', 'Two verified follow-ups; human may pause case')
      : result('wait', 'Final follow-up already delivered');
  }
  const age = businessDaysSince(first, now);
  if (row.followupCount === 0 && age >= 3) return result('draft_followup_1', 'First follow-up due');
  if (row.followupCount === 1 && age >= 7 && businessDaysSince(last, now) >= 3) {
    return result('draft_followup_2', 'Final follow-up due');
  }
  return result('wait', 'Not due');
}

module.exports = { classifyFollowup };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const { now, cases } = JSON.parse(input);
      if (!Array.isArray(cases)) throw new Error('Expected cases array');
      process.stdout.write(JSON.stringify({ dryRun: true, results: cases.map(row => classifyFollowup(row, now)) }, null, 2) + '\n');
    } catch (error) {
      process.stderr.write(`Invalid input: ${error.message}\n`);
      process.exitCode = 1;
    }
  });
}
