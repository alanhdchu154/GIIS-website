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
    title: { en: 'Submit Inquiry', zh: '提交申请意向' },
    body: {
      en: 'Contact our admissions office by email or phone to express your interest and receive an application packet.',
      zh: '透过电子邮件或电话联系招生办公室，表达入学意向并索取申请资料。',
    },
  },
  {
    num: '02',
    title: { en: 'Provide Documents', zh: '提交申请文件' },
    body: {
      en: 'Submit academic records, transcripts from previous schools, and any required supporting materials.',
      zh: '提交过往学校的成绩单、在籍证明及其他所需辅助文件。',
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
      en: 'Receive your admissions decision and enrollment instructions. Welcome to GIIS!',
      zh: '收到录取结果与入学指引，正式成为 GIIS 的一员！',
    },
  },
];

const REQUIREMENTS = [
  { icon: '📄', label: { en: 'Previous academic transcripts', zh: '过往成绩单' } },
  { icon: '🎂', label: { en: 'Proof of age / birth certificate', zh: '出生证明文件' } },
  { icon: '✍️', label: { en: 'Completed application form', zh: '填妥的申请表' } },
  { icon: '💬', label: { en: 'Brief personal statement (optional)', zh: '个人陈述（选填）' } },
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
              ? 'Start your journey at Genesis of Ideas International School.'
              : '开始你在艾迪尔国际学校的学习旅程。'}
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
          </div>
          <Link to="/transfer-students" style={{
            padding: '13px 22px',
            borderRadius: '8px',
            background: '#2b3d6d',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}>
            {isEn ? 'Transfer Guide →' : '查看转学说明 →'}
          </Link>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '48px' }}>
            {REQUIREMENTS.map((r) => (
              <div key={r.label.en} style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                padding: '20px 24px',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                background: '#fafafa',
              }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{r.icon}</span>
                <span style={{ fontSize: '15px', color: '#333', fontWeight: 500, lineHeight: 1.5 }}>
                  {r.label[isEn ? 'en' : 'zh']}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: '#888', maxWidth: '600px', lineHeight: 1.7 }}>
            {isEn
              ? '* Requirements and deadlines may vary each term. Please contact our admissions office to confirm current requirements before applying.'
              : '* 各学期的要求与截止日期可能有所调整。申请前请联系招生办公室确认最新资讯。'}
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
              ? 'GIIS diplomas are issued under the Florida private school framework — the same legal basis used by US private high schools recognized by colleges nationwide.'
              : 'GIIS 文凭依据 Florida 私立学校框架颁发，与全美大学所认可的美国私立高中具备相同的法律依据。'}
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
                title: { en: 'Accepted by US Universities', zh: '美国大学认可' },
                body: { en: 'Class of 2026 graduates have been accepted to UC Santa Barbara, The Ohio State University, UC Davis, Syracuse University, and New Jersey Institute of Technology.', zh: '2026 届毕业生已获 UC Santa Barbara、俄亥俄州立大学、UC Davis、雪城大学（Syracuse University）及新泽西理工学院（New Jersey Institute of Technology）录取。' },
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
                {isEn ? 'Proven Results — Class of 2026' : '真实成果 · 2026 届'}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32', lineHeight: 1.7 }}>
                {isEn
                  ? 'Yunfan Yang accepted to UC Santa Barbara, The Ohio State University, and UC Davis (Kinesiology). Baoyi Lu accepted to Syracuse University and New Jersey Institute of Technology.'
                  : '杨芸帆已获 UC Santa Barbara、俄亥俄州立大学、UC Davis（运动科学）录取。卢抱一已获雪城大学（Syracuse University）及新泽西理工学院（New Jersey Institute of Technology）录取。'}
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
                {isEn ? 'MOST POPULAR' : '最常用'}
              </div>
              <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {isEn ? 'Guided' : '顾问指导方案'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1 }}>$149</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ color: 'rgba(213,168,54,0.85)', fontSize: '12px', fontWeight: 600, margin: '0 0 24px' }}>
                {isEn ? 'Monthly advisor check-in included' : '包含每月顾问 check-in'}
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
                q: { en: 'Is the diploma recognized by US universities?', zh: '这个文凭被美国大学认可吗？' },
                a: { en: 'Yes. GIIS is a registered Florida private school issuing US high school diplomas under the Florida 24-credit graduation framework — the same standard followed by US private high schools. Our diploma is designed to be recognized by US colleges during international student admissions review.', zh: '是的。GIIS 是在 Florida 注册的私立学校，依据 Florida 24 学分毕业框架颁发美国高中文凭——与美国私立高中标准一致。我们的文凭在美国大学国际学生申请审核中具备完整的学术效力。' },
              },
              {
                q: { en: 'How long does the program take?', zh: '课程需要多长时间完成？' },
                a: { en: 'Students typically enroll for 1–4 years depending on their grade level. Students joining in Grade 9 complete a full 4-year program. Students transferring in Grades 10–12 can earn the remaining credits needed for graduation.', zh: '学生通常根据年级就读1至4年。9年级入学的学生完成完整的4年课程。10-12年级转入的学生可修满毕业所需的剩余学分。' },
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
