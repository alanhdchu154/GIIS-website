import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import TranscriptContent from '../Transcript/TranscriptContent.js';
import { getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

function LoginSection({ studentId, isEn }) {
  const [loginEmail, setLoginEmail] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/students/${studentId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setLoginEmail(d.student?.loginEmail ?? null);
        if (d.student?.loginEmail) setForm((f) => ({ ...f, email: d.student.loginEmail }));
      })
      .catch(() => {});
  }, [studentId]);

  async function handleSave(e) {
    e.preventDefault();
    setMsg('');
    if (!form.email.trim() || !form.password) { setMsg(isEn ? 'Email and password are required.' : 'Email 与密码为必填。'); return; }
    if (form.password.length < 8) { setMsg(isEn ? 'Password must be at least 8 characters.' : '密码至少 8 个字元。'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/students/${studentId}/login`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setLoginEmail(d.email);
      setForm((f) => ({ ...f, password: '' }));
      setShowForm(false);
      setMsg(isEn ? '✓ Login credentials saved.' : '✓ 登入帐号已储存。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-semibold small">{isEn ? 'Login Account' : '登入帐号'}</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setShowForm((v) => !v); setMsg(''); }}>
          {showForm ? (isEn ? 'Cancel' : '取消') : loginEmail ? (isEn ? 'Reset credentials' : '重设帐号') : (isEn ? '+ Set login' : '＋ 设定帐号')}
        </button>
      </div>
      <p className="small text-muted mb-2">
        {loginEmail
          ? <><span className="badge bg-success me-1">✓</span>{loginEmail}</>
          : <span className="text-warning fw-semibold">{isEn ? 'No login set — student cannot sign in yet.' : '尚未设定帐号，学生无法登入。'}</span>}
      </p>
      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
      {showForm && (
        <form onSubmit={handleSave} className="mt-2">
          <div className="mb-2">
            <label className="form-label small mb-1">Email</label>
            <input type="email" className="form-control form-control-sm" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="mb-2">
            <label className="form-label small mb-1">{isEn ? 'New Password' : '新密码'}</label>
            <input type="password" className="form-control form-control-sm" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={isEn ? 'Min. 8 characters' : '至少 8 个字元'} minLength={8} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? (isEn ? 'Saving…' : '储存中…') : (isEn ? 'Save' : '储存')}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminTranscriptPage({ language }) {
  const { studentId } = useParams();
  const session = getAdminSession();
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const isEn = language === 'en';
  const copy = {
    back: isEn ? '← Back to student list' : '← 返回学生列表',
    modeLabel: isEn ? 'Mode:' : '模式：',
    view: isEn ? 'View' : '检视',
    edit: isEn ? 'Edit' : '编辑',
    hintView: isEn ? 'Use View for export/submission.' : '提交／汇出请用「检视」。',
    hintEdit: isEn ? 'Save only appears in Edit.' : '只有「编辑」才会显示储存。',
  };

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div id="content">
      <Helmet>
        <title>Admin — Transcript | Genesis of Ideas International School</title>
      </Helmet>
      <div className="container-fluid py-2">
        <p className="mb-2">
          <Link to="/admin">{copy.back}</Link>
        </p>
        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span className="small text-muted">{copy.modeLabel}</span>
          <div className="btn-group" role="group" aria-label="Transcript mode">
            <button
              type="button"
              className={`btn btn-sm ${mode === 'view' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMode('view')}
            >
              {copy.view}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'edit' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMode('edit')}
            >
              {copy.edit}
            </button>
          </div>
          <span className="small text-muted">
            {mode === 'view' ? copy.hintView : copy.hintEdit}
          </span>
        </div>

        <LoginSection studentId={studentId} isEn={isEn} />

        <TranscriptContent
          language={language}
          viewerRole="admin"
          studentId={studentId}
          mode={mode}
        />
      </div>
    </div>
  );
}
