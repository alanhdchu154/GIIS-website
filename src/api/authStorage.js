// JWT is now stored in an HttpOnly cookie managed by the server.
// This module only stores non-sensitive session info (id, email, name) for UI display.

const ADMIN_SESSION_KEY = 'giis_admin_session';
const STUDENT_TOKEN_KEY = 'giis_student_token';
const STUDENT_INFO_KEY = 'giis_student_info';

// ── Admin ────────────────────────────────────────────────────────────────────

// These getters used to JSON.parse on every call and return a NEW object each
// time. Components that read `const session = getXSession()` at render top-level
// and put `session` in a useEffect/useCallback dependency array would then
// re-run that effect on every render — an infinite fetch loop when the effect
// loads data. We cache the parsed value keyed on the raw storage string so
// repeated calls return a STABLE reference; the cache self-invalidates whenever
// storage changes (login / logout / another tab), since the raw string differs.
let _adminCache = { raw: undefined, val: null };
export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (raw === _adminCache.raw) return _adminCache.val;
    let val = null;
    if (raw) {
      const s = JSON.parse(raw);
      val = s?.id ? s : null;
    }
    _adminCache = { raw, val };
    return val;
  } catch {
    return null;
  }
}

export function setAdminSession(admin) {
  try {
    if (admin?.id) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        id: admin.id,
        email: admin.email || '',
        displayName: admin.displayName || '',
        staffRole: admin.staffRole || '',
      }));
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearAdminSession() {
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* ignore */ }
}

// ── Backward-compat aliases (some pages still call getAdminToken / clearAdminToken) ──

export function getAdminToken() {
  // Legacy: return a non-null truthy value if an admin session exists (cookie carries the real JWT)
  return getAdminSession() ? '__cookie__' : null;
}

export function setAdminToken(_token) {
  // no-op: token is managed by the server cookie
}

export function clearAdminToken() {
  clearAdminSession();
}

// ── Student ──────────────────────────────────────────────────────────────────

/** @returns {{ token: string, student: { id: string, email: string, name?: string } } | null} */
let _studentCache = { key: undefined, val: null };
export function getStudentSession() {
  try {
    // Keep reading legacy token key for backward compat (token value still in localStorage during migration window)
    const token = localStorage.getItem(STUDENT_TOKEN_KEY) || '__cookie__';
    const raw = localStorage.getItem(STUDENT_INFO_KEY);
    const key = `${token}\u0000${raw || ''}`;
    if (key === _studentCache.key) return _studentCache.val;
    let val = null;
    if (raw) {
      const student = JSON.parse(raw);
      if (student?.id) val = { token, student };
    }
    _studentCache = { key, val };
    return val;
  } catch {
    return null;
  }
}

export function setStudentSession(token, student) {
  try {
    if (student?.id) {
      // Store token for backward compat; cookie is the real auth mechanism
      if (token && token !== '__cookie__') localStorage.setItem(STUDENT_TOKEN_KEY, token);
      localStorage.setItem(
        STUDENT_INFO_KEY,
        JSON.stringify({ id: student.id, email: student.email || '', name: student.name || '' })
      );
    } else {
      clearStudentSession();
    }
  } catch {
    /* ignore */
  }
}

export function clearStudentSession() {
  try {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    localStorage.removeItem(STUDENT_INFO_KEY);
  } catch {
    /* ignore */
  }
}

// ── Parent ────────────────────────────────────────────────────────────────────

const PARENT_INFO_KEY = 'giis_parent_info';

let _parentCache = { raw: undefined, val: null };
export function getParentSession() {
  try {
    const raw = localStorage.getItem(PARENT_INFO_KEY);
    if (raw === _parentCache.raw) return _parentCache.val;
    let val = null;
    if (raw) {
      const p = JSON.parse(raw);
      val = p?.studentId ? p : null;
    }
    _parentCache = { raw, val };
    return val;
  } catch { return null; }
}

export function setParentSession(info) {
  try {
    if (info?.studentId) {
      localStorage.setItem(PARENT_INFO_KEY, JSON.stringify(info));
    } else {
      clearParentSession();
    }
  } catch { /* ignore */ }
}

export function clearParentSession() {
  try { localStorage.removeItem(PARENT_INFO_KEY); } catch { /* ignore */ }
}
