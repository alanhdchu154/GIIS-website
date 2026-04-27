import React from 'react';
import { Link } from 'react-router-dom';

export default function Slogan({ language = 'en' }) {
  const isEn = language !== 'zh';

  return (
    <section style={{
      background: '#fff',
      borderBottom: '1px solid #e8ecf5',
      padding: '52px 0 48px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '0 10%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '32px',
      }}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '32px', height: '3px', background: 'rgba(213,168,54,1)', borderRadius: '2px' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {isEn ? 'US High School · Fully Online' : '美国高中 · 全程在线'}
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 44px)',
            fontWeight: 800, color: '#1a1a2e',
            lineHeight: 1.1, margin: '0 0 16px',
          }}>
            {isEn
              ? <>Your diploma.<br /><span style={{ color: '#2b3d6d' }}>Your timeline.</span></>
              : <>你的文凭。<br /><span style={{ color: '#2b3d6d' }}>你的节奏。</span></>}
          </h2>
          <p style={{ fontSize: '16px', color: '#555', lineHeight: 1.7, margin: 0, maxWidth: '480px' }}>
            {isEn
              ? 'Earn a US high school diploma fully online — at your own pace, from anywhere in the world.'
              : '全程在线获取美国高中文凭，按自己的节奏，在世界任何地方完成学业。'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', flexShrink: 0 }}>
          <Link to="/admission" style={{
            display: 'inline-block',
            padding: '14px 28px', borderRadius: '8px',
            background: '#2b3d6d', color: '#fff',
            fontWeight: 700, fontSize: '15px', textDecoration: 'none',
          }}>
            {isEn ? 'Apply Now' : '立即申请'}
          </Link>
          <Link to="/pricing" style={{
            display: 'inline-block',
            padding: '14px 28px', borderRadius: '8px',
            border: '2px solid #2b3d6d', color: '#2b3d6d',
            fontWeight: 700, fontSize: '15px', textDecoration: 'none',
          }}>
            {isEn ? 'See Tuition' : '查看学费'}
          </Link>
        </div>
      </div>
    </section>
  );
}
