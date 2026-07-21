import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import img from '../../../img/Hero/module-screen.jpg';
import AcademicsIntroduction from './Academics/Academicsintroduction.js';
import AcademicsIntroduction2 from './Academics/Academicsintroduction2.js';
import CourseCatalog from './Academics/CourseCatalog.js';

const PATHWAYS = [
  { title: 'CS & Engineering',      titleZh: '计算机科学',       color: '#1565C0', emoji: '💻', to: '/pathways/cs',             focus: 'Portfolio + coding labs', focusZh: '作品集 + 编程实验' },
  { title: 'Engineering Science',   titleZh: '工程科学',         color: '#B71C1C', emoji: '⚙️', to: '/pathways/engineering',    focus: 'Applied science sequence', focusZh: '应用科学序列' },
  { title: 'Math & Data Science',   titleZh: '数学与数据科学',   color: '#4527A0', emoji: '📐', to: '/pathways/math',           focus: 'Calculus + statistics', focusZh: '微积分 + 统计' },
  { title: 'Business & Marketing',  titleZh: '商业与市场营销',   color: '#C84B0A', emoji: '📊', to: '/pathways/business',       focus: 'Market research projects', focusZh: '市场研究项目' },
  { title: 'Economics & Finance',   titleZh: '经济与金融',       color: '#1B6B3A', emoji: '📈', to: '/pathways/economics',     focus: 'Economics seminar', focusZh: '经济学研讨课' },
  { title: 'Psychology',            titleZh: '心理学',           color: '#5b2c6f', emoji: '🧠', to: '/pathways/psychology',    focus: 'Research + capstone', focusZh: '研究 + 毕业项目' },
  { title: 'Communications',        titleZh: '传播与媒体',       color: '#E65100', emoji: '📡', to: '/pathways/communications', focus: 'Digital media evidence', focusZh: '数字媒体成果' },
  { title: 'Arts & Design',         titleZh: '艺术与设计',       color: '#6A1B9A', emoji: '🎨', to: '/pathways/arts',           focus: 'Studio portfolio', focusZh: '艺术作品集' },
];

const ADVANCED_COURSES = [
  { code: 'Statistics',              icon: '∑', desc: { en: 'Data analysis, inference, and research literacy', zh: '数据分析、统计推论与研究素养' } },
  { code: 'Biology - Advanced',      icon: '🧬', desc: { en: 'Upper-level life science for science-track students', zh: '面向科学方向学生的高阶生命科学' } },
  { code: 'Psychology Seminar / Capstone', icon: '🧠', desc: { en: 'Research writing and senior psychology evidence', zh: '研究写作与高年级心理学成果' } },
  { code: 'Digital Media & Society', icon: '📡', desc: { en: 'Media literacy, communication, and digital-culture analysis', zh: '媒体素养、传播与数字文化分析' } },
];

function AcademicsMain({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Academics' : '学术'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Academic programs and course catalog at Genesis of Ideas International School — 8 pathways, Florida-registered private school diploma.'
            : '艾迪尔国际学校学术课程与路径介绍，提供8条学习路径与Florida注册私立学校文凭。'}
        />
      </Helmet>

      <div className="row">
        <Nav language={language} toggleLanguage={toggleLanguage} />
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
              ? 'Florida-registered private high school program with 8 academic pathways, transcript-ready coursework, and parent-visible learning evidence.'
              : 'Florida 注册私立高中课程，提供 8 条学习路径、可进入成绩单记录的课程与家长可见的学习证据。'}
          </p>
        </div>
      </div>

      {/* ── What Makes GIIS Different ─────────────────────────────────── */}
      <div id="introduction2" style={{
        backgroundColor: 'rgba(43, 61, 109, 1)',
        borderBottom: '6px solid rgba(213, 168, 54, 1)',
      }}>
        <AcademicsIntroduction language={language} />
      </div>

      {/* ── Our Programs ───────────────────────────────────────────────── */}
      <div className="mt-0" id="programs">
        <AcademicsIntroduction2 language={language} />
      </div>

      {/* ── Pathway Showcase ──────────────────────────────────────────── */}
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
                  ? '8 four-year elective sequences built around serious course planning, visible assignments, curated resources, and assessments families can inspect before enrollment.'
                  : '8 条四年选修课程序列，围绕严肃选课规划、可查看作业、精选资源与入学前即可了解的评估设计。'}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
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
                    {isEn ? p.focus : p.focusZh}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Advanced Coursework ───────────────────────────────────────── */}
      <div style={{ background: '#2b3d6d', padding: '72px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: '#d5a836', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Advanced Coursework Inside Pathways' : '路径内的进阶课程'}
          </p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#fff', lineHeight: 1.04, margin: '0 0 12px' }}>
            {isEn ? 'A pathway is built around evidence, not a course label.' : '学习路径看重成果证据，而不只是课程名称。'}
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.72)', maxWidth: '700px', lineHeight: 1.75, margin: '0 0 34px' }}>
            {isEn
              ? 'Students choose a pathway first, then build transcript-ready coursework, visible assignments, quizzes, and portfolio evidence that families can inspect throughout the year.'
              : '学生先确定学习路径，再通过可进入成绩单的课程、可查看作业、测验与作品集成果，让家长全年都能看见学习进展。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {ADVANCED_COURSES.map((course) => (
              <div key={course.code} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '24px 22px',
                borderTop: '4px solid rgba(213,168,54,1)',
              }}>
                <div style={{ fontSize: '30px', marginBottom: '12px' }}>{course.icon}</div>
                <h4 style={{ fontSize: '17px', fontWeight: 750, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>{course.code}</h4>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                  {course.desc[isEn ? 'en' : 'zh']}
                </p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.48)', margin: '28px 0 0', lineHeight: 1.65 }}>
            {isEn
              ? 'Course placement and transcript wording are reviewed by the school before a student starts the pathway, especially for transfer students or advanced learners.'
              : '课程安排与成绩单用语会在学生开始路径前由学校审核，尤其适用于转学生或进阶学习者。'}
          </p>
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
