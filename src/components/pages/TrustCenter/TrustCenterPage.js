import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import EnrollmentRoadmap from '../../main/EnrollmentRoadmap.js';
import StudentExperiencePreview from '../../main/StudentExperiencePreview.js';
import dashboardScreen from '../../../img/Hero/dashboard-screen.jpg';
import moduleScreen from '../../../img/Hero/module-screen.jpg';
import transcriptScreen from '../../../img/Hero/transcript-screen.jpg';
import diplomaScreen from '../../../img/Hero/diploma-screen.jpg';

const TRUST_STEPS = [
  {
    k: '01',
    title: { en: 'Verify the school identity', zh: '先验证学校身份' },
    body: {
      en: 'Read the school profile, Florida private-school registration language, leadership information, and 24-credit graduation framework before you apply.',
      zh: '申请前先查看学校简介、Florida 私立学校注册说明、负责人信息与 24 学分毕业框架。',
    },
    to: '/school-profile',
    cta: { en: 'Open school profile', zh: '查看学校简介' },
  },
  {
    k: '02',
    title: { en: 'Inspect the learning evidence', zh: '检查真实学习证据' },
    body: {
      en: 'Browse courses with module outlines, free required resources, assignments, quizzes, midterms, finals, and lesson previews before paying.',
      zh: '付款前即可浏览课程模块、免费必要资源、作业、测验、期中、期末与课程预览。',
    },
    to: '/assessment-proof',
    cta: { en: 'See assessment proof', zh: '查看评量证据' },
  },
  {
    k: '03',
    title: { en: 'Preview parent visibility', zh: '预览家长可见度' },
    body: {
      en: 'See the dashboard parents use to review credits, GPA, course progress, recent activity, assignment feedback, advisor-approved weekly summaries, missing-work flags, and next actions.',
      zh: '预览家长如何查看学分、GPA、课程进度、近期活动、作业反馈、顾问审核的每周摘要、缺交提醒与下一步。',
    },
    to: '/parent/demo',
    cta: { en: 'Open parent preview', zh: '打开家长预览' },
  },
  {
    k: '04',
    title: { en: 'Understand tuition before checkout', zh: '付款前看清楚学费' },
    body: {
      en: 'Compare self-paced, guided, and college-pathway support, then read the written 30-day refund policy before payment.',
      zh: '比较自主学习、顾问指导与升学路径支持，并在付款前阅读书面 30 天退款政策。',
    },
    to: '/refund-policy',
    cta: { en: 'Read refund policy', zh: '阅读退款政策' },
  },
];

const HONEST_CLAIMS = [
  {
    good: { en: 'Florida-registered private school', zh: 'Florida 注册私立学校' },
    note: { en: 'GIIS describes its status conservatively and does not claim completed regional accreditation.', zh: 'GIIS 保守描述学校状态，不声称已完成区域认证。' },
  },
  {
    good: { en: '24-credit graduation framework', zh: '24 学分毕业框架' },
    note: { en: 'Course records, exams, and official documents are organized around the published high-school framework.', zh: '课程记录、考试与正式文件围绕公开的高中毕业框架整理。' },
  },
  {
    good: { en: 'CEEB status: applied and pending', zh: 'CEEB 状态：已申请，待审核' },
    note: { en: 'The site should never present a pending code as issued.', zh: '网站不会把待审核代码写成已发放代码。' },
  },
  {
    good: { en: 'College readiness without guarantees', zh: '升学准备，不承诺录取' },
    note: { en: 'Pathway planning supports applications but does not promise admissions outcomes.', zh: '学习路径规划支持申请准备，但不承诺录取结果。' },
  },
];

const EVIDENCE = [
  {
    image: moduleScreen,
    title: { en: 'Actual course modules', zh: '真实课程模块' },
    body: {
      en: 'Courses expose objectives, required resources, assignments, quizzes, and exams so parents can inspect what learning requires.',
      zh: '课程展示学习目标、必要资源、作业、测验与考试，让家长能检查学习内容。',
    },
  },
  {
    image: dashboardScreen,
    title: { en: 'Parent progress dashboard', zh: '家长进度面板' },
    body: {
      en: 'Progress is visible through credits, GPA, active courses, pacing indicators, recent activity, advisor notes, and assignment feedback.',
      zh: '家长可看到学分、GPA、进行中课程、进度提醒、近期活动、顾问留言与作业反馈。',
    },
  },
  {
    image: transcriptScreen,
    title: { en: 'Official transcript workflow', zh: '正式成绩单流程' },
    body: {
      en: 'Official records use the locked school format and verification workflow instead of informal screenshots or ad hoc documents.',
      zh: '正式记录使用学校锁定格式与验证流程，而不是临时截图或随意文件。',
    },
  },
  {
    image: diplomaScreen,
    title: { en: 'Diploma verification path', zh: '毕业证验证路径' },
    body: {
      en: 'Diplomas and transcripts are designed for third-party verification through the public verification route.',
      zh: '毕业证与成绩单设计为可通过公开验证入口进行第三方核验。',
    },
  },
];

