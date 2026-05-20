import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import { getApiBase } from '../../../config/apiBase';
import { getParentSession, setParentSession } from '../../../api/authStorage';

const API = getApiBase();

export default function ParentLogin({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getParentSession()) navigate('/parent/dashboard', { replace: true });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/parent/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      setParentSession({ studentId: data.studentId, email: email.trim().toLowerCase() });
      navigate('/parent/dashboard', { replace: true });
    } catch {
      setError(isEn ? 'Network error — please try again.' : '网络错误，请重试。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Parent Login' : '家长登录'} | Genesis of Ideas International School</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div style={{
        minHeight: 'calc(100vh - 70px)',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '2px solid rgba(213,168,54,0.7)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#d5a836', marginBottom: 16,
            }}>G</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>
              {isEn ? 'Parent Portal' : '家长入口'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
              {isEn ? 'Sign in to view your child\'s progress' : '登录后查看孩子的学习进度'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          }}>
            {error && (
              <div style={{
                background: '#fff3f3', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#b91c1c',
              }}>
                {error}
              </div>
            )}

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5c6578', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {isEn ? 'Email' : '电子邮件'}
              </span>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder={isEn ? 'parent@example.com' : '家长邮箱'}
                style={{
                  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1.5px solid #d4d8e0', borderRadius: 8, fontSize: 14,
                  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5c6578', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {isEn ? 'Password' : '密码'}
              </span>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1.5px solid #d4d8e0', borderRadius: 8, fontSize: 14,
                  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </label>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10,
                background: loading ? '#9baac8' : '#2b3d6d',
                color: '#fff', fontWeight: 700, fontSize: 15,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? (isEn ? 'Signing in…' : '登录中…') : (isEn ? 'Sign In' : '登录')}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5c6578' }}>
              <Link to="/reset-password?role=parent" style={{ color: '#2b3d6d', fontWeight: 600 }}>
                {isEn ? 'Forgot password?' : '忘记密码？'}
              </Link>
            </p>

            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#5c6578' }}>
              {isEn ? "Don't have an account? " : '还没有账号？'}
              <a href={`mailto:admissions@genesisideas.school?subject=${encodeURIComponent('Parent Account Setup')}`}
                style={{ color: '#2b3d6d', fontWeight: 600 }}>
                {isEn ? 'Contact us' : '联系我们'}
              </a>
            </p>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            {isEn ? 'Looking for the student portal? ' : '要去学生入口？'}
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
              {isEn ? 'Student login' : '学生登录'}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
