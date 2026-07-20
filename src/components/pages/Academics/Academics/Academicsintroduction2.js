import React from 'react';

const PROGRAMS = [
  {
    id: 'diploma',
    icon: '🎓',
    title: { en: 'US Diploma Program', zh: '美国高中文凭课程' },
    tag: { en: '24 Credits · Florida Registered', zh: '24 学分 · Florida 注册私立学校' },
    body: {
      en: 'GIIS is a registered Florida private school issuing US high school diplomas under a 24-credit graduation framework designed for online learners, official records, and future application review.',
      zh: 'GIIS 是在 Florida 注册的私立学校，依据面向线上学习、正式记录与后续申请审核的 24 学分毕业框架颁发美国高中文凭。',
    },
    points: {
      en: ['English Language Arts — 4 credits', 'Mathematics — 4 credits', 'Science — 3 credits', 'Social Studies — 3 credits', 'Pathway & Electives — 10 credits', 'World language study may be recommended during individualized advising'],
      zh: ['英语语言艺术 — 4 学分', '数学 — 4 学分', '自然科学 — 3 学分', '社会科学 — 3 学分', '方向与选修 — 10 学分', '外语学习可在个别升学规划中进一步建议'],
    },
  },
  {
    id: 'electives',
    icon: '🗂️',
    title: { en: 'Elective Concentration Tracks', zh: '选修方向规划' },
    tag: { en: 'Tailored to College Major Goals', zh: '依申请方向量身规划' },
    body: {
      en: 'Beyond core requirements, GIIS offers 8 academic pathways across STEM, Business, and the Arts. Students build a cohesive course history with visible assignments, assessments, and portfolio evidence for family and advisor review.',
      zh: '在必修科目之外，GIIS 提供横跨 STEM、商业与艺术的 8 条学习路径。学生可建立一致且有深度的选课记录，并留下作业、评估与作品证据，供家庭与顾问一起查看。',
    },
    points: {
      en: ['Psychology & Behavioral Science — from intro courses to psychology exam prep and capstone', 'CS & Engineering — programming, data structures, Java exam prep, and ML', 'Business & Marketing — entrepreneurship, marketing, consumer behavior', 'Economics & Finance — micro/macro economics, financial markets, and advanced exam-prep options'],
      zh: ['心理学与行为科学 — 从入门课程到心理学考试准备与研究专题', '计算机科学与工程 — 编程、数据结构、Java 考试准备与机器学习', '商业与市场营销 — 创业、营销、消费者行为', '经济与金融 — 微观/宏观经济学、金融市场与进阶考试准备选项'],
    },
  },
];

export default function Academicsintroduction2({ language }) {
  const isEn = language !== 'zh';

  return (
    <>
      {/* ── Curriculum structure ────────────────────────────────── */}
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
              ? 'GIIS offers a US high school diploma program built on the Florida 24-credit framework, with 8 elective pathways designed around transcript-ready coursework and visible student evidence.'
              : 'GIIS 提供以 Florida 24 学分框架为基础的美国高中文凭课程，并提供 8 条围绕成绩单课程与学生学习证据设计的选修路径。'}
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
    </>
  );
}
