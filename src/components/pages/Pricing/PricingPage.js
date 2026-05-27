import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import DemoEmbed from '../../main/DemoEmbed.js';

const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const TIERS = [
  {
    key: 'self-paced',
    eyebrow: { en: 'Self-Paced Founders', zh: '自主学习创校方案' },
    price: '$49',
    cadence: { en: '/ month', zh: '/ 月' },
    annual: { en: '$499/year available', zh: '可选 $499/年付' },
    note: {
      en: 'Best for motivated students who need a real school record and flexible pacing.',
      zh: '适合自律学生：需要真实学校记录、弹性进度与清楚的学习轨迹。',
    },
    features: [
      { en: 'Full access to GIIS Learn Portal courses', zh: '开放 GIIS Learn Portal 课程' },
      { en: 'Module quizzes, assignments, midterm and final exams', zh: '章节测验、作业、期中与期末考试' },
      { en: 'Parent dashboard and official transcript record', zh: '家长面板与正式成绩单记录' },
      { en: '30-day full refund', zh: '30 天无条件退款' },
    ],
    cta: { en: 'Apply for Self-Paced', zh: '申请自主学习方案' },
    highlighted: false,
  },
  {
    key: 'guided',
    eyebrow: { en: 'Guided', zh: '顾问指导方案' },
    price: '$149',
    cadence: { en: '/ month', zh: '/ 月' },
    annual: { en: 'Most families start here', zh: '多数家庭适合从这里开始' },
    note: {
      en: 'Adds the human layer parents usually need: planning, review, and transfer-credit support.',
      zh: '加入家长最需要的人为支持：选课规划、进度复盘与转学分审核。',
    },
    features: [
      { en: 'Everything in Self-Paced', zh: '包含自主学习方案全部内容' },
      { en: 'Monthly advisor check-in', zh: '每月顾问 check-in' },
      { en: 'Course planning and pathway review', zh: '选课规划与 pathway 复盘' },
      { en: 'Transfer-credit review for incoming students', zh: '转学生学分初审' },
      { en: 'Parent progress review and next-step notes', zh: '家长进度解读与下一步建议' },
    ],
    cta: { en: 'Apply for Guided', zh: '申请顾问指导方案' },
    highlighted: true,
  },
  {
    key: 'premium',
    eyebrow: { en: 'Premium / College Pathway', zh: '升学路径方案' },
    price: '$299',
    cadence: { en: '/ month', zh: '/ 月' },
    annual: { en: 'For higher-touch planning', zh: '适合需要更密集规划的家庭' },
    note: {
      en: 'For families who want GIIS to actively shape the academic story behind the transcript.',
      zh: '适合希望 GIIS 主动协助打造成绩单背后申请故事的家庭。',
    },
    features: [
      { en: 'Everything in Guided', zh: '包含顾问指导方案全部内容' },
      { en: 'Pathway planning for target majors', zh: '针对目标专业规划 pathway' },
      { en: 'Writing and project portfolio guidance', zh: '写作与项目 portfolio 指导' },
      { en: 'More frequent parent-facing planning support', zh: '更密集的家长端规划支持' },
      { en: 'College-readiness framing without admissions guarantees', zh: '升学准备定位，但不承诺录取结果' },
    ],
    cta: { en: 'Apply for Premium', zh: '申请升学路径方案' },
    highlighted: false,
  },
];

const FAQS = [
  {
    q: { en: 'Why does GIIS offer multiple tiers?', zh: '为什么 GIIS 有多层方案？' },
    a: {
      en: 'The structure is meant to be honest about support needs: some students only need access and records, while transfer students and college-bound families usually need advisor support.',
      zh: '这个结构是为了更诚实地区分支持需求：有些学生只需要课程与记录，但转学生与目标美国大学的家庭通常需要顾问支持。',
    },
  },
  {
    q: { en: 'Do you still offer group pricing?', zh: '还有团体价格吗？' },
    a: {
      en: 'Yes, but group pricing is handled by admissions instead of public checkout. Schools, tutoring centers, and multi-student families can email admissions for a seat-based quote.',
      zh: '有，但团体价格改由招生团队评估，不再公开成低价按钮。学校、机构或多学生家庭可邮件联系招生团队取得 seat-based quote。',
    },
  },
  {
    q: { en: 'Can transfer students join mid-year?', zh: '转学生可以中途加入吗？' },
    a: {
      en: 'Yes. GIIS reviews official transcripts, maps transferable credits to the 24-credit framework, and recommends the shortest realistic path to graduation.',
      zh: '可以。GIIS 会审核正式成绩单，将可转学分对应到 24 学分毕业框架，并建议最现实的毕业路径。',
    },
  },
  {
    q: { en: 'What if my child does not engage?', zh: '如果孩子不投入怎么办？' },
    a: {
      en: 'Every plan includes a 30-day full refund. Guided and Premium plans add advisor visibility so parents can catch disengagement earlier.',
      zh: '所有方案都有 30 天无条件退款。Guided 与 Premium 方案会加入顾问可见度，让家长更早发现孩子没有投入。',
    },
  },
];

