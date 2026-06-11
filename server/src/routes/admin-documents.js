const express = require('express');
const path = require('path');
const { execFile } = require('child_process');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { ADMIN_EMAIL, ADMISSIONS_EMAIL } = require('../lib/mailer');

const prisma = require('../lib/prisma');
const router = express.Router();
const ROOT = path.resolve(__dirname, '..', '..', '..');
const PACKAGE_SCRIPT = path.join(ROOT, 'server', 'scripts', 'send-graduation-document-packages.js');

function runPackageScript({ send, actorEmail }) {
  return new Promise((resolve) => {
    const args = [PACKAGE_SCRIPT];
    if (send) args.push('--send');
    const child = execFile(process.execPath, args, {
      cwd: path.join(ROOT, 'server'),
      env: {
        ...process.env,
        GRADUATION_DOCUMENT_CC: `${ADMIN_EMAIL},${ADMISSIONS_EMAIL}`,
        GRADUATION_DOCUMENT_ACTOR: actorEmail || 'admin:unknown',
      },
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 8,
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        exitCode: error?.code || 0,
        stdout: String(stdout || ''),
        stderr: String(stderr || ''),
        error: error?.message || '',
      });
    });
  });
}

router.get('/logs', authenticate, requireAdmin, async (_req, res) => {
  const [emails, audits] = await Promise.all([
    prisma.emailLog.findMany({
      where: { kind: 'official_graduation_documents' },
      orderBy: { sentAt: 'desc' },
      take: 50,
      select: {
        id: true,
        recipient: true,
        studentId: true,
        providerId: true,
        status: true,
        error: true,
        sentAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { action: 'official_documents_sent' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        studentId: true,
        actorRole: true,
        actorEmail: true,
        createdAt: true,
      },
    }),
  ]);

  const studentIds = Array.from(new Set([...emails, ...audits].map((row) => row.studentId).filter(Boolean)));
  const students = studentIds.length
    ? await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, studentCode: true, name: true },
    })
    : [];
  const studentById = new Map(students.map((student) => [student.id, student]));

  res.json({
    emails: emails.map((row) => ({ ...row, student: studentById.get(row.studentId) || null })),
    audits: audits.map((row) => ({ ...row, student: studentById.get(row.studentId) || null })),
  });
});

router.post('/graduation-packages/dry-run', authenticate, requireAdmin, async (req, res) => {
  const result = await runPackageScript({ send: false, actorEmail: req.auth?.email });
  res.status(result.ok ? 200 : 500).json(result);
});

router.post('/graduation-packages/send', authenticate, requireAdmin, async (req, res) => {
  const result = await runPackageScript({ send: true, actorEmail: req.auth?.email });
  res.status(result.ok ? 200 : 500).json(result);
});

module.exports = router;
