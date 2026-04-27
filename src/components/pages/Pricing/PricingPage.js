import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const MONTHLY_FEATURES = [
  { en: 'Full access to all 40+ courses', zh: '全部 40+ 门课程无限访问' },
  { en: '8 academic pathway sequences', zh: '8 条完整学习路径' },
  { en: 'Module quizzes, midterm & final exams', zh: '章节测验、期中与期末考试' },
  { en: 'Dedicated academic advisor', zh: '专属学业顾问' },
  { en: 'Official US high school transcript', zh: '美国官方成绩单' },
  { en: 'Cancel anytime', zh: '随时取消' },
];

const ANNUAL_EXTRAS = [
  { en: 'Everything in Monthly', zh: '包含所有月付权益' },
  { en: 'Priority advisor response (24 h)', zh: '顾问优先 24 小时回复' },
  { en: 'US high school diploma upon graduation', zh: '毕业后颁发美国高中文凭' },
  { en: 'Annual academic progress report', zh: '年度学业进展报告' },
  { en: '~$150/month effective rate', zh: '月均约 $150' },
];

const FAQS = [
  {
    q: { en: 'Can I switch from monthly to annual?', zh: '我可以从月付切换到年付吗？' },
    a: { en: 'Yes. You can upgrade to annual at any time. The remaining days of your current billing cycle are credited toward your annual plan.', zh: '可以。您随时可以升级为年付，当前周期剩余天数将折算至年付计划中。' },
  },
  {
    q: { en: 'What happens if I need to pause?', zh: '如果我需要暂停怎么办？' },
    a: { en: 'Monthly subscribers can cancel and re-enroll at any time. Annual subscribers may request a pause of up to 60 days per year — contact your advisor.', zh: '月付用户可随时取消并重新注册。年付用户每年可申请最多 60 天暂停，请联系您的顾问。' },
  },
  {
    q: { en: 'Are there any additional fees?', zh: '还有其他费用吗？' },
    a: { en: 'No. Your subscription covers everything — course content, exams, advisor sessions, and your official transcript. There are no per-course, per-exam, or setup fees.', zh: '没有。订阅费涵盖所有内容——课程资料、考试、顾问辅导及官方成绩单。无单课费、考试费或开户费。' },
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
            ? 'GIIS tuition: $199/month or $1,799/year. Full access to all courses, academic advisor, official US transcript, and diploma.'
            : 'GIIS 学费：月付 $199，或年付 $1,799。包含全部课程、学业顾问、美国官方成绩单及文凭。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '80px 0 72px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%', textAlign: 'center' }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 14px' }}>
            {isEn ? 'Simple, Transparent Pricing' : '简单透明的收费标准'}
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 16px' }}>
            {isEn ? 'One Subscription.' : '一份订阅。'}
            <br />
            <span style={{ color: 'rgba(213,168,54,1)' }}>
              {isEn ? 'Everything Included.' : '一切皆含。'}
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '17px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            {isEn
              ? 'No per-course fees. No hidden charges. Access all 40+ courses, exams, and your official US transcript from day one.'
              : '无单课收费，无隐藏费用。从第一天起即可访问全部 40+ 门课程、考试及美国官方成绩单。'}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{ background: '#f4f6fa', padding: '60px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

            {/* Monthly */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              border: '1px solid #e0e6f0',
              padding: '40px 36px',
              boxShadow: '0 4px 20px rgba(43,61,109,0.08)',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {isEn ? 'Monthly' : '月付'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '0 0 4px' }}>
                <span style={{ fontSize: '60px', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>$199</span>
                <span style={{ fontSize: '16px', color: '#888' }}>{isEn ? '/ month' : '/ 月'}</span>
              </div>
              <p style={{ margin: '0 0 28px', fontSize: '13px', color: '#aaa' }}>
                {isEn ? 'Cancel anytime' : '随时取消'}
              </p>
              <ul style={{ margin: '0 0 32px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MONTHLY_FEATURES.map((f) => (
                  <li key={f.en} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#333' }}>
                    <span style={{ color: '#2b3d6d', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {isEn ? f.en : f.zh}
                  </li>
                ))}
              </ul>
              <a href={`mailto:${SCHOOL_EMAIL}?subject=${encodeURIComponent(isEn ? 'Monthly Enrollment Inquiry' : '月付入学咨询')}`}
                style={{
                  display: 'block', textAlign: 'center', padding: '14px',
                  border: '2px solid #2b3d6d', borderRadius: '10px',
                  color: '#2b3d6d', fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                }}>
                {isEn ? 'Get Started' : '立即开始'}
              </a>
            </div>

            {/* Annual */}
            <div style={{
              background: '#1a1a2e', borderRadius: '16px',
              border: '2px solid rgba(213,168,54,1)',
              padding: '40px 36px',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(43,61,109,0.22)',
            }}>
              <div style={{
                position: 'absolute', top: '-14px', left: '28px',
                background: 'rgba(213,168,54,1)', color: '#1a1a2e',
                fontSize: '11px', fontWeight: 800, padding: '4px 14px',
                borderRadius: '20px', letterSpacing: '0.5px',
              }}>
                {isEn ? 'BEST VALUE' : '最划算'}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'rgba(213,168,54,1)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {isEn ? 'Annual' : '年付'}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '0 0 4px' }}>
                <span style={{ fontSize: '60px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>$1,799</span>
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>{isEn ? '/ year' : '/ 年'}</span>
              </div>
              <p style={{ margin: '0 0 28px', fontSize: '13px', color: 'rgba(213,168,54,0.85)', fontWeight: 600 }}>
                {isEn ? 'Save $589 · ~$150/month' : '节省 $589 · 月均约 $150'}
              </p>
              <ul style={{ margin: '0 0 32px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ANNUAL_EXTRAS.map((f) => (
                  <li key={f.en} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.82)' }}>
                    <span style={{ color: 'rgba(213,168,54,1)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {isEn ? f.en : f.zh}
                  </li>
                ))}
              </ul>
              <a href={`mailto:${SCHOOL_EMAIL}?subject=${encodeURIComponent(isEn ? 'Annual Enrollment Inquiry' : '年付入学咨询')}`}
                style={{
                  display: 'block', textAlign: 'center', padding: '14px',
                  background: 'rgba(213,168,54,1)', borderRadius: '10px',
                  color: '#1a1a2e', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
                }}>
                {isEn ? 'Enroll — Best Value' : '立即入学 · 最划算'}
              </a>
            </div>
          </div>

          {/* Value note */}
          <div style={{ marginTop: '28px', background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
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
                  { label: isEn ? 'Annual cost' : '年费用', vals: ['~$1,799', '$15,000–30,000', '$50,000–80,000'] },
                  { label: isEn ? 'US diploma' : '美国文凭', vals: ['✓', '✓', '✓'] },
                  { label: isEn ? 'Learn from China' : '在中国就读', vals: ['✓', '✓', '✗'] },
                  { label: isEn ? 'Flexible schedule' : '时间自由', vals: ['✓', '✗', '✗'] },
                  { label: isEn ? 'Academic advisor' : '学业顾问', vals: ['✓', '✓', '✓'] },
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
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '16px', margin: '0 0 32px', lineHeight: 1.7 }}>
            {isEn
              ? 'Contact our admissions team and we\'ll design the right academic plan for you.'
              : '联系我们的招生团队，我们将为您量身制定学习计划。'}
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
