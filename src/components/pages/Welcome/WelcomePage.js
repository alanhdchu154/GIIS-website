import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import { getParentSession } from '../../../api/authStorage';

/**
 * /welcome — landing page Stripe redirects to after a successful Checkout session.
 *
 * Flow:
 *   1. Stripe puts session_id={CHECKOUT_SESSION_ID} in the query string.
 *   2. We fetch /api/checkout/session/:id to get the sanitized session info.
 *   3. While webhook may not yet have processed it (race condition), we show a
 *      friendly "we're confirming" state. Within seconds the webhook lands and the
 *      Subscription row exists in our DB.
 *   4. We display the plan info + clear "what happens next" steps.
 *
 * Design note: this page is bilingual to match the rest of the marketing surface.
 * The content is intentionally calm — a parent who has just paid us money should
 * feel confidence, not advertised at.
 */

const PLAN_LABELS = {
  founders_monthly: {
    en: 'Self-Paced Founders · $49/month',
    zh: '自主学习创校方案 · $49/月',
  },
  self_paced_monthly: {
    en: 'Self-Paced Founders · $49/month',
    zh: '自主学习创校方案 · $49/月',
  },
  self_paced_annual: {
    en: 'Self-Paced Founders · $499/year',
    zh: '自主学习创校方案 · $499/年',
  },
  guided_monthly: {
    en: 'Guided · $149/month',
    zh: '顾问指导方案 · $149/月',
  },
  premium_monthly: {
    en: 'Premium / College Pathway · $299/month',
    zh: 'Premium / College Pathway · $299/月',
  },
  group_monthly: {
    en: 'Group Plan · inquiry-based',
    zh: '团体方案 · 咨询报价',
  },
  live_test: {
    en: 'Live mode end-to-end test · $1',
    zh: 'Live 模式端到端测试 · $1',
  },
};

