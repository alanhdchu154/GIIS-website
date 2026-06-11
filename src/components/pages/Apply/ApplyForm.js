import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

const GRADE_LEVELS = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const APPLICANT_TYPES = [
  {
    value: 'new',
    title: { en: 'New student', zh: '一般新生' },
    body: {
      en: 'For students starting high school with GIIS or without prior high-school credits to transfer.',
      zh: '适合从 GIIS 开始高中，或没有需要转入高中学分的学生。',
    },
  },
  {
    value: 'transfer',
    title: { en: 'Transfer student', zh: '转学生' },
    body: {
      en: 'For students who already completed high-school courses elsewhere and need credit review.',
      zh: '适合已经在其他学校修过高中课程、需要审核转入学分的学生。',
    },
  },
];
const CREDIT_ESTIMATES = ['0-5', '6-11', '12-17', '18-23', '24+'];
const GRADUATION_TIMING = [
  { value: 'asap', en: 'As soon as realistically possible', zh: '希望尽快完成可行毕业路径' },
  { value: '1-year', en: 'Within 1 school year', zh: '希望 1 个学年内完成' },
  { value: '2-years', en: 'Within 2 school years', zh: '希望 2 个学年内完成' },
  { value: 'not-sure', en: 'Not sure yet', zh: '还不确定，需要学校评估' },
];
const TRANSCRIPT_OPTIONS = [
  { value: 'yes', en: 'Yes, we can provide a transcript', zh: '可以提供成绩单' },
  { value: 'partial', en: 'Partial records only', zh: '只有部分记录' },
  { value: 'not-yet', en: 'Not yet', zh: '暂时还没有' },
];
const CONCERNS = [
  { value: 'grade9-path', en: 'Which starting path fits my child?', zh: '孩子适合从哪条路径开始' },
  { value: 'credits', en: 'Do any prior credits need review?', zh: '是否有既有学分需要审核' },
  { value: 'graduation', en: 'Can my child graduate on time?', zh: '能否按时毕业' },
  { value: 'records', en: 'Will the school record be accepted?', zh: '学校记录是否可信' },
  { value: 'motivation', en: 'Will my child stay on track?', zh: '孩子能否坚持学习' },
];

// Hoisted to module scope: defining these inside ApplyForm made `Field` a new
// component reference on every render, remounting every input and dropping focus
// after a single keystroke (the only enrollment path was effectively unusable).
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

