const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendNewApplicationAlert, sendWelcomeEmail } = require('../lib/mailer');
const {
  parentLoginEmailForStudentEmail,
  studentLoginEmailForName,
} = require('../lib/parentCredentials');

const prisma = require('../lib/prisma');
const router = express.Router();

const MANUAL_PAYMENT_PLANS = {
  self_paced_monthly: { label: 'Self-Paced Founders', amountCents: 4900, months: 1 },
  self_paced_annual: { label: 'Self-Paced Founders Annual', amountCents: 49900, months: 12 },
  guided_monthly: { label: 'Guided', amountCents: 14900, months: 1 },
  premium_monthly: { label: 'Premium / College Pathway', amountCents: 29900, months: 1 },
};

const MANUAL_PAYMENT_METHODS = new Set([
  'manual_stripe_invoice',
  'manual_stripe_payment_link',
  'stripe_dashboard_invoice',
  'stripe_dashboard_payment_link',
]);

async function recordEmailLog({ kind, recipient, studentId, result }) {
  await prisma.emailLog.create({
    data: {
      kind,
      recipient,
      studentId: studentId || null,
      providerId: result?.id || null,
      status: result?.ok ? 'sent' : (result?.skipped ? 'skipped' : 'error'),
      error: result?.error || result?.reason || '',
    },
  }).catch(() => null);
}

async function uniqueStudentLoginEmail(studentName) {
  const base = studentLoginEmailForName(studentName);
  if (!base) return null;
  const [local, domain] = base.split('@');
  for (let i = 0; i < 50; i += 1) {
    const email = i === 0 ? base : `${local}.${i + 1}@${domain}`;
    const existing = await prisma.studentAccount.findUnique({ where: { email } });
    if (!existing) return email;
  }
  return `${local}.${crypto.randomBytes(2).toString('hex')}@${domain}`;
}

