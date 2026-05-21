import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from './AdminChrome';

const API = getApiBase();

function activityLabel(daysInactive, lastActivity) {
  if (daysInactive === null) return { text: 'Never active', color: '#b71c1c', bg: '#ffebee' };
  if (daysInactive === 0) return { text: 'Today', color: '#1b5e20', bg: '#e8f5e9' };
  if (daysInactive === 1) return { text: 'Yesterday', color: '#1b5e20', bg: '#e8f5e9' };
  if (daysInactive <= 6) return { text: `${daysInactive}d ago`, color: '#1b5e20', bg: '#e8f5e9' };
  if (daysInactive <= 13) return { text: `${daysInactive}d ago`, color: '#e65100', bg: '#fff3e0' };
  return { text: `${daysInactive}d ago`, color: '#b71c1c', bg: '#ffebee' };
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminProgressPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [students, setStudents] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!session) { navigate('/admin/login', { replace: true }); return; }
    fetch(`${API}/api/students/progress`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setStudents(d.students || []))
      .catch(() => setErr('Failed to load progress data'));
  }, [session, navigate]);

  if (!session) return null;

  const neverActive = (students || []).filter((s) => s.daysInactive === null).length;
  const inactive14 = (students || []).filter((s) => s.daysInactive !== null && s.daysInactive >= 14).length;
  const active7 = (students || []).filter((s) => s.daysInactive !== null && s.daysInactive <= 6).length;
  const totalOfficialCredits = (students || []).reduce((sum, st) => sum + (Number(st.officialCreditsEarned) || 0), 0);
  const totalPortalCredits = (students || []).reduce((sum, st) => sum + (Number(st.portalCreditsEarned) || 0), 0);
  const issueCount = (students || []).filter((s) => (s.consistency || []).length > 0).length;

  return (
    <AdminPage>
        <AdminHeader
          title="Student Progress"
          subtitle="Focus on inactivity, credits, and students who need attention."
        />

        {err && (
          <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '12px 16px', color: '#b71c1c', marginBottom: '20px' }}>
            {err}
          </div>
        )}

        {/* Summary stats */}
        {students && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Total Students', value: students.length, color: '#2b3d6d', bg: '#fff' },
              { label: 'Active (7d)', value: active7, color: '#1b5e20', bg: '#f1f8e9' },
              { label: 'Inactive 14d+', value: inactive14, color: '#b71c1c', bg: '#ffebee' },
              { label: 'Never Active', value: neverActive, color: '#b71c1c', bg: '#ffebee' },
              { label: 'Official Credits', value: totalOfficialCredits.toFixed(1), color: '#2b3d6d', bg: '#f0f4ff' },
              { label: 'Portal Credits', value: totalPortalCredits.toFixed(1), color: '#2e7d32', bg: '#f1f8e9' },
              { label: 'Data Notes', value: issueCount, color: issueCount ? '#e65100' : '#64748b', bg: issueCount ? '#fff3e0' : '#fff' },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, border: '1px solid #e0e6f0', borderRadius: '12px', padding: '16px 20px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: '26px', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Student list */}
        {!students ? (
          <p style={{ color: '#888', padding: '40px 0', textAlign: 'center' }}>Loading…</p>
        ) : students.length === 0 ? (
          <p style={{ color: '#888', padding: '40px 0', textAlign: 'center' }}>No active students.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {students.map((s) => {
              const badge = activityLabel(s.daysInactive, s.lastActivity);
              const officialCredits = Number(s.officialCreditsEarned ?? s.creditsEarned) || 0;
              const portalCredits = Number(s.portalCreditsEarned) || 0;
              const pct = Math.min(100, (officialCredits / 24) * 100);
              const modulePct = s.totalModules ? Math.min(100, (s.completedModules / s.totalModules) * 100) : 0;
              return (
                <div key={s.id} style={{
                  background: '#fff', border: '1px solid #e0e6f0', borderRadius: '10px',
                  padding: '16px 20px', display: 'flex', alignItems: 'center',
                  gap: '16px', flexWrap: 'wrap',
                }}>
                  {/* Name + code */}
                  <div style={{ minWidth: '160px', flex: '2' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{s.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>
                      {s.studentCode || '—'}{s.currentGrade ? ` · Grade ${s.currentGrade}` : ''}
                    </p>
                  </div>

                  {/* Credits progress */}
                  <div style={{ minWidth: '140px', flex: '2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#666' }}>Official credits</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d' }}>
                        {officialCredits % 1 === 0 ? officialCredits : officialCredits.toFixed(1)} / 24
                      </span>
                    </div>
                    <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '5px' }}>
                      <div style={{ width: `${pct}%`, background: '#2b3d6d', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#777' }}>
                      Learn Portal: {portalCredits % 1 === 0 ? portalCredits : portalCredits.toFixed(1)} credits
                    </p>
                  </div>

                  {/* Courses */}
                  <div style={{ minWidth: '110px', flex: '1', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1a1a2e' }}>
                      {s.completedModules}/{s.totalModules}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Modules</p>
                    <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '4px', marginTop: 5 }}>
                      <div style={{ width: `${modulePct}%`, background: '#2e7d32', borderRadius: '4px', height: '100%' }} />
                    </div>
                  </div>

                  <div style={{ minWidth: '80px', flex: '1', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2e7d32' }}>
                      {s.submittedQuizzes}/{s.submittedExams}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Quiz / Exams</p>
                  </div>

                  <div style={{ minWidth: '110px', flex: '1', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1a1a2e' }}>
                      {s.completed}/{s.totalEnrollments}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Courses Done</p>
                  </div>

                  {/* Last activity */}
                  <div style={{ minWidth: '120px', flex: '1.5' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 700, color: badge.color,
                      background: badge.bg, padding: '3px 10px', borderRadius: '20px',
                      display: 'inline-block', marginBottom: '3px',
                    }}>
                      {badge.text}
                    </span>
                    <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>
                      {s.lastActivity ? fmt(s.lastActivity) : 'No activity yet'}
                    </p>
                  </div>

                  {(s.consistency || []).length > 0 && (
                    <div style={{
                      flexBasis: '100%',
                      background: '#fff8e1',
                      border: '1px solid #ffe0a3',
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: '#6d4c00',
                      fontSize: 12,
                    }}>
                      {(s.consistency || []).join(' ')}
                    </div>
                  )}

                  {/* Action */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Link to={`/admin/students/${s.id}/audit-trail`} style={{
                      fontSize: '12px', fontWeight: 700, color: '#1a2d5a', textDecoration: 'none',
                      padding: '6px 12px', border: '1.5px solid #1a2d5a', borderRadius: '6px',
                      whiteSpace: 'nowrap', background: '#fff',
                    }}>
                      Audit Trail
                    </Link>
                    <Link to={`/admin/transcript/${s.id}`} style={{
                      fontSize: '12px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none',
                      padding: '6px 14px', border: '1.5px solid #2b3d6d', borderRadius: '6px',
                      whiteSpace: 'nowrap',
                    }}>
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </AdminPage>
  );
}
