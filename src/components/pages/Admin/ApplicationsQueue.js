import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import { getAdminSession } from '../../../api/authStorage';

const API = getApiBase();

const STATUS_COLORS = {
  pending:  { bg: '#fff3e0', fg: '#e65100', label: 'Pending' },
  approved: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Approved' },
  rejected: { bg: '#fce4ec', fg: '#c62828', label: 'Rejected' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ApplicationsQueue() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState('');
  const [toast, setToast] = useState('');
  const [credentials, setCredentials] = useState(null); // modal data after activate

  const session = getAdminSession();
  useEffect(() => { if (!session) navigate('/admin/login', { replace: true }); }, [session, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `${API}/api/applications?status=${filter}` : `${API}/api/applications`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login', { replace: true }); return; }
      setItems(await res.json());
    } finally { setLoading(false); }
  }, [filter, navigate]);

  useEffect(() => { if (session) load(); }, [session, load]);

  async function activateApplication(id) {
    setSaving(id + 'activate');
    try {
      const res = await fetch(`${API}/api/applications/${id}/activate`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setToast(data.error || 'Activation failed'); return; }
      setCredentials(data);
      load();
    } finally {
      setSaving('');
    }
  }

  async function updateStatus(id, status) {
    setSaving(id + status);
    try {
      const res = await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { setToast('Error updating status'); return; }
      setToast(`Marked as ${status}`);
      setExpanded(null);
      load();
    } finally {
      setSaving('');
      setTimeout(() => setToast(''), 3000);
    }
  }

  if (!session) return null;

  return (
    <>
      <Helmet><title>Applications | GIIS Admin</title></Helmet>

      <div style={{ fontFamily: 'Inter, sans-serif', background: '#f4f6fa', minHeight: '100vh', padding: '24px 28px 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Admin</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Applications</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/admin" style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '8px 14px', border: '1.5px solid #d4d8e0', borderRadius: 8 }}>← Admin Home</Link>
              <Link to="/admin/assignments" style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '8px 14px', border: '1.5px solid #d4d8e0', borderRadius: 8 }}>Assignments</Link>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['', 'All']].map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                background: filter === v ? '#2b3d6d' : '#fff',
                color: filter === v ? '#fff' : '#5c6578',
                border: filter === v ? 'none' : '1.5px solid #d4d8e0',
                cursor: 'pointer',
              }}>
                {label}
              </button>
            ))}
            <span style={{ fontSize: 13, color: '#9aa0ad', alignSelf: 'center', marginLeft: 4 }}>
              {loading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {loading
            ? <p style={{ color: '#9aa0ad', fontSize: 14 }}>Loading…</p>
            : items.length === 0
              ? <div style={{ background: '#fff', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#9aa0ad', fontSize: 14 }}>
                  No applications found.
                </div>
              : items.map(app => {
                const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                return (
                  <div key={app.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf5', marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1d24' }}>{app.studentName}</span>
                          <span style={{ fontSize: 11, background: '#f0f4ff', color: '#2b3d6d', fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>{app.gradeLevel}</span>
                          <span style={{ fontSize: 11, background: sc.bg, color: sc.fg, fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>{sc.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#5c6578', margin: '0 0 2px' }}>
                          Parent: {app.parentName} · <a href={`mailto:${app.parentEmail}`} style={{ color: '#2b3d6d' }}>{app.parentEmail}</a>
                          {app.phone && ` · ${app.phone}`}
                        </p>
                        <p style={{ fontSize: 12, color: '#9aa0ad', margin: 0 }}>Submitted {timeAgo(app.createdAt)}</p>
                      </div>
                      <button onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: 'none', fontSize: 13, fontWeight: 600, color: '#2b3d6d', cursor: 'pointer' }}>
                        {expanded === app.id ? 'Close' : 'View'}
                      </button>
                    </div>

                    {expanded === app.id && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f0f2f8' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 16, marginBottom: 16 }}>
                          {[
                            ['Student Name', app.studentName],
                            ['Date of Birth', app.dob],
                            ['Grade Level', app.gradeLevel],
                            ['Current School', app.currentSchool || '—'],
                            ['Target Universities', app.targetUniversities || '—'],
                            ['Language Pref.', app.preferredLanguage === 'zh' ? 'Chinese' : 'English'],
                            ['Parent Name', app.parentName],
                            ['Parent Email', app.parentEmail],
                            ['Phone', app.phone || '—'],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>{k}</p>
                              <p style={{ fontSize: 13, color: '#1a1d24', margin: 0, wordBreak: 'break-word' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                        {app.notes && (
                          <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1a1d24', marginBottom: 16 }}>
                            <strong>Notes:</strong> {app.notes}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {app.status === 'pending' && (<>
                            <button onClick={() => updateStatus(app.id, 'approved')} disabled={!!saving}
                              style={{ padding: '8px 18px', borderRadius: 8, background: '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => updateStatus(app.id, 'rejected')} disabled={!!saving}
                              style={{ padding: '8px 18px', borderRadius: 8, background: '#c62828', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              ✗ Reject
                            </button>
                          </>)}
                          {app.status === 'approved' && !app.accountsCreated && (
                            <button onClick={() => activateApplication(app.id)} disabled={saving === app.id + 'activate'}
                              style={{ padding: '8px 20px', borderRadius: 8, background: '#1a73e8', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              {saving === app.id + 'activate' ? 'Creating…' : '🔑 Create Accounts'}
                            </button>
                          )}
                          {app.status === 'approved' && app.accountsCreated && (
                            <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 700, padding: '8px 0' }}>✓ Accounts created</span>
                          )}
                          {app.status !== 'pending' && (
                            <button onClick={() => updateStatus(app.id, 'pending')} disabled={!!saving}
                              style={{ padding: '8px 18px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                              Reset to Pending
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {credentials && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', maxWidth: 540, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>✓ Accounts Created</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>Send these credentials to the parent</h2>

            <div style={{ background: '#f4f6fa', borderRadius: 10, padding: '16px 20px', marginBottom: 20, fontSize: 13, lineHeight: 2 }}>
              <div><strong>Student Code:</strong> {credentials.studentCode}</div>
              <div><strong>Login URL:</strong> <a href={credentials.loginUrl} target="_blank" rel="noreferrer" style={{ color: '#1a73e8' }}>{credentials.loginUrl}</a></div>
              <div><strong>Email:</strong> {credentials.parentEmail}</div>
              <div><strong>Temp Password:</strong> <code style={{ background: '#e8ecf5', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{credentials.tempPassword}</code></div>
            </div>

            <div style={{ background: '#fffde7', border: '1px solid #f9a825', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#5c4f00', marginBottom: 20 }}>
              Copy and paste the above into your email to the parent. The parent logs in, then pays to activate their account.
            </div>

            <div style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 20, color: '#1a1d24', lineHeight: 1.7 }}>
{`Subject: Your GIIS account is ready — next step

Hi ${credentials.parentEmail ? credentials.parentEmail.split('@')[0] : ''},

Your child's GIIS account has been created. Please log in to complete enrollment:

Login: ${credentials.loginUrl}
Email: ${credentials.parentEmail}
Temp password: ${credentials.tempPassword}

After logging in, you'll see a button to complete payment and activate full access.

Welcome to GIIS!
— The GIIS Team`}
            </div>

            <button onClick={() => setCredentials(null)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#2b3d6d', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Done — I've sent the email
            </button>
          </div>
        </div>
      )}
    </>
  );
}
