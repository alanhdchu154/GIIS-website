import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';
import LessonVideoEmbed from '../../main/LessonVideoEmbed';
import './learn-mobile.css';
import { getAssignmentProfile } from './assignmentProfile';
import expertLensHelpers from './syllabusExpertLens';

const API = getApiBase();
const { getExpertLens } = expertLensHelpers;

function ResourceCard({ icon, label, url, note, completedAt }) {
  if (!url) return null;
  const isDone = !!completedAt;
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: '1 1 100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '16px', background: '#f8f9fd', border: '1px solid #e0e6f0',
        borderRadius: '10px', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#2b3d6d'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e6f0'}
      >
        <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#444', lineHeight: 1.4 }}>{note || url}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '16px', color: '#aaa' }}>↗</span>
          {isDone && (
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#1b5e20', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '999px', padding: '2px 8px' }}>
              Done
            </span>
          )}
        </div>
      </div>
      </a>
    </div>
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

function ModuleLoadingState({ isEn, moduleOrder, courseName, inline = false }) {
  const content = (
    <div role="status" aria-live="polite" style={{
      padding: inline ? '18px 22px' : '22px 24px',
      background: '#fffaf2',
      border: '1px solid #f4c36a',
      borderRadius: '10px',
      color: '#8a5a00',
      fontSize: '14px',
      fontWeight: 700,
      lineHeight: 1.55,
    }}>
      <p style={{ margin: '0 0 4px', fontSize: '15px', color: '#6f4600' }}>
        {isEn ? `Switching to Module ${moduleOrder}...` : `正在切换到模块 ${moduleOrder}...`}
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: '#8a5a00', fontWeight: 600 }}>
        {isEn
          ? `${courseName ? `${courseName} ` : ''}quiz, assignment, and resources are refreshing together.`
          : `${courseName ? `${courseName} ` : ''}测验、作业与学习资源正在一起刷新。`}
      </p>
    </div>
  );
  if (inline) return content;
  return (
    <>
      <div className="row"><Nav language={isEn ? 'en' : 'zh-CN'} /></div>
      <div data-m="learn-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {content}
      </div>
    </>
  );
}

function modulePurpose({ course, mod, moduleOrder, isEn }) {
  const title = isEn ? mod.title : (mod.titleZh || mod.title);
  const courseName = isEn ? course?.name : (course?.nameZh || course?.name);
  if (!title || !courseName) return '';

  if (course?.department === 'English' || course?.department === 'English Language Arts') {
    return isEn
      ? `Why it matters: ${title} builds the reading and writing habits students reuse in later English, research, and college-readiness work.`
      : `为什么重要：${title} 会成为后续英语、研究写作与大学准备任务的基础能力。`;
  }
  if (course?.department === 'Mathematics') {
    return isEn
      ? `Why it matters: these skills become working tools for later math, science, and data problems.`
      : `为什么重要：这些技能会在后续数学、科学与数据题目中反复用到。`;
  }
  return isEn
    ? `Why it matters: this module connects ${courseName} Module ${moduleOrder} to later coursework and stronger submitted work.`
    : `为什么重要：本模块会衔接 ${courseName} 后续学习，并帮助你提交更完整的作业。`;
}

