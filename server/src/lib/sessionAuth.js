const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const { touchLoginSession } = require('./sessionTracker');

const invalid = () => ({ ok: false, status: 401, code: 'invalid_session', error: 'Session expired or ended. Please sign in again.' });
const unavailable = () => ({ ok: false, status: 503, code: 'session_status_unavailable', error: 'Session status could not be verified. Please try again.' });
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function extractAccountToken(req, cookieName) {
  const cookie = req.cookies?.[cookieName];
  if (cookie) return cookie;
  const header = req.headers?.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Login tokens require an explicit role and a persisted session. Legacy tokens
// lacking either must sign in again; they cannot safely participate in logout.
async function readSessionAuth(req, { roles, cookieName = 'giis_jwt', allowEnded = false }) {
  let payload;
  try {
    payload = jwt.verify(extractAccountToken(req, cookieName), process.env.JWT_SECRET);
  } catch { return invalid(); }
  if (!payload || !['admin', 'student', 'parent'].includes(payload.role)
      || !nonempty(payload.sessionId) || !nonempty(payload.email)) return invalid();
  const { role, sessionId, email } = payload;
  if ((role === 'admin' && !nonempty(payload.adminId))
      || (role === 'student' && !nonempty(payload.studentId))
      || (role === 'parent' && (!nonempty(payload.parentId) || !nonempty(payload.studentId)))) return invalid();
  if (!roles.includes(role)) return { ok: false, status: 403, code: 'wrong_role', error: 'Forbidden' };

  let session;
  try {
    session = await prisma.loginSession.findUnique({
      where: { id: sessionId },
      select: { role: true, email: true, adminId: true, studentId: true, parentAccountId: true, endedAt: true },
    });
  } catch { return unavailable(); }
  if (!session || (!allowEnded && session.endedAt !== null) || session.role !== role
      || session.email !== email.toLowerCase()
      || (role === 'admin' && session.adminId !== payload.adminId)
      || (role === 'student' && session.studentId !== payload.studentId)
      || (role === 'parent' && (session.parentAccountId !== payload.parentId || session.studentId !== payload.studentId))) return invalid();

  const auth = { role, sessionId, email };
  if (role === 'admin') auth.adminId = payload.adminId;
  if (role === 'student' || role === 'parent') auth.studentId = payload.studentId;
  if (role === 'parent') auth.parentId = payload.parentId;
  // Activity tracking is best-effort telemetry. The awaited read above is the
  // authorization gate. In-flight work already authorized is not rolled back.
  if (!allowEnded) void touchLoginSession(sessionId, req);
  return { ok: true, auth };
}

function sendSessionError(res, result = unavailable()) {
  return res.status(result.status).json({ error: result.error, code: result.code });
}

module.exports = { readSessionAuth, sendSessionError };
