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

function extractPdfLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\.pdf\b/i.test(line))
    .slice(-8);
}

export default function AdminDocumentsPage({ language = 'en', toggleLanguage }) {
  const isEn = language === 'en';
  const T = (en, zh) => (isEn ? en : zh);
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
    if (isSend && !window.confirm(T('Email corrected transcript + diploma PDF packages to the principal now, CC Alan and admissions?', '现在要把修正后的成绩单 + 毕业证书 PDF package 寄给 Principal，并 CC Alan 与 admissions 吗？'))) {
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
        language={language}
        toggleLanguage={toggleLanguage}
        title={T('Official Documents', '正式文件')}
        subtitle={T('Preview, send, and audit official transcript + diploma packages.', '预览、寄送并稽核正式成绩单与毕业证书 packages。')}
        actions={(
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={loadLogs} disabled={loading || running}>
            {T('Refresh', '重新整理')}
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
                  <h2 className="h6 mb-1">{T('Class of 2026 Package', '2026 届正式文件 Package')}</h2>
                  <p className="text-muted small mb-0">
                    {T('Produces five official transcript + diploma PDF packages using the locked format contract.', '依照锁定格式合约产生五份正式成绩单 + 毕业证书 PDF package。')}
                  </p>
                </div>
                <span className="badge bg-success">{T('Locked', '格式锁定')}</span>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  disabled={Boolean(running)}
                  onClick={() => runAction('dry-run')}
                >
                  {running === 'dry-run' ? T('Generating…', '产生中…') : T('Preview PDFs (dry run)', '预览 PDFs（dry run）')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={Boolean(running)}
                  onClick={() => runAction('send')}
                >
                  {running === 'send' ? T('Sending…', '寄送中…') : T('Email official package to principal', '寄正式 package 给 Principal')}
                </button>
              </div>
              <p className="small text-muted mt-3 mb-0">
                {T('Email action CCs Alan and admissions, and writes EmailLog + AuditLog records.', '寄送动作会 CC Alan 与 admissions，并写入 EmailLog + AuditLog。')}
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-2">{T('Latest Browser Run', '最近一次执行')}</h2>
              {lastRun ? (
                <div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className={`badge ${lastRun.ok === false ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {lastRun.ok === false ? T('Needs review', '需要检查') : T('Completed', '已完成')}
                    </span>
                    <span className="badge text-bg-light border">
                      {extractPdfLines(`${lastRun.stdout || ''}\n${lastRun.stderr || ''}`).length} PDF {T('references found', '路径')}
                    </span>
                  </div>
                  {extractPdfLines(`${lastRun.stdout || ''}\n${lastRun.stderr || ''}`).length > 0 ? (
                    <ul className="small mb-3" style={{ paddingLeft: 18 }}>
                      {extractPdfLines(`${lastRun.stdout || ''}\n${lastRun.stderr || ''}`).map((line) => (
                        <li key={line} style={{ marginBottom: 4, wordBreak: 'break-word' }}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small mb-3">{T('No PDF filenames were detected in the latest output.', '最近输出中没有侦测到 PDF 档名。')}</p>
                  )}
                  <details>
                    <summary className="small fw-semibold" style={{ cursor: 'pointer' }}>{T('Show technical output', '显示技术输出')}</summary>
                    <pre className="small bg-light border rounded p-3 mt-2 mb-0" style={{ maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                      {outputSummary(`${lastRun.stdout || ''}\n${lastRun.stderr || ''}`)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-muted small mb-0">{T('No run in this browser session yet.', '这个浏览器 session 尚未执行。')}</p>
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
