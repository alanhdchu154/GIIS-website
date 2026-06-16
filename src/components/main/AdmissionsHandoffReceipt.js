import React from 'react';
import { Link } from 'react-router-dom';

const FLOW_STEPS = [
  {
    en: 'Received',
    zh: '已收到',
    body: {
      en: 'GIIS has received the request and will route it to admissions.',
      zh: 'GIIS 已收到请求，并会交给招生团队处理。',
    },
  },
  {
    en: 'Admissions review',
    zh: '招生审核',
    body: {
      en: 'Admissions reviews fit, grade level, records, timing, and support needs within one business day.',
      zh: '招生团队会在一个工作日内审核适配度、年级、资料、时间线与支持需求。',
    },
  },
  {
    en: 'Records request',
    zh: '资料补充',
    body: {
      en: 'If records are missing, GIIS will ask for the specific documents needed before making a final recommendation.',
      zh: '如果资料不足，GIIS 会说明需要补充哪些文件，再做最终建议。',
    },
  },
  {
    en: 'Plan recommendation',
    zh: '方案建议',
    body: {
      en: 'GIIS recommends Self-Paced, Guided, or Premium only after the student path is clear.',
      zh: 'GIIS 会在学生路径清楚后，再建议 Self-Paced、Guided 或 Premium。',
    },
  },
  {
    en: 'Payment after review',
    zh: '审核后付款',
    body: {
      en: 'No payment before review. Payment is requested only after the family understands the path.',
      zh: '审核前不收款。家庭看懂路径后，才进入付款步骤。',
    },
  },
];

const RECORDS = {
  new: [
    { en: 'Proof of age or birth date', zh: '年龄或出生日期证明' },
    { en: 'Current or most recent school information', zh: '目前或最近就读学校信息' },
    { en: 'Recent report card or placement record, if available', zh: '可提供的近期成绩或分班记录' },
    { en: 'Main learning concern or support need', zh: '家庭最担心的问题或支持需求' },
  ],
  transfer: [
    { en: 'Official transcripts or verifiable school records', zh: '正式成绩单或可核验学校记录' },
    { en: 'Course descriptions or syllabi when credits need review', zh: '需要审核学分时提供课程说明或 syllabus' },
    { en: 'Desired graduation timing', zh: '期望毕业时间' },
    { en: 'Current school contact if verification is needed', zh: '必要时提供原学校联系方式供核验' },
  ],
  consultation: [
    { en: 'Student grade and current school situation', zh: '学生年级与目前就读情况' },
    { en: 'Transcript or report card status', zh: '成绩单或成绩报告状态' },
    { en: 'Desired start timing', zh: '希望开始时间' },
    { en: 'Main question for the 15-20 minute consultation', zh: '15-20 分钟咨询最想讨论的问题' },
  ],
};

const SAFETY_POINTS = [
  {
    title: { en: 'First week is a fit check', zh: '第一周也是适配检查' },
    body: {
      en: 'If the student is not opening modules, submitting evidence, or understanding the workload, admissions should revisit the plan early.',
      zh: '如果学生没有打开模块、提交学习证据，或不理解学习量，招生团队应尽早重新评估方案。',
    },
  },
  {
    title: { en: 'Support level can be reviewed', zh: '支持层级可重新评估' },
    body: {
      en: 'Families can ask whether Self-Paced, Guided, or Premium is still the right level before the next billing decision.',
      zh: '家庭可在下一次计费决定前询问 Self-Paced、Guided 或 Premium 是否仍适合。',
    },
  },
  {
    title: { en: 'Refund policy stays written', zh: '退款政策保留书面记录' },
    body: {
      en: 'The 30-day refund policy is public and should be read before payment, especially when a student is new to online learning.',
      zh: '30 天退款政策是公开书面政策，尤其适合第一次尝试线上学习的学生家庭在付款前阅读。',
    },
  },
];

function pick(value, isEn) {
  return value[isEn ? 'en' : 'zh'];
}

