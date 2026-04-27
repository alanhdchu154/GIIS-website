import React from 'react';
import { Link } from 'react-router-dom';

const SCHOOL_PHONE = '+1 (813) 501-5756';
const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const NAV_COLS = [
  {
    titleEn: 'Academics',
    titleZh: '学术',
    links: [
      { en: 'Academics Overview', zh: '学术概览', to: '/academics' },
      { en: 'Academic Pathways', zh: '学习路径', to: '/pathways' },
      { en: 'Course Catalog', zh: '课程目录', to: '/academics#course-catalog' },
    ],
  },
  {
    titleEn: 'School',
    titleZh: '学校',
    links: [
      { en: 'Admission', zh: '招生', to: '/admission' },
      { en: 'Tuition & Pricing', zh: '学费', to: '/pricing' },
      { en: 'Discovery', zh: '了解我们', to: '/discovery' },
      { en: 'Support', zh: '支持', to: '/support' },
    ],
  },
  {
    titleEn: 'Account',
    titleZh: '账户',
    links: [
      { en: 'Student Login', zh: '学生登录', to: '/login' },
      { en: 'Apply Now', zh: '立即申请', to: '/admission' },
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
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px',
      }}>
        {/* Brand column */}
        <div>
          <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.3 }}>
            Genesis of Ideas<br />International School
          </p>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            {en
              ? 'US-accredited online high school for Chinese students targeting top US universities.'
              : '面向中国学生的美国认证在线高中，助力申请顶尖大学。'}
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
