import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import logoSlogan from '../../../img/logo_slogan.png';

const API = getApiBase();

function formatDate(iso, locale) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}

const STAGE_LABEL_ZH = {
  awaiting_confirmation: '等待确认',
  records_review: '记录审核中',
  admissions_review: '招生审核中',
  approved: '已批准 — 注册进行中',
  enrolled: '已注册',
  closed: '申请已关闭',
};

const STAGE_NEXT_ZH = {
  awaiting_confirmation: '请检查您的邮箱并点击确认链接。',
  records_review: '我们的团队将会联系您有关正式记录的事宜。',
  admissions_review: '我们的招生团队正在审核您的申请，我们将很快与您联系。',
  approved: '您的注册正在完成中，请检查您的邮箱获取帐号详情。',
  enrolled: '请登入学生入口开始课程学习。',
  closed: '请联系 admissions@genesisideas.school 获取帮助。',
};

const STAGE_COLORS = {
  awaiting_confirmation: { bg: '#fef3c7', fg: '#92400e' },
  records_review: { bg: '#e0f2fe', fg: '#075985' },
  admissions_review: { bg: '#eff6ff', fg: '#1d4ed8' },
  approved: { bg: '#dcfce7', fg: '#166534' },
  enrolled: { bg: '#dcfce7', fg: '#166534' },
  closed: { bg: '#fee2e2', fg: '#991b1b' },
};

const RECORDS_STATUS_ZH = {
  not_requested: '尚未要求',
  requested: '已要求',
  partial: '已收到部分资料',
  received: '已收到',
  verified: '已核实',
};

const card = {
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #e1e7f0',
  overflow: 'hidden',
};

const cardHeader = {
  background: '#1a1a2e',
  padding: '24px 28px',
};

const cardBody = {
  padding: '24px 28px',
  color: '#394255',
  fontSize: 14,
  lineHeight: 1.75,
};

const eyebrow = {
  color: '#d5a836',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 2,
  textTransform: 'uppercase',
  margin: '0 0 6px',
};

const cardTitle = {
  color: '#fff',
  fontSize: 22,
  margin: 0,
};

const btnPrimary = {
  background: '#2b3d6d',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: 13,
};

const btnOutline = {
  border: '1px solid #2b3d6d',
  color: '#2b3d6d',
  padding: '9px 16px',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
};

const btnGhost = {
  border: '1px solid #d4d8e0',
  color: '#5c6578',
  padding: '9px 16px',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
};

