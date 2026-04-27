import React from 'react';

function FacultyGraduates({ language = 'en' }) {
  const isEn = language !== 'zh';

  const importAll = (r) => {
    let images = {};
    r.keys().forEach((item) => { images[item.replace('./', '')] = r(item); });
    return images;
  };

  const images = importAll(require.context('../../../../img/Homepage/SchoolLogo', false, /\.(png|jpe?g|svg)$/));
  const logos = Object.entries(images).map(([key, value]) => ({
    src: value,
    alt: key.replace(/\..+$/, ''),
  }));

  return (
    <section style={{ background: '#fff', padding: '72px 0', borderTop: '1px solid #e8ecf5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {isEn ? 'Proven Results' : '真实成果'}
        </p>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.1 }}>
          {isEn ? 'Our Graduates Have Been Accepted To' : '我们的毕业生已被以下院校录取'}
        </h2>
        <p style={{ fontSize: '14px', color: '#888', margin: '0 0 40px' }}>
          {isEn ? 'US universities that have accepted GIIS graduates.' : '已接收 GIIS 毕业生的美国大学。'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'flex-start' }}>
          {logos.map((logo, index) => (
            <div key={index} style={{
              width: '120px', height: '72px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f8f9fd', border: '1px solid #e8ecf5',
              borderRadius: '10px', padding: '10px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2b3d6d30'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(43,61,109,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8ecf5'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                style={{ maxWidth: '100px', maxHeight: '52px', objectFit: 'contain', filter: 'grayscale(20%)' }}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FacultyGraduates;
