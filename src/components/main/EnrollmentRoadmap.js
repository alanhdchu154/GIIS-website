import React from 'react';
import { Link } from 'react-router-dom';

const NEW_STUDENT_STAGES = [
  {
    n: '01',
    title: { en: 'Start with fit', zh: '先确认适不适合' },
    body: {
      en: 'Review school status, course expectations, parent visibility, and whether an online high-school path fits the student.',
      zh: '先看学校状态、课程要求、家长可见度，以及线上高中路径是否适合学生。',
    },
    moment: { en: 'Before applying', zh: '申请前' },
  },
  {
    n: '02',
    title: { en: 'Apply with basic records', zh: '提交基本资料' },
    body: {
      en: 'New students usually provide identity, birth date, current or most recent school information, and any recent report card if available.',
      zh: '一般新生通常提供身份/出生日期、目前或最近学校信息，以及可提供的近期成绩或分班记录。',
    },
    moment: { en: 'Application', zh: '申请时' },
  },
  {
    n: '03',
    title: { en: 'Placement and course plan', zh: '分班与课程规划' },
    body: {
      en: 'GIIS confirms grade level, first courses, support level, and parent dashboard expectations before enrollment.',
      zh: 'GIIS 在入学前确认年级、首批课程、支持层级与家长面板预期。',
    },
    moment: { en: 'Admissions review', zh: '招生审核' },
  },
  {
    n: '04',
    title: { en: 'Pay, activate, start Week 1', zh: '付款、开通、开始第一周' },
    body: {
      en: 'Payment happens after the path is clear. Then student and parent access are activated and the Week 1 path begins.',
      zh: '路径确认后才进入付款。之后开通学生与家长入口，并开始第一周学习路径。',
    },
    moment: { en: 'After fit is clear', zh: '路径清楚后' },
  },
];

const TRANSFER_STUDENT_STAGES = [
  {
    n: '01',
    title: { en: 'Gather transcripts', zh: '准备成绩单' },
    body: {
      en: 'Transfer families prepare official transcripts, school reports, course descriptions, and translations when needed.',
      zh: '转学生家庭准备正式成绩单、学校报告、课程说明，以及必要的翻译文件。',
    },
    moment: { en: 'Before / during application', zh: '申请前或申请中' },
  },
  {
    n: '02',
    title: { en: 'Request path review', zh: '申请路径评估' },
    body: {
      en: 'Admissions reviews prior credits, missing requirements, desired graduation timing, and whether Self-Paced, Guided, or Premium support fits.',
      zh: '招生团队审核既有学分、缺少要求、目标毕业时间，以及适合 Self-Paced、Guided 或 Premium 哪种支持。',
    },
    moment: { en: 'Human review', zh: '人工审核' },
  },
  {
    n: '03',
    title: { en: 'Credit and timeline decision', zh: '学分与时间线判断' },
    body: {
      en: 'Transfer credits are not automatic. GIIS documents accepted credits and the remaining realistic graduation path.',
      zh: '转学分不是自动承诺。GIIS 会记录可接受学分，并给出剩余的现实毕业路径。',
    },
    moment: { en: 'Before payment', zh: '付款前' },
  },
  {
    n: '04',
    title: { en: 'Consult, pay, launch', zh: '咨询、付款、开通' },
    body: {
      en: 'After the family understands the credit fit and support level, GIIS sends the manual payment path and activates accounts.',
      zh: '家庭看懂学分对应与支持层级后，GIIS 再发送人工付款路径并开通账号。',
    },
    moment: { en: 'After review', zh: '审核后' },
  },
];

function pick(value, isEn) {
  return value[isEn ? 'en' : 'zh'];
}