function tempPassword(prefix) {
  return `${prefix}-${crypto.randomBytes(9).toString('base64url')}`;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function money(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function normalizeReference(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

function manualCheckoutSessionId(reference) {
  return `manual:${reference}`;
}

function appendAdminNote(existing, line) {
  const clean = String(existing || '').trim();
  return clean ? `${clean}\n${line}` : line;
}

async function findStudentForApplication(app) {
  return prisma.student.findFirst({
    where: {
      parentEmail: { equals: app.parentEmail, mode: 'insensitive' },
      name: { equals: app.studentName, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, studentCode: true },
  });
}

async function applicationEnrollmentState(app) {
  const student = await prisma.student.findFirst({
    where: {
      parentEmail: { equals: app.parentEmail, mode: 'insensitive' },
      name: { equals: app.studentName, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      account: { select: { email: true, isActive: true, softLocked: true, lockReason: true } },
      parentAccounts: { select: { email: true }, take: 1 },
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });

  const candidateEmails = [app.parentEmail];
  if (student?.parentAccounts?.[0]?.email) candidateEmails.push(student.parentAccounts[0].email);
  if (student?.account?.email) {
    const parentLogin = parentLoginEmailForStudentEmail(student.account.email);
    if (parentLogin) candidateEmails.push(parentLogin);
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      OR: [
        { purchaserEmail: { in: [...new Set(candidateEmails)] } },
        ...(student?.id ? [{ studentId: student.id }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const activeStatuses = new Set(['active', 'trialing', 'paid']);
  const activeLinked = subscriptions.find((sub) => sub.studentId && student?.id && sub.studentId === student.id && activeStatuses.has(sub.status));
  const activeUnlinked = subscriptions.find((sub) => !sub.studentId && activeStatuses.has(sub.status));
  const latestSub = subscriptions[0] || null;

  let code = app.status;
  let label = app.status;
  let action = '';
  if (app.status === 'rejected') {
    code = 'rejected';
    label = 'Rejected';
    action = 'No action';
  } else if (app.status === 'pending') {
    code = 'pending_review';
    label = 'Pending review';
    action = 'Review application';
  } else if (!student && activeUnlinked) {
    code = 'paid_unlinked';
    label = 'Paid, needs account activation';
    action = 'Activate account and link payment';
  } else if (!app.accountsCreated || !student?.account || !student?.parentAccounts?.length) {
    code = 'approved_unactivated';
    label = 'Approved, accounts not created';
    action = 'Create accounts';
  } else if (activeLinked) {
    code = 'active_paid';
    label = 'Active paid enrollment';
    action = 'Monitor progress';
  } else if (activeUnlinked) {
    code = 'paid_unlinked';
    label = 'Paid, needs payment link';
    action = 'Link payment';
  } else {
    code = 'accounts_created_unpaid';
    label = 'Accounts created, unpaid';
    action = 'Parent completes payment';
  }

  return {
    code,
    label,
    action,
    studentId: student?.id || null,
    studentEmail: student?.account?.email || null,
    parentLoginEmail: student?.parentAccounts?.[0]?.email || null,
    subscriptionId: (activeLinked || activeUnlinked || latestSub)?.id || null,
    subscriptionStatus: (activeLinked || activeUnlinked || latestSub)?.status || null,
    paid: !!activeLinked,
    paidUnlinked: !!activeUnlinked,
  };
}

async function linkExistingSubscriptionsForApplication({ app, studentId, parentLoginEmail }) {
  const emails = [...new Set([app.parentEmail, parentLoginEmail].filter(Boolean))];
  if (!emails.length) return [];
  const updated = await prisma.subscription.updateMany({
    where: {
      studentId: null,
      purchaserEmail: { in: emails },
      status: { in: ['active', 'trialing', 'paid'] },
    },
    data: { studentId },
  });
  return updated.count;
}

/**
 * POST /api/applications/:id/manual-payment  — admin only
 * Records a manually verified Stripe Dashboard invoice/payment-link payment.
 *
 * This is the official v1 sales mode while automated checkout/webhook launch is
 * gated: apply/consult -> admin review -> manual Stripe payment -> record paid
 * -> activate/link accounts.
 */
router.post('/:id/manual-payment', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'approved') {
    return res.status(400).json({ error: 'Application must be approved after path review before payment can be recorded.' });
  }

  const planType = String(req.body?.planType || '').trim();
  const plan = MANUAL_PAYMENT_PLANS[planType];
  if (!plan) {
    return res.status(400).json({ error: `planType must be one of: ${Object.keys(MANUAL_PAYMENT_PLANS).join(', ')}` });
  }

  const amountCents = req.body?.amountCents == null ? plan.amountCents : Number(req.body.amountCents);
  if (!Number.isInteger(amountCents) || amountCents !== plan.amountCents) {
    return res.status(400).json({ error: `${plan.label} manual payment amount must be ${money(plan.amountCents)}.` });
  }

  const paymentMethod = String(req.body?.paymentMethod || 'manual_stripe_invoice').trim();
  if (!MANUAL_PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(400).json({ error: `paymentMethod must be one of: ${[...MANUAL_PAYMENT_METHODS].join(', ')}` });
  }

  const paymentReference = normalizeReference(req.body?.paymentReference);
  if (!paymentReference) {
    return res.status(400).json({ error: 'paymentReference is required. Use the Stripe invoice, payment link, receipt, or dashboard reference.' });
  }

  const checkoutSessionId = manualCheckoutSessionId(paymentReference);
  const existing = await prisma.subscription.findUnique({
    where: { stripeCheckoutSessionId: checkoutSessionId },
    select: { id: true, purchaserEmail: true, status: true },
  });
  if (existing) {
    return res.status(409).json({ error: 'This manual payment reference is already recorded.', subscriptionId: existing.id });
  }

  const student = await findStudentForApplication(app);
  const now = new Date();
  const adminEmail = req.auth?.email || 'admin';
  const note = normalizeReference(req.body?.note);
  const auditLine = [
    `Manual Payment Verified (${now.toISOString().slice(0, 10)})`,
    `plan=${planType}`,
    `amount=${money(amountCents)}`,
    `method=${paymentMethod}`,
    `reference=${paymentReference}`,
    `verifiedBy=${adminEmail}`,
    note ? `note=${note}` : '',
  ].filter(Boolean).join('; ');

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        purchaserEmail: app.parentEmail,
        planType,
        maxStudents: 1,
        status: 'active',
        amountTotal: amountCents,
        currentPeriodEnd: addMonths(now, plan.months),
        stripeCheckoutSessionId: checkoutSessionId,
        studentId: student?.id || null,
      },
    });

    const updatedApp = await tx.application.update({
      where: { id: app.id },
      data: { adminNotes: appendAdminNote(app.adminNotes, `${auditLine}; subscriptionId=${subscription.id}`) },
    });

    if (student?.id) {
      await tx.auditLog.create({
        data: {
          action: 'manual_payment_verified',
          studentId: student.id,
          actorRole: 'admin',
          actorEmail: adminEmail,
        },
      }).catch(() => null);
    }

    return { subscription, updatedApp };
  });

  const enrollmentState = await applicationEnrollmentState(result.updatedApp);
  res.status(201).json({
    ok: true,
    subscription: {
      id: result.subscription.id,
      purchaserEmail: result.subscription.purchaserEmail,
      planType: result.subscription.planType,
      status: result.subscription.status,
      amountTotal: result.subscription.amountTotal,
      currentPeriodEnd: result.subscription.currentPeriodEnd,
      studentId: result.subscription.studentId,
      stripeCheckoutSessionId: result.subscription.stripeCheckoutSessionId,
    },
    linkedToStudent: !!result.subscription.studentId,
    enrollmentState,
  });
});

// POST /api/applications  — public, no auth required
router.post('/', async (req, res) => {
  const { studentName, dob, gradeLevel, parentName, parentEmail, phone, notes,
          currentSchool, targetUniversities, preferredLanguage } = req.body || {};
  const missing = [];
  if (!studentName?.trim()) missing.push('studentName');
  if (!dob?.trim()) missing.push('dob');
  if (!gradeLevel?.trim()) missing.push('gradeLevel');
  if (!parentName?.trim()) missing.push('parentName');
  if (!parentEmail?.trim()) missing.push('parentEmail');
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(parentEmail.trim())) return res.status(400).json({ error: 'Invalid parent email' });

  const app = await prisma.application.create({
    data: {
      studentName: studentName.trim(),
      dob: dob.trim(),
      gradeLevel: gradeLevel.trim(),
      currentSchool: (currentSchool || '').trim(),
      targetUniversities: (targetUniversities || '').trim(),
      preferredLanguage: preferredLanguage === 'zh' ? 'zh' : 'en',
      parentName: parentName.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      phone: (phone || '').trim(),
      notes: (notes || '').trim(),
    },
  });

  // Fire-and-forget: notify admin of new application
  sendNewApplicationAlert({
    studentName: app.studentName,
    gradeLevel: app.gradeLevel,
    parentName: app.parentName,
    parentEmail: app.parentEmail,
    currentSchool: app.currentSchool,
    targetUniversities: app.targetUniversities,
    preferredLanguage: app.preferredLanguage,
    appId: app.id,
  });

  res.status(201).json({ ok: true, id: app.id });
});

// GET /api/applications  — admin only
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const status = req.query.status;
  const where = status ? { status } : {};
  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const enriched = await Promise.all(apps.map(async (app) => ({
    ...app,
    enrollmentState: await applicationEnrollmentState(app),
  })));
  res.json(enriched);
});

