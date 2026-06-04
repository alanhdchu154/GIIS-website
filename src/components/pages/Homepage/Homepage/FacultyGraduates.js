import React from 'react';

function FacultyGraduates({ language = 'en' }) {
  const isEn = language !== 'zh';
  const outcomes = [
    'UC Santa Barbara',
    'The Ohio State University',
    'UC Davis',
    'Syracuse University',
    'New Jersey Institute of Technology',
  ];

  return (
    <section style={{ background: '#fff', padding: '72px 0', borderTop: '1px solid #e8ecf5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {isEn ? 'Student Outcomes' : '学生成果'}
        </p>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.1 }}>
          {isEn ? 'College Outcomes Reported by GIIS Families' : 'GIIS 家庭回报的升学成果'}
        </h2>
        <p style={{ fontSize: '14px', color: '#667085', margin: '0 0 28px', maxWidth: '680px', lineHeight: 1.7 }}>
          {isEn
            ? 'Admissions outcomes reported to GIIS by graduating families. GIIS does not guarantee admission results.'
            : '以下为毕业家庭向 GIIS 回报的升学成果。GIIS 不承诺大学录取结果。'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
          {outcomes.map((name) => (
            <div key={name} style={{
              minHeight: '74px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: '#f8f9fd',
              border: '1px solid #e8ecf5',
              borderRadius: '8px',
              padding: '14px 16px',
              color: '#243152',
              fontSize: '14px',
              fontWeight: 750,
              lineHeight: 1.35,
            }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FacultyGraduates;
