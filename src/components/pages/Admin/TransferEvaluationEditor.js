import React, { useEffect, useMemo, useState } from 'react';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

const RECORD_TYPES = [
  ['official_transcript', 'Official transcript'],
  ['report_card', 'Report card'],
  ['homeschool', 'Homeschool record'],
  ['international', 'International record'],
  ['other', 'Other verified record'],
];
const MAPPED_AREAS = [
  ['english', 'English'], ['math', 'Math'], ['science', 'Science'],
  ['social_studies', 'Social Studies'], ['pe_health', 'PE / Health'],
  ['elective', 'Elective'], ['other', 'Other'],
];
const DECISIONS = [
  ['credit_and_gpa', 'Credit + GPA'],
  ['credit_only', 'Credit only'],
  ['conditional', 'Conditional'],
  ['rejected', 'Rejected'],
  ['deferred', 'Deferred'],
];
const VALIDATIONS = [
  ['none', 'None'], ['first_term', 'First-term performance'],
  ['portfolio', 'Portfolio'], ['assessment', 'Assessment'],
  ['school_verification', 'School verification'], ['other', 'Other'],
];

function blankCourse() {
  return {
    originalCourseTitle: '', originalTerm: '', originalCredits: '', originalGrade: '',
    gradingScaleReceived: false, mappedArea: 'elective', acceptedCredits: 0,
    decision: 'deferred', gpaIncluded: false, weightedTreatment: 'none',
    validationRequired: 'none', rationale: '',
  };
}

function draftFrom(application) {
  const evaluation = application.transferEvaluation;
  return {
    reviewer: evaluation?.reviewer || '',
    priorSchool: evaluation?.priorSchool || application.currentSchool || '',
    recordType: evaluation?.recordType || 'official_transcript',
    evidenceLevel: evaluation?.evidenceLevel || 'A',
    recommendedGradeLevel: evaluation?.recommendedGradeLevel || application.gradeLevel || '',
    familySummary: evaluation?.familySummary || '',
    validationPlan: evaluation?.validationPlan || '',
    principalApprover: evaluation?.principalApprover || '',
    courses: evaluation?.courses?.length
      ? evaluation.courses.map((course) => ({ ...course, acceptedCredits: Number(course.acceptedCredits || 0) }))
      : [blankCourse()],
  };
}

