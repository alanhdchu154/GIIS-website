import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import { AdminNav } from './AdminChrome';
import { getAdminSession } from '../../../api/authStorage';

const API = getApiBase();

const STATUS_COLORS = {
  pending:  { bg: '#fff3e0', fg: '#e65100', label: 'Pending' },
  approved: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Approved' },
  rejected: { bg: '#fce4ec', fg: '#c62828', label: 'Rejected' },
};

const ENROLLMENT_STATE_COLORS = {
  pending_review: { bg: '#fff7ed', fg: '#c2410c' },
  approved_unactivated: { bg: '#eff6ff', fg: '#1d4ed8' },
  accounts_created_unpaid: { bg: '#fef3c7', fg: '#92400e' },
  paid_unlinked: { bg: '#fde68a', fg: '#854d0e' },
  active_paid: { bg: '#dcfce7', fg: '#166534' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
};

const REJECTION_REASONS = [
  { value: 'grade_mismatch',  label: 'Grade level mismatch',       detail: 'We currently serve Grades 9–12 only.' },
  { value: 'capacity_full',   label: 'Capacity full',              detail: 'We have reached our current enrollment limit.' },
  { value: 'language_needs',  label: 'Language needs',             detail: 'We are unable to adequately support the preferred instruction language at this time.' },
  { value: 'incomplete',      label: 'Incomplete application',     detail: 'The application was missing required information.' },
  { value: 'other',           label: 'Other',                      detail: '' },
];

const APPLICANT_TYPE_LABELS = {
  new: 'New student',
  transfer: 'Transfer student',
  'not provided': 'Not provided',
};

const APPLICATION_NOTE_LABELS = {
  previousCredits: {
    '0-5': '0–5 credits',
    '6-11': '6–11 credits',
    '12-17': '12–17 credits',
    '18-23': '18–23 credits',
    '24+': '24+ credits',
    'not applicable': 'Not applicable',
    'not provided': 'Not provided',
  },
  graduationTiming: {
    asap: 'As soon as realistically possible',
    '1-year': 'Within 1 school year',
    '2-years': 'Within 2 school years',
    'not-sure': 'Not sure yet',
    'standard path': 'Standard new-student path',
    'not provided': 'Not provided',
  },
  transcriptAvailable: {
    yes: 'Family says transcript can be provided',
    partial: 'Family has partial records only',
    'not-yet': 'Family does not have records yet',
    'not applicable': 'Not applicable',
    'not provided': 'Not provided',
  },
  concern: {
    'grade9-path': 'Which starting path fits my child?',
    credits: 'Will credits transfer?',
    graduation: 'Can my child graduate on time?',
    records: 'Will the school record be accepted?',
    motivation: 'Will my child stay on track?',
    'not provided': 'Not provided',
  },
};

const MANUAL_PAYMENT_PLANS = {
  self_paced_monthly: { label: 'Self-Paced Founders · $49/month', amountCents: 4900 },
  self_paced_annual: { label: 'Self-Paced Founders · $499/year', amountCents: 49900 },
  guided_monthly: { label: 'Guided · $149/month', amountCents: 14900 },
  premium_monthly: { label: 'Premium / College Pathway · $299/month', amountCents: 29900 },
};

const MANUAL_PAYMENT_METHODS = {
  manual_stripe_invoice: 'Manual Stripe invoice',
  manual_stripe_payment_link: 'Manual Stripe payment link',
  stripe_dashboard_invoice: 'Stripe Dashboard invoice',
  stripe_dashboard_payment_link: 'Stripe Dashboard payment link',
};

function money(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function todayReceiptDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function manualPaymentReceiptText(receipt) {
  if (!receipt) return '';
  const { app, draft, subscription } = receipt;
  return `Subject: GIIS payment receipt - ${app.studentName}

Genesis Innovation International School
Florida-registered private school
Payment receipt

Date recorded: ${todayReceiptDate()}
Student: ${app.studentName}
Parent/guardian: ${app.parentName}
Parent email: ${app.parentEmail}
Plan: ${draft.planLabel}
Amount recorded: ${money(draft.amountCents)}
Payment method: ${draft.paymentMethodLabel}
Stripe reference: ${draft.paymentReference}
GIIS subscription record: ${subscription?.id || 'recorded in admin system'}

This payment was recorded after GIIS admissions/path review. Student and parent portal access is activated after both enrollment fit and payment status are clear.

Refund policy: https://genesisideas.school/refund-policy

If anything in this receipt looks incorrect, please reply to admissions@genesisideas.school.

Best,
GIIS Admissions`;
}

function labelApplicationValue(field, value) {
  const clean = String(value || 'not provided').trim();
  if (field === 'applicantType') return APPLICANT_TYPE_LABELS[clean] || clean || 'Not provided';
  return APPLICATION_NOTE_LABELS[field]?.[clean] || clean || 'Not provided';
}

function parseApplicationReviewNotes(notes = '') {
  const text = String(notes);
  const current = text.match(
    /^Applicant Review:\s*type=(.*?);\s*previousCredits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);\s*Required Records:\s*(.*?);\s*Family Notes:\s*(.*)$/s
  );
  if (current) {
    return {
      applicantType: current[1].trim(),
      previousCredits: current[2].trim(),
      graduationTiming: current[3].trim(),
      transcriptAvailable: current[4].trim(),
      concern: current[5].trim(),
      requiredRecords: current[6].trim(),
      familyNotes: current[7].trim(),
    };
  }

  const legacy = text.match(
    /^Transfer Path Review:\s*credits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);\s*Family Notes:\s*(.*)$/s
  );
  if (!legacy) return null;
  return {
    applicantType: 'transfer',
    previousCredits: legacy[1].trim(),
    graduationTiming: legacy[2].trim(),
    transcriptAvailable: legacy[3].trim(),
    concern: legacy[4].trim(),
    requiredRecords: 'Legacy transfer review note. Confirm official transcript or school report before final credit decision.',
    familyNotes: legacy[5].trim(),
  };
}

