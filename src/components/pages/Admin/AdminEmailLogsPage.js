import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from './AdminChrome';

const API = getApiBase();

function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function statusClass(status) {
  if (status === 'sent') return 'bg-success';
  if (status === 'error') return 'bg-danger';
  if (status === 'skipped') return 'bg-warning text-dark';
  return 'bg-secondary';
}

export default function AdminEmailLogsPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ kinds: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, status]);

  async function loadLogs() {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams({ kind, status, limit: '150' });
      const r = await fetch(`${API}/api/admin/email-logs?${params}`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) {
        clearAdminSession();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!r.ok) throw new Error(data.error || 'Failed to load email logs');
      setLogs(data.logs || []);
      setFilters(data.filters || { kinds: [], statuses: [] });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) return null;

  return (
    <AdminPage>
      <AdminHeader
        title="Email Logs"
        subtitle="Operational delivery trail for weekly reports, official documents, and other school emails."
        actions={(
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadLogs} disabled={loading}>Refresh</button>
        )}
      />

      {err && <div className="alert alert-warning py-2">{err}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Kind</label>
              <select className="form-select form-select-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="all">All kinds</option>
                {filters.kinds.map((item) => (
                  <option key={item.value} value={item.value}>{item.value} ({item.count})</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Status</label>
              <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {filters.statuses.map((item) => (
                  <option key={item.value} value={item.value}>{item.value} ({item.count})</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 text-md-end">
              <span className="text-muted small">{logs.length} records shown</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <p className="text-muted small mb-0">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-muted small mb-0">No email logs match these filters.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Sent</th>
                    <th>Kind</th>
                    <th>Recipient</th>
                    <th>Status</th>
                    <th>Student ID</th>
                    <th>Provider / Dedupe</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td className="small text-nowrap">{fmtDate(row.sentAt)}</td>
                      <td><span className="badge bg-light text-dark border">{row.kind}</span></td>
                      <td className="small">{row.recipient}</td>
                      <td><span className={`badge ${statusClass(row.status)}`}>{row.status}</span></td>
                      <td className="small" style={{ fontFamily: 'monospace' }}>{row.studentId || '—'}</td>
                      <td className="small" style={{ fontFamily: 'monospace' }}>
                        <div>{row.providerId || '—'}</div>
                        {row.dedupeKey && <div className="text-muted">{row.dedupeKey}</div>}
                      </td>
                      <td className="small text-danger">{row.error || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
