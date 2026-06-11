import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import HeroSection from './Homepage/HeroSection';
import Slogan from './Homepage/Slogan';
import Introduction from './Homepage/Introduction';
import IsGiisForYou from './Homepage/IsGiisForYou';
import DemoEmbed from '../../main/DemoEmbed';
import LessonPreview from '../../main/LessonPreview';
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

function ParentDecisionStrip({ language }) {
  const isEn = language !== 'zh';
  const checks = [
    {
      title: isEn ? 'Verify the school' : '先确认学校真实性',
      body: isEn
        ? 'Read the school profile, Florida registration language, graduation framework, and official record policies before you apply.'
        : '申请前先查看学校档案、Florida 注册说明、毕业框架与正式学籍记录政策。',
      to: '/trust-center',
      cta: isEn ? 'Open Trust Center' : '打开信任中心',
    },
    {
      title: isEn ? 'Preview parent visibility' : '预览家长能看到什么',
      body: isEn
        ? 'See how credits, GPA, course progress, and weekly updates help parents know whether learning is actually happening.'
        : '预览家长如何看到学分、GPA、课程进度与每周报告，确认孩子真的有在学。',
      to: '/parent/demo',
      cta: isEn ? 'View parent dashboard' : '查看家长面板',
    },
    {
      title: isEn ? 'Lock the founders rate' : '锁定创校价格',
      body: isEn
        ? 'Plans now start at $49/month, with guided and college-pathway support available after admissions reviews your child’s needs.'
        : '方案从 $49/月起，并可在招生审核后选择顾问指导或升学路径支持。',
      to: '/pricing',
      cta: isEn ? 'Review tuition' : '查看学费',
    },
  ];

  return (
    <section style={{ background: '#fff', borderBottom: '1px solid #e8ecf5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '34px 6% 38px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <p style={{ color: '#b8962e', fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', margin: '0 0 8px' }}>
              {isEn ? 'Before You Pay' : '付款前先验证'}
            </p>
            <h2 style={{ color: '#1a1a2e', fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.15, fontWeight: 800, margin: 0, letterSpacing: 0 }}>
              {isEn ? 'Three things a parent can verify in five minutes.' : '家长五分钟内可以验证三件事。'}
            </h2>
          </div>
          <Link to="/apply" style={{
            padding: '12px 22px',
            borderRadius: 8,
            background: '#2b3d6d',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}>
            {isEn ? 'Apply now →' : '立即申请 →'}
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {checks.map((item, index) => (
            <div key={item.to} style={{
              border: '1px solid #e3e7f0',
              borderRadius: 8,
              padding: '18px 18px 16px',
              background: index === 2 ? '#fbf6e8' : '#f8f9fc',
            }}>
              <p style={{ margin: '0 0 8px', color: '#2b3d6d', fontSize: 13, fontWeight: 800 }}>
                {String(index + 1).padStart(2, '0')} · {item.title}
              </p>
              <p style={{ margin: '0 0 14px', color: '#4f5868', fontSize: 14, lineHeight: 1.6 }}>
                {item.body}
              </p>
              <Link to={item.to} style={{ color: '#1a2d5a', fontSize: 13, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {item.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WeeklyReportPreview({ language }) {
  const isEn = language !== 'zh';
  const metrics = [
    { label: isEn ? 'Credits Earned' : '已获学分', value: '22.0 / 24' },
    { label: 'GPA (UW)', value: '3.85' },
    { label: isEn ? 'Graduation' : '毕业进度', value: '92%' },
    { label: isEn ? 'Completed' : '已完成', value: isEn ? '18 courses' : '18 门课程' },
  ];
  const courses = [
    { name: 'AP Computer Science A', progress: '9 / 14', pct: 64, color: '#1565c0' },
    { name: 'Calculus', progress: '11 / 14', pct: 79, color: '#4527a0' },
    { name: 'AP Microeconomics', progress: '6 / 12', pct: 50, color: '#1b6b3a' },
  ];

  return (
    <section style={{ background: '#f4f6fa', borderBottom: '1px solid #e1e6f0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '58px 6%',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(360px, 1.1fr)',
        gap: 36,
        alignItems: 'center',
      }} className="giis-weekly-preview-grid">
        <div>
          <p style={{ color: '#b8962e', fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Transparency After Enrollment' : '入学后的透明度'}
          </p>
          <h2 style={{ color: '#1a1a2e', fontSize: 'clamp(26px, 3.5vw, 42px)', lineHeight: 1.12, fontWeight: 800, margin: '0 0 14px', letterSpacing: 0 }}>
            {isEn ? 'Parents should not have to guess whether learning is happening.' : '家长不该靠猜，才知道孩子有没有在学。'}
          </h2>
          <p style={{ color: '#4f5868', fontSize: 16, lineHeight: 1.7, margin: '0 0 22px', maxWidth: 500 }}>
            {isEn
              ? 'Every week, parents receive a progress digest showing credits, GPA, graduation progress, active courses, and a direct path back to the parent dashboard.'
              : '每周家长会收到学习进度报告：学分、GPA、毕业进度、进行中课程，以及家长面板入口。'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/parent/demo" style={outlineLink}>
              {isEn ? 'Preview parent dashboard' : '预览家长面板'}
            </Link>
            <Link to="/apply" style={solidLink}>
              {isEn ? 'Apply with confidence →' : '放心申请 →'}
            </Link>
          </div>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #dde4f0',
          borderRadius: 8,
          boxShadow: '0 20px 55px rgba(26,45,90,0.12)',
          overflow: 'hidden',
        }}>
          <div style={{ background: '#1a1a2e', padding: '22px 26px' }}>
            <p style={{ color: '#d5a836', fontSize: 12, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 6px' }}>
              {isEn ? 'Weekly Update' : '每周进度报告'}
            </p>
            <h3 style={{ color: '#fff', fontSize: 22, lineHeight: 1.2, fontWeight: 800, margin: 0, letterSpacing: 0 }}>
              {isEn ? "Yunfan's progress" : '杨芸帆本周进度'}
            </h3>
          </div>

          <div style={{ padding: '24px 26px 26px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 22 }}>
              {metrics.map((metric) => (
                <div key={metric.label} style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 14px', minHeight: 74 }}>
                  <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 5px' }}>
                    {metric.label}
                  </p>
                  <p style={{ color: '#2b3d6d', fontSize: 22, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px' }}>
              {isEn ? 'Active Courses' : '进行中课程'}
            </p>
            <div style={{ display: 'grid', gap: 9, marginBottom: 20 }}>
              {courses.map((course) => (
                <div key={course.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 5px', color: '#1a1a2e', fontSize: 14, fontWeight: 800 }}>{course.name}</p>
                    <div style={{ height: 6, background: '#edf1f7', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${course.pct}%`, background: course.color, borderRadius: 999 }} />
                    </div>
                  </div>
                  <span style={{ color: '#2b3d6d', fontSize: 13, fontWeight: 800 }}>{course.progress}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e8ecf5', paddingTop: 18 }}>
              <p style={{ color: '#4f5868', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>
                {isEn
                  ? 'Advisor note: Yunfan stayed consistent this week and is on track for June graduation.'
                  : '顾问留言：芸帆这周保持稳定节奏，按计划在 6 月毕业。'}
              </p>
              <span style={{ display: 'inline-block', background: '#2b3d6d', color: '#fff', borderRadius: 8, padding: '11px 18px', fontSize: 13, fontWeight: 800 }}>
                {isEn ? 'View full dashboard →' : '查看完整家长面板 →'}
              </span>
              <p style={{ color: '#9aa0ad', fontSize: 12, margin: '13px 0 0' }}>
                {isEn
                  ? 'Sample email preview. Actual reports are generated from student records.'
                  : '示例邮件预览。真实报告会从学生记录自动生成。'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .giis-weekly-preview-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function HomepageMain({ language, toggleLanguage }) {
  const isEn = language === 'en';
  return (
    <>
      <Helmet>
        <title>{isEn
          ? 'Online US High School Diploma — Genesis of Ideas International School'
          : '美式在线高中文凭 | 艾迪尔国际学校 Genesis of Ideas International School'}</title>
        <meta
          name="description"
          content={isEn
            ? 'Genesis of Ideas International School — Florida-registered online private high school with 8 academic pathways, parent-visible progress, and documented course records.'
            : '艾迪尔国际学校（Genesis of Ideas International School）— Florida 注册私立在线高中，提供 8 条学习路径、家长可见进度与有记录的课程学习档案。'}
        />
      </Helmet>

      <div className="row">
        <Nav language={language} toggleLanguage={toggleLanguage} />
      </div>

      {/* Hero — bilingual headline + real product screenshot + trust strip */}
      <div id="homepage">
        <HeroSection language={language} />
      </div>

      {/* CTA strip */}
      <Slogan language={language} />

      {/* Parent purchase decision path */}
      <ParentDecisionStrip language={language} />

      {/* Sample weekly digest — makes parent visibility concrete before payment */}
      <WeeklyReportPreview language={language} />

      {/* Why GIIS — 4 pillar cards */}
      <div id="about" style={{ background: '#f4f6fb' }}>
        <Introduction language={language} />
      </div>

      {/* Honest fit check — disarm the "too cheap to be real" reaction */}
      <IsGiisForYou language={language} />

      {/* 80-second product walkthrough — bridge from "why us" to "what we offer" */}
      <div id="demo" style={{ scrollMarginTop: '24px' }}>
        <DemoEmbed language={language} variant="full" />
      </div>

      {/* A real full-length lesson — proves teaching quality before they pay */}
      <LessonPreview language={language} />

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

const outlineLink = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  border: '2px solid #2b3d6d',
  color: '#2b3d6d',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 800,
};

const solidLink = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  background: '#2b3d6d',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 800,
};

export default HomepageMain;
