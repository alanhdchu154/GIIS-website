import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

const GRADE_LEVELS = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function ApplyForm({ language }) {
  const isEn = language !== 'zh';

  const [form, setForm] = useState({ studentName: '', dob: '', gradeLevel: '', currentSchool: '', targetUniversities: '', preferredLanguage: 'en', parentName: '', parentEmail: '', phone: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  function validate() {
    const e = {};
    if (!form.studentName.trim()) e.studentName = isEn ? 'Required' : '必填';
    if (!form.dob.trim()) e.dob = isEn ? 'Required' : '必填';
    if (!form.gradeLevel) e.gradeLevel = isEn ? 'Required' : '必填';
    if (!form.parentName.trim()) e.parentName = isEn ? 'Required' : '必填';
    if (!form.parentEmail.trim()) e.parentEmail = isEn ? 'Required' : '必填';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) e.parentEmail = isEn ? 'Invalid email' : '邮箱格式错误';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || (isEn ? 'Submission failed. Please try again.' : '提交失败，请重试。')); return; }
      setSubmitted(true);
    } catch {
      setServerError(isEn ? 'Network error. Please try again.' : '网络错误，请重试。');
    } finally {
      setSubmitting(false);
    }
  }

  const T = (en, zh) => isEn ? en : zh;

  function Field({ label, children, err, hint }) {
    return (
      <label style={{ display: 'block', marginBottom: 18 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#5c6578', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: '#9aa0ad', marginLeft: 6 }}>{hint}</span>}
        {children}
        {err && <span style={{ display: 'block', fontSize: 12, color: '#b91c1c', marginTop: 4 }}>{err}</span>}
      </label>
    );
  }

  const inputStyle = (hasErr) => ({
    display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
    border: `1.5px solid ${hasErr ? '#fca5a5' : '#d4d8e0'}`, borderRadius: 8,
    fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  });

  if (submitted) {
    return (
      <>
        <Helmet><title>{T('Apply', '申请入学')} | GIIS</title></Helmet>
        <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>{T('Application Received!', '申请已收到！')}</h1>
            <p style={{ fontSize: 16, color: '#5c6578', lineHeight: 1.7, margin: '0 0 28px' }}>
              {T(
                "We've received your application and will review it within 24 hours. You'll hear from us at ",
                '我们已收到你的申请，将在 24 小时内审核并通过以下邮箱联系你：'
              )}
              <strong>{form.parentEmail}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" style={{ padding: '12px 24px', borderRadius: 10, background: '#2b3d6d', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                {T('Back to home', '返回首页')}
              </Link>
              <Link to="/pricing" style={{ padding: '12px 24px', borderRadius: 10, border: '2px solid #d4d8e0', color: '#2b3d6d', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                {T('View pricing', '查看价格')}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{T('Apply to GIIS', '申请入学 GIIS')} | Genesis of Ideas International School</title>
        <meta name="description" content={T(
          'Apply to Genesis of Ideas International School — complete your application in 2 minutes.',
          '申请入学 GIIS — 2 分钟完成申请。'
        )} />
      </Helmet>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '64px 0 72px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            {T('Enrollment', '入学申请')}
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 14px' }}>
            {T('Start your application', '开始你的申请')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: 0, lineHeight: 1.7 }}>
            {T('Fill out the form below — we\'ll review and reach out within 24 hours.', '填写下方表格，我们将在 24 小时内审核并联系你。')}
          </p>
        </div>
      </div>

      <div style={{ background: '#f4f6fa', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #e8ecf5' }}>

            {serverError && (
              <div style={{ background: '#fff3f3', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#b91c1c' }}>
                {serverError}
              </div>
            )}

            <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 18px' }}>
              {T('Student Information', '学生信息')}
            </p>

            <Field label={T('Student Full Name', '学生姓名')} err={errors.studentName}>
              <input type="text" value={form.studentName} onChange={set('studentName')} placeholder={T('e.g. Yunfan Yang', '例：杨芸帆')} style={inputStyle(errors.studentName)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label={T('Date of Birth', '出生日期')} err={errors.dob}>
                <input type="date" value={form.dob} onChange={set('dob')} style={inputStyle(errors.dob)} />
              </Field>
              <Field label={T('Grade Level', '年级')} err={errors.gradeLevel}>
                <select value={form.gradeLevel} onChange={set('gradeLevel')} style={inputStyle(errors.gradeLevel)}>
                  <option value="">{T('Select…', '请选择…')}</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
            </div>

            <Field label={T('Current School', '目前就读学校')} err={errors.currentSchool}>
              <input type="text" value={form.currentSchool} onChange={set('currentSchool')} placeholder={T('e.g. Shanghai High School', '例：上海中学')} style={inputStyle(false)} />
            </Field>

            <Field label={T('Target Universities (optional)', '目标大学（选填）')} err={errors.targetUniversities}>
              <input type="text" value={form.targetUniversities} onChange={set('targetUniversities')} placeholder={T('e.g. UC Berkeley, NYU, Boston University', '例：UC Berkeley、纽约大学、波士顿大学')} style={inputStyle(false)} />
            </Field>

            <Field label={T('Preferred instruction language', '上课语言偏好')} err={errors.preferredLanguage}>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {[['en', T('English', '英文')], ['zh', T('Chinese (Mandarin)', '中文（普通话）')]].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', fontWeight: form.preferredLanguage === val ? 700 : 400, color: form.preferredLanguage === val ? '#2b3d6d' : '#5c6578' }}>
                    <input type="radio" name="preferredLanguage" value={val} checked={form.preferredLanguage === val} onChange={set('preferredLanguage')} style={{ accentColor: '#2b3d6d' }} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '8px 0 18px' }}>
              {T('Parent / Guardian Information', '家长 / 监护人信息')}
            </p>

            <Field label={T('Parent Full Name', '家长姓名')} err={errors.parentName}>
              <input type="text" value={form.parentName} onChange={set('parentName')} placeholder={T('e.g. Yali Yang', '例：杨亚利')} style={inputStyle(errors.parentName)} />
            </Field>

            <Field label={T('Parent Email', '家长邮箱')} err={errors.parentEmail} hint={T('We\'ll send updates here', '我们将通过此邮箱联系你')}>
              <input type="email" value={form.parentEmail} onChange={set('parentEmail')} placeholder="parent@example.com" style={inputStyle(errors.parentEmail)} />
            </Field>

            <Field label={T('Phone (optional)', '电话（选填）')} err={errors.phone}>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder={T('+1 (555) 000-0000', '+86 138 0000 0000')} style={inputStyle(false)} />
            </Field>

            <Field label={T('Anything else we should know? (optional)', '其他补充说明（选填）')} err={errors.notes}>
              <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder={T('Transfer credits, special circumstances…', '转学分、特殊情况等…')} style={{ ...inputStyle(false), resize: 'vertical' }} />
            </Field>

            <button type="submit" disabled={submitting} style={{
              width: '100%', padding: '14px 0', borderRadius: 10, marginTop: 4,
              background: submitting ? '#9baac8' : '#2b3d6d',
              color: '#fff', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? T('Submitting…', '提交中…') : T('Submit Application →', '提交申请 →')}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9aa0ad' }}>
              {T('Questions? Email us at ', '有问题？发邮件至 ')}
              <a href="mailto:admissions@genesisideas.school" style={{ color: '#2b3d6d', fontWeight: 600 }}>admissions@genesisideas.school</a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
