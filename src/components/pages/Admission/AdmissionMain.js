import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import DemoEmbed from '../../main/DemoEmbed.js';
import heroImg from '../../../img/Hero/transcript-screen.jpg';

const SCHOOL_PHONE = '+1 (813) 501-5756';
const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const STEPS = [
  {
    num: '01',
    title: { en: 'Identify Applicant Type', zh: '确认申请类型' },
    body: {
      en: 'Tell us whether the student is starting fresh with GIIS or transferring completed high-school credits from another school.',
      zh: '先确认学生是一般新生，还是已经在其他学校修过高中学分、需要转学审核。',
    },
  },
  {
    num: '02',
    title: { en: 'Provide the Right Records', zh: '提交对应资料' },
    body: {
      en: 'New students provide basic identity information and recent school records if available. Transfer students provide transcripts or school reports for completed high-school terms.',
      zh: '一般新生提交基本身份信息，以及可提供的近期学校记录；转学生提交已完成高中阶段课程的成绩单或学校报告。',
    },
  },
  {
    num: '03',
    title: { en: 'Interview & Assessment', zh: '面谈与学力评估' },
    body: {
      en: 'Complete a brief interview or placement discussion so we can design the right academic path for you.',
      zh: '进行简短的面谈或学力评估，让我们为你规划最合适的学习方向。',
    },
  },
  {
    num: '04',
    title: { en: 'Enrollment', zh: '完成入学' },
    body: {
      en: 'Choose the support level only after the student path is clear, then receive enrollment and onboarding instructions.',
      zh: '确认学生路径后再选择支持方案，并收到入学与 onboarding 指引。',
    },
  },
];

const REQUIREMENT_GROUPS = [
  {
    title: { en: 'New Students', zh: '一般新生' },
    note: {
      en: 'For students starting high school with GIIS or without prior high-school credits to transfer.',
      zh: '适合从 GIIS 开始高中，或没有需要转入高中学分的学生。',
    },
    items: [
      { icon: '✍️', label: { en: 'Completed application form', zh: '填妥的申请表' } },
      { icon: '🎂', label: { en: 'Proof of age / birth date', zh: '年龄或出生日期证明' } },
      { icon: '🏫', label: { en: 'Current or most recent school information if available', zh: '可提供的目前或最近就读学校信息' } },
      { icon: '📋', label: { en: 'Recent report card or placement record if available', zh: '可提供的近期成绩或分班记录' } },
    ],
  },
  {
    title: { en: 'Transfer Students', zh: '转学生' },
    note: {
      en: 'For students who already completed high-school courses elsewhere and want GIIS to review transferable credits.',
      zh: '适合已经在其他学校修过高中课程，希望 GIIS 审核可转入学分的学生。',
    },
    items: [
      { icon: '📄', label: { en: 'Official transcript or school report for completed high-school terms', zh: '已完成高中阶段课程的正式成绩单或学校报告' } },
      { icon: '📚', label: { en: 'Course descriptions or syllabi if credits need review', zh: '需要审核学分时提供课程说明或 syllabus' } },
      { icon: '🏫', label: { en: 'Previous school contact if verification is needed', zh: '必要时提供原学校联系方式供核验' } },
      { icon: '🌐', label: { en: 'Translation if records are not in English or Chinese', zh: '非英文或中文文件需提供翻译' } },
    ],
  },
];