function ApplicantReviewPanel({ notes }) {
  const review = parseApplicationReviewNotes(notes);
  if (!review) {
    if (!notes) return null;
    return (
      <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1a1d24', marginBottom: 14 }}>
        <strong>Applicant notes:</strong> {notes}
      </div>
    );
  }

  const isTransfer = review.applicantType === 'transfer';
  const transferNeedsRecordReview = isTransfer;
  const fields = isTransfer
    ? [
        ['Applicant Type', labelApplicationValue('applicantType', review.applicantType)],
        ['Previous Credits', labelApplicationValue('previousCredits', review.previousCredits)],
        ['Graduation Timing', labelApplicationValue('graduationTiming', review.graduationTiming)],
        ['Family Transcript Status', labelApplicationValue('transcriptAvailable', review.transcriptAvailable)],
        ['Main Concern', labelApplicationValue('concern', review.concern)],
      ]
    : [
        ['Applicant Type', labelApplicationValue('applicantType', review.applicantType)],
        ['Path', labelApplicationValue('graduationTiming', review.graduationTiming)],
        ['Transfer Transcript', labelApplicationValue('transcriptAvailable', review.transcriptAvailable)],
        ['Main Concern', labelApplicationValue('concern', review.concern)],
      ];

  return (
    <div style={{ background: '#f8fbff', border: '1px solid #cfe0f8', borderRadius: 10, padding: '13px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#2b3d6d', letterSpacing: '1px', textTransform: 'uppercase' }}>Application Path Review</p>
        <span style={{ fontSize: 11, color: '#5c6578' }}>Confirm records before approve / activate</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {fields.map(([label, value]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
            <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, lineHeight: 1.35 }}>{value}</p>
          </div>
        ))}
      </div>
      {review.requiredRecords && (
        <div style={{ marginTop: 10, background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Records Needed</p>
          <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, lineHeight: 1.45 }}>{review.requiredRecords}</p>
        </div>
      )}
      {transferNeedsRecordReview && (
        <div style={{ marginTop: 10, background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#8a5a00', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Admin Record Review Required</p>
          <p style={{ fontSize: 12.5, color: '#5c4a12', margin: 0, lineHeight: 1.45 }}>
            Family transcript status is self-reported. Approve only after official transcript or verifiable school records are received and reviewed. Partial records may support an estimate, not final transfer credit.
          </p>
        </div>
      )}
      {review.familyNotes && review.familyNotes !== 'none' && (
        <div style={{ marginTop: 10, background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Family Notes</p>
          <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, lineHeight: 1.45 }}>{review.familyNotes}</p>
        </div>
      )}
    </div>
  );
}

