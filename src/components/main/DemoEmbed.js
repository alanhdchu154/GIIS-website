import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DemoEmbed — reusable 80-second product walkthrough video.
 *
 * Single source of truth for the demo `<video>` element so the MP4 path,
 * poster, and a11y text live in exactly one place. Used on Homepage,
 * Admission, and Pricing.
 *
 * Props:
 *   language          'en' | 'zh'   — required
 *   variant           'full' | 'compact'  — default 'full'
 *                     full     = section padding + headline + 2 CTAs (homepage)
 *                     compact  = trimmer padding + smaller headline + 1 CTA
 *                                (use inside pages that already have hero copy)
 *   eyebrow           string?       — override the eyebrow label
 *   headline          string?       — override the H2 headline (use {en, zh} object)
 *   subline           string?       — override the description (use {en, zh} object)
 *   showCtas          boolean?      — hide both CTAs (e.g. on Pricing where the page already has Apply buttons)
 *   primaryCtaTo      string?       — primary CTA link target, default '/apply'
 *   primaryCtaLabel   {en, zh}?     — override primary CTA text
 *   background        string?       — section background CSS, default white
 */
function DemoEmbed({
  language,
  variant = 'full',
  eyebrow,
  headline,
  subline,
  showCtas = true,
  primaryCtaTo = '/apply',
  primaryCtaLabel,
  background = '#fff',
}) {
  const isEn = language === 'en';
  const isCompact = variant === 'compact';

  // Defaults — same copy as the original HomepageDemo
  const defaultEyebrow   = isEn ? 'See it in action'        : '亲眼看看';
  const defaultHeadline  = isEn ? '80 seconds inside GIIS'  : '80 秒看懂 GIIS';
  const defaultSubline   = isEn
    ? "From your first lesson to a US high school diploma — here's exactly what every GIIS student experiences."
    : '从你第一堂课，到拿到美国高中文凭，每位 GIIS 学生的真实学习历程。';
  const defaultCtaLabel  = isEn ? 'Start Your Application →' : '开始申请 →';

  const eyebrowText  = eyebrow  ?? defaultEyebrow;
  const headlineText = headline?.[isEn ? 'en' : 'zh'] ?? defaultHeadline;
  const sublineText  = subline?.[isEn ? 'en' : 'zh']  ?? defaultSubline;
  const ctaText      = primaryCtaLabel?.[isEn ? 'en' : 'zh'] ?? defaultCtaLabel;

  return (
    <section style={{
      background,
      padding: isCompact ? '60px 0' : '88px 0',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 6%' }}>
        {/* Eyebrow + heading */}
        <div style={{ textAlign: 'center', marginBottom: isCompact ? '28px' : '40px' }}>
          <p style={{
            color: '#2b3d6d',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            margin: '0 0 12px',
          }}>
            {eyebrowText}
          </p>
          <h2 style={{
            fontSize: isCompact ? 'clamp(24px, 3.4vw, 36px)' : 'clamp(28px, 4vw, 46px)',
            fontWeight: 800,
            color: '#1a1a2e',
            lineHeight: 1.1,
            margin: '0 0 14px',
            letterSpacing: '-0.01em',
          }}>
            {headlineText}
          </h2>
          <p style={{
            fontSize: 'clamp(14px, 1.4vw, 16px)',
            color: '#5c6578',
            maxWidth: '620px',
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            {sublineText}
          </p>
        </div>

        {/* Video — click-to-play with poster */}
        <div style={{
          position: 'relative',
          maxWidth: isCompact ? '780px' : '900px',
          margin: '0 auto',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px -12px rgba(26, 26, 46, 0.25), 0 8px 20px -8px rgba(26, 26, 46, 0.15)',
          background: '#000',
          aspectRatio: '16 / 9',
        }}>
          <video
            controls
            preload="metadata"
            poster="/demo/giis-demo-poster.jpg"
            playsInline
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
          >
            <source src="/demo/giis-demo.mp4" type="video/mp4" />
            {isEn
              ? 'Your browser does not support embedded video.'
              : '您的浏览器不支持嵌入式视频播放。'}
          </video>
        </div>

        {/* CTAs underneath the video */}
        {showCtas && (
          <div style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: isCompact ? '24px' : '32px',
          }}>
            <Link
              to={primaryCtaTo}
              style={{
                padding: '13px 28px',
                borderRadius: '10px',
                background: '#2b3d6d',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 14px rgba(43, 61, 109, 0.25)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(43, 61, 109, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(43, 61, 109, 0.25)';
              }}
            >
              {ctaText}
            </Link>
            {!isCompact && (
              <a
                href="/demo/walkthrough.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '13px 28px',
                  borderRadius: '10px',
                  border: '2px solid #d4d8e0',
                  color: '#2b3d6d',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#2b3d6d';
                  e.currentTarget.style.background = '#f4f6fa';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#d4d8e0';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {isEn ? 'Open full-screen tour' : '打开全屏导览'}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default DemoEmbed;
