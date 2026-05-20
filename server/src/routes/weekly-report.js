/**
 * POST /api/admin/weekly-report
 * Admin-triggered weekly progress digest.
 * Body: { dryRun?: boolean, force?: boolean }
 */
const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { runWeeklyReports } = require('../lib/weeklyReportService');

const router = express.Router();

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const result = await runWeeklyReports({
    dryRun: req.body?.dryRun === true,
    force: req.body?.force === true,
  });
  res.json(result);
});

module.exports = router;