export default function TransferEvaluationEditor({ application, language = 'en', notify, onChanged }) {
  const T = (en, zh) => (language === 'zh' ? zh : en);
  const [draft, setDraft] = useState(() => draftFrom(application));
  const [saving, setSaving] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => setDraft(draftFrom(application)), [application]);

  const acceptedCredits = useMemo(() => draft.courses.reduce((sum, course) => (
    ['credit_and_gpa', 'credit_only'].includes(course.decision)
      ? sum + Number(course.acceptedCredits || 0)
      : sum
  ), 0), [draft.courses]);

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function setCourse(index, field, value) {
    setDraft((current) => ({
      ...current,
      courses: current.courses.map((course, courseIndex) => {
        if (courseIndex !== index) return course;
        const next = { ...course, [field]: value };
        if (field === 'decision') {
          next.gpaIncluded = value === 'credit_and_gpa';
          if (['rejected', 'deferred'].includes(value)) next.acceptedCredits = 0;
          if (value !== 'conditional') next.validationRequired = 'none';
        }
        return next;
      }),
    }));
  }

  async function saveEvaluation() {
    if (application.transferEvaluation?.principalApprovedAt) {
      const confirmed = window.confirm(T(
        'Editing this decision will clear the recorded principal approval and return the application to Pending. Continue?',
        '修改此决定会清除已记录的校长核准，并将申请退回待审核。是否继续？',
      ));
      if (!confirmed) return false;
    }
    setSaving('evaluation');
    try {
      const { principalApprover, ...payload } = draft;
      const response = await fetch(`${API}/api/applications/${application.id}/transfer-evaluation`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        notify(data.error || T('Could not save transfer evaluation.', '无法保存转学分评估。'));
        return false;
      }
      notify(data.applicationResetToPending
        ? T('Evaluation saved; application returned to Pending for re-approval.', '评估已保存；申请已退回待审核，需重新核准。')
        : T('Transfer evaluation saved. Principal approval is still required.', '转学分评估已保存，仍需校长核准。'));
      await onChanged();
      return true;
    } finally {
      setSaving('');
    }
  }

  function validateCurrentStep() {
    if (currentStep === 0 && (!draft.reviewer.trim() || !draft.priorSchool.trim() || !draft.recommendedGradeLevel.trim())) {
      notify(T('Complete the reviewer, prior school, and recommended grade first.', '请先填写审核人、原学校与建议年级。'));
      return false;
    }
    if (currentStep === 1 && draft.courses.some((course) => !course.originalCourseTitle.trim())) {
      notify(T('Every course row needs a course title.', '每一笔课程都需要填写课程名称。'));
      return false;
    }
    if (currentStep === 2 && !draft.familySummary.trim()) {
      notify(T('Write the family decision summary before saving.', '保存前请填写给家庭的决定摘要。'));
      return false;
    }
    return true;
  }

  async function continueWorkflow() {
    if (!validateCurrentStep()) return;
    if (currentStep === 2) {
      const saved = await saveEvaluation();
      if (!saved) return;
    }
    setCurrentStep((step) => Math.min(step + 1, 3));
  }

  async function recordPrincipalApproval() {
    if (!draft.principalApprover.trim()) {
      notify(T('Enter the principal approver name first.', '请先填写校长核准人姓名。'));
      return;
    }
    const confirmed = window.confirm(T(
      'Record that the named principal approver reviewed this course-by-course decision?',
      '确认记录该校长核准人已逐课审核此决定？',
    ));
    if (!confirmed) return;
    setSaving('approval');
    try {
      const response = await fetch(`${API}/api/applications/${application.id}/transfer-evaluation/principal-approval`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principalApprover: draft.principalApprover }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return notify(data.error || T('Could not record principal approval.', '无法记录校长核准。'));
      notify(T('Principal approval recorded.', '校长核准已记录。'));
      await onChanged();
    } finally {
      setSaving('');
    }
  }

  return (
    <section style={{ borderTop: '1px solid #dce4ef', borderBottom: '1px solid #dce4ef', padding: '16px 0', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <p style={eyebrow}>{T('Transfer Credit Decision', '转学分决定')}</p>
          <h3 style={{ margin: '2px 0 4px', fontSize: 17, color: '#1a2d5a' }}>{T('Course-by-course review before payment', '付款前逐课审核')}</h3>
          <p style={{ margin: 0, fontSize: 12, color: '#5c6578' }}>
            {T(`${acceptedCredits.toFixed(2)} confirmed credits · ${(24 - acceptedCredits).toFixed(2)} framework credits remaining`, `确认 ${acceptedCredits.toFixed(2)} 学分 · 24 学分框架尚余 ${(24 - acceptedCredits).toFixed(2)}`)}
          </p>
        </div>
        <span style={{ ...badge, background: application.transferEvaluation?.principalApprovedAt ? '#dcfce7' : '#fef3c7', color: application.transferEvaluation?.principalApprovedAt ? '#166534' : '#92400e' }}>
          {application.transferEvaluation?.principalApprovedAt ? T('Principal approved', '校长已核准') : T('Approval pending', '等待核准')}
        </span>
      </div>

      {application.recordsStatus !== 'verified' && (
        <p style={{ margin: '0 0 12px', padding: '9px 11px', background: '#fff8e6', color: '#6b4b00', fontSize: 12, lineHeight: 1.5 }}>
          {T('Official records must be marked Verified before principal approval can be recorded.', '正式资料必须标记为已验证，之后才能记录校长核准。')}
        </p>
      )}

      <WorkflowStepper currentStep={currentStep} language={language} />

      {currentStep === 0 && <>
      <StepHeading title={T('1. Verify source records', '1. 核对资料来源')} body={T('Record who reviewed the evidence and what type of record supports the decision.', '记录审核人，以及本次决定依据的资料类型。')} />
      <div style={grid}>
        <Field label={T('Academic reviewer', '学术审核人')} value={draft.reviewer} onChange={(value) => setField('reviewer', value)} />
        <Field label={T('Prior school/provider', '原学校或机构')} value={draft.priorSchool} onChange={(value) => setField('priorSchool', value)} />
        <SelectField label={T('Record type', '资料类型')} value={draft.recordType} options={RECORD_TYPES} onChange={(value) => setField('recordType', value)} />
        <SelectField label={T('Evidence level', '证据等级')} value={draft.evidenceLevel} options={['A', 'B', 'C', 'D'].map((value) => [value, `Level ${value}`])} onChange={(value) => setField('evidenceLevel', value)} />
        <Field label={T('Recommended grade', '建议年级')} value={draft.recommendedGradeLevel} onChange={(value) => setField('recommendedGradeLevel', value)} />
      </div>
      </>}

      {currentStep === 1 && <>
      <StepHeading title={T('2. Map courses and credits', '2. 逐课认定学分')} body={T('Decide credit, GPA treatment, and any validation requirement course by course.', '逐课决定学分、GPA 处理方式与验证要求。')} />
      <div style={{ marginTop: 16 }}>
        {draft.courses.map((course, index) => (
          <div key={`${index}-${course.id || 'new'}`} style={{ padding: '14px 0', borderTop: '1px solid #edf0f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ color: '#2b3d6d', fontSize: 13 }}>{T(`Prior course ${index + 1}`, `原课程 ${index + 1}`)}</strong>
              {draft.courses.length > 1 && (
                <button type="button" onClick={() => setDraft((current) => ({ ...current, courses: current.courses.filter((_, i) => i !== index) }))} style={quietButton}>
                  {T('Remove', '移除')}
                </button>
              )}
            </div>
            <div style={grid}>
              <Field label={T('Course title', '课程名称')} value={course.originalCourseTitle} onChange={(value) => setCourse(index, 'originalCourseTitle', value)} />
              <Field label={T('Term/year', '学期或学年')} value={course.originalTerm} onChange={(value) => setCourse(index, 'originalTerm', value)} />
              <Field label={T('Original credits/hours', '原学分或时数')} value={course.originalCredits} onChange={(value) => setCourse(index, 'originalCredits', value)} />
              <Field label={T('Original grade', '原成绩')} value={course.originalGrade} onChange={(value) => setCourse(index, 'originalGrade', value)} />
              <SelectField label={T('GIIS mapped area', 'GIIS 对应领域')} value={course.mappedArea} options={MAPPED_AREAS} onChange={(value) => setCourse(index, 'mappedArea', value)} />
              <SelectField label={T('Decision', '决定')} value={course.decision} options={DECISIONS} onChange={(value) => setCourse(index, 'decision', value)} />
              <Field label={T('Accepted credits', '接受学分')} type="number" min="0" max="5" step="0.25" value={course.acceptedCredits} onChange={(value) => setCourse(index, 'acceptedCredits', value)} />
              <SelectField label={T('Validation', '验证方式')} value={course.validationRequired} options={VALIDATIONS} onChange={(value) => setCourse(index, 'validationRequired', value)} />
              <SelectField label={T('Weighting', '加权处理')} value={course.weightedTreatment} options={[['none', 'None'], ['ap_equivalent', 'AP-equivalent approved'], ['advanced', 'Advanced approved']]} onChange={(value) => setCourse(index, 'weightedTreatment', value)} />
              <label style={labelStyle}>
                {T('Grading scale', '评分标准')}
                <span style={{ ...control, display: 'flex', alignItems: 'center', gap: 8, minHeight: 38 }}>
                  <input type="checkbox" checked={course.gradingScaleReceived} onChange={(event) => setCourse(index, 'gradingScaleReceived', event.target.checked)} />
                  {T('Received', '已收到')}
                </span>
              </label>
            </div>
            <Field label={T('Course rationale', '课程决定理由')} value={course.rationale} multiline onChange={(value) => setCourse(index, 'rationale', value)} />
          </div>
        ))}
        <button type="button" onClick={() => setDraft((current) => ({ ...current, courses: [...current.courses, blankCourse()] }))} style={quietButton}>
          {T('+ Add prior course', '+ 新增原课程')}
        </button>
      </div>
      </>}

      {currentStep === 2 && <>
      <StepHeading title={T('3. Prepare the family decision', '3. 准备家庭说明')} body={T('Summarize accepted credit and any remaining validation in plain language.', '用清楚的语言说明接受学分与后续验证要求。')} />
      <div style={{ ...grid, marginTop: 16 }}>
        <Field label={T('Family decision summary', '给家庭的决定摘要')} value={draft.familySummary} multiline onChange={(value) => setField('familySummary', value)} />
        <Field label={T('Overall validation plan', '整体验证计划')} value={draft.validationPlan} multiline onChange={(value) => setField('validationPlan', value)} />
      </div>
      </>}

      {currentStep === 3 && <>
      <StepHeading title={T('4. Record principal approval', '4. 记录校长核准')} body={T('Confirm the saved course decision, then record the human approver.', '确认已保存的逐课决定，再记录人工核准人。')} />
      <div style={{ padding: '10px 0 14px', borderTop: '1px solid #edf0f5', fontSize: 12.5, color: '#394255', lineHeight: 1.6 }}>
        <strong>{acceptedCredits.toFixed(2)}</strong> {T('credits accepted across', '个接受学分，共')}{' '}
        <strong>{draft.courses.length}</strong> {T('course rows.', '笔课程。')}
        {!application.transferEvaluation?.courses?.length && (
          <span style={{ display: 'block', color: '#92400e', marginTop: 5 }}>
            {T('Save step 3 before recording approval.', '请先完成并保存第 3 步。')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 14 }}>
        <div style={{ flex: '1 1 220px' }}>
          <Field label={T('Principal approver', '校长核准人')} value={draft.principalApprover} onChange={(value) => setField('principalApprover', value)} />
        </div>
        <button type="button" onClick={recordPrincipalApproval} disabled={!!saving || application.recordsStatus !== 'verified' || !application.transferEvaluation?.courses?.length} style={{ ...primaryButton, background: '#166534' }}>
          {saving === 'approval' ? T('Recording...', '记录中...') : T('Record principal approval', '记录校长核准')}
        </button>
      </div>
      </>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #edf0f5' }}>
        {currentStep > 0
          ? <button type="button" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))} disabled={!!saving} style={quietButton}>{T('Back', '上一步')}</button>
          : <span />}
        {currentStep < 3 && (
          <button type="button" onClick={continueWorkflow} disabled={!!saving} style={primaryButton}>
            {saving === 'evaluation' ? T('Saving...', '保存中...') : currentStep === 2 ? T('Save and continue', '保存并继续') : T('Continue', '下一步')}
          </button>
        )}
      </div>
    </section>
  );
}

function WorkflowStepper({ currentStep, language }) {
  const labels = language === 'zh' ? ['资料', '逐课', '摘要', '核准'] : ['Records', 'Courses', 'Summary', 'Approval'];
  return (
    <ol aria-label={language === 'zh' ? '转学分审核进度' : 'Transfer review progress'} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
      {labels.map((label, index) => (
        <li key={label} aria-current={currentStep === index ? 'step' : undefined} style={{ minWidth: 0 }}>
          <div style={{ height: 4, borderRadius: 2, background: index <= currentStep ? '#2b3d6d' : '#dfe4ec', marginBottom: 6 }} />
          <span style={{ display: 'block', color: currentStep === index ? '#1a2d5a' : '#7a8394', fontSize: 10.5, fontWeight: currentStep === index ? 900 : 700, overflowWrap: 'anywhere' }}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function StepHeading({ title, body }) {
  return (
    <header style={{ marginBottom: 12 }}>
      <h4 style={{ margin: '0 0 4px', color: '#1a2d5a', fontSize: 14 }}>{title}</h4>
      <p style={{ margin: 0, color: '#687083', fontSize: 11.5, lineHeight: 1.55 }}>{body}</p>
    </header>
  );
}

function Field({ label, value, onChange, multiline = false, ...inputProps }) {
  const Element = multiline ? 'textarea' : 'input';
  return (
    <label style={labelStyle}>
      {label}
      <Element {...inputProps} rows={multiline ? 3 : undefined} value={value} onChange={(event) => onChange(event.target.value)} style={{ ...control, resize: multiline ? 'vertical' : undefined }} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label style={labelStyle}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} style={control}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

const eyebrow = { margin: 0, fontSize: 10, fontWeight: 900, color: '#2b3d6d', textTransform: 'uppercase' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 };
const labelStyle = { display: 'grid', gap: 5, fontSize: 10, fontWeight: 800, color: '#687083', textTransform: 'uppercase' };
const control = { width: '100%', boxSizing: 'border-box', padding: '8px 9px', borderRadius: 6, border: '1.5px solid #d4d8e0', background: '#fff', color: '#1a1d24', fontSize: 12.5, fontFamily: 'Inter, sans-serif' };
const badge = { padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 };
const primaryButton = { padding: '9px 14px', borderRadius: 6, border: 0, background: '#2b3d6d', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' };
const quietButton = { padding: '6px 9px', borderRadius: 6, border: '1px solid #cbd3df', background: '#fff', color: '#2b3d6d', fontSize: 11, fontWeight: 800, cursor: 'pointer' };
