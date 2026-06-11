import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

const NAVY = '#1a1a2e';
const GOLD = '#d5a836';

/**
 * Graduate trajectories use the real Class of 2026 course records
 * (server/prisma/seed.js). Names are shown as initial + surname for privacy.
 * University offers are only shown where families have reported them.
 * No AP-authorization or admissions-guarantee claims on this page.
 */
const GRADUATES = [
  {
    id: 'y-yang',
    name: 'Y. Yang',
    nameZh: '杨同学',
    initials: 'YY',
    color: '#1B6B3A',
    bg: '#f0f9f4',
    grad: 'Class of 2026',
    gpa: '3.85',
    pathway: { en: 'Kinesiology & Sports Science', zh: '运动科学路径' },
    offers: ['UC Santa Barbara', 'The Ohio State University', 'UC Davis'],
    timeline: [
      { stage: { en: 'Grade 9–10 · Foundation', zh: '9–10 年级 · 基础' }, body: { en: 'Core English, math, and lab sciences alongside early health and fitness electives — building the academic base every pathway shares.', zh: '完成核心英文、数学与实验科学，搭配健康与体适能选修，打好所有路径共享的学术基础。' } },
      { stage: { en: 'Grade 11 · Focus', zh: '11 年级 · 聚焦' }, body: { en: 'Sports Psychology and advanced biology coursework aligned the course record with her intended major.', zh: '运动心理学与进阶生物课程，让课程记录与申请专业方向对齐。' } },
      { stage: { en: 'Grade 12 · Application-ready', zh: '12 年级 · 申请就绪' }, body: { en: 'Sports Management & Leadership, Athletic Training, and Fitness Leadership completed a coherent, reviewable transcript for kinesiology programs.', zh: '运动管理与领导、运动训练、体适能领导课程，构成运动科学专业可审阅的完整成绩单。' } },
    ],
    quote: {
      en: 'The Sports Science pathway gave me a course record that directly matched what I wanted to study. My advisor helped me stay on track every semester.',
      zh: '运动科学路径让我的课程记录与申请方向高度契合，顾问每学期都帮我把握节奏。',
    },
  },
  {
    id: 'b-lu',
    name: 'B. Lu',
    nameZh: '卢同学',
    initials: 'BL',
    color: '#1565C0',
    bg: '#f0f4ff',
    grad: 'Class of 2026',
    gpa: '3.77',
    pathway: { en: 'Information Studies & Communications', zh: '信息学与传播路径' },
    offers: ['Syracuse University', 'New Jersey Institute of Technology'],
    timeline: [
      { stage: { en: 'Grade 9–10 · Foundation', zh: '9–10 年级 · 基础' }, body: { en: 'Core academics plus Digital Literacy, Media Studies, and Public Speaking — early signals of a communications direction.', zh: '核心学术课程之外，修读数字素养、媒体研究与公众演讲，提早确立传播方向。' } },
      { stage: { en: 'Grade 11 · Focus', zh: '11 年级 · 聚焦' }, body: { en: 'Media & Society, Academic Writing, and Research Methods in Social Science deepened the analytical side of the record.', zh: '媒体与社会、学术写作、社会科学研究方法，强化课程记录的分析深度。' } },
      { stage: { en: 'Grade 12 · Application-ready', zh: '12 年级 · 申请就绪' }, body: { en: 'Communication Studies, Statistics for Social Sciences, and Digital Media & Society completed the information-studies profile.', zh: '传播研究、社会科学统计与数字媒体与社会，完成信息学方向的完整申请档案。' } },
    ],
    quote: {
      en: 'GIIS made the US application process straightforward. My communication and data coursework gave me a strong foundation for information studies.',
      zh: 'GIIS 让美国申请流程变得清晰可控。传播与数据课程为我进入信息学领域打下了扎实基础。',
    },
  },
  {
    id: 'r-li',
    name: 'R. Li',
    nameZh: '李同学',
    initials: 'RL',
    color: '#8a5a00',
    bg: '#fdf7ec',
    grad: 'Class of 2026',
    gpa: null,
    pathway: { en: 'Business & Economics', zh: '商业与经济路径' },
    offers: [],
    timeline: [
      { stage: { en: 'Grade 9–10 · Foundation', zh: '9–10 年级 · 基础' }, body: { en: 'Core academics plus Introduction to Business & Economics, Entrepreneurship Fundamentals, and Marketing & Communication.', zh: '核心学术课程之外，修读商业与经济导论、创业基础、市场营销与传播。' } },
      { stage: { en: 'Grade 11 · Focus', zh: '11 年级 · 聚焦' }, body: { en: 'Economics, Business Research Methods, Digital Marketing, and Business Ethics & Critical Thinking built a focused business record.', zh: '经济学、商业研究方法、数字营销与商业伦理课程，构成聚焦的商科记录。' } },
      { stage: { en: 'Grade 12 · Application-ready', zh: '12 年级 · 申请就绪' }, body: { en: 'Economics Seminar, Business Strategy & Writing, Corporate Finance, and Business Law completed the pre-business transcript.', zh: '经济学研讨、商业策略与写作、公司金融与商业法，完成商科方向成绩单。' } },
    ],
    quote: null,
  },
  {
    id: 't-zhang',
    name: 'T. Zhang',
    nameZh: '张同学',
    initials: 'TZ',
    color: '#6b3fa0',
    bg: '#f7f2fc',
    grad: 'Class of 2026',
    gpa: null,
    pathway: { en: 'Psychology & Behavioral Science', zh: '心理学与行为科学路径' },
    offers: [],
    timeline: [
      { stage: { en: 'Grade 9–10 · Foundation', zh: '9–10 年级 · 基础' }, body: { en: 'Core academics plus Introduction to Psychology, Human Development, Psychology Foundations, and Social Psychology.', zh: '核心学术课程之外，修读心理学导论、人类发展、心理学基础与社会心理学。' } },
      { stage: { en: 'Grade 11 · Focus', zh: '11 年级 · 聚焦' }, body: { en: 'Advanced psychology and statistics coursework, including Cognitive Psychology and Experimental Psychology.', zh: '进阶心理学与统计课程，包括认知心理学与实验心理学。' } },
      { stage: { en: 'Grade 12 · Application-ready', zh: '12 年级 · 申请就绪' }, body: { en: 'Psychology Seminar / Capstone, Behavioral Science, Abnormal Psychology, and Counseling & Mental Health Studies completed the record.', zh: '心理学研讨/毕业专题、行为科学、变态心理学与心理咨询课程，完成完整课程记录。' } },
    ],
    quote: null,
  },
];

