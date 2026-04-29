import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

function letterGrade(pct) {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

function pct(val) { return val !== null ? `${Math.round(val * 10) / 10}%` : '—'; }

function StatusBadge({ score, passed, submitted }) {
  if (!submitted) return <span style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>—</span>;
  const color = passed ? '#2e7d32' : '#c62828';
  const bg = passed ? '#e8f5e9' : '#ffebee';
  return <span style={{ fontSize: '12px', fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: '12px' }}>{pct(score)}</span>;
}

function ScorePill({ score, total, label, weight, color }) {
  const contribution = score !== null ? Math.round((score * weight) * 10) / 10 : null;
  return (
    <div style={{ background: '#fff', border: `1px solid #e0e6f0`, borderLeft: `4px solid ${color}`, borderRadius: '10px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: score !== null ? color : '#ccc' }}>
            {score !== null ? `${Math.round(score * 10) / 10}%` : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#aaa' }}>{Math.round(weight * 100)}% of grade</p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: contribution !== null ? '#1a1a2e' : '#ccc' }}>
            {contribution !== null ? `+${contribution} pts` : '—'}
          </p>
        </div>
      </div>
      {score !== null && (
        <div style={{ marginTop: '12px', background: '#f0f2f8', borderRadius: '4px', height: '6px' }}>
          <div style={{ width: `${Math.min(score, 100)}%`, background: color, borderRadius: '4px', height: '100%', transition: 'width 0.4s' }} />
        </div>
      )}
    </div>
  );
}

function ExamReviewPanel({ slug, examType, isEn }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    if (review) { setOpen(o => !o); return; }
    setLoading(true);
    const r = await fetch(`${API}/api/enrollments/${slug}/exam/review?type=${examType}`, { credentials: 'include' });
    setLoading(false);
    if (!r.ok) return;
    setReview(await r.json());
    setOpen(true);
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button onClick={load} disabled={loading} style={{
        fontSize: '11px', fontWeight: 700, color: '#2b3d6d', background: '#f0f4ff',
        border: '1px solid #c5d0f0', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
      }}>
        {loading ? '…' : open ? (isEn ? 'Hide Review ▲' : '收起 ▲') : (isEn ? 'Review Questions ▼' : '查看考题 ▼')}
      </button>

      {open && review && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {review.questions.map((q, i) => {
            const g = review.graded.find(x => x.questionId === q.id);
            const isCorrect = g?.correct;
            const isUnknown = isCorrect === null || isCorrect === undefined || !g?.yourAnswer;
            return (
              <div key={q.id} style={{
                padding: '14px 16px', borderRadius: '8px',
                background: isUnknown ? '#f8f9fd' : isCorrect ? '#f1f8e9' : '#ffebee',
                border: `1px solid ${isUnknown ? '#e0e6f0' : isCorrect ? '#c5e1a5' : '#ef9a9a'}`,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: isUnknown ? '#888' : isCorrect ? '#33691e' : '#b71c1c' }}>
                  {isUnknown ? '•' : isCorrect ? '✓' : '✗'} Q{i + 1} ({q.points} pt): {q.question}
                </p>
                {g?.yourAnswer && (
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>
                    {isEn ? 'Your answer: ' : '你的答案：'}<span style={{ color: isCorrect ? '#2e7d32' : '#c62828' }}>{g.yourAnswer}</span>
                  </p>
                )}
                {!isCorrect && g?.correctAnswer && (
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>
                    {isEn ? 'Correct: ' : '正确答案：'}<strong style={{ color: '#2e7d32' }}>{g.correctAnswer}</strong>
                  </p>
                )}
                {g?.explanation && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>{g.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GradesPage({ language }) {
  const isEn = language !== 'zh';
  const { slug } = useParams();
  const navigate = useNavigate();
  const session = getStudentSession();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    fetch(`${API}/api/enrollments/${slug}/grades`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError('Failed to load grades'));
  }, [slug, session, navigate]);

  if (!session) return null;
  if (error) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#c62828' }}>{error}</div>;
  if (!data) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#888' }}>{isEn ? 'Loading…' : '加载中…'}</div>;

  const { grade, quizRows, midterm, final: finalData, creditEarned } = data;

  return (
    <>
      <Helmet>
        <title>{isEn ? `Grades: ${data.course.name}` : `成绩：${data.course.nameZh || data.course.name}`} | GIIS Learn</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
          <Link to="/learn" style={{ color: '#2b3d6d', textDecoration: 'none' }}>{isEn ? 'My Courses' : '我的课程'}</Link>
          {' → '}
          <Link to={`/learn/${slug}`} style={{ color: '#2b3d6d', textDecoration: 'none' }}>{isEn ? data.course.name : (data.course.nameZh || data.course.name)}</Link>
          {' → '}
          <span style={{ color: '#444' }}>{isEn ? 'Grades' : '成绩'}</span>
        </p>

        {/* Course grade summary */}
        <div style={{ background: 'linear-gradient(135deg, #2b3d6d 0%, #1a1a2e 100%)', borderRadius: '16px', padding: '32px', marginBottom: '36px', color: '#fff' }}>
          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            {grade.weighted !== null
              ? (isEn ? 'Final Grade' : '最终成绩')
              : grade.currentGrade !== null
                ? (isEn ? `Current Grade · based on ${grade.gradedWeight}% of graded work` : `当前成绩 · 基于 ${grade.gradedWeight}% 已评分项目`)
                : (isEn ? 'Current Grade' : '当前成绩')}
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '72px', fontWeight: 800, lineHeight: 1, color: '#fff' }}>
              {grade.weighted !== null
                ? `${grade.weighted}%`
                : grade.currentGrade !== null
                  ? `${grade.currentGrade}%`
                  : '—'}
            </span>
            {(grade.letter || (grade.currentGrade !== null && !grade.letter)) && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '40px', fontWeight: 800, color: 'rgba(213,168,54,1)' }}>
                  {grade.letter || letterGrade(grade.currentGrade)}
                </span>
              </div>
            )}
          </div>
          {grade.weighted === null && grade.currentGrade !== null && (
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {isEn
                ? `${100 - grade.gradedWeight}% of your grade is still ungraded. Keep going!`
                : `还有 ${100 - grade.gradedWeight}% 尚未评分，继续加油！`}
            </p>
          )}
          {creditEarned && (
            <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(46,125,50,0.3)', border: '1px solid rgba(165,214,167,0.5)', padding: '8px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '16px' }}>🎓</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#a5d6a7' }}>{isEn ? 'Credit Earned' : '已获学分'}</span>
            </div>
          )}
          {grade.currentGrade === null && (
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {isEn ? 'Complete your first quiz to see your current grade.' : '完成第一个测验后即可查看当前成绩。'}
            </p>
          )}
        </div>

        {/* Weight breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '40px' }}>
          <ScorePill label={isEn ? 'Module Quizzes' : '模块测验'} score={grade.quizAvg} weight={0.4} color='#2b3d6d' />
          <ScorePill label={isEn ? 'Midterm' : '期中考试'} score={grade.midScore} weight={0.3} color='#C84B0A' />
          <ScorePill label={isEn ? 'Final Exam' : '期末考试'} score={grade.finalScore} weight={0.3} color='#1B6B3A' />
        </div>

        {/* ── Module Quizzes Table ── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
              {isEn ? 'Module Quizzes' : '模块测验'} <span style={{ fontSize: '13px', fontWeight: 400, color: '#888' }}>40%</span>
            </h2>
            <span style={{ fontSize: '13px', color: '#888' }}>
              {grade.submittedQuizCount}/{grade.totalModules} {isEn ? 'submitted' : '已提交'}
              {grade.quizAvg !== null && ` · avg ${grade.quizAvg}%`}
            </span>
          </div>

          <div style={{ border: '1px solid #e0e6f0', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 18px', background: '#f8f9fd', borderBottom: '1px solid #e0e6f0', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>{isEn ? 'Module' : '模块'}</span>
              <span style={{ textAlign: 'center' }}>{isEn ? 'Quiz Score' : '测验分数'}</span>
              <span style={{ textAlign: 'center' }}>{isEn ? 'Assignment' : '作业'}</span>
              <span style={{ textAlign: 'right' }}>{isEn ? 'Status' : '状态'}</span>
            </div>
            {quizRows.map((row, i) => (
              <div key={row.moduleOrder} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '12px 18px',
                borderBottom: i < quizRows.length - 1 ? '1px solid #f0f0f0' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
                alignItems: 'center',
              }}>
                <div>
                  <Link to={`/learn/${slug}/module/${row.moduleOrder}`} style={{ fontSize: '13px', fontWeight: 600, color: '#2b3d6d', textDecoration: 'none' }}>
                    {row.moduleOrder}. {isEn ? row.title : (row.titleZh || row.title)}
                  </Link>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <StatusBadge score={row.quiz?.score ?? null} passed={row.quiz?.passed ?? false} submitted={!!row.quiz} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  {row.assignment
                    ? <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 700 }}>✓ {isEn ? 'Submitted' : '已提交'}</span>
                    : <span style={{ fontSize: '11px', color: '#aaa' }}>—</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {row.quiz
                    ? <span style={{ fontSize: '11px', color: '#888' }}>{new Date(row.quiz.submittedAt).toLocaleDateString()}</span>
                    : <span style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>{isEn ? 'Not started' : '未开始'}</span>}
                </div>
              </div>
            ))}
            {/* Quiz average row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 18px', background: '#f0f4ff', borderTop: '2px solid #e0e6f0', fontSize: '13px', fontWeight: 700, alignItems: 'center' }}>
              <span style={{ color: '#2b3d6d' }}>{isEn ? 'Quiz Average' : '测验平均分'}</span>
              <span style={{ textAlign: 'center', color: '#2b3d6d' }}>{grade.quizAvg !== null ? `${grade.quizAvg}%` : '—'}</span>
              <span></span>
              <span style={{ textAlign: 'right', color: '#888', fontSize: '11px' }}>× 40%</span>
            </div>
          </div>
        </section>

        {/* ── Midterm & Final Table ── */}
        <section>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px' }}>
            {isEn ? 'Exams' : '考试'}
          </h2>
          <div style={{ border: '1px solid #e0e6f0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 18px', background: '#f8f9fd', borderBottom: '1px solid #e0e6f0', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>{isEn ? 'Exam' : '考试名称'}</span>
              <span style={{ textAlign: 'center' }}>{isEn ? 'Score' : '分数'}</span>
              <span style={{ textAlign: 'center' }}>{isEn ? 'Passed' : '是否通过'}</span>
              <span style={{ textAlign: 'right' }}>{isEn ? 'Date' : '日期'}</span>
            </div>

            {/* Midterm row */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>{isEn ? 'Midterm Exam' : '期中考试'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{isEn ? 'Modules 1–7 · 30% of grade' : '模块 1–7 · 占 30%'}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <StatusBadge score={midterm?.score ?? null} passed={midterm?.passed ?? false} submitted={!!midterm} />
                </div>
                <div style={{ textAlign: 'center', fontSize: '13px' }}>
                  {midterm ? (midterm.passed ? '✅' : '❌') : '—'}
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#888' }}>
                  {midterm ? new Date(midterm.submittedAt).toLocaleDateString() : <span style={{ color: '#aaa', fontStyle: 'italic' }}>{isEn ? 'Not taken' : '未参加'}</span>}
                </div>
              </div>
              {midterm && <ExamReviewPanel slug={slug} examType="midterm" isEn={isEn} />}
            </div>

            {/* Final row */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>{isEn ? 'Final Exam' : '期末考试'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{isEn ? 'All modules · 30% of grade' : '全部模块 · 占 30%'}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <StatusBadge score={finalData?.score ?? null} passed={finalData?.passed ?? false} submitted={!!finalData} />
                </div>
                <div style={{ textAlign: 'center', fontSize: '13px' }}>
                  {finalData ? (finalData.passed ? '✅' : '❌') : '—'}
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#888' }}>
                  {finalData ? new Date(finalData.submittedAt).toLocaleDateString() : <span style={{ color: '#aaa', fontStyle: 'italic' }}>{isEn ? 'Not taken' : '未参加'}</span>}
                </div>
              </div>
              {finalData && <ExamReviewPanel slug={slug} examType="final" isEn={isEn} />}
            </div>

            {/* Weighted total row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 18px', background: '#f0f4ff', borderTop: '2px solid #e0e6f0', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e' }}>{isEn ? 'Final Grade' : '最终成绩'}</span>
              <span style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, color: grade.weighted !== null ? '#2b3d6d' : '#ccc' }}>
                {grade.weighted !== null ? `${grade.weighted}%` : '—'}
              </span>
              <span style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#C84B0A' }}>
                {grade.letter || '—'}
              </span>
              <span></span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
