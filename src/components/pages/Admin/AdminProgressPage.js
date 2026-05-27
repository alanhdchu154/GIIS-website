import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from './AdminChrome';

const API = getApiBase();

const STATUS_OPTIONS = [
  'active',
  'progressing',
  'slowing_down',
  'disengaging',
  'intervention_needed',
  'advisor_followup',
  'parent_concern',
];
const RISK_OPTIONS = ['low', 'watch', 'concern', 'urgent'];
const TIER_OPTIONS = ['self_paced', 'guided', 'premium', 'transfer', 'graduation'];
const LOG_TYPES = ['advisor_note', 'weekly_checkin', 'parent_contact', 'intervention', 'transfer_review', 'graduation_review'];
const CHANNELS = ['internal', 'email', 'phone', 'wechat', 'meeting', 'portal'];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function label(value) {
  return String(value || '').replace(/_/g, ' ');
}

function riskStyle(risk) {
  if (risk === 'urgent') return { color: '#b71c1c', bg: '#ffebee', border: '#ef9a9a' };
  if (risk === 'concern') return { color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
  if (risk === 'watch') return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
  return { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' };
}

function activityLabel(daysInactive) {
  if (daysInactive === null) return 'Never active';
  if (daysInactive === 0) return 'Today';
  if (daysInactive === 1) return 'Yesterday';
  return `${daysInactive}d ago`;
}

function isDue(iso) {
  if (!iso) return false;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date < new Date();
}

function isNeedsAttention(student) {
  const risk = student.careDisplay?.riskLevel;
  const status = student.careDisplay?.status;
  return ['concern', 'urgent'].includes(risk)
    || ['disengaging', 'intervention_needed', 'advisor_followup', 'parent_concern'].includes(status);
}

function TextField({ label: fieldLabel, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>{fieldLabel}</span>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', border: '1px solid #d9e2ef', borderRadius: 6, padding: '9px 10px', fontSize: 13 }}
      />
    </label>
  );
}

function SelectField({ label: fieldLabel, value, onChange, options }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>{fieldLabel}</span>
      <select
        value={value || options[0]}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', border: '1px solid #d9e2ef', borderRadius: 6, padding: '9px 10px', fontSize: 13, background: '#fff' }}
      >
        {options.map((option) => <option key={option} value={option}>{label(option)}</option>)}
      </select>
    </label>
  );
}

function NoteLog({ logs }) {
  if (!logs?.length) {
    return <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No advisor notes yet.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {logs.map((log) => (
        <div key={log.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>{log.title || label(log.type)}</strong>
            <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(log.createdAt)}</span>
          </div>
          <p style={{ margin: '0 0 5px', fontSize: 12, color: '#64748b' }}>
            {label(log.type)} · {label(log.channel)} · {label(log.visibility)}
          </p>
          {log.bodyInternal && <p style={{ margin: '0 0 6px', fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{log.bodyInternal}</p>}
          {log.parentSummary && (
            <p style={{ margin: 0, fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 8 }}>
              Parent-safe: {log.parentSummary}
            </p>
          )}
          {(log.followUpAt || log.resolvedAt) && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
              Follow-up: {fmtDate(log.followUpAt)} · Resolved: {fmtDate(log.resolvedAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminProgressPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [students, setStudents] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [careDraft, setCareDraft] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ type: 'advisor_note', visibility: 'internal', channel: 'internal' });
  const [filter, setFilter] = useState('needs_attention');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => (students || []).find((student) => student.id === selectedId) || null,
    [students, selectedId]
  );

  async function loadProgress(nextSelectedId = selectedId) {
    const res = await fetch(`${API}/api/students/progress`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load progress data');
    const data = await res.json();
    setStudents(data.students || []);
    if (nextSelectedId) {
      const next = (data.students || []).find((student) => student.id === nextSelectedId);
      if (next) setCareDraft(next.careState || {});
    }
  }

  async function loadCareLogs(studentId) {
    if (!studentId) return;
    const res = await fetch(`${API}/api/students/${studentId}/care-logs`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load care logs');
    const data = await res.json();
    setCareLogs(data.logs || []);
  }

  useEffect(() => {
    if (!session) { navigate('/admin/login', { replace: true }); return; }
    loadProgress().catch(() => setErr('Failed to load coordination data'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate]);

  useEffect(() => {
    if (!selected) return;
    setCareDraft(selected.careState || {});
    loadCareLogs(selected.id).catch(() => setErr('Failed to load advisor notes'));
  }, [selected]);

  if (!session) return null;

  const filteredStudents = (students || []).filter((student) => {
    if (filter === 'all') return true;
    if (filter === 'needs_attention') return isNeedsAttention(student);
    if (filter === 'no_recent_login') return !student.lastLoginAt || (student.daysInactive !== null && student.daysInactive >= 7);
    if (filter === 'no_advisor_review') return !student.careState?.lastReviewedAt;
    if (filter === 'parent_concern') return student.careDisplay?.status === 'parent_concern' || (student.recentCareLogs || []).some((log) => log.type === 'parent_contact');
    if (filter === 'intervention_due') return isDue(student.careState?.nextCheckInDueAt) || student.careDisplay?.status === 'intervention_needed';
    return true;
  });

  const summary = {
    total: students?.length || 0,
    needsAttention: (students || []).filter(isNeedsAttention).length,
    urgent: (students || []).filter((student) => student.careDisplay?.riskLevel === 'urgent').length,
    noReview: (students || []).filter((student) => !student.careState?.lastReviewedAt).length,
    due: (students || []).filter((student) => isDue(student.careState?.nextCheckInDueAt)).length,
  };

  function updateCareDraft(key, value) {
    setCareDraft((prev) => ({ ...(prev || {}), [key]: value }));
  }

  async function saveCareState() {
    if (!selected) return;
    setSaving(true);
    setErr('');
    try {
      const payload = {
        advisorOwner: careDraft?.advisorOwner || '',
        status: careDraft?.status || selected.careDisplay?.status || 'active',
        riskLevel: careDraft?.riskLevel || selected.careDisplay?.riskLevel || 'low',
        careTier: careDraft?.careTier || 'self_paced',
        manualOverride: careDraft?.manualOverride === true,
        lastReviewedAt: careDraft?.lastReviewedAt || null,
        nextCheckInDueAt: careDraft?.nextCheckInDueAt || null,
        currentGoal: careDraft?.currentGoal || '',
        internalFlags: careDraft?.internalFlags || {},
      };
      const res = await fetch(`${API}/api/students/${selected.id}/care-state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      await loadProgress(selected.id);
    } catch {
      setErr('Failed to save care state');
    } finally {
      setSaving(false);
    }
  }

  async function addCareLog() {
    if (!selected) return;
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`${API}/api/students/${selected.id}/care-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: noteDraft.type || 'advisor_note',
          visibility: noteDraft.visibility || 'internal',
          title: noteDraft.title || '',
          bodyInternal: noteDraft.bodyInternal || '',
          parentSummary: noteDraft.parentSummary || '',
          channel: noteDraft.channel || 'internal',
          outcome: noteDraft.outcome || '',
          followUpAt: noteDraft.followUpAt || null,
          resolvedAt: noteDraft.resolvedAt || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setNoteDraft({ type: 'advisor_note', visibility: 'internal', channel: 'internal' });
      await Promise.all([loadCareLogs(selected.id), loadProgress(selected.id)]);
    } catch (error) {
      setErr(error.message || 'Failed to add advisor note');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Student Coordination"
        subtitle="Staff-first view of risk, advisor continuity, and next action."
      />

      {err && (
        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 8, padding: '12px 16px', color: '#b71c1c', marginBottom: 16 }}>
          {err}
        </div>
      )}

      {students && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
          {[
            ['Total', summary.total],
            ['Needs attention', summary.needsAttention],
            ['Urgent', summary.urgent],
            ['No advisor review', summary.noReview],
            ['Check-in due', summary.due],
          ].map(([name, value]) => (
            <div key={name} style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: '12px 14px' }}>
              <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{name}</p>
              <p style={{ margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 850 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          ['needs_attention', 'Needs attention'],
          ['no_recent_login', 'No recent login'],
          ['no_advisor_review', 'No advisor review'],
          ['parent_concern', 'Parent concern'],
          ['intervention_due', 'Intervention due'],
          ['all', 'All students'],
        ].map(([id, name]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              border: `1px solid ${filter === id ? '#1a2d5a' : '#d9e2ef'}`,
              background: filter === id ? '#1a2d5a' : '#fff',
              color: filter === id ? '#fff' : '#334155',
              borderRadius: 999,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {!students ? (
        <p style={{ color: '#888', padding: '40px 0', textAlign: 'center' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0, 1.25fr) minmax(360px, 0.75fr)' : '1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredStudents.map((student) => {
              const risk = riskStyle(student.careDisplay?.riskLevel);
              const active = selectedId === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedId(student.id)}
                  style={{
                    textAlign: 'left',
                    background: active ? '#f8fafc' : '#fff',
                    border: `1px solid ${active ? '#94a3b8' : '#e2e8f0'}`,
                    borderRadius: 8,
                    padding: 14,
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 1.4fr) minmax(120px, 0.7fr) minmax(160px, 1fr) minmax(130px, 0.8fr)',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 850, color: '#0f172a', fontSize: 14 }}>{student.name}</p>
                    <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 11 }}>
                      {student.studentCode || 'No code'}{student.currentGrade ? ` · Grade ${student.currentGrade}` : ''}
                    </p>
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', border: `1px solid ${risk.border}`, background: risk.bg, color: risk.color, borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 850 }}>
                      {label(student.careDisplay?.riskLevel)}
                    </span>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 11 }}>{label(student.careDisplay?.status)}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 700 }}>{student.careState?.advisorOwner || 'No advisor owner'}</p>
                    <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 11 }}>
                      Reviewed {fmtDate(student.careState?.lastReviewedAt)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 700 }}>
                      {activityLabel(student.daysInactive)}
                    </p>
                    <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 11 }}>
                      Login {fmtDate(student.lastLoginAt)}
                    </p>
                  </div>
                  {student.computedCare?.flags?.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '7px 9px', fontSize: 12 }}>
                      {student.computedCare.flags.join(' ')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <aside style={{ position: 'sticky', top: 16, border: '1px solid #d9e2ef', borderRadius: 10, background: '#fff', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{selected.name}</h2>
                  <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12 }}>{selected.studentCode || 'No student code'}</p>
                </div>
                <button onClick={() => setSelectedId(null)} style={{ border: '1px solid #d9e2ef', background: '#fff', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>Close</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 12 }}>
                <SelectField label="Status" value={careDraft?.status || selected.careDisplay?.status} onChange={(v) => updateCareDraft('status', v)} options={STATUS_OPTIONS} />
                <SelectField label="Risk" value={careDraft?.riskLevel || selected.careDisplay?.riskLevel} onChange={(v) => updateCareDraft('riskLevel', v)} options={RISK_OPTIONS} />
                <SelectField label="Tier" value={careDraft?.careTier || 'self_paced'} onChange={(v) => updateCareDraft('careTier', v)} options={TIER_OPTIONS} />
                <TextField label="Advisor" value={careDraft?.advisorOwner || ''} onChange={(v) => updateCareDraft('advisorOwner', v)} placeholder="Advisor name/email" />
                <TextField label="Last reviewed" type="date" value={dateInput(careDraft?.lastReviewedAt)} onChange={(v) => updateCareDraft('lastReviewedAt', v)} />
                <TextField label="Next check-in" type="date" value={dateInput(careDraft?.nextCheckInDueAt)} onChange={(v) => updateCareDraft('nextCheckInDueAt', v)} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: '#334155' }}>
                <input type="checkbox" checked={careDraft?.manualOverride === true} onChange={(e) => updateCareDraft('manualOverride', e.target.checked)} />
                Manual override computed status
              </label>

              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>Current goal</span>
                <textarea
                  value={careDraft?.currentGoal || ''}
                  onChange={(e) => updateCareDraft('currentGoal', e.target.value)}
                  rows={3}
                  style={{ width: '100%', border: '1px solid #d9e2ef', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical' }}
                  placeholder="What should happen before the next review?"
                />
              </label>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => updateCareDraft('lastReviewedAt', new Date().toISOString().slice(0, 10))} style={{ border: '1px solid #d9e2ef', background: '#fff', borderRadius: 6, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>
                  Reviewed today
                </button>
                <button onClick={saveCareState} disabled={saving} style={{ border: '1px solid #1a2d5a', background: '#1a2d5a', color: '#fff', borderRadius: 6, padding: '8px 12px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>
                  Save state
                </button>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>Add advisor note</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
                  <SelectField label="Type" value={noteDraft.type} onChange={(v) => setNoteDraft((p) => ({ ...p, type: v }))} options={LOG_TYPES} />
                  <SelectField label="Channel" value={noteDraft.channel} onChange={(v) => setNoteDraft((p) => ({ ...p, channel: v }))} options={CHANNELS} />
                  <SelectField label="Visibility" value={noteDraft.visibility} onChange={(v) => setNoteDraft((p) => ({ ...p, visibility: v }))} options={['internal', 'parent_safe']} />
                  <TextField label="Follow-up" type="date" value={noteDraft.followUpAt || ''} onChange={(v) => setNoteDraft((p) => ({ ...p, followUpAt: v }))} />
                </div>
                <TextField label="Title" value={noteDraft.title || ''} onChange={(v) => setNoteDraft((p) => ({ ...p, title: v }))} placeholder="Short note title" />
                <label style={{ display: 'block', marginTop: 9 }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>Internal note</span>
                  <textarea
                    value={noteDraft.bodyInternal || ''}
                    onChange={(e) => setNoteDraft((p) => ({ ...p, bodyInternal: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', border: '1px solid #d9e2ef', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical' }}
                  />
                </label>
                <label style={{ display: 'block', marginTop: 9 }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>Parent-safe summary</span>
                  <textarea
                    value={noteDraft.parentSummary || ''}
                    onChange={(e) => setNoteDraft((p) => ({ ...p, parentSummary: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', border: '1px solid #d9e2ef', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical' }}
                  />
                </label>
                <button onClick={addCareLog} disabled={saving} style={{ marginTop: 9, border: '1px solid #166534', background: '#166534', color: '#fff', borderRadius: 6, padding: '8px 12px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>
                  Add note
                </button>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>Recent advisor memory</h3>
                <NoteLog logs={careLogs} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link to={`/admin/students/${selected.id}/audit-trail`} style={{ fontSize: 12, fontWeight: 800, color: '#1a2d5a' }}>Audit trail</Link>
                  <Link to={`/admin/transcript/${selected.id}`} style={{ fontSize: 12, fontWeight: 800, color: '#1a2d5a' }}>Transcript</Link>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </AdminPage>
  );
}
