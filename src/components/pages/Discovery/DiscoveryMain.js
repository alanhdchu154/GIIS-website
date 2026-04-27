import React from 'react';
import { Helmet } from 'react-helmet-async';
import Nav from '../../main/Nav.js';
import img from '../../../img/Homepage/homepage3.png';
import DiscoveryIntroduction from './Discovery/DiscoveryIntroduction.js';
import DiscoveryIntroduction2 from './Discovery/DiscoveryIntroduction2.js';

function DiscoveryMain({ language, toggleLanguage }) {
  const isEn = language !== 'zh';
  return (
    <>
      <Helmet>
        <title>{isEn ? 'Discovery' : '发现我们'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Explore Genesis of Ideas International School — community, learning culture, and what makes us unique.'
            : '了解艾迪尔国际学校的校园与学习文化。'}
        />
      </Helmet>

      <div className="row">
        <Nav language={language} toggleLanguage={toggleLanguage} />
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img src={img} alt="Discovery" style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.72) 100%)',
          padding: '80px 10% 48px',
        }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', margin: '0 0 8px', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
            {isEn ? 'Genesis of Ideas International School' : '艾迪尔国际学校'}
          </p>
          <h1 style={{ color: '#fff', fontSize: '54px', fontWeight: 800, margin: '0 0 12px', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>
            {isEn ? 'DISCOVERY' : '发现我们'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '17px', margin: 0, maxWidth: '520px', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
            {isEn
              ? 'Explore our school culture, values, and what makes GIIS a unique learning environment.'
              : '探索我们的校园文化、核心价值观，以及是什么让艾迪尔成为独特的学习环境。'}
          </p>
        </div>
      </div>

      {/* About GIIS — dark navy */}
      <div id="introduction" style={{
        background: 'rgba(43, 61, 109, 1)',
        borderBottom: '6px solid rgba(213, 168, 54, 1)',
      }}>
        <DiscoveryIntroduction language={language} />
      </div>

      {/* Core Values & Mission */}
      <div id="introduction2">
        <DiscoveryIntroduction2 language={language} />
      </div>
    </>
  );
}

export default DiscoveryMain;
