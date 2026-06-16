import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

const ADVISOR_EMAIL = 'admissions@genesisideas.school';

const JOURNEY = [
  {
    step: '01',
    en: { title: 'Enrollment Setup', body: 'After the application/path review is approved, GIIS confirms the first active courses, login access, records needed, and the recommended support level before payment is finalized.' },
    zh: { title: '入学设定', body: '申请或路径审核通过后，GIIS 会确认首批课程、登入权限、所需记录，以及付款前建议的支持层级。' },
  },
  {
    step: '02',
    en: { title: 'Right-Sized Course Plan', body: 'Self-Paced students can follow the reviewed course sequence. Guided and Premium families add advisor planning, transfer-credit review, and parent progress interpretation.' },
    zh: { title: '合适的课程规划', body: '自主学习学生可依审核后的课程顺序学习；Guided 与 Premium 家庭会加入顾问规划、转学分审核与家长进度解读。' },
  },
  {
    step: '03',
    en: { title: 'Learn Portal Access', body: 'Your child logs in to the GIIS Learn Portal — video lessons, quizzes, assignments, and exams all in one place. Progress is visible to parents at any time.' },
    zh: { title: '学习平台开通', body: '孩子登入 GIIS 学习平台，影片课程、测验、作业与考试一站齐备。家长随时可查看学习进度。' },
  },
  {
    step: '04',
    en: { title: 'Ongoing Review When Needed', body: 'Guided adds monthly advisor check-ins. Premium adds higher-touch pathway, writing, project portfolio, and college-readiness planning when the family needs more support.' },
    zh: { title: '按需要持续跟进', body: 'Guided 加入每月顾问 check-in；Premium 在家庭需要更高支持时，加入更密集的路径、写作、项目作品集与升学准备规划。' },
  },
];

const SERVICES = [
  {
    en: { title: 'Core Learn Portal', tier: 'All reviewed enrollments', label: 'Included foundation', items: ['Course access after account activation', 'Module lessons, quizzes, assignments, midterm, and final', 'Written feedback on submitted assignments', 'Parent dashboard visibility for progress and graded work'] },
    zh: { title: '核心学习平台', tier: '所有已审核入学家庭', label: '基础包含', items: ['账号启用后的课程访问', '模块课程、测验、作业、期中与期末', '已提交作业的书面反馈', '家长面板可查看进度与已批改作业'] },
  },
  {
    en: { title: 'Guided Advisor Support', tier: 'Guided · $149/month', label: 'Added for accountability', items: ['Monthly advisor check-in', 'Course planning and transfer-credit review', 'Advisor-approved parent progress review', 'Next-step notes focused on pacing and missing-work risk'] },
    zh: { title: 'Guided 顾问支持', tier: 'Guided · $149/月', label: '为持续跟进而增加', items: ['每月顾问 check-in', '课程规划与转学分审核', '顾问审核后的家长进度解读', '聚焦节奏与缺交风险的下一步建议'] },
  },
  {
    en: { title: 'Premium College Pathway', tier: 'Premium · $299/month', label: 'Higher-touch planning', items: ['Everything in Guided', 'More frequent parent-facing planning support', 'Writing and project portfolio guidance', 'College-readiness framing without admissions guarantees'] },
    zh: { title: 'Premium 升学路径', tier: 'Premium · $299/月', label: '更高触达规划', items: ['包含 Guided 全部内容', '更密集的家长端规划支持', '写作与项目作品集指导', '升学准备定位，但不承诺录取结果'] },
  },
  {
    en: { title: 'Student Care Routing', tier: 'Support boundary', label: 'How concerns are handled', items: ['Study-habit and time-management concerns can be surfaced to staff', 'Parents see reviewed, practical next actions', 'Private staff notes stay separate from family summaries', 'Clinical or emergency support is referred to appropriate outside resources'] },
    zh: { title: '学生关怀转介', tier: '支持边界', label: '如何处理关切', items: ['学习习惯与时间管理问题可提交给 staff 关注', '家长看到审核后的务实下一步', '内部 staff 笔记与家庭摘要分开', '临床或紧急支持会转介适当外部资源'] },
  },
];

