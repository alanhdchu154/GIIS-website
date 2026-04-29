import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getAdminSession, getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import logoUrl from '../../../img/logo_nobg.png';

const API = getApiBase();

function loadHtml2Pdf() {
  if (typeof window !== 'undefined' && window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-html2pdf]');
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', () => reject(new Error('html2pdf load failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = `${process.env.PUBLIC_URL}/html2pdf.bundle.min.js`;
    s.async = true;
    s.dataset.html2pdf = '1';
    s.onload = resolve;
    s.onerror = () => reject(new Error('html2pdf load failed'));
    document.body.appendChild(s);
  });
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDiplomaDate(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  return `${ordinal(d.getDate())} day of ${d.toLocaleDateString('en-US', { month: 'long' })}, A.D. ${d.getFullYear()}`;
}

// SVG decorative border tile pattern
function BorderPattern() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <pattern id="guilloche" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="none" />
          <path d="M0 10 Q5 0 10 10 Q15 20 20 10" fill="none" stroke="#b8962e" strokeWidth="0.6" opacity="0.7" />
          <path d="M0 10 Q5 20 10 10 Q15 0 20 10" fill="none" stroke="#1a2d5a" strokeWidth="0.4" opacity="0.5" />
        </pattern>
        <pattern id="cornerFill" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="none" />
          <circle cx="4" cy="4" r="1" fill="#b8962e" opacity="0.4" />
        </pattern>
      </defs>
    </svg>
  );
}

// Premium school seal — centered, large
function SchoolSeal({ size = 180 }) {
  const r = size / 2;
  const textR = r - 12;
  const text = 'GENESIS OF IDEAS INTERNATIONAL SCHOOL';
  const innerR = r - 22;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', filter: 'drop-shadow(0 2px 6px rgba(184,150,46,0.35))' }}>
      <defs>
        <path id="sealArc" d={`M ${r},${r} m -${textR},0 a ${textR},${textR} 0 1,1 ${textR * 2},0 a ${textR},${textR} 0 1,1 -${textR * 2},0`} />
        <radialGradient id="sealGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="100%" stopColor="#f5ead0" />
        </radialGradient>
      </defs>

      {/* Outer rings */}
      <circle cx={r} cy={r} r={r - 1} fill="url(#sealGrad)" stroke="#b8962e" strokeWidth="2.5" />
      <circle cx={r} cy={r} r={r - 6} fill="none" stroke="#b8962e" strokeWidth="0.6" strokeDasharray="3 2" />
      <circle cx={r} cy={r} r={r - 12} fill="none" stroke="#1a2d5a" strokeWidth="0.8" />

      {/* School name arc */}
      <text fontSize="7.2" fill="#1a2d5a" fontFamily="'Cinzel', serif" letterSpacing="1.5">
        <textPath href="#sealArc" startOffset="2%">{text}</textPath>
      </text>

      {/* Inner circle background */}
      <circle cx={r} cy={r} r={innerR} fill="#1a2d5a" opacity="0.04" />

      {/* Logo image (transparent bg) */}
      <image href={logoUrl} x={r - 34} y={r - 32} width="68" height="54"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'none' }}
      />

      {/* EST. label */}
      <text x={r} y={r + 44} textAnchor="middle" fontSize="7.5" fill="#b8962e"
        fontFamily="'Cinzel', serif" letterSpacing="2" fontWeight="600">
        EST. 2022
      </text>

      {/* Gold stars around bottom */}
      {[-2, -1, 0, 1, 2].map((i) => {
        const a = (90 + i * 22) * (Math.PI / 180);
        const sr = r - 7;
        return (
          <text key={i} x={r + sr * Math.cos(a)} y={r + sr * Math.sin(a) + 2.5}
            textAnchor="middle" fontSize="5" fill="#b8962e" opacity="0.85">★</text>
        );
      })}
    </svg>
  );
}

// Ornate corner SVG
function CornerOrnament({ flip = false, style = {} }) {
  const transform = flip ? 'scale(-1,-1)' : '';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block', ...style }}>
      <g transform={transform} transformOrigin="40 40">
        <path d="M2 2 L2 35 Q2 45 12 45" fill="none" stroke="#b8962e" strokeWidth="1.5" />
        <path d="M2 2 L35 2 Q45 2 45 12" fill="none" stroke="#b8962e" strokeWidth="1.5" />
        <path d="M5 5 L5 32 Q5 42 15 42" fill="none" stroke="#b8962e" strokeWidth="0.6" opacity="0.6" />
        <path d="M5 5 L32 5 Q42 5 42 15" fill="none" stroke="#b8962e" strokeWidth="0.6" opacity="0.6" />
        <circle cx="8" cy="8" r="3" fill="#b8962e" opacity="0.8" />
        <circle cx="8" cy="8" r="1.5" fill="#1a2d5a" />
        <path d="M15 8 Q20 3 25 8 Q30 13 35 8" fill="none" stroke="#b8962e" strokeWidth="0.8" opacity="0.7" />
        <path d="M8 15 Q3 20 8 25 Q13 30 8 35" fill="none" stroke="#b8962e" strokeWidth="0.8" opacity="0.7" />
      </g>
    </svg>
  );
}