function TierCard({ tier, isEn }) {
  return (
    <div style={{
      background: '#fff',
      border: tier.highlighted ? '2px solid #d5a836' : '1px solid #dfe5ef',
      borderRadius: 8,
      padding: '28px 24px',
      boxShadow: tier.highlighted ? '0 14px 36px rgba(43,61,109,0.14)' : '0 4px 18px rgba(43,61,109,0.07)',
      position: 'relative',
    }}>
      {tier.highlighted && (
        <div style={{
          position: 'absolute',
          top: -13,
          left: 20,
          background: '#d5a836',
          color: '#1a1a2e',
          borderRadius: 14,
          padding: '4px 12px',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}>
          {isEn ? 'Recommended' : '推荐'}
        </div>
      )}
      <p style={{ margin: '0 0 8px', color: '#2b3d6d', fontSize: 12, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>
        {tier.eyebrow[isEn ? 'en' : 'zh']}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 46, lineHeight: 1, fontWeight: 850, color: '#1a1a2e' }}>{tier.price}</span>
        <span style={{ color: '#777', fontSize: 15 }}>{tier.cadence[isEn ? 'en' : 'zh']}</span>
      </div>
      <p style={{ margin: '0 0 14px', color: '#1B6B3A', fontSize: 13, fontWeight: 750 }}>
        {tier.annual[isEn ? 'en' : 'zh']}
      </p>
      <p style={{ minHeight: 70, margin: '0 0 18px', color: '#555', fontSize: 13, lineHeight: 1.65 }}>
        {tier.note[isEn ? 'en' : 'zh']}
      </p>
      <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tier.features.map((feature) => (
          <li key={feature.en} style={{ display: 'flex', gap: 9, color: '#333', fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ color: '#2b3d6d', fontWeight: 900 }}>✓</span>
            <span>{feature[isEn ? 'en' : 'zh']}</span>
          </li>
        ))}
      </ul>
      <Link to="/apply" style={{
        display: 'block',
        textAlign: 'center',
        textDecoration: 'none',
        padding: '13px 16px',
        borderRadius: 8,
        background: tier.highlighted ? '#d5a836' : '#2b3d6d',
        color: tier.highlighted ? '#1a1a2e' : '#fff',
        fontWeight: 850,
        fontSize: 14,
      }}>
        {tier.cta[isEn ? 'en' : 'zh']}
      </Link>
    </div>
  );
}

