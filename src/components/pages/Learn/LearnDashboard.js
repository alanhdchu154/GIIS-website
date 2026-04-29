import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

const DEPT_COLORS = {
  Mathematics: '#2b3d6d',
  English: '#C84B0A',
  'English Language Arts': '#C84B0A',
  Science: '#1B6B3A',
  'Social Studies': '#5b2c6f',
  Psychology: '#7B3F00',
  Business: '#1565C0',
  Technology: '#00695c',
  'Physical Education': '#37474f',
  Elective: '#546e7a',
};

const GRAD_CREDITS = 24;

const DEPT_TO_PATHWAY = {
  'Psychology':           { label: 'Psychology',     slug: 'psychology' },
  'Business':             { label: 'Business',        slug: 'business' },
  'Mathematics':          { label: 'Math & Data',     slug: 'math' },
  'English':              { label: 'Communications',  slug: 'communications' },
  'English Language Arts':{ label: 'Communications',  slug: 'communications' },
  'Science':              { label: 'Engineering',     slug: 'engineering' },
  'Technology':           { label: 'Computer Science',slug: 'cs' },
  'Social Studies':       { label: 'Economics',       slug: 'economics' },
  'Elective':             { label: 'Arts & Design',   slug: 'arts' },
};

const LETTER_TO_GPA = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

const GRADE_COLOR = {
  'A': '#1b5e20', 'A-': '#2e7d32', 'B+': '#1565c0', 'B': '#1976d2',
  'B-': '#1976d2', 'C+': '#e65100', 'C': '#ef6c00', 'C-': '#f57c00',
  'D+': '#b71c1c', 'D': '#c62828', 'F': '#c62828',
};

function computeGPA(enrollments) {
  let wSum = 0, cSum = 0;
  for (const enr of enrollments) {
    if (!enr.creditEarned || !enr.grade?.letter) continue;
    const gpa = LETTER_TO_GPA[enr.grade.letter] ?? null;
    if (gpa === null) continue;
    const cr = Number(enr.course.credits) || 1;
    wSum += gpa * cr;
    cSum += cr;
  }
  return cSum > 0 ? (wSum / cSum).toFixed(2) : null;
}

function passedModuleSet(enr) {
  return new Set(
    (enr.quizAttempts || []).filter((a) => Number(a.score) >= 60).map((a) => a.moduleOrder)
  );
}

function nextModule(enr) {
  const passed = passedModuleSet(enr);
  const total = enr.course._count?.modules || 14;
  for (let i = 1; i <= total; i++) {
    if (!passed.has(i)) return i;
  }
  return null;
}

function ProgressBar({ completed, total, color = '#2b3d6d' }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '5px', marginTop: '10px' }}>
      <div style={{ width: `${pct}%`, background: color, borderRadius: '4px', height: '100%', transition: 'width 0.4s' }} />
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px',
      padding: '20px 24px', flex: '1', minWidth: '120px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

function CourseCard({ enr, isEn }) {
  const total = enr.course._count?.modules || 14;
  const completed = passedModuleSet(enr).size;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color = DEPT_COLORS[enr.course.department] || '#2b3d6d';
  const letter = enr.grade?.letter;
  const gradeColor = letter ? (GRADE_COLOR[letter] || '#2b3d6d') : null;
  const next = nextModule(enr);
  const continueTo = next
    ? `/learn/${enr.course.slug}/module/${next}`
    : `/learn/${enr.course.slug}`;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e6f0', borderTop: `4px solid ${color}`,
      borderRadius: '10px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {enr.course.department}
        </span>
        {letter && (
          <span style={{
            fontSize: '13px', fontWeight: 800, color: gradeColor,
            background: gradeColor + '18', padding: '2px 10px', borderRadius: '20px',
          }}>
            {letter}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', margin: '6px 0 2px', lineHeight: 1.3 }}>
        {isEn ? enr.course.name : (enr.course.nameZh || enr.course.name)}
      </h3>

      <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
        {enr.course.credits} {isEn ? 'credit' : '学分'} · {total} {isEn ? 'modules' : '模块'}
        {enr.grade?.weighted !== null && enr.grade?.weighted !== undefined
          ? ` · ${Math.round(enr.grade.weighted * 10) / 10}%` : ''}
      </p>

      {enr.creditEarned ? (
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
            ✓ {isEn ? 'Credit earned' : '已获学分'}
          </span>
          <Link to={`/learn/${enr.course.slug}`} style={{ fontSize: '12px', color: '#2b3d6d', textDecoration: 'none', fontWeight: 600 }}>
            {isEn ? 'Review →' : '查看 →'}
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: '#444', fontWeight: 600 }}>{pct}% {isEn ? 'complete' : '已完成'}</span>
            <Link to={continueTo} style={{
              fontSize: '12px', fontWeight: 700, color: '#fff', background: color,
              padding: '4px 12px', borderRadius: '6px', textDecoration: 'none',
            }}>
              {isEn ? 'Continue →' : '继续学习 →'}
            </Link>
          </div>
          <ProgressBar completed={completed} total={total} color={color} />
        </>
      )}
    </div>
  );
}

