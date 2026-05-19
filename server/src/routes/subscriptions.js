const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Admin subscriptions management — T-106 / T-107.
 *
 * GET    /api/subscriptions?status=active|past_due|cancelled|refunded|all
 *   → list every subscription with linked student (if any) and purchaser email.
 * PATCH  /api/subscriptions/:id  body: { studentId: string | null }
 *   → manually link/unlink a Subscription to a Student (T-107). The webhook then
 *     knows whose access flag to toggle on payment events.
 */

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const status = String(req.query.status || 'all');
  const where = status === 'all' ? {} : { status };

  const subs = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          name: true,
          account: { select: { email: true, isActive: true, softLocked: true, lockReason: true } },
        },
      },
    },
  });

  const rows = subs.map((s) => ({
    id: s.id,
    purchaserEmail: s.purchaserEmail,
    planType: s.planType,
    maxStudents: s.maxStudents,
    status: s.status,
    paymentFailureCount: s.paymentFailureCount,
    currentPeriodEnd: s.currentPeriodEnd,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    amountTotal: s.amountTotal,
    stripeCustomerId: s.stripeCustomerId,
    stripeSubscriptionId: s.stripeSubscriptionId,
    stripeCheckoutSessionId: s.stripeCheckoutSessionId,
    createdAt: s.createdAt,
    student: s.student
      ? {
          id: s.student.id,
          studentCode: s.student.studentCode,
          name: s.student.name,
          loginEmail: s.student.account?.email || null,
          isActive: s.student.account?.isActive ?? null,
          softLocked: s.student.account?.softLocked ?? null,
          lockReason: s.student.account?.lockReason || '',
        }
      : null,
  }));

  // Summary counts for the page header
  const summary = subs.reduce(
    (acc, s) => {
      acc.total += 1;
      acc.byStatus[s.status] = (acc.byStatus[s.status] || 0) + 1;
      if (!s.studentId) acc.unlinked += 1;
      return acc;
    },
    { total: 0, byStatus: {}, unlinked: 0 }
  );

  res.json({ subscriptions: rows, summary });
});

const patchSchema = z.object({
  studentId: z.string().nullable(),
});

router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', detail: parsed.error.format() });
  }
  const { studentId } = parsed.data;

  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) return res.status(404).json({ error: 'Student not found' });
  }

  const updated = await prisma.subscription.update({
    where: { id: req.params.id },
    data: { studentId: studentId || null },
    include: {
      student: { select: { id: true, studentCode: true, name: true } },
    },
  });

  res.json({ subscription: updated });
});

module.exports = router;
