import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// ─── Schedule helpers ─────────────────────────────────────────────────────────

export function typeStyle(color) {
  return {
    core:      { bg: '#e8edf7', color: '#2b3d6d', border: '#c5d0e8', label: 'Core Required' },
    pathway:   { bg: `${color}18`, color,          border: `${color}55`, label: 'Pathway'      },
    supporting:{ bg: '#e8f5e9', color: '#1e6640',  border: '#b8dfc4', label: 'Recommended'   },
  };
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

export function QuizSection({ questions, color }) {
  const [selected, setSelected] = useState({});
  const [revealed, setRevealed] = useState({});

  const answered = Object.keys(revealed).length;
  const correct  = Object.keys(revealed).filter((qi) => selected[+qi] === questions[+qi].ans).length;

  function choose(qi, oi) { if (!revealed[qi]) setSelected((s) => ({ ...s, [qi]: oi })); }
  function reveal(qi)     { if (selected[qi] !== undefined) setRevealed((r) => ({ ...r, [qi]: true })); }

  return (
    <div>
      {answered > 0 && (
        <div style={{ marginBottom: 20, padding: '10px 16px', borderRadius: 8, background: correct === answered ? '#e8f5e9' : '#fff3e0', border: `1px solid ${correct === answered ? '#4caf50' : '#ff9800'}`, fontSize: 14, fontWeight: 600, color: '#333' }}>
          Score: {correct} / {answered} answered correctly
        </div>
      )}
      {questions.map((q, qi) => {
        const picked = selected[qi], done = revealed[qi];
        return (
          <div key={qi} style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 10, border: '1px solid #e8e8e8', background: done ? (picked === q.ans ? '#f0fdf4' : '#fff5f5') : '#fafafa' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#222', lineHeight: 1.5 }}>{qi + 1}. {q.q}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.opts.map((opt, oi) => {
                let bg = '#fff', border = '1px solid #ddd', c = '#444';
                if (done) {
                  if (oi === q.ans)                       { bg = '#dcfce7'; border = '1px solid #4caf50'; c = '#166534'; }
                  else if (oi === picked && picked !== q.ans) { bg = '#fee2e2'; border = '1px solid #ef4444'; c = '#991b1b'; }
                } else if (oi === picked) { bg = `${color}18`; border = `1px solid ${color}`; c = color; }
                return (
                  <button key={oi} onClick={() => choose(qi, oi)} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 6, background: bg, border, color: c, fontSize: 13, cursor: done ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}>
                    <span style={{ fontWeight: 600, marginRight: 8 }}>{['A','B','C','D'][oi]}.</span>{opt}
                  </button>
                );
              })}
            </div>
            {!done && picked !== undefined && (
              <button onClick={() => reveal(qi)} style={{ marginTop: 10, padding: '7px 18px', borderRadius: 6, background: color, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Check Answer</button>
            )}
            {done && <div style={{ marginTop: 10, fontSize: 13, color: '#555', lineHeight: 1.6, padding: '10px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 6 }}><strong>Explanation:</strong> {q.exp}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Resources ───────────────────────────────────────────────────────────────

export function ResourcesSection({ resources, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {resources.map((r, i) => (
        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', padding: '14px 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', textDecoration: 'none', transition: 'box-shadow 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 2px 12px ${color}25`}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>▶</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{r.title}</p>
              <p style={{ margin: '2px 0 4px', fontSize: 12, color, fontWeight: 500 }}>{r.channel}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.5 }}>{r.note}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Syllabus ─────────────────────────────────────────────────────────────────

export function SyllabusSection({ syllabus, color }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Learning Objectives</h4>
        <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
          {syllabus.objectives.map((obj, i) => <li key={i} style={{ fontSize: 14, color: '#444', marginBottom: 6, lineHeight: 1.5 }}>{obj}</li>)}
        </ul>
      </div>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weekly Outline</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {syllabus.units.map((u, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 14px', borderRadius: 6, background: i % 2 === 0 ? `${color}08` : '#fff', border: `1px solid ${color}20` }}>
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color, minWidth: 56 }}>Wk {u.week}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#222' }}>{u.topic}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#666', lineHeight: 1.5 }}>{u.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

export function CourseCard({ course, color, emoji = '📚' }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState('overview');
  const tabs = [
    { id: 'overview',   label: 'Overview' },
    { id: 'syllabus',   label: 'Syllabus' },
    { id: 'resources',  label: 'Resources' },
    { id: 'quiz',       label: `Quiz (${course.quiz.length}Q)` },
  ];
  return (
    <div id={course.id} style={{ border: `1px solid ${open ? color : '#e0e0e0'}`, borderRadius: 10, overflow: 'hidden', background: '#fff', scrollMarginTop: 80 }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: open ? `${color}08` : '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 8, background: open ? color : `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{emoji}</div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: open ? color : '#1a1a2e' }}>{course.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>Grade {course.grade} · {course.term} · {course.credits} credit{course.credits !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span style={{ color, fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${color}20` }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${color}20`, padding: '0 20px', background: `${color}05` }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? color : '#888', borderBottom: tab === t.id ? `2px solid ${color}` : '2px solid transparent', marginBottom: -1, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ padding: 20 }}>
            {tab === 'overview'  && (
              <div>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#444', lineHeight: 1.7 }}>{course.description}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[`Grade ${course.grade}`, `${course.term} Semester`, `${course.credits} Credit${course.credits !== 1 ? 's' : ''}`, `${course.quiz.length} Quiz Questions`, `${course.resources.length} Resources`].map((tag) => (
                    <span key={tag} style={{ padding: '4px 12px', borderRadius: 20, background: `${color}18`, color, fontSize: 12, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {tab === 'syllabus'  && <SyllabusSection  syllabus={course.syllabus}   color={color} />}
            {tab === 'resources' && <ResourcesSection resources={course.resources} color={color} />}
            {tab === 'quiz'      && <QuizSection       questions={course.quiz}      color={color} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Schedule Grid ────────────────────────────────────────────────────────────

export function ScheduleGrid({ schedule, color, onCourseClick }) {
  const styles = typeStyle(color);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(styles).map(([type, s]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.bg, border: `1px solid ${s.border}`, display: 'inline-block' }} />
            <span style={{ color: '#555', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {schedule.map(({ grade, term, courses }) => {
          const totalCr = courses.reduce((s, c) => s + c.credits, 0);
          return (
            <div key={`${grade}-${term}`} style={{ borderRadius: 10, border: '1px solid #e8e8e8', overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '10px 14px', background: '#1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Grade {grade} — {term}</span>
                <span style={{ color: '#9b9fc5', fontSize: 12 }}>{totalCr} cr</span>
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {courses.map((c, i) => {
                  const s = styles[c.type] || styles.core;
                  const clickable = !!c.courseId;
                  return (
                    <div key={i} onClick={() => clickable && onCourseClick(c.courseId)}
                      style={{ padding: '7px 10px', borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`, cursor: clickable ? 'pointer' : 'default', transition: clickable ? 'opacity 0.15s' : 'none' }}
                      onMouseEnter={(e) => clickable && (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: c.type === 'pathway' ? 700 : 500, color: s.color, lineHeight: 1.3 }}>
                          {clickable ? '→ ' : ''}{c.name}
                        </span>
                        <span style={{ fontSize: 11, color: s.color, opacity: 0.7, flexShrink: 0 }}>{c.credits}cr</span>
                      </div>
                      {c.note && <p style={{ margin: '3px 0 0', fontSize: 10, color: s.color, opacity: 0.7, lineHeight: 1.3 }}>{c.note}</p>}
                      {c.dept && c.type !== 'pathway' && <p style={{ margin: '2px 0 0', fontSize: 10, color: s.color, opacity: 0.6 }}>{c.dept}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PathwayPage (full template) ──────────────────────────────────────────────

export function PathwayPage({ meta, schedule, courses }) {
  const { color, title, subtitle, emoji: pathEmoji, heroDescription, targets, courseEmoji, collegeNote, stats: extraStats } = meta;

  function scrollToCourse(courseId) {
    const el = document.getElementById(courseId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { const btn = el.querySelector('button'); const isOpen = el.querySelector('[style*="border-top"]'); if (!isOpen && btn) btn.click(); }, 400);
  }

  const totalPathwayCr = schedule.flatMap((s) => s.courses).filter((c) => c.type === 'pathway').reduce((s, c) => s + c.credits, 0);

  const stats = [
    { label: 'Total Courses (4 yrs)', value: schedule.flatMap((s) => s.courses).length },
    { label: 'Pathway Courses',       value: courses.length },
    { label: 'Pathway Credits',       value: totalPathwayCr },
    { label: 'Quiz Questions',        value: courses.reduce((s, c) => s + c.quiz.length, 0) },
    ...(extraStats || []),
  ];

  const yearMeta = {
    9:  { label: 'Year 1 — Foundation',      icon: '🌱' },
    10: { label: 'Year 2 — Exploration',     icon: '🔍' },
    11: { label: 'Year 3 — Advanced Study',  icon: '🎓' },
    12: { label: 'Year 4 — Mastery',         icon: '🔬' },
  };

  return (
    <>
      <Helmet>
        <title>{title} Pathway | Genesis of Ideas International School</title>
        <meta name="description" content={`Complete 4-year ${title} pathway at GIIS — full schedule, syllabi, resources, and quizzes.`} />
      </Helmet>

      {/* Back to hub */}
      <div style={{ background: '#1a1a2e', padding: '10px 32px' }}>
        <Link to="/academics" style={{ color: '#9b9fc5', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>← Academics</Link>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 60%, #1a0a2e 100%)`, color: '#fff', padding: '72px 32px 56px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Academic Pathway</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 56, lineHeight: 1 }}>{pathEmoji}</div>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, fontFamily: 'Inter, sans-serif' }}>{title}</h1>
              <p style={{ margin: '0 0 4px', fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{subtitle}</p>
            </div>
          </div>
          <p style={{ margin: '20px 0 28px', fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', maxWidth: 620 }}>{heroDescription}</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '12px 18px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, backdropFilter: 'blur(4px)' }}>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Targets */}
      <div style={{ background: '#f8f8fb', borderBottom: '1px solid #eee', padding: '24px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Who is this pathway for?</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {targets.map((t) => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 20, background: `${color}12`, border: `1px solid ${color}30`, fontSize: 13, color: '#333', fontWeight: 500 }}>🎯 {t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '56px 32px' }}>

        {/* Schedule */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Complete 4-Year Schedule</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>
            Every course across all 8 semesters. <strong style={{ color }}>Click any Pathway course to jump to its full content below.</strong>
          </p>
          <ScheduleGrid schedule={schedule} color={color} onCourseClick={scrollToCourse} />
        </div>

        {/* Course details */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Pathway Course Details</h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 28px', lineHeight: 1.6 }}>Full syllabus, resources, and interactive quiz for each course. Click to expand.</p>

        {[9, 10, 11, 12].map((grade) => {
          const gradeCourses = courses.filter((c) => c.grade === grade);
          if (gradeCourses.length === 0) return null;
          const gm = yearMeta[grade];
          return (
            <div key={grade} style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{gm.icon}</div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color }}>{gm.label}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gradeCourses.map((c) => <CourseCard key={c.id} course={c} color={color} emoji={courseEmoji} />)}
              </div>
            </div>
          );
        })}

        {/* College note */}
        <div style={{ marginTop: 8, padding: '22px 26px', borderRadius: 12, background: `${color}08`, border: `1px solid ${color}25` }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color }}>College Application Advantage</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.7 }}>{collegeNote}</p>
        </div>
      </div>
    </>
  );
}
