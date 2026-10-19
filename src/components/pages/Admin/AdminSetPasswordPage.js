import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

export default function AdminSetPasswordPage() {
  const [token] = useState(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
    const legacy = new URLSearchParams(window.location.search).get('token');
    return fragment || legacy || '';
  });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    const meta = document.querySelector('meta[name="referrer"]') || document.createElement('meta');
    meta.setAttribute('name', 'referrer');
    meta.setAttribute('content', 'no-referrer');
    if (!meta.parentNode) document.head.appendChild(meta);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  async function submit(event) {
    event.preventDefault();
    const response = await fetch(`${API}/api/admin/staff/set-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ token, password }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(body.error || 'This staff access link is invalid or expired.');
    setDone(true); setMessage('Password saved. Sign in with your staff email.');
  }
  return <div className="py-5" style={{ maxWidth: 480, margin: '0 auto' }}><section style={{ ...adminCardStyle, padding: 24 }}>
    <p className="small fw-bold text-uppercase" style={{ color: '#2b3d6d' }}>GIIS staff access</p><h1 className="h4">Set your password</h1>
    {!token && <div className="alert alert-warning" role="alert">This staff access link is missing or invalid. Ask the Owner for a new invitation.</div>}
    {message && <div className={`alert ${done ? 'alert-success' : 'alert-warning'}`} role="status">{message}</div>}
    {!done && token && <form onSubmit={submit}><label className="form-label" htmlFor="staff-password">Password (12+ characters; 72-byte maximum)</label><input id="staff-password" className="form-control mb-3" type="password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /><button className="btn btn-dark">Save password</button></form>}
    {done && <Link className="btn btn-dark" to="/admin/login">Staff sign in</Link>}
  </section></div>;
}

const adminCardStyle = { background: '#fff', border: '1px solid #e3e8f2', borderRadius: 8, boxShadow: '0 10px 28px rgba(26,45,90,0.06)' };
