import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

export default function InterestConfirmationPage({ language }) {
  const isEn = language !== 'zh';
  const T = (en, zh) => (isEn ? en : zh);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState(token ? 'loading' : 'invalid_or_expired');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    fetch(`${API}/api/applications/confirm-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((response) => response.json().catch(() => ({})))
      .then((data) => setState(data.state === 'confirmed' ? 'confirmed' : 'invalid_or_expired'))
      .catch(() => setState('invalid_or_expired'));
  }, [token]);

  const confirmed = state === 'confirmed';
  return (
    <>
      <Helmet><title>{T('Application Confirmation', '申请确认')} | GIIS</title></Helmet>
      <div style={{ minHeight: 'calc(100vh - 140px)', background: '#f4f6fa', padding: '64px 20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', background: '#fff', border: '1px solid #e1e7f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: '#1a1a2e', padding: '28px 30px' }}>
            <p style={{ color: '#d5a836', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>Genesis of Ideas International School</p>
            <h1 style={{ color: '#fff', fontSize: 26, lineHeight: 1.2, margin: 0, letterSpacing: 0 }}>
              {state === 'loading'
                ? T('Confirming your application…', '正在确认您的申请…')
                : confirmed
                  ? T('Interest confirmed', '已确认继续申请')
                  : T('This confirmation link is unavailable', '此确认链接无法使用')}
            </h1>
          </div>
          <div style={{ padding: '28px 30px', color: '#394255', fontSize: 14, lineHeight: 1.75 }}>
            {state === 'loading' ? (
              <p style={{ margin: 0 }}>{T('Please wait a moment.', '请稍候。')}</p>
            ) : confirmed ? (
              <>
                <p>{T(
                  'Thank you. The application is now in the admissions review queue. GIIS will contact the parent email on the application.',
                  '谢谢。申请现已进入招生审核队列，GIIS 会通过申请表中的家长邮箱联系您。'
                )}</p>
                <p>{T(
                  'This confirmation does not guarantee admission, transfer credit, grade placement, or a graduation date. Those decisions require human review and, for transfer credit, verified official records.',
                  '本次确认不代表保证录取、转学分、年级安排或毕业日期。相关决定仍须经过人工审核；转学分还需要核验正式记录。'
                )}</p>
              </>
            ) : (
              <p>{T(
                'The link may be expired, already replaced by a newer confirmation email, or incomplete. Submit the application again with the same parent email to receive a fresh link; GIIS will keep the existing case instead of creating a duplicate.',
                '链接可能已过期、已被更新的确认邮件取代，或内容不完整。请使用相同家长邮箱重新提交申请以取得新链接；GIIS 会保留原案件，不会建立重复申请。'
              )}</p>
            )}
            <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/" style={{ background: '#2b3d6d', color: '#fff', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 800 }}>{T('Return to GIIS', '返回 GIIS')}</Link>
              {!confirmed && <Link to="/apply" style={{ border: '1px solid #2b3d6d', color: '#2b3d6d', padding: '9px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 800 }}>{T('Open application', '打开申请表')}</Link>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
