import React from 'react';
import { Helmet } from 'react-helmet-async';
import Nav from '../../main/Nav.js';
import heroImg from '../../../img/Homepage/homepage3.png';

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
    title: { en: 'Interview & Assessment', zh: '面談与学力评估' },
    body: {
      en: 'Complete a brief interview or placement discussion so we can design the right academic path for you.',
      zh: '进行简短的面談或学力评估，让我们为你规划最合适的学习方向。',
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

      {/* Tuition */}
      <div style={{ background: 'rgba(43,61,109,1)', padding: '80px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
          <h2 style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1, marginBottom: '12px' }}>
            {isEn ? 'TUITION' : '学费'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '17px', maxWidth: '560px', lineHeight: 1.7, marginBottom: '48px' }}>
            {isEn
              ? 'Simple monthly subscription. Learn at your own pace — take the exam when you\'re ready. Pass = credit. No per-course fees, no hidden charges.'
              : '简单订阅制。按自己的节奏学习，准备好了再考试。通过即得学分。无单课收费，无隐藏费用。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '48px' }}>
            {/* Monthly */}
            <div style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px', padding: '36px 32px',
            }}>
              <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {isEn ? 'Monthly' : '月付'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1 }}>$199</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 24px' }}>
                {isEn ? 'Cancel anytime' : '随时取消'}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  isEn ? 'Full access to all 8 pathways' : '全部 8 条路径无限访问',
                  isEn ? 'Unlimited course exams' : '无限次课程考试',
                  isEn ? 'Dedicated academic advisor' : '专属学业顾问',
                  isEn ? 'Official US transcript' : '美国官方成绩单',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.82)', fontSize: '14px' }}>
                    <span style={{ color: 'rgba(213,168,54,1)', fontSize: '16px', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Annual */}
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
                {isEn ? 'BEST VALUE' : '最划算'}
              </div>
              <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {isEn ? 'Annual' : '年付'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#fff', fontSize: '56px', fontWeight: 800, lineHeight: 1 }}>$1,799</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>{isEn ? '/ year' : '/ 年'}</span>
              </div>
              <p style={{ color: 'rgba(213,168,54,0.85)', fontSize: '13px', fontWeight: 600, margin: '0 0 24px' }}>
                {isEn ? 'Save $589 vs. monthly' : '比月付节省 $589'}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  isEn ? 'Everything in monthly' : '包含所有月付内容',
                  isEn ? 'Priority advisor response' : '顾问优先回复',
                  isEn ? 'US diploma upon completion' : '完成学业后颁发美国文凭',
                  isEn ? '~$150/month effective rate' : '月均约 $150',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.82)', fontSize: '14px' }}>
                    <span style={{ color: 'rgba(213,168,54,1)', fontSize: '16px', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '20px 24px', maxWidth: '640px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: 'rgba(213,168,54,1)' }}>
              {isEn ? '💡 How it works' : '💡 学费说明'}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              {isEn
                ? 'Your subscription gives you full access to all course materials. Study at your own pace, then take the credit exam when ready. Dedicated students typically complete 1–2 credits per month. A full 24-credit diploma takes 1–4 years depending on entry grade.'
                : '订阅后即可无限访问所有课程资料。按自己的节奏学习，准备好后参加学分考试。勤奋的学生每月通常可完成 1-2 个学分。根据入学年级，完整的 24 学分文凭通常需要 1-4 年。'}
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
                a: { en: 'Yes. All classes and coursework are delivered 100% online through our Moodle learning management system. Students can attend from anywhere in the world — including China. No relocation required.', zh: '是的。所有课程均通过我们的 Moodle 学习管理系统全程在线进行。学生可在世界任何地方就读，包括中国，无需搬迁。' },
              },
              {
                q: { en: 'Do classes follow a specific time zone?', zh: '课程需要按特定时区上课吗？' },
                a: { en: 'Most coursework is asynchronous — students complete assignments and lessons on their own schedule. Live sessions with instructors are available and scheduled to accommodate Chinese time zones (UTC+8).', zh: '大多数课程为异步进行，学生可按自己的时间安排完成。与教师的直播课程可以安排，并会考虑中国时区（UTC+8）。' },
              },
              {
                q: { en: 'What technology do I need?', zh: '我需要什么设备？' },
                a: { en: 'A computer or tablet with a reliable internet connection. We recommend a laptop or desktop for the best experience. All course materials are accessed through a web browser — no special software required.', zh: '需要一台连接稳定网络的电脑或平板。我们建议使用笔记本或台式电脑以获得最佳体验。所有课程材料均通过网络浏览器访问，无需特殊软件。' },
              },
              {
                q: { en: 'Is the diploma recognized by US universities?', zh: '这个文凭被美国大学认可吗？' },
                a: { en: 'Yes. GIIS is a registered Florida private school issuing US high school diplomas under the Florida 24-credit graduation framework — the same standard followed by US private high schools. Our diploma is designed to be recognized by US colleges during international student admissions review. GIIS is currently pursuing Cognia accreditation.', zh: '是的。GIIS 是在 Florida 注册的私立学校，依据 Florida 24 学分毕业框架颁发美国高中文凭——与美国私立高中标准一致。我们的文凭在美国大学国际学生申请审核中具备完整的学术效力。GIIS 目前正在申请 Cognia 认证。' },
              },
              {
                q: { en: 'How long does the program take?', zh: '课程需要多长时间完成？' },
                a: { en: 'Students typically enroll for 1–4 years depending on their grade level. Students joining in Grade 9 complete a full 4-year program. Students transferring in Grades 10–12 can earn the remaining credits needed for graduation.', zh: '学生通常根据年级就读1至4年。9年级入学的学生完成完整的4年课程。10-12年级转入的学生可修满毕业所需的剩余学分。' },
              },
              {
                q: { en: 'What support is available for students?', zh: '学生有哪些支持资源？' },
                a: { en: 'Every student gets assigned an academic advisor who helps design their course plan and pathway. We also provide life counseling, progress check-ins, and access to instructors via Moodle messaging and scheduled office hours.', zh: '每位学生都会被分配一名学业顾问，协助制定选课计划和路径规划。我们还提供生活辅导、学习进度追踪，以及通过 Moodle 消息和预约答疑与教师沟通的渠道。' },
              },
              {
                q: { en: 'How is tuition structured?', zh: '学费如何计算？' },
                a: { en: 'GIIS uses a simple monthly subscription model: $199/month or $1,799/year (save $589). Your subscription gives full access to all course materials. Study at your own pace and take credit exams when ready — no per-course fees.', zh: 'GIIS 采用简单的订阅制：月付 $199，或年付 $1,799（节省 $589）。订阅后即可无限访问所有课程资料，按自己节奏学习，准备好后参加学分考试，无单课收费。' },
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