export default function ApplicationStatusPage({ language }) {
  const isEn = language !== 'zh';
  const T = (en, zh) => (isEn ? en : zh);

  const [uiState, setUiState] = useState('init'); // init | loading | no_token | invalid | unavailable | found
  const [statusData, setStatusData] = useState(null);
  const started = useRef(false);
  const tokenRef = useRef(null);

  const loadStatus = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) {
      setUiState('no_token');
      return;
    }
    setUiState('loading');
    try {
      const response = await fetch(`${API}/api/applications/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.state === 'unavailable') {
        setUiState('unavailable');
        return;
      }
      if (result?.state === 'found') {
        tokenRef.current = null;
        setStatusData(result);
        setUiState('found');
      } else if (result?.state === 'invalid') {
        tokenRef.current = null;
        setUiState('invalid');
      } else {
        setUiState('unavailable');
      }
    } catch {
      // Keep the credential in memory only so a transient failure can be retried.
      setUiState('unavailable');
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = window.location.hash;
    const match = hash.match(/[#&]token=([A-Za-z0-9_-]{32,200})/);
    const token = match ? match[1] : null;

    // Remove fragment immediately — token must not persist in address bar or be
    // sent as a Referer header on subsequent navigations
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      // replaceState may throw in sandboxed iframes; token is still in memory only
    }

    if (!token) {
      setUiState('no_token');
      return;
    }

    tokenRef.current = token;
    void loadStatus();
  }, [loadStatus]);

  const stageCode = statusData?.stage?.code;
  const stageColor = STAGE_COLORS[stageCode] || STAGE_COLORS.admissions_review;
  const stageLabel = statusData?.stage
    ? (isEn ? statusData.stage.label : (STAGE_LABEL_ZH[stageCode] || statusData.stage.label))
    : '';
  const nextStepText = statusData
    ? (isEn ? statusData.nextStep : (STAGE_NEXT_ZH[stageCode] || statusData.nextStep))
    : '';
  const recordsLabel = statusData?.recordsStatus
    ? (isEn
      ? statusData.recordsStatus.label
      : (RECORDS_STATUS_ZH[statusData.recordsStatus.code] || statusData.recordsStatus.label))
    : '—';
  const dateLocale = isEn ? 'en-US' : 'zh-CN';

  return (
    <>
      <Helmet>
        <title>{T('Application Status', '申请状态')} | GIIS</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>

      <div style={{ minHeight: '100vh', background: '#f4f6fa', padding: '48px 20px 64px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img
              src={logoSlogan}
              alt="Genesis of Ideas International School"
              style={{ maxHeight: 44, width: 'auto' }}
              decoding="async"
            />
          </div>

          {uiState === 'init' && (
            <div style={{ ...card, ...cardBody, minHeight: 80 }} />
          )}

          {uiState === 'loading' && (
            <div style={card}>
              <div style={cardHeader}>
                <p style={eyebrow}>Genesis of Ideas International School</p>
                <h1 style={cardTitle}>{T('Checking your application…', '正在查询您的申请…')}</h1>
              </div>
              <div style={cardBody}>
                <p style={{ margin: 0 }}>{T('Please wait a moment.', '请稍候。')}</p>
              </div>
            </div>
          )}

          {/* Shown after fragment is removed on refresh — honest about what happened */}
          {uiState === 'no_token' && (
            <div style={card}>
              <div style={cardHeader}>
                <p style={eyebrow}>Genesis of Ideas International School</p>
                <h1 style={cardTitle}>{T('Reopen the link from your email', '请从邮件中重新打开链接')}</h1>
              </div>
              <div style={cardBody}>
                <p style={{ margin: '0 0 14px' }}>
                  {T(
                    'This page requires the secure link from your GIIS email. The link token is removed from the address bar after the first open — navigating directly here, using a bookmark, or sharing this URL will not show your status.',
                    '此页面需要通过 GIIS 邮件中的安全链接访问。首次打开后链接标记已从网址移除——直接访问此网址、使用书签或分享此地址将无法显示申请状态。',
                  )}
                </p>
                <p style={{ margin: '0 0 20px' }}>
                  {T(
                    'Please reopen the status email from GIIS. If you cannot find it, contact admissions to request a new link.',
                    '请重新打开 GIIS 发送的状态邮件。如果找不到，请联系招生部门申请新链接。',
                  )}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href="mailto:admissions@genesisideas.school" style={btnPrimary}>
                    {T('Contact admissions', '联系招生部门')}
                  </a>
                  <Link to="/apply" style={btnOutline}>
                    {T('Start new application', '开始新申请')}
                  </Link>
                  <Link to="/admission" style={btnGhost}>
                    {T('Admissions info', '招生信息')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {uiState === 'invalid' && (
            <div style={card}>
              <div style={cardHeader}>
                <p style={eyebrow}>Genesis of Ideas International School</p>
                <h1 style={cardTitle}>{T('This status link is no longer valid', '此状态链接已失效')}</h1>
              </div>
              <div style={cardBody}>
                <p style={{ margin: '0 0 14px' }}>
                  {T(
                    'The link is invalid or has been replaced by a newer one. Contact GIIS admissions to request a fresh status link.',
                    '此链接无效，或已被更新链接替换。请联系 GIIS 招生部门申请新链接。',
                  )}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href="mailto:admissions@genesisideas.school" style={btnPrimary}>
                    {T('Contact admissions', '联系招生部门')}
                  </a>
                  <Link to="/apply" style={btnOutline}>
                    {T('Open application', '打开申请表')}
                  </Link>
                  <Link to="/admission" style={btnGhost}>
                    {T('Admissions info', '招生信息')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {uiState === 'unavailable' && (
            <div style={card}>
              <div style={cardHeader}>
                <p style={eyebrow}>Genesis of Ideas International School</p>
                <h1 style={cardTitle}>{T('Status temporarily unavailable', '暂时无法查询状态')}</h1>
              </div>
              <div style={cardBody}>
                <p style={{ margin: '0 0 18px' }}>
                  {T(
                    'We could not check your application right now. Your secure link is still available in this tab; please try again.',
                    '目前无法查询您的申请。安全链接仍保留在此分页的记忆体中，请重试。',
                  )}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={loadStatus}
                    style={{ ...btnPrimary, border: 'none', cursor: 'pointer' }}
                  >
                    {T('Try again', '重试')}
                  </button>
                  <a href="mailto:admissions@genesisideas.school" style={btnOutline}>
                    {T('Contact admissions', '联系招生部门')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {uiState === 'found' && statusData && (
            <div style={card}>
              <div style={{ ...cardHeader, paddingBottom: 20 }}>
                <p style={eyebrow}>Genesis of Ideas International School</p>
                <h1 style={{ ...cardTitle, marginBottom: 12 }}>{T('Application status', '申请状态')}</h1>
                <span style={{
                  display: 'inline-block',
                  background: stageColor.bg,
                  color: stageColor.fg,
                  fontWeight: 800,
                  fontSize: 12,
                  borderRadius: 6,
                  padding: '4px 10px',
                }}>
                  {stageLabel}
                </span>
              </div>

              <div style={cardBody}>
                {/* Next step */}
                <div style={{ background: '#f0f4ff', border: '1px solid #c7d4f8', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: '#2b3d6d', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 5px' }}>
                    {T('Next step', '下一步')}
                  </p>
                  <p style={{ margin: 0, color: '#26324f', fontSize: 13.5, lineHeight: 1.55 }}>{nextStepText}</p>
                </div>

                {/* Detail tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: '#f8f9fc', border: '1px solid #e8ecf5', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#888', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {T('Submitted', '提交日期')}
                    </p>
                    <p style={{ fontSize: 13, color: '#1a1d24', margin: 0 }}>
                      {formatDate(statusData.submittedAt, dateLocale)}
                    </p>
                  </div>
                  <div style={{ background: '#f8f9fc', border: '1px solid #e8ecf5', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#888', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {T('Last updated', '最近更新')}
                    </p>
                    <p style={{ fontSize: 13, color: '#1a1d24', margin: 0 }}>
                      {formatDate(statusData.updatedAt, dateLocale)}
                    </p>
                  </div>
                  <div style={{ background: '#f8f9fc', border: '1px solid #e8ecf5', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#888', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {T('Records status', '记录状态')}
                    </p>
                    <p style={{ fontSize: 13, color: '#1a1d24', margin: 0 }}>{recordsLabel}</p>
                  </div>
                  <div style={{ background: '#f8f9fc', border: '1px solid #e8ecf5', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#888', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {T('Parent confirmation', '家长确认')}
                    </p>
                    <p style={{
                      fontSize: 13,
                      color: statusData.interestConfirmed ? '#166534' : '#92400e',
                      fontWeight: 700,
                      margin: 0,
                    }}>
                      {statusData.interestConfirmed ? T('Confirmed', '已确认') : T('Pending', '待确认')}
                    </p>
                  </div>
                </div>

                {/* Account ready notice */}
                {statusData.accountsReady && (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#166534', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {T('Account ready', '帐号已就绪')}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                      {T(
                        'Your student and parent portal accounts have been created. Check your email for login details.',
                        '学生和家长入口帐号已创建，请检查邮箱获取登入信息。',
                      )}
                    </p>
                  </div>
                )}

                {/* Disclaimer */}
                <p style={{ fontSize: 12, color: '#7a8394', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {T(
                    'This status reflects information on file with GIIS. It does not guarantee admission, transfer credit, grade placement, or a graduation date. Those decisions require human review.',
                    '此状态反映 GIIS 文件中的信息，不代表保证录取、转学分、年级安排或毕业日期。相关决定仍须经过人工审核。',
                  )}
                </p>

                {/* Support links */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #f0f2f8' }}>
                  <a href="mailto:admissions@genesisideas.school" style={btnPrimary}>
                    {T('Contact admissions', '联系招生部门')}
                  </a>
                  <Link to="/admission" style={btnOutline}>
                    {T('Admissions info', '招生信息')}
                  </Link>
                  <Link to="/apply" style={btnGhost}>
                    {T('Application form', '申请表')}
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
