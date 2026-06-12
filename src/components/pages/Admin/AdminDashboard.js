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

const SUB_BADGE = {
  active:    { label: { en: 'Active',    zh: '在订' },   bg: '#198754' },
  canceling: { label: { en: 'Canceling', zh: '取消中' }, bg: '#fd7e14' },
  past_due:  { label: { en: 'Past due',  zh: '逾期' },   bg: '#dc3545' },
  churned:   { label: { en: 'Churned',   zh: '已流失' }, bg: '#6c757d' },
  none:      { label: { en: 'No plan',   zh: '未付费' }, bg: '#adb5bd' },
};

const RISK_BADGE = {
  watch:   { label: { en: 'Watch',   zh: '留意' }, bg: '#fd7e14' },
  concern: { label: { en: 'Concern', zh: '关注' }, bg: '#dc3545' },
  urgent:  { label: { en: 'Urgent',  zh: '紧急' }, bg: '#b71c1c' },
};

function lastActiveLabel(s, isEn) {
  if (s.daysInactive == null) return { text: isEn ? 'Never' : '从未', tone: '#b71c1c' };
  if (s.daysInactive === 0) return { text: isEn ? 'Today' : '今天', tone: '#1b7a3d' };
  return { text: isEn ? `${s.daysInactive}d ago` : `${s.daysInactive}天前`, tone: s.daysInactive >= 7 ? '#b71c1c' : '#475467' };
}

const EMPTY_FORM = { name: '', email: '', password: '', parentEmail: '', birthDate: '', graduationDate: '', entryDate: '' };

