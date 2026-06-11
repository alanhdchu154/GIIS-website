
const prisma = require('./prisma');

function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || '';
}

function requestUserAgent(req) {
  return String(req.headers['user-agent'] || '').slice(0, 500);
}

function requestPath(req) {
  return String(req.originalUrl || req.url || '').slice(0, 500);
}

function durationSeconds(startedAt, now = new Date()) {
  if (!startedAt) return 0;
  const start = startedAt instanceof Date ? startedAt : new Date(startedAt);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
}

async function createLoginSession({ role, email, studentId = null, parentAccountId = null, adminId = null, req }) {
  try {
    return await prisma.loginSession.create({
      data: {
        role,
        email: String(email || '').toLowerCase(),
        studentId,
        parentAccountId,
        adminId,
        ipAddress: req ? requestIp(req) : '',
        userAgent: req ? requestUserAgent(req) : '',
        lastPath: req ? requestPath(req) : '',
      },
    });
  } catch (err) {
    console.error('[sessionTracker] createLoginSession failed:', err.message);
    return null;
  }
}

async function touchLoginSession(sessionId, req) {
  if (!sessionId) return;
  try {
    const existing = await prisma.loginSession.findUnique({
      where: { id: sessionId },
      select: { startedAt: true, endedAt: true },
    });
    if (!existing || existing.endedAt) return;
    const now = new Date();
    await prisma.loginSession.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: now,
        durationSeconds: durationSeconds(existing.startedAt, now),
        ...(req ? { lastPath: requestPath(req) } : {}),
      },
    });
  } catch (err) {
    console.error('[sessionTracker] touchLoginSession failed:', err.message);
  }
}

async function closeLoginSession(sessionId, req) {
  if (!sessionId) return;
  try {
    const existing = await prisma.loginSession.findUnique({
      where: { id: sessionId },
      select: { startedAt: true, endedAt: true },
    });
    if (!existing || existing.endedAt) return;
    const now = new Date();
    await prisma.loginSession.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: now,
        endedAt: now,
        durationSeconds: durationSeconds(existing.startedAt, now),
        ...(req ? { lastPath: requestPath(req) } : {}),
      },
    });
  } catch (err) {
    console.error('[sessionTracker] closeLoginSession failed:', err.message);
  }
}

module.exports = {
  createLoginSession,
  touchLoginSession,
  closeLoginSession,
};
