import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import TranscriptContent from './TranscriptContent.js';
import { clearStudentSession, getStudentSession } from '../../../api/authStorage';
import { getAuthPageStrings } from '../../../i18n/siteStrings';

function TranscriptMain({ language }) {
  const isEn = language === 'en';
  const t = getAuthPageStrings(language);
  const session = getStudentSession();
  const navigate = useNavigate();

  return (
    <div id="content">
      <Helmet>
        <title>{isEn ? 'Transcript' : '成绩单'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={
            isEn
              ? 'Transcript and grading information for Genesis of Ideas International School students.'
              : '艾迪尔国际学校成绩单与评分说明。'
          }
        />
      </Helmet>
      <div className="container">
        {!session?.token ? (
          <div className="py-5" style={{ maxWidth: 520 }}>
            <h1 className="h5 mb-3">{isEn ? 'Transcript access' : '成绩单登入'}</h1>
            <p className="text-muted">
              {isEn
                ? 'Students: register or sign in to load and save your transcript from our server.'
                : '学生请先註冊或登入，以载入並储存你的成绩单资料。'}
            </p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Link to="/login?tab=register" className="btn btn-primary">
                {isEn ? 'Register' : '註冊'}
              </Link>
              <Link to="/login" className="btn btn-outline-primary">
                {t.signInCta}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2">
              <p className="small text-muted mb-0">
                {isEn ? 'Signed in as' : '已登入'}
                {' '}
                <strong>{session.student.email}</strong>
              </p>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  clearStudentSession();
                  navigate('/transcript', { replace: true });
                }}
              >
                {isEn ? 'Sign out' : '登出'}
              </button>
            </div>
            <TranscriptContent
              language={language}
              viewerRole="student"
              studentId={session.student.id}
              authToken={session.token}
              mode="view"
            />
            {/* authToken is passed for legacy header auth fallback; primary auth uses HttpOnly cookie */}
          </>
        )}
      </div>
    </div>
  );
}

export default TranscriptMain;
