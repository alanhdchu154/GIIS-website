import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentSession, clearStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '15px', color: '#1a1a2e' }}>{value || <span style={{ color: '#ccc' }}>—</span>}</p>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', options }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box' }} />
      )}
    </div>
  );
}

export default function ProfilePage({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const session = getStudentSession();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');

  const studentId = session?.student?.id;

  const profileErrorMessage = useCallback((status, data = {}) => {
    if (status === 401) {
      return isEn
        ? 'Your session expired. Please sign in again.'
        : '登录状态已过期，请重新登录。';
    }
    if (status === 404) {
      return isEn
        ? 'The student profile is not linked yet. Please contact admissions.'
        : '学生档案尚未完成关联，请联系招生团队。';
    }
    return data.error || (isEn ? 'Profile could not be loaded. Please try again.' : '档案暂时无法载入，请稍后再试。');
  }, [isEn]);

  const loadProfile = useCallback(async () => {
    if (!studentId) {
      navigate('/login', { replace: true });
      return;
    }
    setError('');
    const token = localStorage.getItem('giis_student_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const r = await fetch(`${API}/api/me`, { credentials: 'include', headers });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) {
          clearStudentSession();
          setError(profileErrorMessage(r.status, data));
          setTimeout(() => navigate('/login', { replace: true }), 600);
          return;
        }
        setError(profileErrorMessage(r.status, data));
        return;
      }
      setProfile(data);
      setForm(data);
    } catch {
      setError(isEn ? 'Network error while loading profile.' : '载入档案时网络异常。');
    }
  }, [isEn, navigate, profileErrorMessage, studentId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    const onFocus = () => loadProfile();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadProfile]);

  function setField(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function save() {
    setSaving(true); setSaveMsg('');
    const r = await fetch(`${API}/api/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name, gender: form.gender, parentGuardian: form.parentGuardian,
        address: form.address, city: form.city, province: form.province, zipCode: form.zipCode,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const updated = await r.json();
      setProfile(p => ({ ...p, ...updated }));
      setEditing(false);
      setSaveMsg(isEn ? 'Profile updated.' : '资料已更新。');
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || 'Save failed');
    }
  }

  function logout() {
    clearStudentSession();
    fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    navigate('/login', { replace: true });
  }

  if (!studentId) return null;
  if (error) return (
    <>
      <div className="row"><Nav language={language} /></div>
      <div style={{ padding: '80px 10%', fontFamily: 'Inter, sans-serif', color: '#1a1a2e', maxWidth: 760 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 850, color: '#c62828', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {isEn ? 'Profile needs attention' : '档案需要处理'}
        </p>
        <h1 style={{ margin: '0 0 12px', fontSize: 30, lineHeight: 1.15 }}>{error}</h1>
        <p style={{ margin: '0 0 18px', color: '#5c6578', fontSize: 14, lineHeight: 1.65 }}>
          {isEn
            ? 'Your courses may still be available from the Learn Portal. If this repeats after signing in again, contact admissions with your student email.'
            : '你的课程可能仍可从 Learn Portal 打开。如果重新登录后仍出现此问题，请用学生邮箱联系招生团队。'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={loadProfile} style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: '#2b3d6d', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>
            {isEn ? 'Try again' : '重新载入'}
          </button>
          <Link to="/learn" style={{ fontSize: 13, fontWeight: 800, color: '#2b3d6d', border: '2px solid #2b3d6d', borderRadius: 8, padding: '8px 16px', textDecoration: 'none' }}>
            {isEn ? 'Back to courses' : '回到课程'}
          </Link>
        </div>
      </div>
    </>
  );
  if (!profile) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#888' }}>{isEn ? 'Loading…' : '加载中…'}</div>;

  const enrollments = profile.enrollments || [];

  // Group enrollments by semester, descending order
  const semMap = {};
  enrollments.forEach(enr => {
    const label = enr.semesterLabel || 'Other';
    if (!semMap[label]) semMap[label] = [];
    semMap[label].push(enr);
  });
  const semSortKey = (label) => {
    const g = label.match(/Grade (\d+)/); const grade = g ? parseInt(g[1]) : 99;
    return grade * 2 + (label.toLowerCase().includes('fall') ? 0 : 1);
  };
  const sortedSemesters = Object.keys(semMap).sort((a, b) => semSortKey(b) - semSortKey(a));

  return (
    <>
      <Helmet>
        <title>{isEn ? 'My Profile' : '我的档案'} | GIIS</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {isEn ? 'Student Portal' : '学生平台'}
            </p>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>{profile.name || session.student.name}</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{profile.email} · {isEn ? 'Student ID: ' : '学号：'}{profile.studentCode || '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/transcript" style={{ fontSize: '13px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none', padding: '9px 18px', border: '2px solid #2b3d6d', borderRadius: '8px' }}>
              📄 {isEn ? 'View Transcript' : '查看成绩单'}
            </Link>
            <Link to="/learn" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '9px 18px', background: '#2b3d6d', borderRadius: '8px' }}>
              📚 {isEn ? 'My Courses' : '我的课程'}
            </Link>
          </div>
        </div>

        {saveMsg && <div style={{ padding: '12px 18px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', color: '#2e7d32' }}>{saveMsg}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

          {/* Profile card */}
          <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{isEn ? 'Personal Information' : '个人资料'}</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', background: 'none', border: '2px solid #2b3d6d', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer' }}>
                  {isEn ? 'Edit' : '编辑'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditing(false); setForm(profile); }} style={{ fontSize: '12px', fontWeight: 700, color: '#888', background: 'none', border: '1px solid #ccc', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                    {isEn ? 'Cancel' : '取消'}
                  </button>
                  <button onClick={save} disabled={saving} style={{ fontSize: '12px', fontWeight: 700, color: '#fff', background: saving ? '#aaa' : '#2b3d6d', border: 'none', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer' }}>
                    {saving ? (isEn ? 'Saving…' : '保存中…') : (isEn ? 'Save' : '保存')}
                  </button>
                </div>
              )}
            </div>

            {!editing ? (
              <>
                <Field label={isEn ? 'Full Name' : '姓名'} value={profile.name} />
                <Field label={isEn ? 'Gender' : '性别'} value={profile.gender} />
                <Field label={isEn ? 'Date of Birth' : '出生日期'} value={profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : null} />
                <Field label={isEn ? 'Parent / Guardian' : '家长/监护人'} value={profile.parentGuardian} />
                <Field label={isEn ? 'Address' : '地址'} value={[profile.address, profile.city, profile.province, profile.zipCode].filter(Boolean).join(', ')} />
                <Field label={isEn ? 'Entry Date' : '入学日期'} value={profile.entryDate ? new Date(profile.entryDate).toLocaleDateString() : null} />
                <Field label={isEn ? 'Expected Graduation' : '预计毕业'} value={profile.graduationDate ? new Date(profile.graduationDate).toLocaleDateString() : null} />
              </>
            ) : (
              <>
                <EditField label={isEn ? 'Full Name' : '姓名'} value={form.name} onChange={v => setField('name', v)} />
                <EditField label={isEn ? 'Gender' : '性别'} value={form.gender} onChange={v => setField('gender', v)}
                  options={[{ value: 'Female', label: isEn ? 'Female' : '女' }, { value: 'Male', label: isEn ? 'Male' : '男' }]} />
                <EditField label={isEn ? 'Parent / Guardian' : '家长/监护人'} value={form.parentGuardian} onChange={v => setField('parentGuardian', v)} />
                <EditField label={isEn ? 'Address' : '街道地址'} value={form.address} onChange={v => setField('address', v)} />
                <EditField label={isEn ? 'City' : '城市'} value={form.city} onChange={v => setField('city', v)} />
                <EditField label={isEn ? 'Province' : '省份'} value={form.province} onChange={v => setField('province', v)} />
                <EditField label={isEn ? 'Zip Code' : '邮编'} value={form.zipCode} onChange={v => setField('zipCode', v)} />
              </>
            )}
          </div>

          {/* Enrolled courses */}
          <div>
            <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '28px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 18px' }}>{isEn ? 'Enrolled Courses' : '已报名课程'}</h2>
              {enrollments.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#888' }}>{isEn ? 'No courses yet.' : '暂未报名课程。'} <Link to="/learn" style={{ color: '#2b3d6d' }}>{isEn ? 'Browse courses' : '浏览课程'}</Link></p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedSemesters.map((sem, si) => (
                    <div key={sem}>
                      <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        {sem}{si === 0 && <span style={{ marginLeft: '6px', background: '#2b3d6d', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '8px' }}>{isEn ? 'LATEST' : '最新'}</span>}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {semMap[sem].map(enr => {
                          const midAttempt = (enr.examAttempts || []).find(a => a.examType === 'midterm' && a.submittedAt);
                          const finalAttempt = (enr.examAttempts || []).find(a => a.examType === 'final' && a.submittedAt);
                          return (
                            <Link key={enr.id} to={`/learn/${enr.course.slug}`} style={{ textDecoration: 'none' }}>
                              <div style={{ padding: '10px 14px', background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: '8px' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#2b3d6d'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e6f0'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>{isEn ? enr.course.name : (enr.course.nameZh || enr.course.name)}</p>
                                  {enr.creditEarned && <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>✓ {isEn ? 'Credit' : '已获学分'}</span>}
                                </div>
                                {(midAttempt || finalAttempt) && (
                                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#888' }}>
                                    {midAttempt && `Mid ${Math.round(Number(midAttempt.score))}%`}
                                    {midAttempt && finalAttempt && ' · '}
                                    {finalAttempt && `Final ${Math.round(Number(finalAttempt.score))}%`}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', padding: '20px 28px' }}>
              <button onClick={logout} style={{ fontSize: '14px', fontWeight: 700, color: '#c62828', background: 'none', border: '2px solid #ef9a9a', borderRadius: '8px', padding: '9px 20px', cursor: 'pointer', width: '100%' }}>
                {isEn ? 'Sign Out' : '退出登录'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
