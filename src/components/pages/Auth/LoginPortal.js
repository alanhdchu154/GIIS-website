import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logoSlogan from '../../../img/logo_slogan.png';
import { setAdminSession, setStudentSession } from '../../../api/authStorage';
import { getAuthPageStrings } from '../../../i18n/siteStrings';
import { getApiBase } from '../../../config/apiBase';
import styles from './LoginPortal.module.css';

const API_BASE = getApiBase();

function emptyRegisterForm() {
  return {
    name: '',
    email: '',
    password: '',
    birthDate: '',
    gender: 'Female',
    parentGuardian: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
  };
}

export default function LoginPortal({ language }) {
  const t = getAuthPageStrings(language);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const tabFromUrl = 'signin'; // registration is admin-only; self-register is disabled
  const [tab, setTab] = useState(tabFromUrl);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [reg, setReg] = useState(emptyRegisterForm);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  function setRegField(key, value) {
    setReg((prev) => ({ ...prev, [key]: value }));
  }

  function selectTab(next) {
    setTab(next);
    setErr('');
    if (next === 'register') {
      setSearchParams({ tab: 'register' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

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
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || t.loginFailed);

      if (data.role === 'admin' && data.admin) {
        setAdminSession(data.admin);
        navigate('/admin', { replace: true });
        return;
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

  async function submitRegister(e) {
    e.preventDefault();
    setErr('');
    if (!API_BASE) {
      setErr(t.missingApiUrl);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: reg.name.trim(),
          email: reg.email.trim(),
          password: reg.password,
          birthDate: reg.birthDate,
          gender: reg.gender,
          parentGuardian: reg.parentGuardian.trim(),
          address: reg.address.trim(),
          city: reg.city.trim(),
          province: reg.province.trim(),
          zipCode: reg.zipCode.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || t.registerFailed);
      setStudentSession(data.token, data.student);
      navigate('/transcript', { replace: true });
    } catch (e) {
      setErr(e.message || t.registerFailed);
    } finally {
      setLoading(false);
    }
  }

  const isEn = language === 'en';

  return (
    <div id="content">
      <Helmet>
        <title>
          {isEn ? 'Student portal — Sign in' : '学生专区 — 登入'}
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
            <h1 id="portal-title" className={styles.title}>
              {t.portalTitle}
            </h1>
            <p className={styles.subtitle}>{t.portalSubtitle}</p>
          </header>

          <div className={styles.card}>
            <div className={styles.tabs} role="tablist" aria-label={t.tablistAria}>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'signin'}
                className={tab === 'signin' ? styles.tabActive : styles.tab}
                onClick={() => selectTab('signin')}
              >
                {t.tabSignIn}
              </button>
            </div>

            {err && (
              <div className="alert alert-danger py-2 mx-3" role="alert">
                {err}
              </div>
            )}

            {tab === 'signin' && (
              <form className={styles.formBody} onSubmit={submitLogin} noValidate>
                <p className="small text-muted mb-3">{t.signInBlurb}</p>
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
              </form>
            )}

            {tab === 'register' && (
              <form className={styles.formBody} onSubmit={submitRegister} noValidate>
                <p className="small text-muted mb-2">{t.registerBlurb}</p>
                <p className="small text-muted mb-3">{t.registerRequiredNote}</p>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className={styles.label} htmlFor="reg-name">
                      {t.displayName} *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      className="form-control"
                      value={reg.name}
                      onChange={(e) => setRegField('name', e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className={styles.label} htmlFor="reg-birth">
                      {t.birthDate} *
                    </label>
                    <input
                      id="reg-birth"
                      type="date"
                      className="form-control"
                      value={reg.birthDate}
                      onChange={(e) => setRegField('birthDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className={styles.label} htmlFor="reg-gender">
                      {t.gender} *
                    </label>
                    <select
                      id="reg-gender"
                      className="form-select"
                      value={reg.gender}
                      onChange={(e) => setRegField('gender', e.target.value)}
                    >
                      <option value="Female">{t.genderFemale}</option>
                      <option value="Male">{t.genderMale}</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className={styles.label} htmlFor="reg-parent">
                      {t.parentGuardian} *
                    </label>
                    <input
                      id="reg-parent"
                      type="text"
                      className="form-control"
                      value={reg.parentGuardian}
                      onChange={(e) => setRegField('parentGuardian', e.target.value)}
                      autoComplete="section-parent name"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className={styles.label} htmlFor="reg-address">
                      {t.address} *
                    </label>
                    <input
                      id="reg-address"
                      type="text"
                      className="form-control"
                      value={reg.address}
                      onChange={(e) => setRegField('address', e.target.value)}
                      autoComplete="street-address"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className={styles.label} htmlFor="reg-city">
                      {t.city} *
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      className="form-control"
                      value={reg.city}
                      onChange={(e) => setRegField('city', e.target.value)}
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className={styles.label} htmlFor="reg-province">
                      {t.province} *
                    </label>
                    <input
                      id="reg-province"
                      type="text"
                      className="form-control"
                      value={reg.province}
                      onChange={(e) => setRegField('province', e.target.value)}
                      autoComplete="address-level1"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className={styles.label} htmlFor="reg-zip">
                      {t.zipCode}
                    </label>
                    <input
                      id="reg-zip"
                      type="text"
                      className="form-control"
                      value={reg.zipCode}
                      onChange={(e) => setRegField('zipCode', e.target.value)}
                      autoComplete="postal-code"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className={styles.label} htmlFor="reg-email">
                      {t.email} *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      className="form-control"
                      value={reg.email}
                      onChange={(e) => setRegField('email', e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className={styles.label} htmlFor="reg-password">
                      {t.password} *
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      className="form-control"
                      value={reg.password}
                      onChange={(e) => setRegField('password', e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <div className={styles.hint}>{t.passwordHint}</div>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? t.creating : t.createAccount}
                </button>
              </form>
            )}
          </div>

          <p className={styles.back}>
            <Link to="/">← {t.backHome}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
