import React from 'react';

const AP_COURSES = [
  { code: 'AP Statistics',      icon: '∑', desc: { en: 'Data analysis & inference', zh: '数據分析与统计推论' } },
  { code: 'AP Biology',         icon: '🧬', desc: { en: 'College-level life sciences', zh: '大学程度生命科学' } },
  { code: 'AP Psychology',      icon: '🧠', desc: { en: 'Behavior & mental processes', zh: '行为与心理历程' } },
  { code: 'AP Human Geography', icon: '🌏', desc: { en: 'Patterns of human society', zh: '人文地理与全球视野' } },
];

const PROGRAMS = [
  {
    id: 'diploma',
    icon: '🎓',
    title: { en: 'US Diploma Program', zh: '美国高中文凭课程' },
    tag: { en: '24 Credits · Florida Registered', zh: '24 学分 · Florida 注册私立学校' },
    body: {
      en: 'GIIS is a registered Florida private school issuing US high school diplomas under the Florida 24-credit graduation framework — the same standard followed by US private high schools and recognized by US colleges for international student admissions.',
      zh: 'GIIS 是在 Florida 注册的私立学校，依据 Florida 24 学分毕业框架颁发美国高中文凭，与美国私立高中标准一致，在美国大学审核国际学生申请时具备完整的学术效力。',
    },
    points: {
      en: ['English Language Arts — 4 credits', 'Mathematics — 4 credits', 'Science — 3 credits', 'Social Studies — 3 credits', 'PE & Health — 1 credit', 'Electives — 8.5 credits'],
      zh: ['英语语言艺术 — 4 学分', '数学 — 4 学分', '自然科学 — 3 学分', '社会科学 — 3 学分', '体育与健康 — 1 学分', '选修课程 — 8.5 学分'],
    },
  },
  {
    id: 'electives',
    icon: '🗂️',
    title: { en: 'Elective Concentration Tracks', zh: '选修方向规划' },
    tag: { en: 'Tailored to College Major Goals', zh: '依申请方向量身规划' },
    body: {
      en: 'Beyond core requirements, GIIS offers 8 academic pathways across STEM, Business, and the Arts. Students build a cohesive course history that demonstrates depth and direction — exactly what US admissions officers look for.',
      zh: '在必修科目之外，GIIS 提供横跨 STEM、商业与艺术的 8 条学习路径。学生可建立一致且有深度的选课记录，展现出明确的学术方向——这正是美国大学申请审核最重视的要素。',
    },
    points: {
      en: ['Psychology & Behavioral Science — from intro to AP Psychology & capstone', 'CS & Engineering — programming, data structures, AP CS A, and ML', 'Business & Marketing — entrepreneurship, marketing, consumer behavior', 'Economics & Finance — micro/macro economics, financial markets, 2 AP courses'],
      zh: ['心理学与行为科学 — 从入门到 AP 心理学与研究专题', '计算机科学与工程 — 编程、数据结构、AP CS A 与机器学习', '商业与市场营销 — 创业、营销、消费者行为', '经济与金融 — 微观/宏观经济学、金融市场，含两门 AP 课程'],
    },
  },
];

export default function Academicsintroduction2({ language }) {
  const isEn = language !== 'zh';

  return (
    <>
      {/* ── Section 1: OUR PROGRAMS ─────────────────────────────── */}
      <div style={{ padding: '80px 0 60px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Curriculum Structure' : '课程架构'}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.05, marginBottom: '16px', color: '#1a1a2e' }}>
            {isEn ? 'Our Programs' : '课程体系'}
          </h2>
          <p style={{ fontSize: '20px', color: '#555', maxWidth: '640px', lineHeight: 1.7, marginBottom: '56px' }}>
            {isEn
              ? 'GIIS offers a US high school diploma program built on the Florida 24-credit framework, with 8 elective pathways designed specifically for Chinese students targeting US university admissions.'
              : 'GIIS 提供以 Florida 24 学分框架为基础的美国高中文凭课程，并为目标申请美国大学的中国学生设计了 8 条专属选修路径。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {PROGRAMS.map((prog) => (
              <div key={prog.id} style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '32px',
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{prog.icon}</div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: '#2b3d6d',
                  color: '#fff',
                  marginBottom: '12px',
                }}>
                  {prog.tag[isEn ? 'en' : 'zh']}
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                  {prog.title[isEn ? 'en' : 'zh']}
                </h3>
                <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, marginBottom: '20px' }}>
                  {prog.body[isEn ? 'en' : 'zh']}
                </p>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  {prog.points[isEn ? 'en' : 'zh'].map((pt) => (
                    <li key={pt} style={{ fontSize: '14px', color: '#444', marginBottom: '6px', lineHeight: 1.5 }}>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: AP COURSES ────────────────────────────────── */}
      <div style={{ background: '#2b3d6d', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <h2 style={{ fontSize: '60px', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: '12px' }}>
            {isEn ? 'AP COURSES' : 'AP 进阶课程'}
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '580px', lineHeight: 1.7, marginBottom: '48px' }}>
            {isEn
              ? 'AP (Advanced Placement) courses are college-level classes offered in high school. Strong AP performance — especially exam scores of 4 or 5 — is one of the most effective signals of academic readiness for competitive US universities.'
              : 'AP（Advanced Placement）是高中阶段提供的大学程度课程。优异的 AP 成绩（尤其是 4 或 5 分）是向美国顶尖大学展示学术能力最有效的指标之一。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {AP_COURSES.map((ap) => (
              <div key={ap.code} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '28px 24px',
                borderTop: '4px solid rgba(213,168,54,1)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{ap.icon}</div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{ap.code}</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                  {ap.desc[isEn ? 'en' : 'zh']}
                </p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '32px' }}>
            {isEn
              ? 'AP exams are administered by the College Board each May. GIIS prepares students throughout the year with coursework aligned to the official AP curriculum framework.'
              : 'AP 考试由 College Board 每年五月举办。GIIS 全年以对应官方 AP 课纲的课程为学生备考。'}
          </p>
        </div>
      </div>
    </>
  );
}
