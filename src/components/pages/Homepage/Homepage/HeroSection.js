import React from 'react';
import { Link } from 'react-router-dom';
import dashboardScreen from '../../../../img/Hero/dashboard-screen.jpg';

/**
 * Homepage hero — replaces the AI-generated photo carousel.
 *
 * Two-column on desktop:
 *   LEFT  — eyebrow + bilingual headline + sub + CTAs
 *   RIGHT — real Learn Portal dashboard screenshot (browser-chrome framed)
 *
 * Below: a single-row trust strip (Florida-registered · 24-credit diploma · Class of 2026 · real teacher feedback).
 */
function HeroSection({ language }) {
  const isEn = language === 'en';

  return (
    <section style={{
      background: 'linear-gradient(160deg, #0f1020 0%, #1a1a2e 45%, #2b3d6d 100%)',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      paddingTop: '60px',
      paddingBottom: '0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        maxWidth: '1180px', margin: '0 auto',
        padding: '0 6%',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.1fr)',
        gap: '56px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
        className="giis-hero-grid"
      >
        {/* ── LEFT: copy ── */}
        <div>
          <p style={{
            color: '#d5a836',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            margin: '0 0 18px',
          }}>
            {isEn ? 'Florida-Registered · 100% Online' : 'Florida 注册私校 · 全线上学习'}
          </p>

          <h1 style={{
            fontSize: 'clamp(34px, 4.6vw, 60px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: 0,
            margin: '0 0 18px',
          }}>
            {isEn ? (
              <>A real <span style={{ color: '#d5a836' }}>US High School Diploma.</span><br />From anywhere.</>
            ) : (
              <>真正的<span style={{ color: '#d5a836' }}>美国高中文凭。</span><br />在世界任何地方就读。</>
            )}
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.5vw, 18px)',
            color: 'rgba(255,255,255,0.78)',
            lineHeight: 1.65,
            margin: '0 0 32px',
            maxWidth: '520px',
          }}>
            {isEn
              ? 'Florida-registered private school. 24-credit graduation framework. Real coursework, transcript records, parent progress visibility, and a diploma path built for US college admissions review.'
              : 'Florida 注册私立学校。24 学分毕业框架。真实课程、成绩记录、家长进度可视化，以及面向美国大学申请审核的文凭路径。'}
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <Link to="/apply" style={ctaPrimary}>
              {isEn ? 'Start Your Application →' : '开始申请 →'}
            </Link>
            <a href="#demo" style={ctaSecondary}>
              {isEn ? 'Watch the 80-sec tour' : '观看 80 秒导览'}
            </a>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' }}>
            {isEn ? (
              <>Already enrolled?{' '}
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Sign in →</Link>
              </>
            ) : (
              <>已登记？{' '}
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>登入 →</Link>
              </>
            )}
          </p>

          {/* Founders pricing — strikethrough regular, highlight founders rate */}
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap',
          }}>
            <span style={{
              background: '#d5a836',
              color: '#1a1a2e',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              {isEn ? 'Founders' : '创校价'}
            </span>
            <span>
              <span style={{ color: '#d5a836', fontWeight: 800, fontSize: '18px' }}>$19.90</span>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{isEn ? ' / month · ' : ' / 月 · '}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>$199</span>
            </span>
          </p>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            margin: '6px 0 0',
          }}>
            {isEn
              ? 'First 100 students · Lock in this rate for 12 months · Cancel anytime'
              : '限前 100 名学生 · 锁定 12 个月 · 随时取消'}
          </p>
        </div>

        {/* ── RIGHT: real product screenshot ── */}
        <div style={{
          position: 'relative',
          transform: 'perspective(1400px) rotateY(-4deg) rotateX(2deg)',
        }}>
          <img
            src={dashboardScreen}
            alt={isEn ? 'GIIS Student Portal — track credits, GPA, and graduation progress' : 'GIIS 学生平台 — 追踪学分、GPA 与毕业进度'}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '14px',
              boxShadow: '0 28px 60px -12px rgba(0, 0, 0, 0.55), 0 12px 26px -8px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
            }}
          />
          {/* floating "live" badge — subtle hint that this is a real screenshot */}
          <div style={{
            position: 'absolute',
            top: '14px', left: '14px',
            background: 'rgba(46, 125, 50, 0.95)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            padding: '4px 10px',
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px',
              borderRadius: '50%', background: '#a5d6a7',
              boxShadow: '0 0 0 0 rgba(165,214,167,0.7)',
              animation: 'giis-pulse 2s infinite',
            }} />
            {isEn ? 'LIVE PRODUCT' : '真实产品'}
          </div>
        </div>
      </div>

      {/* ── TRUST STRIP ── */}
      <div style={{
        marginTop: '64px',
        background: 'rgba(0,0,0,0.25)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 6%',
      }}>
        <div style={{
          maxWidth: '1180px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '32px', flexWrap: 'wrap',
        }}>
          <div style={trustBlock}>
            <span style={{ fontSize: '28px' }}>🏛️</span>
            <div>
              <p style={trustLabel}>{isEn ? 'Florida Statute 1002.42' : 'Florida 法规 1002.42'}</p>
              <p style={trustValue}>{isEn ? 'Registered private school' : '注册私立学校'}</p>
            </div>
          </div>

          <div style={trustBlock}>
            <span style={{ fontSize: '28px' }}>✍️</span>
            <div>
              <p style={trustLabel}>{isEn ? 'Weekly parent reports' : '每周家长报告'}</p>
              <p style={trustValue}>{isEn ? 'Progress visibility after enrollment' : '入学后持续看见进度'}</p>
            </div>
          </div>

          <div style={trustBlock}>
            <span style={{ fontSize: '28px' }}>🎓</span>
            <div>
              <p style={trustLabel}>{isEn ? 'Class of 2026' : '2026 届录取'}</p>
              <p style={trustValue}>UC Santa Barbara · The Ohio State University · UC Davis · Syracuse University · New Jersey Institute of Technology</p>
            </div>
          </div>

          <div style={trustBlock}>
            <span style={{ fontSize: '28px' }}>📜</span>
            <div>
              <p style={trustLabel}>{isEn ? '24-credit diploma' : '24 学分文凭'}</p>
              <p style={trustValue}>{isEn ? 'Same as US private HS' : '与美国私立高中同标准'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* keyframes + responsive — inlined to keep this self-contained */}
      <style>{`
        @keyframes giis-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(165,214,167,0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(165,214,167,0); }
          100% { box-shadow: 0 0 0 0 rgba(165,214,167,0); }
        }
        @media (max-width: 880px) {
          .giis-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
            text-align: left;
          }
          .giis-hero-grid > div:last-child {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}

const ctaPrimary = {
  padding: '15px 30px',
  borderRadius: '10px',
  background: '#d5a836',
  color: '#1a1a2e',
  fontWeight: 800,
  fontSize: '15px',
  textDecoration: 'none',
  letterSpacing: '0.3px',
  boxShadow: '0 8px 22px -4px rgba(213,168,54,0.45)',
  transition: 'transform 0.15s, box-shadow 0.15s',
};
const ctaSecondary = {
  padding: '15px 26px',
  borderRadius: '10px',
  background: 'transparent',
  border: '1.5px solid rgba(255,255,255,0.3)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '15px',
  textDecoration: 'none',
  letterSpacing: '0.3px',
};
const trustBlock = {
  display: 'flex', alignItems: 'center', gap: '14px',
  flex: '1 1 200px', minWidth: '200px',
};
const trustLabel = {
  margin: 0,
  fontSize: '12px',
  fontWeight: 700,
  color: 'rgba(213,168,54,0.95)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
};
const trustValue = {
  margin: '2px 0 0',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.75)',
  lineHeight: 1.4,
};

export default HeroSection;
