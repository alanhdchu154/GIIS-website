import React from 'react';
import { Link } from 'react-router-dom';

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

const NAV = [
  { to: '/admin', label: 'Students' },
  { to: '/admin/progress', label: 'Progress' },
  { to: '/admin/documents', label: 'Documents' },
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/email-logs', label: 'Email Logs' },
  { to: '/admin/subscriptions', label: 'Billing' },
  { to: '/admin/applications', label: 'Applications' },
];

export function AdminHeader({ title, subtitle, actions = null }) {
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
      <div className="d-flex flex-wrap gap-2 mb-3">
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} className="btn btn-sm btn-light border fw-semibold">
            {item.label}
          </Link>
        ))}
      </div>
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
