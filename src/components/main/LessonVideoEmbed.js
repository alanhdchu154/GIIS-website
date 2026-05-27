import React, { useEffect, useState } from 'react';

/**
 * Embed the GIIS YouTube lesson for a given course + module number.
 *
 * Reads /data/lessons-manifest.json (built by tools/youtube-upload/build_manifest.py)
 * and matches on { course, module_number }. Shows a YouTube iframe when found,
 * shows nothing when the lesson hasn't been uploaded yet.
 *
 * Usage:
 *   <LessonVideoEmbed course="Algebra I" moduleNumber={4} />
 *
 * Props:
 *   - course        string   e.g. "Algebra I" — must match script.json's "course"
 *   - moduleNumber  number   e.g. 4 — matches "Module 4: …"
 *   - moduleTitle   string   expected course module title; guards against stale
 *                            YouTube manifests with mismatched module numbering
 *   - className     string   optional wrapper class
 *   - showTitle     bool     default true; show "Watch the lesson" header
 */
function titleTokens(value) {
  const stop = new Set([
    'and', 'or', 'the', 'a', 'an', 'of', 'to', 'in', 'with', 'for', 'vs',
    'module', 'ap', 'i', 'ii', 'iii',
  ]);
  return new Set(String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !stop.has(token)));
}

function titleLooksCompatible(expected, actual) {
  if (!expected || !actual) return true;
  const expectedTokens = titleTokens(expected);
  const actualTokens = titleTokens(actual);
  if (!expectedTokens.size || !actualTokens.size) return true;
  let overlap = 0;
  expectedTokens.forEach((token) => {
    if (actualTokens.has(token)) overlap += 1;
  });
  return overlap / expectedTokens.size >= 0.3;
}

export default function LessonVideoEmbed({ course, moduleNumber, moduleTitle = '', className = '', showTitle = true }) {
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/lessons-manifest.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((manifest) => {
        if (cancelled) return;
        const list = manifest.by_course?.[course] || [];
        const match = list.find((l) => l.module_number === moduleNumber);
        if (match && !titleLooksCompatible(moduleTitle, match.module_title)) {
          setLesson(null);
          return;
        }
        setLesson(match || null);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [course, moduleNumber, moduleTitle]);

  if (error || !lesson) return null;

  return (
    <section
      className={`giis-lesson-embed ${className}`}
      style={{
        margin: '2rem 0',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#1a1d24',
      }}
    >
      {showTitle && (
        <header
          style={{
            padding: '0.9rem 1.2rem',
            color: '#fff',
            background: '#6B1F2A',
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: '1.05rem' }}>Watch the lesson</strong>
          <span style={{ opacity: 0.8, fontSize: '0.92rem' }}>
            {lesson.course} · Module {lesson.module_number} — {lesson.module_title}
          </span>
          {lesson.duration_seconds && (
            <span style={{ marginLeft: 'auto', opacity: 0.65, fontSize: '0.85rem' }}>
              {Math.round(lesson.duration_seconds / 60)} min
            </span>
          )}
        </header>
      )}
      <div style={{ position: 'relative', paddingTop: '56.25%' /* 16:9 */ }}>
        <iframe
          title={`${lesson.course} Module ${lesson.module_number}`}
          src={`${lesson.embed_url}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      </div>
    </section>
  );
}
