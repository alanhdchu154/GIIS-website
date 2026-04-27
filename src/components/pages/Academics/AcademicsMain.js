import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import img from '../../../img/Homepage/homepage8.png';
import AcademicsIntroduction from './Academics/Academicsintroduction.js';
import AcademicsIntroduction2 from './Academics/Academicsintroduction2.js';
import CourseCatalog from './Academics/CourseCatalog.js';

const PATHWAYS = [
  { title: 'CS & Engineering',      titleZh: '计算机科学',       color: '#1565C0', emoji: '💻', to: '/pathways/cs',             ap: 1 },
  { title: 'Engineering Science',   titleZh: '工程科学',         color: '#B71C1C', emoji: '⚙️', to: '/pathways/engineering',    ap: 1 },
  { title: 'Math & Data Science',   titleZh: '数学与数据科学',   color: '#4527A0', emoji: '📐', to: '/pathways/math',           ap: 2 },
  { title: 'Business & Marketing',  titleZh: '商业与市场营销',   color: '#C84B0A', emoji: '📊', to: '/pathways/business',       ap: 1 },
  { title: 'Economics & Finance',   titleZh: '经济与金融',       color: '#1B6B3A', emoji: '📈', to: '/pathways/economics',     ap: 2 },
  { title: 'Psychology',            titleZh: '心理学',           color: '#5b2c6f', emoji: '🧠', to: '/pathways/psychology',    ap: 1 },
  { title: 'Communications',        titleZh: '传播与媒体',       color: '#E65100', emoji: '📡', to: '/pathways/communications', ap: 1 },
  { title: 'Arts & Design',         titleZh: '艺术与设计',       color: '#6A1B9A', emoji: '🎨', to: '/pathways/arts',           ap: 1 },
];

function AcademicsMain({ language }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Academics' : '学术'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Academic programs and course catalog at Genesis of Ideas International School — 8 pathways, Florida-accredited diploma.'
            : '艾迪尔国际学校学术课程与路径介绍，提供8条学习路径与Florida注册私立学校文凭。'}
        />
      </Helmet>

      <div className="row">
        <Nav language={language} />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img src={img} alt="Academics" style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.72) 100%)',
          padding: '80px 10% 48px',
        }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', margin: '0 0 8px', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
            {isEn ? 'Genesis of Ideas International School' : '艾迪尔国际学校'}
          </p>
          <h1 style={{ color: '#fff', fontSize: '54px', fontWeight: 800, margin: '0 0 12px', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
            {isEn ? 'ACADEMICS' : '学术课程'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '17px', margin: 0, maxWidth: '520px', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
            {isEn
              ? 'US-accredited diploma program with 8 academic pathways designed for Chinese students targeting top US universities.'
              : '专为中国学生设计的美国认证高中课程，提供8条针对美国顶尖大学申请的学习路径。'}
          </p>
        </div>
      </div>

      {/* ── What Makes GIIS Different ─────────────────────────────────── */}
      <div className="card mt-0" id="introduction2" style={{
        position: 'relative', zIndex: 10,
        backgroundColor: 'rgba(43, 61, 109, 1)',
        borderBottom: '20px solid rgba(213, 168, 54, 1)',
      }}>
        <div className="container">
          <div className="card-body">
            <AcademicsIntroduction language={language} />
          </div>
        </div>
      </div>

      {/* ── Our Programs + AP Courses ─────────────────────────────────── */}
      <div className="mt-0" id="programs">
        <AcademicsIntroduction2 language={language} />
      </div>

      {/* ── 10 Pathway Showcase ──────────────────────────────────────── */}
      <div style={{ background: '#f4f6fb', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Elective Concentration Tracks' : '选修方向'}
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
            <div>
              <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, margin: '0 0 6px', color: '#1a1a2e' }}>
                {isEn ? 'CHOOSE YOUR' : '选择你的'}
              </h2>
              <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, margin: '0 0 12px', color: '#2b3d6d' }}>
                {isEn ? 'PATHWAY' : '学习路径'}
              </h2>
              <p style={{ fontSize: '16px', color: '#555', maxWidth: '560px', lineHeight: 1.7, margin: 0 }}>
                {isEn
                  ? '8 four-year elective sequences built around the top US university majors for Chinese international students. Each course has a full syllabus, resources, and quizzes.'
                  : '8 条围绕中国留学生最热门美国大学专业方向设计的四年选修课程序列，每门课程含大纲、资源与测验。'}
              </p>
            </div>
            <Link to="/pathways" style={{
              flexShrink: 0, padding: '12px 24px', borderRadius: '8px',
              background: '#2b3d6d', color: '#fff',
              fontWeight: 700, fontSize: '14px', textDecoration: 'none',
              transition: 'background 0.15s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
              onMouseLeave={e => e.currentTarget.style.background = '#2b3d6d'}
            >
              {isEn ? 'Compare all 8 →' : '查看全部8条 →'}
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {PATHWAYS.map((p) => (
              <Link key={p.to} to={p.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '18px 14px',
                  borderRadius: '10px',
                  background: '#fff',
                  border: `1px solid ${p.color}20`,
                  borderTop: `4px solid ${p.color}`,
                  transition: 'box-shadow 0.2s, transform 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${p.color}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{p.emoji}</div>
                  <p style={{ margin: '0 0 6px', fontSize: '12.5px', fontWeight: 700, color: p.color, lineHeight: 1.3 }}>
                    {isEn ? p.title : p.titleZh}
                  </p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#999', fontWeight: 500 }}>
                    {p.ap} {isEn ? `AP Course${p.ap > 1 ? 's' : ''}` : `门 AP`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course Catalog ────────────────────────────────────────────── */}
      <div className="mt-0" id="course-catalog" style={{ backgroundColor: '#fff' }}>
        <CourseCatalog language={language} />
      </div>
    </>
  );
}

export default AcademicsMain;
