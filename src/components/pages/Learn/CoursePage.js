import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();
const MIDTERM_CUTOFF = 7;

export default function CoursePage({ language }) {
  const isEn = language !== 'zh';
  const { slug } = useParams();
  const navigate = useNavigate();
  const session = getStudentSession();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    fetch(`${API}/api/enrollments/${slug}`, { credentials: 'include' })
      .then((r) => { if (r.status === 404) navigate('/learn', { replace: true }); return r.json(); })
      .then((d) => { if (d.course) setCourse(d.course); if (d.enrollment) setEnrollment(d.enrollment); })
      .catch(() => {});
  }, [slug, session, navigate]);

  if (!session) return null;
  if (!course) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#888' }}>{isEn ? 'Loading…' : '加载中…'}</div>;

  const submittedQuizSet = new Set((enrollment?.quizAttempts || []).map(a => a.moduleOrder));
  const totalModules = course.modules?.length || 0;

  // Lock logic: quiz submission gates next module
  function isModuleLocked(order) {
    if (order === 1) return false;
    return !submittedQuizSet.has(order - 1);
  }

  // Midterm unlocked when quizzes 1–MIDTERM_CUTOFF all submitted
  const midtermLocked = [...Array(MIDTERM_CUTOFF)].some((_, i) => !submittedQuizSet.has(i + 1));
  const midtermAttempt = (enrollment?.examAttempts || []).find(a => a.examType === 'midterm' && a.submittedAt);

  // Final unlocked when all quizzes submitted + midterm submitted
  const finalLocked = [...Array(totalModules)].some((_, i) => !submittedQuizSet.has(i + 1)) || !midtermAttempt;
  const finalAttempt = (enrollment?.examAttempts || []).find(a => a.examType === 'final' && a.submittedAt);

  const quizAvg = enrollment?.quizAttempts?.length > 0
    ? enrollment.quizAttempts.reduce((s, a) => s + Number(a.score), 0) / enrollment.quizAttempts.length
    : null;

  // Build weighted grade display
  let gradeDisplay = null;
  const midScore = midtermAttempt ? Number(midtermAttempt.score) : null;
  const finalScore = finalAttempt ? Number(finalAttempt.score) : null;
  if (quizAvg !== null && midScore !== null && finalScore !== null) {
    const w = quizAvg * 0.4 + midScore * 0.3 + finalScore * 0.3;
    gradeDisplay = Math.round(w * 10) / 10;
  }

  return (
    <>
      <Helmet>
        <title>{isEn ? course.name : (course.nameZh || course.name)} | GIIS Learn</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
          <Link to="/learn" style={{ color: '#2b3d6d', textDecoration: 'none' }}>← {isEn ? 'My Courses' : '我的课程'}</Link>
        </p>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {course.department} · {course.type}
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e', margin: '8px 0 8px' }}>
            {isEn ? course.name : (course.nameZh || course.name)}
          </h1>
          <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7, maxWidth: '640px', margin: '0 0 20px' }}>
            {course.description}
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
              <div style={{ flex: 1, background: '#e8ecf5', borderRadius: '4px', height: '8px' }}>
                <div style={{ width: `${totalModules > 0 ? Math.round((submittedQuizSet.size / totalModules) * 100) : 0}%`, background: '#2b3d6d', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#2b3d6d', whiteSpace: 'nowrap' }}>
                {submittedQuizSet.size}/{totalModules} {isEn ? 'quizzes' : '测验'}
              </span>
            </div>
            {gradeDisplay !== null && (
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#2b3d6d', background: '#f0f4ff', padding: '4px 14px', borderRadius: '20px' }}>
                {isEn ? 'Grade: ' : '成绩：'}{gradeDisplay}%
              </span>
            )}
            {enrollment?.creditEarned && (
              <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>
                🎓 {isEn ? 'Credit Earned' : '已获学分'}
              </span>
            )}
            <Link to={`/learn/${slug}/syllabus`} style={{ fontSize: '13px', fontWeight: 600, color: '#555', textDecoration: 'none' }}>
              {isEn ? 'Syllabus' : '课程大纲'}
            </Link>
            <Link to={`/learn/${slug}/grades`} style={{ fontSize: '13px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none' }}>
              {isEn ? 'View Grades →' : '查看成绩 →'}
            </Link>
          </div>
        </div>

        {/* Module list */}
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px' }}>
          {isEn ? 'Modules' : '学习模块'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {(course.modules || []).map((mod) => {
            const locked = isModuleLocked(mod.order);
            const quizDone = submittedQuizSet.has(mod.order);
            const quizAttempt = (enrollment?.quizAttempts || []).find(a => a.moduleOrder === mod.order);
            return (
              <div key={mod.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: '#fff', border: `1px solid ${quizDone ? '#c8e6c9' : '#e0e6f0'}`,
                borderRadius: '10px', padding: '14px 18px',
                opacity: locked ? 0.45 : 1,
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: quizDone ? '#e8f5e9' : locked ? '#f0f0f0' : '#f0f4ff',
                  fontSize: '14px', fontWeight: 800,
                  color: quizDone ? '#2e7d32' : locked ? '#aaa' : '#2b3d6d',
                }}>
                  {quizDone ? '✓' : locked ? '🔒' : mod.order}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: locked ? '#aaa' : '#1a1a2e' }}>
                    {isEn ? mod.title : (mod.titleZh || mod.title)}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999' }}>~{mod.estimatedHrs}h</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {quizAttempt && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: quizAttempt.passed ? '#2e7d32' : '#e65100', background: quizAttempt.passed ? '#e8f5e9' : '#fff3e0', padding: '2px 8px', borderRadius: '20px' }}>
                      {Math.round(Number(quizAttempt.score))}%
                    </span>
                  )}
                  {!locked && (
                    <Link to={`/learn/${slug}/module/${mod.order}`} style={{
                      fontSize: '12px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none',
                      padding: '5px 12px', border: '2px solid #2b3d6d', borderRadius: '6px',
                    }}>
                      {quizDone ? (isEn ? 'Review' : '回顾') : (isEn ? 'Start →' : '开始 →')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Midterm */}
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px' }}>
          {isEn ? 'Midterm & Final Exam' : '期中与期末考试'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Midterm */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#fff', border: `1px solid ${midtermAttempt ? '#c8e6c9' : '#e0e6f0'}`,
            borderRadius: '10px', padding: '14px 18px',
            opacity: midtermLocked ? 0.45 : 1,
          }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: midtermAttempt ? '#e8f5e9' : midtermLocked ? '#f0f0f0' : '#fff8e1', fontSize: '16px' }}>
              {midtermAttempt ? '✓' : midtermLocked ? '🔒' : '📋'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: midtermLocked ? '#aaa' : '#1a1a2e' }}>
                {isEn ? 'Midterm Exam' : '期中考试'} <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>{isEn ? '(covers modules 1–7 · 30%)' : '（涵盖模块 1–7 · 占 30%）'}</span>
              </p>
              {midtermLocked && (() => {
                const done = [...Array(MIDTERM_CUTOFF)].filter((_, i) => submittedQuizSet.has(i + 1)).length;
                return (
                  <>
                    <p style={{ margin: '3px 0 4px', fontSize: '11px', color: '#aaa' }}>
                      {isEn ? `${done} / ${MIDTERM_CUTOFF} quizzes done` : `已完成 ${done} / ${MIDTERM_CUTOFF} 测验`}
                    </p>
                    <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '4px', maxWidth: '180px' }}>
                      <div style={{ width: `${Math.round((done / MIDTERM_CUTOFF) * 100)}%`, background: '#2b3d6d', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {midtermAttempt && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: midtermAttempt.passed ? '#2e7d32' : '#e65100', background: midtermAttempt.passed ? '#e8f5e9' : '#fff3e0', padding: '2px 8px', borderRadius: '20px' }}>
                  {Math.round(Number(midtermAttempt.score))}%
                </span>
              )}
              {!midtermLocked && (
                <Link to={`/learn/${slug}/exam?type=midterm`} style={{ fontSize: '12px', fontWeight: 700, color: midtermAttempt ? '#2b3d6d' : '#fff', textDecoration: 'none', padding: '5px 14px', borderRadius: '6px', background: midtermAttempt ? 'transparent' : '#2b3d6d', border: midtermAttempt ? '2px solid #2b3d6d' : 'none' }}>
                  {midtermAttempt ? (isEn ? 'Review' : '查看') : (isEn ? 'Take Midterm →' : '开始期中考试 →')}
                </Link>
              )}
            </div>
          </div>

          {/* Final */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#fff', border: `1px solid ${finalAttempt ? '#c8e6c9' : '#e0e6f0'}`,
            borderRadius: '10px', padding: '14px 18px',
            opacity: finalLocked ? 0.45 : 1,
          }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: finalAttempt ? '#e8f5e9' : finalLocked ? '#f0f0f0' : '#e8edf8', fontSize: '16px' }}>
              {finalAttempt ? '🎓' : finalLocked ? '🔒' : '📝'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: finalLocked ? '#aaa' : '#1a1a2e' }}>
                {isEn ? 'Final Exam' : '期末考试'} <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>{isEn ? '(covers all modules · 30%)' : '（涵盖全部模块 · 占 30%）'}</span>
              </p>
              {finalLocked && (() => {
                const quizDone = [...Array(totalModules)].filter((_, i) => submittedQuizSet.has(i + 1)).length;
                const steps = totalModules + 1; // all quizzes + midterm
                const stepsDone = quizDone + (midtermAttempt ? 1 : 0);
                return (
                  <>
                    <p style={{ margin: '3px 0 4px', fontSize: '11px', color: '#aaa' }}>
                      {isEn
                        ? `${quizDone}/${totalModules} quizzes · midterm ${midtermAttempt ? '✓' : '✗'}`
                        : `${quizDone}/${totalModules} 测验 · 期中 ${midtermAttempt ? '✓' : '✗'}`}
                    </p>
                    <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '4px', maxWidth: '180px' }}>
                      <div style={{ width: `${Math.round((stepsDone / steps) * 100)}%`, background: '#2b3d6d', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {finalAttempt && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: finalAttempt.passed ? '#2e7d32' : '#e65100', background: finalAttempt.passed ? '#e8f5e9' : '#fff3e0', padding: '2px 8px', borderRadius: '20px' }}>
                  {Math.round(Number(finalAttempt.score))}%
                </span>
              )}
              {!finalLocked && !enrollment?.creditEarned && (
                <Link to={`/learn/${slug}/exam?type=final`} style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '5px 14px', borderRadius: '6px', background: '#2b3d6d' }}>
                  {isEn ? 'Take Final →' : '开始期末考试 →'}
                </Link>
              )}
              {enrollment?.creditEarned && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2e7d32', background: '#e8f5e9', padding: '4px 10px', borderRadius: '20px' }}>🎓 {isEn ? 'Credit Earned' : '已获学分'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
