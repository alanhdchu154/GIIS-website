import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import { getApiBase } from '../../../config/apiBase';
import { getParentSession, clearParentSession } from '../../../api/authStorage';

const API = getApiBase();
const GRAD_CREDITS = 24;

const DEPT_COLORS = {
  'Computer Science': '#1565C0', 'Mathematics': '#4527A0', 'Economics': '#1B6B3A',
  'Business': '#C84B0A', 'Engineering': '#B71C1C', 'Psychology': '#5b2c6f',
  'Communications': '#E65100', 'Arts': '#6A1B9A', 'Science': '#00695C',
  'English': '#1565C0', 'History': '#5D4037', 'Social Studies': '#37474F',
};

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', flex: '1 1 auto', minWidth: 100 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function ActivityRow({ event, isEn }) {
  const colors = {
    exam: { bg: '#e8f5e9', fg: '#2e7d32', icon: '✓' },
    quiz: { bg: '#e3f2fd', fg: '#2b3d6d', icon: '📝' },
    assignment: { bg: '#fff3e0', fg: '#e65100', icon: 'A' },
    assignment_feedback: { bg: '#e8f5e9', fg: '#2e7d32', icon: 'F' },
    video: { bg: '#f3e5f5', fg: '#6a1b9a', icon: '▶' },
    supplemental_video: { bg: '#f3e5f5', fg: '#6a1b9a', icon: '▶' },
    reading: { bg: '#e0f2f1', fg: '#00695c', icon: 'R' },
    practice: { bg: '#ede7f6', fg: '#4527a0', icon: 'P' },
  };
  const c = colors[event.type] || colors.quiz;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f0f2f8' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
        {c.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#1a1d24' }}>
          {event.course}
          {event.type === 'exam' && (isEn
            ? ` — ${event.passed ? 'Passed' : 'Attempted'} ${event.examType === 'midterm' ? 'midterm' : 'final'} exam`
            : ` — ${event.passed ? '通过' : '参加'}${event.examType === 'midterm' ? '期中考' : '期末考'}`)}
          {event.type === 'quiz' && (isEn ? ` — Module ${event.moduleOrder} quiz` : ` — 第 ${event.moduleOrder} 模块测验`)}
          {event.type === 'assignment' && (isEn ? ` — Module ${event.moduleOrder} assignment submitted` : ` — 第 ${event.moduleOrder} 模块作业已提交`)}
          {event.type === 'assignment_feedback' && (isEn ? ` — Module ${event.moduleOrder} assignment feedback` : ` — 第 ${event.moduleOrder} 模块作业已批改`)}
          {event.type === 'video' && (isEn ? ` — Module ${event.moduleOrder} video completed` : ` — 第 ${event.moduleOrder} 模块视频完成`)}
          {event.type === 'supplemental_video' && (isEn ? ` — Module ${event.moduleOrder} supplemental video completed` : ` — 第 ${event.moduleOrder} 模块补充视频完成`)}
          {event.type === 'reading' && (isEn ? ` — Module ${event.moduleOrder} reading completed` : ` — 第 ${event.moduleOrder} 模块阅读完成`)}
          {event.type === 'practice' && (isEn ? ` — Module ${event.moduleOrder} practice completed` : ` — 第 ${event.moduleOrder} 模块练习完成`)}
          {event.score != null && <span style={{ fontWeight: 400, color: '#5c6578' }}> ({Number(event.score).toFixed(0)}%)</span>}
          {event.type === 'assignment' && event.hasFeedback && <span style={{ color: '#2e7d32', fontWeight: 400 }}> {isEn ? '· Feedback received' : '· 已收到反馈'}</span>}
          {event.type === 'assignment_feedback' && event.score != null && <span style={{ color: '#2e7d32', fontWeight: 400 }}> {isEn ? '· Reviewed work' : '· 已审阅作业'}</span>}
        </p>
        {event.type === 'assignment_feedback' && event.feedback && (
          <div style={{ margin: '6px 0 4px', background: '#f1f8f2', border: '1px solid #cde8d1', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 800, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              {isEn ? 'Teacher feedback' : '教师评语'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#31543a', lineHeight: 1.45 }}>
              {event.feedback.length > 180 ? `${event.feedback.slice(0, 180)}...` : event.feedback}
            </p>
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, color: '#9aa0ad' }}>
          {new Date(event.at).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

function pacingStyle(status) {
  if (status === 'behind') return { bg: '#fff3e0', fg: '#b45309', border: '#f4c36a' };
  if (status === 'ahead') return { bg: '#e8f5e9', fg: '#2e7d32', border: '#a5d6a7' };
  return { bg: '#f0f4ff', fg: '#2b3d6d', border: '#c5d0f0' };
}

function CourseBar({ enr, isEn }) {
  const color = DEPT_COLORS[enr.department] || '#2b3d6d';
  const pct = (enr.totalModules ?? 0) > 0 ? Math.round((enr.completedModules / enr.totalModules) * 100) : 0;
  const pacing = enr.pacing || { status: 'on_track', label: isEn ? 'On Track' : '进度正常' };
  const paceColors = pacingStyle(pacing.status);
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f2f8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d24' }}>{isEn ? enr.name : (enr.nameZh || enr.name)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!enr.creditEarned && (
            <span style={{ fontSize: 10, fontWeight: 800, color: paceColors.fg, background: paceColors.bg, border: `1px solid ${paceColors.border}`, borderRadius: 999, padding: '3px 8px' }}>
              {isEn ? pacing.label : pacing.status === 'behind' ? `落后 ${Math.abs(pacing.deltaModules || 0)} 模块` : pacing.status === 'ahead' ? `领先 ${pacing.deltaModules || 0} 模块` : '进度正常'}
            </span>
          )}
          <span style={{ fontSize: 12, color: enr.creditEarned ? '#2e7d32' : '#5c6578', fontWeight: enr.creditEarned ? 700 : 400 }}>
            {enr.creditEarned ? (isEn ? '✓ Credit earned' : '✓ 已获学分') : `${enr.completedModules} / ${enr.totalModules ?? '?'} ${isEn ? 'modules' : '模块'}`}
          </span>
        </div>
      </div>
      <div style={{ height: 6, background: '#e8ecf5', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      {enr.assessment && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {[
            `${enr.assessment.quizzesSubmitted}/${enr.totalModules ?? '?'} ${isEn ? 'quizzes' : '测验'}`,
            `${enr.assessment.assignmentsReviewed}/${enr.totalModules ?? '?'} ${isEn ? 'assignments reviewed' : '作业已批改'}`,
            `${isEn ? 'Midterm' : '期中'}: ${enr.assessment.midterm ? `${Math.round(enr.assessment.midterm.score)}%` : (isEn ? 'pending' : '未完成')}`,
            `${isEn ? 'Final' : '期末'}: ${enr.assessment.final ? `${Math.round(enr.assessment.final.score)}%` : (isEn ? 'pending' : '未完成')}`,
          ].map((label) => (
            <span key={label} style={{ fontSize: 10, fontWeight: 700, color: '#5c6578', background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: 999, padding: '3px 8px' }}>
              {label}
            </span>
          ))}
        </div>
      )}
      {enr.weeklyInsights && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {[
            `${enr.weeklyInsights.activeDays} ${isEn ? 'active days' : '天有学习记录'}`,
            `${enr.weeklyInsights.modulesCompleted} ${isEn ? 'modules completed' : '模块完成'}`,
            `${enr.weeklyInsights.quizAttempts} ${isEn ? 'quizzes' : '次测验'}`,
            `${enr.weeklyInsights.assignmentSubmissions} ${isEn ? 'assignments' : '份作业'}`,
          ].map((label) => (
            <span key={label} style={{ fontSize: 10, fontWeight: 700, color: '#5c6578', background: '#fff', border: '1px solid #e0e6f0', borderRadius: 999, padding: '3px 8px' }}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentHistory({ enrollments, isEn }) {
  const rows = enrollments
    .flatMap((enr) => (enr.assignments || []).map((assignment) => ({ ...assignment, course: isEn ? enr.name : (enr.nameZh || enr.name) })))
    .sort((a, b) => new Date(b.gradedAt || b.submittedAt) - new Date(a.gradedAt || a.submittedAt));

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
          {isEn ? 'Assignments & Feedback' : '作业与批改反馈'}
        </p>
        <span style={{ fontSize: 11, color: '#5c6578' }}>
          {isEn ? `${rows.length} submitted` : `已提交 ${rows.length} 份`}
        </span>
      </div>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9aa0ad', margin: 0 }}>
          {isEn ? 'No assignment submissions yet.' : '目前还没有作业提交记录。'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.slice(0, 8).map((assignment) => {
            const reviewed = assignment.status === 'reviewed';
            return (
              <div key={`${assignment.course}-${assignment.moduleOrder}-${assignment.submittedAt}`} style={{ border: '1px solid #e0e6f0', borderRadius: 10, padding: '12px 14px', background: reviewed ? '#f8fcf9' : '#fffaf2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 800, color: '#1a1d24' }}>
                      {assignment.course} · {isEn ? `Module ${assignment.moduleOrder}` : `第 ${assignment.moduleOrder} 模块`}
                    </p>
                    {assignment.moduleTitle && (
                      <p style={{ margin: 0, fontSize: 12, color: '#5c6578', lineHeight: 1.4 }}>{assignment.moduleTitle}</p>
                    )}
                  </div>
                  <span style={{ flexShrink: 0, borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 800, color: reviewed ? '#2e7d32' : '#9a5b00', background: reviewed ? '#e8f5e9' : '#fff3e0' }}>
                    {reviewed ? (isEn ? 'Reviewed' : '已批改') : (isEn ? 'Submitted' : '已提交')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#5c6578' }}>
                    {isEn ? 'Submitted' : '提交'}: {new Date(assignment.submittedAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
                  </span>
                  {assignment.gradedAt && (
                    <span style={{ fontSize: 11, color: '#5c6578' }}>
                      {isEn ? 'Reviewed' : '批改'}: {new Date(assignment.gradedAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {assignment.score != null && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#2e7d32' }}>
                      {Math.round(assignment.score)} / 100
                    </span>
                  )}
                </div>
                {assignment.feedback && (
                  <div style={{ marginTop: 10, background: '#fff', border: '1px solid #dceee0', borderRadius: 8, padding: '9px 10px' }}>
                    <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 800, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      {isEn ? 'Reviewed by GIIS academic team' : 'GIIS 教学团队批改'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#31543a', lineHeight: 1.45 }}>{assignment.feedback}</p>
                  </div>
                )}
                {!assignment.feedback && assignment.contentPreview && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#8a6a14', lineHeight: 1.45 }}>
                    {isEn ? 'Submission preview' : '提交内容预览'}: {assignment.contentPreview}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ParentDashboard({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(null);

  const session = useMemo(() => getParentSession(), []);

  useEffect(() => {
    if (!session) { navigate('/parent/login', { replace: true }); return; }
  }, [session, navigate]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/parent/me`, { credentials: 'include' });
      if (res.status === 401) { clearParentSession(); navigate('/parent/login', { replace: true }); return; }
      if (!res.ok) { setError(isEn ? 'Failed to load data.' : '加载失败。'); return; }
      setError('');
      setData(await res.json());
    } catch {
      setError(isEn ? 'Network error.' : '网络错误。');
    }
  }, [isEn, navigate]);

  useEffect(() => { if (session) load(); }, [session, load]);

  function handleLogout() {
    fetch(`${API}/api/parent/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    clearParentSession();
    navigate('/parent/login', { replace: true });
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${API}/api/billing/portal`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) { setPortalError(json.error || 'Could not open billing portal.'); return; }
      window.location.href = json.url;
    } catch {
      setPortalError('Network error — please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleStartCheckout() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${API}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planType: 'founders_monthly', email: session.email }),
      });
      const json = await res.json();
      if (!res.ok) { setPortalError(json.error || 'Could not start checkout.'); return; }
      window.location.href = json.url;
    } catch {
      setPortalError('Network error — please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  if (!session) return null;

  if (!data && !error) {
    return (
      <>
        <div className="row"><Nav language={language} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'Inter, sans-serif', color: '#5c6578' }}>
          {isEn ? 'Loading…' : '加载中…'}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="row"><Nav language={language} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'Inter, sans-serif', color: '#b91c1c' }}>
          {error}
        </div>
      </>
    );
  }

  const { student, stats, enrollments, recentActivity, subscription } = data;
  const gradPct = Math.min(100, Math.round((stats.creditsEarned / GRAD_CREDITS) * 100));
  const inProgress = enrollments.filter(e => !e.creditEarned);
  const completed = enrollments.filter(e => e.creditEarned);
  const activitySignalCount = recentActivity.length + enrollments.reduce((sum, e) => (
    sum + Number(e.completedModules || 0) + Number(e.assessment?.assignmentsSubmitted || 0) + Number(e.assessment?.quizzesSubmitted || 0)
  ), 0);
  const hasLimitedEvidence = activitySignalCount < 5;

  return (
    <>
      <Helmet>
        <title>{isEn ? `${student.name}'s Dashboard` : `${student.name} 的进度面板`} | GIIS</title>
      </Helmet>

      <div className="row"><Nav language={language} /></div>

      <div style={{ background: '#f4f6fa', fontFamily: 'Inter, sans-serif', minHeight: 'calc(100vh - 70px)', padding: '28px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {isEn ? 'Parent Portal' : '家长面板'}
              </p>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                {isEn ? `${student.name.split(' ')[0]}'s progress` : `${student.name} 的进度`}
                {student.studentCode && <span style={{ fontSize: 14, fontWeight: 500, color: '#9aa0ad', marginLeft: 8 }}>#{student.studentCode}</span>}
              </h1>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: '1.5px solid #d4d8e0', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#5c6578', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {isEn ? 'Sign out' : '退出登录'}
            </button>
          </div>

          {/* Enrollment pending banner */}
          {!subscription && (
            <div style={{ background: 'linear-gradient(90deg, #b45309, #d97706)', borderRadius: 12, padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>
                  {isEn ? 'Your enrollment is not yet active' : '你的学籍尚未激活'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  {isEn ? 'Complete payment to unlock full course access.' : '完成付款以解锁全部课程。'}
                </p>
              </div>
              <button
                onClick={handleStartCheckout}
                disabled={portalLoading}
                style={{ background: '#fff', color: '#b45309', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: portalLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                {portalLoading ? (isEn ? 'Loading…' : '加载中…') : (isEn ? 'Complete Enrollment →' : '完成报名 →')}
              </button>
            </div>
          )}

          {hasLimitedEvidence && (
            <div style={{ background: '#fffaf2', border: '1px solid #f4c36a', borderRadius: 12, padding: '13px 18px', marginBottom: 20, color: '#8a5a00' }}>
              <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {isEn ? 'Early account signal' : '新账号提醒'}
              </p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                {isEn
                  ? 'This dashboard is based only on recorded activity so far. Pacing and weekly patterns become more reliable after the student completes more quizzes, assignments, and modules.'
                  : '这个面板只根据目前已有的学习记录显示。学生完成更多测验、作业与模块后，进度判断和每周趋势会更准确。'}
              </p>
            </div>
          )}

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 20 }} className="giis-parent-grid">

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Hero card */}
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', borderRadius: 14, padding: '24px 28px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(213,168,54,0.25)', border: '2px solid rgba(213,168,54,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#d5a836', flexShrink: 0 }}>
                    {student.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, margin: '0 0 2px' }}>{student.name}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      {student.gradeLevel || ''}{student.gradeLevel ? ' · ' : ''}#{student.studentCode}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                  <StatCard label={isEn ? 'Credits Earned' : '已获学分'} value={stats.creditsEarned.toFixed(1)} sub={`/ ${GRAD_CREDITS} ${isEn ? 'to graduate' : '毕业学分'}`} />
                  <StatCard label="GPA · UW" value={stats.gpa ?? '—'} sub={isEn ? '4.0 scale' : '4.0 制'} />
                  <StatCard label={isEn ? 'In Progress' : '进行中'} value={inProgress.length} sub={isEn ? 'courses' : '门课'} />
                  <StatCard label={isEn ? 'Completed' : '已完成'} value={completed.length} sub={isEn ? 'courses' : '门课'} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{isEn ? 'Graduation progress' : '毕业进度'}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#d5a836' }}>{gradPct}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${gradPct}%`, background: 'linear-gradient(to right, #d5a836, #ffce5b)', borderRadius: 999 }} />
                  </div>
                </div>
              </div>

              {/* Active courses */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  {isEn ? `Active Courses — ${inProgress.length}` : `进行中课程 — ${inProgress.length}`}
                </p>
                {inProgress.length === 0
                  ? <p style={{ fontSize: 13, color: '#9aa0ad', margin: '12px 0 0' }}>{isEn ? 'No active courses.' : '暂无进行中课程。'}</p>
                  : inProgress.map(e => <CourseBar key={e.id} enr={e} isEn={isEn} />)
                }
                {completed.length > 0 && (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ fontSize: 12, color: '#2b3d6d', fontWeight: 700, cursor: 'pointer', listStyle: 'none' }}>
                      {isEn ? `▸ ${completed.length} completed courses` : `▸ ${completed.length} 门已完成`}
                    </summary>
                    {completed.map(e => <CourseBar key={e.id} enr={e} isEn={isEn} />)}
                  </details>
                )}
              </div>

              {/* Assessment assurance */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  {isEn ? 'Assessment Evidence' : '学习评量证据'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {[
                    { value: '40%', label: isEn ? 'module quizzes' : '章节测验' },
                    { value: '30%', label: isEn ? 'midterm exam' : '期中考试' },
                    { value: '30%', label: isEn ? 'final exam' : '期末考试' },
                    { value: '5d', label: isEn ? 'assignment review target' : '作业批改目标' },
                  ].map((item) => (
                    <div key={item.label} style={{ background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: 10, padding: '12px 14px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: '#2b3d6d' }}>{item.value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#5c6578', lineHeight: 1.35 }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#5c6578', lineHeight: 1.55, margin: '12px 0 0' }}>
                  {isEn
                    ? 'Assignments are submitted in the Learn Portal as written work or a document link. A teacher or advisor reviews the work, scores it out of 100, and leaves written feedback visible to the student and parent. All module assignments must be submitted before the final exam.'
                    : '作业在 Learn Portal 内提交，可直接贴文字或文件链接。老师或顾问会审阅作业、按 100 分批改，并留下学生与家长都能看到的书面反馈。所有模块作业必须提交后才能参加期末考试。'}
                </p>
              </div>

              <AssignmentHistory enrollments={enrollments} isEn={isEn} />

            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Recent activity */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  {isEn ? 'Recent Activity' : '最近活动'}
                </p>
                {recentActivity.length === 0
                  ? <p style={{ fontSize: 13, color: '#9aa0ad' }}>{isEn ? 'No activity yet.' : '暂无活动记录。'}</p>
                  : recentActivity.map((ev, i) => <ActivityRow key={i} event={ev} isEn={isEn} />)
                }
              </div>

              {/* Official transcript */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  {isEn ? 'Official Records' : '正式文件'}
                </p>
                <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 14px', lineHeight: 1.55 }}>
                  {isEn
                    ? 'View or download the official transcript using the same locked format used by the school office.'
                    : '查看或下载正式成绩单，格式与学校办公室使用的版本一致。'}
                </p>
                <Link
                  to="/parent/transcript"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#2b3d6d', color: '#fff', borderRadius: 8, padding: '11px 16px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}
                >
                  {isEn ? 'View official transcript →' : '查看正式成绩单 →'}
                </Link>
              </div>

              {/* Subscription management */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  {isEn ? 'Subscription' : '订阅管理'}
                </p>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{ width: '100%', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 16px', fontSize: 13.5, fontWeight: 700, cursor: portalLoading ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                >
                  {portalLoading
                    ? (isEn ? 'Opening…' : '开启中…')
                    : (isEn ? 'Manage subscription →' : '管理订阅 →')}
                </button>
                {portalError && (
                  <p style={{ fontSize: 12, color: '#b91c1c', margin: '8px 0 0' }}>{portalError}</p>
                )}
                <p style={{ fontSize: 11, color: '#9aa0ad', margin: '8px 0 0', lineHeight: 1.5 }}>
                  {isEn
                    ? 'Cancel, update payment method, or download invoices via Stripe.'
                    : '透过 Stripe 取消订阅、更新付款方式或下载发票。'}
                </p>
              </div>

              {/* Quick links */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  {isEn ? 'Quick Links' : '快速入口'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: isEn ? 'Contact admissions' : '联系招生办', href: `mailto:admissions@genesisideas.school` },
                    { label: isEn ? 'View School Profile' : '查看学校简介', to: '/school-profile' },
                    { label: isEn ? 'Diploma requirements' : '文凭要求', to: '/academics' },
                  ].map(link => link.to
                    ? <Link key={link.label} to={link.to} style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid #f0f2f8' }}>{link.label} →</Link>
                    : <a key={link.label} href={link.href} style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid #f0f2f8' }}>{link.label} →</a>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
