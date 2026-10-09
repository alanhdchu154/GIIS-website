import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

const RESULT_LABELS = {
  ready: 'Ready for conditional start',
  ready_with_bridge: 'Ready with Bridge',
  not_yet: 'Not Yet',
  pending_clarification: 'Pending Clarification',
};

function dateOnly(value) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function initialDraft(app) {
  const record = app.placementDecision || {};
  return {
    assessmentDate: dateOnly(record.assessmentDate),
    assessor: record.assessor || '',
    englishScore: record.englishScore ?? '',
    mathScore: record.mathScore ?? '',
    scienceScore: record.scienceScore ?? '',
    assistanceNotes: record.assistanceNotes || '',
    evidenceReviewed: record.evidenceReviewed || '',
    independentLearningNotes: record.independentLearningNotes || '',
    result: record.result || 'pending_clarification',
    recommendedGradeLevel: record.recommendedGradeLevel || app.gradeLevel || 'Grade 9',
    decisionRationale: record.decisionRationale || '',
    bridgePlan: record.bridgePlan || '',
    firstTermPlan: record.firstTermPlan || '',
    firstWeekReviewer: record.firstWeekReviewer || '',
    recheckDate: dateOnly(record.recheckDate),
  };
}

const fieldStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid #d4d8e0',
  borderRadius: 7,
  boxSizing: 'border-box',
  color: '#1a1d24',
  background: '#fff',
  fontSize: 13,
};

function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4f5b70', marginBottom: 5 }}>{label}</span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 10.5, color: '#7b8494', marginTop: 4 }}>{hint}</span>}
    </label>
  );
}

