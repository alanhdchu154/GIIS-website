import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

function t(copy, isEn) {
  return copy[isEn ? 'en' : 'zh'];
}

const POLICY_POINTS = [
  {
    title: {
      en: '30-day full refund window',
      zh: '30 天全额退款期',
    },
    body: {
      en: 'Families may request a full tuition refund within 30 calendar days after the first payment is recorded, as long as the request is sent in writing to GIIS admissions.',
      zh: '家庭可在第一笔付款记录后的 30 个自然日内，以书面方式向 GIIS 招生邮箱提出全额学费退款请求。',
    },
  },
  {
    title: {
      en: 'Payment happens after review',
      zh: '付款发生在路径审核之后',
    },
    body: {
      en: 'GIIS should request payment only after the student path, support level, and transfer-record needs are reviewed. The refund policy is not a substitute for that review.',
      zh: 'GIIS 应在学生路径、支持层级与转学记录需求审核后才请求付款。退款政策不能取代入学路径审核。',
    },
  },
  {
    title: {
      en: 'Access and records after refund',
      zh: '退款后的帐号与记录',
    },
    body: {
      en: 'After a refund is processed, paid portal access may be closed. GIIS will preserve required school records according to its records policy, but unpaid future services stop.',
      zh: '退款处理后，付费平台权限可能关闭。GIIS 会依学校记录政策保留必要记录，但未付费的后续服务会停止。',
    },
  },
  {
    title: {
      en: 'What the policy does not promise',
      zh: '本政策不承诺什么',
    },
    body: {
      en: 'The refund policy does not promise transfer-credit approval, college admission, accreditation completion, AP authorization, or outside institutional acceptance.',
      zh: '退款政策不承诺转学分一定通过、大学录取、认证完成、AP 授权或外部机构接受。',
    },
  },
];

const REQUEST_STEPS = [
  {
    en: 'Email admissions@genesisideas.school from the parent email used for the application or payment.',
    zh: '使用申请或付款时的家长邮箱，发送邮件至 admissions@genesisideas.school。',
  },
  {
    en: 'Include the student name, parent name, payment date, Stripe invoice or receipt reference, and the reason for the request.',
    zh: '注明学生姓名、家长姓名、付款日期、Stripe invoice 或 receipt 编号，以及退款原因。',
  },
  {
    en: 'GIIS reviews the request, confirms the payment record, and responds with the next administrative step.',
    zh: 'GIIS 会审核请求、确认付款记录，并回复下一步行政处理方式。',
  },
];

function RefundPolicyPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Refund Policy' : '退款政策'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'GIIS 30-day refund policy for families paying after admissions review.'
            : 'GIIS 面向完成入学审核后付款家庭的 30 天退款政策。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      <section style={{ background: '#132038', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '74px 0 58px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.7, textTransform: 'uppercase', margin: '0 0 14px' }}>
            {isEn ? 'Before Payment' : '付款前可阅读'}
          </p>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.06, fontWeight: 850, margin: '0 0 18px', letterSpacing: 0 }}>
            {isEn ? '30-day refund policy for reviewed enrollments.' : '完成路径审核后付款，享有 30 天退款政策。'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.74)', maxWidth: 720, fontSize: 16, lineHeight: 1.75, margin: '0 0 24px' }}>
            {isEn
              ? 'GIIS uses a review-first enrollment flow: families apply or consult first, the school reviews the student path, and payment comes after the family understands the plan.'
              : 'GIIS 采用先审核、再付款的入学流程：家庭先申请或咨询，学校审核学生路径，家长理解方案后再付款。'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/pricing" style={primaryLink}>{isEn ? 'Review tuition' : '查看学费'}</Link>
            <Link to="/consultation" style={secondaryLink}>{isEn ? 'Ask admissions first' : '先咨询招生'}</Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '58px 0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {POLICY_POINTS.map((item) => (
              <div key={item.title.en} style={card}>
                <h2 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: 20, lineHeight: 1.25, fontWeight: 850 }}>
                  {t(item.title, isEn)}
                </h2>
                <p style={{ margin: 0, color: '#4f5868', fontSize: 14, lineHeight: 1.7 }}>
                  {t(item.body, isEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#f4f6fa', fontFamily: 'Inter, sans-serif', padding: '58px 0' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 6%' }}>
          <p style={eyebrow}>{isEn ? 'How To Request' : '如何申请退款'}</p>
          <h2 style={sectionTitle}>{isEn ? 'Keep the request written and traceable.' : '退款请求应以书面方式留下记录。'}</h2>
          <ol style={{ margin: '24px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {REQUEST_STEPS.map((step, index) => (
              <li key={step.en} style={{ ...card, display: 'grid', gridTemplateColumns: '42px 1fr', gap: 14, alignItems: 'start', background: '#fff' }}>
                <span style={{ width: 42, height: 42, borderRadius: 8, background: '#2b3d6d', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 850 }}>
                  {index + 1}
                </span>
                <span style={{ color: '#30384a', fontSize: 14, lineHeight: 1.7 }}>{isEn ? step.en : step.zh}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '58px 0 68px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ border: '1px solid #e2e7f0', borderLeft: '5px solid #d5a836', borderRadius: 8, padding: '24px 26px', background: '#fffbef' }}>
            <p style={{ margin: '0 0 9px', color: '#8a6a14', fontSize: 12, fontWeight: 850, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {isEn ? 'Manual Review Sales Mode' : '人工审核付款模式'}
            </p>
            <h2 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.15, fontWeight: 850 }}>
              {isEn ? 'Refund confidence does not replace admissions review.' : '退款保障不能取代入学审核。'}
            </h2>
            <p style={{ margin: '0 0 18px', color: '#4f5868', fontSize: 14, lineHeight: 1.75 }}>
              {isEn
                ? 'Families should still complete the application or consultation path first. GIIS should not request payment until the enrollment path, expected support level, and next step are clear.'
                : '家庭仍应先完成申请或咨询路径。GIIS 应在入学路径、所需支持层级与下一步清楚后，才请求付款。'}
            </p>
            <Link to="/apply" style={{ display: 'inline-block', background: '#2b3d6d', color: '#fff', borderRadius: 8, padding: '12px 20px', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>
              {isEn ? 'Start application review' : '开始申请审核'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const card = {
  border: '1px solid #e2e7f0',
  borderRadius: 8,
  padding: '22px 20px',
  background: '#f8f9fc',
};

const eyebrow = {
  margin: '0 0 10px',
  color: '#b8962e',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 1.7,
  textTransform: 'uppercase',
};

const sectionTitle = {
  margin: 0,
  color: '#1a1a2e',
  fontSize: 'clamp(26px, 3.4vw, 40px)',
  lineHeight: 1.12,
  fontWeight: 850,
  letterSpacing: 0,
};

const primaryLink = {
  display: 'inline-block',
  padding: '12px 22px',
  borderRadius: 8,
  background: '#d5a836',
  color: '#172033',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};

const secondaryLink = {
  display: 'inline-block',
  padding: '11px 22px',
  borderRadius: 8,
  border: '1.5px solid rgba(255,255,255,0.35)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 800,
};

export default RefundPolicyPage;
