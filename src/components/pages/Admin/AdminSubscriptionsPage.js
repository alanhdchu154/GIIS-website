import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { AdminNav } from './AdminChrome';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

const STATUSES = ['all', 'active', 'trialing', 'past_due', 'cancelled', 'refunded', 'paid'];

function money(cents) {
  if (cents == null) return '-';
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function dateShort(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function badgeStyle(status) {
  const color = {
    active: ['#e8f5e9', '#2e7d32'],
    trialing: ['#e3f2fd', '#1565c0'],
    past_due: ['#fff3e0', '#e65100'],
    cancelled: ['#fce4ec', '#c62828'],
    refunded: ['#f3e5f5', '#6a1b9a'],
    paid: ['#e8f5e9', '#2e7d32'],
  }[status] || ['#eef0f4', '#5c6578'];
  return {
    background: color[0],
    color: color[1],
    borderRadius: 999,
    padding: '3px 9px',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
  };
}

export default function AdminSubscriptionsPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [status, setStatus] = useState('all');
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byStatus: {}, unlinked: 0, unlinkedPaid: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
  }, [session, navigate]);

  const studentOptions = useMemo(
    () => students.map((s) => ({
      id: s.id,
      label: `${s.name || '(unnamed)'}${s.studentCode ? ` · ${s.studentCode}` : ''}${s.loginEmail ? ` · ${s.loginEmail}` : ''}`,
    })),
    [students]
  );

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [subsRes, studentsRes] = await Promise.all([
        fetch(`${API}/api/subscriptions?status=${status}`, { credentials: 'include' }),
        fetch(`${API}/api/students?limit=100`, { credentials: 'include' }),
      ]);
      if (subsRes.status === 401 || studentsRes.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      const subsData = await subsRes.json().catch(() => ({}));
      const studentsData = await studentsRes.json().catch(() => ({}));
      if (!subsRes.ok) throw new Error(subsData.error || 'Failed to load subscriptions');
      if (!studentsRes.ok) throw new Error(studentsData.error || 'Failed to load students');
      setSubscriptions(subsData.subscriptions || []);
      setSummary(subsData.summary || { total: 0, byStatus: {}, unlinked: 0, unlinkedPaid: 0 });
      setStudents(studentsData.students || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, session, navigate]);

  useEffect(() => { load(); }, [load]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  async function linkStudent(subscriptionId, studentId) {
    setSavingId(subscriptionId);
    setError('');
    try {
      const res = await fetch(`${API}/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId: studentId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update subscription');
      showToast(studentId ? 'Subscription linked' : 'Subscription unlinked');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId('');
    }
  }

  if (!session) return null;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f4f6fa', minHeight: '100vh', padding: '24px 28px 80px' }}>
      <Helmet><title>Subscriptions | GIIS Admin</title></Helmet>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#2b3d6d', letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 4px' }}>Admin</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Subscriptions</h1>
            <p style={{ fontSize: 13, color: '#5c6578', margin: '6px 0 0' }}>
              Link Stripe purchases and manual payment records to student records so billing events and admissions handoffs point to the right account.
            </p>
          </div>
        </div>

        <AdminNav />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
          <Metric label="Total" value={summary.total || 0} />
          <Metric label="Active" value={summary.byStatus?.active || 0} />
          <Metric label="Past Due" value={summary.byStatus?.past_due || 0} />
          <Metric label="Unlinked" value={summary.unlinked || 0} warn={(summary.unlinked || 0) > 0} />
          <Metric label="Paid · Unlinked" value={summary.unlinkedPaid || 0} warn={(summary.unlinkedPaid || 0) > 0} />
        </div>
        {(summary.unlinkedPaid || 0) > 0 && (
          <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#5c4a12' }}>
            ⚠️ {summary.unlinkedPaid} paid subscription{(summary.unlinkedPaid || 0) > 1 ? 's' : ''} {(summary.unlinkedPaid || 0) > 1 ? 'are' : 'is'} not linked to a student — the parent has paid but no student account is being activated. Link {(summary.unlinkedPaid || 0) > 1 ? 'them' : 'it'} below.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              style={{
                border: status === s ? 'none' : '1px solid #d4d8e0',
                background: status === s ? '#2b3d6d' : '#fff',
                color: status === s ? '#fff' : '#5c6578',
                borderRadius: 999,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {error && <div style={{ background: '#fff3f3', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ background: '#fff', border: '1px solid #e8ecf5', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: 24, color: '#5c6578', margin: 0 }}>Loading...</p>
          ) : subscriptions.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#9aa0ad', margin: 0 }}>No subscriptions found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fc', color: '#5c6578', textAlign: 'left' }}>
                    <th style={th}>Purchaser</th>
                    <th style={th}>Plan</th>
                    <th style={th}>Status</th>
                    <th style={th}>Amount</th>
                    <th style={th}>Period End</th>
                    <th style={th}>Linked Student</th>
                    <th style={th}>Stripe IDs</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} style={{ borderTop: '1px solid #eef0f4' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 800, color: '#1a1d24' }}>{sub.purchaserEmail}</div>
                        <div style={{ color: '#9aa0ad', fontSize: 11 }}>Created {dateShort(sub.createdAt)}</div>
                      </td>
                      <td style={td}>
                        <div style={{ fontWeight: 700 }}>{sub.planType}</div>
                        <div style={{ color: '#5c6578', fontSize: 11 }}>{sub.maxStudents} seat{sub.maxStudents === 1 ? '' : 's'}</div>
                      </td>
                      <td style={td}>
                        <span style={badgeStyle(sub.status)}>{sub.status}</span>
                        {sub.paymentFailureCount > 0 && <div style={{ color: '#e65100', fontSize: 11, marginTop: 5 }}>{sub.paymentFailureCount} failed payment{sub.paymentFailureCount === 1 ? '' : 's'}</div>}
                        {sub.cancelAtPeriodEnd && <div style={{ color: '#c62828', fontSize: 11, marginTop: 5 }}>Cancels at period end</div>}
                      </td>
                      <td style={td}>{money(sub.amountTotal)}</td>
                      <td style={td}>{dateShort(sub.currentPeriodEnd)}</td>
                      <td style={td}>
                        {sub.student && (
                          <div style={{ marginBottom: 8 }}>
                            <Link to={`/admin/transcript/${sub.student.id}`} style={{ color: '#2b3d6d', fontWeight: 800, textDecoration: 'none' }}>
                              {sub.student.name}
                            </Link>
                            <div style={{ color: '#5c6578', fontSize: 11 }}>
                              {sub.student.studentCode || 'No code'} · {sub.student.loginEmail || 'No login'}
                              {sub.student.softLocked ? ` · locked: ${sub.student.lockReason || 'yes'}` : ''}
                            </div>
                          </div>
                        )}
                        <select
                          value={sub.student?.id || ''}
                          onChange={(e) => linkStudent(sub.id, e.target.value)}
                          disabled={savingId === sub.id}
                          style={{ width: 280, maxWidth: '100%', border: '1px solid #d4d8e0', borderRadius: 8, padding: '7px 9px', fontSize: 12 }}
                        >
                          <option value="">Unlinked</option>
                          {studentOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={{ ...td, color: '#5c6578', fontFamily: 'monospace', fontSize: 11 }}>
                        <div>sub: {sub.stripeSubscriptionId || '-'}</div>
                        <div>cus: {sub.stripeCustomerId || '-'}</div>
                        <div>checkout: {sub.stripeCheckoutSessionId || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', right: 24, bottom: 24, background: '#1a1a2e', color: '#fff', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>{toast}</div>}
    </div>
  );
}

function Metric({ label, value, warn }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${warn ? '#f9a825' : '#e8ecf5'}`, borderRadius: 10, padding: '16px 18px' }}>
      <p style={{ fontSize: 11, color: '#888', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 800, margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: warn ? '#b45309' : '#1a1d24', margin: 0 }}>{value}</p>
    </div>
  );
}

const th = { padding: '12px 14px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' };
const td = { padding: '14px', verticalAlign: 'top' };
