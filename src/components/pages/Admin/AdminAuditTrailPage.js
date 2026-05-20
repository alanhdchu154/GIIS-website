import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

/**
 * /admin/students/:id/audit-trail
 *
 * Evidence chain for one student — what a college admissions reviewer or a
 * Florida DOE audit team would want to see to verify learning actually happened
 * on the platform. Backend: GET /api/students/:id/audit-trail.
 *
 * RF-1 / T-001.
 */

const KIND_LABEL = {
  module_complete: { en: 'Module completed', zh: '模块完成', color: '#1b5e20', bg: '#e8f5e9' },
  video_complete: { en: 'Video completed', zh: '视频完成', color: '#6a1b9a', bg: '#f3e5f5' },
  supplemental_video_complete: { en: 'Video completed', zh: '视频完成', color: '#6a1b9a', bg: '#f3e5f5' },
  reading_complete: { en: 'Reading completed', zh: '阅读完成', color: '#00695c', bg: '#e0f2f1' },
  practice_complete: { en: 'Practice completed', zh: '练习完成', color: '#4527a0', bg: '#ede7f6' },
  quiz_attempt: { en: 'Quiz attempt', zh: '小测', color: '#0d47a1', bg: '#e3f2fd' },
  assignment_submit: { en: 'Assignment submitted', zh: '作业提交', color: '#4a148c', bg: '#f3e5f5' },
  exam_attempt: { en: 'Exam attempt', zh: '考试', color: '#b71c1c', bg: '#ffebee' },
  admin_action: { en: 'Admin action', zh: '管理记录', color: '#5d4037', bg: '#efebe9' },
};

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, value, color = '#2b3d6d', bg = '#fff' }) {
  return (
    <div style={{ background: bg, border: '1px solid #e0e6f0', borderRadius: 12, padding: '14px 18px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function TimelineRow({ event }) {
  const meta = KIND_LABEL[event.kind] || KIND_LABEL.admin_action;
  let summary = '';
  if (event.kind === 'module_complete') {
    summary = `${event.courseName} · ${event.moduleTitle}`;
  } else if (['video_complete', 'supplemental_video_complete', 'reading_complete', 'practice_complete'].includes(event.kind)) {
    const activity = {
      video_complete: 'video',
      supplemental_video_complete: 'supplemental video',
      reading_complete: 'reading',
      practice_complete: 'practice',
    }[event.kind];
    summary = `${event.courseName} · Module ${event.moduleOrder} ${activity} · ${event.moduleTitle}`;
  } else if (event.kind === 'quiz_attempt') {
    const sc = event.score != null ? ` · ${Number(event.score).toFixed(0)}%` : '';
    const pf = event.passed ? ' · ✓ passed' : '';
    summary = `${event.courseName} · Module ${event.moduleOrder} quiz${sc}${pf}`;
  } else if (event.kind === 'assignment_submit') {
    const sc = event.score != null ? ` · ${Number(event.score).toFixed(0)}%` : '';
    const grad = event.graded ? ' · graded' : ' · awaiting grading';
    summary = `${event.courseName} · Module ${event.moduleOrder} assignment${sc}${grad}`;
  } else if (event.kind === 'exam_attempt') {
    const sc = event.score != null ? ` · ${Number(event.score).toFixed(0)}%` : '';
    const pf = event.passed === true ? ' · ✓ passed' : event.passed === false ? ' · ✗ not passed' : '';
    summary = `${event.courseName} · ${(event.examType || '').toUpperCase()} exam${sc}${pf}`;
  } else if (event.kind === 'admin_action') {
    summary = `${event.action} — by ${event.actorEmail} (${event.actorRole})`;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 140px 1fr', gap: 12, alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid #f0f2f7' }}>
      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: '#444' }}>{fmtDateTime(event.at)}</div>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: '3px 8px', borderRadius: 6 }}>
          {meta.en}
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#1a1a2e' }}>{summary}</div>
    </div>
  );
}

function CourseRow({ c }) {
  const pct = c.modulesTotal ? Math.round((c.modulesCompleted / c.modulesTotal) * 100) : 0;
  return (
    <tr>
      <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600 }}>
        {c.name}
        {c.gradeLevel ? <span style={{ marginLeft: 6, color: '#888', fontWeight: 400, fontSize: 11 }}>G{c.gradeLevel}</span> : null}
        <div style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>{c.semesterLabel}</div>
      </td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>
        {c.modulesCompleted}/{c.modulesTotal}
        <div style={{ background: '#f0f2f7', height: 4, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#1b5e20' : pct >= 40 ? '#e65100' : '#b71c1c' }} />
        </div>
      </td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{c.estimatedHrs}h</td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{c.quizPassed}/{c.quizAttempts}</td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{c.assignmentsGraded}/{c.assignments}</td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{c.examsPassed}/{c.exams}</td>
      <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>
        {c.creditEarned ? <span style={{ color: '#1b5e20', fontWeight: 700 }}>✓ {fmtDate(c.creditEarnedAt)}</span> : <span style={{ color: '#888' }}>—</span>}
      </td>
    </tr>
  );
}

