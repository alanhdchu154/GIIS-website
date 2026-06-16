import React from 'react';

const VALUES = [
  {
    emoji: '🎯',
    titleEn: 'Personalized Learning',
    titleZh: '个性化学习',
    bodyEn: 'Each reviewed enrollment starts from a pathway-aware course sequence based on interests, prior credits, and graduation goals. Guided and Premium families add recurring advisor review when they need more human accountability.',
    bodyZh: '每个已审核入学家庭会从符合兴趣、既有学分与毕业目标的课程顺序开始；需要更多人工跟进时，Guided 与 Premium 家庭可加入定期顾问审核。',
  },
  {
    emoji: '🌏',
    titleEn: 'International Perspective',
    titleZh: '国际视野',
    bodyEn: 'Our curriculum is organized around transcript-ready coursework, assessment evidence, and parent-visible progress so families can understand what the student is actually completing.',
    bodyZh: '我们的课程围绕可进入成绩单的课程、评估证据与家长可见的学习进度设计，让家庭能清楚了解学生实际完成了什么。',
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
  { en: 'Pathway-aware course sequence, with advisor review by plan', zh: '按学习路径安排课程顺序，并依方案加入顾问审核' },
  { en: 'Curriculum built around transcript-ready evidence', zh: '课程围绕可记录的学习证据设计' },
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
                  ? "GIIS's mission is to inspire potential and cultivate the next generation of leaders. We prioritize individual student development through clear learning resources, reviewable coursework, parent-visible progress, and advisor support matched to the family's chosen plan."
                  : 'GIIS 的使命是启发潜能、培育新一代领袖。我们通过清楚的学习资源、可审核的课程作业、家长可见进度，以及符合家庭所选方案的顾问支持，优先关注学生发展。'}
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
