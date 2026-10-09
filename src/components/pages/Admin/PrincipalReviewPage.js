import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage, adminCardStyle } from './AdminChrome';

const API = getApiBase();

export default function PrincipalReviewPage({ language = 'en', toggleLanguage }) {
  const session = getAdminSession();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const response = await fetch(`${API}/api/applications?status=pending`, { credentials: 'include' });
    const body = await response.json().catch(() => ([]));
    if (response.status === 401) {
      clearAdminSession(); navigate('/admin/login', { replace: true }); return;
    }
    if (!response.ok) throw new Error(body.error || 'Unable to load Principal review queue.');
    setApplications(Array.isArray(body) ? body : []);
  }, [navigate]);

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
    else if (session.staffRole !== 'principal') navigate('/admin', { replace: true });
    else load().catch((error) => setMessage(error.message));
  }, [session, navigate, load]);

  async function sign(application, kind) {
    const path = kind === 'placement'
      ? `${application.id}/placement-decision/principal-approval`
      : `${application.id}/transfer-evaluation/principal-approval`;
    setBusy(`${application.id}:${kind}`); setMessage('');
    try {
      const response = await fetch(`${API}/api/applications/${path}`, { method: 'POST', credentials: 'include' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'The decision could not be signed.');
      setMessage(`${kind === 'placement' ? 'Placement' : 'Transfer'} decision signed with your authenticated Principal identity.`);
      await load();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  if (!session || session.staffRole !== 'principal') return null;
  return <AdminPage>
    <AdminHeader language={language} toggleLanguage={toggleLanguage} title="Principal academic review" subtitle="Read-only evidence and identity-bound sign-off. Admissions, payment, activation, student, course, email, graduation, and staff controls are not available here." />
    {message && <div className="alert alert-info py-2">{message}</div>}
    <div className="d-grid gap-3">{applications.map((application) => {
      const placement = application.placementDecision;
      const transfer = application.transferEvaluation;
      return <section key={application.id} style={{ ...adminCardStyle, padding: 18 }}>
        <div className="d-flex justify-content-between gap-3"><div><h2 className="h5 mb-1">{application.studentName}</h2><p className="text-muted small mb-2">{application.applicantType} · requested {application.gradeLevel} · {application.currentSchool || 'school not provided'}</p></div><code>{application.id}</code></div>
        {placement && <div className="border-top pt-3 mt-2"><h3 className="h6">Placement decision</h3><p><strong>{placement.result}</strong> · Recommended {placement.recommendedGradeLevel}</p><p className="small">{placement.decisionRationale}</p><p className="small text-muted">Evidence: {placement.evidenceReviewed}<br />First-term plan: {placement.firstTermPlan}<br />Bridge: {placement.bridgePlan || 'None'}</p>{placement.principalApprovedAt ? <span className="badge bg-success">Signed</span> : <button type="button" className="btn btn-sm btn-dark" disabled={busy === `${application.id}:placement` || placement.result === 'pending_clarification'} onClick={() => sign(application, 'placement')}>Sign placement decision</button>}</div>}
        {transfer && <div className="border-top pt-3 mt-3"><h3 className="h6">Transfer-credit evaluation</h3><p className="small">{transfer.priorSchool} · Evidence level {transfer.evidenceLevel} · {transfer.recommendedGradeLevel}</p><ul className="small">{(transfer.courses || []).map((course) => <li key={course.id}>{course.originalCourseTitle}: {course.decision} ({String(course.acceptedCredits)} credits)</li>)}</ul>{transfer.principalApprovedAt ? <span className="badge bg-success">Signed</span> : <button type="button" className="btn btn-sm btn-dark" disabled={busy === `${application.id}:transfer` || (transfer.courses || []).some((course) => course.decision === 'deferred')} onClick={() => sign(application, 'transfer')}>Sign transfer decision</button>}</div>}
        {!placement && !transfer && <p className="text-muted small mb-0">No academic decision is ready for Principal signature.</p>}
      </section>;
    })}</div>
  </AdminPage>;
}
