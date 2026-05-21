import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import { clearParentSession, getParentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import TranscriptContent from '../Transcript/TranscriptContent.js';

const API = getApiBase();

export default function ParentTranscriptPage({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const session = getParentSession();

  useEffect(() => {
    if (!session) {
      navigate('/parent/login', { replace: true });
    }
  }, [session, navigate]);

  if (!session) return null;

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Official Transcript' : '正式成绩单'} | GIIS Parent Portal</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>
      <div style={{ background: '#f4f6fa', minHeight: 'calc(100vh - 70px)', padding: '24px 16px 72px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#2b3d6d' }}>
                {isEn ? 'Parent Portal' : '家长面板'}
              </p>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                {isEn ? 'Official Transcript' : '正式成绩单'}
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#5c6578' }}>
                {isEn
                  ? 'This uses the same locked official PDF export format as the student and admin portal.'
                  : '这里使用与学生端、Admin 端相同的正式 PDF 汇出格式。'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/parent/dashboard" className="btn btn-outline-secondary btn-sm">
                {isEn ? 'Back to dashboard' : '返回进度面板'}
              </Link>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  fetch(`${API}/api/parent/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
                  clearParentSession();
                  navigate('/parent/login', { replace: true });
                }}
              >
                {isEn ? 'Sign out' : '退出登录'}
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e8ecf5', borderRadius: 12, padding: 16 }}>
            <TranscriptContent
              language={language}
              viewerRole="parent"
              studentId={session.studentId}
              mode="view"
              loadUrl={`${API}/api/parent/transcript`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
