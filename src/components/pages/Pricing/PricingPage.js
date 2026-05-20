import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import DemoEmbed from '../../main/DemoEmbed.js';

const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const MONTHLY_FEATURES = [
  { en: 'Full access to all 40+ courses', zh: '全部 40+ 门课程无限访问' },
  { en: '8 academic pathway sequences', zh: '8 条完整学习路径' },
  { en: 'Module quizzes, midterm & final exams', zh: '章节测验、期中与期末考试' },
  { en: 'Personalized course planning support', zh: '个性化课程规划支持' },
  { en: 'Official US high school transcript', zh: '美国官方成绩单' },
  { en: 'US high school diploma upon graduation', zh: '毕业后颁发美国高中文凭' },
  { en: 'Cancel anytime · 30-day full refund', zh: '随时取消 · 30 天无条件退款' },
];

const FAQS = [
  {
    q: { en: 'What if my child doesn\'t engage? Can we get a refund?', zh: '如果我的孩子不投入怎么办？可以退款吗？' },
    a: {
      en: 'Yes — 30-day full refund, no questions asked. If within the first 30 days you decide GIIS isn\'t the right fit, email admissions@genesisideas.school and we refund the entire payment. We\'d rather have you spend $0 and walk away than have an unhappy family on the platform.',
      zh: '可以——30 天内无条件全额退款。如果在前 30 天内你判断 GIIS 不合适，发邮件到 admissions@genesisideas.school 即可获得全额退款。我们宁可让你花 0 美元离开，也不希望平台上有不满意的家庭。',
    },
  },
  {
    q: { en: 'Do you have a group or family plan?', zh: '有团体方案或家庭方案吗？' },
    a: {
      en: 'Yes — $50/month for 3 to 5 students under one account. Intended for tutoring centers, school partners, or families with multiple high-schoolers. Email admissions@genesisideas.school to set one up.',
      zh: '有——$50/月可涵盖 3 至 5 位学生，共用一个账户。适合补习机构、合作学校或家中有多位高中生的家庭。发邮件至 admissions@genesisideas.school 即可申请。',
    },
  },
  {
    q: { en: 'What happens if I need to pause?', zh: '如果我需要暂停怎么办？' },
    a: { en: 'Monthly subscribers can cancel and re-enroll at any time. To pause for a longer period (e.g., a semester abroad), email admissions@genesisideas.school.', zh: '月付用户可随时取消并重新注册。如需较长期暂停（例如出国一个学期），请发邮件至 admissions@genesisideas.school。' },
  },
  {
    q: { en: 'Are there any additional fees?', zh: '还有其他费用吗？' },
    a: { en: 'No. Your subscription covers everything — course content, exams, email support, and your official transcript. There are no per-course, per-exam, or setup fees.', zh: '没有。订阅费涵盖所有内容——课程资料、考试、邮件支持及官方成绩单。无单课费、考试费或开户费。' },
  },
  {
    q: { en: 'How long does the full diploma program take?', zh: '完整文凭项目需要多长时间？' },
    a: { en: 'Grade 9 entry: 4 years (24 credits). Grade 10–12 transfer: 1–3 years depending on transferable credits. Dedicated students typically earn 1–2 credits per month.', zh: '9 年级入学：4 年（24 学分）。10–12 年级转入：1–3 年，取决于可转入学分。用功的学生每月通常可完成 1–2 个学分。' },
  },
  {
    q: { en: 'Do you offer financial assistance?', zh: '你们提供经济援助吗？' },
    a: { en: 'We offer need-based scholarships for qualified students. Contact our admissions office to learn more about eligibility.', zh: '我们为符合条件的学生提供基于需要的奖学金。请联系招生办公室了解资格详情。' },
  },
];