// PATCH /api/applications/:id  — update status, rejectionReason, or adminNotes
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { status, rejectionReason, adminNotes } = req.body || {};
  const data = {};

  if (status !== undefined) {
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved | rejected | pending' });
    }
    data.status = status;
    data.reviewedAt = new Date();
    data.reviewedById = req.auth.adminId;
    if (status === 'rejected' && rejectionReason !== undefined) {
      data.rejectionReason = rejectionReason;
    }
  }

  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  const app = await prisma.application.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ ok: true, id: app.id, status: app.status });
});

/**
 * POST /api/applications/:id/activate  — admin only
 * Creates Student + ParentAccount from an approved application.
 * Returns temp credentials for the admin to forward to the parent.
 * Safe to call once only — sets accountsCreated=true to prevent duplicates.
 */
router.post('/:id/activate', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'approved') return res.status(400).json({ error: 'Application must be approved first.' });
  if (app.accountsCreated) return res.status(409).json({ error: 'Accounts already created for this application.' });

  // Generate student code: GIIS-[year]-[4 random hex chars]
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const studentCode = `GIIS-${year}-${suffix}`;

  // Parse birth date
  let birthDate = null;
  try { birthDate = new Date(app.dob); } catch {}

  const studentLoginEmail = await uniqueStudentLoginEmail(app.studentName);
  if (!studentLoginEmail) return res.status(400).json({ error: 'Could not generate student login email.' });
  const parentLoginEmail = parentLoginEmailForStudentEmail(studentLoginEmail);
  if (!parentLoginEmail) return res.status(400).json({ error: 'Could not generate parent login email.' });

  const existingParentLogin = await prisma.parentAccount.findUnique({ where: { email: parentLoginEmail } });
  if (existingParentLogin) {
    return res.status(409).json({ error: `A parent account already exists for ${parentLoginEmail}.` });
  }

  const studentPassword = tempPassword('Student');
  const parentPassword = tempPassword('Parent');
  const studentPasswordHash = await bcrypt.hash(studentPassword, 12);
  const parentPasswordHash = await bcrypt.hash(parentPassword, 12);

  // Create Student + ParentAccount in a transaction
  const student = await prisma.student.create({
    data: {
      name: app.studentName,
      studentCode,
      birthDate,
      parentGuardian: app.parentName,
      parentEmail: app.parentEmail,
      entryDate: new Date(),
      account: {
        create: {
          email: studentLoginEmail,
          passwordHash: studentPasswordHash,
          isActive: true,
        },
      },
    },
  });

  await prisma.parentAccount.create({
    data: {
      email: parentLoginEmail,
      passwordHash: parentPasswordHash,
      studentId: student.id,
    },
  });

  await prisma.application.update({
    where: { id: app.id },
    data: { accountsCreated: true },
  });
  const linkedSubscriptions = await linkExistingSubscriptionsForApplication({
    app,
    studentId: student.id,
    parentLoginEmail,
  });

  const loginUrl = `${process.env.CORS_ORIGIN || 'https://genesisideas.school'}/parent/login`;

  // Auto-send welcome email with credentials
  const welcomeResult = await sendWelcomeEmail({
    parentEmail: app.parentEmail,
    studentName: app.studentName,
    tempPassword: parentPassword,
    loginUrl,
    studentCode,
    parentLoginEmail,
    parentPassword,
    studentLoginEmail,
    studentPassword,
  });
  await recordEmailLog({
    kind: 'welcome_parent_login',
    recipient: app.parentEmail,
    studentId: student.id,
    result: welcomeResult,
  });

  res.json({
    ok: true,
    studentCode,
    studentId: student.id,
    parentContactEmail: app.parentEmail,
    parentEmail: parentLoginEmail,
    parentLoginEmail,
    parentPassword,
    studentEmail: studentLoginEmail,
    studentPassword,
    tempPassword: parentPassword,
    linkedSubscriptions,
    loginUrl,
  });
});

module.exports = router;
