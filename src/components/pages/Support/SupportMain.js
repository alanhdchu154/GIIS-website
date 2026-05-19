import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

const ADVISOR_EMAIL = 'admissions@genesisideas.school';

const JOURNEY = [
  {
    step: '01',
    en: { title: 'Onboarding Call', body: 'Within 48 hours of enrollment, your advisor schedules a 20-minute call to understand your child\'s goals, review any transfer credits, and map out a 4-year course plan.' },
    zh: { title: '入学通话', body: '入学后 48 小时内，顾问会安排一次 20 分钟通话，了解孩子的学习目标、审核转学分，并规划四年选课路径。' },
  },
  {
    step: '02',
    en: { title: 'Personalized Course Plan', body: 'You receive a written course plan aligned to one of GIIS\'s 8 academic pathways — with AP and elective recommendations matched to target universities.' },
    zh: { title: '个性化课程规划', body: '顾问提供书面选课计划，对应 GIIS 八大学习路径，AP 课程与选修建议均依据目标大学量身制定。' },
  },
  {
    step: '03',
    en: { title: 'Learn Portal Access', body: 'Your child logs in to the GIIS Learn Portal — video lessons, quizzes, assignments, and exams all in one place. Progress is visible to parents at any time.' },
    zh: { title: '学习平台开通', body: '孩子登入 GIIS 学习平台，影片课程、测验、作业与考试一站齐备。家长随时可查看学习进度。' },
  },
  {
    step: '04',
    en: { title: 'Ongoing Check-ins', body: 'Monthly advisor check-ins track credit progress, address challenges early, and update the course plan as college application priorities shift.' },
    zh: { title: '持续进度追踪', body: '每月顾问确认学分进度，提早处理学习挑战，并随大学申请方向调整选课计划。' },
  },
];

const SERVICES = [
  {
    en: { title: 'Academic Advising', label: 'What you get', items: ['4-year written course plan', 'AP + elective recommendations', 'Monthly progress check-in', 'Pathway alignment with target universities'] },
    zh: { title: '学业辅导', label: '你将获得', items: ['书面四年选课计划', 'AP 与选修课程建议', '每月学习进度确认', '学习路径与目标大学对齐'] },
  },
  {
    en: { title: 'College Application Support', label: 'What you get', items: ['Course selection strategy for college apps', 'Timeline and deadline planning', 'Application essay review (senior year)', 'School profile + transcript preparation'] },
    zh: { title: '大学申请支持', label: '你将获得', items: ['以大学申请为导向的选课策略', '申请时程与截止日期规划', '申请文书审阅（高四学年）', '学校简介与成绩单准备协助'] },
  },
  {
    en: { title: 'Assignment Feedback', label: 'What you get', items: ['Written feedback on every submitted assignment', 'Scores visible in Learn Portal within 5 business days', 'Revision guidance when needed', 'Parent notified on graded assignments'] },
    zh: { title: '作业批改与反馈', label: '你将获得', items: ['每份作业均附书面批改意见', '5 个工作日内成绩显示于学习平台', '需要时提供修改指引', '批改完成后通知家长'] },
  },
  {
    en: { title: 'Wellbeing Counseling', label: 'What you get', items: ['Emotional support for online learners', 'Study habit and time management coaching', 'Referral to professional resources when needed', 'Confidential — separate from academic record'] },
    zh: { title: '身心健康辅导', label: '你将获得', items: ['针对线上学习者的情绪支持', '学习习惯与时间管理指导', '需要时转介专业资源', '保密处理，不纳入学术记录'] },
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
              'Every GIIS student gets a named advisor, a written course plan, and real feedback on every assignment. Here\'s exactly what that looks like.',
              '每位 GIIS 学生都有专属顾问、书面选课计划，以及每份作业的真实批改意见。以下是具体内容。'
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
            {T('Included with every plan', '每个方案均已包含')}
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 40px', letterSpacing: '-0.01em' }}>
            {T('What you actually get', '你实际会拿到的')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
            {SERVICES.map((s) => {
              const t = isEn ? s.en : s.zh;
              return (
                <div key={t.title} style={{ background: '#fff', borderRadius: 14, padding: '28px 28px', border: '1px solid #e8ecf5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <Link to="/parent/demo" style={{ background: 'rgba(213,168,54,1)', color: '#1a1a2e', padding: '12px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {T('Preview parent view →', '预览家长视角 →')}
            </Link>
            <Link to="/login" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', padding: '12px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {T('Student login →', '学生登入 →')}
            </Link>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: '#fff', padding: '72px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
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
                { en: 'Pricing — $19.90/month Founders plan', zh: '价格 — $19.90/月 创校方案', to: '/pricing' },
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
