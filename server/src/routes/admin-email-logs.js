const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = require('../lib/prisma');
const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));

  const where = {};
  if (kind && kind !== 'all') where.kind = kind;
  if (status && status !== 'all') where.status = status;

  const [logs, kinds, statuses] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
    }),
    prisma.emailLog.groupBy({ by: ['kind'], _count: { kind: true }, orderBy: { kind: 'asc' } }),
    prisma.emailLog.groupBy({ by: ['status'], _count: { status: true }, orderBy: { status: 'asc' } }),
  ]);

  res.json({
    logs,
    filters: {
      kinds: kinds.map((row) => ({ value: row.kind, count: row._count.kind })),
      statuses: statuses.map((row) => ({ value: row.status, count: row._count.status })),
    },
  });
});

module.exports = router;