export default function PlacementDecisionEditor({ app, onChanged, showToast }) {
  const [draft, setDraft] = useState(() => initialDraft(app));
  const [saving, setSaving] = useState('');
  const [principalApprover, setPrincipalApprover] = useState(app.placementDecision?.principalApprover || '');
  const record = app.placementDecision;
  const signed = !!record?.principalApprovedAt;

  useEffect(() => {
    setDraft(initialDraft(app));
    setPrincipalApprover(app.placementDecision?.principalApprover || '');
  }, [app]);

  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  async function markRequired() {
    setSaving('required');
    try {
      const response = await fetch(`${API}/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ placementRequired: true, nextAction: 'Complete placement decision record' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return showToast(data.error || 'Could not require placement review');
      showToast('Placement review is now required');
      await onChanged();
    } finally {
      setSaving('');
    }
  }

  async function saveDecision() {
    setSaving('decision');
    try {
      const response = await fetch(`${API}/api/applications/${app.id}/placement-decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(draft),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return showToast(data.error || 'Could not save placement decision');
      showToast(data.applicationResetToPending ? 'Placement saved; application reset to Pending' : 'Placement decision saved');
      await onChanged();
    } finally {
      setSaving('');
    }
  }

  async function approveDecision() {
    if (!principalApprover.trim()) return showToast('Principal approver name is required');
    const confirmed = window.confirm(
      `Record ${principalApprover.trim()} as approving the current ${RESULT_LABELS[record?.result] || 'placement'} decision? This locks the record.`
    );
    if (!confirmed) return;
    setSaving('approval');
    try {
      const response = await fetch(`${API}/api/applications/${app.id}/placement-decision/principal-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ principalApprover: principalApprover.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return showToast(data.error || 'Could not record Principal approval');
      showToast(data.alreadyApproved ? 'Principal approval was already recorded' : 'Principal placement decision recorded');
      await onChanged();
    } finally {
      setSaving('');
    }
  }

  if (!app.placementRequired) {
    return (
      <div style={{ border: '1.5px solid #d8deea', borderRadius: 10, padding: '14px 16px', marginBottom: 16, background: '#fbfcff' }}>
        <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 800, color: '#26324f' }}>Placement Decision Record</p>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5c6578', lineHeight: 1.5 }}>
          Use for a candidate whose grade-entry readiness requires documented academic review. Marking this required blocks approval until a signed Ready outcome exists.
        </p>
        <button type="button" onClick={markRequired} disabled={!!saving}
          style={{ padding: '8px 14px', borderRadius: 7, border: 'none', background: '#2b3d6d', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
          {saving === 'required' ? 'Saving…' : 'Require placement review'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: `1.5px solid ${signed ? '#81c784' : '#f0b45a'}`, borderRadius: 10, padding: '16px', marginBottom: 16, background: signed ? '#f4fbf5' : '#fffaf2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 900, color: '#26324f' }}>Placement Decision Record</p>
          <p style={{ margin: 0, fontSize: 11.5, color: '#5c6578' }}>
            {signed ? `Signed by ${record.principalApprover} · ${new Date(record.principalApprovedAt).toLocaleString()}` : 'Required · Principal approval not yet recorded'}
          </p>
        </div>
        {record?.result && (
          <span style={{ padding: '5px 9px', borderRadius: 999, background: signed ? '#dff3e2' : '#fff0d6', color: signed ? '#166534' : '#8a4b08', fontSize: 11, fontWeight: 900 }}>
            {RESULT_LABELS[record.result] || record.result}
          </span>
        )}
      </div>

      <fieldset disabled={signed || !!saving} style={{ border: 0, padding: 0, margin: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 12 }}>
          <Field label="Assessment date"><input type="date" value={draft.assessmentDate} onChange={(event) => setField('assessmentDate', event.target.value)} style={fieldStyle} /></Field>
          <Field label="Assessor"><input value={draft.assessor} onChange={(event) => setField('assessor', event.target.value)} style={fieldStyle} /></Field>
          <Field label="English / 30"><input type="number" min="0" max="30" value={draft.englishScore} onChange={(event) => setField('englishScore', event.target.value)} style={fieldStyle} /></Field>
          <Field label="Math / 36"><input type="number" min="0" max="36" value={draft.mathScore} onChange={(event) => setField('mathScore', event.target.value)} style={fieldStyle} /></Field>
          <Field label="Science / 24"><input type="number" min="0" max="24" value={draft.scienceScore} onChange={(event) => setField('scienceScore', event.target.value)} style={fieldStyle} /></Field>
          <Field label="Result">
            <select value={draft.result} onChange={(event) => setField('result', event.target.value)} style={fieldStyle}>
              {Object.entries(RESULT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Recommended grade"><input value={draft.recommendedGradeLevel} onChange={(event) => setField('recommendedGradeLevel', event.target.value)} style={fieldStyle} /></Field>
          <Field label="First-week reviewer"><input value={draft.firstWeekReviewer} onChange={(event) => setField('firstWeekReviewer', event.target.value)} style={fieldStyle} /></Field>
          <Field label="Recheck date" hint="Required for Ready with Bridge"><input type="date" value={draft.recheckDate} onChange={(event) => setField('recheckDate', event.target.value)} style={fieldStyle} /></Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          <Field label="Evidence reviewed"><textarea rows={3} value={draft.evidenceReviewed} onChange={(event) => setField('evidenceReviewed', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
          <Field label="Assistance or accommodations"><textarea rows={3} value={draft.assistanceNotes} onChange={(event) => setField('assistanceNotes', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
          <Field label="Independent-learning observations"><textarea rows={3} value={draft.independentLearningNotes} onChange={(event) => setField('independentLearningNotes', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
          <Field label="Decision rationale"><textarea rows={3} value={draft.decisionRationale} onChange={(event) => setField('decisionRationale', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
          <Field label="Bridge or next-step plan"><textarea rows={3} value={draft.bridgePlan} onChange={(event) => setField('bridgePlan', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
          <Field label="First-term plan"><textarea rows={3} value={draft.firstTermPlan} onChange={(event) => setField('firstTermPlan', event.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} /></Field>
        </div>
      </fieldset>

      {!signed && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'end', marginTop: 14, flexWrap: 'wrap' }}>
          <button type="button" onClick={saveDecision} disabled={!!saving}
            style={{ padding: '9px 15px', borderRadius: 7, border: 'none', background: '#2b3d6d', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            {saving === 'decision' ? 'Saving…' : record ? 'Update placement record' : 'Save placement record'}
          </button>
          {record && (
            <>
              <Field label="Principal approver">
                <input value={principalApprover} onChange={(event) => setPrincipalApprover(event.target.value)} placeholder="Shiyu Zhang, Ph.D." style={{ ...fieldStyle, minWidth: 220 }} />
              </Field>
              <button type="button" onClick={approveDecision} disabled={!!saving}
                style={{ padding: '9px 15px', borderRadius: 7, border: 'none', background: '#2e7d32', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                {saving === 'approval' ? 'Recording…' : 'Record Principal approval'}
              </button>
            </>
          )}
        </div>
      )}

      <p style={{ margin: '12px 0 0', fontSize: 10.5, color: '#6f7786', lineHeight: 1.45 }}>
        This record documents placement only. It does not award transfer credit, create a transcript row, enroll courses, or guarantee graduation.
      </p>
    </div>
  );
}
