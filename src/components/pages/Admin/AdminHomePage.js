import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage, adminCardStyle } from './AdminChrome';

const API_BASE = getApiBase();

function Tile({ label, value, tone = '#2b3d6d', to, sub }) {
  return (
    <Link
      to={to}
      className="text-decoration-none"
      style={{
        ...adminCardStyle,
        display: 'block',
        padding: 16,
        minHeight: 108,
        borderColor: Number(value) > 0 ? `${tone}66` : '#e3e8f2',
      }}
    >
      <p className="small fw-bold text-uppercase mb-2" style={{ color: '#5c6578', letterSpacing: 0.7 }}>{label}</p>
      <div className="d-flex align-items-end justify-content-between gap-2">
        <strong style={{ color: Number(value) > 0 ? tone : '#9aa3b8', fontSize: 30, lineHeight: 1 }}>{value ?? 0}</strong>
        {sub && <span className="small text-muted text-end">{sub}</span>}
      </div>
    </Link>
  );
}

function WorkArea({ title, desc, metric, metricLabel, primary, to, links = [] }) {
  const hot = typeof metric === 'number' && metric > 0;
  return (
    <section style={{ ...adminCardStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h2 className="h6 mb-1">{title}</h2>
          {typeof metric === 'number' && (
            <span
              className="badge"
              style={{
                background: hot ? '#fff3cd' : '#eef2f7',
                color: hot ? '#8a5a00' : '#5c6578',
                border: `1px solid ${hot ? '#ffce6a' : '#d6deea'}`,
                whiteSpace: 'nowrap',
              }}
            >
              {metric} {metricLabel}
            </span>
          )}
        </div>
        <p className="small text-muted mb-0">{desc}</p>
      </div>
      <div className="d-flex flex-wrap gap-2 mt-auto">
        <Link to={to} className="btn btn-sm btn-dark fw-semibold">{primary}</Link>
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="btn btn-sm btn-light border fw-semibold">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function AdminHomePage({ language = 'en', toggleLanguage }) {
  const isEn = language === 'en';
  const lang = isEn ? 'en' : 'zh';
  const navigate = useNavigate();
  const session = getAdminSession();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [data, setData] = useState({ students: [], actionCounts: null, revenue: null });

  useEffect(() => {
    if (!session) {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadOverview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOverview() {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/students/ops-summary`, { credentials: 'include' });
      const next = await r.json().catch(() => ({}));
      if (r.status === 401) {
        clearAdminSession();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!r.ok) throw new Error(next.error || (isEn ? 'Failed to load overview' : '载入总览失败'));
      setData(next);
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

  if (!session) return null;

  const counts = data.actionCounts || {};
  const students = data.students || [];
  const revenue = data.revenue || null;
  const T = (en, zh) => (lang === 'zh' ? zh : en);

  return (
    <AdminPage>
      <AdminHeader
        language={language}
        toggleLanguage={toggleLanguage}
        title={T('Admin Overview', '校务后台总览')}
        subtitle={T('Start with the queue that needs attention, then open the detailed page.', '先处理需要注意的队列，再进入对应页面。')}
        actions={(
          <>
            <button type="button" className="btn btn-sm btn-outline-primary fw-semibold" onClick={loadOverview} disabled={loading}>
              {T('Refresh', '重新整理')}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary fw-semibold" onClick={logout}>
              {T('Log out', '登出')}
            </button>
          </>
        )}
      />

      {err && <div className="alert alert-warning py-2">{err}</div>}

      {revenue && (
        <section style={{ ...adminCardStyle, padding: 16, marginBottom: 14, borderLeft: '5px solid #2b3d6d' }}>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span>
              <span className="text-muted">{T('Monthly recurring', '月经常性收入')}: </span>
              <strong style={{ fontSize: 22 }}>${(revenue.mrrCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </span>
            <span><span className="badge bg-success">{revenue.activeCount}</span> <span className="text-muted small">{T('active plans', '有效方案')}</span></span>
            {revenue.atRiskCount > 0 && (
              <span><span className="badge bg-danger">{revenue.atRiskCount}</span> <span className="text-muted small">{T('at risk', '风险')}</span></span>
            )}
          </div>
        </section>
      )}

      <div className="d-grid mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <Tile label={T('Payment issues', '付款异常')} value={counts.paymentIssues} tone="#b71c1c" to="/admin/subscriptions" />
        <Tile label={T('To grade', '待批作业')} value={counts.assignmentsToGrade} tone="#9a5b00" to="/admin/assignments" />
        <Tile label={T('Applications', '待审申请')} value={counts.applicationsPending} tone="#0d47a1" to="/admin/applications" />
        <Tile label={T('Follow-ups due', '跟进到期')} value={counts.careFollowUpsDue} tone="#8a5a00" to="/admin/progress" />
        <Tile label={T('Roster alerts', '名册提醒')} value={(counts.inactive || 0) + (counts.noLogin || 0) + (counts.graduationReady || 0)} tone="#2b3d6d" to="/admin/roster" sub={T(`${students.length} students`, `${students.length} 位学生`)} />
      </div>

      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 12 }}>
        <WorkArea
          title={T('Admissions & Path Review', '招生与路径审核')}
          desc={T('Review applications before any payment conversation.', '先审核申请与路径，再进入付款讨论。')}
          metric={counts.applicationsPending}
          metricLabel={T('pending', '待审')}
          primary={T('Open applications', '进入申请审核')}
          to="/admin/applications"
        />
        <WorkArea
          title={T('Student Records', '学生记录')}
          desc={T('Roster, login status, transcript, graduation readiness, and archived records.', '名册、登入状态、成绩单、毕业资格与封存记录。')}
          metric={students.length}
          metricLabel={T('students', '学生')}
          primary={T('Open roster', '查看名册')}
          to="/admin/roster"
        />
        <WorkArea
          title={T('Academic Delivery', '教务交付')}
          desc={T('Courses, assignments, grading queue, documents, and calendar.', '课程、作业批改、正式文件与学校日历。')}
          metric={counts.assignmentsToGrade}
          metricLabel={T('to grade', '待批')}
          primary={T('Open assignments', '进入作业批改')}
          to="/admin/assignments"
          links={[
            { label: T('Courses', '课程'), to: '/admin/courses' },
            { label: T('Documents', '文件'), to: '/admin/documents' },
            { label: T('Calendar', '校历'), to: '/admin/calendar' },
          ]}
        />
        <WorkArea
          title={T('Parent Care', '家长关怀')}
          desc={T('Progress review, advisor notes, weekly parent reports, and follow-up risk.', '学习进度、advisor note、家长周报与跟进风险。')}
          metric={counts.careFollowUpsDue}
          metricLabel={T('due', '到期')}
          primary={T('Open care queue', '进入关怀队列')}
          to="/admin/progress"
          links={[{ label: T('Weekly report', '家长周报'), to: '/admin/weekly-report' }]}
        />
        <WorkArea
          title={T('Billing & Access', '收费与权限')}
          desc={T('Manual payment verification, payment issues, and account activation.', '人工付款确认、付款异常与账号启用。')}
          metric={counts.paymentIssues}
          metricLabel={T('issues', '异常')}
          primary={T('Open billing', '进入收费管理')}
          to="/admin/subscriptions"
        />
        <WorkArea
          title={T('School Operations', '学校运营')}
          desc={T('Email logs, school profile, and low-frequency operating tools.', '邮件记录、学校简介与低频运营工具。')}
          metric={revenue ? revenue.activeCount : null}
          metricLabel={T('active plans', '有效方案')}
          primary={T('Open email logs', '查看邮件记录')}
          to="/admin/email-logs"
          links={[
            { label: T('School profile', '学校简介'), to: '/school-profile' },
            { label: T('Public site', '网站首页'), to: '/' },
          ]}
        />
      </div>
    </AdminPage>
  );
}
