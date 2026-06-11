/**
 * POST /api/admin/weekly-report
 * Admin-triggered weekly progress digest.
 * Body: { dryRun?: boolean, force?: boolean, studentIds?: string[] }
 *
 * Intended flow (admin review before send):
 *   1. POST { dryRun: true }  → per-student draft payloads, nothing sent.
 *   2. Admin reviews drafts in /admin/weekly-report.
 *   3. POST { studentIds: [...] } → sends only the approved students.
 */
const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { runWeeklyReports } = require('../lib/weeklyReportService');

const router = express.Router();

function parseWeeklyReportRequest(body = {}) {
  const dryRun = body?.dryRun === true;
  if (dryRun) return { ok: true, dryRun: true, force: false, studentIds: null };

  if (!Array.isArray(body?.studentIds)) {
    return { ok: false, status: 400, error: 'Select at least one student before sending weekly reports.' };
  }

  const studentIds = [...new Set(body.studentIds.map((id) => String(id || '').trim()).filter(Boolean))];
  if (studentIds.length === 0) {
    return { ok: false, status: 400, error: 'Select at least one student before sending weekly reports.' };
  }

  const force = body?.force === true && body?.confirmForce === 'resend_this_week';
  return { ok: true, dryRun: false, force, studentIds };
}

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = parseWeeklyReportRequest(req.body || {});
    if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

    const result = await runWeeklyReports({
      dryRun: parsed.dryRun,
      force: parsed.force,
      studentIds: parsed.studentIds,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
module.exports.parseWeeklyReportRequest = parseWeeklyReportRequest;
