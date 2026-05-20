import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import TranscriptContent from '../Transcript/TranscriptContent.js';
import { getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { getCurrentAcademicYear } from '../../../config/schoolCalendar.js';

const API = getApiBase();
const CREDITS_REQUIRED = 24;
const currentYear = getCurrentAcademicYear();
const CEREMONY_DATE = currentYear.graduation?.ceremonyDate ?? null;
const SPRING_END = currentYear.spring?.ends ?? null;

function LoginSection({ studentId, isEn }) {
  const [loginEmail, setLoginEmail] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/students/${studentId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setLoginEmail(d.student?.loginEmail ?? null);
        if (d.student?.loginEmail) setForm((f) => ({ ...f, email: d.student.loginEmail }));
      })
      .catch(() => {});
  }, [studentId]);

  async function handleSave(e) {
    e.preventDefault();
    setMsg('');
    if (!form.email.trim() || !form.password) { setMsg(isEn ? 'Email and password are required.' : 'Email 与密码为必填。'); return; }
    if (form.password.length < 8) { setMsg(isEn ? 'Password must be at least 8 characters.' : '密码至少 8 个字元。'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/students/${studentId}/login`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setLoginEmail(d.email);
      setForm((f) => ({ ...f, password: '' }));
      setShowForm(false);
      setMsg(isEn ? '✓ Login credentials saved.' : '✓ 登入帐号已储存。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-semibold small">{isEn ? 'Login Account' : '登入帐号'}</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setShowForm((v) => !v); setMsg(''); }}>
          {showForm ? (isEn ? 'Cancel' : '取消') : loginEmail ? (isEn ? 'Reset credentials' : '重设帐号') : (isEn ? '+ Set login' : '＋ 设定帐号')}
        </button>
      </div>
      <p className="small text-muted mb-2">
        {loginEmail
          ? <><span className="badge bg-success me-1">✓</span>{loginEmail}</>
          : <span className="text-warning fw-semibold">{isEn ? 'No login set — student cannot sign in yet.' : '尚未设定帐号，学生无法登入。'}</span>}
      </p>
      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
      {showForm && (
        <form onSubmit={handleSave} className="mt-2">
          <div className="mb-2">
            <label className="form-label small mb-1">Email</label>
            <input type="email" className="form-control form-control-sm" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="mb-2">
            <label className="form-label small mb-1">{isEn ? 'New Password' : '新密码'}</label>
            <input type="password" className="form-control form-control-sm" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={isEn ? 'Min. 8 characters' : '至少 8 个字元'} minLength={8} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? (isEn ? 'Saving…' : '储存中…') : (isEn ? 'Save' : '储存')}
          </button>
        </form>
      )}
    </div>
  );
}

function ParentEmailSection({ studentId, isEn }) {
  const [parentEmail, setParentEmail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [accountForm, setAccountForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [accountMsg, setAccountMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/api/students/${studentId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const email = d.student?.parentEmail ?? '';
        setParentEmail(email || null);
        setAccountForm((f) => ({ ...f, email }));
      })
      .catch(() => {});
  }, [studentId]);

  async function handleSave(e) {
    e.preventDefault();
    setMsg('');
    const trimmed = draft.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMsg(isEn ? 'Invalid email address.' : '邮箱格式不正确。');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentEmail: trimmed || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setParentEmail(trimmed || null);
      setAccountForm((f) => ({ ...f, email: trimmed || f.email }));
      setEditing(false);
      setMsg(isEn ? '✓ Parent email saved.' : '✓ 家长邮箱已储存。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAccountSetup(e) {
    e.preventDefault();
    setAccountMsg('');
    const email = accountForm.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAccountMsg(isEn ? 'Valid parent email is required.' : '请输入有效的家长邮箱。');
      return;
    }
    if (!accountForm.password || accountForm.password.length < 8) {
      setAccountMsg(isEn ? 'Password must be at least 8 characters.' : '密码至少 8 个字元。');
      return;
    }
    setAccountSaving(true);
    try {
      const profileRes = await fetch(`${API}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ parentEmail: email }),
      });
      const profileData = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) throw new Error(profileData.error || 'Could not save parent email');

      const setupRes = await fetch(`${API}/api/parent/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId, email, password: accountForm.password }),
      });
      const setupData = await setupRes.json().catch(() => ({}));
      if (!setupRes.ok) throw new Error(setupData.error || 'Could not create parent account');

      setParentEmail(email);
      setAccountForm({ email, password: '' });
      setAccountMsg(isEn ? '✓ Parent portal login created/reset.' : '✓ 家长 Portal 登入已建立／重设。');
    } catch (err) {
      setAccountMsg(err.message);
    } finally {
      setAccountSaving(false);
    }
  }

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-semibold small">{isEn ? 'Parent Portal Email' : '家长 Portal 邮箱'}</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditing((v) => !v); setDraft(parentEmail || ''); setMsg(''); }}>
          {editing ? (isEn ? 'Cancel' : '取消') : parentEmail ? (isEn ? 'Edit' : '编辑') : (isEn ? '+ Set email' : '＋ 设定邮箱')}
        </button>
      </div>
      <p className="small text-muted mb-2">
        {parentEmail
          ? <><span className="badge bg-success me-1">✓</span>{parentEmail}</>
          : <span className="text-warning fw-semibold">{isEn ? 'No parent email — parent cannot log in yet.' : '尚未设定家长邮箱，家长无法登入。'}</span>}
      </p>
      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
      {editing && (
        <form onSubmit={handleSave} className="mt-2">
          <div className="mb-2">
            <label className="form-label small mb-1">{isEn ? 'Parent Email' : '家长邮箱'}</label>
            <input type="email" className="form-control form-control-sm" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="parent@example.com" autoFocus />
            <div className="form-text">{isEn ? 'Clear to remove.' : '清空以删除。'}</div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? (isEn ? 'Saving…' : '储存中…') : (isEn ? 'Save' : '储存')}
          </button>
        </form>
      )}

      <hr className="my-3" />
      <form onSubmit={handleAccountSetup}>
        <p className="small fw-semibold mb-2">{isEn ? 'Parent Portal Login' : '家长 Portal 登入'}</p>
        <div className="mb-2">
          <label className="form-label small mb-1">{isEn ? 'Login Email' : '登入邮箱'}</label>
          <input
            type="email"
            className="form-control form-control-sm"
            value={accountForm.email}
            onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="parent@example.com"
          />
        </div>
        <div className="mb-2">
          <label className="form-label small mb-1">{isEn ? 'Temporary / New Password' : '临时／新密码'}</label>
          <input
            type="password"
            className="form-control form-control-sm"
            value={accountForm.password}
            onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={isEn ? 'Min. 8 characters' : '至少 8 个字元'}
            minLength={8}
          />
          <div className="form-text">
            {isEn
              ? 'Creates the parent account if missing, or resets its password if it already exists.'
              : '若家长账号不存在会建立；若已存在则重设密码。'}
          </div>
        </div>
        {accountMsg && <div className={`alert py-1 px-2 small mb-2 ${accountMsg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{accountMsg}</div>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={accountSaving}>
          {accountSaving ? (isEn ? 'Saving…' : '储存中…') : (isEn ? 'Create / reset parent login' : '建立／重设家长登入')}
        </button>
      </form>
    </div>
  );
}