function pick(map, isEn) {
  return map[isEn ? 'en' : 'zh'];
}

function GraduateStoriesPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';
  const [open, setOpen] = useState(GRADUATES[0].id);

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Graduate Stories' : '毕业生足迹'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Real Class of 2026 course trajectories at GIIS: how four students built coherent transcripts from Grade 9 to graduation, with reported university offers.'
            : 'GIIS 2026 届真实课程轨迹：四位学生如何从 9 年级到毕业建立连贯的成绩单，以及家庭回报的大学录取结果。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero */}
      <section style={{ background: '#10182a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 6% 52px' }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
            {isEn ? 'Class of 2026 · Real Course Records' : '2026 届 · 真实课程记录'}
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.08, fontWeight: 850, margin: '0 0 16px', maxWidth: 780 }}>
            {isEn ? 'Four students. Four years. Four transcripts you can trace.' : '四位学生，四年，四份可以追溯的成绩单。'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 1.75, margin: 0, maxWidth: 660 }}>
            {isEn
              ? 'These trajectories come from real GIIS student records in our first graduating class. Names are shortened for privacy. University offers are shown only where families reported them — GIIS does not guarantee admission results.'
              : '以下轨迹来自 GIIS 首届毕业班的真实学生记录，姓名已做隐私处理。录取结果仅在家庭回报后展示——GIIS 不承诺录取结果。'}
          </p>
        </div>
      </section>

      {/* Graduate cards */}
      <section style={{ background: '#f7f8fb', fontFamily: 'Inter, sans-serif', padding: '52px 0 72px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 6%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {GRADUATES.map((g) => {
            const isOpen = open === g.id;
            return (
              <div key={g.id} style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e6e8ee',
                borderTop: `4px solid ${g.color}`, overflow: 'hidden',
              }}>
                {/* Header row */}
                <button
                  onClick={() => setOpen(isOpen ? null : g.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                    padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: g.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 850,
                  }}>
                    {g.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 850, fontSize: 18, color: NAVY }}>
                      {isEn ? g.name : g.nameZh}
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#888', marginLeft: 10 }}>{g.grad}</span>
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 700, color: g.color }}>
                      {pick(g.pathway, isEn)}
                    </p>
                  </div>
                  {g.gpa && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 850, color: g.color }}>{g.gpa}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#999', fontWeight: 700, letterSpacing: 0.5 }}>GPA</p>
                    </div>
                  )}
                  <span style={{ fontSize: 13, color: '#999', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 24px 26px' }}>
                    {/* Offers */}
                    {g.offers.length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {isEn ? 'Reported offers' : '家庭回报录取'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {g.offers.map((o) => (
                            <span key={o} style={{
                              fontSize: 13, fontWeight: 750, color: g.color,
                              background: g.bg, border: `1.5px solid ${g.color}40`,
                              padding: '5px 12px', borderRadius: 6,
                            }}>
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: g.quote ? 18 : 0 }}>
                      {g.timeline.map((t, i) => (
                        <div key={i} style={{ background: '#f7f8fb', borderRadius: 10, padding: '16px 16px', border: '1px solid #eceef3' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 850, color: g.color }}>
                            {pick(t.stage, isEn)}
                          </p>
                          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: '#3a3f4c' }}>
                            {pick(t.body, isEn)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {g.quote && (
                      <p style={{
                        margin: 0, fontSize: 13.5, color: '#444', lineHeight: 1.75, fontStyle: 'italic',
                        borderLeft: `3px solid ${g.color}50`, paddingLeft: 14,
                      }}>
                        "{pick(g.quote, isEn)}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Honest framing + CTA */}
          <div style={{
            marginTop: 22, background: '#10182a', borderRadius: 14, padding: '34px 30px',
            color: '#fff', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 850, margin: '0 0 10px' }}>
              {isEn ? 'Every transcript here is inspectable.' : '这里的每一份成绩单，都经得起检查。'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 1.75, margin: '0 0 22px', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
              {isEn
                ? 'GIIS organizes every student around the same 24-credit graduation framework these graduates completed. Outcomes vary by student; we show evidence, not promises.'
                : 'GIIS 用同一套 24 学分毕业框架培养每一位学生——正是这些毕业生完成的框架。升学结果因学生而异；我们展示证据，不做承诺。'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/consultation" style={{ padding: '13px 26px', borderRadius: 8, background: GOLD, color: '#172033', fontWeight: 850, textDecoration: 'none', fontSize: 14 }}>
                {isEn ? 'Book a free consultation' : '预约免费咨询'}
              </Link>
              <Link to="/trust-center" style={{ padding: '12px 24px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}>
                {isEn ? 'Verify the school first' : '先验证这所学校'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default GraduateStoriesPage;