export default function AdmissionMain({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Admission' : '入学申请'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'How to apply to Genesis of Ideas International School — process, requirements, and contact.'
            : '艾迪尔国际学校入学申请流程、所需文件与联络方式。'}
        />
      </Helmet>

      {/* Nav */}
      <div className="row">
        <Nav language={language} toggleLanguage={toggleLanguage} />
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img src={heroImg} alt="Admission" style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          padding: '48px 10%',
        }}>
          <h1 style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '56px', margin: 0, lineHeight: 1 }}>
            {isEn ? 'ADMISSION' : '入学申请'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif', fontSize: '18px', marginTop: '12px', maxWidth: '540px' }}>
            {isEn
              ? 'A clear application path for new students and transfer students.'
              : '让一般新生与转学生都看清楚自己的申请路径。'}
          </p>
        </div>
      </div>

      {/* Step-by-step process */}
      <div style={{ background: 'rgba(43,61,109,1)', padding: '80px 0', borderBottom: '8px solid rgba(213,168,54,1)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1, marginBottom: '48px' }}>
            {isEn ? 'HOW TO APPLY' : '申请流程'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderTop: '4px solid rgba(213,168,54,1)',
                borderRadius: '10px',
                padding: '28px 24px',
              }}>
                <div style={{ fontSize: '40px', fontWeight: 800, color: 'rgba(213,168,54,0.6)', lineHeight: 1, marginBottom: '16px' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                  {s.title[isEn ? 'en' : 'zh']}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  {s.body[isEn ? 'en' : 'zh']}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product walkthrough — show what your child will actually experience */}
      <DemoEmbed
        language={language}
        variant="compact"
        background="#fff"
        eyebrow={isEn ? 'Before You Apply' : '申请之前先看看'}
        headline={{
          en: 'See exactly what your child will experience',
          zh: '看清楚你的孩子每一步会经历什么',
        }}
        subline={{
          en: '80 seconds inside GIIS — from picking a pathway to walking away with a US diploma.',
          zh: '80 秒看遍 GIIS — 从选择学习路径到拿到美国高中文凭。',
        }}
        showCtas={false}
      />

      <div style={{ background: '#f4f6fa', padding: '44px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 10%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '560px' }}>
            <p style={{ color: '#2b3d6d', fontSize: '12px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {isEn ? 'Transfer Students' : '转学生'}
            </p>
            <h2 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: '28px', fontWeight: 800, lineHeight: 1.15 }}>
              {isEn ? 'Already completed high school credits elsewhere?' : '已经在其他学校修过高中学分？'}
            </h2>
            <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: 1.7 }}>
              {isEn
                ? 'GIIS can review official records, map transferable credits, and estimate the shortest realistic graduation path.'
                : 'GIIS 可以审核正式记录、对应可转学分，并估算最现实的毕业路径。'}
            </p>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '13px', lineHeight: 1.65 }}>
              {isEn
                ? 'Starting Grade 9 with no prior high-school credits? Continue with the new-student application path below; no transfer transcript is required.'
                : '如果是 9 年级一般新生、没有需要转入的高中学分，可以走下方一般新生申请路径，不需要转学成绩单。'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/apply" style={{
            padding: '13px 22px',
            borderRadius: '8px',
            background: '#2b3d6d',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}>
            {isEn ? 'Request Path Review →' : '申请路径评估 →'}
          </Link>
          <Link to="/transfer-students" style={{
            padding: '13px 22px',
            borderRadius: '8px',
            border: '2px solid #2b3d6d',
            color: '#2b3d6d',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}>
            {isEn ? 'Transfer Guide' : '查看转学说明'}
          </Link>
          <Link to="/consultation" style={{
            padding: '13px 22px',
            borderRadius: '8px',
            border: '2px solid #2b3d6d',
            color: '#2b3d6d',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}>
            {isEn ? 'Book a Free Consultation' : '预约免费咨询'}
          </Link>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div style={{ background: '#fff', padding: '80px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, marginBottom: '12px' }}>
            {isEn ? 'WHAT YOU' : '申请'}
          </h2>
          <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, marginBottom: '40px' }}>
            {isEn ? "NEED TO PREPARE" : '所需文件'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '48px' }}>
            {REQUIREMENT_GROUPS.map((group) => (
              <div key={group.title.en} style={{
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                background: '#fafafa',
                padding: '24px',
              }}>
                <p style={{ color: '#2b3d6d', fontSize: '12px', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  {group.title[isEn ? 'en' : 'zh']}
                </p>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.65, margin: '0 0 18px' }}>
                  {group.note[isEn ? 'en' : 'zh']}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {group.items.map((r) => (
                    <div key={r.label.en} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '22px', flexShrink: 0 }}>{r.icon}</span>
                      <span style={{ fontSize: '14px', color: '#333', fontWeight: 500, lineHeight: 1.5 }}>
                        {r.label[isEn ? 'en' : 'zh']}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: '#888', maxWidth: '600px', lineHeight: 1.7 }}>
            {isEn
              ? '* New students are not required to provide transfer transcripts unless they already completed high-school credits elsewhere. Admissions may request additional records when needed.'
              : '* 一般新生不需要提交转学成绩单，除非已经在其他学校修过高中学分。招生团队可能视情况要求补充资料。'}
          </p>
        </div>
      </div>

      {/* Credentials & Recognition */}
      <div style={{ background: '#f4f6fa', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, marginBottom: '12px' }}>
            {isEn ? 'DIPLOMA &' : '文凭认可'}
          </h2>
          <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, marginBottom: '16px', color: '#2b3d6d' }}>
            {isEn ? 'RECOGNITION' : ''}
          </h2>
          <p style={{ fontSize: '16px', color: '#555', maxWidth: '620px', lineHeight: 1.7, marginBottom: '44px' }}>
            {isEn
              ? 'GIIS issues school records under the Florida private school framework. Families should review the school profile, transcript workflow, and transfer-credit policy before enrollment.'
              : 'GIIS 依据 Florida 私立学校框架出具学校记录。家庭入学前应查看学校简介、成绩单流程与转学分政策。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              {
                icon: '🏛️',
                title: { en: 'Florida Registered', zh: 'Florida 注册学校' },
                body: { en: 'GIIS is a registered Florida private school operating under Florida Statute 1002.42 — the same statute governing all Florida private K-12 schools.', zh: 'GIIS 依据 Florida 法规 1002.42 运营，该法规适用于所有 Florida K-12 私立学校。' },
              },
              {
                icon: '📋',
                title: { en: '24-Credit Framework', zh: '24 学分毕业框架' },
                body: { en: 'Our graduation requirements follow the Florida 24-credit diploma standard — the same framework used by Florida public and private high schools for college admissions.', zh: '我们的毕业要求遵循 Florida 24 学分文凭标准，该标准被 Florida 公立与私立高中广泛用于大学申请。' },
              },
              {
                icon: '🎓',
                title: { en: 'Reported College Outcomes', zh: '家庭回报的升学成果' },
                body: { en: 'Graduating families have reported offers from UC Santa Barbara, The Ohio State University, UC Davis, Syracuse University, and New Jersey Institute of Technology. GIIS does not guarantee admission results.', zh: '毕业家庭曾向 GIIS 回报来自 UC Santa Barbara、The Ohio State University、UC Davis、Syracuse University 及 New Jersey Institute of Technology 的录取结果。GIIS 不承诺录取。' },
              },
            ].map((item) => (
              <div key={item.icon} style={{
                background: '#fff', border: '1px solid #e0e6f0',
                borderTop: '4px solid #2b3d6d',
                borderRadius: '12px', padding: '28px 24px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 10px' }}>
                  {isEn ? item.title.en : item.title.zh}
                </h3>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.65, margin: 0 }}>
                  {isEn ? item.body.en : item.body.zh}
                </p>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderLeft: '4px solid #2e7d32', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '720px' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>🎉</span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '14px', color: '#1b5e20' }}>
                {isEn ? 'Reported Outcomes — Class of 2026' : '家庭回报成果 · 2026 届'}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32', lineHeight: 1.7 }}>
                {isEn
                ? 'Reported outcomes include UC Santa Barbara, The Ohio State University, UC Davis, Syracuse University, and New Jersey Institute of Technology. Admissions outcomes vary by student.'
                : '家庭回报成果包括 UC Santa Barbara、The Ohio State University、UC Davis、Syracuse University 与 New Jersey Institute of Technology。升学结果因学生而异。'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tuition */}
      <div style={{ background: 'rgba(43,61,109,1)', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <h2 style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1, marginBottom: '12px' }}>
            {isEn ? 'TUITION' : '学费'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '17px', maxWidth: '620px', lineHeight: 1.7, marginBottom: '48px' }}>
            {isEn
              ? 'Choose the level of support your family actually needs. Self-paced students can start simply; transfer and college-pathway families can add advising, planning, and review.'
              : '选择真正适合家庭需求的支持层级。自主学习学生可低门槛开始；转学或大学路径家庭可加入顾问、规划与审核支持。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '48px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px', padding: '36px 32px',
            }}>
              <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {isEn ? 'Self-Paced Founders' : '自主学习创校方案'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1 }}>$49</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 24px' }}>
                {isEn ? '$499/year option available · limited founder lock' : '可选 $499/年 · 限量创校锁价'}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  isEn ? 'Course access and pacing tools' : '课程访问与学习进度工具',
                  isEn ? 'GIIS transcript records' : 'GIIS 成绩单记录',
                  isEn ? 'Parent dashboard' : '家长进度面板',
                  isEn ? 'Best for independent learners' : '适合自主学习学生',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.82)', fontSize: '14px' }}>
                    <span style={{ color: 'rgba(213,168,54,1)', fontSize: '16px', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'rgba(213,168,54,0.12)',
              border: '2px solid rgba(213,168,54,1)',
              borderRadius: '14px', padding: '36px 32px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-13px', left: '24px',
                background: 'rgba(213,168,54,1)', color: '#1a1a2e',
                fontSize: '11px', fontWeight: 800, padding: '3px 12px', borderRadius: '20px', letterSpacing: '0.5px',
              }}>
                {isEn ? 'TRANSFER DEFAULT' : '转学生默认'}
              </div>
              <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {isEn ? 'Guided' : '顾问指导方案'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1 }}>$149</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ color: 'rgba(213,168,54,0.85)', fontSize: '12px', fontWeight: 600, margin: '0 0 24px' }}>
                {isEn ? 'Monthly advisor check-in and transfer review included' : '包含每月顾问 check-in 与转学分审核'}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  isEn ? 'Everything in Self-Paced' : '包含自主学习方案内容',
                  isEn ? 'Monthly advisor check-in' : '每月顾问 check-in',
                  isEn ? 'Course planning support' : '课程规划支持',
                  isEn ? 'Transfer-credit review' : '转学分审核支持',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.82)', fontSize: '14px' }}>
                    <span style={{ color: 'rgba(213,168,54,1)', fontSize: '16px', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '20px 24px', maxWidth: '700px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: 'rgba(213,168,54,1)' }}>
              {isEn ? 'How it works' : '学费说明'}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              {isEn
                ? 'Premium / College Pathway support is available at $299/month for families who need stronger advising, pathway planning, writing support, and application-facing structure. Group and partner pricing is handled by inquiry.'
                : '需要更完整升学路径规划、写作支持与申请结构的家庭，可选择 $299/月 Premium / College Pathway。团体与合作机构价格以咨询为准。'}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: '#f8f9fa', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '8px', lineHeight: 1 }}>
            {isEn ? 'FREQUENTLY' : '常见问题'}
          </h2>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '40px', lineHeight: 1, color: '#2b3d6d' }}>
            {isEn ? 'ASKED QUESTIONS' : ''}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              {
                q: { en: 'Is this school fully online?', zh: '这是全线上学校吗？' },
                a: { en: 'Yes. All classes and coursework are delivered 100% online through our custom learning platform. Students can attend from anywhere in the world — including China. No relocation required.', zh: '是的。所有课程均通过我们自建的在线学习平台全程进行。学生可在世界任何地方就读，包括中国，无需搬迁。' },
              },
              {
                q: { en: 'Do classes follow a specific time zone?', zh: '课程需要按特定时区上课吗？' },
                a: { en: 'All coursework is fully asynchronous — students complete lessons, assignments, and exams on their own schedule, any time of day. There are no mandatory live sessions, making the program ideal for students in any time zone, including China (UTC+8).', zh: '所有课程均为全异步进行——学生可按自己的时间安排完成课程、作业与考试，无需在固定时间上线。没有强制性的直播课程，非常适合包括中国（UTC+8）在内的任何时区的学生。' },
              },
              {
                q: { en: 'What technology do I need?', zh: '我需要什么设备？' },
                a: { en: 'A computer or tablet with a reliable internet connection. We recommend a laptop or desktop for the best experience. All course materials are accessed through a web browser — no special software required.', zh: '需要一台连接稳定网络的电脑或平板。我们建议使用笔记本或台式电脑以获得最佳体验。所有课程材料均通过网络浏览器访问，无需特殊软件。' },
              },
              {
                q: { en: 'How should families understand the GIIS diploma?', zh: '家庭应如何理解 GIIS 文凭？' },
                a: { en: 'GIIS is a Florida-registered private school and issues records under its published 24-credit framework. Colleges and receiving schools review each student record under their own policies, so families should review the school profile and transcript workflow before enrollment.', zh: 'GIIS 是 Florida 注册私立学校，并依据公开的 24 学分框架出具学校记录。大学与接收学校会依自身政策审核每位学生记录，因此家庭入学前应查看学校简介与成绩单流程。' },
              },
              {
                q: { en: 'How long does the program take?', zh: '课程需要多长时间完成？' },
                a: { en: 'Students typically enroll for 1–4 years depending on their grade level. Students joining in Grade 9 complete a full 4-year program. Students transferring in Grades 10–12 can earn the remaining credits needed for graduation.', zh: '学生通常根据年级就读1至4年。9年级入学的学生完成完整的4年课程。10-12年级转入的学生可修满毕业所需的剩余学分。' },
              },
              {
                q: { en: 'Do all applicants need a transcript?', zh: '所有申请人都需要成绩单吗？' },
                a: { en: 'No. New students starting high school with GIIS usually provide proof of age and current or most recent school information. Transfer transcripts are needed when the student has completed high-school credits elsewhere and wants GIIS to review them.', zh: '不是。一般新生通常提供年龄证明，以及目前或最近就读学校信息。只有学生已经在其他学校修过高中学分，并希望 GIIS 审核转入时，才需要转学成绩单。' },
              },
              {
                q: { en: 'What support is available for students?', zh: '学生有哪些支持资源？' },
                a: { en: 'Every student receives personalized guidance from our admissions team to build their course plan and pathway. Our team monitors learning progress and provides feedback on assignments. Students can reach us at any time by email at admissions@genesisideas.school.', zh: '每位学生都能获得招生团队的个性化指导，协助规划课程与学习路径。我们的团队会持续追踪学习进度，并对作业提供反馈。学生可随时通过邮件 admissions@genesisideas.school 联系我们。' },
              },
              {
                q: { en: 'How is tuition structured?', zh: '学费如何计算？' },
                a: { en: 'GIIS offers Self-Paced Founders at $49/month or $499/year, Guided at $149/month, and Premium / College Pathway at $299/month. Group pricing is inquiry-based. Payment happens after the enrollment path is clear.', zh: 'GIIS 提供 $49/月或 $499/年的自主学习创校方案、$149/月顾问指导方案，以及 $299/月 Premium / College Pathway。团体价格以咨询为准，付款会在入学路径确认后进行。' },
              },
              {
                q: { en: 'Can I transfer credits from my previous school?', zh: '我可以转入之前学校的学分吗？' },
                a: { en: 'Yes. We review prior academic transcripts and credit toward your GIIS graduation requirements where appropriate. Our admissions team will assess transferable credits during your application review.', zh: '可以。我们会审查过往学校成绩单，并在适当情况下将相应学分计入 GIIS 毕业要求。招生团队会在申请审核过程中评估可转入的学分。' },
              },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: '12px', background: '#fff',
                border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                  {isEn ? item.q.en : item.q.zh}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                  {isEn ? item.a.en : item.a.zh}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: '#f4f6fa', padding: '60px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '32px' }}>
            {isEn ? 'Contact Admissions' : '联络招生办公室'}
          </h2>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📞</span>
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{isEn ? 'Phone' : '电话'}</div>
                <a href={`tel:${SCHOOL_PHONE.replace(/\s/g,'')}`} style={{ fontSize: '17px', fontWeight: 600, color: '#2b3d6d', textDecoration: 'none' }}>{SCHOOL_PHONE}</a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>✉️</span>
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{isEn ? 'Email' : '电子邮件'}</div>
                <a href={`mailto:${SCHOOL_EMAIL}`} style={{ fontSize: '17px', fontWeight: 600, color: '#2b3d6d', textDecoration: 'none' }}>{SCHOOL_EMAIL}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