function EnrollmentManagerSection({ studentId, isEn }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [form, setForm] = useState({ courseId: '', semesterLabel: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [courseRes, enrollmentRes] = await Promise.all([
        fetch(`${API}/api/courses`, { credentials: 'include' }),
        fetch(`${API}/api/enrollments/admin/student/${studentId}`, { credentials: 'include' }),
      ]);
      const courseData = await courseRes.json().catch(() => []);
      const enrollmentData = await enrollmentRes.json().catch(() => []);
      if (!courseRes.ok) throw new Error(courseData.error || 'Could not load courses');
      if (!enrollmentRes.ok) throw new Error(enrollmentData.error || 'Could not load enrollments');
      setCourses(Array.isArray(courseData) ? courseData : []);
      setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const enrolledCourseIds = new Set(enrollments.map((enr) => enr.courseId));
  const availableCourses = courses.filter((course) => !enrolledCourseIds.has(course.id));

  async function handleAdd(e) {
    e.preventDefault();
    setMsg('');
    if (!form.courseId) {
      setMsg(isEn ? 'Choose a course first.' : '请先选择课程。');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/enrollments/admin/student/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: form.courseId, semesterLabel: form.semesterLabel }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not add enrollment');
      setEnrollments((items) => [d, ...items]);
      setForm({ courseId: '', semesterLabel: form.semesterLabel });
      setMsg(isEn ? '✓ Course assigned.' : '✓ 已指派课程。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateEnrollment(enrollmentId, patch) {
    setMsg('');
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/enrollments/admin/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not update enrollment');
      setEnrollments((items) => items.map((item) => item.id === enrollmentId ? d : item));
      setMsg(isEn ? '✓ Enrollment updated.' : '✓ 选课资料已更新。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEnrollment(enrollment) {
    const ok = window.confirm(isEn
      ? `Remove ${enrollment.course?.name || 'this course'} from this student? This also removes related quiz/exam/assignment records.`
      : `要从学生名下移除 ${enrollment.course?.name || '这门课'} 吗？相关 quiz/exam/assignment 记录也会移除。`);
    if (!ok) return;

    setMsg('');
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/enrollments/admin/${enrollment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not remove enrollment');
      setEnrollments((items) => items.filter((item) => item.id !== enrollment.id));
      setMsg(isEn ? '✓ Enrollment removed.' : '✓ 选课已移除。');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  function parseModules(value) {
    return value
      .split(',')
      .map((item) => Number.parseInt(item.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);
  }

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '820px' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold small">{isEn ? 'Course Enrollment Manager' : '课程指派管理'}</span>
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={loadData} disabled={loading || saving}>
          {loading ? (isEn ? 'Loading…' : '载入中…') : (isEn ? 'Refresh' : '重新整理')}
        </button>
      </div>

      <form onSubmit={handleAdd} className="row g-2 align-items-end mb-3">
        <div className="col-md-6">
          <label className="form-label small mb-1">{isEn ? 'Assign published course' : '指派已发布课程'}</label>
          <select
            className="form-select form-select-sm"
            value={form.courseId}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            disabled={saving || loading}
          >
            <option value="">{isEn ? 'Choose course…' : '选择课程…'}</option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} · {Number(course.credits).toFixed(1)} cr · {course._count?.modules || 0} modules
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small mb-1">{isEn ? 'Semester label' : '学期标签'}</label>
          <input
            className="form-control form-control-sm"
            value={form.semesterLabel}
            onChange={(e) => setForm((f) => ({ ...f, semesterLabel: e.target.value }))}
            placeholder="G12 Spring"
            disabled={saving}
          />
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary btn-sm w-100" type="submit" disabled={saving || loading || !form.courseId}>
            {saving ? (isEn ? 'Saving…' : '储存中…') : (isEn ? '+ Assign course' : '＋ 指派课程')}
          </button>
        </div>
      </form>

      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}

      {loading ? (
        <p className="small text-muted mb-0">{isEn ? 'Loading enrollments…' : '正在载入选课…'}</p>
      ) : enrollments.length === 0 ? (
        <p className="small text-warning fw-semibold mb-0">{isEn ? 'No courses assigned yet.' : '尚未指派课程。'}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>{isEn ? 'Course' : '课程'}</th>
                <th style={{ minWidth: '130px' }}>{isEn ? 'Semester' : '学期'}</th>
                <th style={{ minWidth: '155px' }}>{isEn ? 'Completed modules' : '已完成单元'}</th>
                <th>{isEn ? 'Credit' : '学分'}</th>
                <th className="text-end">{isEn ? 'Actions' : '操作'}</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => {
                const moduleTotal = enrollment.course?._count?.modules || 0;
                const completedValue = (enrollment.completedModules || []).join(', ');
                return (
                  <tr key={enrollment.id}>
                    <td>
                      <div className="fw-semibold small">{enrollment.course?.name || 'Untitled course'}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        {enrollment.course?.slug} · {Number(enrollment.course?.credits || 0).toFixed(1)} cr · {moduleTotal} modules
                      </div>
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        defaultValue={enrollment.semesterLabel || ''}
                        placeholder="G12 Spring"
                        onBlur={(e) => {
                          if (e.target.value !== (enrollment.semesterLabel || '')) {
                            updateEnrollment(enrollment.id, { semesterLabel: e.target.value });
                          }
                        }}
                        disabled={saving}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        defaultValue={completedValue}
                        placeholder="1, 2, 3"
                        onBlur={(e) => {
                          if (e.target.value !== completedValue) {
                            updateEnrollment(enrollment.id, { completedModules: parseModules(e.target.value) });
                          }
                        }}
                        disabled={saving}
                      />
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        {(enrollment.completedModules || []).length} / {moduleTotal || '—'} modules
                      </div>
                    </td>
                    <td>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={!!enrollment.creditEarned}
                          onChange={(e) => updateEnrollment(enrollment.id, { creditEarned: e.target.checked })}
                          disabled={saving}
                          id={`credit-${enrollment.id}`}
                        />
                        <label className="form-check-label small" htmlFor={`credit-${enrollment.id}`}>
                          {enrollment.creditEarned ? (isEn ? 'Earned' : '已取得') : (isEn ? 'Not earned' : '未取得')}
                        </label>
                      </div>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteEnrollment(enrollment)} disabled={saving}>
                        {isEn ? 'Remove' : '移除'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GraduationSection({ studentId }) {
  const [student, setStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/api/students/${studentId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStudent(d.student ?? null))
      .catch(() => setStudent({}));
  }, [studentId]);

  async function patch(graduationDate) {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(`${API}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ graduationDate }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed');
      setStudent((s) => ({ ...s, graduationDate: graduationDate ?? null }));
      setMsg(graduationDate ? '✓ Marked as graduated.' : '✓ Graduation date cleared.');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  if (!student) return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <p className="small text-muted mb-0">Loading graduation info…</p>
    </div>
  );

  // Credits from transcript CourseRows (authoritative source — used for college apps)
  const credits = (student.semesters || []).reduce((total, sem) =>
    total + (sem.courseRows || []).reduce((s, row) =>
      row.letterGrade && row.letterGrade.trim() ? s + Number(row.credits || 0) : s, 0), 0);
  const isEligible = credits >= CREDITS_REQUIRED;
  const isGraduated = !!student.graduationDate;
  const pct = Math.min(100, (credits / CREDITS_REQUIRED) * 100);

  return (
    <div className="border rounded p-3 mb-3 bg-white" style={{ maxWidth: '520px' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold small">Graduation Eligibility</span>
        {isGraduated && (
          <button className="btn btn-sm btn-outline-danger" onClick={() => patch(null)} disabled={saving}>
            Clear date
          </button>
        )}
      </div>

      {/* Credits progress */}
      <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <span className="small text-muted">Credits earned</span>
          <span className="small fw-bold" style={{ color: isEligible ? '#1b5e20' : '#b71c1c' }}>
            {credits % 1 === 0 ? credits : credits.toFixed(1)} / {CREDITS_REQUIRED}
            {isEligible ? '  ✓ Eligible' : `  — need ${(CREDITS_REQUIRED - credits).toFixed(1)} more`}
          </span>
        </div>
        <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '6px' }}>
          <div style={{ width: `${pct}%`, background: isEligible ? '#2e7d32' : '#1a2d5a', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Calendar dates */}
      {(SPRING_END || CEREMONY_DATE) && (
        <div className="mb-2 p-2 rounded" style={{ background: '#f4f6fa', fontSize: '12px', color: '#555' }}>
          {SPRING_END && <div>Credits must be completed by <strong>{fmtDate(SPRING_END)}</strong> (spring term end)</div>}
          {CEREMONY_DATE && <div>Graduation ceremony: <strong>{fmtDate(CEREMONY_DATE)}</strong></div>}
        </div>
      )}

      {/* Graduation status */}
      {isGraduated ? (
        <p className="small mb-2">
          <span className="badge bg-success me-1">✓ Graduated</span>
          <span className="text-muted">{fmtDate(student.graduationDate)}</span>
        </p>
      ) : (
        <p className="small text-muted mb-2">Not yet marked as graduated.</p>
      )}

      {msg && <div className={`alert py-1 px-2 small mb-2 ${msg.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}

      {!isGraduated && CEREMONY_DATE && (
        <button
          className={`btn btn-sm ${isEligible ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => patch(CEREMONY_DATE)}
          disabled={saving || !isEligible}
          title={!isEligible ? `Student needs ${(CREDITS_REQUIRED - credits).toFixed(1)} more credits` : ''}
        >
          {saving ? 'Saving…' : `✓ Mark as Graduated — ${fmtDate(CEREMONY_DATE)}`}
        </button>
      )}
      {!isEligible && !isGraduated && (
        <p className="small text-muted mt-1 mb-0">Button unlocks when student reaches {CREDITS_REQUIRED} credits.</p>
      )}
    </div>
  );
}

export default function AdminTranscriptPage({ language }) {
  const { studentId } = useParams();
  const session = getAdminSession();
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const isEn = language === 'en';
  const copy = {
    back: isEn ? '← Back to student list' : '← 返回学生列表',
    modeLabel: isEn ? 'Mode:' : '模式：',
    view: isEn ? 'View' : '检视',
    edit: isEn ? 'Edit' : '编辑',
    hintView: isEn ? 'Use View for export/submission.' : '提交／汇出请用「检视」。',
    hintEdit: isEn ? 'Save only appears in Edit.' : '只有「编辑」才会显示储存。',
  };

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div id="content">
      <Helmet>
        <title>Admin — Transcript | Genesis of Ideas International School</title>
      </Helmet>
      <div className="container-fluid py-2">
        <p className="mb-2 d-flex gap-3 flex-wrap align-items-center">
          <Link to="/admin">{copy.back}</Link>
          {studentId ? (
            <Link to={`/admin/students/${studentId}/audit-trail`} className="small">
              {isEn ? 'View activity audit trail →' : '查看学习活动审计 →'}
            </Link>
          ) : null}
        </p>
        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span className="small text-muted">{copy.modeLabel}</span>
          <div className="btn-group" role="group" aria-label="Transcript mode">
            <button
              type="button"
              className={`btn btn-sm ${mode === 'view' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMode('view')}
            >
              {copy.view}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'edit' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMode('edit')}
            >
              {copy.edit}
            </button>
          </div>
          <span className="small text-muted">
            {mode === 'view' ? copy.hintView : copy.hintEdit}
          </span>
        </div>

        <LoginSection studentId={studentId} isEn={isEn} />
        <ParentEmailSection studentId={studentId} isEn={isEn} />
        <EnrollmentManagerSection studentId={studentId} isEn={isEn} />
        <GraduationSection studentId={studentId} />

        <TranscriptContent
          language={language}
          viewerRole="admin"
          studentId={studentId}
          mode={mode}
        />
      </div>
    </div>
  );
}
