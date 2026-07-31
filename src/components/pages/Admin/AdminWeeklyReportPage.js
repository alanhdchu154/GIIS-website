import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { getAdminSession } from '../../../api/authStorage';
import { AdminHeader, AdminPage } from './AdminChrome';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

/**
 * Admin review surface for the weekly parent report.
 * Flow: load dry-run drafts → admin reviews each student's payload →
 * sends only the selected students. Nothing is emailed without review here.
 */
export default function AdminWeeklyReportPage({ language = 'en', toggleLanguage }) {
  const lang = language === 'zh' ? 'zh' : 'en';
  const isEn = lang === 'en';
  const T = (en, zh) => (isEn ? en : zh);
  const navigate = useNavigate();
  const session = getAdminSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [week, setWeek] = useState('');
  const [drafts, setDrafts] = useState([]); // dry-run skipped entries with payloads
  const [alreadySent, setAlreadySent] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
  }, [session, navigate]);

  const loadDrafts = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    setSendResult(null);
    try {
      const res = await fetch(`${API}/api/admin/weekly-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dryRun: true }),
      });
      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load weekly report drafts');
      setWeek(data.week || '');
      const details = data.details || { skipped: [] };
      const draftRows = (details.skipped || []).filter((s) => s.reason === 'dry_run' && s.payload);
      const sentRows = (details.skipped || []).filter((s) => s.reason === 'already_sent_this_week');
      setDrafts(draftRows);
      setAlreadySent(sentRows);
      setSelected(new Set(draftRows.map((d) => d.studentId)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, navigate]);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  function toggle(studentId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
      return next;
    });
  }

  const selectedDrafts = drafts.filter((draft) => selected.has(draft.studentId));
  const quietWeekCount = drafts.filter((draft) => {
    const wa = draft.payload?.weeklyActivity;
    return wa && wa.modulesCompleted === 0 && wa.activeDays === 0;
  }).length;
  const missingNoteCount = drafts.filter((draft) => !draft.payload?.advisorNote).length;
  const selectedQuietWeekCount = selectedDrafts.filter((draft) => {
    const wa = draft.payload?.weeklyActivity;
    return wa && wa.modulesCompleted === 0 && wa.activeDays === 0;
  }).length;
  const selectedMissingNoteCount = selectedDrafts.filter((draft) => !draft.payload?.advisorNote).length;

  async function sendSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const warnings = [];
    if (selectedQuietWeekCount > 0) {
      warnings.push(`${selectedQuietWeekCount} selected draft${selectedQuietWeekCount === 1 ? '' : 's'} show a quiet week.`);
    }
    if (selectedMissingNoteCount > 0) {
      warnings.push(`${selectedMissingNoteCount} selected draft${selectedMissingNoteCount === 1 ? '' : 's'} have no parent-safe advisor note.`);
    }
    const confirmText = [
      `Send the weekly report to ${ids.length} famil${ids.length === 1 ? 'y' : 'ies'} now?`,
      ...warnings,
      'Only send after reviewing the family-facing draft.',
    ].join('\n');
    if (!window.confirm(confirmText)) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/admin/weekly-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendResult(data);
      loadDrafts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminPage>
      <Helmet><title>Weekly Parent Report | GIIS Admin</title></Helmet>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <AdminHeader
          language={language}
          toggleLanguage={toggleLanguage}
          title={T('Weekly Parent Report', '家长周报')}
          subtitle={T(
            `Week of ${week || '—'} · Review each draft, then send. Nothing goes out without review.`,
            `${week || '—'} 周 · 逐份审核后再发送；未经审核不会寄出。`,
          )}
          actions={(
            <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadDrafts} disabled={loading}>
              {loading ? T('Loading…', '载入中…') : T('Refresh drafts', '重新整理草稿')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={sendSelected}
              disabled={sending || loading || selected.size === 0}
            >
              {sending ? T('Sending…', '发送中…') : T(`Send to ${selected.size} selected`, `发送给 ${selected.size} 位`)}
            </button>
          </div>
          )}
        />

        <div style={{ background: '#fff', border: '1px solid #dfe6f2', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 850, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {T('Review checklist', '审核清单')}
              </p>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: '#3a3f4c' }}>
                {T(
                  'Read the family-facing draft before sending. Confirm credits, GPA, weekly activity, quiet-week context, and parent-safe advisor note. Internal staff notes and operational risk details should stay out of this email.',
                  '发送前请阅读家长会看到的草稿，确认学分、GPA、本周活动、安静周说明与适合家长阅读的顾问备注。内部 staff note 和营运风险不要放进这封信。',
                )}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(92px, 1fr))', gap: 8, flex: '0 1 320px' }}>
              {[
                [T('Selected', '已选择'), selected.size],
                [T('Quiet weeks', '安静周'), quietWeekCount],
                [T('No note', '缺备注'), missingNoteCount],
                [T('Already sent', '已发送'), alreadySent.length],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
                  <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 850, color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 850, color: '#1a1a2e' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          {(selectedQuietWeekCount > 0 || selectedMissingNoteCount > 0) && (
            <div style={{ marginTop: 12, background: '#fffaf2', border: '1px solid #f4d58b', borderRadius: 8, padding: '9px 11px', color: '#8a5a00', fontSize: 12.5, lineHeight: 1.45 }}>
              {T('Selected family-facing draft needs extra review:', '已选择的家长草稿需要额外检查：')}
              {selectedQuietWeekCount > 0 && ` ${selectedQuietWeekCount} quiet week${selectedQuietWeekCount === 1 ? '' : 's'}.`}
              {selectedMissingNoteCount > 0 && ` ${selectedMissingNoteCount} without a parent-safe advisor note.`}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#fce4ec', color: '#c62828', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {sendResult && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 14 }}>
            {T('Sent', '已发送')} {sendResult.sent} · {T('Skipped', '略过')} {sendResult.skipped} · {T('Errors', '错误')} {sendResult.errors}
          </div>
        )}

        {!loading && drafts.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '34px 28px', textAlign: 'center', border: '1px solid #e3e8f2' }}>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>{T('No drafts pending', '目前没有待审核草稿')}</p>
            <p style={{ margin: 0, fontSize: 13.5, color: '#5c6578' }}>
              {alreadySent.length > 0
                ? T(`All ${alreadySent.length} active families already received this week's report.`, `${alreadySent.length} 个 active family 已收到本周报告。`)
                : T('No active subscriptions with linked students were found.', '没有找到已连接学生的 active subscription。')}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {drafts.map((d) => {
            const p = d.payload || {};
            const wa = p.weeklyActivity || null;
            const note = p.advisorNote || null;
            const quietWeek = wa && wa.modulesCompleted === 0 && wa.activeDays === 0;
            const checked = selected.has(d.studentId);
            return (
              <div key={d.studentId} style={{
                background: '#fff', borderRadius: 12, border: `1.5px solid ${checked ? '#2b3d6d' : '#e3e8f2'}`,
                padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(d.studentId)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15.5, color: '#1a1a2e' }}>{p.studentName || d.studentId}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#5c6578' }}>→ {p.parentEmail || d.email}</p>
                  </div>
                  {quietWeek && (
                    <span style={{ background: '#fff3e0', color: '#e65100', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      {T('Quiet week — review before sending', '安静周，发送前请复核')}
                    </span>
                  )}
                  {!note && (
                    <span style={{ background: '#eef0f4', color: '#5c6578', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      {T('No advisor note', '缺顾问备注')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: note ? 12 : 0 }}>
                  {[
                    [T('Credits', '学分'), `${p.creditsEarned ?? '—'} / 24`],
                    ['GPA (UW)', p.gpa ?? '—'],
                    [T('Graduation', '毕业进度'), `${p.gradPercent ?? '—'}%`],
                    [T('Modules this week', '本周模块'), wa ? wa.modulesCompleted : '—'],
                    [T('Study hrs (est.)', '学习小时估计'), wa ? wa.estimatedStudyHours : '—'],
                    [T('Active days', '活跃天数'), wa ? wa.activeDays : '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#f4f6fa', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 10.5, fontWeight: 800, color: '#8a93a6', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 17, fontWeight: 850, color: '#2b3d6d' }}>{String(val)}</p>
                    </div>
                  ))}
                </div>

                {note && (
                  <div style={{ background: '#fdf9ef', borderLeft: '4px solid #d5a836', borderRadius: '0 8px 8px 0', padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 3px', fontSize: 10.5, fontWeight: 800, color: '#8a6d1f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {T('Advisor note (parent-safe)', '顾问备注（家长可见）')}
                    </p>
                    {note.title && <p style={{ margin: '0 0 3px', fontSize: 13.5, fontWeight: 750, color: '#1a1a2e' }}>{note.title}</p>}
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#3a3f4c' }}>{note.summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {alreadySent.length > 0 && drafts.length > 0 && (
          <p style={{ marginTop: 18, fontSize: 12.5, color: '#8a93a6' }}>
            {T(
              `${alreadySent.length} famil${alreadySent.length === 1 ? 'y' : 'ies'} already received this week's report and ${alreadySent.length === 1 ? 'is' : 'are'} not shown.`,
              `${alreadySent.length} 个 family 已收到本周报告，因此未显示。`,
            )}
          </p>
        )}
      </div>
    </AdminPage>
  );
}