export default function ApplyForm({ language }) {
  const isEn = language !== 'zh';

  const [form, setForm] = useState({
    studentName: '',
    dob: '',
    gradeLevel: '',
    currentSchool: '',
    targetUniversities: '',
    preferredLanguage: 'en',
    applicantType: '',
    parentName: '',
    parentEmail: '',
    phone: '',
    previousCredits: '',
    graduationTiming: '',
    transcriptAvailable: '',
    mainConcern: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  function applicantNotes() {
    const isTransfer = form.applicantType === 'transfer';
    const requiredRecords = isTransfer
      ? 'official transcript or school report for completed high-school terms; course descriptions if credits need review'
      : 'proof of age; current or most recent school information if available; recent report card or placement record if available';
    return [
      `Applicant Review: type=${form.applicantType || 'not provided'}`,
      `previousCredits=${isTransfer ? (form.previousCredits || 'not provided') : 'not applicable'}`,
      `graduationTiming=${isTransfer ? (form.graduationTiming || 'not provided') : 'standard path'}`,
      `transcriptAvailable=${isTransfer ? (form.transcriptAvailable || 'not provided') : 'not applicable'}`,
      `concern=${form.mainConcern || 'not provided'}`,
      `Required Records: ${requiredRecords}`,
      `Family Notes: ${(form.notes || '').trim() || 'none'}`,
    ].join('; ');
  }

  function validate() {
    const e = {};
    if (!form.studentName.trim()) e.studentName = isEn ? 'Required' : '必填';
    if (!form.dob.trim()) e.dob = isEn ? 'Required' : '必填';
    if (!form.gradeLevel) e.gradeLevel = isEn ? 'Required' : '必填';
    if (!form.applicantType) e.applicantType = isEn ? 'Choose one path' : '请选择申请类型';
    if (form.applicantType === 'transfer') {
      if (!form.previousCredits) e.previousCredits = isEn ? 'Required for transfer review' : '转学审核必填';
      if (!form.transcriptAvailable) e.transcriptAvailable = isEn ? 'Required for transfer review' : '转学审核必填';
      if (!form.graduationTiming) e.graduationTiming = isEn ? 'Required for transfer review' : '转学审核必填';
    }
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
      const payload = {
        studentName: form.studentName,
        dob: form.dob,
        gradeLevel: form.gradeLevel,
        currentSchool: form.currentSchool,
        targetUniversities: form.targetUniversities,
        preferredLanguage: form.preferredLanguage,
        parentName: form.parentName,
        parentEmail: form.parentEmail,
        phone: form.phone,
        notes: applicantNotes(),
      };
      const res = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setServerError(data.error || (isEn ? 'Submission failed. Please try again.' : '提交失败，请重试。')); return; }
      setSubmitted(true);
    } catch {
      setServerError(isEn ? 'Network error. Please try again.' : '网络错误，请重试。');
    } finally {
      setSubmitting(false);
    }
  }

  const T = (en, zh) => isEn ? en : zh;

  const isTransferApplicant = form.applicantType === 'transfer';
  const successTitle = isTransferApplicant
    ? T('Transfer Path Review received', '转学路径评估已收到')
    : T('Application Path Review received', '入学路径评估已收到');
  const successBody = isTransferApplicant
    ? T(
        "Admissions will review the student's credits, graduation timing, and support level before payment. You'll hear from us at ",
        '招生团队会先评估学生学分、毕业时间与所需支持层级，再进入付款。我们会通过以下邮箱联系你：'
      )
    : T(
        "Admissions will review the student's grade level, learning needs, and support level before payment. You'll hear from us at ",
        '招生团队会先评估学生年级、学习需求与所需支持层级，再进入付款。我们会通过以下邮箱联系你：'
      );

  if (submitted) {
    return (
      <>
        <Helmet><title>{T('Apply', '申请入学')} | GIIS</title></Helmet>
        <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✓</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>{successTitle}</h1>
            <p style={{ fontSize: 16, color: '#5c6578', lineHeight: 1.7, margin: '0 0 28px' }}>
              {successBody}
              <strong>{form.parentEmail}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" style={{ padding: '12px 24px', borderRadius: 10, background: '#2b3d6d', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                {T('Back to home', '返回首页')}
              </Link>
              <Link to="/pricing" style={{ padding: '12px 24px', borderRadius: 10, border: '2px solid #d4d8e0', color: '#2b3d6d', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                {T('View pricing', '查看价格')}
              </Link>
              <Link to="/trust-center" style={{ padding: '12px 24px', borderRadius: 10, border: '2px solid #d4d8e0', color: '#2b3d6d', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                {T('Open Trust Center', '打开信任中心')}
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
        <title>{T('Application Path Review', '入学路径评估')} | Genesis of Ideas International School</title>
        <meta name="description" content={T(
          'Request a GIIS application path review before payment: new student planning or transfer credit review.',
          '付款前申请 GIIS 入学路径评估：一般新生规划或转学生学分审核。'
        )} />
      </Helmet>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', padding: '64px 0 72px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ color: 'rgba(213,168,54,1)', fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            {T('Application Path Review', '入学路径评估')}
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 14px' }}>
            {T('Know the right path before you pay.', '付款前，先看清楚适合哪条路径。')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: '0 auto', lineHeight: 1.7, maxWidth: 680 }}>
            {T(
              'GIIS first identifies whether the student is a new high-school applicant or a transfer applicant, then reviews the right records before payment.',
              'GIIS 会先确认学生属于一般新生还是转学生，再在付款前审核对应资料与支持需求。'
            )}
          </p>
        </div>
      </div>

      <div style={{ background: '#f4f6fa', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
            {[
              { en: '1. Choose applicant type', zh: '1. 选择申请类型' },
              { en: '2. GIIS reviews records', zh: '2. GIIS 审核资料' },
              { en: '3. Choose support level', zh: '3. 选择支持方案' },
            ].map((item) => (
              <div key={item.en} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '13px 14px', fontSize: 12, color: '#2b3d6d', fontWeight: 800, textAlign: 'center' }}>
                {T(item.en, item.zh)}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 18 }}>
            <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 10, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 7px', color: '#2b3d6d', fontSize: 11, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {T('Before You Submit', '提交前请确认')}
              </p>
              <p style={{ margin: 0, color: '#4f5868', fontSize: 12.5, lineHeight: 1.65 }}>
                {T(
                  'New students can apply with basic school information. Transfer students should be ready to provide official transcripts or verifiable school records before final credit decisions.',
                  '一般新生可先用基本学校信息申请。转学生应准备正式成绩单或可验证学校记录；最终转学分判断需等正式记录审核。'
                )}
              </p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 10, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 7px', color: '#2b3d6d', fontSize: 11, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {T('After You Submit', '提交后会发生什么')}
              </p>
              <p style={{ margin: '0 0 9px', color: '#4f5868', fontSize: 12.5, lineHeight: 1.65 }}>
                {T(
                  'Admissions reviews the path within one business day, asks for missing records if needed, and recommends Self-Paced, Guided, or Premium before payment.',
                  '招生团队会在一个工作日内审核路径，必要时要求补充资料，并在付款前建议 Self-Paced、Guided 或 Premium。'
                )}
              </p>
              <Link to="/consultation" style={{ color: '#2b3d6d', fontSize: 12.5, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {T('Prefer to talk first? Book a consultation.', '想先聊聊？预约免费咨询。')}
              </Link>
            </div>
          </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
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

            <Field label={T('Current or Most Recent School (optional)', '目前或最近就读学校（选填）')} err={errors.currentSchool}>
              <input type="text" value={form.currentSchool} onChange={set('currentSchool')} placeholder={T('e.g. current middle school, homeschool, or most recent school', '例：目前初中、homeschool、或最近就读学校')} style={inputStyle(false)} />
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

            <Field label={T('Applicant Type', '申请类型')} err={errors.applicantType}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 8 }}>
                {APPLICANT_TYPES.map((type) => {
                  const selected = form.applicantType === type.value;
                  return (
                    <label key={type.value} style={{
                      display: 'block',
                      border: `1.5px solid ${selected ? '#2b3d6d' : '#d4d8e0'}`,
                      background: selected ? '#f0f4ff' : '#fff',
                      borderRadius: 10,
                      padding: '14px 14px',
                      cursor: 'pointer',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <input type="radio" name="applicantType" value={type.value} checked={selected} onChange={set('applicantType')} style={{ accentColor: '#2b3d6d' }} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1d24' }}>{T(type.title.en, type.title.zh)}</span>
                      </span>
                      <span style={{ display: 'block', fontSize: 12.5, color: '#5c6578', lineHeight: 1.55, paddingLeft: 26 }}>
                        {T(type.body.en, type.body.zh)}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#f8f9fc', fontSize: 12, color: '#5c6578', lineHeight: 1.6 }}>
                {T(
                  'New students do not need transfer transcripts unless they already completed high-school credits elsewhere. Transfer applicants should prepare records for completed high-school terms.',
                  '一般新生不需要转学成绩单，除非已经在其他学校修过高中学分。转学生需要准备已完成高中阶段课程的记录。'
                )}
              </div>
            </Field>

            <p style={{ fontSize: 12, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '8px 0 18px' }}>
              {isTransferApplicant ? T('Transfer Credit Review', '转学分审核') : T('New Student Planning', '一般新生规划')}
            </p>

            {isTransferApplicant ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <Field label={T('Previous credits estimate', '已修学分估计')} err={errors.previousCredits}>
                    <select value={form.previousCredits} onChange={set('previousCredits')} style={inputStyle(errors.previousCredits)}>
                      <option value="">{T('Select…', '请选择…')}</option>
                      {CREDIT_ESTIMATES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Field>
                  <Field label={T('Transcript available?', '是否有成绩单？')} err={errors.transcriptAvailable}>
                    <select value={form.transcriptAvailable} onChange={set('transcriptAvailable')} style={inputStyle(errors.transcriptAvailable)}>
                      <option value="">{T('Select…', '请选择…')}</option>
                      {TRANSCRIPT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{T(option.en, option.zh)}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label={T('Desired graduation timing', '期望毕业时间')} err={errors.graduationTiming}>
                  <select value={form.graduationTiming} onChange={set('graduationTiming')} style={inputStyle(errors.graduationTiming)}>
                    <option value="">{T('Select…', '请选择…')}</option>
                    {GRADUATION_TIMING.map((option) => <option key={option.value} value={option.value}>{T(option.en, option.zh)}</option>)}
                  </select>
                </Field>

                <div style={{ margin: '-4px 0 18px', padding: '11px 12px', borderRadius: 8, background: '#fff8e6', border: '1px solid #f3d27b', fontSize: 12.5, color: '#5c4a12', lineHeight: 1.6 }}>
                  {T(
                    'Partial records can start an initial path estimate, but transferable credits are finalized only after official transcripts or verifiable school records are received and reviewed.',
                    '部分资料可以先用于初步路径估算，但可转入学分只有在收到并审核正式成绩单或可核验学校记录后才会最终确认。'
                  )}
                </div>
              </>
            ) : (
              <div style={{ margin: '0 0 18px', padding: '12px 14px', borderRadius: 8, background: '#f8fbff', border: '1px solid #cfe0f8', fontSize: 12.5, color: '#2b3d6d', lineHeight: 1.65 }}>
                {T(
                  'For a new student path, families usually prepare proof of age, current or most recent school information, and any recent report card or placement record if available. No transfer transcript is required unless prior high-school credits should be reviewed.',
                  '一般新生通常准备出生日期/年龄证明、目前或最近就读学校信息，以及可提供的近期成绩或分班记录。若没有要转入的高中学分，不需要转学成绩单。'
                )}
              </div>
            )}

            <Field label={T('Main family concern', '家庭最担心的问题')} err={errors.mainConcern}>
              <select value={form.mainConcern} onChange={set('mainConcern')} style={inputStyle(false)}>
                <option value="">{T('Select…', '请选择…')}</option>
                {CONCERNS.map((option) => <option key={option.value} value={option.value}>{T(option.en, option.zh)}</option>)}
              </select>
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
              <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder={T('Learning goals, documents available, special circumstances…', '学习目标、可提供文件、特殊情况等…')} style={{ ...inputStyle(false), resize: 'vertical' }} />
            </Field>

            <button type="submit" disabled={submitting} style={{
              width: '100%', padding: '14px 0', borderRadius: 10, marginTop: 4,
              background: submitting ? '#9baac8' : '#2b3d6d',
              color: '#fff', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? T('Submitting…', '提交中…') : T('Request Application Review →', '申请入学路径评估 →')}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#7b8496', lineHeight: 1.6 }}>
              {T(
                'No payment is collected here. Admissions first reviews the path, requests missing records if needed, and recommends the support level before enrollment/payment. Questions? Email ',
                '此处不会收款。招生团队会先审核路径、必要时要求补充资料，并在入学/付款前建议合适支持方案。有问题？发邮件至 '
              )}
              <a href="mailto:admissions@genesisideas.school" style={{ color: '#2b3d6d', fontWeight: 600 }}>admissions@genesisideas.school</a>
              {' · '}
              <Link to="/trust-center" style={{ color: '#2b3d6d', fontWeight: 600 }}>{T('Open Trust Center', '打开信任中心')}</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
