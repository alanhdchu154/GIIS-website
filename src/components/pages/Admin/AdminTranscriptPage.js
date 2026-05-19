import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import TranscriptContent from '../Transcript/TranscriptContent.js';
import { getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { getCurrentAcademicYear } from '../../../config/schoolCalendar.js';

const API = getApiBase();
const CREDITS_REQUIRED = 24;
const currentYear = getCurrentAcademicYear();
const CEREMONY_DATE = currentYear.graduation?.ceremonyDate ?? null;
const SPRING_END = currentYear.spring?.ends ?? null;

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

function ParentEmailSection({ studentId, isEn }) {
  const [parentEmail, setParentEmail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/api/students/${studentId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setParentEmail(d.student?.parentEmail ?? null); })
      .catch(() => {});
  }, [studentId]);

  async function handleSave(e) {
    e.preventDefault();
    setMsg('');
    const trimmed = draft.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMsg(isEn ? 'Invalid email address.' : '邮箱格式不正确。');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentEmail: trimmed || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setParentEmail(trimmed || null);
      setEditing(false);
      setMsg(isEn ? '✓ Parent email saved.' : '✓ 家长邮箱已储存。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-semibold small">{isEn ? 'Parent Portal Email' : '家长 Portal 邮箱'}</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditing((v) => !v); setDraft(parentEmail || ''); setMsg(''); }}>
          {editing ? (isEn ? 'Cancel' : '取消') : parentEmail ? (isEn ? 'Edit' : '编辑') : (isEn ? '+ Set email' : '＋ 设定邮箱')}
        </button>
      </div>
      <p className="small text-muted mb-2">
        {parentEmail
          ? <><span className="badge bg-success me-1">✓</span>{parentEmail}</>
          : <span className="text-warning fw-semibold">{isEn ? 'No parent email — parent cannot log in yet.' : '尚未设定家长邮箱，家长无法登入。'}</span>}
      </p>
      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
      {editing && (
        <form onSubmit={handleSave} className="mt-2">
          <div className="mb-2">
            <label className="form-label small mb-1">{isEn ? 'Parent Email' : '家长邮箱'}</label>
            <input type="email" className="form-control form-control-sm" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="parent@example.com" autoFocus />
            <div className="form-text">{isEn ? 'Clear to remove.' : '清空以删除。'}</div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? (isEn ? 'Saving…' : '储存中…') : (isEn ? 'Save' : '储存')}
          </button>
        </form>
      )}
    </div>
  );
}

function GraduationSection({ studentId }) {
  const [student, setStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/api/students/${studentId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStudent(d.student ?? null))
      .catch(() => setStudent({}));
  }, [studentId]);

  async function patch(graduationDate) {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(`${API}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ graduationDate }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setStudent((s) => ({ ...s, graduationDate: graduationDate ?? null }));
      setMsg(graduationDate ? '✓ Marked as graduated.' : '✓ Graduation date cleared.');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  if (!student) return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <p className="small text-muted mb-0">Loading graduation info…</p>
    </div>
  );

  // Credits from transcript CourseRows (authoritative source — used for college apps)
  const credits = (student.semesters || []).reduce((total, sem) =>
    total + (sem.courseRows || []).reduce((s, row) =>
      row.letterGrade && row.letterGrade.trim() ? s + Number(row.credits || 0) : s, 0), 0);
  const isEligible = credits >= CREDITS_REQUIRED;
  const isGraduated = !!student.graduationDate;
  const pct = Math.min(100, (credits / CREDITS_REQUIRED) * 100);

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold small">Graduation Eligibility</span>
        {isGraduated && (
          <button className="btn btn-sm btn-outline-danger" onClick={() => patch(null)} disabled={saving}>
            Clear date
          </button>
        )}
      </div>

      {/* Credits progress */}
      <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <span className="small text-muted">Credits earned</span>
          <span className="small fw-bold" style={{ color: isEligible ? '#1b5e20' : '#b71c1c' }}>
            {credits % 1 === 0 ? credits : credits.toFixed(1)} / {CREDITS_REQUIRED}
            {isEligible ? '  ✓ Eligible' : `  — need ${(CREDITS_REQUIRED - credits).toFixed(1)} more`}
          </span>
        </div>
        <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '6px' }}>
          <div style={{ width: `${pct}%`, background: isEligible ? '#2e7d32' : '#1a2d5a', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Calendar dates */}
      {(SPRING_END || CEREMONY_DATE) && (
        <div className="mb-2 p-2 rounded" style={{ background: '#f4f6fa', fontSize: '12px', color: '#555' }}>
          {SPRING_END && <div>Credits must be completed by <strong>{fmtDate(SPRING_END)}</strong> (spring term end)</div>}
          {CEREMONY_DATE && <div>Graduation ceremony: <strong>{fmtDate(CEREMONY_DATE)}</strong></div>}
        </div>
      )}

      {/* Graduation status */}
      {isGraduated ? (
        <p className="small mb-2">
          <span className="badge bg-success me-1">✓ Graduated</span>
          <span className="text-muted">{fmtDate(student.graduationDate)}</span>
        </p>
      ) : (
        <p className="small text-muted mb-2">Not yet marked as graduated.</p>
      )}

      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}

      {!isGraduated && CEREMONY_DATE && (
        <button
          className={`btn btn-sm ${isEligible ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => patch(CEREMONY_DATE)}
          disabled={saving || !isEligible}
          title={!isEligible ? `Student needs ${(CREDITS_REQUIRED - credits).toFixed(1)} more credits` : ''}
        >
          {saving ? 'Saving…' : `✓ Mark as Graduated — ${fmtDate(CEREMONY_DATE)}`}
        </button>
      )}
      {!isEligible && !isGraduated && (
        <p className="small text-muted mt-1 mb-0">Button unlocks when student reaches {CREDITS_REQUIRED} credits.</p>
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
        <p className="mb-2 d-flex gap-3 flex-wrap align-items-center">
          <Link to="/admin">{copy.back}</Link>
          {studentId ? (
            <Link to={`/admin/students/${studentId}/audit-trail`} className="small">
              {isEn ? 'View activity audit trail →' : '查看学习活动审计 →'}
            </Link>
          ) : null}
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
        <ParentEmailSection studentId={studentId} isEn={isEn} />
        <GraduationSection studentId={studentId} />

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
