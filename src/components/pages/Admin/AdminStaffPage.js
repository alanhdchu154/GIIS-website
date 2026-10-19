import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage, adminCardStyle } from './AdminChrome';

const API = getApiBase();
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminStaffPage({ language = 'en', toggleLanguage }) {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [data, setData] = useState({ staff: [], roles: [], roleDefinitions: [], invitations: [], audit: [], summary: {} });
  const [form, setForm] = useState({ email: '', displayName: '', role: 'principal', reason: '' });
  const [message, setMessage] = useState('');
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`${API}/api/admin/staff`, { credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) { clearAdminSession(); navigate('/admin/login', { replace: true }); return; }
    if (response.status === 403) { setDenied(true); return; }
    if (!response.ok) throw new Error(body.error || 'Unable to load staff accounts.');
    setData(body);
  }

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
    else load().catch((error) => setMessage(error.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function request(path, method, body, success) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}${path}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Staff access could not be updated.');
      setMessage(success(result)); await load(); return true;
    } catch (error) { setMessage(error.message); return false; }
    finally { setBusy(false); }
  }

  async function invite(event) {
    event.preventDefault();
    if (!window.confirm(`Invite ${form.email} as ${label(form.role)}?`)) return;
    const accepted = await request('/api/admin/staff/invite', 'POST', form, () => `Invitation request accepted for ${form.email}. Check delivery status below.`);
    if (accepted) setForm({ email: '', displayName: '', role: 'principal', reason: '' });
  }

  function getReason(action) { return window.prompt(`${action}\nEnter the operational reason (required):`, '')?.trim() || ''; }

  async function changeAccess(person, change, action) {
    const reason = getReason(action);
    if (!reason || !window.confirm(`${action} for ${person.email}? Existing sessions and links may be revoked.`)) return;
    await request(`/api/admin/staff/${person.id}`, 'PATCH', { ...change, reason }, () => `${action} completed for ${person.email}.`);
  }

  async function accountAction(person, route, action) {
    const reason = getReason(action);
    if (!reason) return;
    const principalAck = person.protection !== 'configured_principal' || window.confirm('This is the configured Principal. Continue only if temporary Principal downtime is understood.');
    if (!principalAck || !window.confirm(`${action} for ${person.email}?`)) return;
    await request(`/api/admin/staff/${person.id}/${route}`, 'POST', { reason, acknowledgePrincipalDowntime: person.protection === 'configured_principal' }, (result) => `${action} completed; ${result.sessionsRevoked ?? 0} session(s) revoked.`);
  }

  if (!session) return null;
  if (denied) return <AdminPage><AdminHeader title="Staff access" subtitle="Owner-only access." /><div className="alert alert-danger" role="alert">Your account is not authorized to manage staff access.</div></AdminPage>;
  return <AdminPage>
    <AdminHeader language={language} toggleLanguage={toggleLanguage} title="Staff access" subtitle="Owner-only role assignment, invitations, account state, sessions, and audit evidence." />
    {message && <div className="alert alert-info py-2" role="status">{message}</div>}
    <div className="row g-3 mb-3">{[['Active accounts', data.summary?.activeAccounts], ['Pending invitations', data.summary?.pendingInvitations], ['Open sessions', data.summary?.openSessions], ['Principal identity', data.summary?.configuredPrincipal]].map(([name, value]) => <div className="col-md-3" key={name}><div style={{ ...adminCardStyle, padding: 14 }}><div className="small text-muted">{name}</div><strong>{value ?? '—'}</strong></div></div>)}</div>

    <section style={{ ...adminCardStyle, padding: 18, marginBottom: 18 }}><h2 className="h6">Role boundaries</h2><div className="row g-3">{(data.roleDefinitions || []).map((role) => <div className="col-lg-3" key={role.id}><div className="border rounded p-3 h-100"><strong>{role.label}</strong>{role.protected && <span className="badge text-bg-warning ms-2">Protected</span>}<p className="small text-success mb-1 mt-2">Allowed: {role.allowed.join('; ')}</p><p className="small text-danger mb-1">Denied: {role.denied.join('; ')}</p><p className="small text-muted mb-0">{role.signingRule}</p></div></div>)}</div></section>

    <form onSubmit={invite} style={{ ...adminCardStyle, padding: 18, marginBottom: 18 }}><h2 className="h6">Invite staff</h2><div className="row g-2">
      <div className="col-md-3"><label className="form-label" htmlFor="staff-email">Email</label><input id="staff-email" className="form-control" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="col-md-3"><label className="form-label" htmlFor="staff-name">Display name</label><input id="staff-name" className="form-control" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
      <div className="col-md-2"><label className="form-label" htmlFor="staff-role">Role</label><select id="staff-role" className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{(data.roles || []).map((role) => <option key={role} value={role}>{label(role)}</option>)}</select></div>
      <div className="col-md-3"><label className="form-label" htmlFor="invite-reason">Reason</label><input id="invite-reason" className="form-control" minLength={3} maxLength={300} required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
      <div className="col-md-1 d-flex align-items-end"><button className="btn btn-dark w-100" disabled={busy}>Send</button></div>
    </div></form>

    <section style={{ ...adminCardStyle, overflow: 'auto', marginBottom: 18 }}><h2 className="h6 p-3 mb-0">Accounts</h2><table className="table table-sm mb-0 align-middle"><thead><tr><th>Name / email</th><th>Role</th><th>Status</th><th>Sessions</th><th>Actions</th></tr></thead><tbody>{(data.staff || []).map((person) => { const locked = !!person.protection; return <tr key={person.id}><td>{person.displayName || '—'}<br /><span className="small text-muted">{person.email}</span>{locked && <span className="badge text-bg-warning ms-2">{person.protection.replaceAll('_', ' ')}</span>}</td><td><select className="form-select form-select-sm" aria-label={`Role for ${person.email}`} value={person.role} disabled={busy || locked} onChange={(e) => changeAccess(person, { role: e.target.value }, 'Change role')}>{person.role === 'owner' && <option value="owner">Owner</option>}{(data.roles || []).map((role) => <option key={role} value={role}>{label(role)}</option>)}</select></td><td>{person.isActive ? 'Active' : 'Disabled'}</td><td>{person.sessions?.openSessionCount || 0} open<br /><span className="small text-muted">{person.sessions?.lastActivityAt ? new Date(person.sessions.lastActivityAt).toLocaleString() : 'No activity'}</span></td><td><div className="d-flex flex-wrap gap-1"><button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy || locked} onClick={() => changeAccess(person, { isActive: !person.isActive }, person.isActive ? 'Disable account' : 'Enable account')}>{person.isActive ? 'Disable' : 'Enable'}</button><button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy || !person.isActive || person.role === 'owner'} onClick={() => accountAction(person, 'password-reset', 'Reset password')}>Reset password</button><button type="button" className="btn btn-sm btn-outline-danger" disabled={busy || person.role === 'owner'} onClick={() => accountAction(person, 'sessions/revoke', 'Revoke sessions')}>Revoke sessions</button></div></td></tr>; })}</tbody></table></section>

    <section style={{ ...adminCardStyle, overflow: 'auto', marginBottom: 18 }}><h2 className="h6 p-3 mb-0">Pending invitations</h2><table className="table table-sm mb-0"><thead><tr><th>Email</th><th>Role</th><th>Access</th><th>Email provider</th><th>Expires</th></tr></thead><tbody>{(data.invitations || []).map((item) => <tr key={item.id}><td>{item.email}</td><td>{label(item.role)}</td><td>{item.accessStatus}</td><td>{item.deliveryStatus}</td><td>{new Date(item.expiresAt).toLocaleString()}</td></tr>)}{!data.invitations?.length && <tr><td colSpan="5" className="text-muted">No pending invitations.</td></tr>}</tbody></table></section>
    <section style={{ ...adminCardStyle, overflow: 'auto' }}><h2 className="h6 p-3 mb-0">Recent access audit</h2><table className="table table-sm mb-0"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Reason</th></tr></thead><tbody>{(data.audit || []).map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.action}</td><td>{item.targetEmail || item.targetAdminId || '—'}</td><td>{item.metadata?.reason || '—'}</td></tr>)}{!data.audit?.length && <tr><td colSpan="4" className="text-muted">No audit entries.</td></tr>}</tbody></table></section>
  </AdminPage>;
}
