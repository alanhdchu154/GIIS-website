import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader, AdminPage } from './AdminChrome';
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

export default function AdminCoursesPage({ language = 'en', toggleLanguage }) {
  const isEn = language === 'en';
  const T = (en, zh) => (isEn ? en : zh);
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
  const [expandedModules, setExpandedModules] = useState(() => new Set());

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
      setExpandedModules(new Set());
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
      setErr(T('Module order and title are required.', 'Module 顺序与标题为必填。'));
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
      setMsg(T(`Added module ${data.order}.`, `已新增 Module ${data.order}。`));
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

  function toggleModule(moduleId) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  if (!session) return null;

  return (
    <AdminPage>
      <AdminHeader
        language={language}
        toggleLanguage={toggleLanguage}
        title={T('Course Catalog', '课程目录')}
        subtitle={T('Edit course metadata and module outlines without touching seed files.', '在后台编辑课程资讯与 Module 大纲，不需要直接改 seed files。')}
        actions={(
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={loadCourses} disabled={loading || Boolean(saving)}>
            {T('Refresh', '重新整理')}
          </button>
        )}
      />

      {err && <div className="alert alert-warning py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h2 className="h6 mb-3">{T('Courses', '课程')}</h2>
              {loading ? (
                <p className="text-muted small mb-0">{T('Loading…', '载入中…')}</p>
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
                          {item.isPublished ? T('Live', '上线') : T('Draft', '草稿')}
                        </span>
                      </div>
                      <div className="small opacity-75">
                        {item.department} · {Number(item.credits).toFixed(1)} {T('cr', '学分')} · {item._count?.modules || 0} {T('modules', '模块')} · {item._count?.enrollments || 0} {T('students', '学生')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6 mb-3">{T('New Course', '新增课程')}</h2>
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
                  {saving === 'create-course' ? T('Creating…', '建立中…') : T('Create draft course', '建立草稿课程')}
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
                        {course.slug} · {course._count?.enrollments || 0} {T('enrollments', '修课学生')} · {course._count?.questions || 0} {T('exam questions', '考试题')}
                      </p>
                    </div>
                    <span className={`badge ${courseForm.isPublished ? 'bg-success' : 'bg-secondary'}`}>
                      {courseForm.isPublished ? T('Published', '已发布') : T('Draft', '草稿')}
                    </span>
                  </div>

                  <form onSubmit={saveCourse}>
                    <div className="row g-2">
                      <div className="col-md-7">
                        <label className="form-label small">{T('Name', '名称')}</label>
                        <input className="form-control form-control-sm" value={courseForm.name} onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small">{T('Chinese name', '中文名称')}</label>
                        <input className="form-control form-control-sm" value={courseForm.nameZh} onChange={(e) => setCourseForm((f) => ({ ...f, nameZh: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">{T('Credits', '学分')}</label>
                        <input className="form-control form-control-sm" value={courseForm.credits} onChange={(e) => setCourseForm((f) => ({ ...f, credits: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">{T('Department', '科别')}</label>
                        <input className="form-control form-control-sm" value={courseForm.department} onChange={(e) => setCourseForm((f) => ({ ...f, department: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">{T('Type', '类型')}</label>
                        <input className="form-control form-control-sm" value={courseForm.type} onChange={(e) => setCourseForm((f) => ({ ...f, type: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">{T('Grade', '年级')}</label>
                        <input className="form-control form-control-sm" value={courseForm.gradeLevel} onChange={(e) => setCourseForm((f) => ({ ...f, gradeLevel: e.target.value }))} placeholder="9-12 or blank" />
                      </div>
                      <div className="col-12">
                        <label className="form-label small">{T('Description', '简介')}</label>
                        <textarea className="form-control form-control-sm" rows="3" value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="publish-course" checked={courseForm.isPublished} onChange={(e) => setCourseForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                        <label className="form-check-label small" htmlFor="publish-course">{T('Published in Learn Portal', '显示在 Learn Portal')}</label>
                      </div>
                      <button className="btn btn-primary btn-sm" type="submit" disabled={saving === 'course'}>
                        {saving === 'course' ? T('Saving…', '储存中…') : T('Save course', '储存课程')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-end gap-2 flex-wrap mb-3">
                    <div>
                      <h2 className="h6 mb-1">{T('Modules', 'Modules')}</h2>
                      <p className="text-muted small mb-0">{T('Collapsed by default so staff can scan the course before editing.', '预设收合，方便先扫完整门课再展开编辑。')}</p>
                    </div>
                    <span className="badge text-bg-light border">{course.modules?.length || 0} {T('modules', '模块')}</span>
                  </div>
                  <form onSubmit={addModule} className="row g-2 align-items-end mb-3">
                    <div className="col-md-2">
                      <label className="form-label small">{T('Order', '顺序')}</label>
                      <input className="form-control form-control-sm" value={newModuleForm.order} onChange={(e) => setNewModuleForm((f) => ({ ...f, order: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">{T('Title', '标题')}</label>
                      <input className="form-control form-control-sm" value={newModuleForm.title} onChange={(e) => setNewModuleForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">{T('Hours', '小时')}</label>
                      <input className="form-control form-control-sm" value={newModuleForm.estimatedHrs} onChange={(e) => setNewModuleForm((f) => ({ ...f, estimatedHrs: e.target.value }))} />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary btn-sm w-100 fw-semibold" type="submit" disabled={saving === 'module'}>
                        {saving === 'module' ? T('Adding…', '新增中…') : T('+ New Module', '+ 新增 Module')}
                      </button>
                    </div>
                  </form>

                  <div className="d-flex flex-column gap-2">
                    {(course.modules || []).map((mod) => {
                      const expanded = expandedModules.has(mod.id);
                      return (
                        <section key={mod.id} className="border rounded bg-white">
                          <button
                            type="button"
                            className="w-100 btn btn-light d-flex justify-content-between align-items-center gap-3 text-start"
                            aria-expanded={expanded}
                            onClick={() => toggleModule(mod.id)}
                            style={{ borderRadius: 8, padding: '10px 12px' }}
                          >
                            <span className="fw-semibold text-truncate">
                              {expanded ? '▼' : '▶'} {T('Module', 'Module')} {mod.order}: {mod.title || T('Untitled', '未命名')}
                            </span>
                            <span className="text-muted small text-nowrap">{mod.estimatedHrs ?? 3}h</span>
                          </button>
                          {expanded && (
                            <div className="p-3 border-top">
                              <div className="row g-2">
                                <div className="col-md-2">
                                  <label className="form-label small">{T('Order', '顺序')}</label>
                              <input
                                className="form-control form-control-sm"
                                defaultValue={mod.order}
                                onBlur={(e) => {
                                  const next = Number(e.target.value);
                                  if (Number.isInteger(next) && next !== mod.order) updateModule(mod.id, { order: next });
                                }}
                              />
                                </div>
                                <div className="col-md-8">
                                  <label className="form-label small">{T('Title', '标题')}</label>
                              <input
                                className="form-control form-control-sm"
                                defaultValue={mod.title}
                                onBlur={(e) => {
                                  if (e.target.value !== mod.title) updateModule(mod.id, { title: e.target.value });
                                }}
                              />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label small">{T('Hours', '小时')}</label>
                                  <input
                                    className="form-control form-control-sm"
                                    defaultValue={String(mod.estimatedHrs ?? '')}
                                    onBlur={(e) => {
                                      if (e.target.value !== String(mod.estimatedHrs ?? '')) updateModule(mod.id, { estimatedHrs: e.target.value || '3' });
                                    }}
                                  />
                                </div>
                                <div className="col-12">
                                  <label className="form-label small">{T('Objectives', '学习目标')}</label>
                              <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                defaultValue={mod.objectives || ''}
                                placeholder={T('Objectives', '学习目标')}
                                onBlur={(e) => {
                                  if (e.target.value !== (mod.objectives || '')) updateModule(mod.id, { objectives: e.target.value });
                                }}
                              />
                                </div>
                                <div className="col-12">
                                  <label className="form-label small">{T('Assignment / evidence', '作业 / 学习证据')}</label>
                              <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                defaultValue={mod.assignment || ''}
                                placeholder={T('Assignment / evidence', '作业 / 学习证据')}
                                onBlur={(e) => {
                                  if (e.target.value !== (mod.assignment || '')) updateModule(mod.id, { assignment: e.target.value });
                                }}
                              />
                                </div>
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    })}
                    {(course.modules || []).length === 0 && (
                      <div className="text-muted text-center py-3 border rounded">{T('No modules yet.', '还没有 modules。')}</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