const pageStyle = {
  minHeight: '100vh',
  background: '#f4f6fa',
  fontFamily: 'Inter, sans-serif',
  padding: '24px 28px 80px',
  overflowX: 'hidden',
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
  const [actionCounts, setActionCounts] = useState(null);
  const [revenue, setRevenue] = useState(null);

  const navigate = useNavigate();
  const session = getAdminSession();

  useEffect(() => {
    if (!session) { navigate('/admin/login', { replace: true }); return; }
    loadStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/students/ops-summary`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) { clearAdminSession(); navigate('/admin/login', { replace: true }); return; }
      if (!r.ok) throw new Error(data.error || (isEn ? 'Failed to load' : '载入失败'));
      setStudents(data.students || []);
      setActionCounts(data.actionCounts || null);
      setRevenue(data.revenue || null);
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

  const actionItems = actionCounts ? [
    { key: 'paymentIssues', icon: '💳', label: isEn ? 'Payment issues' : '付款异常', value: actionCounts.paymentIssues, tone: '#b71c1c', onClick: () => setStatusFilter('paymentIssue') },
    { key: 'assignmentsToGrade', icon: '📝', label: isEn ? 'To grade' : '待批作业', value: actionCounts.assignmentsToGrade, tone: '#9a5b00', onClick: () => navigate('/admin/assignments') },
    { key: 'applicationsPending', icon: '📥', label: isEn ? 'Applications' : '待审申请', value: actionCounts.applicationsPending, tone: '#0d47a1', onClick: () => navigate('/admin/applications') },
    { key: 'inactive', icon: '😴', label: isEn ? 'Inactive 7d+' : '7天没上线', value: actionCounts.inactive, tone: '#b71c1c', onClick: () => setStatusFilter('inactive') },
    { key: 'careFollowUpsDue', icon: '⏰', label: isEn ? 'Follow-ups due' : '跟进到期', value: actionCounts.careFollowUpsDue, tone: '#8a5a00', onClick: () => navigate('/admin/progress') },
    { key: 'noLogin', icon: '🔑', label: isEn ? 'No login' : '没设登入', value: actionCounts.noLogin, tone: '#b71c1c', onClick: () => setStatusFilter('noLogin') },
    { key: 'graduationReady', icon: '🎓', label: isEn ? 'Grad-ready' : '可确认毕业', value: actionCounts.graduationReady, tone: '#0d47a1', onClick: () => setStatusFilter('gradReady') },
  ] : [];

  const departmentSections = [
    {
      key: 'admissions',
      title: isEn ? 'Admissions & Path Review' : '招生与路径审核',
      desc: isEn
        ? 'Review new-student and transfer-student applications before any payment conversation.'
        : '先审核一般新生与转学生路径，再进入收费讨论。',
      metric: actionCounts ? actionCounts.applicationsPending : null,
      metricLabel: isEn ? 'pending' : '待审',
      primary: isEn ? 'Open applications' : '进入申请审核',
      onClick: () => navigate('/admin/applications'),
    },
    {
      key: 'records',
      title: isEn ? 'Student Records' : '学生记录',
      desc: isEn
        ? 'Roster, login status, transcript, graduation readiness, and archived records.'
        : '名册、登入状态、成绩单、毕业资格与封存记录。',
      metric: students.length,
      metricLabel: isEn ? 'students' : '学生',
      primary: isEn ? 'Review roster' : '查看名册',
      onClick: () => setStatusFilter('all'),
    },
    {
      key: 'academics',
      title: isEn ? 'Academic Delivery' : '教务交付',
      desc: isEn
        ? 'Courses, assignments, grading queue, official documents, and school calendar.'
        : '课程、作业批改、正式文件与学校日历。',
      metric: actionCounts ? actionCounts.assignmentsToGrade : null,
      metricLabel: isEn ? 'to grade' : '待批',
      primary: isEn ? 'Open assignments' : '进入作业批改',
      onClick: () => navigate('/admin/assignments'),
      links: [
        { label: isEn ? 'Courses' : '课程', to: '/admin/courses' },
        { label: isEn ? 'Documents' : '文件', to: '/admin/documents' },
        { label: isEn ? 'Calendar' : '校历', to: '/admin/calendar' },
      ],
    },
    {
      key: 'parent-care',
      title: isEn ? 'Parent Care' : '家长关怀',
      desc: isEn
        ? 'Progress review, advisor notes, weekly parent reports, and follow-up risk.'
        : '学习进度、advisor note、家长周报与跟进风险。',
      metric: actionCounts ? actionCounts.careFollowUpsDue : null,
      metricLabel: isEn ? 'due' : '到期',
      primary: isEn ? 'Open care queue' : '进入关怀队列',
      onClick: () => navigate('/admin/progress'),
      links: [{ label: isEn ? 'Weekly report' : '家长周报', to: '/admin/weekly-report' }],
    },
    {
      key: 'billing',
      title: isEn ? 'Billing & Access' : '收费与权限',
      desc: isEn
        ? 'Subscription status, manual payment verification, payment issues, and account activation.'
        : '订阅状态、人工付款确认、付款异常与账号启用。',
      metric: actionCounts ? actionCounts.paymentIssues : null,
      metricLabel: isEn ? 'issues' : '异常',
      primary: isEn ? 'Open billing' : '进入收费管理',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      key: 'ops',
      title: isEn ? 'School Operations' : '学校运营',
      desc: isEn
        ? 'Email logs, public school profile, and lower-frequency operating tools.'
        : '邮件记录、学校简介与低频运营工具。',
      metric: revenue ? revenue.activeCount : null,
      metricLabel: isEn ? 'active plans' : '有效方案',
      primary: isEn ? 'Open email logs' : '查看邮件记录',
      onClick: () => navigate('/admin/email-logs'),
      links: [
        { label: isEn ? 'School profile' : '学校简介', to: '/school-profile' },
        { label: isEn ? 'Public site' : '网站首页', to: '/' },
      ],
    },
  ];

  return (
    <div className="giis-admin-page" style={pageStyle}>
      <div style={shellStyle}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <p className="small fw-bold text-uppercase mb-1" style={{ color: '#2b3d6d', letterSpacing: 1.4 }}>Admin</p>
          <h1 className="h3 mb-1">{isEn ? 'Admin Home' : '校务后台首页'}</h1>
          <p className="text-muted small mb-0 mt-1">
            {isEn
              ? 'Start with the department you need, then drill into the detailed queue.'
              : '先选择要处理的部门，再进入具体队列。'}
          </p>
        </div>
        <div className="d-flex flex-wrap justify-content-end gap-2 align-items-start">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            {isEn ? 'Public site' : '回到首页'}
          </Link>
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
                  <Link to="/admin/weekly-report" style={MENU_ITEM_STYLE} onClick={() => setToolsOpen(false)}>
                    {isEn ? '📧 Weekly parent report (review & send)' : '📧 家长周报（审核后发送）'}
                  </Link>
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
                          credentials: 'include',
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

      {/* Revenue line — the owner's at-a-glance money signal */}
      {revenue && (
        <div className="d-flex flex-wrap align-items-center gap-3 mb-2" style={{ fontSize: 14 }}>
          <span>
            <span className="text-muted">{isEn ? 'Monthly recurring' : '月经常性收入'}: </span>
            <strong style={{ fontSize: 18 }}>${(revenue.mrrCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
          </span>
          <span><span className="badge bg-success">{revenue.activeCount}</span> <span className="text-muted small">{isEn ? 'active plans' : '有效方案'}</span></span>
          {revenue.atRiskCount > 0 && (
            <span><span className="badge bg-danger">{revenue.atRiskCount}</span> <span className="text-muted small">{isEn ? 'at risk' : '风险'}</span></span>
          )}
        </div>
      )}

      <section style={{ ...cardStyle, padding: 18, marginBottom: 14 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="h5 mb-1">{isEn ? 'Departments' : '部门入口'}</h2>
            <p className="small text-muted mb-0">
              {isEn
                ? 'Pick the work area first; daily queues and student records stay below for quick triage.'
                : '先选工作区域；每日待办和学生名册仍保留在下方，方便快速处理。'}
            </p>
          </div>
          <span className="badge text-bg-light border">
            {isEn ? 'Manual review sales mode' : '人工审核开卖模式'}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 12,
          }}
        >
          {departmentSections.map((section) => {
            const metricHot = typeof section.metric === 'number' && section.metric > 0;
            return (
              <div
                key={section.key}
                style={{
                  border: '1px solid #e3e8f2',
                  borderRadius: 8,
                  padding: 14,
                  background: '#fbfcfe',
                  minHeight: 178,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h3 className="h6 mb-1">{section.title}</h3>
                    {typeof section.metric === 'number' && (
                      <span
                        className="badge"
                        style={{
                          background: metricHot ? '#fff3cd' : '#eef2f7',
                          color: metricHot ? '#8a5a00' : '#5c6578',
                          border: `1px solid ${metricHot ? '#ffce6a' : '#d6deea'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {section.metric} {section.metricLabel}
                      </span>
                    )}
                  </div>
                  <p className="small text-muted mb-0">{section.desc}</p>
                </div>
                <div>
                  <button type="button" className="btn btn-sm btn-dark fw-semibold me-2 mb-2" onClick={section.onClick}>
                    {section.primary}
                  </button>
                  {section.links?.map((link) => (
                    <Link key={link.to} to={link.to} className="btn btn-sm btn-light border fw-semibold me-2 mb-2">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action strip — "what needs me today", each tile jumps to the work */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {actionItems.map((item) => {
          const hot = item.value > 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              style={{ ...cardStyle, padding: '9px 14px', minWidth: 112, textAlign: 'left', cursor: 'pointer', border: hot ? `1px solid ${item.tone}55` : '1px solid #e8ecf2', background: hot ? '#fff' : '#fbfcfe' }}
            >
              <div style={{ fontSize: 11, color: '#5c6578', fontWeight: 700 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: hot ? item.tone : '#aab2c0', lineHeight: 1.1 }}>{item.value}</div>
            </button>
          );
        })}
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

      {['paymentIssue', 'inactive', 'noLogin'].includes(statusFilter) && (
        <div className="mb-2">
          <span className="badge text-bg-light border" style={{ fontSize: 12, padding: '6px 10px' }}>
            {isEn ? 'Filtered: ' : '筛选中：'}
            {{ paymentIssue: isEn ? 'Payment issues' : '付款异常', inactive: isEn ? 'Inactive 7d+' : '7天没上线', noLogin: isEn ? 'No login' : '没设登入' }[statusFilter]}
            <button type="button" className="btn btn-sm btn-link p-0 ms-2 text-decoration-none" style={{ fontSize: 12 }} onClick={() => setStatusFilter('all')}>
              ✕ {isEn ? 'clear' : '清除'}
            </button>
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-muted">{isEn ? 'Loading…' : '载入中…'}</p>
      ) : (() => {
        const filterFns = {
          gradReady: isGraduationReady,
          paymentIssue: (s) => s.paymentIssue,
          inactive: (s) => s.isInactive,
          noLogin: (s) => !s.loginEmail,
        };
        const visible = statusFilter === 'all'
          ? students
          : filterFns[statusFilter]
            ? students.filter(filterFns[statusFilter])
            : students.filter((s) => getStudentStatus(s) === statusFilter);
        return (
          <div className="table-responsive" style={cardStyle}>
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th>{isEn ? 'Name' : '姓名'}</th>
                  <th>{isEn ? 'Status' : '状态'}</th>
                  <th>{isEn ? 'Grade' : '年级'}</th>
                  <th>{isEn ? 'Credits / GPA' : '学分 / GPA'}</th>
                  <th>{isEn ? 'Paying' : '付费'}</th>
                  <th>{isEn ? 'Last active' : '最后上线'}</th>
                  <th>{isEn ? 'Needs action' : '待处理'}</th>
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
                        {s.gpa != null && <span className="text-muted"> · {s.gpa}</span>}
                      </td>
                      <td className="text-nowrap">
                        {(() => {
                          const sub = SUB_BADGE[s.subscriptionState] || SUB_BADGE.none;
                          return (
                            <span
                              className="badge"
                              style={{ backgroundColor: sub.bg }}
                              title={s.subscriptionPlan ? `${s.subscriptionState} · ${s.subscriptionPlan}` : (isEn ? 'No active subscription' : '无有效订阅')}
                            >
                              {sub.label[lang]}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="small text-nowrap">
                        {status === 'enrolled'
                          ? (() => { const la = lastActiveLabel(s, isEn); return <span style={{ color: la.tone, fontWeight: 600 }}>{la.text}</span>; })()
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="small text-nowrap">
                        {(() => {
                          const chips = [];
                          if (s.ungradedCount > 0) chips.push({ k: 'grade', bg: '#fff3e0', fg: '#9a5b00', t: isEn ? `${s.ungradedCount} to grade` : `${s.ungradedCount} 待批` });
                          if (s.paymentIssue) chips.push({ k: 'pay', bg: '#fde8e8', fg: '#b71c1c', t: isEn ? 'Payment' : '付款' });
                          if (s.followUpDue) chips.push({ k: 'follow', bg: '#fff3cd', fg: '#8a5a00', t: isEn ? 'Follow-up due' : '跟进到期' });
                          if (!s.loginEmail && status === 'enrolled') chips.push({ k: 'login', bg: '#fde8e8', fg: '#b71c1c', t: isEn ? 'No login' : '没登入' });
                          if (s.riskLevel && RISK_BADGE[s.riskLevel]) chips.push({ k: 'risk', bg: '#f3e8ff', fg: '#6a1b9a', t: RISK_BADGE[s.riskLevel].label[lang] });
                          if (chips.length === 0) return <span className="text-muted">—</span>;
                          return (
                            <div className="d-flex flex-wrap gap-1">
                              {chips.map((c) => (
                                <span key={c.k} className="badge" style={{ background: c.bg, color: c.fg, border: `1px solid ${c.fg}33`, fontWeight: 700 }}>{c.t}</span>
                              ))}
                            </div>
                          );
                        })()}
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
                    <td colSpan={8} className="text-muted text-center py-4">
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
