import React from 'react';

const PILLARS = [
  {
    icon: '🎓',
    en: { title: 'US High School Diploma', body: 'GIIS is a registered Florida private school issuing US high school diplomas under the Florida 24-credit graduation framework — the same standard followed by US private high schools and recognized by US colleges for international student admissions.' },
    zh: { title: '美国高中文凭', body: 'GIIS 是在 Florida 注册的私立学校，依据 Florida 24 学分毕业框架颁发美国高中文凭，与美国私立高中标准一致，是美国大学在审核国际学生申请时所认可的正式学历。' },
  },
  {
    icon: '🌐',
    en: { title: '100% Online, Any Time Zone', body: 'Fully online classes taught by qualified instructors. Students attend from anywhere in the world — no relocation required. All coursework is accessible on any device.' },
    zh: { title: '全线上教学，适配任意时区', body: '课程完全在线，由合格教师授课。学生可在全球任何地方就读，无需搬迁。所有课程均可在任意设备上访问。' },
  },
  {
    icon: '🛤️',
    en: { title: '8 Academic Pathways', body: '4-year elective sequences designed around the top US university majors chosen by Chinese international students — from CS and Engineering to Business, Psychology, and more.' },
    zh: { title: '8 条学习路径', body: '围绕中国留学生最热门的美国大学申请专业方向，精心设计的四年选修课程路径，涵盖计算机、工程、商业、心理学等。' },
  },
  {
    icon: '🤖',
    en: { title: 'AI-Enhanced Learning', body: 'AI tools are integrated throughout the curriculum to create personalized, adaptive learning experiences — making coursework more engaging and helping every student progress at their optimal pace.' },
    zh: { title: 'AI 赋能学习', body: '人工智能工具全程融入课程，为每位学生提供个性化、自适应的学习体验，让课程更具吸引力，帮助每位学生以最佳节奏进步。' },
  },
];

export default function Introduction({ language }) {
  const isEn = language !== 'zh';

  return (
    <section style={{ padding: '72px 0 60px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {isEn ? 'About GIIS' : '关于我们'}
        </p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 16px', color: '#1a1a2e' }}>
          {isEn ? 'Why students choose GIIS' : '学生为什么选择艾迪尔'}
        </h2>
        <p style={{ fontSize: '17px', color: '#555', maxWidth: '640px', lineHeight: 1.7, margin: '0 0 52px' }}>
          {isEn
            ? "GIIS is a fully online, US-accredited international high school designed specifically for Chinese students targeting top US universities. We combine rigorous academics with personalized pathway planning and AI-powered learning tools."
            : '艾迪尔国际学校是一所完全在线的 Florida 注册私立学校，专为目标申请美国顶尖大学的中国学生而设计，将严格的学术课程与个性化路径规划及 AI 学习工具相结合。'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {PILLARS.map((p) => (
            <div key={p.icon} style={{
              padding: '28px 24px',
              border: '1px solid #e8ecf5',
              borderRadius: '12px',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(43,61,109,0.06)',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(43,61,109,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(43,61,109,0.06)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{p.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 10px' }}>
                {isEn ? p.en.title : p.zh.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.65, margin: 0 }}>
                {isEn ? p.en.body : p.zh.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
