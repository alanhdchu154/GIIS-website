import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

function ResourceCard({ icon, label, url, note }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '16px', background: '#f8f9fd', border: '1px solid #e0e6f0',
        borderRadius: '10px', transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#2b3d6d'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e6f0'}
      >
        <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#444', lineHeight: 1.4 }}>{note || url}</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '16px', color: '#aaa', flexShrink: 0 }}>↗</span>
      </div>
    </a>
  );
}

function ScoreBadge({ score, passed }) {
  const color = passed ? '#2e7d32' : '#c62828';
  const bg = passed ? '#e8f5e9' : '#ffebee';
  return (
    <span style={{ fontSize: '13px', fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: '20px' }}>
      {Math.round(score)}% {passed ? '✓' : '✗'}
    </span>
  );
}

export default function ModulePage({ language }) {
  const isEn = language !== 'zh';
  const { slug, order } = useParams();
  const moduleOrder = parseInt(order, 10);
  const navigate = useNavigate();
  const session = getStudentSession();

  const [mod, setMod] = useState(null);
  const [course, setCourse] = useState(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [prevAttempt, setPrevAttempt] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizPhase, setQuizPhase] = useState('idle'); // idle | answering | submitted
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Assignment state
  const [assignmentText, setAssignmentText] = useState('');
  const [prevSubmission, setPrevSubmission] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignDone, setAssignDone] = useState(false);

  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!session) return;
    fetch(`${API}/api/enrollments/${slug}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setCourse(d.course);
        const m = (d.course?.modules || []).find((x) => x.order === moduleOrder);
        if (!m) { navigate(`/learn/${slug}`, { replace: true }); return; }
        setMod(m);

        // quiz
        const qa = d.enrollment?.quizAttempts?.find((a) => a.moduleOrder === moduleOrder);
        if (qa) { setPrevAttempt(qa); setQuizPhase('submitted'); }

        // assignment
        const as = d.enrollment?.assignments?.find((a) => a.moduleOrder === moduleOrder);
        if (as) { setPrevSubmission(as); setAssignmentText(as.content); }
      })
      .catch(() => setError('Failed to load module'));
  }, [slug, moduleOrder, session, navigate]);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    load();
  }, [session, navigate, load]);

  async function loadQuiz() {
    const r = await fetch(`${API}/api/enrollments/${slug}/quiz/${moduleOrder}`, { credentials: 'include' });
    const d = await r.json();
    setQuizQuestions(d.questions || []);
    if (d.attempt) { setPrevAttempt(d.attempt); setQuizPhase('submitted'); }
    else setQuizPhase('answering');
  }

  async function submitQuiz() {
    setQuizSubmitting(true);
    const r = await fetch(`${API}/api/enrollments/${slug}/quiz/${moduleOrder}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ answers: quizAnswers }),
    });
    setQuizSubmitting(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setError(d.error || 'Quiz submission failed'); return; }
    setQuizResult(d);
    setQuizPhase('submitted');
    load(); // refresh enrollment (completedModules updated)
  }

  async function submitAssignment() {
    if (!assignmentText.trim()) return;
    setAssigning(true);
    const r = await fetch(`${API}/api/enrollments/${slug}/assignment/${moduleOrder}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: assignmentText }),
    });
    setAssigning(false);
    if (r.ok) { const d = await r.json(); setPrevSubmission(d); setAssignDone(true); }
  }

  if (!session) return null;
  if (error) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#c62828' }}>{error}</div>;
  if (!mod) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#888' }}>{isEn ? 'Loading…' : '加载中…'}</div>;

  const totalModules = course?.modules?.length || 0;
  const quizAnsweredCount = Object.keys(quizAnswers).length;
  const quizAttempt = quizResult || prevAttempt;

  return (
    <>
      <Helmet>
        <title>{isEn ? mod.title : (mod.titleZh || mod.title)} | GIIS Learn</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
          <Link to="/learn" style={{ color: '#2b3d6d', textDecoration: 'none' }}>{isEn ? 'My Courses' : '我的课程'}</Link>
          {' → '}
          <Link to={`/learn/${slug}`} style={{ color: '#2b3d6d', textDecoration: 'none' }}>
            {isEn ? course?.name : (course?.nameZh || course?.name)}
          </Link>
          {' → '}
          <span style={{ color: '#444' }}>{isEn ? `Module ${moduleOrder}` : `模块 ${moduleOrder}`}</span>
        </p>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2b3d6d' }}>
              {isEn ? `Module ${moduleOrder} of ${totalModules}` : `模块 ${moduleOrder} / ${totalModules}`}
            </span>
            {quizAttempt && <ScoreBadge score={quizAttempt.score} passed={quizAttempt.passed} />}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
            {isEn ? mod.title : (mod.titleZh || mod.title)}
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>~{mod.estimatedHrs}h {isEn ? 'estimated' : '预计'}</p>
        </div>

        {/* Objectives */}
        {mod.objectives && (
          <section style={{ marginBottom: '32px', padding: '18px 22px', background: '#f0f4ff', borderLeft: '4px solid #2b3d6d', borderRadius: '0 8px 8px 0' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isEn ? 'Learning Objectives' : '学习目标'}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: 1.7 }}>{mod.objectives}</p>
          </section>
        )}

        {/* Resources */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px' }}>
            {isEn ? 'Study Resources' : '学习资源'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ResourceCard icon="📖" label={isEn ? 'Reading' : '阅读材料'} url={mod.readingUrl} note={mod.readingNote} />
            <ResourceCard icon="▶️" label={isEn ? 'Video Lesson' : '视频课程'} url={mod.videoUrl} note={mod.videoNote} />
            {mod.video2Url && <ResourceCard icon="🎬" label={isEn ? 'Supplemental Video' : '补充视频'} url={mod.video2Url} note={mod.video2Note} />}
            <ResourceCard icon="✏️" label={isEn ? 'Practice' : '练习'} url={mod.practiceUrl} note={mod.practiceNote} />
          </div>
        </section>

        {/* Assignment */}
        {mod.assignment && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ padding: '22px', background: '#fffde7', border: '1px solid #f9a825', borderRadius: '10px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#f57f17', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📝 {isEn ? 'Assignment' : '作业'}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: 1.7 }}>{mod.assignment}</p>
            </div>
            {prevSubmission?.feedback && (
              <div style={{ padding: '14px 18px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#1b5e20' }}>
                <strong>{isEn ? 'Teacher feedback: ' : '教师评语：'}</strong>{prevSubmission.feedback}
              </div>
            )}
            <textarea
              value={assignmentText}
              onChange={e => setAssignmentText(e.target.value)}
              placeholder={isEn ? 'Paste your work, answer, or a Google Doc link here…' : '在此粘贴你的作业内容或 Google Doc 链接…'}
              rows={4}
              style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <button onClick={submitAssignment} disabled={assigning || !assignmentText.trim()} style={{
                padding: '9px 20px', background: assigning ? '#aaa' : '#f57f17', color: '#fff',
                border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}>
                {assigning ? (isEn ? 'Submitting…' : '提交中…') : prevSubmission ? (isEn ? 'Update Submission' : '更新提交') : (isEn ? 'Submit Assignment' : '提交作业')}
              </button>
              {(assignDone || prevSubmission) && !assigning && (
                <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 600 }}>✓ {isEn ? 'Submitted' : '已提交'}</span>
              )}
            </div>
          </section>
        )}

        {/* ── Module Quiz ── */}
        <section style={{ borderTop: '2px solid #e0e6f0', paddingTop: '36px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
                {isEn ? `Module ${moduleOrder} Quiz` : `模块 ${moduleOrder} 小测验`}
              </h2>
              <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                {isEn ? 'Complete the quiz to unlock the next module.' : '完成测验以解锁下一个模块。'}
              </p>
            </div>
            {quizAttempt && <ScoreBadge score={quizAttempt.score} passed={quizAttempt.passed} />}
          </div>

          {/* Idle — not started */}
          {quizPhase === 'idle' && (
            <button onClick={loadQuiz} style={{
              padding: '11px 26px', background: '#2b3d6d', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            }}>
              {isEn ? 'Start Quiz →' : '开始测验 →'}
            </button>
          )}

          {/* Answering */}
          {quizPhase === 'answering' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
                {quizQuestions.map((q, i) => (
                  <div key={q.id} style={{ background: '#fff', border: `2px solid ${quizAnswers[q.id] ? '#2b3d6d' : '#e0e6f0'}`, borderRadius: '10px', padding: '20px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                      Q{i + 1} · {q.points} {isEn ? 'pt' : '分'}
                    </p>
                    <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.6 }}>{q.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {(q.options || []).map((opt) => (
                        <label key={opt} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                          padding: '9px 13px', borderRadius: '7px',
                          background: quizAnswers[q.id] === opt ? '#e8edf8' : '#f8f9fd',
                          border: `1px solid ${quizAnswers[q.id] === opt ? '#2b3d6d' : '#e0e6f0'}`,
                        }}>
                          <input type="radio" name={q.id} value={opt} checked={quizAnswers[q.id] === opt}
                            onChange={() => setQuizAnswers(p => ({ ...p, [q.id]: opt }))}
                            style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '14px', color: '#333' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={submitQuiz}
                disabled={quizSubmitting || quizAnsweredCount < quizQuestions.length}
                style={{
                  padding: '11px 28px', background: quizAnsweredCount < quizQuestions.length ? '#aaa' : '#2b3d6d',
                  color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                  cursor: quizAnsweredCount < quizQuestions.length ? 'not-allowed' : 'pointer',
                }}>
                {quizSubmitting ? (isEn ? 'Submitting…' : '提交中…') : (isEn ? 'Submit Quiz' : '提交测验')}
              </button>
              {quizAnsweredCount < quizQuestions.length && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  {isEn ? `Answer all ${quizQuestions.length} questions to submit.` : `回答全部 ${quizQuestions.length} 题后可提交。`}
                </p>
              )}
            </>
          )}

          {/* Submitted — show results */}
          {quizPhase === 'submitted' && quizAttempt && (
            <div>
              <div style={{
                padding: '20px 24px', borderRadius: '10px', marginBottom: '20px',
                background: quizAttempt.passed ? '#e8f5e9' : '#fff3e0',
                border: `1px solid ${quizAttempt.passed ? '#a5d6a7' : '#ffcc80'}`,
              }}>
                <p style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: quizAttempt.passed ? '#2e7d32' : '#e65100' }}>
                  {Math.round(quizAttempt.score)}%
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: quizAttempt.passed ? '#1b5e20' : '#e65100' }}>
                  {quizAttempt.passed
                    ? (isEn ? '✓ Passed — next module unlocked!' : '✓ 通过！下一模块已解锁！')
                    : (isEn ? 'Keep reviewing and move on — your score is recorded.' : '继续复习，分数已记录，可以进行下一模块。')}
                </p>
              </div>

              {/* Answer breakdown */}
              {(quizResult?.graded || quizAttempt?.answers) && quizResult?.graded && (
                <details>
                  <summary style={{ fontSize: '13px', fontWeight: 700, color: '#2b3d6d', cursor: 'pointer', marginBottom: '12px' }}>
                    {isEn ? 'View answer breakdown' : '查看答题详情'}
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {quizQuestions.map((q, i) => {
                      const g = quizResult.graded.find(x => x.questionId === q.id);
                      return (
                        <div key={q.id} style={{
                          padding: '14px', borderRadius: '8px',
                          background: g?.correct ? '#f1f8e9' : '#ffebee',
                          border: `1px solid ${g?.correct ? '#c5e1a5' : '#ef9a9a'}`,
                        }}>
                          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: g?.correct ? '#33691e' : '#b71c1c' }}>
                            {g?.correct ? '✓' : '✗'} Q{i + 1}: {q.question}
                          </p>
                          {!g?.correct && <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#555' }}>
                            {isEn ? 'Correct: ' : '正确答案：'}<strong style={{ color: '#2e7d32' }}>{g?.correctAnswer}</strong>
                          </p>}
                          {g?.explanation && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>{g.explanation}</p>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          )}
        </section>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e0e6f0' }}>
          {moduleOrder > 1 ? (
            <Link to={`/learn/${slug}/module/${moduleOrder - 1}`} style={{ fontSize: '14px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none', padding: '10px 20px', border: '2px solid #2b3d6d', borderRadius: '8px' }}>
              ← {isEn ? 'Previous' : '上一模块'}
            </Link>
          ) : (
            <Link to={`/learn/${slug}`} style={{ fontSize: '14px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none', padding: '10px 20px', border: '2px solid #2b3d6d', borderRadius: '8px' }}>
              ← {isEn ? 'Back to Course' : '返回课程'}
            </Link>
          )}

          {quizAttempt && moduleOrder < totalModules ? (
            <Link to={`/learn/${slug}/module/${moduleOrder + 1}`} style={{ fontSize: '14px', fontWeight: 700, color: '#fff', background: '#2b3d6d', textDecoration: 'none', borderRadius: '8px', padding: '10px 24px' }}>
              {isEn ? 'Next Module →' : '下一模块 →'}
            </Link>
          ) : quizAttempt && moduleOrder === totalModules ? (
            <Link to={`/learn/${slug}`} style={{ fontSize: '14px', fontWeight: 700, color: '#fff', background: '#2b3d6d', textDecoration: 'none', borderRadius: '8px', padding: '10px 24px' }}>
              {isEn ? 'Back to Course →' : '返回课程 →'}
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}
