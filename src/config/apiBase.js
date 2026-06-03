/**
 * Transcript API origin. CRA injects REACT_APP_* from `.env*` at **build/start** time.
 * - Committed `.env.development` defaults to http://localhost:4000 for `npm start`.
 * - If unset in production builds, set REACT_APP_API_URL in the host / CI.
 * - Live production falls back to same-origin /api, which Netlify proxies to
 *   the API host. This avoids browser mixed-content failures if the backend's
 *   HTTPS listener is down while HTTP is still available.
 */
export function getApiBase() {
  const v = process.env.REACT_APP_API_URL;
  if (v != null && String(v).trim() !== '') {
    return String(v).trim().replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:4000';
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'genesisideas.school' || host === 'www.genesisideas.school') {
      return window.location.origin;
    }
  }
  return '';
}
