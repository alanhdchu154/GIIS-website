import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import logoSlogan from '../../../img/logo_slogan.png';
import { setAdminSession, setStudentSession } from '../../../api/authStorage';
import { getAuthPageStrings } from '../../../i18n/siteStrings';
import { getApiBase } from '../../../config/apiBase';
import styles from './LoginPortal.module.css';

const API_BASE = getApiBase();

async function readApiJson(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(fallbackMessage);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
}

export default function LoginPortal({ language, portalRole = 'student' }) {
  const t = getAuthPageStrings(language);
  const navigate = useNavigate();
  const isEn = language === 'en';
  const isAdminPortal = portalRole === 'admin';

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    setErr('');
    if (!API_BASE) {
      setErr(t.missingApiUrl);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await readApiJson(r, t.unexpectedApiResponse);
      if (!r.ok) throw new Error(data.error || t.loginFailed);

      if (data.role === 'admin' && data.admin) {
        setAdminSession(data.admin);
        navigate(data.admin.staffRole === 'principal' ? '/admin/principal-review' : '/admin', { replace: true });
        return;
      }
      if (isAdminPortal) {
        throw new Error(isEn ? 'This account is not an admin account.' : '此帐号不是管理员帐号。');
      }
      if (data.role === 'student' && data.student) {
        setStudentSession(data.token, data.student);
        navigate('/learn', { replace: true });
        return;
      }
      throw new Error(t.unexpectedLogin);
    } catch (e) {
      setErr(e.message || t.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="content">
      <Helmet>
        <title>
          {isAdminPortal
            ? (isEn ? 'Admin portal — Sign in' : '管理员后台 — 登入')
            : (isEn ? 'Student Learn Portal — Sign in' : '学生学习入口 — 登入')}
          {' | Genesis of Ideas International School'}
        </title>
      </Helmet>
      <section className={styles.page} aria-labelledby="portal-title">
        <div className={styles.inner}>
          <header className={styles.hero}>
            <img
              src={logoSlogan}
              alt="Genesis of Ideas International School"
              className={styles.logo}
              decoding="async"
            />
            {!isAdminPortal && (
              <p className={styles.eyebrow}>{t.portalEyebrow}</p>
            )}
            <h1 id="portal-title" className={styles.title}>
              {isAdminPortal ? (isEn ? 'School admin portal' : '学校管理员后台') : t.portalTitle}
            </h1>
            <p className={styles.subtitle}>
              {isAdminPortal
                ? (isEn ? 'Sign in to review applications, payments, student records, and school operations.' : '登入以审核申请、付款、学生记录与学校运营。')
                : t.portalSubtitle}
            </p>
          </header>

          <div className={isAdminPortal ? styles.singleColumn : styles.portalGrid}>
            {!isAdminPortal && (
              <aside className={styles.infoPanel} aria-label={isEn ? 'Student portal overview' : '学生入口说明'}>
                <h2>{t.portalSupportTitle}</h2>
                <ul>
                  {t.portalHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className={styles.activationNote}>{t.portalActivationNote}</p>
                <div className={styles.accessLinks}>
                  <span>{t.portalNeedAccess}</span>
                  <Link to="/apply">{t.portalApplyCta}</Link>
                  <Link to="/consultation">{t.portalConsultCta}</Link>
                </div>
              </aside>
            )}

            <div className={styles.card}>
              <div className={styles.tabs} role="tablist" aria-label={isAdminPortal ? (isEn ? 'Admin sign-in options' : '管理员登入选项') : t.tablistAria}>
                <button
                  type="button"
                  role="tab"
                  aria-selected="true"
                  className={styles.tabActive}
                >
                  {isAdminPortal ? (isEn ? 'Admin sign in' : '管理员登入') : (isEn ? 'Student sign in' : '学生登入')}
                </button>
                {!isAdminPortal && (
                  <Link
                    to="/parent/login"
                    role="tab"
                    aria-selected="false"
                    className={styles.tabLink}
                  >
                    {isEn ? 'Parent sign in' : '家长登入'}
                  </Link>
                )}
              </div>

              {err && (
                <div className="alert alert-danger py-2 mx-3" role="alert">
                  {err}
                </div>
              )}

              <form className={styles.formBody} onSubmit={submitLogin} noValidate>
                <p className="small text-muted mb-3">
                  {isAdminPortal
                    ? (isEn ? 'Use your GIIS admin account. Student and parent accounts should use their own portals.' : '请使用 GIIS 管理员帐号。学生与家长帐号应使用各自入口。')
                    : t.signInBlurb}
                </p>
                <div className="mb-3">
                  <label className={styles.label} htmlFor="portal-email">
                    {t.email}
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    className="form-control"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className={styles.label} htmlFor="portal-password">
                    {t.password}
                  </label>
                  <input
                    id="portal-password"
                    type="password"
                    className="form-control"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? t.signingIn : t.signInCta}
                </button>
                <p className="small text-center mb-0 mt-3">
                  {isAdminPortal ? (
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {isEn
                        ? 'Password issues? Contact your school account administrator or use the staff access reset.'
                        : '密码问题？请联系学校帐号管理员或使用员工访问重置流程。'}
                    </span>
                  ) : (
                    <Link to="/reset-password?role=student">
                      {isEn ? 'Forgot password?' : '忘记密码？'}
                    </Link>
                  )}
                </p>
              </form>

          </div>
          </div>

          <p className={styles.back}>
            <Link to={isAdminPortal ? '/login' : '/'}>
              {isAdminPortal ? (isEn ? '← Student portal' : '← 学生入口') : `← ${t.backHome}`}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
