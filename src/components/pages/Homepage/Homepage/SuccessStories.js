import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const STUDENTS = [
  {
    name: 'Yunfan Yang',
    nameZh: '杨芸帆',
    initials: 'YY',
    color: '#1B6B3A',
    bg: '#f0f9f4',
    accent: '#1B6B3A',
    grad: '2026',
    gpa: '3.78',
    major: { en: 'Kinesiology & Sports Science', zh: '运动科学' },
    offers: ['UC Santa Barbara', 'The Ohio State University', 'UC Davis'],
    courses: ['Sports Psychology', 'Sports Management', 'Biology Advanced', 'Physics – Mechanics', 'Athletics Training', 'Fitness Leadership'],
    quote: {
      en: 'The Sports Science pathway gave me a course record that directly matched what I wanted to study. My advisor helped me stay on track every semester.',
      zh: '运动科学路径让我的课程记录与申请方向高度契合，顾问每学期都帮我把握节奏。',
    },
    years: { en: '4-year program · Grade 9–12', zh: '4年项目 · 9–12年级' },
  },
  {
    name: 'Baoyi Lu',
    nameZh: '卢抱一',
    initials: 'BL',
    color: '#1565C0',
    bg: '#f0f4ff',
    accent: '#1565C0',
    grad: '2026',
    gpa: '3.90',
    major: { en: 'Information Studies & Communications', zh: '信息学与传播学' },
    offers: ['Syracuse University (SIT)', 'NJIT'],
    courses: ['Digital Literacy', 'Communication Studies', 'Media & Society', 'Statistics for Social Sciences', 'Research Methods', 'Academic Writing'],
    quote: {
      en: 'GIIS made the US application process straightforward. My communication and data coursework gave me a strong foundation for information studies.',
      zh: 'GIIS 让美国申请流程变得清晰可控。传播与数据课程为我进入信息学领域打下了扎实基础。',
    },
    years: { en: '4-year program · Grade 9–12', zh: '4年项目 · 9–12年级' },
  },
];

export default function SuccessStories({ language }) {
  const isEn = language !== 'zh';
  const [expanded, setExpanded] = useState(null);

  return (
    <section style={{ background: '#fff', padding: '80px 0 0', fontFamily: 'Inter, sans-serif' }}>
      {/* Section header */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10% 48px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {isEn ? 'Class of 2026 · Real Results' : '2026 届 · 真实成果'}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.05, margin: 0, color: '#1a1a2e' }}>
            {isEn ? 'Our Students Get Into' : '我们的学生被录取到'}
            <br />
            <span style={{ color: '#2b3d6d' }}>{isEn ? 'Great Universities' : '优秀大学'}</span>
          </h2>
          <Link to="/admission" style={{
            flexShrink: 0, padding: '12px 24px', borderRadius: '8px',
            background: '#2b3d6d', color: '#fff',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
          }}>
            {isEn ? 'Apply Now →' : '立即申请 →'}
          </Link>
        </div>
      </div>

      {/* Student cards */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10% 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {STUDENTS.map((s) => (
            <div key={s.name} style={{
              background: s.bg,
              border: `1px solid ${s.accent}18`,
              borderTop: `4px solid ${s.accent}`,
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {/* Card top */}
              <div style={{ padding: '28px 28px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                    background: s.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 800,
                  }}>
                    {s.initials}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '19px', color: '#1a1a2e' }}>
                      {isEn ? s.name : s.nameZh}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#666' }}>
                      {isEn ? s.years.en : s.years.zh}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: s.color }}>{s.gpa}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPA</p>
                  </div>
                </div>

                {/* Major */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', border: `1px solid ${s.color}30`, borderRadius: '20px', padding: '4px 12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isEn ? 'Major' : '申请专业'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>
                    {isEn ? s.major.en : s.major.zh}
                  </span>
                </div>

                {/* Accepted to */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isEn ? 'Accepted To' : '录取院校'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {s.offers.map((o) => (
                      <span key={o} style={{
                        fontSize: '13px', fontWeight: 700, color: s.color,
                        background: '#fff', border: `1.5px solid ${s.color}40`,
                        padding: '5px 12px', borderRadius: '6px',
                      }}>
                        {o}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <p style={{
                  margin: 0, fontSize: '13px', color: '#444', lineHeight: 1.75,
                  fontStyle: 'italic',
                  borderLeft: `3px solid ${s.color}50`, paddingLeft: '14px',
                }}>
                  "{isEn ? s.quote.en : s.quote.zh}"
                </p>
              </div>

              {/* Courses footer */}
              <div style={{ borderTop: `1px solid ${s.color}15`, padding: '16px 28px', background: 'rgba(255,255,255,0.6)' }}>
                <button
                  onClick={() => setExpanded(expanded === s.name ? null : s.name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 700, color: s.color, marginBottom: expanded === s.name ? '12px' : 0 }}
                >
                  {expanded === s.name
                    ? (isEn ? '▲ Hide courses' : '▲ 收起课程')
                    : (isEn ? '▼ Key courses taken' : '▼ 查看关键课程')}
                </button>
                {expanded === s.name && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {s.courses.map((c) => (
                      <span key={c} style={{
                        fontSize: '11px', color: '#555',
                        background: '#fff', border: '1px solid #e0e6f0',
                        padding: '3px 10px', borderRadius: '20px',
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stat bar */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '40px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', textAlign: 'center' }}>
            {[
              { num: '5+', label: { en: 'University Offers', zh: '录取通知书' } },
              { num: '3.84', label: { en: 'Avg. GPA', zh: '平均 GPA' } },
              { num: '100%', label: { en: 'Acceptance Rate', zh: '大学录取率' } },
              { num: '2026', label: { en: 'First Graduating Class', zh: '首届毕业生' } },
            ].map((stat) => (
              <div key={stat.num}>
                <p style={{ margin: '0 0 4px', fontSize: '36px', fontWeight: 800, color: 'rgba(213,168,54,1)', lineHeight: 1 }}>
                  {stat.num}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isEn ? stat.label.en : stat.label.zh}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
