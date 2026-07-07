import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import { getApiBase } from '../../../config/apiBase';
import { getParentSession, clearParentSession } from '../../../api/authStorage';

const API = getApiBase();
const GRAD_CREDITS = 24;

const DEPT_COLORS = {
  'Computer Science': '#1565C0', 'Mathematics': '#4527A0', 'Economics': '#1B6B3A',
  'Business': '#C84B0A', 'Engineering': '#B71C1C', 'Psychology': '#5b2c6f',
  'Communications': '#E65100', 'Arts': '#6A1B9A', 'Science': '#00695C',
  'English': '#1565C0', 'History': '#5D4037', 'Social Studies': '#37474F',
};

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', flex: '1 1 auto', minWidth: 100 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function courseModuleTotals(enrollments = []) {
  return new Map(enrollments.map((enr) => [enr.name, enr.totalModules || null]));
}

function aggregateRecentActivity(events = [], enrollments = []) {
  const totals = courseModuleTotals(enrollments);
  const grouped = new Map();
  const passthrough = [];

  for (const event of events) {
    const day = new Date(event.at).toISOString().slice(0, 10);
    if (!['quiz', 'assignment', 'video', 'supplemental_video', 'reading', 'practice'].includes(event.type)) {
      passthrough.push(event);
      continue;
    }
    const key = `${event.type}:${event.course}:${day}`;
    const existing = grouped.get(key) || {
      ...event,
      type: `${event.type}_group`,
      count: 0,
      moduleOrders: [],
      totalModules: totals.get(event.course),
      at: event.at,
    };
    existing.count += 1;
    if (event.moduleOrder) existing.moduleOrders.push(event.moduleOrder);
    if (new Date(event.at) > new Date(existing.at)) existing.at = event.at;
    grouped.set(key, existing);
  }

  return [...passthrough, ...grouped.values()]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);
}