const TRANSFER_PROOF = [
  { en: 'Previous credits are reviewed against the 24-credit framework.', zh: '既有学分会依 24 学分毕业框架审核。' },
  { en: 'Graduation timing is estimated from evidence, not promised automatically.', zh: '毕业时间依据可验证证据估算，不自动承诺。' },
  { en: 'Guided support is recommended when families need monthly accountability.', zh: '当家庭需要每月跟进时，通常建议 Guided 支持。' },
];

const CARE_VISIBILITY = [
  {
    title: { en: 'Weekly parent summary', zh: '每周家长摘要' },
    body: {
      en: 'Parents can see a plain-language summary of recent progress, pacing, and learning evidence instead of guessing from raw activity logs.',
      zh: '家长会看到用清楚语言整理的近期进度、节奏与学习证据，不需要从原始活动记录里猜。',
    },
  },
  {
    title: { en: 'Advisor-reviewed note', zh: '顾问审核留言' },
    body: {
      en: 'Public family notes are reviewed before they appear, so the message stays practical, school-like, and focused on the student\'s next step.',
      zh: '家庭可见留言会先经过审核，确保内容务实、像学校通知，并聚焦学生下一步。',
    },
  },
  {
    title: { en: 'Missing-work risk flag', zh: '缺交风险提醒' },
    body: {
      en: 'When a course needs attention, the dashboard can show the risk and the next action without exposing private staff deliberation.',
      zh: '当某门课需要关注时，家长面板可以显示风险与下一步，但不会暴露内部教务讨论。',
    },
  },
  {
    title: { en: 'Private notes stay private', zh: '内部笔记不对外显示' },
    body: {
      en: 'Internal advisor notes, operational risk details, and staff-only coordination remain separate from parent-safe summaries.',
      zh: '内部顾问笔记、运营风险细节与 staff-only 协调内容会与家长安全摘要分开。',
    },
  },
];

function pick(map, isEn) {
  return map[isEn ? 'en' : 'zh'];
}

function TrustCenterPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Trust Center' : '信任中心'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Verify GIIS before you pay: school profile, course evidence, parent dashboard preview, transcript workflow, and conservative claims.'
            : '付款前验证 GIIS：学校简介、课程证据、家长面板预览、成绩单流程与保守学校声明。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      <section style={{ background: '#10182a', color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
        <div className="giis-trust-hero" style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '70px 6% 58px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 0.92fr) minmax(360px, 1.08fr)',
          gap: 34,
          alignItems: 'center',
        }}>
          <div>
            <p style={{ color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
              {isEn ? 'Before You Pay' : '付款前先验证'}
            </p>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.05, fontWeight: 850, margin: '0 0 18px', letterSpacing: 0 }}>
              {isEn ? 'A serious school should be inspectable.' : '一所认真的学校，应该经得起家长检查。'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 1.75, margin: '0 0 24px', maxWidth: 620 }}>
              {isEn
                ? 'This page gathers the proof a parent needs before applying: what GIIS is, what it does not claim, what students actually study, and what parents can see after enrollment.'
                : '这一页集中整理家长付款前需要看到的证据：GIIS 是什么、不会夸大什么、学生实际学什么，以及入学后家长能看到什么。'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/parent/demo" style={primaryLink}>
                {isEn ? 'Preview parent dashboard' : '预览家长面板'}
              </Link>
              <Link to="/school-profile" style={secondaryDarkLink}>
                {isEn ? 'Read school profile' : '查看学校简介'}
              </Link>
              <Link to="/consultation" style={secondaryDarkLink}>
                {isEn ? 'Talk to the principal first' : '先和校长聊聊'}
              </Link>
            </div>
          </div>

          <div style={{
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#0b1020',
            boxShadow: '0 28px 70px rgba(0,0,0,0.35)',
          }}>
            <img src={dashboardScreen} alt={isEn ? 'GIIS parent dashboard preview' : 'GIIS 家长面板预览'} style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '58px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ maxWidth: 760, marginBottom: 24 }}>
            <p style={eyebrow}>{isEn ? 'Four Parent Checks' : '家长四项验证'}</p>
            <h2 style={sectionTitle}>{isEn ? 'The shortest path from doubt to evidence.' : '从怀疑到证据，先走这四步。'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {TRUST_STEPS.map((step) => (
              <div key={step.k} style={proofCard}>
                <p style={{ margin: '0 0 10px', color: '#b8962e', fontWeight: 850, fontSize: 12 }}>{step.k}</p>
                <h3 style={{ margin: '0 0 9px', color: '#1a1a2e', fontSize: 19, lineHeight: 1.25, fontWeight: 850 }}>
                  {pick(step.title, isEn)}
                </h3>
                <p style={{ margin: '0 0 16px', color: '#4f5868', fontSize: 13, lineHeight: 1.7 }}>
                  {pick(step.body, isEn)}
                </p>
                <Link to={step.to} style={inlineLink}>{pick(step.cta, isEn)} →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EnrollmentRoadmap language={language} variant="compact" />

      <StudentExperiencePreview language={language} variant="compact" />

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '0 0 58px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 6%' }}>
          <div style={{
            border: '1px solid #e2e7f0',
            borderLeft: '5px solid #d5a836',
            borderRadius: 8,
            padding: '24px 26px',
            background: '#fffbef',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            alignItems: 'center',
          }}>
            <div>
              <p style={{ margin: '0 0 9px', color: '#8a6a14', fontSize: 12, fontWeight: 850, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {isEn ? 'Transfer Family Proof' : '转学生家庭验证'}
              </p>
              <h2 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: 'clamp(22px, 3vw, 34px)', lineHeight: 1.14, fontWeight: 850 }}>
                {isEn ? 'Do the path review before checkout.' : '先做路径评估，再进入付款。'}
              </h2>
              <p style={{ margin: 0, color: '#4f5868', fontSize: 14, lineHeight: 1.7 }}>
                {isEn
                  ? 'Transfer families should understand credit fit, graduation timing, and support level before choosing a tuition plan.'
                  : '转学生家庭应在选择学费方案前，先看清楚学分对应、毕业时间与所需支持层级。'}
              </p>
            </div>
            <div>
              <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {TRANSFER_PROOF.map((item) => (
                  <li key={item.en} style={{ display: 'flex', gap: 9, color: '#30384a', fontSize: 13, lineHeight: 1.55 }}>
                    <span style={{ color: '#2b3d6d', fontWeight: 900 }}>✓</span>
                    <span>{isEn ? item.en : item.zh}</span>
                  </li>
                ))}
              </ul>
              <Link to="/apply" style={{ display: 'inline-block', background: '#2b3d6d', color: '#fff', borderRadius: 8, padding: '11px 18px', fontSize: 13, fontWeight: 850, textDecoration: 'none' }}>
                {isEn ? 'Request transfer path review' : '申请转学路径评估'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#f4f6fa', fontFamily: 'Inter, sans-serif', padding: '62px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ maxWidth: 780, marginBottom: 24 }}>
            <p style={eyebrow}>{isEn ? 'Truthful Claims Only' : '只使用真实保守声明'}</p>
            <h2 style={sectionTitle}>{isEn ? 'What GIIS can say, and what it should not overstate.' : 'GIIS 可以说什么，也知道什么不能夸大。'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
            {HONEST_CLAIMS.map((claim) => (
              <div key={claim.good.en} style={{ ...proofCard, background: '#fff' }}>
                <p style={{ margin: '0 0 8px', color: '#1B6B3A', fontSize: 13, fontWeight: 850 }}>
                  {pick(claim.good, isEn)}
                </p>
                <p style={{ margin: 0, color: '#4f5868', fontSize: 13, lineHeight: 1.7 }}>
                  {pick(claim.note, isEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '62px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ maxWidth: 800, marginBottom: 24 }}>
            <p style={eyebrow}>{isEn ? 'After Enrollment Visibility' : '入学后的家长可见度'}</p>
            <h2 style={sectionTitle}>{isEn ? 'Parents should know what is happening, without seeing private staff notes.' : '家长应该知道孩子发生了什么，但不需要看到内部教务笔记。'}</h2>
            <p style={{ margin: '14px 0 0', color: '#4f5868', fontSize: 14, lineHeight: 1.75 }}>
              {isEn
                ? 'GIIS separates parent-safe reassurance from internal coordination. Families see progress, advisor-approved notes, missing-work risk flags, and one next action; private advisor notes remain staff-only.'
                : 'GIIS 会把家长安全摘要与内部协调分开。家庭看到进度、顾问审核留言、缺交风险提醒与一个下一步；内部顾问笔记仍只供 staff 使用。'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {CARE_VISIBILITY.map((item) => (
              <div key={item.title.en} style={{ ...proofCard, background: '#f8f9fc' }}>
                <h3 style={{ margin: '0 0 9px', color: '#1a1a2e', fontSize: 18, lineHeight: 1.25, fontWeight: 850 }}>
                  {pick(item.title, isEn)}
                </h3>
                <p style={{ margin: 0, color: '#4f5868', fontSize: 13, lineHeight: 1.7 }}>
                  {pick(item.body, isEn)}
                </p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link to="/parent/demo" style={{ display: 'inline-block', background: '#2b3d6d', color: '#fff', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 850, textDecoration: 'none' }}>
              {isEn ? 'Preview the parent reassurance layer' : '预览家长安心层'}
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '64px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ maxWidth: 780, marginBottom: 26 }}>
            <p style={eyebrow}>{isEn ? 'Visible Product Evidence' : '看得见的产品证据'}</p>
            <h2 style={sectionTitle}>{isEn ? 'Parents are buying an operating school, not a promise.' : '家长买的是正在运作的学校，不是一句承诺。'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: 16 }}>
            {EVIDENCE.map((item) => (
              <div key={item.title.en} style={{ border: '1px solid #e2e7f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                <img src={item.image} alt={pick(item.title, isEn)} style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block', borderBottom: '1px solid #e2e7f0' }} />
                <div style={{ padding: '17px 18px 19px' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 18, fontWeight: 850 }}>
                    {pick(item.title, isEn)}
                  </h3>
                  <p style={{ margin: 0, color: '#4f5868', fontSize: 13, lineHeight: 1.7 }}>
                    {pick(item.body, isEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#172033', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '62px 0' }}>
        <div style={{ maxWidth: 940, margin: '0 auto', padding: '0 6%', textAlign: 'center' }}>
          <p style={{ color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
            {isEn ? 'Decision Point' : '决定前的最后一步'}
          </p>
          <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.12, fontWeight: 850, margin: '0 0 16px' }}>
            {isEn ? 'Apply only after the evidence makes sense.' : '证据看懂了，再申请。'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.75, margin: '0 auto 26px', maxWidth: 700 }}>
            {isEn
              ? 'Admissions reviews the student path first. Payment should come after the family understands the school record, support level, and realistic graduation plan.'
              : '招生团队会先审核学生路径。家长应在看懂学校记录、支持层级与实际毕业计划后，再进入付款。'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/apply" style={primaryGoldLink}>{isEn ? 'Start application' : '开始申请'}</Link>
            <Link to="/pricing" style={secondaryDarkLink}>{isEn ? 'Review tuition' : '查看学费'}</Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .giis-trust-hero {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

const eyebrow = {
  color: '#b8962e',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 1.7,
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const sectionTitle = {
  color: '#1a1a2e',
  fontSize: 'clamp(26px, 3.4vw, 42px)',
  lineHeight: 1.12,
  fontWeight: 850,
  margin: 0,
  letterSpacing: 0,
};

const proofCard = {
  border: '1px solid #e2e7f0',
  borderRadius: 8,
  padding: '20px 18px 18px',
  background: '#f8f9fc',
};

const inlineLink = {
  color: '#2b3d6d',
  fontSize: 13,
  fontWeight: 850,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};

const primaryLink = {
  display: 'inline-block',
  padding: '12px 22px',
  borderRadius: 8,
  background: '#fff',
  color: '#172033',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};

const primaryGoldLink = {
  display: 'inline-block',
  padding: '13px 26px',
  borderRadius: 8,
  background: '#d5a836',
  color: '#172033',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};

const secondaryDarkLink = {
  display: 'inline-block',
  padding: '11px 22px',
  borderRadius: 8,
  border: '1.5px solid rgba(255,255,255,0.35)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 800,
};

export default TrustCenterPage;
