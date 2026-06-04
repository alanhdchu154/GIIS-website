import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const adminPageStyle = {
  minHeight: '100vh',
  background: '#f4f6fa',
  fontFamily: 'Inter, sans-serif',
  padding: '24px 28px 80px',
};

export const adminShellStyle = { maxWidth: 1240, margin: '0 auto' };

export const adminCardStyle = {
  background: '#fff',
  border: '1px solid #e3e8f2',
  borderRadius: 8,
  boxShadow: '0 10px 28px rgba(26,45,90,0.06)',
};

// Single source of truth for top-level admin navigation, grouped by workflow so
// the back office reads as "what am I trying to do" rather than a flat list of links.
export const ADMIN_NAV_GROUPS = [
  {
    heading: { en: 'Students', zh: '学生' },
    items: [
      { to: '/admin', label: { en: 'Roster', zh: '名册' } },
      { to: '/admin/progress', label: { en: 'Progress & Care', zh: '进度与关怀' } },
    ],
  },
  {
    heading: { en: 'Academics', zh: '教务' },
    items: [
      { to: '/admin/courses', label: { en: 'Courses', zh: '课程' } },
      { to: '/admin/assignments', label: { en: 'Assignments', zh: '作业批改' } },
      { to: '/admin/documents', label: { en: 'Documents', zh: '正式文件' } },
      { to: '/admin/calendar', label: { en: 'Calendar', zh: '校历' } },
    ],
  },
  {
    heading: { en: 'Operations', zh: '营运' },
    items: [
      { to: '/admin/applications', label: { en: 'Applications', zh: '招生申请' } },
      { to: '/admin/subscriptions', label: { en: 'Billing', zh: '订阅收费' } },
      { to: '/admin/email-logs', label: { en: 'Email Logs', zh: '邮件记录' } },
    ],
  },
];

/**
 * Grouped admin navigation. Highlights the current route. `lang` is 'en' | 'zh'
 * (admin can stay English-only — labels fall back to English).
 */
export function AdminNav({ lang = 'en' }) {
  const location = useLocation();
  const current = location?.pathname || '';
  const isActive = (to) => (to === '/admin' ? current === '/admin' : current.startsWith(to));
  return (
    <nav className="d-flex flex-wrap align-items-center gap-3 mb-3">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.heading.en} className="d-flex align-items-center gap-1">
          <span
            className="small text-uppercase fw-bold me-1"
            style={{ color: '#9aa3b8', letterSpacing: 0.6, fontSize: 11 }}
          >
            {group.heading[lang] || group.heading.en}
          </span>
          {group.items.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`btn btn-sm fw-semibold ${active ? 'btn-dark' : 'btn-light border'}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label[lang] || item.label.en}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminHeader({ title, subtitle, actions = null, lang = 'en' }) {
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <p className="small fw-bold text-uppercase mb-1" style={{ color: '#2b3d6d', letterSpacing: 1.4 }}>Admin</p>
          <h1 className="h3 mb-1">{title}</h1>
          {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex flex-wrap justify-content-end gap-2">{actions}</div>}
      </div>
      <AdminNav lang={lang} />
    </>
  );
}

export function AdminPage({ children }) {
  return (
    <div style={adminPageStyle}>
      <div style={adminShellStyle}>{children}</div>
    </div>
  );
}
