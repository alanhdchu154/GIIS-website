import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage, adminCardStyle } from './AdminChrome';

const API = getApiBase();

export default function AdminStaffPage({ language = 'en', toggleLanguage }) {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ email: '', displayName: '', role: 'principal' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`${API}/api/admin/staff`, { credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAdminSession();
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) throw new Error(body.error || 'Unable to load staff accounts.');
    setStaff(body.staff || []);
    setRoles(body.roles || []);
  }

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
    else load().catch((error) => setMessage(error.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function invite(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}/api/admin/staff/invite`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Invitation could not be sent.');
      setMessage(`Invitation sent to ${form.email}.`);
      setForm({ email: '', displayName: '', role: 'principal' });
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function updateStaff(person, change) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}/api/admin/staff/${person.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Staff access could not be updated.');
      setMessage(`Updated access for ${person.email}. Existing sessions were revoked when required.`);
      await load();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  if (!session) return null;
  return (
    <AdminPage>
      <AdminHeader language={language} toggleLanguage={toggleLanguage} title="Staff access" subtitle="Owner-only invitations, roles, account state, and password reset." />
      {message && <div className="alert alert-info py-2">{message}</div>}
      <form onSubmit={invite} style={{ ...adminCardStyle, padding: 18, marginBottom: 18 }}>
        <h2 className="h6">Invite staff</h2>
        <div className="row g-2">
          <div className="col-md-4"><input className="form-control" type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-md-4"><input className="form-control" required placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
          <div className="col-md-3"><select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></div>
          <div className="col-md-1"><button className="btn btn-dark w-100" disabled={busy}>Send</button></div>
        </div>
      </form>
      <section style={{ ...adminCardStyle, overflow: 'hidden' }}>
        <table className="table table-sm mb-0 align-middle"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
          <tbody>{staff.map((person) => <tr key={person.id}><td>{person.displayName || '—'}</td><td>{person.email}</td><td><select className="form-select form-select-sm" aria-label={`Role for ${person.email}`} value={person.role} disabled={busy || person.id === session.id} onChange={(e) => updateStaff(person, { role: e.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></td><td>{person.isActive ? 'Active' : 'Disabled'}</td><td className="text-end"><div className="d-flex justify-content-end gap-2"><button type="button" className={`btn btn-sm ${person.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`} disabled={busy || person.id === session.id} onClick={() => updateStaff(person, { isActive: !person.isActive })}>{person.isActive ? 'Disable' : 'Enable'}</button><button type="button" className="btn btn-sm btn-outline-secondary" disabled={!person.isActive || busy} onClick={async () => {
            setBusy(true); setMessage('');
            try { const r = await fetch(`${API}/api/admin/staff/${person.id}/password-reset`, { method: 'POST', credentials: 'include' }); const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'Reset failed.'); setMessage(`Password reset sent to ${person.email}; existing sessions were revoked.`); } catch (e) { setMessage(e.message); } finally { setBusy(false); }
          }}>Reset password</button></div></td></tr>)}</tbody>
        </table>
      </section>
    </AdminPage>
  );
}
