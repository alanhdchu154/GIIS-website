import React from 'react';
import { Link } from 'react-router-dom';

const STORIES = [
  {
    name: 'Yunfan Yang',
    nameZh: '杨芸帆',
    grad: 'Class of 2026',
    gradZh: '2026 届',
    major: { en: 'Kinesiology / Sports Science', zh: '运动科学' },
    gpa: '3.78',
    offers: ['UC Santa Barbara', 'The Ohio State University', 'UC Davis'],
    quote: {
      en: 'The Sports Science pathway helped me build a course record that showed exactly what I wanted to study. My advisor kept me on track every semester.',
      zh: '运动科学路径帮我构建了一份完整展示申请方向的课程记录，顾问每学期都在帮我把握节奏。',
    },
    accent: '#1B6B3A',
    bg: '#f0f9f4',
  },
  {
    name: 'Baoyi Lu',
    nameZh: '卢抱一',
    grad: 'Class of 2026',
    gradZh: '2026 届',
    major: { en: 'Information Studies / Technology', zh: '信息技术' },
    gpa: '3.90',
    offers: ['Syracuse University (SIT)', 'NJIT'],
    quote: {
      en: 'I transferred credits from my previous school and completed the remaining requirements fully online. GIIS made the US application process straightforward.',
      zh: '我把之前学校的学分转入，剩余课程全部在线完成。GIIS 让美国的申请流程变得清晰可控。',
    },
    accent: '#1565C0',
    bg: '#f0f4ff',
  },
];

export default function SuccessStories({ language }) {
  const isEn = language !== 'zh';

  return (
    <section style={{ background: '#fff', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {isEn ? 'Student Results' : '学生成果'}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.05, margin: 0, color: '#1a1a2e' }}>
            {isEn ? 'Our Students Get Into Great Schools' : '我们的学生进入优秀大学'}
          </h2>
          <Link to="/admission" style={{
            flexShrink: 0, padding: '11px 22px', borderRadius: '8px',
            border: '2px solid #2b3d6d', color: '#2b3d6d',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            {isEn ? 'Apply Now →' : '立即申请 →'}
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {STORIES.map((s) => (
            <div key={s.name} style={{
              background: s.bg,
              border: `1px solid ${s.accent}20`,
              borderTop: `4px solid ${s.accent}`,
              borderRadius: '14px',
              padding: '32px 28px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: s.accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 800, flexShrink: 0,
                  }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '17px', color: '#1a1a2e' }}>
                      {isEn ? s.name : s.nameZh}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                      {isEn ? s.grad : s.gradZh} · GPA {s.gpa} · {isEn ? s.major.en : s.major.zh}
                    </p>
                  </div>
                </div>
              </div>

              {/* Offers */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isEn ? 'Accepted To' : '录取院校'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {s.offers.map((o) => (
                    <span key={o} style={{
                      fontSize: '13px', fontWeight: 700, color: s.accent,
                      background: '#fff', border: `1.5px solid ${s.accent}30`,
                      padding: '4px 12px', borderRadius: '20px',
                    }}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p style={{
                margin: 0, fontSize: '13px', color: '#444', lineHeight: 1.7,
                fontStyle: 'italic', borderLeft: `3px solid ${s.accent}40`,
                paddingLeft: '14px',
              }}>
                "{isEn ? s.quote.en : s.quote.zh}"
              </p>
            </div>
          ))}
        </div>

        <p style={{ margin: '28px 0 0', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
          {isEn
            ? 'Results from GIIS Class of 2026. Individual outcomes vary based on academic performance and application strategy.'
            : '以上为 GIIS 2026 届学生真实录取结果。个人结果因学业表现与申请策略而有所不同。'}
        </p>
      </div>
    </section>
  );
}
