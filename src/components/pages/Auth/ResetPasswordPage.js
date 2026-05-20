import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

export default function ResetPasswordPage({ language }) {
  const isEn = language === 'en';
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const role = params.get('role') === 'parent' ? 'parent' : 'student';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const base = role === 'parent' ? '/api/parent' : '/api/auth';
  const loginPath = role === 'parent' ? '/parent/login' : '/login';

  async function requestReset(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API}${base}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMsg(isEn
        ? 'If that email exists, a reset link has been sent.'
        : '如果该邮箱存在，重设密码链接已寄出。');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (password.length < 8) {
      setErr(isEn ? 'Password must be at least 8 characters.' : '密码至少 8 个字元。');
      return;
    }
    if (password !== confirm) {
      setErr(isEn ? 'Passwords do not match.' : '两次密码不一致。');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}${base}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMsg(isEn ? 'Password reset. You can sign in now.' : '密码已重设。现在可以登入。');
      setPassword('');
      setConfirm('');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="content">
      <Helmet>
        <title>{isEn ? 'Reset Password' : '重设密码'} | Genesis of Ideas International School</title>
      </Helmet>
      <section style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '48px 16px', background: '#f4f6fa' }}>
        <div style={{ width: '100%', maxWidth: 430, background: '#fff', border: '1px solid #e8ecf5', borderRadius: 8, padding: 28, boxShadow: '0 18px 50px rgba(26,45,90,0.08)' }}>
          <p style={{ margin: '0 0 6px', color: '#b8962e', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {role === 'parent' ? (isEn ? 'Parent Portal' : '家长 Portal') : (isEn ? 'Student Portal' : '学生 Portal')}
          </p>
          <h1 style={{ margin: '0 0 18px', color: '#1a2d5a', fontSize: 24, fontWeight: 800 }}>
            {token ? (isEn ? 'Set a new password' : '设定新密码') : (isEn ? 'Forgot password' : '忘记密码')}
          </h1>

          {err && <div className="alert alert-danger py-2">{err}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}

          {token ? (
            <form onSubmit={resetPassword}>
              <label className="form-label small fw-semibold">{isEn ? 'New password' : '新密码'}</label>
              <input className="form-control mb-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              <label className="form-label small fw-semibold">{isEn ? 'Confirm password' : '确认密码'}</label>
              <input className="form-control mb-3" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? (isEn ? 'Saving…' : '储存中…') : (isEn ? 'Reset password' : '重设密码')}
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset}>
              <p className="small text-muted">{isEn
                ? 'Enter your account email. We will send a reset link if the account exists.'
                : '输入帐号邮箱；若帐号存在，系统会寄出重设链接。'}</p>
              <label className="form-label small fw-semibold">Email</label>
              <input className="form-control mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? (isEn ? 'Sending…' : '寄送中…') : (isEn ? 'Send reset link' : '寄送重设链接')}
              </button>
            </form>
          )}

          <p className="small text-center mb-0 mt-3">
            <Link to={loginPath}>{isEn ? 'Back to login' : '返回登入'}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