function ActivityRow({ event, isEn }) {
  const colors = {
    exam: { bg: '#e8f5e9', fg: '#2e7d32', icon: '✓' },
    quiz: { bg: '#e3f2fd', fg: '#2b3d6d', icon: '📝' },
    quiz_group: { bg: '#e3f2fd', fg: '#2b3d6d', icon: '📝' },
    assignment: { bg: '#fff3e0', fg: '#e65100', icon: 'A' },
    assignment_group: { bg: '#fff3e0', fg: '#e65100', icon: 'A' },
    assignment_feedback: { bg: '#e8f5e9', fg: '#2e7d32', icon: 'F' },
    video: { bg: '#f3e5f5', fg: '#6a1b9a', icon: '▶' },
    video_group: { bg: '#f3e5f5', fg: '#6a1b9a', icon: '▶' },
    supplemental_video: { bg: '#f3e5f5', fg: '#6a1b9a', icon: '▶' },
    supplemental_video_group: { bg: '#f3e5f5', fg: '#6a1b9a', icon: '▶' },
    reading: { bg: '#e0f2f1', fg: '#00695c', icon: 'R' },
    reading_group: { bg: '#e0f2f1', fg: '#00695c', icon: 'R' },
    practice: { bg: '#ede7f6', fg: '#4527a0', icon: 'P' },
    practice_group: { bg: '#ede7f6', fg: '#4527a0', icon: 'P' },
  };
  const c = colors[event.type] || colors.quiz;
  const moduleOrders = [...new Set(event.moduleOrders || [])].sort((a, b) => a - b);
  const moduleSummary = String(event.count || moduleOrders.length || 0);
  const latestModule = moduleOrders.length ? Math.max(...moduleOrders) : null;
  const latestModuleText = latestModule
    ? (isEn ? `, latest Module ${latestModule}` : `，最新第 ${latestModule} 模块`)
    : '';
  const groupedLabels = {
    quiz_group: isEn ? `${moduleSummary} module ${moduleSummary === '1' ? 'quiz' : 'quizzes'} today${latestModuleText}` : `今天 ${moduleSummary} 次模块测验${latestModuleText}`,
    assignment_group: isEn ? `${moduleSummary} assignment${moduleSummary === '1' ? '' : 's'} submitted today${latestModuleText}` : `今天提交 ${moduleSummary} 份作业${latestModuleText}`,
    video_group: isEn ? `${moduleSummary} module video${moduleSummary === '1' ? '' : 's'} completed today${latestModuleText}` : `今天完成 ${moduleSummary} 个模块视频${latestModuleText}`,
    supplemental_video_group: isEn ? `${moduleSummary} supplemental video${moduleSummary === '1' ? '' : 's'} completed today${latestModuleText}` : `今天完成 ${moduleSummary} 个补充视频${latestModuleText}`,
    reading_group: isEn ? `${moduleSummary} reading step${moduleSummary === '1' ? '' : 's'} completed today${latestModuleText}` : `今天完成 ${moduleSummary} 个阅读步骤${latestModuleText}`,
    practice_group: isEn ? `${moduleSummary} practice step${moduleSummary === '1' ? '' : 's'} completed today${latestModuleText}` : `今天完成 ${moduleSummary} 个练习步骤${latestModuleText}`,
  };
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f0f2f8' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
        {c.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#1a1d24' }}>
          {event.course}
          {groupedLabels[event.type] && ` — ${groupedLabels[event.type]}`}
          {event.type === 'exam' && (isEn
            ? ` — ${event.passed ? 'Passed' : 'Attempted'} ${event.examType === 'midterm' ? 'midterm' : 'final'} exam`
            : ` — ${event.passed ? '通过' : '参加'}${event.examType === 'midterm' ? '期中考' : '期末考'}`)}
          {event.type === 'quiz' && (isEn ? ` — Module ${event.moduleOrder} quiz` : ` — 第 ${event.moduleOrder} 模块测验`)}
          {event.type === 'assignment' && (isEn ? ` — Module ${event.moduleOrder} assignment submitted` : ` — 第 ${event.moduleOrder} 模块作业已提交`)}
          {event.type === 'assignment_feedback' && (isEn ? ` — Module ${event.moduleOrder} assignment feedback` : ` — 第 ${event.moduleOrder} 模块作业已批改`)}
          {event.type === 'video' && (isEn ? ` — Module ${event.moduleOrder} video completed` : ` — 第 ${event.moduleOrder} 模块视频完成`)}
          {event.type === 'supplemental_video' && (isEn ? ` — Module ${event.moduleOrder} supplemental video completed` : ` — 第 ${event.moduleOrder} 模块补充视频完成`)}
          {event.type === 'reading' && (isEn ? ` — Module ${event.moduleOrder} reading completed` : ` — 第 ${event.moduleOrder} 模块阅读完成`)}
          {event.type === 'practice' && (isEn ? ` — Module ${event.moduleOrder} practice completed` : ` — 第 ${event.moduleOrder} 模块练习完成`)}
          {event.score != null && <span style={{ fontWeight: 400, color: '#5c6578' }}> ({Number(event.score).toFixed(0)}%)</span>}
          {event.type === 'assignment' && event.hasFeedback && <span style={{ color: '#2e7d32', fontWeight: 400 }}> {isEn ? '· Feedback received' : '· 已收到反馈'}</span>}
          {event.type === 'assignment_feedback' && event.score != null && <span style={{ color: '#2e7d32', fontWeight: 400 }}> {isEn ? '· Reviewed work' : '· 已审阅作业'}</span>}
        </p>
        {event.type === 'assignment_feedback' && event.feedback && (
          <div style={{ margin: '6px 0 4px', background: '#f1f8f2', border: '1px solid #cde8d1', borderRadius: 8, padding: '8px 10px' }}>
            <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 800, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              {isEn ? 'Teacher feedback' : '教师评语'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#31543a', lineHeight: 1.45 }}>
              {event.feedback.length > 180 ? `${event.feedback.slice(0, 180)}...` : event.feedback}
            </p>
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, color: '#9aa0ad' }}>
          {new Date(event.at).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

function pacingStyle(status) {
  if (status === 'behind') return { bg: '#fff3e0', fg: '#b45309', border: '#f4c36a' };
  if (status === 'ahead') return { bg: '#e8f5e9', fg: '#2e7d32', border: '#a5d6a7' };
  return { bg: '#f0f4ff', fg: '#2b3d6d', border: '#c5d0f0' };
}

function formatHours(value) {
  const hours = Number(value || 0);
  return hours % 1 === 0 ? String(hours) : hours.toFixed(1);
}

function WeeklyInsightsCard({ insights, isEn }) {
  const data = insights || {};
  const assignmentSummary = data.overdueAssignments == null
    ? `${data.assignmentSubmissions || 0} ${isEn ? 'submitted' : '已提交'} · ${isEn ? 'overdue tracking not active' : '逾期追踪尚未启用'}`
    : `${data.assignmentSubmissions || 0} ${isEn ? 'submitted' : '已提交'} · ${data.overdueAssignments || 0} ${isEn ? 'overdue' : '逾期'}`;
  const items = [
    { label: isEn ? 'Study Time' : '学习时长', value: `${formatHours(data.estimatedStudyHours)} ${isEn ? 'hours' : '小时'}` },
    { label: isEn ? 'Completed' : '已完成', value: `${data.modulesCompleted || 0} ${isEn ? 'modules' : '模块'}` },
    { label: isEn ? 'Assignments' : '作业', value: assignmentSummary },
    { label: isEn ? 'Quiz Average' : '测验平均', value: data.quizAverage == null ? (isEn ? 'No quizzes yet' : '暂无测验') : `${Math.round(data.quizAverage)}%` },
    { label: isEn ? 'Next Deadline' : '下个截止', value: data.nextDeadline?.label || (isEn ? 'No deadline posted yet' : '尚未发布截止日期') },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {isEn ? 'This Week' : '本周学习摘要'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 0.8fr) minmax(0, 1.2fr)', border: '1px solid #e0e6f0', borderRadius: 10, overflow: 'hidden' }}>
        {items.map((item) => (
          <React.Fragment key={item.label}>
            <div style={{ background: '#f8f9fd', borderBottom: '1px solid #e0e6f0', padding: '10px 12px', fontSize: 12, fontWeight: 800, color: '#2b3d6d' }}>{item.label}</div>
            <div style={{ background: '#fff', borderBottom: '1px solid #e0e6f0', padding: '10px 12px', fontSize: 12.5, fontWeight: 650, color: '#1a1d24', lineHeight: 1.4 }}>{item.value}</div>
          </React.Fragment>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#7a8495', lineHeight: 1.45, margin: '10px 0 0' }}>
        {isEn
          ? 'Study hours are estimated from completed module hours. Overdue and deadline fields appear only when GIIS has posted due-date data in the portal.'
          : '学习时数以已完成模块的预计时数估算。逾期与截止日期只有在 GIIS 已发布 due-date 数据时才会显示。'}
      </p>
    </div>
  );
}

function FirstWeekEvidenceCard({ isEn, subscription }) {
  const isGuided = /guided|premium/i.test(subscription?.planType || '');
  const items = [
    {
      title: isEn ? 'Today: start the next module' : '今天：开始下一个模块',
      detail: isEn
        ? 'The portal records module, reading, video, practice, quiz, and assignment signals as the student works.'
        : '学生学习时，系统会记录模块、阅读、视频、练习、测验与作业信号。',
    },
    {
      title: isEn ? 'This week: submit written work' : '本周：提交书面作业',
      detail: isEn
        ? 'Written assignments create the clearest evidence for parents because feedback appears here after review.'
        : '书面作业是家长最容易看懂的学习证据，批改后反馈会显示在这里。',
    },
    {
      title: isEn ? 'After review: parent-visible feedback' : '批改后：家长可见反馈',
      detail: isEn
        ? 'Scores, teacher comments, pacing, and official record links stay attached to this dashboard.'
        : '分数、教师评语、进度与正式文件入口都会留在这个面板里。',
    },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
          {isEn ? 'Start Here · Week 1' : '从这里开始 · 第一周'}
        </p>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#1b6b3a', background: '#e8f5e9', borderRadius: 999, padding: '4px 9px' }}>
          {isGuided ? (isEn ? 'Advisor-supported' : '顾问支持') : (isEn ? 'Evidence plan' : '证据计划')}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item, index) => (
          <div key={item.title} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f0f4ff', color: '#2b3d6d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
              {index + 1}
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 850, color: '#1a1d24' }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#5c6578', lineHeight: 1.5 }}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 11.5, color: '#7a8495', lineHeight: 1.5 }}>
        {isEn
          ? 'Early accounts may look quiet at first; GIIS treats recorded work, reviewed assignments, and official records as the evidence trail parents can rely on.'
          : '新账号一开始可能记录较少；GIIS 会以系统记录、已批改作业与正式文件作为家长可以追踪的学习证据。'}
      </p>
    </div>
  );
}

function CourseBar({ enr, isEn }) {
  const color = DEPT_COLORS[enr.department] || '#2b3d6d';
  const pct = (enr.totalModules ?? 0) > 0 ? Math.round((enr.completedModules / enr.totalModules) * 100) : 0;
  const pacing = enr.pacing || { status: 'on_track', label: isEn ? 'On Track' : '进度正常' };
  const paceColors = pacingStyle(pacing.status);
  const progressColor = pacing.status === 'behind' ? '#d97706' : pacing.status === 'ahead' ? '#2e7d32' : color;
  const trackColor = pacing.status === 'behind' ? '#fff3e0' : '#e8ecf5';
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f2f8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: progressColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d24' }}>{isEn ? enr.name : (enr.nameZh || enr.name)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!enr.creditEarned && (
            <span style={{ fontSize: 10, fontWeight: 800, color: paceColors.fg, background: paceColors.bg, border: `1px solid ${paceColors.border}`, borderRadius: 999, padding: '3px 8px' }}>
              {isEn ? pacing.label : pacing.status === 'behind' ? `落后 ${Math.abs(pacing.deltaModules || 0)} 模块` : pacing.status === 'ahead' ? `领先 ${pacing.deltaModules || 0} 模块` : '进度正常'}
            </span>
          )}
          <span style={{ fontSize: 12, color: enr.creditEarned ? '#2e7d32' : '#5c6578', fontWeight: enr.creditEarned ? 700 : 400 }}>
            {enr.creditEarned ? (isEn ? '✓ Credit earned' : '✓ 已获学分') : `${enr.completedModules} / ${enr.totalModules ?? '?'} ${isEn ? 'modules' : '模块'}`}
          </span>
        </div>
      </div>
      <div style={{ height: 6, background: trackColor, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: progressColor, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      {enr.assessment && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {[
            `${enr.assessment.quizzesSubmitted}/${enr.totalModules ?? '?'} ${isEn ? 'quizzes' : '测验'}`,
            `${enr.assessment.assignmentsReviewed}/${enr.totalModules ?? '?'} ${isEn ? 'assignments reviewed' : '作业已批改'}`,
            `${isEn ? 'Midterm' : '期中'}: ${enr.assessment.midterm ? `${Math.round(enr.assessment.midterm.score)}%` : (isEn ? 'pending' : '未完成')}`,
            `${isEn ? 'Final' : '期末'}: ${enr.assessment.final ? `${Math.round(enr.assessment.final.score)}%` : (isEn ? 'pending' : '未完成')}`,
          ].map((label) => (
            <span key={label} style={{ fontSize: 10, fontWeight: 700, color: '#5c6578', background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: 999, padding: '3px 8px' }}>
              {label}
            </span>
          ))}
        </div>
      )}
      {enr.weeklyInsights && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {[
            `${enr.weeklyInsights.activeDays} ${isEn ? 'active days' : '天有学习记录'}`,
            `${enr.weeklyInsights.modulesCompleted} ${isEn ? 'modules completed' : '模块完成'}`,
            `${formatHours(enr.weeklyInsights.estimatedStudyHours)} ${isEn ? 'est. hours' : '预计小时'}`,
            `${enr.weeklyInsights.videoActivities || 0} ${isEn ? 'video activities' : '视频活动'}`,
            `${enr.weeklyInsights.quizAttempts} ${isEn ? 'quizzes' : '次测验'}`,
            `${enr.weeklyInsights.assignmentSubmissions} ${isEn ? 'assignments' : '份作业'}`,
          ].map((label) => (
            <span key={label} style={{ fontSize: 10, fontWeight: 700, color: '#5c6578', background: '#fff', border: '1px solid #e0e6f0', borderRadius: 999, padding: '3px 8px' }}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PacingLegend({ isEn }) {
  const items = [
    { status: 'ahead', en: 'Ahead', zh: '超前' },
    { status: 'on_track', en: 'On Schedule', zh: '进度正常' },
    { status: 'behind', en: 'Behind', zh: '落后' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 2px' }}>
      {items.map((item) => {
        const style = pacingStyle(item.status);
        return (
          <span key={item.status} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: `1px solid ${style.border}`, background: style.bg, color: style.fg, borderRadius: 999, padding: '4px 8px', fontSize: 10.5, fontWeight: 800 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.fg }} />
            {isEn ? item.en : item.zh}
          </span>
        );
      })}
      <span style={{ fontSize: 10.5, color: '#7a8495', alignSelf: 'center' }}>
        {isEn ? 'Based on expected weekly module pace' : '依据每周预计模块进度'}
      </span>
    </div>
  );
}

function AssignmentHistory({ enrollments, isEn }) {
  const rows = enrollments
    .flatMap((enr) => (enr.assignments || []).map((assignment) => ({ ...assignment, course: isEn ? enr.name : (enr.nameZh || enr.name) })))
    .sort((a, b) => new Date(b.gradedAt || b.submittedAt) - new Date(a.gradedAt || a.submittedAt));

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
          {isEn ? 'Assignments & Feedback' : '作业与批改反馈'}
        </p>
        <span style={{ fontSize: 11, color: '#5c6578' }}>
          {isEn ? `${rows.length} submitted` : `已提交 ${rows.length} 份`}
        </span>
      </div>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9aa0ad', margin: 0 }}>
          {isEn ? 'No assignment submissions yet.' : '目前还没有作业提交记录。'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.slice(0, 8).map((assignment) => {
            const reviewed = assignment.status === 'reviewed';
            return (
              <div key={`${assignment.course}-${assignment.moduleOrder}-${assignment.submittedAt}`} style={{ border: '1px solid #e0e6f0', borderRadius: 10, padding: '12px 14px', background: reviewed ? '#f8fcf9' : '#fffaf2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 800, color: '#1a1d24' }}>
                      {assignment.course} · {isEn ? `Module ${assignment.moduleOrder}` : `第 ${assignment.moduleOrder} 模块`}
                    </p>
                    {assignment.moduleTitle && (
                      <p style={{ margin: 0, fontSize: 12, color: '#5c6578', lineHeight: 1.4 }}>{assignment.moduleTitle}</p>
                    )}
                  </div>
                  <span style={{ flexShrink: 0, borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 800, color: reviewed ? '#2e7d32' : '#9a5b00', background: reviewed ? '#e8f5e9' : '#fff3e0' }}>
                    {reviewed ? (isEn ? 'Reviewed' : '已批改') : (isEn ? 'Submitted' : '已提交')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#5c6578' }}>
                    {isEn ? 'Submitted' : '提交'}: {new Date(assignment.submittedAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
                  </span>
                  {assignment.gradedAt && (
                    <span style={{ fontSize: 11, color: '#5c6578' }}>
                      {isEn ? 'Reviewed' : '批改'}: {new Date(assignment.gradedAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {assignment.score != null && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#2e7d32' }}>
                      {Math.round(assignment.score)} / 100
                    </span>
                  )}
                </div>
                {assignment.feedback && (
                  <div style={{ marginTop: 10, background: '#fff', border: '1px solid #dceee0', borderRadius: 8, padding: '9px 10px' }}>
                    <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 800, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      {isEn ? 'Reviewed by GIIS academic team' : 'GIIS 教学团队批改'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#31543a', lineHeight: 1.45 }}>{assignment.feedback}</p>
                  </div>
                )}
                {!assignment.feedback && assignment.contentPreview && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#8a6a14', lineHeight: 1.45 }}>
                    {isEn ? 'Submission preview' : '提交内容预览'}: {assignment.contentPreview}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CARE_TYPE_LABELS = {
  advisor_note: { en: 'Advisor note', zh: '顾问留言' },
  weekly_checkin: { en: 'Weekly check-in', zh: '每周关怀' },
  parent_contact: { en: 'Parent contact', zh: '家长联系' },
  intervention: { en: 'Support plan', zh: '辅导计划' },
  transfer_review: { en: 'Transfer review', zh: '转学评估' },
  graduation_review: { en: 'Graduation review', zh: '毕业评估' },
};

function AdvisorCard({ advisor, notes, isEn }) {
  const list = notes || [];
  const advisorName = advisor?.name;
  const nextCheckIn = advisor?.nextCheckInDueAt;
  // Hide entirely when the school hasn't assigned an advisor or shared anything yet,
  // so we never show an empty promise to a paying parent.
  if (!advisorName && !nextCheckIn && list.length === 0) return null;
  const fmt = (d) => new Date(d).toLocaleDateString(isEn ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' });
  return (
    <div style={{ background: 'linear-gradient(135deg,#1b6b3a 0%,#2e8b57 100%)', borderRadius: 14, padding: '20px 24px', color: '#fff' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {isEn ? 'From your advisor' : '来自你的升学顾问'}
      </p>
      {(advisorName || nextCheckIn) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: list.length ? 14 : 0 }}>
          {advisorName && (
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{isEn ? 'Advisor' : '负责顾问'}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{advisorName}</p>
            </div>
          )}
          {nextCheckIn && (
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{isEn ? 'Next check-in' : '下次关怀'}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{fmt(nextCheckIn)}</p>
            </div>
          )}
        </div>
      )}
      {list.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
          {isEn ? 'Your advisor will share progress notes and check-ins here.' : '顾问会在这里分享孩子的进度与关怀纪录。'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((note) => {
            const tl = CARE_TYPE_LABELS[note.type] || CARE_TYPE_LABELS.advisor_note;
            return (
              <div key={note.id} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#bff0cf' }}>{isEn ? tl.en : tl.zh}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{fmt(note.at)}</span>
                </div>
                {note.title && <p style={{ margin: '0 0 3px', fontSize: 13.5, fontWeight: 800, color: '#fff' }}>{note.title}</p>}
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{note.summary}</p>
                {note.followUpAt && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{isEn ? 'Follow-up' : '后续跟进'}: {fmt(note.followUpAt)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ParentReassuranceCard({ isEn, subscription }) {
  const isGuided = /guided|premium/i.test(subscription?.planType || '');
  return (
    <div style={{ background: '#f8fbff', borderRadius: 14, padding: '18px 20px', border: '1px solid #dce6f5' }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
        {isEn ? 'Parent-Safe Reassurance' : '家长安全摘要'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          {
            en: isGuided ? 'Advisor-reviewed summaries appear here after check-ins.' : 'Progress summaries focus on recorded learning evidence.',
            zh: isGuided ? '顾问 check-in 后，审核过的摘要会显示在这里。' : '进度摘要会聚焦系统记录到的学习证据。',
          },
          {
            en: 'Missing-work risks and next actions are surfaced so the family can respond quickly.',
            zh: '缺交风险与下一步会被清楚标出，方便家庭及时回应。',
          },
          {
            en: 'Private advisor notes, staff deliberations, and operational details remain internal.',
            zh: '内部顾问笔记、教务讨论与运营细节仍保持内部使用。',
          },
        ].map((item) => (
          <div key={item.en} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: '#1b6b3a', fontWeight: 900, fontSize: 13, lineHeight: 1.35 }}>✓</span>
            <span style={{ color: '#3a4250', fontSize: 12.5, lineHeight: 1.5 }}>{isEn ? item.en : item.zh}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ParentDashboard({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(null);

  const session = useMemo(() => getParentSession(), []);

  useEffect(() => {
    if (!session) { navigate('/parent/login', { replace: true }); return; }
  }, [session, navigate]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/parent/me`, { credentials: 'include' });
      if (res.status === 401) { clearParentSession(); navigate('/parent/login', { replace: true }); return; }
      if (!res.ok) { setError(isEn ? 'Failed to load data.' : '加载失败。'); return; }
      setError('');
      setData(await res.json());
    } catch {
      setError(isEn ? 'Network error.' : '网络错误。');
    }
  }, [isEn, navigate]);

  useEffect(() => { if (session) load(); }, [session, load]);

  function handleLogout() {
    fetch(`${API}/api/parent/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    clearParentSession();
    navigate('/parent/login', { replace: true });
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${API}/api/billing/portal`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!res.ok) { setPortalError(json.error || 'Could not open billing portal.'); return; }
      window.location.href = json.url;
    } catch {
      setPortalError('Network error — please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleStartCheckout() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${API}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planType: 'founders_monthly', email: session.email }),
      });
      const json = await res.json();
      if (!res.ok) { setPortalError(json.error || 'Could not start checkout.'); return; }
      window.location.href = json.url;
    } catch {
      setPortalError('Network error — please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  if (!session) return null;

  if (!data && !error) {
    return (
      <>
        <div className="row"><Nav language={language} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'Inter, sans-serif', color: '#5c6578' }}>
          {isEn ? 'Loading…' : '加载中…'}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="row"><Nav language={language} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'Inter, sans-serif', color: '#b91c1c' }}>
          {error}
        </div>
      </>
    );
  }

  const { student, stats, enrollments, recentActivity, subscription, weeklyInsights, advisor, advisorNotes } = data;
  const gradPct = Math.min(100, Math.round((stats.creditsEarned / GRAD_CREDITS) * 100));
  const inProgress = enrollments.filter(e => !e.creditEarned);
  const completed = enrollments.filter(e => e.creditEarned);
  const visibleActivity = aggregateRecentActivity(recentActivity, enrollments);
  const activitySignalCount = recentActivity.length + enrollments.reduce((sum, e) => (
    sum + Number(e.completedModules || 0) + Number(e.assessment?.assignmentsSubmitted || 0) + Number(e.assessment?.quizzesSubmitted || 0)
  ), 0);
  const hasLimitedEvidence = activitySignalCount < 5;

  return (
    <>
      <Helmet>
        <title>{isEn ? `${student.name}'s Dashboard` : `${student.name} 的进度面板`} | GIIS</title>
      </Helmet>

      <div className="row"><Nav language={language} /></div>

      <div style={{ background: '#f4f6fa', fontFamily: 'Inter, sans-serif', minHeight: 'calc(100vh - 70px)', padding: '28px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {isEn ? 'Parent Portal' : '家长面板'}
              </p>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                {isEn ? `${student.name.split(' ')[0]}'s progress` : `${student.name} 的进度`}
                {student.studentCode && <span style={{ fontSize: 14, fontWeight: 500, color: '#9aa0ad', marginLeft: 8 }}>#{student.studentCode}</span>}
              </h1>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: '1.5px solid #d4d8e0', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#5c6578', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {isEn ? 'Sign out' : '退出登录'}
            </button>
          </div>

          {/* Enrollment pending banner */}
          {!subscription && (
            <div style={{ background: 'linear-gradient(90deg, #b45309, #d97706)', borderRadius: 12, padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>
                  {isEn ? 'Your enrollment is not yet active' : '你的学籍尚未激活'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  {isEn ? 'Complete payment to unlock full course access.' : '完成付款以解锁全部课程。'}
                </p>
              </div>
              <button
                onClick={handleStartCheckout}
                disabled={portalLoading}
                style={{ background: '#fff', color: '#b45309', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: portalLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                {portalLoading ? (isEn ? 'Loading…' : '加载中…') : (isEn ? 'Complete Enrollment →' : '完成报名 →')}
              </button>
            </div>
          )}

          {hasLimitedEvidence && (
            <div style={{ background: '#fffaf2', border: '1px solid #f4c36a', borderRadius: 12, padding: '13px 18px', marginBottom: 20, color: '#8a5a00' }}>
              <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {isEn ? 'Early account signal' : '新账号提醒'}
              </p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
                {isEn
                  ? 'This dashboard is based only on recorded activity so far. Pacing and weekly patterns become more reliable after the student completes more quizzes, assignments, and modules.'
                  : '这个面板只根据目前已有的学习记录显示。学生完成更多测验、作业与模块后，进度判断和每周趋势会更准确。'}
              </p>
            </div>
          )}

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 20 }} className="giis-parent-grid">

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Hero card */}
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)', borderRadius: 14, padding: '24px 28px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(213,168,54,0.25)', border: '2px solid rgba(213,168,54,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#d5a836', flexShrink: 0 }}>
                    {student.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, margin: '0 0 2px' }}>{student.name}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      {student.gradeLevel || ''}{student.gradeLevel ? ' · ' : ''}#{student.studentCode}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                  <StatCard label={isEn ? 'Credits Earned' : '已获学分'} value={stats.creditsEarned.toFixed(1)} sub={`/ ${GRAD_CREDITS} ${isEn ? 'to graduate' : '毕业学分'}`} />
                  <StatCard
                    label="GPA · UW"
                    value={stats.gpa ?? <span style={{ fontSize: 15, lineHeight: 1.2 }}>{isEn ? 'No GPA yet' : '暂无 GPA'}</span>}
                    sub={stats.gpa ? (isEn ? '4.0 scale' : '4.0 制') : (isEn ? 'Appears after official transcript grades are released' : '正式成绩单成绩发布后显示')}
                  />
                  <StatCard label={isEn ? 'In Progress' : '进行中'} value={inProgress.length} sub={isEn ? 'courses' : '门课'} />
                  <StatCard label={isEn ? 'Completed' : '已完成'} value={completed.length} sub={isEn ? 'courses' : '门课'} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{isEn ? 'Graduation progress' : '毕业进度'}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#d5a836' }}>{gradPct}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${gradPct}%`, background: 'linear-gradient(to right, #d5a836, #ffce5b)', borderRadius: 999 }} />
                  </div>
                </div>
              </div>

              <WeeklyInsightsCard insights={weeklyInsights} isEn={isEn} />

              {hasLimitedEvidence && <FirstWeekEvidenceCard isEn={isEn} subscription={subscription} />}

              {/* Active courses */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  {isEn ? `Active Courses — ${inProgress.length}` : `进行中课程 — ${inProgress.length}`}
                </p>
                {inProgress.length > 0 && <PacingLegend isEn={isEn} />}
                {inProgress.length === 0
                  ? <p style={{ fontSize: 13, color: '#9aa0ad', margin: '12px 0 0' }}>{isEn ? 'No active courses.' : '暂无进行中课程。'}</p>
                  : inProgress.map(e => <CourseBar key={e.id} enr={e} isEn={isEn} />)
                }
                {completed.length > 0 && (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ fontSize: 12, color: '#2b3d6d', fontWeight: 700, cursor: 'pointer', listStyle: 'none' }}>
                      {isEn ? `▸ ${completed.length} completed courses` : `▸ ${completed.length} 门已完成`}
                    </summary>
                    {completed.map(e => <CourseBar key={e.id} enr={e} isEn={isEn} />)}
                  </details>
                )}
              </div>

              {/* Assessment assurance */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  {isEn ? 'Assessment Evidence' : '学习评量证据'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {[
                    { value: '40%', label: isEn ? 'module quizzes' : '章节测验' },
                    { value: '30%', label: isEn ? 'midterm exam' : '期中考试' },
                    { value: '30%', label: isEn ? 'final exam' : '期末考试' },
                    { value: '5d', label: isEn ? 'assignment review target' : '作业批改目标' },
                  ].map((item) => (
                    <div key={item.label} style={{ background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: 10, padding: '12px 14px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: '#2b3d6d' }}>{item.value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#5c6578', lineHeight: 1.35 }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#5c6578', lineHeight: 1.55, margin: '12px 0 0' }}>
                  {isEn
                    ? 'Assignments are submitted in the Learn Portal as written work or a document link. A teacher or advisor reviews the work, scores it out of 100, and leaves written feedback visible to the student and parent. All module assignments must be submitted before the final exam.'
                    : '作业在 Learn Portal 内提交，可直接贴文字或文件链接。老师或顾问会审阅作业、按 100 分批改，并留下学生与家长都能看到的书面反馈。所有模块作业必须提交后才能参加期末考试。'}
                </p>
              </div>

              <AssignmentHistory enrollments={enrollments} isEn={isEn} />

            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Advisor notes — the human voice + early warning the parent wants first */}
              <AdvisorCard advisor={advisor} notes={advisorNotes} isEn={isEn} />

              <ParentReassuranceCard isEn={isEn} subscription={subscription} />

              {/* Recent activity */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  {isEn ? 'Recent Activity' : '最近活动'}
                </p>
                {visibleActivity.length === 0
                  ? <p style={{ fontSize: 13, color: '#9aa0ad' }}>{isEn ? 'No activity yet.' : '暂无活动记录。'}</p>
                  : visibleActivity.map((ev, i) => <ActivityRow key={`${ev.type}-${ev.course}-${ev.at}-${i}`} event={ev} isEn={isEn} />)
                }
              </div>

              {/* Official transcript */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  {isEn ? 'Official Records' : '正式文件'}
                </p>
                <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 14px', lineHeight: 1.55 }}>
                  {isEn
                    ? 'View or download the official transcript using the same locked format used by the school office.'
                    : '查看或下载正式成绩单，格式与学校办公室使用的版本一致。'}
                </p>
                <Link
                  to="/parent/transcript"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#2b3d6d', color: '#fff', borderRadius: 8, padding: '11px 16px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}
                >
                  {isEn ? 'View official transcript →' : '查看正式成绩单 →'}
                </Link>
              </div>

              {/* Subscription management */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  {isEn ? 'Subscription' : '订阅管理'}
                </p>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{ width: '100%', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 16px', fontSize: 13.5, fontWeight: 700, cursor: portalLoading ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                >
                  {portalLoading
                    ? (isEn ? 'Opening…' : '开启中…')
                    : (isEn ? 'Manage subscription →' : '管理订阅 →')}
                </button>
                {portalError && (
                  <p style={{ fontSize: 12, color: '#b91c1c', margin: '8px 0 0' }}>{portalError}</p>
                )}
                <p style={{ fontSize: 11, color: '#9aa0ad', margin: '8px 0 0', lineHeight: 1.5 }}>
                  {isEn
                    ? 'Cancel, update payment method, or download invoices via Stripe.'
                    : '透过 Stripe 取消订阅、更新付款方式或下载发票。'}
                </p>
              </div>

              {/* Quick links */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  {isEn ? 'Quick Links' : '快速入口'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: isEn ? 'Contact admissions' : '联系招生办', href: `mailto:admissions@genesisideas.school` },
                    { label: isEn ? 'View School Profile' : '查看学校简介', to: '/school-profile' },
                    { label: isEn ? 'Diploma requirements' : '文凭要求', to: '/academics' },
                  ].map(link => link.to
                    ? <Link key={link.label} to={link.to} style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid #f0f2f8' }}>{link.label} →</Link>
                    : <a key={link.label} href={link.href} style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid #f0f2f8' }}>{link.label} →</a>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