export default function PricingPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Tuition & Pricing' : '学费与价格'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'GIIS tuition tiers: self-paced, guided, and premium college pathway support for online US high school students.'
            : 'GIIS 学费方案：自主学习、顾问指导与升学路径支持，适合线上美国高中学生。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      <section style={{ background: 'linear-gradient(135deg, #172033 0%, #2b3d6d 100%)', padding: '74px 0 66px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 6%', textAlign: 'center' }}>
          <p style={{ color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 14px' }}>
            {isEn ? 'Tuition That Matches Support Level' : '学费依支持深度分层'}
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.06, fontWeight: 850, margin: '0 0 16px' }}>
            {isEn ? 'Choose how much guidance your child needs.' : '依孩子需要的支持程度选择方案。'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 680, margin: '0 auto', lineHeight: 1.75, fontSize: 16 }}>
            {isEn
              ? 'Self-paced access stays affordable. Transfer students and college-bound families can add the advisor layer that makes the record easier to trust.'
              : '自主学习仍保持可负担；转学生与目标美国大学的家庭，可以加入顾问层，让成绩单与学习路径更可信。'}
          </p>
        </div>
      </section>

      <DemoEmbed
        language={language}
        variant="compact"
        background="#fff"
        eyebrow={isEn ? 'Before You Choose A Plan' : '选择方案前'}
        headline={{ en: 'See the platform your tuition unlocks', zh: '先看清楚学费对应的平台与服务' }}
        subline={{
          en: '80 seconds inside the Learn Portal, parent dashboard, and transcript workflow.',
          zh: '80 秒看完 Learn Portal、家长面板与成绩单流程。',
        }}
        showCtas={false}
      />

      <section style={{ background: '#f4f6fa', padding: '58px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 5%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'stretch' }}>
            {TIERS.map((tier) => <TierCard key={tier.key} tier={tier} isEn={isEn} />)}
          </div>
          <p style={{ margin: '18px 0 0', color: '#777', textAlign: 'center', fontSize: 12, lineHeight: 1.6 }}>
            {isEn
              ? 'All plans start with an application review. Payment happens after the enrollment path is clear.'
              : '所有方案先经过申请审核；确认入学路径后再付款。'}
          </p>
        </div>
      </section>

      <section style={{ background: '#fff', padding: '68px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ margin: '0 0 28px', color: '#1a1a2e', fontSize: 30, fontWeight: 850, textAlign: 'center' }}>
            {isEn ? 'How We Compare' : '与其他选择对比'}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {[isEn ? 'Option' : '选项', 'GIIS Self-Paced', 'GIIS Guided', isEn ? 'Traditional international school' : '传统国际学校'].map((h, i) => (
                    <th key={h} style={{
                      padding: '13px 14px',
                      textAlign: i === 0 ? 'left' : 'center',
                      borderBottom: '2px solid #e0e6f0',
                      color: i === 1 || i === 2 ? '#2b3d6d' : '#777',
                      background: i === 1 || i === 2 ? '#f0f4ff' : 'transparent',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: isEn ? 'Starting monthly cost' : '月费起点', vals: ['$49', '$149', '$1,250+'] },
                  { label: isEn ? 'Official school record' : '正式学校记录', vals: ['✓', '✓', '✓'] },
                  { label: isEn ? 'Advisor planning' : '顾问规划', vals: ['Email support', 'Monthly review', 'Varies'] },
                  { label: isEn ? 'Transfer-credit review' : '转学分审核', vals: ['Basic', 'Included', 'Varies'] },
                  { label: isEn ? 'Flexible online schedule' : '线上弹性进度', vals: ['✓', '✓', '△'] },
                ].map((row) => (
                  <tr key={row.label}>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid #edf0f6', fontWeight: 700, color: '#333' }}>{row.label}</td>
                    {row.vals.map((value, i) => (
                      <td key={`${row.label}-${value}`} style={{
                        padding: '13px 14px',
                        borderBottom: '1px solid #edf0f6',
                        textAlign: 'center',
                        color: i < 2 ? '#2b3d6d' : '#555',
                        background: i < 2 ? '#f8faff' : '#fff',
                        fontWeight: i < 2 ? 750 : 500,
                      }}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '14px 0 0', color: '#888', fontSize: 12, lineHeight: 1.65 }}>
            {isEn
              ? 'Public comparisons are directional. GIIS is a Florida-registered private school and is pursuing longer-term trust signals separately from price.'
              : '以上为方向性比较。GIIS 是 Florida 注册私立学校，价格之外的长期信任建设会另行推进。'}
          </p>
        </div>
      </section>

      <section style={{ background: '#f4f6fa', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ margin: '0 0 24px', color: '#1a1a2e', fontSize: 30, fontWeight: 850 }}>
            {isEn ? 'Pricing FAQ' : '收费常见问题'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FAQS.map((item) => (
              <div key={item.q.en} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '20px 22px' }}>
                <p style={{ margin: '0 0 8px', color: '#1a1a2e', fontWeight: 800, fontSize: 15 }}>
                  {item.q[isEn ? 'en' : 'zh']}
                </p>
                <p style={{ margin: 0, color: '#555', lineHeight: 1.7, fontSize: 13 }}>
                  {item.a[isEn ? 'en' : 'zh']}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg, #172033 0%, #2b3d6d 100%)', padding: '68px 0', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 650, margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ color: '#fff', fontSize: 34, fontWeight: 850, margin: '0 0 14px' }}>
            {isEn ? 'Not sure which plan fits?' : '不确定该选哪一层？'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, margin: '0 0 26px' }}>
            {isEn
              ? 'Apply first. Admissions will review transfer credits, target timeline, and how much support your family realistically needs.'
              : '先申请。招生团队会看转学分、目标毕业时间，以及家庭实际需要多少支持。'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/apply" style={{ padding: '13px 28px', borderRadius: 8, background: '#d5a836', color: '#1a1a2e', fontWeight: 850, textDecoration: 'none' }}>
              {isEn ? 'Apply Now' : '立即申请'}
            </Link>
            <a href={`mailto:${SCHOOL_EMAIL}`} style={{ padding: '13px 28px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 750, textDecoration: 'none' }}>
              {isEn ? 'Email Admissions' : '联系招生'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
