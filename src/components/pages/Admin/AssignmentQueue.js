import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import { AdminNav } from './AdminChrome';
import { getAdminSession } from '../../../api/authStorage';

const API = getApiBase();

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const RUBRIC = [
  { label: 'Completion', detail: 'Addresses every required part of the prompt.' },
  { label: 'Accuracy', detail: 'Uses correct concepts, calculations, sources, or course vocabulary.' },
  { label: 'Reasoning / evidence', detail: 'Explains the answer and supports claims with examples or data.' },
  { label: 'Clarity', detail: 'Organized, readable, and submitted in a form parents can understand.' },
];

function reviewStatus(submittedAt, gradedAt) {
  if (gradedAt) return { label: 'Reviewed', color: '#2e7d32' };
  const ageDays = Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86400000);
  if (ageDays >= 5) return { label: 'Review due', color: '#b91c1c' };
  return { label: `${5 - ageDays}d target`, color: '#e65100' };
}

export default function AssignmentQueue() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('false'); // 'false' = pending, 'true' = graded, '' = all
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const session = getAdminSession();
  useEffect(() => { if (!session) navigate('/admin/login', { replace: true }); }, [session, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === '' ? `${API}/api/admin/assignments` : `${API}/api/admin/assignments?graded=${filter}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login', { replace: true }); return; }
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => { if (session) load(); }, [session, load]);

  async function submitGrade(id) {
    if (!feedback.trim()) return;
    if (score === '') {
      setToast('Score is required');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      setToast('Score must be between 0 and 100');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback: feedback.trim(), score: numericScore }),
      });
      if (!res.ok) { setToast('Error saving grade'); return; }
      setToast('Graded successfully');
      setExpanded(null);
      setFeedback('');
      setScore('');
      load();
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  if (!session) return null;

  return (
    <>
      <Helmet><title>Assignment Queue | GIIS Admin</title></Helmet>

      <div className="giis-admin-page" style={{ fontFamily: 'Inter, sans-serif', background: '#f4f6fa', minHeight: '100vh', padding: '24px 28px 80px', overflowX: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Admin</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Assignment Queue</h1>
            </div>
          </div>

          <AdminNav />

          {/* Filter tabs */}
          <div className="giis-admin-filter-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['false', 'Pending'], ['true', 'Graded'], ['', 'All']].map(([v, label]) => (
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

          {/* List */}
          {loading
            ? <p style={{ color: '#9aa0ad', fontSize: 14 }}>Loading…</p>
            : items.length === 0
              ? <div style={{ background: '#fff', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#9aa0ad', fontSize: 14 }}>
                  {filter === 'false' ? 'No pending submissions 🎉' : 'No submissions found.'}
                </div>
              : items.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf5', marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1d24' }}>
                          {item.student.name}
                        </span>
                        <span style={{ fontSize: 11, color: '#9aa0ad' }}>#{item.student.studentCode}</span>
                        <span style={{ fontSize: 11, background: '#f0f4ff', color: '#2b3d6d', fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>
                          {item.course.name} · Module {item.moduleOrder}
                        </span>
                        {(() => {
                          const status = reviewStatus(item.submittedAt, item.gradedAt);
                          return (
                            <span style={{ fontSize: 11, background: `${status.color}18`, color: status.color, fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p style={{ fontSize: 12, color: '#9aa0ad', margin: 0 }}>Submitted {timeAgo(item.submittedAt)}</p>
                      {item.assignmentProfile && (
                        <p style={{ fontSize: 12, color: '#8a6a14', margin: '4px 0 0', fontWeight: 700 }}>
                          {item.assignmentProfile.label} · {item.assignmentProfile.evidence}
                        </p>
                      )}
                      {item.gradedAt && (
                        <p style={{ fontSize: 12, color: '#2e7d32', margin: '2px 0 0', fontWeight: 600 }}>
                          ✓ Graded {timeAgo(item.gradedAt)} {item.score != null ? `· ${item.score}/100` : ''}
                        </p>
                      )}
                    </div>
                    <button onClick={() => { setExpanded(expanded === item.id ? null : item.id); setFeedback(item.feedback || ''); setScore(item.score != null ? String(item.score) : ''); }}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: 'none', fontSize: 13, fontWeight: 600, color: '#2b3d6d', cursor: 'pointer' }}>
                      {expanded === item.id ? 'Close' : item.gradedAt ? 'View / Edit' : 'Grade'}
                    </button>
                  </div>

                  {expanded === item.id && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f0f2f8' }}>
                      {item.assignmentPrompt && (
                        <>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '16px 0 8px' }}>Assignment Prompt</p>
                          <div style={{ background: '#fffdf5', border: '1px solid #f3d98b', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#4d3b00', lineHeight: 1.6 }}>
                            <p style={{ margin: '0 0 6px', fontWeight: 800, color: '#8a6a14' }}>
                              {item.moduleTitle ? `${item.moduleTitle} · ` : ''}{item.assignmentProfile?.label || 'Learning Evidence'}
                            </p>
                            <p style={{ margin: 0 }}>{item.assignmentPrompt}</p>
                          </div>
                        </>
                      )}
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '16px 0 8px' }}>Submission</p>
                      <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#1a1d24', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
                        {item.content}
                      </div>
                      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 14px', marginTop: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#8a6a14', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>GIIS review rubric</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                          {RUBRIC.map((item) => (
                            <div key={item.label} style={{ background: '#fff', border: '1px solid #f5dfa3', borderRadius: 7, padding: '9px 10px' }}>
                              <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 800, color: '#1a1d24' }}>{item.label}</p>
                              <p style={{ margin: 0, fontSize: 11, color: '#5c6578', lineHeight: 1.45 }}>{item.detail}</p>
                            </div>
                          ))}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#8a6a14', lineHeight: 1.45 }}>
                          {item.assignmentProfile?.rubricFocus || 'Use the score for learning quality, not just completion.'} Feedback should name one strength, one correction, and one next action.
                        </p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginTop: 16 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Feedback</p>
                          <textarea
                            value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                            placeholder="Write feedback for the student…"
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d4d8e0', borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Score (/100)</p>
                          <input
                            type="number" min={0} max={100} value={score} onChange={e => setScore(e.target.value)}
                            placeholder="Required"
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d4d8e0', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => submitGrade(item.id)} disabled={saving || !feedback.trim() || score === ''}
                        style={{ marginTop: 12, padding: '10px 20px', borderRadius: 8, background: saving || !feedback.trim() || score === '' ? '#9baac8' : '#2b3d6d', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: saving || !feedback.trim() || score === '' ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Saving…' : 'Submit Grade'}
                      </button>
                    </div>
                  )}
                </div>
              ))
          }
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </>
  );
}
