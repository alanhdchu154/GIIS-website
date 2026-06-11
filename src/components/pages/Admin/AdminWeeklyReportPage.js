import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { AdminNav } from './AdminChrome';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

/**
 * Admin review surface for the weekly parent report.
 * Flow: load dry-run drafts → admin reviews each student's payload →
 * sends only the selected students. Nothing is emailed without review here.
 */
export default function AdminWeeklyReportPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [week, setWeek] = useState('');
  const [drafts, setDrafts] = useState([]); // dry-run skipped entries with payloads
  const [alreadySent, setAlreadySent] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
  }, [session, navigate]);

  const loadDrafts = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    setSendResult(null);
    try {
      const res = await fetch(`${API}/api/admin/weekly-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dryRun: true }),
      });
      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load weekly report drafts');
      setWeek(data.week || '');
      const details = data.details || { skipped: [] };
      const draftRows = (details.skipped || []).filter((s) => s.reason === 'dry_run' && s.payload);
      const sentRows = (details.skipped || []).filter((s) => s.reason === 'already_sent_this_week');
      setDrafts(draftRows);
      setAlreadySent(sentRows);
      setSelected(new Set(draftRows.map((d) => d.studentId)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, navigate]);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  function toggle(studentId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
      return next;
    });
  }

  async function sendSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`Send the weekly report to ${ids.length} famil${ids.length === 1 ? 'y' : 'ies'} now?`)) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/admin/weekly-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendResult(data);
      loadDrafts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Helmet><title>Weekly Parent Report | GIIS Admin</title></Helmet>
      <AdminNav />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 4% 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 850, color: '#1a1a2e', margin: '0 0 4px' }}>Weekly Parent Report</h1>
            <p style={{ margin: 0, fontSize: 13.5, color: '#5c6578' }}>
              Week of {week || '—'} · Review each draft, then send. Nothing goes out without review.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadDrafts} disabled={loading}>
              {loading ? 'Loading…' : '↻ Refresh drafts'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={sendSelected}
              disabled={sending || loading || selected.size === 0}
            >
              {sending ? 'Sending…' : `📧 Send to ${selected.size} selected`}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fce4ec', color: '#c62828', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {sendResult && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 14 }}>
            Sent {sendResult.sent} · Skipped {sendResult.skipped} · Errors {sendResult.errors}
          </div>
        )}

        {!loading && drafts.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '34px 28px', textAlign: 'center', border: '1px solid #e3e8f2' }}>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>No drafts pending</p>
            <p style={{ margin: 0, fontSize: 13.5, color: '#5c6578' }}>
              {alreadySent.length > 0
                ? `All ${alreadySent.length} active families already received this week's report.`
                : 'No active subscriptions with linked students were found.'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {drafts.map((d) => {
            const p = d.payload || {};
            const wa = p.weeklyActivity || null;
            const note = p.advisorNote || null;
            const quietWeek = wa && wa.modulesCompleted === 0 && wa.activeDays === 0;
            const checked = selected.has(d.studentId);
            return (
              <div key={d.studentId} style={{
                background: '#fff', borderRadius: 12, border: `1.5px solid ${checked ? '#2b3d6d' : '#e3e8f2'}`,
                padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(d.studentId)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15.5, color: '#1a1a2e' }}>{p.studentName || d.studentId}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#5c6578' }}>→ {p.parentEmail || d.email}</p>
                  </div>
                  {quietWeek && (
                    <span style={{ background: '#fff3e0', color: '#e65100', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      Quiet week — review before sending
                    </span>
                  )}
                  {!note && (
                    <span style={{ background: '#eef0f4', color: '#5c6578', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      No advisor note
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: note ? 12 : 0 }}>
                  {[
                    ['Credits', `${p.creditsEarned ?? '—'} / 24`],
                    ['GPA (UW)', p.gpa ?? '—'],
                    ['Graduation', `${p.gradPercent ?? '—'}%`],
                    ['Modules this week', wa ? wa.modulesCompleted : '—'],
                    ['Study hrs (est.)', wa ? wa.estimatedStudyHours : '—'],
                    ['Active days', wa ? wa.activeDays : '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#f4f6fa', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 10.5, fontWeight: 800, color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 17, fontWeight: 850, color: '#2b3d6d' }}>{String(val)}</p>
                    </div>
                  ))}
                </div>

                {note && (
                  <div style={{ background: '#fdf9ef', borderLeft: '4px solid #d5a836', borderRadius: '0 8px 8px 0', padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 3px', fontSize: 10.5, fontWeight: 800, color: '#8a6d1f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Advisor note (parent-safe)
                    </p>
                    {note.title && <p style={{ margin: '0 0 3px', fontSize: 13.5, fontWeight: 750, color: '#1a1a2e' }}>{note.title}</p>}
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#3a3f4c' }}>{note.summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {alreadySent.length > 0 && drafts.length > 0 && (
          <p style={{ marginTop: 18, fontSize: 12.5, color: '#8a93a6' }}>
            {alreadySent.length} famil{alreadySent.length === 1 ? 'y' : 'ies'} already received this week's report and {alreadySent.length === 1 ? 'is' : 'are'} not shown.
          </p>
        )}
      </div>
    </div>
  );
}
