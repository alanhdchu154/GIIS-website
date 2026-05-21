import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from './AdminChrome';

const API_BASE = getApiBase();

function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function outputSummary(text) {
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.slice(-14).join('\n');
}

export default function AdminDocumentsPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState('');
  const [err, setErr] = useState('');
  const [logs, setLogs] = useState({ emails: [], audits: [] });
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/admin/documents/logs`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) {
        clearAdminSession();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!r.ok) throw new Error(data.error || 'Failed to load document logs');
      setLogs(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(kind) {
    const isSend = kind === 'send';
    if (isSend && !window.confirm('Send corrected transcript + diploma PDF packages to the principal now, CC Alan and admissions?')) {
      return;
    }
    setRunning(kind);
    setErr('');
    setLastRun(null);
    try {
      const endpoint = isSend ? 'send' : 'dry-run';
      const r = await fetch(`${API_BASE}/api/admin/documents/graduation-packages/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await r.json().catch(() => ({}));
      setLastRun(data);
      if (!r.ok || data.ok === false) throw new Error(data.error || data.stderr || 'Document workflow failed');
      await loadLogs();
    } catch (e) {
      setErr(e.message);
    } finally {
      setRunning('');
    }
  }

  if (!session) return null;

  return (
    <AdminPage>
      <AdminHeader
        title="Official Documents"
        subtitle="Generate, send, and audit official transcript + diploma packages."
        actions={(
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={loadLogs} disabled={loading || running}>
            Refresh
          </button>
        )}
      />

      {err && <div className="alert alert-warning py-2">{err}</div>}

      <div className="row g-3 mb-4">
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                  <h2 className="h6 mb-1">Class of 2026 Package</h2>
                  <p className="text-muted small mb-0">
                    Produces five official transcript + diploma PDF packages using the locked format contract.
                  </p>
                </div>
                <span className="badge bg-success">Locked</span>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  disabled={Boolean(running)}
                  onClick={() => runAction('dry-run')}
                >
                  {running === 'dry-run' ? 'Generating…' : 'Generate dry-run PDFs'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={Boolean(running)}
                  onClick={() => runAction('send')}
                >
                  {running === 'send' ? 'Sending…' : 'Send to principal'}
                </button>
              </div>
              <p className="small text-muted mt-3 mb-0">
                Send action CCs Alan and admissions, and writes EmailLog + AuditLog records.
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-2">Last Run Output</h2>
              {lastRun ? (
                <pre className="small bg-light border rounded p-3 mb-0" style={{ maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {outputSummary(`${lastRun.stdout || ''}\n${lastRun.stderr || ''}`)}
                </pre>
              ) : (
                <p className="text-muted small mb-0">No run in this browser session yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Email Issue Log</h2>
          {loading ? (
            <p className="text-muted small mb-0">Loading…</p>
          ) : logs.emails.length === 0 ? (
            <p className="text-muted small mb-0">No official document emails recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Recipient</th>
                    <th>Status</th>
                    <th>Provider ID</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.emails.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.student?.name || 'Unknown'}</strong>
                        <div className="text-muted small">{row.student?.studentCode || row.studentId || '—'}</div>
                      </td>
                      <td className="small">{row.recipient}</td>
                      <td><span className={`badge ${row.status === 'sent' ? 'bg-success' : 'bg-warning text-dark'}`}>{row.status}</span></td>
                      <td className="small" style={{ fontFamily: 'monospace' }}>{row.providerId || '—'}</td>
                      <td className="small text-nowrap">{fmtDate(row.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="h6 mb-3">Document Audit Trail</h2>
          {loading ? (
            <p className="text-muted small mb-0">Loading…</p>
          ) : logs.audits.length === 0 ? (
            <p className="text-muted small mb-0">No official document audit records yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Actor</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.audits.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.student?.name || 'Unknown'}</strong>
                        <div className="text-muted small">{row.student?.studentCode || row.studentId || '—'}</div>
                      </td>
                      <td className="small">{row.actorEmail} <span className="text-muted">({row.actorRole})</span></td>
                      <td className="small text-nowrap">{fmtDate(row.createdAt)}</td>
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