export default function WelcomePage({ language }) {
  const isEn = language !== 'zh';
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const parentSession = getParentSession();

  const [state, setState] = useState({ loading: true, data: null, error: null });

  // If parent is already logged in and payment is confirmed, go straight to dashboard
  useEffect(() => {
    if (parentSession && sessionId) {
      const timer = setTimeout(() => navigate('/parent/dashboard', { replace: true }), 2500);
      return () => clearTimeout(timer);
    }
  }, [parentSession, sessionId, navigate]);

  useEffect(() => {
    if (!sessionId) {
      setState({ loading: false, data: null, error: 'no_session' });
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${getApiBase()}/api/checkout/session/${sessionId}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) setState({ loading: false, data, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, data: null, error: 'fetch_failed' });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  // ── Render branches ──
  if (state.loading) {
    return (
      <Shell isEn={isEn}>
        <p style={{ color: '#5c6578', fontSize: '15px', textAlign: 'center', margin: '40px 0' }}>
          {isEn ? 'Confirming your payment with Stripe…' : '正在向 Stripe 确认你的付款…'}
        </p>
      </Shell>
    );
  }

  if (state.error || !state.data) {
    return (
      <Shell isEn={isEn}>
        <p style={{ color: '#5c6578', fontSize: '15px', lineHeight: 1.7, margin: '24px 0' }}>
          {isEn
            ? "We couldn't read your checkout session. If you completed payment, don't worry — Stripe has the record and we'll process it within minutes. "
            : '我们读不到你的 checkout 信息。如果你已完成付款，请放心——Stripe 已有记录，我们会在几分钟内处理。'}
          {isEn ? 'You can email ' : '可以发邮件至 '}
          <a href="mailto:admissions@genesisideas.school" style={{ color: '#2b3d6d', fontWeight: 700 }}>
            admissions@genesisideas.school
          </a>
          {isEn ? ' to confirm.' : ' 确认。'}
        </p>
      </Shell>
    );
  }

  const { paymentStatus, email, planType, knownInDb } = state.data;
  const planLabel = PLAN_LABELS[planType]?.[isEn ? 'en' : 'zh'] || planType;
  const isPaid = paymentStatus === 'paid' || paymentStatus === 'no_payment_required';

  return (
    <Shell isEn={isEn}>
      <div style={{
        background: '#f4faf6',
        border: '1px solid #d3e8db',
        borderTop: '4px solid #1B6B3A',
        borderRadius: '14px',
        padding: '28px 32px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#1B6B3A', color: '#fff',
            fontSize: '16px', fontWeight: 800,
          }}>✓</span>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1B6B3A' }}>
            {isPaid
              ? (isEn ? 'Payment confirmed' : '付款确认')
              : (isEn ? 'Payment received' : '已收到付款')}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#1a3024', lineHeight: 1.7 }}>
          {isEn ? 'You purchased: ' : '你购买的方案：'}<b>{planLabel}</b>
          <br />
          {isEn ? 'Receipt sent to: ' : '收据已发送至：'}<b>{email}</b>
        </p>
      </div>

      <h2 style={{
        fontSize: '22px', fontWeight: 800, color: '#1a1a2e',
        margin: '32px 0 16px', letterSpacing: '-0.01em',
      }}>
        {isEn ? 'What happens next' : '接下来会发生什么'}
      </h2>

      <ol style={{
        listStyle: 'none', counterReset: 'step', padding: 0, margin: 0,
      }}>
        {[
          {
            en: 'If admissions has already activated your account, your parent and student login credentials are in the welcome email.',
            zh: '如果招生办公室已经启用账号，你的家长与学生登录凭据会在欢迎信里。',
          },
          {
            en: 'A GIIS advisor will reach out to schedule a short onboarding call to help your child choose the right academic pathway.',
            zh: 'GIIS 顾问会联系你，安排一次简短的入学通话，帮助你的孩子选择合适的学习路径。',
          },
          {
            en: 'Your child can start their first lesson immediately — visit /learn after logging in.',
            zh: '你的孩子可以立即开始第一节课——登录后访问 /learn。',
          },
          {
            en: '30-day no-questions refund: if it\'s not the right fit within the first 30 days, email us and we\'ll refund in full.',
            zh: '30 天无条件退款：如果前 30 天发现不合适，发邮件给我们即可全额退款。',
          },
        ].map((step, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            padding: '14px 0', borderBottom: '1px solid #eef0f6',
            fontSize: '14px', color: '#3a4250', lineHeight: 1.65,
          }}>
            <span style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '50%',
              background: '#2b3d6d', color: '#fff',
              fontSize: '12px', fontWeight: 800,
            }}>{i + 1}</span>
            <span>{isEn ? step.en : step.zh}</span>
          </li>
        ))}
      </ol>

      {!knownInDb && (
        <p style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: '#fffaeb',
          border: '1px solid #f3d97a',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#8a6a14',
          lineHeight: 1.55,
        }}>
          {isEn
            ? '⚙ Your payment is reaching our system right now. This message will disappear once everything is synced (usually within 30 seconds).'
            : '⚙ 你的付款正在同步到我们的系统。这条提示在同步完成后会消失（通常 30 秒内）。'}
        </p>
      )}

      <div style={{
        marginTop: '36px',
        display: 'flex', gap: '12px', flexWrap: 'wrap',
      }}>
        <Link to="/parent/demo" style={{
          padding: '12px 24px', borderRadius: '8px',
          background: '#2b3d6d', color: '#fff',
          fontWeight: 700, fontSize: '14px', textDecoration: 'none',
        }}>
          {isEn ? 'Preview parent dashboard' : '预览家长面板'}
        </Link>
        <Link to="/" style={{
          padding: '12px 24px', borderRadius: '8px',
          border: '2px solid #d4d8e0', color: '#2b3d6d',
          fontWeight: 700, fontSize: '14px', textDecoration: 'none',
        }}>
          {isEn ? 'Back to home' : '回首页'}
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ isEn, children }) {
  return (
    <>
      <Helmet>
        <title>{isEn ? 'Welcome to GIIS' : '欢迎加入 GIIS'} | Genesis of Ideas International School</title>
      </Helmet>
      <div style={{
        background: '#f4f6fa',
        minHeight: 'calc(100vh - 120px)',
        padding: '60px 24px 80px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          maxWidth: '680px', margin: '0 auto',
          background: '#fff',
          borderRadius: '16px',
          padding: '40px 44px',
          boxShadow: '0 12px 32px rgba(26, 26, 46, 0.08)',
          border: '1px solid #e8ecf5',
        }}>
          <p style={{
            color: '#2b3d6d',
            fontSize: '12px', fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase',
            margin: '0 0 12px',
          }}>
            {isEn ? 'Welcome to GIIS' : '欢迎加入 GIIS'}
          </p>
          <h1 style={{
            fontSize: 'clamp(28px, 3.6vw, 38px)', fontWeight: 800,
            color: '#1a1a2e', lineHeight: 1.1,
            margin: '0 0 24px', letterSpacing: '-0.01em',
          }}>
            {isEn ? "You're in. 🎉" : '你已加入。🎉'}
          </h1>
          {children}
        </div>
      </div>
    </>
  );
}