function rejectionEmailText(app, reason) {
  const detail = REJECTION_REASONS.find(r => r.value === reason)?.detail || '';
  return `Subject: Your GIIS Application — Update

Dear ${app.parentName},

Thank you for your interest in Genesis of Ideas International School and for taking the time to apply on behalf of ${app.studentName}.

After reviewing your application, we are unfortunately unable to move forward at this time.${detail ? `\n\nReason: ${detail}` : ''}

We appreciate your consideration of GIIS and wish ${app.studentName} the very best in their academic journey.

If you have questions or believe this decision was made in error, please reply to this email or contact us at admissions@genesisideas.school.

Warm regards,
The GIIS Admissions Team
Genesis of Ideas International School
admissions@genesisideas.school`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ApplicationsQueue() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState('');
  const [toast, setToast] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { appId, parentName, studentName }
  const [manualPaymentModal, setManualPaymentModal] = useState(null);
  const [manualPaymentReceipt, setManualPaymentReceipt] = useState(null);
  const [manualPaymentDraft, setManualPaymentDraft] = useState({
    planType: 'guided_monthly',
    paymentMethod: 'manual_stripe_invoice',
    paymentReference: '',
    note: '',
  });
  const [rejectReason, setRejectReason] = useState('grade_mismatch');
  const [notesDraft, setNotesDraft] = useState({}); // { [appId]: string }

  const session = getAdminSession();
  useEffect(() => { if (!session) navigate('/admin/login', { replace: true }); }, [session, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `${API}/api/applications?status=${filter}` : `${API}/api/applications`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login', { replace: true }); return; }
      const data = await res.json();
      setItems(data);
      // seed notes drafts from server
      const drafts = {};
      data.forEach(a => { drafts[a.id] = a.adminNotes || ''; });
      setNotesDraft(prev => ({ ...drafts, ...prev }));
    } finally { setLoading(false); }
  }, [filter, navigate]);

  useEffect(() => { if (session) load(); }, [session, load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function saveNotes(id) {
    const notes = notesDraft[id] ?? '';
    setSaving(id + 'notes');
    try {
      await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes: notes }),
      });
      showToast('Notes saved');
    } finally { setSaving(''); }
  }

  async function updateStatus(id, status, extra = {}) {
    setSaving(id + status);
    try {
      const res = await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, ...extra }),
      });
      if (!res.ok) { showToast('Error updating status'); return; }
      showToast(`Marked as ${status}`);
      setExpanded(null);
      load();
    } finally { setSaving(''); }
  }

  function approveApplication(app, appReview) {
    if (appReview?.applicantType === 'transfer') {
      const ok = window.confirm(
        'Approve this transfer application only if official transcripts or verifiable school records have been received and reviewed. Family self-report is not record confirmation. Continue?'
      );
      if (!ok) return;
    }
    updateStatus(app.id, 'approved');
  }

  async function activateApplication(id) {
    setSaving(id + 'activate');
    try {
      const res = await fetch(`${API}/api/applications/${id}/activate`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Activation failed'); return; }
      setCredentials(data);
      load();
    } finally { setSaving(''); }
  }

  function openManualPayment(app) {
    setManualPaymentModal(app);
    setManualPaymentDraft({
      planType: 'guided_monthly',
      paymentMethod: 'manual_stripe_invoice',
      paymentReference: '',
      note: '',
    });
  }

  async function recordManualPayment() {
    if (!manualPaymentModal) return;
    const plan = MANUAL_PAYMENT_PLANS[manualPaymentDraft.planType];
    const reference = manualPaymentDraft.paymentReference.trim();
    const receiptDraft = {
      ...manualPaymentDraft,
      paymentReference: reference,
      amountCents: plan.amountCents,
      planLabel: plan.label,
      paymentMethodLabel: MANUAL_PAYMENT_METHODS[manualPaymentDraft.paymentMethod],
    };
    if (!reference) {
      showToast('Payment reference is required');
      return;
    }
    const ok = window.confirm(
      `Record ${plan.label} as manually paid for ${manualPaymentModal.studentName}? Confirm only after path review is complete and Stripe evidence exists.`
    );
    if (!ok) return;

    setSaving(manualPaymentModal.id + 'manual-payment');
    try {
      const res = await fetch(`${API}/api/applications/${manualPaymentModal.id}/manual-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planType: manualPaymentDraft.planType,
          amountCents: plan.amountCents,
          paymentMethod: manualPaymentDraft.paymentMethod,
          paymentReference: reference,
          note: manualPaymentDraft.note,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Manual payment failed');
        return;
      }
      showToast(data.linkedToStudent ? 'Payment recorded and linked' : 'Payment recorded');
      setManualPaymentReceipt({
        app: manualPaymentModal,
        draft: receiptDraft,
        subscription: data.subscription,
        linkedToStudent: data.linkedToStudent,
      });
      setManualPaymentModal(null);
      load();
    } finally {
      setSaving('');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard'),
      () => showToast('Copy failed — select manually'),
    );
  }

  function openRejectModal(app) {
    setRejectReason('grade_mismatch');
    setRejectModal(app);
  }

  async function confirmReject() {
    if (!rejectModal) return;
    await updateStatus(rejectModal.id, 'rejected', { rejectionReason: rejectReason });
    setRejectModal(null);
  }

  if (!session) return null;

  return (
    <>
      <Helmet><title>Applications | GIIS Admin</title></Helmet>

      <div className="giis-admin-page" style={{ fontFamily: 'Inter, sans-serif', background: '#f4f6fa', minHeight: '100vh', padding: '24px 28px 80px', overflowX: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Admin</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Applications</h1>
            </div>
          </div>

          <AdminNav />

          {/* Filter tabs */}
          <div className="giis-admin-filter-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['', 'All']].map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                background: filter === v ? '#2b3d6d' : '#fff',
                color: filter === v ? '#fff' : '#5c6578',
                border: filter === v ? 'none' : '1.5px solid #d4d8e0',
                cursor: 'pointer',
              }}>
                {label}
              </button>
            ))}
            <span style={{ fontSize: 13, color: '#9aa0ad', alignSelf: 'center', marginLeft: 4 }}>
              {loading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Application cards */}
          {loading
            ? <p style={{ color: '#9aa0ad', fontSize: 14 }}>Loading…</p>
            : items.length === 0
              ? <div style={{ background: '#fff', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#9aa0ad', fontSize: 14 }}>No applications found.</div>
              : items.map(app => {
                const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
	                const es = app.enrollmentState || {};
	                const ec = ENROLLMENT_STATE_COLORS[es.code] || { bg: '#f1f5f9', fg: '#475569' };
	                const appReview = parseApplicationReviewNotes(app.notes);
	                const transferNeedsRecordReview = appReview?.applicantType === 'transfer';
	                const hasPaidRecord = !!(es.paid || es.paidUnlinked);
	                return (
                  <div key={app.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf5', marginBottom: 12, overflow: 'hidden' }}>

                    {/* Card header row */}
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1d24' }}>{app.studentName}</span>
                          <span style={{ fontSize: 11, background: '#f0f4ff', color: '#2b3d6d', fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>{app.gradeLevel}</span>
                          <span style={{ fontSize: 11, background: sc.bg, color: sc.fg, fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>{sc.label}</span>
                          {es.label && <span style={{ fontSize: 11, background: ec.bg, color: ec.fg, fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{es.label}</span>}
                          {app.accountsCreated && <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2e7d32', fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>Accounts ✓</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#5c6578', margin: '0 0 2px' }}>
                          Parent: {app.parentName} · <a href={`mailto:${app.parentEmail}`} style={{ color: '#2b3d6d' }}>{app.parentEmail}</a>
                          {app.phone && ` · ${app.phone}`}
                        </p>
                        <p style={{ fontSize: 12, color: '#9aa0ad', margin: 0 }}>Submitted {timeAgo(app.createdAt)}{app.currentSchool && ` · ${app.currentSchool}`}</p>
                      </div>
                      <button onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: 'none', fontSize: 13, fontWeight: 600, color: '#2b3d6d', cursor: 'pointer' }}>
                        {expanded === app.id ? 'Close' : 'View'}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {expanded === app.id && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f0f2f8' }}>

                        {/* Data grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 16, marginBottom: 16 }}>
                          {[
                            ['Student Name', app.studentName],
                            ['Date of Birth', app.dob],
                            ['Grade Level', app.gradeLevel],
                            ['Current School', app.currentSchool || '—'],
                            ['Target Universities', app.targetUniversities || '—'],
                            ['Language Pref.', app.preferredLanguage === 'zh' ? 'Chinese' : 'English'],
                            ['Parent Name', app.parentName],
                            ['Parent Email', app.parentEmail],
                            ['Phone', app.phone || '—'],
                            ['Enrollment State', es.label || '—'],
                            ['Next Action', es.action || '—'],
                            ['Student Login', es.studentEmail || '—'],
                            ['Parent Login', es.parentLoginEmail || '—'],
                            ['Payment', es.subscriptionStatus ? `${es.subscriptionStatus}${es.paidUnlinked ? ' · unlinked' : ''}` : 'No payment yet'],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>{k}</p>
                              <p style={{ fontSize: 13, color: '#1a1d24', margin: 0, wordBreak: 'break-word' }}>{v}</p>
                            </div>
                          ))}
                        </div>

                        <ApplicantReviewPanel notes={app.notes} />

                        {/* Rejection reason (if rejected) */}
                        {app.status === 'rejected' && app.rejectionReason && (
                          <div style={{ background: '#fce4ec', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c62828', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span><strong>Rejected:</strong> {REJECTION_REASONS.find(r => r.value === app.rejectionReason)?.label || app.rejectionReason}</span>
                            <button
                              onClick={() => copyToClipboard(rejectionEmailText(app, app.rejectionReason))}
                              style={{ fontSize: 12, fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                              📋 Copy rejection email
                            </button>
                          </div>
                        )}

                        {/* Admin notes */}
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Admin notes (internal)</p>
                          <textarea
                            value={notesDraft[app.id] ?? app.adminNotes ?? ''}
                            onChange={e => setNotesDraft(prev => ({ ...prev, [app.id]: e.target.value }))}
                            onBlur={() => saveNotes(app.id)}
                            placeholder="e.g. Zoom scheduled for May 22 · Waiting for transcript · Strong applicant"
                            rows={2}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4d8e0', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box', color: '#1a1d24' }}
                          />
                          <p style={{ fontSize: 11, color: '#9aa0ad', margin: '3px 0 0' }}>Auto-saves when you click away.</p>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {app.status === 'pending' && (<>
                            <button onClick={() => approveApplication(app, appReview)} disabled={!!saving}
                              style={{ padding: '8px 18px', borderRadius: 8, background: '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              {transferNeedsRecordReview ? '✓ Approve after admin record review' : '✓ Approve'}
                            </button>
                            <button onClick={() => openRejectModal(app)} disabled={!!saving}
                              style={{ padding: '8px 18px', borderRadius: 8, background: '#c62828', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              ✗ Reject…
                            </button>
                          </>)}

	                          {app.status === 'approved' && !hasPaidRecord && (
	                            <button onClick={() => openManualPayment(app)} disabled={!!saving}
	                              style={{ padding: '8px 18px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
	                              Record Manual Payment
	                            </button>
	                          )}

	                          {app.status === 'approved' && !app.accountsCreated && hasPaidRecord && (
	                            <button onClick={() => activateApplication(app.id)} disabled={saving === app.id + 'activate'}
	                              style={{ padding: '8px 20px', borderRadius: 8, background: '#1a73e8', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
	                              {saving === app.id + 'activate' ? 'Creating…' : '🔑 Create Accounts'}
	                            </button>
	                          )}
	                          {app.status === 'approved' && !app.accountsCreated && !hasPaidRecord && (
	                            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 700, padding: '8px 0' }}>Record payment before account activation</span>
	                          )}
	                          {app.status === 'approved' && app.accountsCreated && (
	                            <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 700, padding: '8px 0' }}>✓ Accounts created</span>
	                          )}
	                          {app.status === 'approved' && app.accountsCreated && !hasPaidRecord && (
	                            <button onClick={() => openManualPayment(app)} disabled={!!saving}
	                              style={{ padding: '8px 18px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
	                              Record Manual Payment
	                            </button>
	                          )}

                          <button onClick={() => copyToClipboard(app.parentEmail)}
                            style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#2b3d6d', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                            📋 Copy email
                          </button>

                          {app.status !== 'pending' && (
                            <button onClick={() => updateStatus(app.id, 'pending')} disabled={!!saving}
                              style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                              Reset to Pending
                            </button>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Reject with reason modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Reject application</h2>
            <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 20px' }}>
              {rejectModal.studentName} · {rejectModal.parentEmail}
            </p>

            <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px' }}>Reason</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {REJECTION_REASONS.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${rejectReason === r.value ? '#2b3d6d' : '#e0e6f0'}`, background: rejectReason === r.value ? '#f0f4ff' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" name="rejectReason" value={r.value} checked={rejectReason === r.value} onChange={() => setRejectReason(r.value)} style={{ marginTop: 2, accentColor: '#2b3d6d' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1d24', margin: '0 0 2px' }}>{r.label}</p>
                    {r.detail && <p style={{ fontSize: 12, color: '#5c6578', margin: 0 }}>{r.detail}</p>}
                  </div>
                </label>
              ))}
            </div>

            <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#5c6578', marginBottom: 20, lineHeight: 1.6 }}>
              Confirming only marks the application rejected. No rejection email is sent automatically; use the copy button after review.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmReject} disabled={!!saving}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#c62828', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setRejectModal(null)}
                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create accounts credentials modal */}
      {credentials && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', maxWidth: 540, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>✓ Accounts Created</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>Account credentials created</h2>

            <div style={{ background: '#f4f6fa', borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 13, lineHeight: 2 }}>
              <div><strong>Student Code:</strong> {credentials.studentCode}</div>
              <div><strong>Login URL:</strong> <a href={credentials.loginUrl} target="_blank" rel="noreferrer" style={{ color: '#1a73e8' }}>{credentials.loginUrl}</a></div>
              <div><strong>Parent Contact:</strong> {credentials.parentContactEmail || '—'}</div>
              <div><strong>Parent Login:</strong> {credentials.parentLoginEmail || credentials.parentEmail}</div>
              <div><strong>Parent Password:</strong> <code style={{ background: '#e8ecf5', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 14 }}>{credentials.parentPassword || credentials.tempPassword}</code></div>
              <div><strong>Student Login:</strong> {credentials.studentEmail || '—'}</div>
              <div><strong>Student Password:</strong> <code style={{ background: '#e8ecf5', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 14 }}>{credentials.studentPassword || '—'}</code></div>
              <div><strong>Linked Payments:</strong> {credentials.linkedSubscriptions ?? 0}</div>
            </div>

            <div style={{ background: '#fffde7', border: '1px solid #f9a825', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#5c4f00', marginBottom: 16 }}>
              A welcome email is sent automatically when email delivery is configured. Use the fallback copy only if the email log shows skipped or failed delivery.
            </div>

            <div style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 16, color: '#1a1d24', lineHeight: 1.7 }}>
{`Subject: Your GIIS account is ready — next step

Hi ${(credentials.parentContactEmail || credentials.parentEmail) ? (credentials.parentContactEmail || credentials.parentEmail).split('@')[0] : ''},

Your child's GIIS account has been created. Please log in to complete enrollment:

Login: ${credentials.loginUrl}
Parent Portal email: ${credentials.parentLoginEmail || credentials.parentEmail}
Parent temp password: ${credentials.parentPassword || credentials.tempPassword}
Student Portal email: ${credentials.studentEmail || ''}
Student temp password: ${credentials.studentPassword || ''}

	${(credentials.linkedSubscriptions || 0) > 0 ? 'Payment has been recorded. After logging in, you will see the parent dashboard and first-week instructions.' : 'After logging in, please wait for admissions to confirm payment before full course access.'}

Welcome to GIIS!
— The GIIS Team`}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
	                onClick={() => copyToClipboard(`Subject: Your GIIS account is ready — next step\n\nHi ${(credentials.parentContactEmail || credentials.parentEmail) ? (credentials.parentContactEmail || credentials.parentEmail).split('@')[0] : ''},\n\nYour child's GIIS account has been created. Please log in to complete enrollment:\n\nLogin: ${credentials.loginUrl}\nParent Portal email: ${credentials.parentLoginEmail || credentials.parentEmail}\nParent temp password: ${credentials.parentPassword || credentials.tempPassword}\nStudent Portal email: ${credentials.studentEmail || ''}\nStudent temp password: ${credentials.studentPassword || ''}\n\n${(credentials.linkedSubscriptions || 0) > 0 ? 'Payment has been recorded. After logging in, you will see the parent dashboard and first-week instructions.' : 'After logging in, please wait for admissions to confirm payment before full course access.'}\n\nWelcome to GIIS!\n— The GIIS Team`)}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#2b3d6d', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                📋 Copy fallback welcome email
              </button>
              <button onClick={() => setCredentials(null)}
                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
	      )}

      {/* Manual payment receipt modal */}
      {manualPaymentReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 620, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#166534', letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 8px' }}>Payment Recorded</p>
            <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 6px' }}>Copy family payment receipt</h2>
            <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 14px', lineHeight: 1.5 }}>
              Send this only after Stripe evidence is verified. Keep the Stripe reference in the outside-git admissions tracker.
            </p>
            <div style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 16, color: '#1a1d24', lineHeight: 1.7, maxHeight: '45vh', overflow: 'auto' }}>
              {manualPaymentReceiptText(manualPaymentReceipt)}
            </div>
            <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#5c4a12', marginBottom: 16, lineHeight: 1.5 }}>
              This receipt confirms a manual payment record. It does not promise credit transfer, accreditation completion, AP authorization, CEEB issuance, or college admission outcomes.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => copyToClipboard(manualPaymentReceiptText(manualPaymentReceipt))}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#2b3d6d', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Copy payment receipt
              </button>
              <button
                onClick={() => setManualPaymentReceipt(null)}
                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

	      {/* Manual payment modal */}
	      {manualPaymentModal && (
	        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
	          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 560, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
	            <p style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 8px' }}>Manual Review Sales Mode</p>
	            <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 6px' }}>Record manual payment</h2>
	            <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 18px', lineHeight: 1.5 }}>
	              {manualPaymentModal.studentName} · {manualPaymentModal.parentEmail}. Use this only after application/path review and after Stripe evidence exists.
	            </p>

	            <div style={{ display: 'grid', gap: 12 }}>
	              <label style={fieldLabel}>
	                Plan
	                <select
	                  value={manualPaymentDraft.planType}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, planType: e.target.value }))}
	                  style={fieldControl}
	                >
	                  {Object.entries(MANUAL_PAYMENT_PLANS).map(([value, plan]) => (
	                    <option key={value} value={value}>{plan.label}</option>
	                  ))}
	                </select>
	              </label>
	              <div style={{ background: '#f8f9fc', border: '1px solid #e0e6f0', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#1a1d24' }}>
	                Amount to record: <strong>{money(MANUAL_PAYMENT_PLANS[manualPaymentDraft.planType].amountCents)}</strong>
	              </div>
	              <label style={fieldLabel}>
	                Payment method
	                <select
	                  value={manualPaymentDraft.paymentMethod}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, paymentMethod: e.target.value }))}
	                  style={fieldControl}
	                >
	                  {Object.entries(MANUAL_PAYMENT_METHODS).map(([value, label]) => (
	                    <option key={value} value={value}>{label}</option>
	                  ))}
	                </select>
	              </label>
	              <label style={fieldLabel}>
	                Stripe reference
	                <input
	                  value={manualPaymentDraft.paymentReference}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, paymentReference: e.target.value }))}
	                  placeholder="Invoice, payment link, receipt, or Dashboard reference"
	                  style={fieldControl}
	                />
	              </label>
	              <label style={fieldLabel}>
	                Internal note
	                <textarea
	                  value={manualPaymentDraft.note}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, note: e.target.value }))}
	                  placeholder="Optional: consultation date, records received, plan reason"
	                  rows={2}
	                  style={{ ...fieldControl, resize: 'vertical' }}
	                />
	              </label>
	            </div>

	            <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#5c4a12', marginTop: 16, lineHeight: 1.5 }}>
	              This creates an active manual subscription record. It does not send a Stripe link, charge a card, or bypass the application review.
	            </div>

	            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
	              <button
	                onClick={recordManualPayment}
	                disabled={!!saving}
	                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>
	                {saving ? 'Recording…' : 'Confirm Payment Recorded'}
	              </button>
	              <button
	                onClick={() => setManualPaymentModal(null)}
	                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
	                Cancel
	              </button>
	            </div>
	          </div>
	        </div>
	      )}
	    </>
	  );
	}

const fieldLabel = { display: 'grid', gap: 6, fontSize: 11, fontWeight: 800, color: '#5c6578', letterSpacing: 0.8, textTransform: 'uppercase' };
const fieldControl = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d4d8e0', borderRadius: 8, padding: '9px 11px', fontSize: 13, color: '#1a1d24', fontFamily: 'Inter, sans-serif' };