export default function PricingPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Tuition & Pricing' : '学费与价格'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'GIIS Founders pricing: $19.90/month for the first 100 students (regular $199/month). Full access to all courses, course planning support, official US transcript, and diploma.'
            : 'GIIS 创校价：限前 100 名学生 $19.90/月（原价 $199/月）。包含全部课程、课程规划支持、美国官方成绩单及文凭。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '80px 0 72px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%', textAlign: 'center' }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 14px' }}>
            {isEn ? 'Founders Pricing · Limited' : '创校价 · 限量'}
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 16px' }}>
            {isEn ? 'First 100 students' : '前 100 名学生'}
            <br />
            <span style={{ color: 'rgba(213,168,54,1)' }}>
              {isEn ? 'pay $19.90 / month.' : '月付 $19.90。'}
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '17px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            {isEn
              ? 'Lock in $19.90/month for 12 months — 90% off our regular $199/month rate. Full access to all 40+ courses, exams, official US transcript, and diploma.'
              : '锁定 $19.90/月，12 个月不涨价 — 较正常 $199/月省 90%。包含全部 40+ 门课程、考试、美国官方成绩单与文凭。'}
          </p>
        </div>
      </div>

      {/* Show what they're paying for — product walkthrough */}
      <DemoEmbed
        language={language}
        variant="compact"
        background="#fff"
        eyebrow={isEn ? 'What $19.90 unlocks' : '$19.90 解锁什么'}
        headline={{
          en: 'See the platform before you pay',
          zh: '付费之前先看清楚平台',
        }}
        subline={{
          en: '80 seconds inside the Learn Portal — every parent\'s 5-minute concern, answered in advance.',
          zh: '80 秒看完学习平台 — 家长最常问的所有问题，先讲清楚。',
        }}
        showCtas={false}
      />

      {/* Pricing Cards */}
      <div style={{ background: '#f4f6fa', padding: '60px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 5%' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

            {/* ── Founders Monthly ── */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              border: '2px solid rgba(213,168,54,1)',
              padding: '40px 36px', position: 'relative',
              boxShadow: '0 12px 36px rgba(43,61,109,0.14)',
            }}>
              <div style={{
                position: 'absolute', top: '-14px', left: '28px',
                background: 'rgba(213,168,54,1)', color: '#1a1a2e',
                fontSize: '11px', fontWeight: 800, padding: '4px 14px',
                borderRadius: '20px', letterSpacing: '0.5px',
              }}>
                {isEn ? 'FOUNDERS · 100 SEATS' : '创校价 · 限 100 名'}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {isEn ? 'Individual · 1 student' : '个人方案 · 1 位学生'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 4px' }}>
                <span style={{ fontSize: '56px', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>$19.90</span>
                <span style={{ fontSize: '16px', color: '#888' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#999' }}>
                <span style={{ textDecoration: 'line-through', color: '#bbb' }}>$199</span>
                <span style={{ color: '#1B6B3A', fontWeight: 700, marginLeft: '8px' }}>
                  {isEn ? '90% off · locked 12 months' : '省 90% · 锁定 12 个月'}
                </span>
              </p>
              <p style={{ margin: '0 0 24px', fontSize: '12px', color: '#aaa' }}>
                {isEn ? 'Cancel anytime · 30-day full refund' : '随时取消 · 30 天无条件退款'}
              </p>
              <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MONTHLY_FEATURES.map((f) => (
                  <li key={f.en} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#333' }}>
                    <span style={{ color: '#2b3d6d', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {isEn ? f.en : f.zh}
                  </li>
                ))}
              </ul>
              <Link
                to="/apply"
                style={{
                  display: 'block', width: '100%', textAlign: 'center', padding: '14px',
                  background: 'rgba(213,168,54,1)', borderRadius: '10px',
                  color: '#1a1a2e', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
                  boxShadow: '0 6px 18px rgba(213,168,54,0.3)', boxSizing: 'border-box',
                }}>
                {isEn ? 'Apply Now →' : '立即申请 →'}
              </Link>
            </div>

            {/* ── Group Plan ── */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              border: '1px solid #e0e6f0',
              padding: '40px 36px', position: 'relative',
              boxShadow: '0 4px 20px rgba(43,61,109,0.08)',
            }}>
              <div style={{
                position: 'absolute', top: '-14px', left: '28px',
                background: '#2b3d6d', color: '#fff',
                fontSize: '11px', fontWeight: 800, padding: '4px 14px',
                borderRadius: '20px', letterSpacing: '0.5px',
              }}>
                {isEn ? 'FOR SCHOOLS & CENTERS' : '学校与机构'}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {isEn ? 'Group · 3–5 students' : '团体方案 · 3–5 位学生'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 4px' }}>
                <span style={{ fontSize: '56px', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>$50</span>
                <span style={{ fontSize: '16px', color: '#888' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#999' }}>
                <span style={{ color: '#1B6B3A', fontWeight: 700 }}>
                  {isEn ? '~$10–$16/student' : '折合每生约 $10–$16/月'}
                </span>
              </p>
              <p style={{ margin: '0 0 24px', fontSize: '12px', color: '#aaa' }}>
                {isEn ? 'One account · up to 5 seats · Cancel anytime' : '一个账户 · 最多 5 个学生 · 随时取消'}
              </p>
              <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { en: 'All features from Individual plan', zh: '包含个人方案所有权益' },
                  { en: 'Up to 5 student seats under one account', zh: '最多 5 个学生账号共用一个账户' },
                  { en: 'Suitable for tutoring centers, school cohorts, or families with multiple students', zh: '适合补习机构、学校团体或多子女家庭' },
                  { en: 'Shared billing — one invoice per month', zh: '统一计费，每月一张发票' },
                ].map((f) => (
                  <li key={f.en} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#333' }}>
                    <span style={{ color: '#2b3d6d', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {isEn ? f.en : f.zh}
                  </li>
                ))}
              </ul>
              <Link
                to="/apply"
                style={{
                  display: 'block', width: '100%', textAlign: 'center', padding: '14px',
                  background: '#2b3d6d', borderRadius: '10px',
                  color: '#fff', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
                  boxSizing: 'border-box',
                }}>
                {isEn ? 'Apply Now →' : '立即申请 →'}
              </Link>
            </div>

          </div>

          <p style={{ marginTop: '14px', textAlign: 'center', fontSize: '11px', color: '#aaa' }}>
            {isEn ? 'Secure payment via Stripe · Cards, Apple Pay, Cash App' : 'Stripe 安全支付 · 信用卡、Apple Pay、Cash App'}
          </p>

          {/* Value note — how credits work */}
          <div style={{ marginTop: '32px', background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>
                {isEn ? 'How credits work' : '学分如何运作'}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                {isEn
                  ? 'Study each module at your own pace, then take the credit exam when ready. Pass (70%+) = 1 credit earned and added to your official transcript. A full 24-credit diploma takes 1–4 years depending on your entry grade level.'
                  : '按自己节奏学习每个模块，准备好后参加学分考试。通过（70% 以上）即可获得 1 个学分并记入官方成绩单。完整的 24 学分文凭根据入学年级需要 1–4 年完成。'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Compare with alternatives */}
      <div style={{ background: '#fff', padding: '72px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', marginBottom: '32px', textAlign: 'center' }}>
            {isEn ? 'How We Compare' : '与其他选择对比'}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  {[
                    isEn ? '' : '',
                    isEn ? 'GIIS' : 'GIIS',
                    isEn ? 'Traditional Int\'l School' : '传统国际学校',
                    isEn ? 'US Boarding School' : '美国寄宿学校',
                  ].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px', textAlign: i === 0 ? 'left' : 'center',
                      borderBottom: '2px solid #e0e6f0',
                      color: i === 1 ? '#2b3d6d' : '#888',
                      fontWeight: 800, fontSize: i === 1 ? '15px' : '13px',
                      background: i === 1 ? '#f0f4ff' : 'transparent',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: isEn ? 'Cost / year' : '年费用', vals: [isEn ? '~$240 founders' : '~$240 创校价', '$15,000–30,000', '$50,000–80,000'] },
                  { label: isEn ? 'US diploma' : '美国文凭', vals: ['✓', '✓', '✓'] },
                  { label: isEn ? 'Learn from China' : '在中国就读', vals: ['✓', '✓', '✗'] },
                  { label: isEn ? 'Flexible schedule' : '时间自由', vals: ['✓', '✗', '✗'] },
                  { label: isEn ? 'Course planning support' : '课程规划支持', vals: ['✓', '✓', '✓'] },
                  { label: isEn ? 'Pathway planning' : '专业方向规划', vals: ['✓', '△', '△'] },
                ].map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fafbff' : '#fff' }}>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: '#444' }}>{row.label}</td>
                    {row.vals.map((v, vi) => (
                      <td key={vi} style={{
                        padding: '13px 16px', textAlign: 'center',
                        fontWeight: vi === 0 ? 800 : 500,
                        color: vi === 0 ? '#2b3d6d' : (v === '✗' ? '#e53935' : '#333'),
                        background: vi === 0 ? '#f0f4ff' : 'transparent',
                      }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: '#f4f6fa', padding: '72px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a2e', marginBottom: '32px' }}>
            {isEn ? 'Pricing FAQ' : '收费常见问题'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '22px 24px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>
                  {isEn ? f.q.en : f.q.zh}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                  {isEn ? f.a.en : f.a.zh}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '72px 0', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '0 0 16px' }}>
            {isEn ? 'Ready to get started?' : '准备好开始了吗？'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '16px', margin: '0 0 12px', lineHeight: 1.7 }}>
            {isEn
              ? 'Contact our admissions team and we\'ll design the right academic plan for you.'
              : '联系我们的招生团队，我们将为您量身制定学习计划。'}
          </p>
          <p style={{ margin: '0 0 32px', fontSize: '13px' }}>
            <Link to="/parent/demo" style={{ color: '#d5a836', textDecoration: 'underline', fontWeight: 600 }}>
              {isEn ? 'Or preview the parent dashboard you\'ll get →' : '或先预览家长面板长怎样 →'}
            </Link>
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/admission" style={{
              padding: '14px 32px', borderRadius: '10px',
              background: 'rgba(213,168,54,1)', color: '#1a1a2e',
              fontWeight: 800, fontSize: '15px', textDecoration: 'none',
            }}>
              {isEn ? 'Apply Now' : '立即申请'}
            </Link>
            <a href={`mailto:${SCHOOL_EMAIL}`} style={{
              padding: '14px 32px', borderRadius: '10px',
              border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
              fontWeight: 700, fontSize: '15px', textDecoration: 'none',
            }}>
              {isEn ? 'Email Admissions' : '发送邮件'}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
