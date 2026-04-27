import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import ImgSlider from './Homepage/ImgSlider.js';
import Slogan from './Homepage/Slogan';
import Introduction from './Homepage/Introduction';
import FacultyGraduates from './Homepage/FacultyGraduates.js';
import ContactForm from './Homepage/ContactForm';
import SuccessStories from './Homepage/SuccessStories';

const PATHWAY_HIGHLIGHTS = [
  { emoji: '💻', en: 'CS & Engineering',      zh: '计算机科学',        color: '#1565C0', to: '/pathways/cs' },
  { emoji: '⚙️', en: 'Engineering Science',   zh: '工程科学',          color: '#B71C1C', to: '/pathways/engineering' },
  { emoji: '📐', en: 'Math & Data Science',   zh: '数学与数据科学',    color: '#4527A0', to: '/pathways/math' },
  { emoji: '📊', en: 'Business & Marketing',  zh: '商业与市场营销',    color: '#C84B0A', to: '/pathways/business' },
  { emoji: '📈', en: 'Economics & Finance',   zh: '经济与金融',        color: '#1B6B3A', to: '/pathways/economics' },
  { emoji: '🧠', en: 'Psychology',            zh: '心理学',            color: '#5b2c6f', to: '/pathways/psychology' },
  { emoji: '📡', en: 'Communications',        zh: '传播与媒体',        color: '#E65100', to: '/pathways/communications' },
  { emoji: '🎨', en: 'Arts & Design',         zh: '艺术与设计',        color: '#6A1B9A', to: '/pathways/arts' },
];

function HomepagePathways({ language }) {
  const isEn = language !== 'zh';
  return (
    <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '72px 0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
        <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {isEn ? 'Designed for Your Goals' : '为你的目标而设计'}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, lineHeight: 1.05, margin: 0 }}>
              {isEn ? '8 Academic Pathways' : '8 条学习路径'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', margin: '10px 0 0', maxWidth: '520px', lineHeight: 1.6 }}>
              {isEn
                ? 'Each pathway is a 4-year elective sequence built around a specific US college major. Full syllabus, curated resources, and quizzes for every course.'
                : '每条路径都是围绕特定美国大学申请专业方向设计的四年选修课程序列，每门课程均含完整大纲、精选资源与互动测验。'}
            </p>
          </div>
          <Link to="/pathways" style={{
            flexShrink: 0, padding: '12px 24px', borderRadius: '8px',
            background: 'rgba(213,168,54,1)', color: '#1a1a2e',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {isEn ? 'Explore All Pathways →' : '查看全部路径 →'}
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {PATHWAY_HIGHLIGHTS.map((p) => (
            <Link key={p.to} to={p.to} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '16px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${p.color}40`,
                borderTop: `3px solid ${p.color}`,
                transition: 'background 0.2s, transform 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${p.color}18`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>{p.emoji}</div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                  {isEn ? p.en : p.zh}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageMain({ language, toggleLanguage }) {
  const isEn = language === 'en';
  return (
    <>
      <Helmet>
        <title>{isEn ? 'Home' : '首页'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Genesis of Ideas International School — US-accredited online high school with 8 academic pathways for Chinese students targeting top US universities.'
            : '艾迪尔国际学校（Genesis of Ideas International School）— 美国认证在线高中，提供8条学习路径，专为目标申请美国顶尖大学的中国学生设计。'}
        />
      </Helmet>

      <div className="row">
        <Nav language={language} toggleLanguage={toggleLanguage} />
      </div>

      {/* Hero slider */}
      <div id="homepage">
        <ImgSlider />
      </div>

      {/* CTA strip */}
      <Slogan language={language} />

      {/* Why GIIS — 4 pillar cards */}
      <div id="about" style={{ background: '#f4f6fb' }}>
        <Introduction language={language} />
      </div>

      {/* 8 Pathways showcase */}
      <HomepagePathways language={language} />

      {/* Student success stories */}
      <SuccessStories language={language} />

      {/* Where our students go */}
      <div id="faculty">
        <FacultyGraduates language={language} />
      </div>

      {/* Contact/inquiry form */}
      <div id="contact">
        <ContactForm language={language} />
      </div>
    </>
  );
}

export default HomepageMain;
