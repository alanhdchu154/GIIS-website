import React from 'react';

const PILLARS = [
  {
    icon: '🎓',
    titleEn: 'US High School Diploma',
    titleZh: '美国高中文凭',
    bodyEn: 'GIIS is a registered Florida private school issuing US high school diplomas under the Florida 24-credit graduation framework — the same standard recognized by US colleges for international student admissions.',
    bodyZh: 'GIIS 是在 Florida 注册的私立学校，依据 Florida 24 学分毕业框架颁发美国高中文凭，与美国私立高中标准一致，获美国大学国际生招生认可。',
  },
  {
    icon: '🤖',
    titleEn: 'Immersive Learning with AI',
    titleZh: 'AI 驱动的沉浸式学习',
    bodyEn: 'By integrating AI and cutting-edge technologies into teaching, we create adaptive learning experiences that make the curriculum more engaging and interactive for every student.',
    bodyZh: '通过将 AI 与前沿科技整合进教学，我们为每位学生打造更具互动性与适应性的学习体验。',
  },
  {
    icon: '🎯',
    titleEn: 'Personalized Pathways',
    titleZh: '个性化学习路径',
    bodyEn: 'Each student builds a 4-year course history around their target US college major — from CS & Engineering to Business, Psychology, and the Arts — so their transcript tells a coherent story to admissions.',
    bodyZh: '每位学生围绕目标美国大学专业，构建四年一贯的选课记录——从计算机科学到商业、心理学、艺术设计，让成绩单完整呈现学术方向。',
  },
];

function Academicsintroduction({ language }) {
  const isEn = language !== 'zh';
  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '72px 10%', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
        {isEn ? 'The GIIS Difference' : '我们的与众不同'}
      </p>
      <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 48px' }}>
        {isEn ? 'What Makes GIIS Different?' : '艾迪尔有何不同？'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        {PILLARS.map((p) => (
          <div key={p.titleEn} style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid rgba(213,168,54,1)',
            borderRadius: '12px',
            padding: '28px 24px',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>{p.icon}</div>
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 700, color: '#fff' }}>
              {isEn ? p.titleEn : p.titleZh}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75 }}>
              {isEn ? p.bodyEn : p.bodyZh}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Academicsintroduction;
