import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

const EMPTY_COURSE = {
  slug: '',
  name: '',
  nameZh: '',
  credits: '1.0',
  department: '',
  type: 'Core',
  gradeLevel: '',
  description: '',
  isPublished: false,
};

const EMPTY_MODULE = {
  order: '',
  title: '',
  titleZh: '',
  objectives: '',
  assignment: '',
  estimatedHrs: '3',
};

function toForm(course) {
  return {
    slug: course.slug || '',
    name: course.name || '',
    nameZh: course.nameZh || '',
    credits: String(course.credits ?? ''),
    department: course.department || '',
    type: course.type || 'Core',
    gradeLevel: course.gradeLevel ? String(course.gradeLevel) : '',
    description: course.description || '',
    isPublished: !!course.isPublished,
  };
}

function normalizeCoursePayload(form) {
  return {
    name: form.name.trim(),
    nameZh: form.nameZh.trim(),
    credits: form.credits,
    department: form.department.trim(),
    type: form.type.trim() || 'Core',
    gradeLevel: form.gradeLevel ? Number(form.gradeLevel) : null,
    description: form.description.trim(),
    isPublished: !!form.isPublished,
  };
}

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [courses, setCourses] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [course, setCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [newCourseForm, setNewCourseForm] = useState(EMPTY_COURSE);
  const [newModuleForm, setNewModuleForm] = useState(EMPTY_MODULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSlug) loadCourse(selectedSlug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug]);

  const selectedCourse = useMemo(
    () => courses.find((item) => item.slug === selectedSlug) || null,
    [courses, selectedSlug]
  );

  async function loadCourses() {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(`${API}/api/courses/admin/all`, { credentials: 'include' });
      const data = await r.json().catch(() => []);
      if (r.status === 401) {
        clearAdminSession();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!r.ok) throw new Error(data.error || 'Failed to load courses');
      setCourses(Array.isArray(data) ? data : []);
      if (!selectedSlug && data.length) setSelectedSlug(data[0].slug);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourse(slug) {
    setSaving('load');
    setErr('');
    try {
      const r = await fetch(`${API}/api/courses/admin/${slug}`, { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Failed to load course');
      setCourse(data);
      setCourseForm(toForm(data));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving('');
    }
  }

  async function createCourse(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!newCourseForm.slug.trim() || !newCourseForm.name.trim() || !newCourseForm.department.trim()) {
      setErr('Slug, name, and department are required.');
      return;
    }
    setSaving('create-course');
    try {
      const payload = { ...normalizeCoursePayload(newCourseForm), slug: newCourseForm.slug.trim() };
      const r = await fetch(`${API}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Could not create course');
      setNewCourseForm(EMPTY_COURSE);
      setMsg(`Created ${data.name}.`);
      await loadCourses();
      setSelectedSlug(data.slug);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving('');
    }
  }

  async function saveCourse(e) {
    e.preventDefault();
    if (!selectedSlug) return;
    setErr('');
    setMsg('');
    setSaving('course');
    try {
      const r = await fetch(`${API}/api/courses/${selectedSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(normalizeCoursePayload(courseForm)),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Could not save course');
      setMsg(`Saved ${data.name}.`);
      await Promise.all([loadCourses(), loadCourse(selectedSlug)]);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving('');
    }
  }

  async function addModule(e) {
    e.preventDefault();
    if (!selectedSlug) return;
    setErr('');
    setMsg('');
    if (!newModuleForm.order || !newModuleForm.title.trim()) {
      setErr('Module order and title are required.');
      return;
    }
    setSaving('module');
    try {
      const payload = {
        ...newModuleForm,
        order: Number(newModuleForm.order),
        estimatedHrs: newModuleForm.estimatedHrs || '3',
      };
      const r = await fetch(`${API}/api/courses/${selectedSlug}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Could not add module');
      setNewModuleForm(EMPTY_MODULE);
      setMsg(`Added module ${data.order}.`);
      await Promise.all([loadCourses(), loadCourse(selectedSlug)]);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving('');
    }
  }

  async function updateModule(moduleId, patch) {
    setErr('');
    setMsg('');
    setSaving(moduleId);
    try {
      const r = await fetch(`${API}/api/courses/${selectedSlug}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Could not update module');
      setMsg(`Updated module ${data.order}.`);
      await loadCourse(selectedSlug);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving('');
    }
  }

  if (!session) return null;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">Course Catalog</h1>
          <p className="text-muted small mb-0">
            Edit course metadata and module outlines without touching seed files.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/admin" className="btn btn-outline-secondary btn-sm">Students</Link>
          <Link to="/admin/progress" className="btn btn-outline-secondary btn-sm">Progress</Link>
          <Link to="/admin/documents" className="btn btn-outline-secondary btn-sm">Documents</Link>
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={loadCourses} disabled={loading || Boolean(saving)}>
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="alert alert-warning py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h2 className="h6 mb-3">Courses</h2>
              {loading ? (
                <p className="text-muted small mb-0">Loading…</p>
              ) : (
                <div className="list-group" style={{ maxHeight: 520, overflow: 'auto' }}>
                  {courses.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`list-group-item list-group-item-action ${item.slug === selectedSlug ? 'active' : ''}`}
                      onClick={() => setSelectedSlug(item.slug)}
                    >
                      <div className="d-flex justify-content-between gap-2">
                        <span className="fw-semibold">{item.name}</span>
                        <span className={`badge ${item.isPublished ? 'bg-success' : 'bg-secondary'}`}>
                          {item.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <div className="small opacity-75">
                        {item.department} · {Number(item.credits).toFixed(1)} cr · {item._count?.modules || 0} modules
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6 mb-3">New Course</h2>
              <form onSubmit={createCourse}>
                <input className="form-control form-control-sm mb-2" placeholder="slug" value={newCourseForm.slug} onChange={(e) => setNewCourseForm((f) => ({ ...f, slug: e.target.value }))} />
                <input className="form-control form-control-sm mb-2" placeholder="Course name" value={newCourseForm.name} onChange={(e) => setNewCourseForm((f) => ({ ...f, name: e.target.value }))} />
                <div className="row g-2 mb-2">
                  <div className="col-7">
                    <input className="form-control form-control-sm" placeholder="Department" value={newCourseForm.department} onChange={(e) => setNewCourseForm((f) => ({ ...f, department: e.target.value }))} />
                  </div>
                  <div className="col-5">
                    <input className="form-control form-control-sm" placeholder="Credits" value={newCourseForm.credits} onChange={(e) => setNewCourseForm((f) => ({ ...f, credits: e.target.value }))} />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm w-100" type="submit" disabled={saving === 'create-course'}>
                  {saving === 'create-course' ? 'Creating…' : 'Create draft course'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {!selectedCourse || !course ? (
            <div className="card shadow-sm">
              <div className="card-body text-muted small">Choose a course to edit.</div>
            </div>
          ) : (
            <>
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h2 className="h5 mb-1">{course.name}</h2>
                      <p className="text-muted small mb-0">
                        {course.slug} · {course._count?.enrollments || 0} enrollments · {course._count?.questions || 0} exam questions
                      </p>
                    </div>
                    <span className={`badge ${courseForm.isPublished ? 'bg-success' : 'bg-secondary'}`}>
                      {courseForm.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <form onSubmit={saveCourse}>
                    <div className="row g-2">
                      <div className="col-md-7">
                        <label className="form-label small">Name</label>
                        <input className="form-control form-control-sm" value={courseForm.name} onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small">Chinese name</label>
                        <input className="form-control form-control-sm" value={courseForm.nameZh} onChange={(e) => setCourseForm((f) => ({ ...f, nameZh: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Credits</label>
                        <input className="form-control form-control-sm" value={courseForm.credits} onChange={(e) => setCourseForm((f) => ({ ...f, credits: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Department</label>
                        <input className="form-control form-control-sm" value={courseForm.department} onChange={(e) => setCourseForm((f) => ({ ...f, department: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Type</label>
                        <input className="form-control form-control-sm" value={courseForm.type} onChange={(e) => setCourseForm((f) => ({ ...f, type: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Grade</label>
                        <input className="form-control form-control-sm" value={courseForm.gradeLevel} onChange={(e) => setCourseForm((f) => ({ ...f, gradeLevel: e.target.value }))} placeholder="9-12 or blank" />
                      </div>
                      <div className="col-12">
                        <label className="form-label small">Description</label>
                        <textarea className="form-control form-control-sm" rows="3" value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="publish-course" checked={courseForm.isPublished} onChange={(e) => setCourseForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                        <label className="form-check-label small" htmlFor="publish-course">Published in Learn Portal</label>
                      </div>
                      <button className="btn btn-primary btn-sm" type="submit" disabled={saving === 'course'}>
                        {saving === 'course' ? 'Saving…' : 'Save course'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h6 mb-3">Modules</h2>
                  <form onSubmit={addModule} className="row g-2 align-items-end mb-3">
                    <div className="col-md-2">
                      <label className="form-label small">Order</label>
                      <input className="form-control form-control-sm" value={newModuleForm.order} onChange={(e) => setNewModuleForm((f) => ({ ...f, order: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Title</label>
                      <input className="form-control form-control-sm" value={newModuleForm.title} onChange={(e) => setNewModuleForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Hours</label>
                      <input className="form-control form-control-sm" value={newModuleForm.estimatedHrs} onChange={(e) => setNewModuleForm((f) => ({ ...f, estimatedHrs: e.target.value }))} />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-outline-primary btn-sm w-100" type="submit" disabled={saving === 'module'}>
                        Add
                      </button>
                    </div>
                  </form>

                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 72 }}>Order</th>
                          <th>Outline</th>
                          <th style={{ width: 110 }}>Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(course.modules || []).map((mod) => (
                          <tr key={mod.id}>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                defaultValue={mod.order}
                                onBlur={(e) => {
                                  const next = Number(e.target.value);
                                  if (Number.isInteger(next) && next !== mod.order) updateModule(mod.id, { order: next });
                                }}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm mb-1"
                                defaultValue={mod.title}
                                onBlur={(e) => {
                                  if (e.target.value !== mod.title) updateModule(mod.id, { title: e.target.value });
                                }}
                              />
                              <textarea
                                className="form-control form-control-sm mb-1"
                                rows="2"
                                defaultValue={mod.objectives || ''}
                                placeholder="Objectives"
                                onBlur={(e) => {
                                  if (e.target.value !== (mod.objectives || '')) updateModule(mod.id, { objectives: e.target.value });
                                }}
                              />
                              <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                defaultValue={mod.assignment || ''}
                                placeholder="Assignment / evidence"
                                onBlur={(e) => {
                                  if (e.target.value !== (mod.assignment || '')) updateModule(mod.id, { assignment: e.target.value });
                                }}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                defaultValue={String(mod.estimatedHrs ?? '')}
                                onBlur={(e) => {
                                  if (e.target.value !== String(mod.estimatedHrs ?? '')) updateModule(mod.id, { estimatedHrs: e.target.value || '3' });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                        {(course.modules || []).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-muted text-center py-3">No modules yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