function useEnrollments() {
  const [enrollments, setEnrollments] = useState(null);
  const reload = () => {
    fetch(`${API}/api/enrollments`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEnrollments(d || []))
      .catch(() => setEnrollments([]));
  };
  useEffect(reload, []);
  return { enrollments, reload };
}

function useCourses() {
  const [courses, setCourses] = useState(null);
  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => setCourses([]));
  }, []);
  return courses;
}

export default function LearnDashboard({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const session = getStudentSession();
  const { enrollments, reload } = useEnrollments();
  const allCourses = useCourses();
  const [enrolling, setEnrolling] = useState(null);
  const [enrollErr, setEnrollErr] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  async function enroll(slug) {
    setEnrolling(slug);
    setEnrollErr('');
    try {
      const r = await fetch(`${API}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setEnrollErr(d.error || 'Enrollment failed');
      } else {
        reload();
      }
    } catch {
      setEnrollErr('Network error');
    } finally {
      setEnrolling(null);
    }
  }

  if (!session) return null;

  const myEnrollments = enrollments || [];
  const inProgress = myEnrollments.filter((e) => !e.creditEarned);
  const completed = myEnrollments.filter((e) => e.creditEarned);

  // Stats
  const creditsEarned = completed.reduce((s, e) => s + Number(e.course.credits), 0);
  const gpa = computeGPA(myEnrollments);

  // Graduation
  const isGradEligible = creditsEarned >= GRAD_CREDITS;
  const latestCreditDate = completed
    .filter((e) => e.creditEarnedAt)
    .map((e) => new Date(e.creditEarnedAt))
    .sort((a, b) => b - a)[0];
  const eligibleDateStr = latestCreditDate
    ? latestCreditDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  // Continue learning: first in-progress course with a next module
  const spotlight = inProgress.find((e) => nextModule(e) !== null) || inProgress[0];

  // Catalog
  const enrolledSlugs = new Set(myEnrollments.map((e) => e.course.slug));
  const departments = allCourses
    ? ['All', ...Array.from(new Set(allCourses.map((c) => c.department))).sort()]
    : ['All'];
  const catalogCourses = (allCourses || []).filter((c) =>
    !enrolledSlugs.has(c.slug) && (deptFilter === 'All' || c.department === deptFilter)
  );

  // Detect predominant pathway from enrollments
  const deptCount = {};
  myEnrollments.forEach((e) => { const d = e.course.department; deptCount[d] = (deptCount[d] || 0) + 1; });
  const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const detectedPathway = topDept ? DEPT_TO_PATHWAY[topDept] : null;

  return (
    <>
      <Helmet>
        <title>{isEn ? 'My Dashboard' : '学习中心'} | GIIS</title>
      </Helmet>
      <div className="row">
        <Nav language={language} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 5% 100px', fontFamily: 'Inter, sans-serif' }}>

        {/* Header + Pathway badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              {isEn ? 'Student Portal' : '学生平台'}
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
              {isEn ? `Welcome back, ${session.student?.name || 'Student'}` : `欢迎回来，${session.student?.name || '同学'}`}
            </h1>
          </div>
          {detectedPathway && (
            <Link to={`/pathways/${detectedPathway.slug}`} style={{
              display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
              background: '#f0f4ff', border: '1.5px solid #c5d0f0', borderRadius: '10px',
              padding: '10px 16px', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {isEn ? 'Your Pathway' : '学习方向'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e' }}>
                {detectedPathway.label} →
              </span>
            </Link>
          )}
        </div>

        {/* Stats */}
        {myEnrollments.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <StatCard label={isEn ? 'Credits Earned' : '已获学分'} value={creditsEarned % 1 === 0 ? creditsEarned : creditsEarned.toFixed(1)} sub={`/ ${GRAD_CREDITS} ${isEn ? 'to graduate' : '毕业学分'}`} />
            <StatCard label={isEn ? 'Completed' : '已完成'} value={completed.length} sub={isEn ? `of ${myEnrollments.length} courses` : `共 ${myEnrollments.length} 门`} />
            <StatCard label="GPA" value={gpa ?? '—'} sub={isEn ? '4.0 scale' : '4.0 制'} />
            <StatCard label={isEn ? 'In Progress' : '进行中'} value={inProgress.length} sub={isEn ? 'active courses' : '门进行中'} />
          </div>
        )}

        {/* Graduation banner */}
        {myEnrollments.length > 0 && (isGradEligible ? (
          <div style={{
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            borderRadius: '14px', padding: '22px 28px', marginBottom: '28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#a5d6a7', letterSpacing: '2px', margin: '0 0 4px' }}>🎓 CONGRATULATIONS</p>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>You've earned your High School Diploma</h2>
              <p style={{ fontSize: '12px', color: '#a5d6a7', margin: 0 }}>
                {creditsEarned} credits {eligibleDateStr ? `· Eligible ${eligibleDateStr}` : ''}
              </p>
            </div>
            <Link to={`/diploma/${session.student?.id}`} style={{
              background: '#fff', color: '#1b5e20', fontWeight: 800, fontSize: '13px',
              padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>View Diploma →</Link>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '18px 24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 2px' }}>
                  {isEn ? 'Graduation Progress' : '毕业进度'}
                </p>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  {creditsEarned} / {GRAD_CREDITS} {isEn ? 'credits earned' : '学分已获'}
                </p>
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#2b3d6d' }}>
                {Math.round((creditsEarned / GRAD_CREDITS) * 100)}%
              </span>
            </div>
            <div style={{ background: '#e8ecf5', borderRadius: '6px', height: '7px' }}>
              <div style={{ width: `${Math.min(100, (creditsEarned / GRAD_CREDITS) * 100)}%`, background: 'linear-gradient(to right, #2b3d6d, #4a6fa5)', borderRadius: '6px', height: '100%', transition: 'width 0.5s' }} />
            </div>
            <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0' }}>
              {Math.max(0, GRAD_CREDITS - creditsEarned)} {isEn ? 'more credits needed' : '学分还差'}
            </p>
          </div>
        ))}

        {/* Continue learning spotlight */}
        {spotlight && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)',
            borderRadius: '14px', padding: '22px 28px', marginBottom: '36px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#aab8d4', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {isEn ? 'Continue Learning' : '继续学习'}
              </p>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
                {isEn ? spotlight.course.name : (spotlight.course.nameZh || spotlight.course.name)}
              </h2>
              <p style={{ fontSize: '12px', color: '#aab8d4', margin: 0 }}>
                {isEn ? `Module ${nextModule(spotlight) || '—'} of ${spotlight.course._count?.modules || 14}` : `第 ${nextModule(spotlight) || '—'} / ${spotlight.course._count?.modules || 14} 模块`}
              </p>
            </div>
            <Link
              to={nextModule(spotlight) ? `/learn/${spotlight.course.slug}/module/${nextModule(spotlight)}` : `/learn/${spotlight.course.slug}`}
              style={{ background: '#fff', color: '#1a1a2e', fontWeight: 800, fontSize: '13px', padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {isEn ? 'Go to Module →' : '进入模块 →'}
            </Link>
          </div>
        )}

        {/* My Courses */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', marginBottom: '16px' }}>
            {isEn ? `My Courses (${myEnrollments.length})` : `我的课程 (${myEnrollments.length})`}
          </h2>

          {myEnrollments.length === 0 ? (
            <div style={{ background: '#f8f9ff', border: '2px dashed #c5d0f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#2b3d6d', margin: '0 0 8px' }}>
                {isEn ? "You're not enrolled in any courses yet." : '你还没有报名任何课程。'}
              </p>
              <p style={{ fontSize: '13px', color: '#888', margin: '0 0 16px' }}>
                {isEn ? 'Browse the course catalog below to get started.' : '在下方课程目录找到你感兴趣的课程开始学习。'}
              </p>
            </div>
          ) : (
            <>
              {inProgress.length > 0 && (
                <>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                    {isEn ? `In Progress — ${inProgress.length}` : `进行中 — ${inProgress.length}`}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {inProgress.map((enr) => <CourseCard key={enr.id} enr={enr} isEn={isEn} />)}
                  </div>
                </>
              )}
              {completed.length > 0 && (
                <>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                    {isEn ? `Completed — ${completed.length}` : `已完成 — ${completed.length}`}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {completed.map((enr) => <CourseCard key={enr.id} enr={enr} isEn={isEn} />)}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* Enroll in More Courses — always visible */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 2px' }}>
                {isEn ? 'Enroll in More Courses' : '新增课程'}
              </h2>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                {isEn ? `${(allCourses || []).filter(c => !enrolledSlugs.has(c.slug)).length} courses available` : `${(allCourses || []).filter(c => !enrolledSlugs.has(c.slug)).length} 门可选`}
              </p>
            </div>
            {detectedPathway && (
              <Link to={`/pathways/${detectedPathway.slug}`} style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none' }}>
                {isEn ? `View ${detectedPathway.label} Pathway →` : `查看 ${detectedPathway.label} 路径 →`}
              </Link>
            )}
          </div>

          {/* Department filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {departments.map((dept) => (
              <button key={dept} onClick={() => setDeptFilter(dept)} style={{
                fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px', cursor: 'pointer',
                background: deptFilter === dept ? '#1a1a2e' : '#f0f2f8',
                color: deptFilter === dept ? '#fff' : '#444', border: 'none',
              }}>{dept}</button>
            ))}
          </div>

          {enrollErr && <p style={{ color: '#c62828', marginBottom: '12px', fontSize: '14px' }}>{enrollErr}</p>}

          {catalogCourses.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', padding: '20px 0' }}>
              {isEn ? 'No more courses in this department.' : '该分类暂无更多课程。'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '12px' }}>
              {catalogCourses.map((c) => {
                const color = DEPT_COLORS[c.department] || '#2b3d6d';
                return (
                  <div key={c.slug} style={{ background: '#fff', border: '1px solid #e0e6f0', borderTop: `4px solid ${color}`, borderRadius: '10px', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px' }}>{c.department}</span>
                      <span style={{ fontSize: '10px', background: '#f0f2f8', color: '#2b3d6d', padding: '2px 7px', borderRadius: '20px', fontWeight: 600 }}>{c.type}</span>
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '4px 0 3px' }}>
                      {isEn ? c.name : (c.nameZh || c.name)}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#666', lineHeight: 1.5, margin: '0 0 12px', minHeight: '32px' }}>{c.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#888' }}>{c.credits} {isEn ? 'cr' : '学分'} · {c._count?.modules || 0} {isEn ? 'mod' : '模块'}</span>
                      <button onClick={() => enroll(c.slug)} disabled={enrolling === c.slug} style={{
                        fontSize: '12px', fontWeight: 700, color: '#fff',
                        background: enrolling === c.slug ? '#aaa' : color,
                        border: 'none', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer',
                      }}>
                        {enrolling === c.slug ? (isEn ? 'Enrolling…' : '报名中…') : (isEn ? '+ Enroll' : '+ 报名')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