export default function AdminAuditTrailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const session = getAdminSession();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!session) { navigate('/admin/login', { replace: true }); return; }
    fetch(`${API}/api/students/${studentId}/audit-trail`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch((s) => setErr(`Failed to load audit trail (${s || 'network'})`));
  }, [session, studentId, navigate]);

  const filteredTimeline = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.timeline;
    if (filter === 'video_complete') {
      return data.timeline.filter((e) => e.kind === 'video_complete' || e.kind === 'supplemental_video_complete');
    }
    return data.timeline.filter((e) => e.kind === filter);
  }, [data, filter]);

  async function exportPdf() {
    if (!data) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const node = document.getElementById('audit-trail-print-root');
      if (!node) return;
      const canvas = await html2canvas(node, { backgroundColor: '#ffffff', scale: 2 });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 20;
      let remaining = imgHeight;
      // Multi-page slice
      const sliceHeight = pageHeight - 40;
      let offset = 0;
      while (remaining > 0) {
        pdf.addImage(img, 'PNG', 20, y - offset, imgWidth, imgHeight);
        remaining -= sliceHeight;
        if (remaining > 0) {
          pdf.addPage();
          offset += sliceHeight;
          y = 20;
        }
      }
      const code = data.student.studentCode || data.student.id.slice(0, 8);
      pdf.save(`audit-trail-${code}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      setErr('PDF export failed — please retry');
    } finally {
      setExporting(false);
    }
  }

  if (!session) return null;
  if (err) {
    return <div style={{ padding: 40, color: '#b71c1c' }}>{err} · <Link to="/admin">Back</Link></div>;
  }
  if (!data) return <div style={{ padding: 40, color: '#888' }}>Loading…</div>;

  const s = data.student;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 5% 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 4px' }}>Admin · Audit Trail</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
              {s.name} <span style={{ fontSize: 14, fontWeight: 500, color: '#888' }}>· {s.studentCode}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/admin/transcript/${s.id}`} style={{ fontSize: 13, color: '#2b3d6d', textDecoration: 'none', fontWeight: 600, padding: '8px 14px', border: '1px solid #d0d6e3', borderRadius: 8, background: '#fff' }}>
              View Transcript
            </Link>
            <button onClick={exportPdf} disabled={exporting} style={{ fontSize: 13, color: '#fff', fontWeight: 700, padding: '8px 16px', border: 'none', borderRadius: 8, background: exporting ? '#888' : '#1a2d5a', cursor: exporting ? 'wait' : 'pointer' }}>
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </div>

        <div id="audit-trail-print-root" style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e0e6f0' }}>
          {/* Identity block */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e8ebf2' }}>
            <div><div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2 }}>Student Code</div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.studentCode || '—'}</div></div>
            <div><div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2 }}>Login Email</div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.loginEmail || '—'}</div></div>
            <div><div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2 }}>Entry Date</div><div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(s.entryDate)}</div></div>
            <div><div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2 }}>Graduation</div><div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(s.graduationDate)}</div></div>
            <div><div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2 }}>Generated</div><div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateTime(data.generatedAt)}</div></div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 22 }}>
            <StatCard label="Est. Hours" value={`${data.totals.estimatedHrs}h`} color="#1a2d5a" />
            <StatCard label="Modules Done" value={data.totals.modulesCompleted} />
            <StatCard label="Quiz Passed" value={`${data.totals.quizPassed} / ${data.totals.quizAttempts}`} />
            <StatCard label="Assignments" value={`${data.totals.assignmentsGraded} / ${data.totals.assignments}`} />
            <StatCard label="Exams Passed" value={`${data.totals.examsPassed} / ${data.totals.exams}`} />
            <StatCard label="Courses" value={data.courses.length} />
          </div>

          {/* Per-course table */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px' }}>Course breakdown</h2>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f4f6fa', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Course</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Modules</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Est. Hrs</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Quiz P/T</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Asg G/T</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Exam P/T</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((c) => <CourseRow key={c.courseId} c={c} />)}
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Activity timeline</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: '1px solid #d0d6e3', borderRadius: 6 }}>
              <option value="all">All events ({data.timeline.length})</option>
              <option value="quiz_attempt">Quiz only</option>
              <option value="assignment_submit">Assignments only</option>
              <option value="exam_attempt">Exams only</option>
              <option value="module_complete">Module completions</option>
              <option value="video_complete">Videos only</option>
              <option value="reading_complete">Readings only</option>
              <option value="practice_complete">Practice only</option>
              <option value="admin_action">Admin actions</option>
            </select>
          </div>
          {filteredTimeline.length === 0 ? (
            <div style={{ padding: '24px 0', color: '#888', fontSize: 13 }}>No activity recorded.</div>
          ) : (
            <div>
              {filteredTimeline.map((e, i) => <TimelineRow key={i} event={e} />)}
            </div>
          )}

          <p style={{ marginTop: 22, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
            This audit trail is generated from the GIIS Learn platform database. "Estimated hours" sums
            <code style={{ background: '#f4f6fa', padding: '1px 4px', borderRadius: 3, margin: '0 3px' }}>CourseModule.estimatedHrs</code>
            for each completed module — it is an upper bound, not measured session time. Video, reading, and
            practice completion timestamps are first-completion records from the Learn Portal.
          </p>
        </div>
      </div>
    </div>
  );
}