export default function SupportMain({ language, toggleLanguage }) {
  const isEn = language !== 'zh';
  const T = (en, zh) => isEn ? en : zh;

  return (
    <>
      <Helmet>
        <title>{T('Student Support & Resources', '学生支持与资源')} | Genesis of Ideas International School</title>
        <meta name="description" content={T(
          'What happens after you enroll at GIIS — advisor support, course planning, assignment feedback, and college application guidance.',
          '入学 GIIS 之后你将得到什么：顾问支持、选课规划、作业反馈与大学申请指导。'
        )} />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '72px 0 80px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 14px' }}>
            {T('Student Support & Resources', '学生支持与资源')}
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 18px', letterSpacing: '-0.01em' }}>
            {T('What happens after you enroll', '入学之后，我们怎么支持你')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 580 }}>
            {T(
              'Every reviewed enrollment gets course access, records, and assignment feedback. Advisor planning is added through Guided and Premium when the family needs more human accountability.',
              '每个已审核入学家庭都会获得课程访问、记录与作业反馈；当家庭需要更多人工跟进时，Guided 与 Premium 会加入顾问规划。'
            )}
          </p>
          <a href={`mailto:${ADVISOR_EMAIL}?subject=${encodeURIComponent(T('Questions about student support', '关于学生支持的问题'))}`}
            style={{ display: 'inline-block', background: 'rgba(213,168,54,1)', color: '#1a1a2e', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            {T('Ask your advisor a question →', '向顾问提问 →')}
          </a>
        </div>
      </div>

      {/* Journey */}
      <div style={{ background: '#fff', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {T('Your support journey', '你的支持历程')}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 48px', letterSpacing: '-0.01em' }}>
            {T('From enrollment to graduation', '从入学到毕业')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {JOURNEY.map((j) => {
              const t = isEn ? j.en : j.zh;
              return (
                <div key={j.step} style={{ position: 'relative' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(213,168,54,1)', letterSpacing: '2px', marginBottom: 10 }}>
                    STEP {j.step}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>{t.title}</h3>
                  <p style={{ fontSize: 13, color: '#5c6578', lineHeight: 1.65, margin: 0 }}>{t.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Services — what you actually get */}
      <div style={{ background: '#f4f6fa', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {T('Support by plan', '各方案支持范围')}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 40px', letterSpacing: '-0.01em' }}>
            {T('What families can expect', '家庭可以期待什么')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 20 }}>
            {SERVICES.map((s) => {
              const t = isEn ? s.en : s.zh;
              return (
                <div key={t.title} style={{ background: '#fff', borderRadius: 14, padding: '28px 28px', border: '1px solid #e8ecf5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#8a6a14', letterSpacing: '1.2px', textTransform: 'uppercase', margin: '0 0 8px' }}>{t.tier}</p>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', margin: '0 0 16px' }}>{t.title}</h3>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9aa0ad', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>{t.label}</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {t.items.map((item) => (
                      <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid #f0f2f8', fontSize: 13, color: '#3a4250', lineHeight: 1.5 }}>
                        <span style={{ color: '#1B6B3A', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Learn Portal CTA */}
      <div style={{ background: '#2b3d6d', padding: '60px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ color: 'rgba(213,168,54,1)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {T('Learning Platform', '学习平台')}
            </p>
            <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
              {T('GIIS Learn Portal', 'GIIS 学习平台')}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              {T(
                'All courses, assignments, quizzes, and exams live in one place. Parents can view progress at any time — no login required for the dashboard demo.',
                '所有课程、作业、测验与考试集中于一处。家长随时可查看进度，仪表板演示无需登入。'
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: '1 1 260px', minWidth: 0 }}>
            <Link to="/parent/demo" style={{ flex: '1 1 150px', textAlign: 'center', background: 'rgba(213,168,54,1)', color: '#1a1a2e', padding: '12px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {T('Preview parent view →', '预览家长视角 →')}
            </Link>
            <Link to="/login" style={{ flex: '1 1 150px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', padding: '12px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {T('Student login →', '学生登入 →')}
            </Link>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: '#fff', padding: '72px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 32 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                {T('Talk to an advisor', '与顾问交流')}
              </p>
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                {T('Questions before you enroll?', '入学前有疑问？')}
              </h2>
              <p style={{ fontSize: 14, color: '#5c6578', lineHeight: 1.7, margin: '0 0 28px' }}>
                {T(
                  'Email us and we\'ll respond within 24 hours. If you\'re already enrolled and need support, the same address reaches your advisor.',
                  '发邮件给我们，24 小时内回复。若已入学需要支持，同一邮箱即可联系到你的顾问。'
                )}
              </p>
              <a href={`mailto:${ADVISOR_EMAIL}`}
                style={{ display: 'inline-block', background: '#2b3d6d', color: '#fff', padding: '13px 26px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 12 }}>
                {T(`Email ${ADVISOR_EMAIL}`, `发邮件至 ${ADVISOR_EMAIL}`)}
              </a>
              <p style={{ fontSize: 12, color: '#9aa0ad', margin: '8px 0 0' }}>
                {T('Replies within 24 hours · Mon–Fri', '24 小时内回复 · 周一至周五')}
              </p>
            </div>
            <div style={{ background: '#f4f6fa', borderRadius: 14, padding: '28px 28px', border: '1px solid #e8ecf5' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {T('Useful links', '实用链接')}
              </p>
              {[
                { en: 'Course Catalog — browse all 40+ courses', zh: '课程目录 — 浏览全部 40+ 门课程', to: '/academics' },
                { en: 'Apply Now — start enrollment', zh: '立即申请 — 开始入学流程', to: '/apply' },
                { en: 'Pricing — Self-Paced, Guided, and Premium plans', zh: '价格 — 自主学习、顾问指导与 Premium 方案', to: '/pricing' },
                { en: 'School Profile — Florida registration & credentials', zh: '学校简介 — 佛罗里达州注册资质', to: '/school-profile' },
                { en: 'Student Handbook — policies & procedures', zh: '学生手册 — 校规与流程', to: '/handbook' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{ display: 'block', fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '9px 0', borderBottom: '1px solid #e8ecf5' }}>
                  {isEn ? link.en : link.zh} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
