import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const SCHOOL_PHONE = '+1 (813) 501-5756';
const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const NAV_COLS = [
  {
    titleEn: 'Academics',
    titleZh: '学术',
    links: [
      { en: 'Academics Overview', zh: '学术概览', to: '/academics' },
      { en: 'Lesson Library', zh: '课程库', to: '/lessons' },
      { en: 'Academic Pathways', zh: '学习路径', to: '/pathways' },
      { en: 'Course Catalog', zh: '课程目录', to: '/academics#course-catalog' },
    ],
  },
  {
    titleEn: 'For Parents',
    titleZh: '家长专区',
    links: [
      { en: 'Trust Center', zh: '信任中心', to: '/trust-center' },
      { en: 'Assessment Proof', zh: '评量证据', to: '/assessment-proof' },
      { en: 'Parent Dashboard Preview', zh: '家长面板预览', to: '/parent/demo' },
      { en: 'Academic & Life Support', zh: '学业与生活支持', to: '/support' },
      { en: 'Student Handbook', zh: '学生手册', to: '/handbook' },
      { en: 'Academic Calendar', zh: '学校日历', to: '/calendar' },
    ],
  },
  {
    titleEn: 'School & Admission',
    titleZh: '学校与招生',
    links: [
      { en: 'About & Leadership', zh: '关于我们', to: '/about' },
      { en: 'School Profile (PDF)', zh: '学校简介 (PDF)', to: '/school-profile' },
      { en: 'Discovery', zh: '了解我们', to: '/discovery' },
      { en: 'Admission', zh: '招生', to: '/admission' },
      { en: 'Transfer Students', zh: '转学生入学', to: '/transfer-students' },
      { en: 'Tuition & Pricing', zh: '学费', to: '/pricing' },
    ],
  },
  {
    titleEn: 'Account',
    titleZh: '账户',
    links: [
      { en: 'Student Login', zh: '学生登录', to: '/login' },
      { en: 'Parent Portal', zh: '家长入口', to: '/parent/login' },
      { en: 'Apply Now', zh: '立即申请', to: '/apply' },
    ],
  },
];

const linkHover = (e) => (e.currentTarget.style.color = '#fff');
const linkLeave = (e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)');
const legalHover = (e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)');
const legalLeave = (e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)');

function Footer({ language }) {
  const en = language !== 'zh';
  return (
    <footer style={{ background: '#1a1a2e', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      {/* Main grid */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '64px 10% 48px',
        display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: '36px',
      }}>
        {/* Brand column */}
        <div>
          <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.3 }}>
            Genesis of Ideas<br />International School
          </p>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            {en
              ? 'Florida-registered online high school with documented coursework, parent visibility, and student support.'
              : 'Florida 注册在线高中，提供有记录的课程学习、家长可见进度与学生支持。'}
          </p>
          <span style={{
            display: 'inline-block', fontSize: '10px', fontWeight: 700,
            color: 'rgba(213,168,54,1)', letterSpacing: '1px', textTransform: 'uppercase',
            border: '1px solid rgba(213,168,54,0.35)', borderRadius: '4px', padding: '3px 9px',
          }}>
            {en ? 'Florida Registered Private School' : 'Florida 注册私立学校'}
          </span>

          {/* Contact */}
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href={`tel:${SCHOOL_PHONE.replace(/\s/g, '')}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13px', transition: 'color 0.15s' }}
              onMouseEnter={linkHover} onMouseLeave={linkLeave}>
              📞 {SCHOOL_PHONE}
            </a>
            <a href={`mailto:${SCHOOL_EMAIL}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13px', transition: 'color 0.15s' }}
              onMouseEnter={linkHover} onMouseLeave={linkLeave}>
              ✉️ {SCHOOL_EMAIL}
            </a>
          </div>
        </div>

        {/* Link columns */}
        {NAV_COLS.map((col) => (
          <div key={col.titleEn}>
            <p style={{
              margin: '0 0 16px', fontSize: '10px', fontWeight: 700,
              color: 'rgba(255,255,255,0.38)', letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              {en ? col.titleEn : col.titleZh}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}
                    onMouseEnter={linkHover}
                    onMouseLeave={linkLeave}
                  >
                    {en ? l.en : l.zh}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className={styles.partner} id="education-partner" aria-labelledby="education-partner-title">
        <div className={styles.partnerCopy}>
          <p className={styles.partnerLabel}>{en ? 'Education advisory partnership' : '教育顾问合作'}</p>
          <h2 id="education-partner-title">{en ? 'Genius Academy' : '杰尼教育 Genius Academy'}</h2>
          <p>{en
            ? 'GIIS works with Genius Academy to connect families worldwide with study-abroad planning and university application advisory, including undergraduate, master’s and transfer pathways.'
            : 'GIIS 与杰尼教育合作，为全球家庭提供留学规划与大学申请顾问服务入口，涵盖本科、硕士及大学转学规划。'}</p>
          <p className={styles.partnerNote}>{en
            ? 'Confirm any additional advisory scope and fees separately before engaging the service; these are not automatically included in GIIS tuition. Admissions decisions remain with each institution.'
            : '额外顾问服务的范围与费用须在合作前另行确认，不自动包含在 GIIS 学费内。录取决定由各院校独立作出。'}</p>
        </div>
        <a className={styles.partnerLink} href={en ? 'https://genius.genesisideas.school/en' : 'https://genius.genesisideas.school/'}>
          {en ? 'Explore Genius Academy' : '了解杰尼教育服务'}
          <span>{en ? 'Visit our advisory partner’s website' : '前往合作顾问网站'}</span>
        </a>
      </section>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 10%' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
            {en
              ? `© ${new Date().getFullYear()} Genesis of Ideas International School. All rights reserved.`
              : `© ${new Date().getFullYear()} 艾迪尔国际学校（Genesis of Ideas International School）。保留所有权利。`}
          </p>
          <nav style={{ display: 'flex', gap: '20px' }} aria-label={en ? 'Legal' : '法律'}>
            {[
              { to: '/privacy', en: 'Privacy', zh: '隐私' },
              { to: '/terms', en: 'Terms', zh: '条款' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '13px', transition: 'color 0.15s' }}
                onMouseEnter={legalHover}
                onMouseLeave={legalLeave}
              >
                {en ? l.en : l.zh}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
