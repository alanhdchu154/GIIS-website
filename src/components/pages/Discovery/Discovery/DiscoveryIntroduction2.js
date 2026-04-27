import React from 'react';

const VALUES = [
  {
    emoji: '🎯',
    titleEn: 'Personalized Learning',
    titleZh: '个性化学习',
    bodyEn: 'Every student chooses their academic pathway based on their target US university major. Advisors track progress each semester to keep students on course.',
    bodyZh: '每位学生根据目标美国大学专业选择学习路径，顾问每学期跟踪进度，确保学生始终方向明确。',
  },
  {
    emoji: '🌏',
    titleEn: 'International Perspective',
    titleZh: '国际视野',
    bodyEn: 'Our curriculum is designed around US university admissions standards — building the academic profile that top US programs are looking for.',
    bodyZh: '我们的课程围绕美国大学招生标准设计，帮助学生建立顶尖美国院校所期望的学术背景。',
  },
  {
    emoji: '📈',
    titleEn: 'Comprehensive Development',
    titleZh: '全面发展',
    bodyEn: 'Beyond academics, we emphasize leadership, critical thinking, and entrepreneurial spirit — preparing students to thrive in university and beyond.',
    bodyZh: '超越学术本身，我们注重培养领导力、批判性思维和创业精神，让学生在大学及未来的道路上充分发展。',
  },
];

const MISSION_POINTS = [
  { en: 'Personalized advisor support every semester', zh: '每学期提供个性化顾问支持' },
  { en: 'Curriculum built around US university admissions', zh: '课程围绕美国大学申请标准设计' },
  { en: 'Global citizens with a strong sense of responsibility', zh: '培养具有社会责任感的全球公民' },
  { en: 'Leadership and entrepreneurial spirit development', zh: '领导力与创业精神培养' },
];

function DiscoveryIntroduction2({ language }) {
  const isEn = language !== 'zh';
  return (
    <>
      {/* Core Values */}
      <section style={{ background: '#f4f6fb', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'What We Stand For' : '我们的理念'}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 48px', lineHeight: 1.05 }}>
            {isEn ? 'Our Core Values' : '核心价值观'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {VALUES.map((v) => (
              <div key={v.titleEn} style={{
                background: '#fff', borderRadius: '12px',
                border: '1px solid #e0e6f5', padding: '28px',
                borderTop: '4px solid #2b3d6d',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{v.emoji}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 700, color: '#1a1a2e' }}>
                  {isEn ? v.titleEn : v.titleZh}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: 1.75 }}>
                  {isEn ? v.bodyEn : v.bodyZh}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: '#fff', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '60px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                {isEn ? 'Our Mission' : '我们的使命'}
              </p>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 20px', lineHeight: 1.1 }}>
                {isEn ? 'Inspire Potential,\nCultivate Leaders' : '启发潜能，培养领袖'}
              </h2>
              <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.8, margin: 0 }}>
                {isEn
                  ? "GIIS's mission is to inspire potential and cultivate the next generation of leaders. We prioritize individual student development through personalized guidance and abundant learning resources, creating an environment where every student can thrive."
                  : 'GIIS 的使命是启发潜能、培育新一代领袖。我们通过个性化指导和丰富的学习资源，优先关注每位学生的个人发展，打造一个让每个人都能蓬勃成长的环境。'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {MISSION_POINTS.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                    background: '#2b3d6d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '2px',
                  }}>
                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 800 }}>✓</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: 1.6 }}>
                    {isEn ? item.en : item.zh}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default DiscoveryIntroduction2;