export default function ModulePage({ language }) {
  const isEn = language !== 'zh';
  const { slug, order } = useParams();
  const moduleOrder = parseInt(order, 10);
  const navigate = useNavigate();
  const [session] = useState(() => getStudentSession());

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
  const [moduleProgress, setModuleProgress] = useState(null);

  const [error, setError] = useState('');
  const [loadingModule, setLoadingModule] = useState(true);
  const requestSeq = useRef(0);

  function resetModuleState() {
    setMod(null);
    setQuizQuestions([]);
    setPrevAttempt(null);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizPhase('idle');
    setQuizSubmitting(false);
    setAssignmentText('');
    setPrevSubmission(null);
    setAssigning(false);
    setAssignDone(false);
    setModuleProgress(null);
    setError('');
    setLoadingModule(true);
  }

  const load = useCallback((options = {}) => {
    if (!session) return;
    const seq = options.seq || ++requestSeq.current;
    const signal = options.signal;
    if (options.reset !== false) resetModuleState();

    fetch(`${API}/api/enrollments/${slug}`, { credentials: 'include', signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (signal?.aborted || seq !== requestSeq.current) return;
        setCourse(d.course);
        const m = (d.course?.modules || []).find((x) => x.order === moduleOrder);
        if (!m) { navigate(`/learn/${slug}`, { replace: true }); return; }
        setMod(m);

        // quiz
        const qa = d.enrollment?.quizAttempts?.find((a) => a.moduleOrder === moduleOrder);
        if (qa) {
          setPrevAttempt(qa);
          setQuizPhase('submitted');
          // Auto-load questions for review (backend returns correct answers when attempt exists)
          fetch(`${API}/api/enrollments/${slug}/quiz/${moduleOrder}`, { credentials: 'include', signal })
            .then((r) => r.ok ? r.json() : {})
            .then((qd) => {
              if (signal?.aborted || seq !== requestSeq.current) return;
              if (qd.questions?.length) setQuizQuestions(qd.questions);
            })
            .catch(() => {});
        }

        // assignment
        const as = d.enrollment?.assignments?.find((a) => a.moduleOrder === moduleOrder);
        if (as) { setPrevSubmission(as); setAssignmentText(as.content); }
        const progress = d.enrollment?.moduleProgresses?.find((p) => p.moduleOrder === moduleOrder);
        setModuleProgress(progress || null);
        setLoadingModule(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || signal?.aborted || seq !== requestSeq.current) return;
        setLoadingModule(false);
        setError('Failed to load module');
      });
  }, [slug, moduleOrder, session, navigate]);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    const controller = new AbortController();
    const seq = ++requestSeq.current;
    load({ signal: controller.signal, seq });
    return () => controller.abort();
  }, [session, navigate, load]);

  async function loadQuiz() {
    const r = await fetch(`${API}/api/enrollments/${slug}/quiz/${moduleOrder}`, { credentials: 'include' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d.error || 'Quiz setup needs GIIS review before students can submit.');
      return;
    }
    if (!Array.isArray(d.questions) || d.questions.length === 0) {
      setError('Quiz setup needs GIIS review before students can submit.');
      return;
    }
    setError('');
    setQuizQuestions(d.questions);
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
    load({ reset: false }); // refresh enrollment (completedModules updated)
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
    if (r.ok) { const d = await r.json(); setPrevSubmission(d); setAssignDone(true); load({ reset: false }); }
  }

  if (!session) return null;
  if (error) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#c62828' }}>{error}</div>;
  if (!mod) return <ModuleLoadingState isEn={isEn} moduleOrder={moduleOrder} />;

  const totalModules = course?.modules?.length || 0;
  const quizAnsweredCount = Object.keys(quizAnswers).length;
  const quizAttempt = quizResult || prevAttempt;
  const assignmentProfile = mod.assignment ? getAssignmentProfile(mod.assignment) : null;
  const purpose = modulePurpose({ course, mod, moduleOrder, isEn });
  const lens = getExpertLens(course, mod);
  const hasAssignment = !!mod.assignment;
  const assignmentMissing = hasAssignment && !prevSubmission;

  return (
    <>
      <Helmet>
        <title>{isEn ? mod.title : (mod.titleZh || mod.title)} | GIIS Learn</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div data-m="learn-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {/* Breadcrumb */}
        <p data-m="breadcrumb" style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
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
          <h1 style={{ fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
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
            {purpose && (
              <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#2b3d6d', lineHeight: 1.55, fontWeight: 700 }}>
                {purpose}
              </p>
            )}
            {lens && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #c5d0f0' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: '#7a4f16', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {isEn ? 'Expert Lens' : '专家视角'}
                </p>
                <p style={{ margin: '0 0 5px', fontSize: '13px', color: '#3f3528', lineHeight: 1.6 }}>
                  <strong>{isEn ? 'Big idea: ' : '核心判断：'}</strong>{lens.insight}
                </p>
                <p style={{ margin: '0 0 5px', fontSize: '13px', color: '#5c5142', lineHeight: 1.6 }}>
                  <strong>{isEn ? 'Watch for: ' : '常见误区：'}</strong>{lens.watchFor}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#5c5142', lineHeight: 1.6 }}>
                  <strong>{isEn ? 'Transfer: ' : '迁移应用：'}</strong>{lens.transfer}
                </p>
              </div>
            )}
          </section>
        )}

        {loadingModule && (
          <div style={{ marginBottom: '32px' }}>
            <ModuleLoadingState
              isEn={isEn}
              moduleOrder={moduleOrder}
              courseName={isEn ? course?.name : (course?.nameZh || course?.name)}
              inline
            />
          </div>
        )}

        {!loadingModule && (<>
        {/* GIIS-recorded lecture (renders only when this module has been
            uploaded to YouTube — the manifest at /data/lessons-manifest.json
            is the source of truth). We also pass the current module title so
            stale manifests cannot attach the wrong video to a same-numbered
            but different module. */}
        {course?.name && mod?.order && (
          <LessonVideoEmbed course={course.name} moduleNumber={mod.order} moduleTitle={mod.title} />
        )}

        {/* Resources */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px' }}>
            {isEn ? 'Study Resources' : '学习资源'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ResourceCard
              icon="📖"
              label={isEn ? 'Reading' : '阅读材料'}
              url={mod.readingUrl}
              note={mod.readingNote}
              completedAt={moduleProgress?.readingCompletedAt}
            />
            <ResourceCard
              icon="▶️"
              label={isEn ? 'Video Lesson' : '视频课程'}
              url={mod.videoUrl}
              note={mod.videoNote}
              completedAt={moduleProgress?.videoCompletedAt}
            />
            {mod.video2Url && (
              <ResourceCard
                icon="🎬"
                label={isEn ? 'Supplemental Video' : '补充视频'}
                url={mod.video2Url}
                note={mod.video2Note}
                completedAt={moduleProgress?.supplementalVideoCompletedAt}
              />
            )}
            <ResourceCard
              icon="✏️"
              label={isEn ? 'Practice' : '练习'}
              url={mod.practiceUrl}
              note={mod.practiceNote}
              completedAt={moduleProgress?.practiceCompletedAt}
            />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {[
                {
                  title: isEn ? 'Evidence type' : '作业类型',
                  body: isEn ? assignmentProfile.label.en : assignmentProfile.label.zh,
                },
                {
                  title: isEn ? 'How to submit' : '如何提交',
                  body: isEn ? assignmentProfile.evidence.en : assignmentProfile.evidence.zh,
                },
                {
                  title: isEn ? 'Who reviews it' : '谁来批改',
                  body: isEn ? 'A GIIS teacher or advisor reviews submitted work from the admin grading queue.' : 'GIIS 老师或顾问会在后台批改队列中审阅提交内容。',
                },
                {
                  title: isEn ? 'What is graded' : '评分依据',
                  body: isEn ? assignmentProfile.rubricFocus.en : assignmentProfile.rubricFocus.zh,
                },
                {
                  title: isEn ? 'Review target' : '批改时限',
                  body: isEn ? 'Most assignments are reviewed within 5 business days; feedback appears here when graded.' : '多数作业会在 5 个工作日内批改，完成后反馈会显示在这里。',
                },
              ].map((item) => (
                <div key={item.title} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '8px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 5px', fontSize: '11px', fontWeight: 800, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: 1.55 }}>{item.body}</p>
                </div>
              ))}
            </div>
            {prevSubmission?.score != null && (
              <div style={{ padding: '12px 16px', background: '#f0f4ff', border: '1px solid #c5d0f0', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#2b3d6d', fontWeight: 700 }}>
                {isEn ? 'Assignment score: ' : '作业分数：'}{Math.round(Number(prevSubmission.score))}/100
              </div>
            )}
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
                    {/* Fill-in-blank: options is null */}
                    {(!q.options || q.options.length === 0) ? (
                      <input
                        type="text"
                        placeholder={isEn ? 'Type your answer…' : '输入答案…'}
                        value={quizAnswers[q.id] || ''}
                        onChange={e => setQuizAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #c5d0f0',
                          borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
                          background: quizAnswers[q.id] ? '#f0f4ff' : '#f8f9fd',
                        }}
                      />
                    ) : (
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
                    )}
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
                {!quizAttempt.passed && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#8a5a00', lineHeight: 1.55 }}>
                    {isEn
                      ? 'Before the next quiz or exam, review this module\'s objectives and study resources, then rewrite the missed ideas in your own words.'
                      : '进入下一次测验或考试前，建议先回看本模块学习目标与资源，并用自己的话整理答错的概念。'}
                  </p>
                )}
              </div>

              {/* Answer breakdown — works on first submit (quizResult) and on revisit (quizQuestions loaded) */}
              {quizQuestions.length > 0 && (() => {
                const breakdown = quizResult?.graded
                  ? quizResult.graded
                  : quizQuestions.map((q) => {
                      const given = (quizAttempt.answers?.[q.id] ?? '').toString().trim().toLowerCase();
                      const correct = q.answer ? given === q.answer.trim().toLowerCase() : null;
                      return { questionId: q.id, correct, correctAnswer: q.answer, yourAnswer: quizAttempt.answers?.[q.id], explanation: q.explanation };
                    });
                return (
                  <details open={!!quizResult}>
                    <summary style={{ fontSize: '13px', fontWeight: 700, color: '#2b3d6d', cursor: 'pointer', marginBottom: '12px' }}>
                      {isEn ? 'View answer breakdown' : '查看答题详情'}
                    </summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {quizQuestions.map((q, i) => {
                        const g = breakdown.find(x => x.questionId === q.id);
                        const isCorrect = g?.correct;
                        const isUnknown = g?.correct === null;
                        const bg = isUnknown ? '#f8f9fd' : isCorrect ? '#f1f8e9' : '#ffebee';
                        const border = isUnknown ? '#e0e6f0' : isCorrect ? '#c5e1a5' : '#ef9a9a';
                        const labelColor = isUnknown ? '#888' : isCorrect ? '#33691e' : '#b71c1c';
                        return (
                          <div key={q.id} style={{ padding: '14px', borderRadius: '8px', background: bg, border: `1px solid ${border}` }}>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: labelColor }}>
                              {isUnknown ? '•' : isCorrect ? '✓' : '✗'} Q{i + 1}: {q.question}
                            </p>
                            {g?.yourAnswer && !isCorrect && (
                              <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#555' }}>
                                {isEn ? 'Your answer: ' : '你的答案：'}<span style={{ color: '#c62828' }}>{g.yourAnswer}</span>
                              </p>
                            )}
                            {g?.correctAnswer && (
                              <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#555' }}>
                                {isEn ? 'Correct: ' : '正确答案：'}<strong style={{ color: '#2e7d32' }}>{g.correctAnswer}</strong>
                              </p>
                            )}
                            {g?.explanation && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>{g.explanation}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })()}
            </div>
          )}
        </section>

        {/* Navigation */}
        {quizAttempt && assignmentMissing && (
          <div style={{
            margin: '0 0 18px',
            padding: '14px 16px',
            background: '#fff8e1',
            border: '1px solid #f4c36a',
            borderRadius: '10px',
            color: '#6f4600',
            fontSize: '13px',
            lineHeight: 1.55,
          }}>
            <strong>{isEn ? 'Before moving on: ' : '进入下一模块前：'}</strong>
            {isEn
              ? 'the quiz unlocks the next module, but this assignment is still missing. Submit your work or a document link so your teacher can review it and your parent can see feedback.'
              : '测验会解锁下一模块，但本模块作业还未提交。请提交作业内容或文件链接，方便老师批改，也让家长看到反馈。'}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '24px', borderTop: '1px solid #e0e6f0' }}>
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
        </>)}
      </div>
    </>
  );
}
