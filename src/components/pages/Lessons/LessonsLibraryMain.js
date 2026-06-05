import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

/**
 * LessonsLibraryMain — public "What We Teach" lesson library.
 *
 * A prospective (non-paying) parent's strongest trust signal is a real,
 * growing library of actual lessons. This page reads the same
 * /data/lessons-manifest.json the Learn Portal uses (built by
 * tools/youtube-upload/build_manifest.py) and lays every uploaded lesson out
 * by course, with a click-to-play modal. Counts are computed from the manifest
 * so the page grows on its own as the daily pipeline publishes more — never
 * hardcode the totals.
 *
 * Honesty guardrails (CLAUDE.md): these are foundation (non-AP) lessons. No
 * AP / accredited / Common App claims on this surface.
 */

const YT_CHANNEL = 'https://www.youtube.com/@GenesisOfIdeasInternational';

const NAVY = '#1a1a2e';
const NAVY_2 = '#2b3d6d';
const GOLD = '#d5a836';

function thumb(youtubeId) {
  return youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null;
}

function LessonsLibraryMain({ language, toggleLanguage }) {
  const isEn = language !== 'zh';
  const [byCourse, setByCourse] = useState(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null); // { course, lesson }

  useEffect(() => {
    let cancelled = false;
    fetch('/data/lessons-manifest.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((manifest) => {
        if (cancelled) return;
        setByCourse(manifest.by_course || {});
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Close modal on Escape.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const courses = useMemo(() => {
    if (!byCourse) return [];
    const names = Object.keys(byCourse).filter((c) => (byCourse[c] || []).length);
    // Lead with the fullest course so the first impression is the strongest;
    // grows on its own as the daily pipeline fills out each course.
    names.sort((a, b) => (byCourse[b].length - byCourse[a].length) || a.localeCompare(b));
    return names.map((name) => ({
      name,
      lessons: [...byCourse[name]].sort((a, b) => a.module_number - b.module_number),
    }));
  }, [byCourse]);

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessons.length, 0),
    [courses],
  );

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Lesson Library — What We Teach | GIIS' : '课程库 — 我们教什么 | GIIS'}</title>
        <meta
          name="description"
          content={isEn
            ? 'Watch real GIIS lessons before you enroll: the actual videos current students learn from, organized by course and growing every week.'
            : '入学前先看真实课堂：在读学生正在学习的课程影片，按课程分类，每周持续新增。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero */}
      <section style={{ background: NAVY, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 6% 52px', textAlign: 'center' }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
            {isEn ? 'What We Teach' : '我们教什么'}
          </p>
          <h1 style={{ fontSize: 'clamp(30px, 4.4vw, 50px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 18px', letterSpacing: '-0.01em' }}>
            {isEn ? 'Real lessons. Taught on video.' : '真实课堂，录成影片。'}
          </h1>
          <p style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.78)', maxWidth: 620, margin: '0 auto 26px', lineHeight: 1.65 }}>
            {isEn
              ? 'These are the actual lessons our students learn from — not a trailer. Browse them before you decide. New lessons are added every week.'
              : '这些就是在读学生正在学习的真实课程，不是预告片。你可以在决定前自由浏览。课程每周持续新增。'}
          </p>
          {totalLessons > 0 && (
            <div style={{ display: 'inline-flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', padding: '16px 26px', background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)' }}>
              <Stat n={totalLessons} label={isEn ? 'lessons online' : '节课已上线'} />
              <Stat n={courses.length} label={isEn ? 'courses' : '门课程'} />
              <Stat n={isEn ? 'Weekly' : '每周'} label={isEn ? 'new lessons' : '持续新增'} small />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#f4f6fb', fontFamily: 'Inter, sans-serif', padding: '52px 0 72px', minHeight: 320 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 6%' }}>
          {error && (
            <p style={{ textAlign: 'center', color: '#7a8294' }}>
              {isEn ? 'The lesson library is temporarily unavailable. Please try again shortly.' : '课程库暂时无法载入，请稍后再试。'}
            </p>
          )}
          {!error && !byCourse && (
            <p style={{ textAlign: 'center', color: '#7a8294' }}>{isEn ? 'Loading lessons…' : '正在载入课程…'}</p>
          )}

          {courses.map((course) => (
            <div key={course.name} style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.01em' }}>{course.name}</h2>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#8a90a2' }}>
                  {isEn ? `${course.lessons.length} lessons` : `${course.lessons.length} 节课`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))', gap: 18 }}>
                {course.lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.youtube_id || lesson.module_number}
                    lesson={lesson}
                    isEn={isEn}
                    onPlay={() => setActive({ course: course.name, lesson })}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* CTA */}
          {totalLessons > 0 && (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <Link to="/apply" style={goldCta}>
                {isEn ? 'Apply to enroll →' : '立即申请入学 →'}
              </Link>
              <Link to="/pricing" style={outlineCta}>
                {isEn ? 'See plans & pricing' : '查看方案与价格'}
              </Link>
              <a href={YT_CHANNEL} target="_blank" rel="noopener noreferrer" style={outlineCta}>
                {isEn ? 'Watch on YouTube →' : '在 YouTube 观看 →'}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Play modal */}
      {active && (
        <div
          onClick={() => setActive(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,12,20,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4vw' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(960px, 100%)', background: NAVY, borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '14px 18px', color: '#fff', background: '#6B1F2A', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 15 }}>{active.course}</strong>
              <span style={{ opacity: 0.85, fontSize: 13 }}>
                {isEn ? `Module ${active.lesson.module_number}` : `第 ${active.lesson.module_number} 模块`} — {active.lesson.module_title}
              </span>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label={isEn ? 'Close' : '关闭'}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 22, lineHeight: 1, cursor: 'pointer', opacity: 0.8 }}
              >
                ×
              </button>
            </div>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                title={`${active.course} Module ${active.lesson.module_number}`}
                src={`${active.lesson.embed_url}?rel=0&modestbranding=1&autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ n, label, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontSize: small ? 20 : 26, fontWeight: 800, color: GOLD, lineHeight: 1.1 }}>{n}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{label}</span>
    </div>
  );
}

function LessonCard({ lesson, isEn, onPlay }) {
  const [hover, setHover] = useState(false);
  const img = thumb(lesson.youtube_id);
  return (
    <button
      type="button"
      onClick={onPlay}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        padding: 0,
        background: '#fff',
        border: '1px solid #e0e6f0',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hover ? '0 14px 30px -10px rgba(26,26,46,0.28)' : '0 2px 8px rgba(26,26,46,0.06)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
        {img && (
          <img src={img} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hover ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.10)', transition: 'background 0.15s' }}>
          <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B1F2A', fontSize: 18, paddingLeft: 3 }}>▶</span>
        </span>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', color: NAVY_2, textTransform: 'uppercase' }}>
          {isEn ? `Module ${lesson.module_number}` : `第 ${lesson.module_number} 模块`}
        </span>
        <p style={{ margin: '5px 0 0', fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.35 }}>
          {lesson.module_title}
        </p>
      </div>
    </button>
  );
}

const goldCta = {
  padding: '13px 28px',
  borderRadius: 10,
  background: GOLD,
  color: NAVY,
  fontWeight: 800,
  fontSize: 14,
  textDecoration: 'none',
  boxShadow: '0 4px 14px rgba(213, 168, 54, 0.3)',
};

const outlineCta = {
  padding: '13px 28px',
  borderRadius: 10,
  border: '2px solid #d4d8e0',
  color: NAVY_2,
  fontWeight: 700,
  fontSize: 14,
  textDecoration: 'none',
};

export default LessonsLibraryMain;
