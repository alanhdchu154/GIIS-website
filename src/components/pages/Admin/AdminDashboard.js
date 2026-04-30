import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';

const API_BASE = getApiBase();

function getStudentStatus(s) {
  if (s.withdrawalDate) return 'withdrawn';
  if (s.graduationDate && new Date(s.graduationDate) < new Date()) return 'graduated';
  return 'enrolled';
}

const STATUS_BADGE = {
  enrolled:  { label: { en: 'Enrolled',  zh: '在籍' },  bg: '#198754' },
  graduated: { label: { en: 'Graduated', zh: '毕业' },  bg: '#0d6efd' },
  withdrawn: { label: { en: 'Withdrawn', zh: '退学' },  bg: '#dc3545' },
};

const EMPTY_FORM = { name: '', email: '', password: '', birthDate: '', graduationDate: '', entryDate: '' };

export default function AdminDashboard({ language }) {
  const isEn = language === 'en';
  const lang = isEn ? 'en' : 'zh';

  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const session = getAdminSession();

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    if (!API_BASE) { setErr(isEn ? 'Missing REACT_APP_API_URL' : '缺少 REACT_APP_API_URL'); setLoading(false); return; }
    loadStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/students`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) { clearAdminSession(); navigate('/login', { replace: true }); return; }
      if (!r.ok) throw new Error(data.error || (isEn ? 'Failed to load' : '载入失败'));
      setStudents(data.students || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (API_BASE) await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    clearAdminSession();
    navigate('/login', { replace: true });
  }

  function openModal() { setForm(EMPTY_FORM); setFormErr(''); setShowModal(true); }
  function closeModal() { setShowModal(false); }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    if (!name) { setFormErr(isEn ? 'Name is required.' : '姓名为必填。'); return; }
    if (email && !password) { setFormErr(isEn ? 'Password is required when email is set.' : '设定 Email 时密码为必填。'); return; }
    if (password && password.length < 8) { setFormErr(isEn ? 'Password must be at least 8 characters.' : '密码至少需要 8 个字元。'); return; }
    setCreating(true);
    setFormErr('');
    try {
      const body = { name };
      if (email) { body.email = email; body.password = password; }
      if (form.birthDate) body.birthDate = form.birthDate;
      if (form.graduationDate) body.graduationDate = form.graduationDate;
      if (form.entryDate) body.entryDate = form.entryDate;
      const r = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || (isEn ? 'Create failed' : '建立失败'));
      navigate(`/admin/transcript/${data.student.id}`);
    } catch (e2) {
      setFormErr(e2.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(isEn ? 'Delete this withdrawn student? This cannot be undone.' : '确定要删除此退学学生吗？此动作无法还原。')) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API_BASE}/api/students/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) throw new Error(isEn ? 'Delete failed' : '删除失败');
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!session) return null;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-0">{isEn ? 'Students' : '学生列表'}</h1>
          <p className="text-muted small mb-0 mt-1">
            {isEn
              ? 'Roster, profiles, and grade transcripts. Open a student to edit.'
              : '学生列表、个资与成绩单。点击学生即可编辑。'}
          </p>
        </div>
        <div>
          <Link to="/school-profile" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm me-2">
            {isEn ? 'School Profile' : '学校简介'}
          </Link>
          <button type="button" className="btn btn-outline-secondary btn-sm me-2" onClick={logout}>
            {isEn ? 'Log out' : '登出'}
          </button>
          <Link to="/" className="btn btn-link btn-sm">{isEn ? 'Site home' : '回到网站'}</Link>
        </div>
      </div>

      {err && <div className="alert alert-warning py-2">{err}</div>}

      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <button type="button" className="btn btn-primary" onClick={openModal}>
          {isEn ? '+ New student' : '＋ 新增学生'}
        </button>

        {/* Status filter tabs */}
        <div className="btn-group ms-2" role="group">
          {[
            { key: 'all',      label: { en: 'All',      zh: '全部' } },
            { key: 'enrolled', label: { en: 'Enrolled', zh: '在籍' } },
            { key: 'graduated',label: { en: 'Graduated',zh: '毕业' } },
            { key: 'withdrawn',label: { en: 'Withdrawn',zh: '退学' } },
          ].map(({ key, label }) => {
            const count = key === 'all'
              ? students.length
              : students.filter((s) => getStudentStatus(s) === key).length;
            return (
              <button
                key={key}
                type="button"
                className={`btn btn-sm ${statusFilter === key ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter(key)}
              >
                {label[lang]} <span className="badge bg-secondary ms-1">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{isEn ? 'Loading…' : '载入中…'}</p>
      ) : (() => {
        const visible = statusFilter === 'all'
          ? students
          : students.filter((s) => getStudentStatus(s) === statusFilter);
        return (
          <div className="table-responsive shadow-sm rounded border bg-white">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>{isEn ? 'Name' : '姓名'}</th>
                  <th>{isEn ? 'Status' : '状态'}</th>
                  <th>{isEn ? 'ID' : '学号'}</th>
                  <th>{isEn ? 'Grade' : '年级'}</th>
                  <th>{isEn ? 'Login email' : '登入信箱'}</th>
                  <th>{isEn ? 'Birth' : '生日'}</th>
                  <th>{isEn ? 'Location' : '地点'}</th>
                  <th>{isEn ? 'Guardian' : '监护人'}</th>
                  <th className="text-center">{isEn ? 'Semesters' : '学期数'}</th>
                  <th>{isEn ? 'Updated' : '更新时间'}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const status = getStudentStatus(s);
                  const badge = STATUS_BADGE[status];
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.name || '(unnamed)'}</strong></td>
                      <td>
                        <span className="badge" style={{ backgroundColor: badge.bg }}>
                          {badge.label[lang]}
                        </span>
                      </td>
                      <td className="text-nowrap">
                        <span className="badge bg-secondary" style={{ fontFamily: 'monospace' }}>
                          {s.studentCode || '—'}
                        </span>
                      </td>
                      <td className="text-nowrap">
                        {s.currentGrade ? <span className="badge bg-primary">Grade {s.currentGrade}</span> : '—'}
                      </td>
                      <td>{s.loginEmail || '—'}</td>
                      <td>{s.birthDate || '—'}</td>
                      <td>{[s.city, s.province].filter(Boolean).join(', ') || '—'}</td>
                      <td className="small">{s.parentGuardian || '—'}</td>
                      <td className="text-center">{s.semesterCount ?? 0}</td>
                      <td className="small text-nowrap">
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : '—'}
                      </td>
                      <td className="text-end text-nowrap">
                        <Link className="btn btn-sm btn-outline-primary me-1" to={`/admin/transcript/${s.id}`}>
                          {isEn ? 'View & edit' : '检视／编辑'}
                        </Link>
                        <Link
                          className="btn btn-sm btn-outline-secondary me-1"
                          to={`/diploma/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🎓
                        </Link>
                        {status === 'withdrawn' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                          >
                            {deletingId === s.id ? '…' : (isEn ? 'Delete' : '删除')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-muted text-center py-4">
                      {statusFilter === 'all'
                        ? (isEn ? 'No students yet — create one above.' : '目前没有学生资料，请使用上方按钮新增。')
                        : (isEn ? 'No students in this category.' : '此分类没有学生。')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* New student modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: '#fff', borderRadius: '8px', padding: '28px 32px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h5 style={{ marginBottom: '4px' }}>{isEn ? 'New Student' : '新增学生'}</h5>
            <p className="text-muted small mb-4">{isEn ? 'Profile is required. Login credentials are optional — set them now or add later.' : '个人资料为必填；登入帐号可现在设定，也可之后补填。'}</p>
            <form onSubmit={handleCreateSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  {isEn ? 'Full Name' : '姓名'} <span style={{ color: '#c00' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isEn ? 'e.g. Zhang Wei' : '例：张伟'}
                  autoFocus
                />
              </div>

              <hr className="my-3" />
              <p className="small fw-semibold mb-2" style={{ color: '#444' }}>
                {isEn ? 'Login Account (optional)' : '登入帐号（选填）'}
              </p>
              <div className="mb-3">
                <label className="form-label">{isEn ? 'Email' : 'Email 信箱'}</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                  autoComplete="off"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">{isEn ? 'Password' : '密码'}</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={isEn ? 'Min. 8 characters' : '至少 8 个字元'}
                  autoComplete="new-password"
                  minLength={8}
                  disabled={!form.email}
                />
                {!form.email && (
                  <div className="form-text">{isEn ? 'Enter email first to enable password.' : '请先填 Email 再设密码。'}</div>
                )}
              </div>

              <hr className="my-3" />
              <p className="small fw-semibold mb-2" style={{ color: '#444' }}>
                {isEn ? 'Academic Info (optional)' : '学籍资讯（选填）'}
              </p>
              <div className="mb-3">
                <label className="form-label">{isEn ? 'Birth Date' : '生日'}</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.birthDate}
                  onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">{isEn ? 'Entry Date' : '入学日期'}</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.entryDate}
                  onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">{isEn ? 'Expected Graduation Date' : '预计毕业日'}</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.graduationDate}
                  onChange={(e) => setForm((f) => ({ ...f, graduationDate: e.target.value }))}
                />
                <div className="form-text">{isEn ? 'Used to compute grade level (9–12).' : '用来计算目前年级（9–12）。'}</div>
              </div>
              {formErr && <div className="alert alert-danger py-2 mb-3">{formErr}</div>}
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={creating}>
                  {isEn ? 'Cancel' : '取消'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? (isEn ? 'Creating…' : '建立中…') : (isEn ? 'Create & open' : '建立并开启')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
