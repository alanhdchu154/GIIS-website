import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

export default function ExamPage({ language }) {
  const isEn = language !== 'zh';
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const examType = searchParams.get('type') === 'midterm' ? 'midterm' : 'final';
  const navigate = useNavigate();
  const session = getStudentSession();

  const [phase, setPhase] = useState('loading'); // loading | ready | inprogress | submitted
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    fetch(`${API}/api/enrollments/${slug}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { navigate(`/learn/${slug}`, { replace: true }); return; }
        setCourseName(isEn ? d.course?.name : (d.course?.nameZh || d.course?.name));
        if (d.enrollment?.creditEarned) {
          setPhase('earned');
        } else {
          setPhase('ready');
        }
      })
      .catch(() => setError('Failed to load exam data'));
  }, [slug, session, navigate, isEn]);

  async function startExam() {
    setError('');
    const r = await fetch(`${API}/api/enrollments/${slug}/exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ examType }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d.error || 'Could not start exam');
      return;
    }
    setAttemptId(d.attemptId);
    setQuestions(d.questions);
    setAnswers({});
    setPhase('inprogress');
  }

  async function submitExam() {
    setSubmitting(true);
    setError('');
    const r = await fetch(`${API}/api/enrollments/${slug}/exam/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d.error || 'Submission failed');
      return;
    }
    setResult(d);
    setPhase('submitted');
  }

  if (!session) return null;

  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Helmet>
        <title>{isEn ? `${examType === 'midterm' ? 'Midterm' : 'Final'} Exam: ${courseName}` : `${examType === 'midterm' ? '期中' : '期末'}考试：${courseName}`} | GIIS Learn</title>
      </Helmet>
      <div className="row">
        <Nav language={language} />
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
          <Link to="/learn" style={{ color: '#2b3d6d', textDecoration: 'none' }}>{isEn ? 'My Courses' : '我的课程'}</Link>
          {' → '}
          <Link to={`/learn/${slug}`} style={{ color: '#2b3d6d', textDecoration: 'none' }}>{courseName}</Link>
          {' → '}
          <span style={{ color: '#444' }}>{isEn ? 'Final Exam' : '期末考试'}</span>
        </p>

        {error && (
          <div style={{ padding: '16px', background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', marginBottom: '24px', color: '#c62828', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <p style={{ color: '#888' }}>{isEn ? 'Loading…' : '加载中…'}</p>
        )}

        {/* CREDIT ALREADY EARNED */}
        {phase === 'earned' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎓</div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#2e7d32', marginBottom: '12px' }}>
              {isEn ? 'Credit Already Earned!' : '学分已获得！'}
            </h1>
            <p style={{ color: '#555', fontSize: '15px', marginBottom: '28px' }}>
              {isEn ? `You have already earned credit for ${courseName}.` : `您已经完成了 ${courseName} 并获得学分。`}
            </p>
            <Link to={`/learn/${slug}`} style={{
              display: 'inline-block', padding: '12px 28px', background: '#2b3d6d', color: '#fff',
              borderRadius: '8px', fontWeight: 700, textDecoration: 'none',
            }}>
              {isEn ? '← Back to Course' : '← 返回课程'}
            </Link>
          </div>
        )}

        {/* READY TO START */}
        {phase === 'ready' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', marginBottom: '16px' }}>
              {isEn
                ? `${examType === 'midterm' ? 'Midterm' : 'Final'} Exam: ${courseName}`
                : `${examType === 'midterm' ? '期中' : '期末'}考试：${courseName}`}
            </h1>
            <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '28px', marginBottom: '32px', textAlign: 'left', maxWidth: '480px', margin: '0 auto 32px' }}>
              <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.8, margin: 0 }}>
                {isEn ? (
                  <>
                    <strong>Instructions:</strong><br />
                    • Multiple choice and short answer questions<br />
                    • Score 70% or higher to earn your credit<br />
                    • You may retake the exam after 24 hours if you don't pass<br />
                    • Complete the exam in one sitting
                  </>
                ) : (
                  <>
                    <strong>考试须知：</strong><br />
                    • 包含选择题和简答题<br />
                    • 成绩达到70%即可获得学分<br />
                    • 未通过可在24小时后重考<br />
                    • 请一次性完成考试
                  </>
                )}
              </p>
            </div>
            <button onClick={startExam} style={{
              fontSize: '16px', fontWeight: 700, color: '#fff', background: '#2b3d6d',
              border: 'none', borderRadius: '8px', padding: '14px 36px', cursor: 'pointer',
            }}>
              {isEn ? 'Begin Exam →' : '开始考试 →'}
            </button>
          </div>
        )}

        {/* IN PROGRESS */}
        {phase === 'inprogress' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
                {isEn ? 'Final Exam' : '期末考试'}
              </h1>
              <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>
                {answeredCount}/{questions.length} {isEn ? 'answered' : '已作答'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{
                  background: '#fff', border: `2px solid ${answers[q.id] ? '#2b3d6d' : '#e0e6f0'}`,
                  borderRadius: '12px', padding: '24px',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                    {isEn ? `Question ${i + 1}` : `第 ${i + 1} 题`} · {q.points} {isEn ? (q.points > 1 ? 'pts' : 'pt') : '分'}
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.6 }}>
                    {q.question}
                  </p>

                  {q.type === 'mc' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt) => (
                        <label key={opt} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                          padding: '10px 14px', borderRadius: '8px',
                          background: answers[q.id] === opt ? '#e8edf8' : '#f8f9fd',
                          border: `1px solid ${answers[q.id] === opt ? '#2b3d6d' : '#e0e6f0'}`,
                          transition: 'all 0.15s',
                        }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            style={{ marginTop: '2px', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '14px', color: '#333' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'short' && (
                    <input
                      type="text"
                      placeholder={isEn ? 'Type your answer…' : '输入答案…'}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: '14px', color: '#333',
                        border: '1px solid #ccc', borderRadius: '8px', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={submitExam}
                disabled={submitting || answeredCount < questions.length}
                style={{
                  fontSize: '16px', fontWeight: 700, color: '#fff',
                  background: answeredCount < questions.length ? '#aaa' : '#2b3d6d',
                  border: 'none', borderRadius: '8px', padding: '14px 40px', cursor: answeredCount < questions.length ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (isEn ? 'Submitting…' : '提交中…') : (isEn ? 'Submit Exam' : '提交考试')}
              </button>
              {answeredCount < questions.length && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  {isEn ? `Please answer all ${questions.length} questions before submitting.` : `请回答全部 ${questions.length} 道题后再提交。`}
                </p>
              )}
            </div>
          </>
        )}

        {/* SUBMITTED RESULTS */}
        {phase === 'submitted' && result && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>{result.passed ? '🎉' : '📝'}</div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: result.passed ? '#2e7d32' : '#c62828', marginBottom: '8px' }}>
              {result.passed
                ? (isEn ? 'Congratulations! You passed!' : '恭喜！考试通过！')
                : (isEn ? "Don't give up — you can do this!" : '继续努力，你可以的！')}
            </h1>
            <div style={{ fontSize: '56px', fontWeight: 800, color: result.passed ? '#2e7d32' : '#c62828', margin: '12px 0' }}>
              {result.score}%
            </div>
            <p style={{ color: '#555', fontSize: '15px', marginBottom: '32px' }}>
              {isEn
                ? `You scored ${result.earned} out of ${result.total} points.`
                : `你获得了 ${result.earned} / ${result.total} 分。`}
            </p>

            {result.passed ? (
              <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
                <p style={{ margin: 0, fontSize: '15px', color: '#1b5e20', fontWeight: 600 }}>
                  🎓 {isEn ? `Credit for ${courseName} has been added to your transcript.` : `${courseName} 的学分已添加到您的成绩单。`}
                </p>
              </div>
            ) : (
              <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#e65100' }}>
                  {isEn
                    ? 'Review the modules and try again after 24 hours. You need 70% to pass.'
                    : '请复习学习模块后，24小时后可重新参加考试。需要70%才能通过。'}
                </p>
              </div>
            )}

            {/* Answer breakdown */}
            <details style={{ textAlign: 'left', marginBottom: '32px' }}>
              <summary style={{ fontSize: '14px', fontWeight: 700, color: '#2b3d6d', cursor: 'pointer', marginBottom: '16px' }}>
                {isEn ? 'View Answer Breakdown' : '查看答题详情'}
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q, i) => {
                  const g = result.graded?.find((x) => x.questionId === q.id);
                  return (
                    <div key={q.id} style={{
                      padding: '16px', borderRadius: '8px',
                      background: g?.correct ? '#f1f8e9' : '#ffebee',
                      border: `1px solid ${g?.correct ? '#c5e1a5' : '#ef9a9a'}`,
                    }}>
                      <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: g?.correct ? '#33691e' : '#b71c1c' }}>
                        {g?.correct ? '✓' : '✗'} {isEn ? `Q${i + 1}` : `第${i + 1}题`}: {q.question}
                      </p>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#555' }}>
                        {isEn ? 'Your answer: ' : '你的答案：'}<strong>{answers[q.id] || '—'}</strong>
                      </p>
                      {!g?.correct && (
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#555' }}>
                          {isEn ? 'Correct answer: ' : '正确答案：'}<strong style={{ color: '#2e7d32' }}>{g?.correctAnswer}</strong>
                        </p>
                      )}
                      {g?.explanation && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>{g.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={`/learn/${slug}`} style={{
                padding: '12px 24px', border: '2px solid #2b3d6d', color: '#2b3d6d',
                borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '14px',
              }}>
                {isEn ? '← Back to Course' : '← 返回课程'}
              </Link>
              {result.passed && (
                <Link to="/learn" style={{
                  padding: '12px 24px', background: '#2b3d6d', color: '#fff',
                  borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '14px',
                }}>
                  {isEn ? 'Explore More Courses →' : '探索更多课程 →'}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