function StageCard({ stage, color, isEn }) {
  return (
    <div className="giis-enrollment-stage" style={{
      border: '1px solid #e1e7f0',
      borderRadius: 8,
      background: '#fff',
      padding: 16,
      minHeight: 190,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      boxShadow: '0 10px 24px rgba(26,45,90,0.05)',
    }}>
      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color,
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          <span>{stage.n}</span>
          <span style={{ width: 26, height: 2, background: color, display: 'inline-block' }} />
        </div>
        <h3 style={{ color: '#1a1a2e', fontSize: 17, lineHeight: 1.25, fontWeight: 850, margin: '0 0 8px', letterSpacing: 0 }}>
          {pick(stage.title, isEn)}
        </h3>
        <p style={{ color: '#4f5868', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
          {pick(stage.body, isEn)}
        </p>
      </div>
      <p style={{
        margin: '14px 0 0',
        color: '#6a7280',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}>
        {pick(stage.moment, isEn)}
      </p>
    </div>
  );
}

function RoadmapLane({ title, subtitle, stages, color, isEn }) {
  return (
    <div style={{ border: '1px solid #dfe5ef', borderRadius: 8, background: '#f8f9fc', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
        <div>
          <p style={{ color, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 6px' }}>
            {title}
          </p>
          <p style={{ color: '#4f5868', fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="giis-enrollment-stage-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {stages.map((stage) => (
          <StageCard key={stage.n} stage={stage} color={color} isEn={isEn} />
        ))}
      </div>
    </div>
  );
}

export default function EnrollmentRoadmap({ language, variant = 'full', focus = 'both' }) {
  const isEn = language !== 'zh';
  const compact = variant === 'compact';
  const showNew = focus === 'both' || focus === 'new';
  const showTransfer = focus === 'both' || focus === 'transfer';
  const dark = variant === 'dark';

  const sectionStyle = {
    background: dark ? '#111a2e' : '#fff',
    color: dark ? '#fff' : '#1a1a2e',
    fontFamily: 'Inter, sans-serif',
    padding: compact ? '34px 0' : '62px 0',
    borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8ecf5',
    scrollMarginTop: 96,
  };

  return (
    <section style={sectionStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 6%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'minmax(240px, 0.8fr) minmax(320px, 1.2fr)' : '1fr',
          gap: compact ? 24 : 18,
          alignItems: 'start',
        }} className="giis-enrollment-roadmap-wrap">
          <div>
            <p style={{
              color: '#b8962e',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.7,
              textTransform: 'uppercase',
              margin: '0 0 10px',
            }}>
              {isEn ? 'Enrollment Roadmap' : '入学路径图'}
            </p>
            <h2 style={{
              color: dark ? '#fff' : '#1a1a2e',
              fontSize: compact ? 'clamp(24px, 3vw, 34px)' : 'clamp(28px, 4vw, 46px)',
              lineHeight: 1.1,
              fontWeight: 850,
              margin: '0 0 12px',
              letterSpacing: 0,
            }}>
              {isEn ? 'New students and transfer students do not follow the same path.' : '一般生和转学生，不应该走同一条路径。'}
            </h2>
            <p style={{
              color: dark ? 'rgba(255,255,255,0.72)' : '#4f5868',
              fontSize: compact ? 14 : 15,
              lineHeight: 1.75,
              margin: compact ? '0 0 16px' : '0 0 22px',
              maxWidth: 760,
            }}>
              {isEn
                ? 'Families should know what happens before application, what records are required, when GIIS makes a credit decision, and why payment comes after the path is clear.'
                : '家庭应该在申请前看懂：每一步会发生什么、需要哪些资料、GIIS 什么时候判断学分，以及为什么付款放在路径清楚之后。'}
            </p>
            {!compact && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/apply" style={primaryButton}>{isEn ? 'Request path review' : '申请路径评估'}</Link>
                <Link to="/consultation" style={secondaryButton}>{isEn ? 'Book consultation' : '预约咨询'}</Link>
                <Link to="/trust-center" style={secondaryButton}>{isEn ? 'Verify GIIS first' : '先验证学校'}</Link>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {showNew && (
              <RoadmapLane
                title={isEn ? 'New Student Path' : '一般新生路径'}
                subtitle={isEn
                  ? 'For students starting high school with GIIS or without prior high-school credits to transfer.'
                  : '适合从 GIIS 开始高中，或没有需要转入高中学分的学生。'}
                stages={NEW_STUDENT_STAGES}
                color="#1b6b3a"
                isEn={isEn}
              />
            )}
            {showTransfer && (
              <RoadmapLane
                title={isEn ? 'Transfer Student Path' : '转学生路径'}
                subtitle={isEn
                  ? 'For students who already completed high-school courses elsewhere and need credit review before choosing support and payment.'
                  : '适合已在其他学校修过高中课程、需要先审核学分再选择支持与付款的学生。'}
                stages={TRANSFER_STUDENT_STAGES}
                color="#2b3d6d"
                isEn={isEn}
              />
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1100px) {
          .giis-enrollment-stage-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 960px) {
          .giis-enrollment-roadmap-wrap {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .giis-enrollment-stage-grid {
            grid-template-columns: 1fr !important;
          }
          .giis-enrollment-stage {
            min-height: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}

const primaryButton = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  background: '#2b3d6d',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};

const secondaryButton = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  border: '1.5px solid #cbd4e2',
  color: '#2b3d6d',
  background: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};
