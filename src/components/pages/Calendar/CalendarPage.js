import React from 'react';
import Nav from '../../main/Nav.js';
import { ACADEMIC_YEARS, getCurrentAcademicYear } from '../../../config/schoolCalendar';

const TODAY = new Date().toISOString().slice(0, 10);
const SOON_CUTOFF = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const EVENT_STYLE = {
  term: { bg: '#eef3ff', color: '#1a2d5a', border: '#cbd8f0', weight: 800 },
  exam: { bg: '#fff4e6', color: '#9a4d00', border: '#f1cc95', weight: 850 },
  grades: { bg: '#eef8f0', color: '#1b5e20', border: '#bde2c4', weight: 800 },
  transcript: { bg: '#f4efff', color: '#5b2c6f', border: '#d7c7f0', weight: 800 },
  graduation: { bg: '#fffbf0', color: '#8a6a14', border: '#e8d5a0', weight: 850 },
  recess: { bg: '#f8f9fc', color: '#667085', border: '#d0d7e8', weight: 650 },
};

function fmt(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m-1]} ${d}, ${y}`;
}

function classify(label) {
  const text = String(label || '').toLowerCase();
  if (text.includes('final') || text.includes('exam')) return 'exam';
  if (text.includes('grade')) return 'grades';
  if (text.includes('transcript')) return 'transcript';
  if (text.includes('ceremony') || text.includes('diploma')) return 'graduation';
  return 'term';
}

function DateRow({ label, iso, accent = '#1a2d5a', kind }) {
  if (!iso) return null;
  const past = iso < TODAY;
  const soon = !past && iso <= SOON_CUTOFF;
  const style = EVENT_STYLE[kind || classify(label)] || EVENT_STYLE.term;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: '1px solid #f0f2f5',
      opacity: past ? 0.45 : 1,
      gap: 12,
    }}>
      <span style={{ fontSize: '13.5px', color: past ? '#777' : '#30384a', fontWeight: style.weight }}>{label}</span>
      <span style={{
        fontSize: '13px',
        fontWeight: style.weight,
        color: soon ? '#1b5e20' : past ? '#888' : (style.color || accent),
        background: soon ? '#e8f5e9' : style.bg,
        border: `1px solid ${soon ? '#a5d6a7' : style.border}`,
        padding: '2px 10px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
      }}>
        {fmt(iso)}{soon ? '  — upcoming' : ''}
      </span>
    </div>
  );
}

function TermBlock({ term, accent }) {
  if (!term) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>
        {term.label}
      </div>
      <DateRow label="Term opens" iso={term.starts} accent={accent} />
      <DateRow label="Term closes · finals due" iso={term.ends} accent={accent} />
      <DateRow label="Grades released to portal" iso={term.gradesReleased} accent={accent} kind="grades" />
      <DateRow label="Official transcript issued" iso={term.transcriptIssued} accent={accent} kind="transcript" />
      {(term.keyDates || []).map((k) => (
        <DateRow key={k.date} label={k.label} iso={k.date} accent={accent} />
      ))}
    </div>
  );
}

function YearCard({ year, isCurrent, language }) {
  const isEn = language !== 'zh';
  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${isCurrent ? '#1a2d5a' : '#e4e9f0'}`,
      borderRadius: '14px',
      padding: '24px 28px',
      marginBottom: '20px',
      boxShadow: isCurrent ? '0 4px 20px rgba(26,45,90,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Year header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a2d5a', margin: 0 }}>{year.label}</h2>
          {isCurrent && (
            <span style={{ fontSize: '10px', fontWeight: 700, background: '#1a2d5a', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
              {isEn ? 'CURRENT YEAR' : '当前学年'}
            </span>
          )}
          {year.graduation && (
            <span style={{ fontSize: '10px', fontWeight: 700, background: '#b8962e', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
              {year.graduation.classLabel}
            </span>
          )}
        </div>
        {year.notes && <span style={{ fontSize: '12px', color: '#888', maxWidth: '340px', textAlign: 'right', fontStyle: 'italic' }}>{year.notes}</span>}
      </div>

      {/* Two columns: Fall | Spring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <TermBlock term={year.fall} accent="#1a2d5a" />
          {year.winterRecess && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#f8f9fc', borderRadius: '8px', borderLeft: '3px solid #d0d7e8' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                {isEn ? 'Winter Recess (portal open)' : '寒假（平台开放）'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                <span>{fmt(year.winterRecess.starts)}</span>
                <span>→</span>
                <span>{fmt(year.winterRecess.ends)}</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <TermBlock term={year.spring} accent="#2e7d32" />
          {year.summerRecess && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#f8f9fc', borderRadius: '8px', borderLeft: '3px solid #d0d7e8' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                {isEn ? 'Summer Recess (portal open)' : '暑假（平台开放）'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                <span>{fmt(year.summerRecess.starts)}</span>
                <span>→</span>
                <span>{fmt(year.summerRecess.ends)}</span>
              </div>
            </div>
          )}
          {year.graduation && (
            <div style={{ padding: '12px 14px', background: '#fffbf0', borderRadius: '8px', border: '1.5px solid #e8d5a0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8962e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                {isEn ? 'Graduation' : '毕业典礼'} · {year.graduation.classLabel}
              </div>
              <DateRow label={isEn ? 'Ceremony · diploma valid' : '典礼 · 毕业证书生效'} iso={year.graduation.ceremonyDate} accent="#b8962e" kind="graduation" />
              <DateRow label={isEn ? 'Physical diploma mailed' : '纸质毕业证书邮寄'} iso={year.graduation.physicalMailed} accent="#b8962e" kind="graduation" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage({ language }) {
  const isEn = language !== 'zh';
  const currentYear = getCurrentAcademicYear();

  return (
    <>
      <Nav language={language} />
      <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingBottom: '80px' }}>
        {/* Hero */}
        <div style={{ background: '#1a2d5a', color: '#fff', padding: '48px 5% 40px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#a8bcd8', margin: '0 0 8px' }}>
              {isEn ? 'Genesis of Ideas International School' : '创想国际学校'}
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>
              {isEn ? 'Academic Calendar' : '学术日历'}
            </h1>
            <p style={{ fontSize: '14px', color: '#c8d8ea', margin: 0, maxWidth: '560px', lineHeight: 1.7 }}>
              {isEn
                ? 'GIIS is a fully online, asynchronous school — the learning portal is open 24/7, year-round. The calendar below defines term dates, grade release windows, and official transcript issuance dates.'
                : '创想国际学校为全线上异步制学校，学习平台全年 24/7 开放。以下日历定义了学期日期、成绩公布及官方成绩单发放时间。'}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ border: 'none', borderRadius: 8, background: '#d5a836', color: '#1a2d5a', padding: '10px 16px', fontSize: 13, fontWeight: 850, cursor: 'pointer' }}
              >
                {isEn ? 'Print / Save PDF' : '打印 / 存成 PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Note banner */}
        <div style={{ background: '#fff8e1', borderBottom: '1px solid #ffe082', padding: '10px 5%' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', fontSize: '12.5px', color: '#6d4c00' }}>
            {isEn
              ? '⚡ "Recess" periods are administrative pauses only — no new exams are scheduled, but students may continue coursework and it counts toward the next term.'
              : '⚡「假期」仅为行政暂停，不安排新的考试，但学生可继续学习，成绩将计入下一学期。'}
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 5% 0' }}>
          {[...ACADEMIC_YEARS].reverse().map((year) => (
            <YearCard
              key={year.label}
              year={year}
              isCurrent={year.label === currentYear.label}
              language={language}
            />
          ))}
        </div>
      </div>
    </>
  );
}
