import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminNav } from './AdminChrome';

const API_BASE = getApiBase();

function getStudentStatus(s) {
  if (s.withdrawalDate) return 'withdrawn';
  const graduationDate = s.graduationDate ? new Date(`${s.graduationDate}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (graduationDate && graduationDate <= today) return 'graduated';
  return 'enrolled';
}

// "Graduation-ready" = academically finished (met the 24-credit framework) but
// not yet formally graduated. Kept separate from 'graduated' on purpose:
// confirming graduation sets the graduation date and LOCKS the record.
function isGraduationReady(s) {
  return getStudentStatus(s) === 'enrolled' && s.meetsGraduationCredits === true;
}

const STATUS_BADGE = {
  enrolled:  { label: { en: 'Enrolled',  zh: '在籍' },  bg: '#198754' },
  graduated: { label: { en: 'Graduated / Archived', zh: '毕业／封存' },  bg: '#0d6efd' },
  withdrawn: { label: { en: 'Withdrawn', zh: '退学' },  bg: '#dc3545' },
};

const EMPTY_FORM = { name: '', email: '', password: '', parentEmail: '', birthDate: '', graduationDate: '', entryDate: '' };

const pageStyle = {
  minHeight: '100vh',
  background: '#f4f6fa',
  fontFamily: 'Inter, sans-serif',
  padding: '24px 28px 80px',
};

const MENU_ITEM_STYLE = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  padding: '9px 12px',
  borderRadius: 6,
  fontSize: 14,
  color: '#1a2a52',
  textDecoration: 'none',
  cursor: 'pointer',
};

const shellStyle = { maxWidth: 1240, margin: '0 auto' };
const cardStyle = {
  background: '#fff',
  border: '1px solid #e3e8f2',
  borderRadius: 8,
  boxShadow: '0 10px 28px rgba(26,45,90,0.06)',
};

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
  const [gradConfirmId, setGradConfirmId] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);

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
      if (form.parentEmail.trim()) body.parentEmail = form.parentEmail.trim();
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

  async function handleConfirmGraduation(s) {
    const today = new Date().toISOString().slice(0, 10);
    const msg = isEn
      ? `Confirm graduation for ${s.name}?\n\nThis sets the graduation date to today (${today}) and LOCKS the academic record — transcript, grades, and enrollment can no longer be edited.`
      : `确认 ${s.name} 毕业？\n\n这会将毕业日期设为今天（${today}），并锁定学籍记录——成绩单、成绩与选课将无法再修改。`;
    if (!window.confirm(msg)) return;
    setGradConfirmId(s.id);
    setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/students/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ graduationDate: today }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || (isEn ? 'Failed to confirm graduation' : '确认毕业失败'));
      await loadStudents();
    } catch (e) {
      setErr(e.message);
    } finally {
      setGradConfirmId(null);
    }
  }

  if (!session) return null;

  const counts = students.reduce((acc, student) => {
    const status = getStudentStatus(student);
    acc[status] = (acc[status] || 0) + 1;
    if (isGraduationReady(student)) acc.gradReady += 1;
    if (!student.loginEmail) acc.noLogin += 1;
    if (!student.parentGuardian && !student.parentEmail) acc.missingGuardian += 1;
    return acc;
  }, { enrolled: 0, graduated: 0, withdrawn: 0, gradReady: 0, noLogin: 0, missingGuardian: 0 });

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <p className="small fw-bold text-uppercase mb-1" style={{ color: '#2b3d6d', letterSpacing: 1.4 }}>Admin</p>
          <h1 className="h3 mb-1">{isEn ? 'School Operations' : '学校营运后台'}</h1>
          <p className="text-muted small mb-0 mt-1">
            {isEn
              ? 'Roster, records, billing, and parent-facing delivery status.'
              : '学生名册、正式记录、收费与家长通知状态。'}
          </p>
        </div>
        <div className="d-flex flex-wrap justify-content-end gap-2 align-items-start">
          <button type="button" className="btn btn-primary btn-sm" onClick={openModal}>
            {isEn ? '+ New student' : '＋ 新增学生'}
          </button>

          {/* Occasional / power actions tucked into a menu so they don't crowd daily work */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((o) => !o)}
            >
              {isEn ? 'Tools ▾' : '工具 ▾'}
            </button>
            {toolsOpen && (
              <>
                <div onClick={() => setToolsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1040 }} />
                <div style={{ position: 'absolute', right: 0, top: '112%', zIndex: 1041, minWidth: 240, background: '#fff', border: '1px solid #e3e8f2', borderRadius: 8, boxShadow: '0 8px 24px rgba(26,45,90,0.15)', padding: 6 }}>
                  <button
                    type="button"
                    style={MENU_ITEM_STYLE}
                    title="Send weekly progress digest to all parents with active subscriptions"
                    onClick={async () => {
                      setToolsOpen(false);
                      if (!window.confirm(isEn ? 'Send weekly progress email to all active parents now?' : '现在发送周报给所有在订家长？')) return;
                      try {
                        const r = await fetch(`${API_BASE}/api/admin/weekly-report`, { method: 'POST', credentials: 'include' });
                        const d = await r.json();
                        if (!r.ok) throw new Error(d.error || 'Failed');
                        alert(`Weekly report sent: ${d.sent} emails sent, ${d.skipped} skipped.`);
                      } catch (e) {
                        alert(`Error: ${e.message}`);
                      }
                    }}
                  >
                    {isEn ? '📧 Send weekly parent report' : '📧 发送家长周报'}
                  </button>
                  <button
                    type="button"
                    style={MENU_ITEM_STYLE}
                    title={isEn ? 'End-to-end Stripe payment smoke test ($1 charged to your card, refundable)' : '端到端 Stripe 支付测试（刷你卡 $1，可退款）'}
                    onClick={async () => {
                      setToolsOpen(false);
                      try {
                        const r = await fetch(`${API_BASE}/api/checkout/create-session`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planType: 'live_test' }),
                        });
                        const d = await r.json();
                        if (!r.ok) throw new Error(d.error || 'Failed to start test');
                        window.open(d.url, '_blank', 'noopener,noreferrer');
                      } catch (e) {
                        alert(`Stripe test error: ${e.message}`);
                      }
                    }}
                  >
                    {isEn ? '💳 Stripe $1 payment test' : '💳 Stripe $1 支付测试'}
                  </button>
                  <Link to="/school-profile" target="_blank" rel="noopener noreferrer" style={MENU_ITEM_STYLE} onClick={() => setToolsOpen(false)}>
                    {isEn ? '🏫 School Profile' : '🏫 学校简介'}
                  </Link>
                  <Link to="/" style={MENU_ITEM_STYLE} onClick={() => setToolsOpen(false)}>
                    {isEn ? '🌐 Public site home' : '🌐 回到网站首页'}
                  </Link>
                </div>
              </>
            )}
          </div>

          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={logout}>
            {isEn ? 'Log out' : '登出'}
          </button>
        </div>
      </div>

      <AdminNav lang={lang} />

      {err && <div className="alert alert-warning py-2">{err}</div>}

      <div className="row g-3 mb-3">
        {[
          { label: isEn ? 'Enrolled' : '在籍', value: counts.enrolled, tone: '#1b5e20', filter: 'enrolled' },
          { label: isEn ? 'Graduation-ready' : '已达毕业资格', value: counts.gradReady, tone: counts.gradReady ? '#8a5a00' : '#64748b', filter: 'gradReady', hint: isEn ? 'Met 24-credit framework' : '已修满 24 学分框架' },
          { label: isEn ? 'Graduated' : '已毕业', value: counts.graduated, tone: '#0d47a1', filter: 'graduated' },
          { label: isEn ? 'No login set' : '未设登入', value: counts.noLogin, tone: counts.noLogin ? '#b71c1c' : '#64748b' },
        ].map((metric) => (
          <div className="col-6 col-lg-3" key={metric.label}>
            <div
              style={{ ...cardStyle, padding: '14px 16px', cursor: metric.filter ? 'pointer' : 'default', outline: metric.filter === 'gradReady' && counts.gradReady ? '2px solid #ffce6a' : 'none' }}
              onClick={metric.filter ? () => setStatusFilter(metric.filter) : undefined}
            >
              <div className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: 0.8 }}>{metric.label}</div>
              <div className="h3 mb-0 fw-bold" style={{ color: metric.tone }}>{metric.value}</div>
              {metric.hint && <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{metric.hint}</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: 14, marginBottom: 14 }}>
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div>
            <h2 className="h6 mb-1">{isEn ? 'Student Roster' : '学生名册'}</h2>
            <p className="small text-muted mb-0">{isEn ? 'Open a record to manage accounts, courses, transcript, and diploma status.' : '进入学生记录即可管理帐号、选课、成绩单与毕业状态。'}</p>
          </div>
        {/* Status filter tabs */}
        <div className="btn-group" role="group">
          {[
            { key: 'all',       label: { en: 'All',       zh: '全部' } },
            { key: 'enrolled',  label: { en: 'Enrolled',  zh: '在籍' } },
            { key: 'gradReady', label: { en: 'Grad-ready', zh: '毕业资格' } },
            { key: 'graduated', label: { en: 'Graduated', zh: '已毕业' } },
            { key: 'withdrawn', label: { en: 'Withdrawn', zh: '退学' } },
          ].map(({ key, label }) => {
            const count = key === 'all'
              ? students.length
              : key === 'gradReady'
                ? students.filter(isGraduationReady).length
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
      </div>

      {loading ? (
        <p className="text-muted">{isEn ? 'Loading…' : '载入中…'}</p>
      ) : (() => {
        const visible = statusFilter === 'all'
          ? students
          : statusFilter === 'gradReady'
            ? students.filter(isGraduationReady)
            : students.filter((s) => getStudentStatus(s) === statusFilter);
        return (
          <div className="table-responsive" style={cardStyle}>
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th>{isEn ? 'Name' : '姓名'}</th>
                  <th>{isEn ? 'Status' : '状态'}</th>
                  <th>{isEn ? 'Grade' : '年级'}</th>
                  <th>{isEn ? 'Credits' : '学分'}</th>
                  <th>{isEn ? 'Account' : '帐号'}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const status = getStudentStatus(s);
                  const badge = STATUS_BADGE[status];
                  const gradReady = isGraduationReady(s);
                  const threshold = s.graduationCreditThreshold || 24;
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name || '(unnamed)'}</strong>
                        <div className="text-muted small">
                          <span style={{ fontFamily: 'monospace' }}>{s.studentCode || 'No ID'}</span>
                          {s.parentGuardian ? ` · ${s.parentGuardian}` : ''}
                        </div>
                      </td>
                      <td className="text-nowrap">
                        <span className="badge" style={{ backgroundColor: badge.bg }}>
                          {badge.label[lang]}
                        </span>
                        {gradReady && (
                          <div className="mt-1">
                            <span
                              className="badge"
                              style={{ backgroundColor: '#fff3cd', color: '#8a5a00', border: '1px solid #ffce6a' }}
                              title={isEn ? `Met the ${threshold}-credit graduation framework` : `已修满 ${threshold} 学分毕业框架`}
                            >
                              🎓 {isEn ? 'Meets graduation' : '已达毕业资格'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="text-nowrap">
                        {s.currentGrade ? <span className="badge bg-primary">Grade {s.currentGrade}</span> : '—'}
                      </td>
                      <td className="text-nowrap">
                        {typeof s.creditsEarned === 'number' ? (
                          <span
                            className="fw-semibold"
                            style={{ color: s.meetsGraduationCredits ? '#1b7a3d' : '#475467' }}
                            title={isEn ? `${s.creditsEarned} of ${threshold} credits required` : `已修 ${s.creditsEarned} / 需 ${threshold} 学分`}
                          >
                            {s.creditsEarned}
                            <span className="text-muted fw-normal">/{threshold}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="small text-nowrap">
                        {s.loginEmail
                          ? (
                            <span
                              className="badge text-bg-light border"
                              title={isEn
                                ? 'A student login account exists. This is separate from parent login.'
                                : '已建立学生登入帐号；这不是家长帐号。'}
                            >
                              {isEn ? 'Student login enabled' : '学生帐号已启用'}
                            </span>
                          )
                          : <span className="badge text-bg-danger">{isEn ? 'No login' : '未设帐号'}</span>}
                      </td>
                      <td className="text-end text-nowrap">
                        {gradReady && (
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleConfirmGraduation(s)}
                            disabled={gradConfirmId === s.id}
                            title={isEn ? 'Set graduation date to today and lock the record' : '将毕业日期设为今天并锁定记录'}
                          >
                            {gradConfirmId === s.id ? '…' : (isEn ? 'Confirm graduation' : '确认毕业')}
                          </button>
                        )}
                        <Link className="btn btn-sm btn-primary me-1" to={`/admin/transcript/${s.id}`}>
                          {isEn ? 'Open' : '开启'}
                        </Link>
                        <Link
                          className="btn btn-sm btn-outline-secondary me-1"
                          to={`/diploma/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={isEn ? 'View diploma' : '查看毕业证书'}
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
                    <td colSpan={6} className="text-muted text-center py-4">
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
                {isEn ? 'Parent Account (optional)' : '家长账号（选填）'}
              </p>
              <div className="mb-3">
                <label className="form-label">{isEn ? 'Parent Email' : '家长 Email'}</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.parentEmail}
                  onChange={(e) => setForm((f) => ({ ...f, parentEmail: e.target.value }))}
                  placeholder="parent@example.com"
                  autoComplete="off"
                />
                <div className="form-text">
                  {isEn
                    ? 'Used for parent portal login. Set the password via /api/parent/setup after creating.'
                    : '家长登入 Portal 用。建立学生后，再用 /api/parent/setup 设定密码。'}
                </div>
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
    </div>
  );
}
