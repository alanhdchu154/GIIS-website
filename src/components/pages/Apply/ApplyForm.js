import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import AdmissionsHandoffReceipt from '../../main/AdmissionsHandoffReceipt';

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
const START_TIMINGS = [
  { value: 'within-30-days', en: 'Within 30 days', zh: '希望 30 天内开始' },
  { value: 'next-semester', en: 'Next semester', zh: '下个学期开始' },
  { value: 'next-school-year', en: 'Next school year', zh: '下个学年开始' },
  { value: 'exploring', en: 'Still exploring', zh: '仍在了解和比较' },
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
    motivation: '',
    intendedStartTiming: '',
    transferCourseSummary: '',
    transcriptPlanDetails: '',
    transcriptExpectedTiming: '',
    tuitionAware: false,
    noGuaranteeAcknowledged: false,
    responseCommitmentAcknowledged: false,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [duplicateSubmission, setDuplicateSubmission] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [serverError, setServerError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [capabilityCheck, setCapabilityCheck] = useState(0);
  const [intakeMode, setIntakeMode] = useState('loading');

  useEffect(() => {
    let active = true;
    async function checkCapabilities() {
      setIntakeMode('loading');
      try {
        const response = await fetch(`${API}/api/applications/capabilities`);
        if (!active) return;
        if (response.status === 404 || response.status === 405) {
          setIntakeMode('legacy');
          return;
        }
        if (!response.ok) {
          setIntakeMode('unavailable');
          return;
        }
        const capabilities = await response.json().catch(() => ({}));
        setIntakeMode(
          capabilities.applicationIntakeVersion === 'serious-v1' && capabilities.interestConfirmation
            ? 'serious'
            : 'legacy',
        );
      } catch {
        if (active) setIntakeMode('unavailable');
      }
    }
    checkCapabilities();
    return () => { active = false; };
  }, [capabilityCheck]);

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }
  function toggle(field) { return e => setForm(f => ({ ...f, [field]: e.target.checked })); }

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
    if (form.motivation.trim().length < 80) e.motivation = isEn ? 'Please write at least 80 characters' : '请至少填写 80 个字符';
    if (!form.intendedStartTiming) e.intendedStartTiming = isEn ? 'Required' : '必填';
    if (form.applicantType === 'transfer') {
      if (!form.previousCredits) e.previousCredits = isEn ? 'Required for transfer review' : '转学审核必填';
      if (!form.transcriptAvailable) e.transcriptAvailable = isEn ? 'Required for transfer review' : '转学审核必填';
      if (!form.graduationTiming) e.graduationTiming = isEn ? 'Required for transfer review' : '转学审核必填';
      if (form.transferCourseSummary.trim().length < 20) e.transferCourseSummary = isEn ? 'Please summarize completed courses' : '请简要说明已修课程';
      if (form.transcriptPlanDetails.trim().length < 10) e.transcriptPlanDetails = isEn ? 'Please explain the records plan' : '请说明取得成绩单的计划';
      if (!form.transcriptExpectedTiming.trim()) e.transcriptExpectedTiming = isEn ? 'Required' : '必填';
    }
    if (!form.parentName.trim()) e.parentName = isEn ? 'Required' : '必填';
    if (!form.parentEmail.trim()) e.parentEmail = isEn ? 'Required' : '必填';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) e.parentEmail = isEn ? 'Invalid email' : '邮箱格式错误';
    if (!form.tuitionAware) e.tuitionAware = isEn ? 'Required' : '请确认';
    if (!form.noGuaranteeAcknowledged) e.noGuaranteeAcknowledged = isEn ? 'Required' : '请确认';
    if (!form.responseCommitmentAcknowledged) e.responseCommitmentAcknowledged = isEn ? 'Required' : '请确认';
    return e;
  }

  const stepFields = [
    ['studentName', 'dob', 'gradeLevel', 'intendedStartTiming', 'motivation'],
    ['applicantType', 'previousCredits', 'transcriptAvailable', 'graduationTiming', 'transferCourseSummary', 'transcriptPlanDetails', 'transcriptExpectedTiming'],
    ['parentName', 'parentEmail'],
    ['tuitionAware', 'noGuaranteeAcknowledged', 'responseCommitmentAcknowledged'],
  ];

  function goToNextStep() {
    const allErrors = validate();
    const stepErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => stepFields[currentStep].includes(field)),
    );
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setServerError('');
    setCurrentStep((step) => Math.min(step + 1, stepFields.length - 1));
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goToPreviousStep() {
    setErrors({});
    setServerError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        intakeVersion: intakeMode === 'serious' ? 'serious-v1' : '',
        studentName: form.studentName,
        dob: form.dob,
        gradeLevel: form.gradeLevel,
        currentSchool: form.currentSchool,
        targetUniversities: form.targetUniversities,
        preferredLanguage: form.preferredLanguage,
        applicantType: form.applicantType,
        parentName: form.parentName,
        parentEmail: form.parentEmail,
        phone: form.phone,
        previousCredits: isTransferApplicant ? form.previousCredits : '',
        graduationTiming: isTransferApplicant ? form.graduationTiming : '',
        transcriptAvailable: isTransferApplicant ? form.transcriptAvailable : '',
        mainConcern: form.mainConcern,
        motivation: form.motivation,
        intendedStartTiming: form.intendedStartTiming,
        transferCourseSummary: isTransferApplicant ? form.transferCourseSummary : '',
        transcriptPlanDetails: isTransferApplicant ? form.transcriptPlanDetails : '',
        transcriptExpectedTiming: isTransferApplicant ? form.transcriptExpectedTiming : '',
        tuitionAware: form.tuitionAware,
        noGuaranteeAcknowledged: form.noGuaranteeAcknowledged,
        responseCommitmentAcknowledged: form.responseCommitmentAcknowledged,
        notes: applicantNotes(),
      };
      const res = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setServerError(data.error || (isEn ? 'Submission failed. Please try again.' : '提交失败，请重试。')); return; }
      setDuplicateSubmission(data.duplicate === true);
      setConfirmationRequired(data.confirmationRequired === true);
      setSubmitted(true);
    } catch {
      setServerError(isEn ? 'Network error. Please try again.' : '网络错误，请重试。');
    } finally {
      setSubmitting(false);
    }
  }

  const T = (en, zh) => isEn ? en : zh;

  const isTransferApplicant = form.applicantType === 'transfer';
  if (submitted) {
    return (
      <>
        <Helmet><title>{T('Apply', '申请入学')} | GIIS</title></Helmet>
        {duplicateSubmission && (
          <div style={{ maxWidth: 980, margin: '24px auto -26px', padding: '0 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '12px 14px', color: '#5c4a12', fontSize: 13, lineHeight: 1.6 }}>
              {T(
                'We already have a pending application for this student. We kept the original case and recorded that you returned; no duplicate case was created.',
                '我们已经收到这名学生的待审核申请。系统保留原案件并记录您再次提交，没有建立重复案件。'
              )}
            </div>
          </div>
        )}
        <div style={{ maxWidth: 980, margin: '24px auto -26px', padding: '0 20px', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ background: '#f0f4ff', border: '1px solid #cfe0f8', borderRadius: 8, padding: '12px 14px', color: '#2b3d6d', fontSize: 13, lineHeight: 1.6 }}>
            {confirmationRequired
              ? T(
                `Please open the confirmation email sent to ${form.parentEmail}. Admissions will begin review after the parent confirms interest.`,
                `请打开已发送至 ${form.parentEmail} 的确认邮件。家长确认继续申请后，招生团队才会开始审核。`,
              )
              : T(
                'Your application is recorded. Admissions will continue with the existing case and contact your family with the next step.',
                '您的申请已记录。招生团队会继续处理现有案件，并联系家庭说明下一步。',
              )}
          </div>
        </div>
        <AdmissionsHandoffReceipt
          language={language}
          kind={isTransferApplicant ? 'transfer' : 'new'}
          parentEmail={form.parentEmail}
        />
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

          <form id="application-form" onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 8, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #e8ecf5', scrollMarginTop: 24 }}>

            <ApplicationStepper currentStep={currentStep} language={language} />

            {serverError && (
              <div style={{ background: '#fff3f3', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#b91c1c' }}>
                {serverError}
              </div>
            )}

            {currentStep === 0 && <>
              <StepHeading
                title={T('Student Information', '学生信息')}
                body={T('Start with the student’s current situation and goals.', '先填写学生目前的情况与学习目标。')}
              />

            <Field label={T('Student Full Name', '学生姓名')} err={errors.studentName}>
              <input type="text" value={form.studentName} onChange={set('studentName')} placeholder={T('e.g. Yunfan Yang', '例：杨芸帆')} style={inputStyle(errors.studentName)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <Field label={T('When would the student like to start?', '学生希望何时开始？')} err={errors.intendedStartTiming}>
                <select value={form.intendedStartTiming} onChange={set('intendedStartTiming')} style={inputStyle(errors.intendedStartTiming)}>
                  <option value="">{T('Select…', '请选择…')}</option>
                  {START_TIMINGS.map((option) => <option key={option.value} value={option.value}>{T(option.en, option.zh)}</option>)}
                </select>
              </Field>
            </div>

            <Field
              label={T('Why is your family considering GIIS?', '您的家庭为什么考虑 GIIS？')}
              err={errors.motivation}
              hint={T('80–1,000 characters', '80–1,000 个字符')}
            >
              <textarea
                value={form.motivation}
                onChange={set('motivation')}
                rows={4}
                minLength={80}
                maxLength={1000}
                placeholder={T('Describe the student’s needs, goals, and what a successful school experience would look like.', '请说明学生的需要、目标，以及您期望怎样的学习结果。')}
                style={{ ...inputStyle(errors.motivation), resize: 'vertical' }}
              />
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
            </>}

            {currentStep === 1 && <>
            <StepHeading
              title={T('Application Path', '申请路径')}
              body={T('Choose the correct path and tell us what records are available.', '选择适合的申请路径，并说明目前可提供的资料。')}
            />
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

                <Field
                  label={T('Completed high-school course summary', '已完成的高中课程摘要')}
                  err={errors.transferCourseSummary}
                  hint={T('Course names and approximate grades are enough for intake', '申请阶段填写课程名称和大致成绩即可')}
                >
                  <textarea
                    value={form.transferCourseSummary}
                    onChange={set('transferCourseSummary')}
                    rows={4}
                    minLength={20}
                    maxLength={1200}
                    placeholder={T('Example: English II (A), Algebra II (B), Biology (A), World History (B).', '例：English II（A）、Algebra II（B）、Biology（A）、World History（B）。')}
                    style={{ ...inputStyle(errors.transferCourseSummary), resize: 'vertical' }}
                  />
                </Field>

                <Field label={T('How will you obtain the transcript or school records?', '您准备如何取得成绩单或学校记录？')} err={errors.transcriptPlanDetails}>
                  <textarea
                    value={form.transcriptPlanDetails}
                    onChange={set('transcriptPlanDetails')}
                    rows={3}
                    minLength={10}
                    maxLength={600}
                    placeholder={T('It is okay if records are not available yet. Explain who will request them and any known obstacle.', '暂时没有成绩单也可以申请。请说明由谁申请，以及目前是否有困难。')}
                    style={{ ...inputStyle(errors.transcriptPlanDetails), resize: 'vertical' }}
                  />
                </Field>

                <Field label={T('When do you expect records to be available?', '预计何时可以提供记录？')} err={errors.transcriptExpectedTiming}>
                  <input
                    type="text"
                    value={form.transcriptExpectedTiming}
                    onChange={set('transcriptExpectedTiming')}
                    maxLength={120}
                    placeholder={T('Example: within 10 business days', '例：10 个工作日内')}
                    style={inputStyle(errors.transcriptExpectedTiming)}
                  />
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
            </>}

            {currentStep === 2 && <>
            <StepHeading
              title={T('Parent / Guardian', '家长 / 监护人')}
              body={T('Use the email that should receive application updates.', '请填写用于接收申请进度的邮箱。')}
            />

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
            </>}

            {currentStep === 3 && <>
            <StepHeading
              title={T('Review and Confirm', '确认并提交')}
              body={T('Review the summary, confirm the boundaries, then submit.', '核对摘要、确认重要说明后再提交。')}
            />
            <div style={{ display: 'grid', gap: 8, marginBottom: 18, padding: '14px 0', borderTop: '1px solid #e0e6f0', borderBottom: '1px solid #e0e6f0' }}>
              <ReviewRow label={T('Student', '学生')} value={`${form.studentName} · ${form.gradeLevel}`} />
              <ReviewRow label={T('Path', '路径')} value={form.applicantType === 'transfer' ? T('Transfer student', '转学生') : T('New student', '一般新生')} />
              <ReviewRow label={T('Start timing', '开始时间')} value={START_TIMINGS.find((option) => option.value === form.intendedStartTiming)?.[isEn ? 'en' : 'zh'] || '—'} />
              <ReviewRow label={T('Parent email', '家长邮箱')} value={form.parentEmail} />
            </div>
            <div style={{ display: 'grid', gap: 10, margin: '2px 0 20px', padding: '14px 15px', border: '1px solid #dbe4f0', borderRadius: 8, background: '#f8f9fc' }}>
              {[
                ['tuitionAware', T('I reviewed the current tuition and support levels and understand the final plan is recommended after review.', '我已查看目前的学费与支持层级，并了解学校会在审核后建议最终方案。')],
                ['noGuaranteeAcknowledged', T('I understand this application does not guarantee admission, transfer credit, grade placement, or a graduation date.', '我了解提交申请不代表保证录取、转学分、年级安排或毕业日期。')],
                ['responseCommitmentAcknowledged', T('If GIIS contacts us, our family will reply within 72 hours or tell admissions that we need more time.', '如果 GIIS 联系我们，家庭会在 72 小时内回复，或告知招生团队需要更多时间。')],
              ].map(([field, label]) => (
                <label key={field} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: '#394255', fontSize: 12.5, lineHeight: 1.55, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[field]} onChange={toggle(field)} style={{ marginTop: 3, accentColor: '#2b3d6d' }} />
                  <span>{label}{errors[field] ? <strong style={{ color: '#b91c1c' }}> · {errors[field]}</strong> : null}</span>
                </label>
              ))}
            </div>
            </>}

            {intakeMode === 'unavailable' && currentStep === 3 && (
              <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '10px 12px', marginBottom: 12, color: '#5c4a12', fontSize: 12.5, lineHeight: 1.55 }}>
                {T('The application service could not be verified. Please retry before submitting.', '目前无法确认申请服务状态，请重试后再提交。')}
                {' '}
                <button type="button" onClick={() => setCapabilityCheck((value) => value + 1)} style={{ border: 0, padding: 0, background: 'none', color: '#2b3d6d', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>
                  {T('Retry', '重试')}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
              {currentStep > 0
                ? <button type="button" onClick={goToPreviousStep} disabled={submitting} style={secondaryButton}>{T('Back', '上一步')}</button>
                : <span />}
              {currentStep < stepFields.length - 1 ? (
                <button type="button" onClick={goToNextStep} style={primaryButton}>{T('Continue', '下一步')}</button>
              ) : (
                <button type="submit" disabled={submitting || intakeMode === 'loading' || intakeMode === 'unavailable'} style={{
                  ...primaryButton,
                  background: submitting || intakeMode === 'loading' || intakeMode === 'unavailable' ? '#9baac8' : '#2b3d6d',
                  cursor: submitting || intakeMode === 'loading' || intakeMode === 'unavailable' ? 'not-allowed' : 'pointer',
                }}>
                  {submitting ? T('Submitting…', '提交中…') : intakeMode === 'loading' ? T('Checking service…', '正在确认服务…') : T('Submit application', '提交申请')}
                </button>
              )}
            </div>

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

function ApplicationStepper({ currentStep, language }) {
  const isEn = language !== 'zh';
  const steps = isEn
    ? ['Student', 'Path', 'Parent', 'Confirm']
    : ['学生', '路径', '家长', '确认'];
  return (
    <nav aria-label={isEn ? 'Application progress' : '申请进度'} style={{ marginBottom: 28 }}>
      <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
        {steps.map((label, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;
          return (
            <li key={label} aria-current={active ? 'step' : undefined} style={{ minWidth: 0 }}>
              <div style={{ height: 4, borderRadius: 2, background: active || complete ? '#2b3d6d' : '#dfe4ec', marginBottom: 7 }} />
              <span style={{ display: 'block', color: active ? '#1a2d5a' : complete ? '#4f5868' : '#8a92a1', fontSize: 11, fontWeight: active ? 900 : 700, overflowWrap: 'anywhere' }}>
                {index + 1}. {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepHeading({ title, body }) {
  return (
    <header style={{ marginBottom: 20 }}>
      <p style={{ margin: '0 0 5px', color: '#1a2d5a', fontSize: 18, fontWeight: 800 }}>{title}</p>
      <p style={{ margin: 0, color: '#687083', fontSize: 13, lineHeight: 1.55 }}>{body}</p>
    </header>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 0.35fr) minmax(0, 1fr)', gap: 12, fontSize: 13, lineHeight: 1.5 }}>
      <strong style={{ color: '#687083' }}>{label}</strong>
      <span style={{ color: '#1a1d24', overflowWrap: 'anywhere' }}>{value || '—'}</span>
    </div>
  );
}

const primaryButton = { minHeight: 44, padding: '11px 18px', borderRadius: 8, background: '#2b3d6d', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' };
const secondaryButton = { ...primaryButton, background: '#fff', color: '#2b3d6d', border: '1.5px solid #cbd3df' };
