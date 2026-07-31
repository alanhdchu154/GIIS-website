import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { AdminHeader, AdminPage } from './AdminChrome';
import { ACADEMIC_YEARS, getCurrentAcademicYear } from '../../../config/schoolCalendar';

const TODAY = new Date().toISOString().slice(0, 10);

function fmt(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m-1]} ${d}, ${y}`;
}

function isPast(iso) { return iso && iso < TODAY; }
function isSoon(iso) { return iso && iso >= TODAY && iso <= new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10); }

function DateRow({ label, iso, accent }) {
  const past = isPast(iso);
  const soon = isSoon(iso);
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 0', borderBottom: '1px solid #f0f0f0',
      opacity: past ? 0.5 : 1,
    }}>
      <span style={{ fontSize: '13px', color: '#444' }}>{label}</span>
      <span style={{
        fontSize: '13px', fontWeight: soon ? 700 : 500,
        color: soon ? '#1b5e20' : past ? '#999' : accent || '#1a2d5a',
        background: soon ? '#e8f5e9' : 'transparent',
        padding: soon ? '1px 8px' : '0',
        borderRadius: '12px',
      }}>
        {fmt(iso)}{soon ? ' ← upcoming' : ''}
      </span>
    </div>
  );
}

function TermCard({ term, accent = '#1a2d5a' }) {
  if (!term) return null;
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
        {term.label}
      </div>
      <DateRow label="Starts" iso={term.starts} accent={accent} />
      <DateRow label="Ends / Final exams due" iso={term.ends} accent={accent} />
      <DateRow label="Grades released" iso={term.gradesReleased} accent={accent} />
      <DateRow label="Transcript issued" iso={term.transcriptIssued} accent={accent} />
      {(term.keyDates || []).map((k) => (
        <DateRow key={k.date} label={k.label} iso={k.date} accent={accent} />
      ))}
    </div>
  );
}

function YearCard({ year, isCurrent, T }) {
  const card = (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${isCurrent ? '#1a2d5a' : '#e0e6f0'}`,
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '16px',
      boxShadow: isCurrent ? '0 2px 12px rgba(26,45,90,0.10)' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a2d5a', margin: 0 }}>
          {year.label}
          {isCurrent && (
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#1a2d5a', color: '#fff', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px', verticalAlign: 'middle' }}>
              {T('CURRENT', 'CURRENT')}
            </span>
          )}
        </h2>
        {year.notes && <span style={{ fontSize: '11px', color: '#888', maxWidth: '280px', textAlign: 'right' }}>{year.notes}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <TermCard term={year.fall} accent="#1a2d5a" />
        <div>
          {year.winterRecess && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Winter Recess (admin pause)</div>
              <DateRow label="Start" iso={year.winterRecess.starts} accent="#888" />
              <DateRow label="End" iso={year.winterRecess.ends} accent="#888" />
            </div>
          )}
          <TermCard term={year.spring} accent="#2e7d32" />
          {year.summerRecess && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Summer Recess (admin pause)</div>
              <DateRow label="Start" iso={year.summerRecess.starts} accent="#888" />
              <DateRow label="End" iso={year.summerRecess.ends} accent="#888" />
            </div>
          )}
          {year.graduation && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b8962e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Graduation — {year.graduation.classLabel}
              </div>
              <DateRow label="Ceremony / Diploma valid" iso={year.graduation.ceremonyDate} accent="#b8962e" />
              <DateRow label="Physical diploma mailed" iso={year.graduation.physicalMailed} accent="#b8962e" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
  if (isCurrent) return card;
  return (
    <details style={{ marginBottom: 12 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#1a2d5a', padding: '10px 4px' }}>
        {year.label}
      </summary>
      {card}
    </details>
  );
}

export default function AdminCalendarPage({ language = 'en', toggleLanguage }) {
  const isEn = language === 'en';
  const T = (en, zh) => (isEn ? en : zh);
  const session = getAdminSession();
  if (!session) return <Navigate to="/admin/login" replace />;

  const currentYear = getCurrentAcademicYear();
  const orderedYears = [...ACADEMIC_YEARS].sort((a, b) => {
    if (a.label === currentYear.label) return -1;
    if (b.label === currentYear.label) return 1;
    return String(b.label).localeCompare(String(a.label));
  });

  return (
    <AdminPage>
      <div style={{ maxWidth: '1000px' }}>
        <AdminHeader
          language={language}
          toggleLanguage={toggleLanguage}
          title={T('Academic Calendar', '校历')}
          subtitle={T('Current academic year first; older and future calendars stay collapsed until needed.', '当前学年置顶，其他年份预设收合。')}
        />
        <div style={{ background: '#e8edf7', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px', fontSize: '12px', color: '#444', lineHeight: 1.6 }}>
          <strong>{T('Online async school', '线上非同步学校')}</strong> — {T('Portal is open 24/7. "Recess" periods are admin-only pauses (no new exams scheduled). Grades released = visible to students and parents in the portal.', 'Portal 24/7 开放。「Recess」是 admin-only pause（不排新考试）。Grades released 代表学生与家长 portal 可见。')}
        </div>

        {orderedYears.map((year) => (
          <YearCard key={year.label} year={year} isCurrent={year.label === currentYear.label} T={T} />
        ))}
      </div>
    </AdminPage>
  );
}