export default function AdmissionsHandoffReceipt({
  language,
  kind = 'new',
  parentEmail = '',
  embedded = false,
}) {
  const isEn = language !== 'zh';
  const safeKind = RECORDS[kind] ? kind : 'new';
  const isTransfer = safeKind === 'transfer';
  const isConsultation = safeKind === 'consultation';

  const title = isConsultation
    ? (isEn ? 'Consultation request received' : '咨询预约已收到')
    : isTransfer
      ? (isEn ? 'Transfer Path Review received' : '转学路径评估已收到')
      : (isEn ? 'Application Path Review received' : '入学路径评估已收到');

  const summary = isConsultation
    ? {
        en: 'Admissions will reach out within one business day to schedule a 15-20 minute conversation. No payment is collected here, and no payment is requested before review.',
        zh: '招生团队会在一个工作日内联系您，安排一次 15-20 分钟咨询。此处不收款，审核前也不会要求付款。',
      }
    : isTransfer
      ? {
          en: "Admissions will review the student's prior credits, records, graduation timing, and support level within one business day before any payment step.",
          zh: '招生团队会在一个工作日内审核学生既有学分、资料、毕业时间与支持层级，再进入任何付款步骤。',
        }
      : {
          en: "Admissions will review the student's grade level, placement needs, family concern, and support level within one business day before any payment step.",
          zh: '招生团队会在一个工作日内审核学生年级、分班需求、家庭关注点与支持层级，再进入任何付款步骤。',
        };

  return (
    <section style={{
      minHeight: embedded ? 'auto' : 'calc(100vh - 70px)',
      background: embedded ? 'transparent' : '#f4f6fa',
      padding: embedded ? 0 : '46px 20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        maxWidth: embedded ? 760 : 980,
        margin: '0 auto',
        background: '#fff',
        border: '1px solid #e1e7f0',
        borderRadius: 12,
        boxShadow: embedded ? 'none' : '0 18px 48px rgba(26,45,90,0.10)',
        overflow: 'hidden',
      }}>
        <div style={{ background: '#172033', padding: embedded ? '26px 24px' : '34px 38px' }}>
          <p style={{ color: '#d5a836', fontSize: 11, fontWeight: 900, letterSpacing: 1.7, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Admissions Handoff Receipt' : '招生交接回执'}
          </p>
          <h1 style={{ color: '#fff', fontSize: embedded ? 24 : 'clamp(28px, 4vw, 42px)', lineHeight: 1.1, fontWeight: 850, margin: '0 0 12px', letterSpacing: 0 }}>
            {title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.76)', fontSize: embedded ? 13.5 : 15, lineHeight: 1.7, margin: 0 }}>
            {pick(summary, isEn)} {parentEmail ? (isEn ? 'We will use ' : '我们会使用 ') : ''}
            {parentEmail ? <strong style={{ color: '#fff' }}>{parentEmail}</strong> : null}
            {parentEmail ? (isEn ? ' for follow-up.' : ' 进行后续联系。') : null}
          </p>
        </div>

        <div style={{ padding: embedded ? '22px 24px 24px' : '30px 38px 34px' }}>
          <div className="admissions-receipt-flow" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, marginBottom: 24 }}>
            {FLOW_STEPS.map((step, index) => (
              <div key={step.en} style={{ border: '1px solid #e1e7f0', borderRadius: 8, padding: '13px 12px', background: index === 0 ? '#f4f8ff' : '#fafbfe', minHeight: 132 }}>
                <p style={{ color: '#2b3d6d', fontSize: 11, fontWeight: 900, letterSpacing: 1, margin: '0 0 8px' }}>
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h2 style={{ color: '#1a1a2e', fontSize: 14.5, lineHeight: 1.25, margin: '0 0 7px', fontWeight: 850 }}>
                  {isEn ? step.en : step.zh}
                </h2>
                <p style={{ color: '#5c6578', fontSize: 12, lineHeight: 1.55, margin: 0 }}>
                  {pick(step.body, isEn)}
                </p>
              </div>
            ))}
          </div>

          <div className="admissions-receipt-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(260px, 1.1fr)', gap: 18, alignItems: 'start' }}>
            <div style={{ background: '#f8f9fc', border: '1px solid #e1e7f0', borderRadius: 8, padding: '18px 18px' }}>
              <p style={{ color: '#2b3d6d', fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', margin: '0 0 9px' }}>
                {isEn ? 'Records preparation' : '资料准备'}
              </p>
              <p style={{ color: '#4f5868', fontSize: 13, lineHeight: 1.65, margin: '0 0 12px' }}>
                {isConsultation
                  ? (isEn ? 'You do not need every document before the call, but these details help admissions prepare.' : '咨询前不一定要准备齐所有文件，但这些信息能帮助招生团队提前判断。')
                  : (isEn ? 'Admissions may ask for these items before making a plan recommendation.' : '招生团队可能会在给出方案建议前要求补充这些资料。')}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {RECORDS[safeKind].map((item) => (
                  <li key={item.en} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#333', fontSize: 13, lineHeight: 1.55 }}>
                    <span style={{ color: '#1b6b3a', fontWeight: 900 }}>✓</span>
                    <span>{isEn ? item.en : item.zh}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '18px 18px' }}>
              <p style={{ color: '#6b5010', fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', margin: '0 0 9px' }}>
                {isEn ? 'Payment boundary' : '付款边界'}
              </p>
              <p style={{ color: '#5c4a12', fontSize: 13, lineHeight: 1.65, margin: '0 0 12px' }}>
                {isEn
                  ? 'No payment before review. GIIS will not send a manual payment link or invoice until the enrollment path, support level, and next action are clear.'
                  : '审核前不收款。GIIS 不会在入学路径、支持层级与下一步清楚前发送人工付款链接或 invoice。'}
              </p>
              <p style={{ color: '#5c4a12', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                {isEn
                  ? 'For transfer students, credit decisions are finalized only after official transcripts or verifiable school records are reviewed.'
                  : '对于转学生，可转学分只有在正式成绩单或可核验学校记录审核后才会最终确认。'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 18, border: '1px solid #dbe4f0', borderRadius: 8, background: '#f8f9fc', padding: '18px 18px' }}>
            <p style={{ color: '#2b3d6d', fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', margin: '0 0 12px' }}>
              {isEn ? 'If It Is Not Working' : '如果开始后不合适'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {SAFETY_POINTS.map((item) => (
                <div key={item.title.en} style={{ background: '#fff', border: '1px solid #e1e7f0', borderRadius: 8, padding: '14px 14px' }}>
                  <h2 style={{ color: '#1a1a2e', fontSize: 14.5, lineHeight: 1.25, margin: '0 0 7px', fontWeight: 850 }}>
                    {pick(item.title, isEn)}
                  </h2>
                  <p style={{ color: '#5c6578', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    {pick(item.body, isEn)}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/refund-policy" style={{ display: 'inline-block', marginTop: 14, color: '#2b3d6d', fontSize: 12.5, fontWeight: 850, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {isEn ? 'Read the written refund policy' : '阅读书面退款政策'} →
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <Link to="/trust-center" style={primaryLink}>{isEn ? 'Open Trust Center' : '打开信任中心'}</Link>
            <Link to="/parent/demo" style={secondaryLink}>{isEn ? 'Preview Parent Dashboard' : '预览家长面板'}</Link>
            <Link to="/pricing" style={secondaryLink}>{isEn ? 'Review Pricing' : '查看价格'}</Link>
            <a href="mailto:admissions@genesisideas.school" style={secondaryLink}>{isEn ? 'Email Admissions' : '联系招生邮箱'}</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admissions-receipt-flow {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .admissions-receipt-body {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .admissions-receipt-flow {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const primaryLink = {
  display: 'inline-block',
  padding: '11px 18px',
  borderRadius: 8,
  background: '#2b3d6d',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 850,
};

const secondaryLink = {
  display: 'inline-block',
  padding: '11px 18px',
  borderRadius: 8,
  border: '1.5px solid #cbd4e2',
  color: '#2b3d6d',
  background: '#fff',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 850,
};