function DiplomaDocument({ student, eligibleDate }) {
  const graduationDate = student.graduationDate;
  const diplomaDate = formatDiplomaDate(graduationDate);
  const classYear = graduationDate ? new Date(graduationDate + 'T00:00:00').getFullYear() : new Date().getFullYear();

  return (
    <div style={{
      width: '11in',
      height: '8.5in',
      background: '#faf6ed',
      position: 'relative',
      boxSizing: 'border-box',
      fontFamily: "'EB Garamond', Georgia, serif",
      overflow: 'hidden',
    }}>
      <BorderPattern />

      {/* Deep navy outer frame */}
      <div style={{ position: 'absolute', inset: 0, border: '18px solid #1a2d5a', pointerEvents: 'none', zIndex: 2 }} />

      {/* Gold accent stripe inside navy */}
      <div style={{ position: 'absolute', inset: '18px', border: '4px solid #b8962e', pointerEvents: 'none', zIndex: 2 }} />

      {/* Thin inner gold line */}
      <div style={{ position: 'absolute', inset: '26px', border: '1px solid #b8962e', pointerEvents: 'none', zIndex: 2 }} />

      {/* Guilloche pattern band along inner border */}
      <div style={{
        position: 'absolute', inset: '28px',
        border: '14px solid transparent',
        borderImage: 'none',
        background: 'linear-gradient(#faf6ed,#faf6ed) padding-box, repeating-linear-gradient(90deg,#b8962e 0px,#b8962e 3px,transparent 3px,transparent 10px) border-box',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Corner ornaments — inside the frame */}
      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 3 }}>
        <CornerOrnament />
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 3, transform: 'scaleX(-1)' }}>
        <CornerOrnament />
      </div>
      <div style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 3, transform: 'scaleY(-1)' }}>
        <CornerOrnament />
      </div>
      <div style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 3, transform: 'scale(-1,-1)' }}>
        <CornerOrnament />
      </div>

      {/* ── Content area ── */}
      <div style={{
        position: 'absolute',
        top: '52px', bottom: '52px', left: '52px', right: '52px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 5,
        paddingTop: '12px',
        paddingBottom: '10px',
      }}>

        {/* Top: school name header */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{
            fontSize: '11px', fontFamily: "'Cinzel Decorative', 'Cinzel', serif", color: '#b8962e',
            letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '2px',
          }}>
            Genesis of Ideas
          </div>
          <div style={{
            fontSize: '18px', fontFamily: "'Cinzel Decorative', 'Cinzel', serif", color: '#1a2d5a',
            letterSpacing: '5px', textTransform: 'uppercase', fontWeight: 700,
            lineHeight: 1.2,
          }}>
            International School
          </div>
          {/* Decorative rule under school name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', justifyContent: 'center' }}>
            <div style={{ width: '1.2in', height: '1px', background: '#b8962e', opacity: 0.6 }} />
            <span style={{ color: '#b8962e', fontSize: '12px', lineHeight: 1 }}>❧</span>
            <span style={{ color: '#1a2d5a', fontSize: '10px', lineHeight: 1 }}>✦</span>
            <span style={{ color: '#b8962e', fontSize: '12px', lineHeight: 1, transform: 'scaleX(-1)', display: 'inline-block' }}>❧</span>
            <div style={{ width: '1.2in', height: '1px', background: '#b8962e', opacity: 0.6 }} />
          </div>
        </div>

        {/* Middle row: seal | center text | info */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', flex: 1, marginTop: '6px', marginBottom: '6px' }}>

          {/* Seal */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '2in', flexShrink: 0 }}>
            <SchoolSeal size={160} />
            <div style={{ fontSize: '8px', fontFamily: "'Cinzel Decorative', 'Cinzel', serif", color: '#b8962e', letterSpacing: '2px', marginTop: '6px', textTransform: 'uppercase' }}>
              Class of {classYear}
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{
            width: '2px',
            background: 'linear-gradient(to bottom, transparent, #b8962e 15%, #b8962e 85%, transparent)',
            alignSelf: 'stretch', margin: '0 0.28in', flexShrink: 0,
          }} />

          {/* Center diploma text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

            {/* "Be it known" */}
            <p style={{
              fontSize: '12px', color: '#5a3e2b', fontStyle: 'italic',
              margin: '0 0 4px', letterSpacing: '0.5px', lineHeight: 1.4,
              fontFamily: "'Cormorant Garamond', 'Garamond', serif",
            }}>
              Be it known to all persons by these presents that
            </p>

            {/* Student name — the centerpiece */}
            <div style={{
              fontSize: '52px',
              fontFamily: "'Great Vibes', 'Pinyon Script', cursive",
              color: '#1a2d5a',
              lineHeight: 1.05,
              margin: '0px 0 2px',
              letterSpacing: '2px',
              textShadow: '0 1px 2px rgba(184,150,46,0.25)',
            }}>
              {student.name}
            </div>

            {/* Decorative underline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', width: '90%', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to right, transparent, #1a2d5a)' }} />
              <span style={{ color: '#b8962e', fontSize: '14px' }}>✦</span>
              <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to left, transparent, #1a2d5a)' }} />
            </div>

            <p style={{ fontSize: '12.5px', color: '#4a3728', lineHeight: 1.8, margin: '0 0 8px', maxWidth: '4.8in', fontFamily: "'Cormorant Garamond', 'Garamond', serif" }}>
              having fulfilled with distinction all requirements<br />
              prescribed for graduation from this institution, is hereby<br />
              awarded this
            </p>

            {/* Diploma title */}
            <div style={{ margin: '0 0 8px' }}>
              <div style={{
                fontSize: '26px', fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                color: '#1a2d5a', letterSpacing: '4px', fontWeight: 700,
                textTransform: 'uppercase',
                textShadow: '0 1px 0 rgba(184,150,46,0.3)',
              }}>
                High School Diploma
              </div>
              {/* Under the title — small gold rule */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', justifyContent: 'center' }}>
                <div style={{ width: '0.6in', height: '1px', background: '#b8962e', opacity: 0.7 }} />
                <span style={{ color: '#b8962e', fontSize: '8px' }}>★</span>
                <span style={{ color: '#1a2d5a', fontSize: '8px' }}>★</span>
                <span style={{ color: '#b8962e', fontSize: '8px' }}>★</span>
                <div style={{ width: '0.6in', height: '1px', background: '#b8962e', opacity: 0.7 }} />
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#5a3e2b', fontStyle: 'italic', margin: '0', lineHeight: 1.7, fontFamily: "'Cormorant Garamond', 'Garamond', serif" }}>
              In witness whereof we have caused the seal of this institution to be<br />
              affixed and our signatures subscribed on this {diplomaDate}.
            </p>
          </div>

          {/* Right vertical divider */}
          <div style={{
            width: '2px',
            background: 'linear-gradient(to bottom, transparent, #b8962e 15%, #b8962e 85%, transparent)',
            alignSelf: 'stretch', margin: '0 0.28in', flexShrink: 0,
          }} />

          {/* Right column: vertical accents */}
          <div style={{ width: '1.2in', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '1px', height: '0.4in', background: 'linear-gradient(to bottom, transparent, #b8962e)' }} />
            <span style={{ color: '#b8962e', fontSize: '22px' }}>☙</span>
            <span style={{ color: '#1a2d5a', fontSize: '10px', fontFamily: "'Cinzel Decorative', 'Cinzel', serif", letterSpacing: '1.5px', textAlign: 'center', lineHeight: 1.5 }}>
              WITH<br />HONORS
            </span>
            <span style={{ color: '#b8962e', fontSize: '22px', transform: 'scaleY(-1)', display: 'inline-block' }}>☙</span>
            <div style={{ width: '1px', height: '0.4in', background: 'linear-gradient(to top, transparent, #b8962e)' }} />
          </div>
        </div>

        {/* Bottom: signature lines */}
        <div style={{ width: '100%' }}>
          {/* Top rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #b8962e 30%, #b8962e 70%, transparent)' }} />
          </div>

          <div style={{ display: 'flex', gap: '0', justifyContent: 'center', width: '100%' }}>
            {/* Sig 1: President */}
            <div style={{ textAlign: 'center', flex: 1, maxWidth: '2.2in', padding: '0 16px' }}>
              <div style={{ borderBottom: '1.5px solid #1a2d5a', height: '28px', marginBottom: '4px', position: 'relative' }}>
                {/* Signature flourish */}
                <svg viewBox="0 0 150 28" width="100%" height="28" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                  <path d="M10 22 Q30 8 50 18 Q70 28 90 14 Q110 2 140 20" fill="none" stroke="#1a2d5a" strokeWidth="1.2" opacity="0.35" />
                </svg>
              </div>
              <div style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond', serif", color: '#1a2d5a', fontWeight: 600, fontStyle: 'italic' }}>Shiyu Zhang, Ph.D.</div>
              <div style={{ fontSize: '8px', color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px', fontFamily: "'Cinzel', serif" }}>President & Principal</div>
            </div>

            {/* Center seal stamp placeholder */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', paddingBottom: '2px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                border: '2px solid #b8962e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(184,150,46,0.06)',
              }}>
                <span style={{ fontSize: '9px', fontFamily: "'Cinzel', serif", color: '#b8962e', letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.3 }}>SEAL</span>
              </div>
            </div>

            {/* Sig 2: Graduate */}
            <div style={{ textAlign: 'center', flex: 1, maxWidth: '2.2in', padding: '0 16px' }}>
              <div style={{ borderBottom: '1.5px solid #1a2d5a', height: '28px', marginBottom: '4px', position: 'relative' }}>
                <svg viewBox="0 0 150 28" width="100%" height="28" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                  <path d="M10 24 Q40 6 60 20 Q80 34 110 16 Q125 8 140 22" fill="none" stroke="#1a2d5a" strokeWidth="1.2" opacity="0.35" />
                </svg>
              </div>
              <div style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond', serif", color: '#1a2d5a', fontWeight: 600, fontStyle: 'italic' }}>{student.name}</div>
              <div style={{ fontSize: '8px', color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px', fontFamily: "'Cinzel', serif" }}>Graduate</div>
            </div>
          </div>

          {/* Eligible date footnote */}
          {eligibleDate && (
            <p style={{ fontSize: '8px', color: '#b8962e', marginTop: '8px', letterSpacing: '1.2px', textAlign: 'center', opacity: 0.8 }}>
              DIPLOMA ELIGIBLE AS OF {eligibleDate.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiplomaPage({ language }) {
  const { studentId } = useParams();
  const studentSession = getStudentSession();
  const isAdmin = !!getAdminSession();
  const ref = useRef(null);

  const [student, setStudent] = useState(null);
  const [eligibleDate, setEligibleDate] = useState(null);
  const [error, setError] = useState('');
  const [authFailed, setAuthFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const id = studentId || studentSession?.student?.id;
    if (!id) { setAuthFailed(true); return; }

    fetch(`${API}/api/students/${id}`, { credentials: 'include' })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { setAuthFailed(true); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.student) setStudent(d.student);
        else setError('Student not found');
      })
      .catch(() => setError('Failed to load student data'));

    fetch(`${API}/api/enrollments`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((enrollments) => {
        if (!Array.isArray(enrollments)) return;
        const dates = enrollments
          .filter((e) => e.creditEarned && e.creditEarnedAt)
          .map((e) => new Date(e.creditEarnedAt));
        if (dates.length > 0) {
          const latest = new Date(Math.max(...dates));
          setEligibleDate(latest.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (authFailed) return <Navigate to="/login" replace />;

  async function handleDownload() {
    if (!ref.current) return;
    setDownloading(true);
    try {
      await loadHtml2Pdf();
      const filename = `${(student?.name || 'Diploma').replace(/[\\/:*?"<>|]/g, '-')}_Diploma.pdf`;
      await window.html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
        })
        .from(ref.current)
        .save();
    } catch (e) {
      alert('PDF generation failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Great+Vibes&family=Pinyon+Script&display=swap" rel="stylesheet" />
        <title>Diploma — {student?.name || '…'} | GIIS</title>
      </Helmet>

      {/* Toolbar */}
      <div style={{
        background: '#1a2d5a', color: '#fff', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Inter, sans-serif', gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isAdmin && studentId && (
            <Link to={`/admin/transcript/${studentId}`} style={{ color: '#aab8d4', fontSize: '13px', textDecoration: 'none' }}>
              ← Back
            </Link>
          )}
          {!isAdmin && (
            <Link to="/learn" style={{ color: '#aab8d4', fontSize: '13px', textDecoration: 'none' }}>
              ← Dashboard
            </Link>
          )}
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {student ? `Diploma — ${student.name}` : 'Loading…'}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || !student}
          style={{
            background: '#b8962e', color: '#fff', border: 'none', borderRadius: '6px',
            padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            opacity: downloading || !student ? 0.7 : 1,
          }}
        >
          {downloading ? 'Generating PDF…' : '⬇ Download PDF'}
        </button>
      </div>

      {/* Preview area */}
      <div style={{ background: '#2a2a2a', minHeight: '100vh', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {error ? (
          <p style={{ color: '#ef9a9a', fontFamily: 'Inter, sans-serif', marginTop: '40px' }}>{error}</p>
        ) : !student ? (
          <p style={{ color: '#888', fontFamily: 'Inter, sans-serif', marginTop: '40px' }}>Loading…</p>
        ) : (
          <div ref={ref} style={{ boxShadow: '0 12px 60px rgba(0,0,0,0.55)', transformOrigin: 'top center' }}>
            <DiplomaDocument student={student} eligibleDate={eligibleDate} />
          </div>
        )}
      </div>
    </>
  );
}
