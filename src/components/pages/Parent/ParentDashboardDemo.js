import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';
import { getUpcomingEvents, formatDate } from '../../../config/schoolCalendar';

/**
 * Parent Dashboard — public preview / demo page.
 *
 * What it does:
 *   Renders the same layout the future logged-in `/parent/dashboard` will,
 *   but with hardcoded Yunfan data so any prospective parent can see exactly
 *   what they'll get after enrolling. Anchored from the Pricing page and the
 *   homepage demo section so it doubles as a sales tool.
 *
 * When real Phase 1 auth + API are built (`/parent/login` + `/parent/dashboard`),
 * keep THIS page at /parent/demo as a marketing surface — same component,
 * just pulls live data instead of the hardcoded numbers below.
 *
 * Design source: public/demo/parent-dashboard-mockup.html
 * Real student data source: server/prisma/seed.js (Yunfan Yang, 26-004)
 */

// Hardcoded preview data — Yunfan Yang from seed.js
const PREVIEW = {
  parent: { name: 'Yali Yang', initials: 'YL', email: 'yali.yang@example.com' },
  student: {
    name: 'Yunfan Yang', nameZh: '杨芸帆',
    initials: 'YY',
    grade: { en: 'Grade 12', zh: '12 年级' },
    pathway: { en: 'Engineering Science Pathway', zh: '工程科学路径' },
    code: '26-004',
  },
  stats: {
    creditsEarned: 22.0,
    creditsTotal: 24,
    gpa: 3.85,
    inProgress: 3,
    creditsThisWeek: 1.0,
  },
  courses: [
    { dept: { en: 'Computer Science', zh: '计算机科学' }, code: 'CS', color: '#1565C0',
      name: 'AP Computer Science A', meta: { en: 'Module 9 of 14 · Last activity 2 days ago', zh: '第 9 / 14 模块 · 2 天前最后活动' }, pct: 64,
      pace: { en: 'Behind 1 week', zh: '落后 1 周', kind: 'behind' } },
    { dept: { en: 'English', zh: '英语' }, code: 'E', color: '#C84B0A',
      name: 'English IV Portfolio Writing', meta: { en: 'Module 5 of 8 · Draft feedback received', zh: '第 5 / 8 模块 · 已收到草稿反馈' }, pct: 63,
      pace: { en: 'On Track', zh: '进度正常', kind: 'on_track' } },
    { dept: { en: 'Economics', zh: '经济' }, code: 'EC', color: '#1B6B3A',
      name: 'AP Microeconomics', meta: { en: 'Module 6 of 12 · Midterm passed (88%)', zh: '第 6 / 12 模块 · 期中通过 88%' }, pct: 50,
      pace: { en: 'On Track', zh: '进度正常', kind: 'on_track' } },
  ],
  activity: [
    { kind: 'green', icon: '✓', when: { en: 'May 7 · 2 days ago', zh: '5 月 7 日 · 2 天前' },
      lead: { en: 'Earned 1.0 credit · ', zh: '获得 1.0 学分 · ' },
      bold: 'AP Calculus AB',
      tail: { en: ' final exam passed (92%)', zh: ' 期末考通过 92%' } },
    { kind: 'feedback', icon: '📝', when: { en: 'May 6 · 3 days ago', zh: '5 月 6 日 · 3 天前' },
      lead: { en: 'Teacher feedback received on ', zh: '收到老师对 ' },
      bold: 'AP CS A — Module 8 assignment',
      tail: { en: ' (95/100)', zh: ' 的反馈（95/100）' },
      feedback: {
        en: 'Strength: clear loop logic and readable variable names. Correction: add one edge-case test for empty input. Next action: revise the test table before Module 9.',
        zh: '优点：循环逻辑清楚，变量命名易读。订正：补一个空输入的边界测试。下一步：进入第 9 模块前更新测试表。',
      } },
    { kind: 'blue', icon: '📖', when: { en: 'May 5 · 4 days ago', zh: '5 月 5 日 · 4 天前' },
      lead: { en: 'Completed ', zh: '完成 ' },
      bold: 'Module 6',
      tail: { en: ' of AP Microeconomics', zh: ' AP 微观经济学' } },
    { kind: 'gold', icon: '★', when: { en: 'May 3 · 6 days ago', zh: '5 月 3 日 · 6 天前' },
      lead: { en: 'Passed ', zh: '通过 ' },
      bold: 'AP Microeconomics midterm',
      tail: { en: ' with 88%', zh: '，分数 88%' } },
  ],
  advisorNote: {
    en: '"Yunfan stayed consistent this week and is on track for June graduation. We\'re now focusing on his college essay drafts. He\'s well-prepared for the Engineering Science pathway final."',
    zh: '"芸帆这周保持稳定的学习节奏，按计划在 6 月毕业。我们现在专注于他的大学申请文书草稿。他对工程科学路径的期末考已经准备充分。"',
  },
  upcoming: [
    { day: { en: 'MAY', zh: 'MAY' }, num: 21, what: { en: 'AP CS A — Module 10 due', zh: 'AP CS A 第 10 模块截止' },
      sub: { en: 'Tuesday · Project submission', zh: '周二 · 项目提交' } },
    { day: { en: 'JUN', zh: 'JUN' }, num: 14, what: { en: 'Diploma eligibility', zh: '文凭达成日' },
      sub: { en: '2 more credits needed', zh: '还差 2 学分' } },
    { day: { en: 'JUN', zh: 'JUN' }, num: 18, what: { en: 'Advisor portfolio review', zh: '顾问作品集复盘' },
      sub: { en: 'College writing checkpoint', zh: '大学写作检查点' } },
  ],
};

const BADGE_COLORS = {
  green:    { bg: '#e8f5e9', fg: '#2e7d32' },
  feedback: { bg: '#fff3e0', fg: '#e65100' },
  blue:     { bg: '#e3f2fd', fg: '#2b3d6d' },
  gold:     { bg: 'rgba(213,168,54,0.18)', fg: '#b8862e' },
};

export default function ParentDashboardDemo({ language }) {
  const isEn = language === 'en';
  const lang = isEn ? 'en' : 'zh';
  const p = PREVIEW;
  const gradPct = Math.round((p.stats.creditsEarned / p.stats.creditsTotal) * 100);

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Parent Dashboard Preview' : '家长面板预览'} | Genesis of Ideas International School</title>
        <meta name="description" content={isEn
          ? 'Preview the GIIS Parent Dashboard — see your child\'s credits, GPA, recent activity, and advisor notes in one place.'
          : '预览 GIIS 家长面板 — 一目了然查看孩子的学分、GPA、最近活动与顾问留言。'} />
      </Helmet>

      <div className="row"><Nav language={language} /></div>

      {/* Preview banner — make it clear this is a demo, not real data */}
      <div style={{
        background: 'rgba(213,168,54,0.18)',
        borderBottom: '1px solid #d5a836',
        padding: '10px 24px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 600,
        color: '#8a6a14',
        letterSpacing: '0.5px',
        fontFamily: 'Inter, sans-serif',
      }}>
        {isEn
          ? '★ SAMPLE PREVIEW — Demo data only. Live parent dashboards use the linked student’s actual enrollments, activity, and teacher feedback.'
          : '★ 示例预览 — 下方仅为展示数据。正式家长面板会使用绑定学生的真实课程、学习活动与教师反馈。'}
      </div>

      <div style={{
        background: '#f4f6fa',
        fontFamily: 'Inter, sans-serif',
        color: '#1a1d24',
        padding: '28px 24px 64px',
        minHeight: 'calc(100vh - 120px)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Greeting */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {isEn ? `Hello ${p.parent.name}` : `您好，${p.parent.name}`}
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
            {isEn ? `${p.student.name.split(' ')[0]}'s progress this week` : `${p.student.nameZh.charAt(0)}${p.student.nameZh.slice(1, 2)}本周进度`}
            <span style={{ color: '#5c6578', fontWeight: 500, fontSize: '18px', marginLeft: '8px' }}>
              {isEn ? p.student.nameZh : ''}
            </span>
          </h1>

          {/* Two-column layout */}
          <div style={layoutGrid} className="giis-parent-grid">

            {/* ─── LEFT ─── */}
            <div>

              {/* Student hero card */}
              <div style={{ ...card, ...studentHero }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px' }}>
                  <div style={photo}>{p.student.initials}</div>
                  <div>
                    <p style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>
                      {isEn ? `${p.student.name} · ${p.student.nameZh}` : `${p.student.nameZh}（${p.student.name}）`}
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                      {p.student.grade[lang]} · {p.student.pathway[lang]} · #{p.student.code}
                    </p>
                  </div>
                </div>
                <div style={statsGrid}>
                  <Stat label={isEn ? 'Credits Earned' : '已获学分'} value={p.stats.creditsEarned.toFixed(1)} sub={`/ ${p.stats.creditsTotal} ${isEn ? 'to graduate' : '毕业学分'}`} />
                  <Stat label="GPA · UW" value={p.stats.gpa.toFixed(2)} sub={isEn ? '4.0 scale' : '4.0 制'} />
                  <Stat label={isEn ? 'In Progress' : '进行中'} value={p.stats.inProgress} sub={isEn ? 'active courses' : '门进行中'} />
                  <Stat label={isEn ? 'This week' : '本周'} value={`+${p.stats.creditsThisWeek.toFixed(1)}`} sub={isEn ? 'credit earned' : '学分获得'} />
                </div>
                <div style={{ marginTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{isEn ? 'Graduation progress' : '毕业进度'}</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#d5a836' }}>{gradPct}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${gradPct}%`, background: 'linear-gradient(to right, #d5a836, #ffce5b)', borderRadius: '999px' }} />
                  </div>
                </div>
              </div>

              {/* Active courses */}
              <div style={card}>
                <CardHead en="Active Courses" zh="进行中课程" isEn={isEn} right={
                  <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>
                    {p.courses.length} {isEn ? 'courses' : '门'}
                  </span>
                } />
                {p.courses.map((c) => {
                  const pace = c.pace?.kind === 'behind'
                    ? { bg: '#fff3e0', fg: '#b45309', border: '#f4c36a' }
                    : { bg: '#e8f5e9', fg: '#2e7d32', border: '#a5d6a7' };
                  return (
                  <div key={c.name} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '14px', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f2f8' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.color, color: '#fff', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.code}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                      <p style={{ fontSize: '12px', color: '#5c6578', margin: 0 }}>{c.meta[lang]}</p>
                    </div>
                    <div style={{ width: '80px', height: '6px', background: '#eef0f4', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: '999px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', minWidth: '36px', textAlign: 'right' }}>{c.pct}%</span>
                      {c.pace && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: pace.fg, background: pace.bg, border: `1px solid ${pace.border}`, borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                          {c.pace[lang]}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Assessment evidence */}
              <div style={card}>
                <CardHead en="Assessment & Feedback" zh="评量与批改" isEn={isEn} right={
                  <span style={{ fontSize: '12px', color: '#1B6B3A', fontWeight: 800 }}>
                    {isEn ? 'Visible to parents' : '家长可见'}
                  </span>
                } />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: 12 }}>
                  {[
                    { value: '40%', en: 'Module quizzes', zh: '章节测验' },
                    { value: '30%', en: 'Midterm', zh: '期中考试' },
                    { value: '30%', en: 'Final exam', zh: '期末考试' },
                    { value: '5d', en: 'Feedback target', zh: '批改目标' },
                  ].map((item) => (
                    <div key={item.en} style={{ background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: 8, padding: '12px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 850, color: '#2b3d6d' }}>{item.value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#5c6578' }}>{isEn ? item.en : item.zh}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: '#5c6578', lineHeight: 1.6, margin: 0 }}>
                  {isEn
                    ? 'Students submit assignments inside the Learn Portal as written work or document links. Teachers review from the grading queue, score the work out of 100, and leave feedback that appears in the student and parent record.'
                    : '学生在 Learn Portal 内提交文字作业或文件链接。老师在后台批改队列中审阅，按 100 分批改，并留下会显示在学生与家长记录中的反馈。'}
                </p>
              </div>

              {/* Recent activity */}
              <div style={card}>
                <CardHead en="Recent Activity" zh="最近动态" isEn={isEn} right={<span style={{ fontSize: '11px', color: '#888' }}>{isEn ? 'May 2 → May 8' : '5/2 → 5/8'}</span>} />
                {p.activity.map((a, i) => {
                  const c = BADGE_COLORS[a.kind];
                  return (
                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f0f2f8', fontSize: '13px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, background: c.bg, color: c.fg }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0 }}>
                          {a.lead[lang]}<b style={{ color: '#1a1a2e' }}>{a.bold}</b>{a.tail[lang]}
                        </p>
                        {a.feedback && (
                          <div style={{ margin: '7px 0 2px', background: '#f1f8f2', border: '1px solid #cde8d1', borderRadius: 8, padding: '8px 10px' }}>
                            <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 800, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                              {isEn ? 'Sample teacher feedback' : '教师评语示例'}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#31543a', lineHeight: 1.45 }}>{a.feedback[lang]}</p>
                          </div>
                        )}
                        <p style={{ color: '#5c6578', fontSize: '11px', margin: '3px 0 0' }}>{a.when[lang]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── RIGHT (sidebar) ─── */}
            <div>

              {/* Advisor note */}
              <div style={{ ...sideCard, background: 'linear-gradient(135deg, #fffaeb 0%, #fff5d6 100%)', borderColor: '#d5a836' }}>
                <Eyebrow en="Advisor Note" zh="顾问留言" isEn={isEn} color="#8a6a14" />
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#1a1d24', margin: '0 0 12px', fontStyle: 'italic' }}>
                  {p.advisorNote[lang]}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#5c6578' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#2b3d6d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>SZ</div>
                  <div>
                    <div style={{ color: '#1a1d24' }}><b>Shiyu Zhang, Ph.D.</b></div>
                    <div>{isEn ? 'President & Principal · 5 days ago' : 'President & Principal · 5 天前'}</div>
                  </div>
                </div>
              </div>

              {/* Upcoming */}
              <div style={sideCard}>
                <Eyebrow en="Upcoming" zh="近期重点" isEn={isEn} />
                {p.upcoming.map((u, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < p.upcoming.length - 1 ? '1px solid #f0f2f8' : 'none', fontSize: '13px' }}>
                    <div style={{ flexShrink: 0, width: '60px', textAlign: 'center', background: '#f0f4ff', borderRadius: '6px', padding: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '1px', textTransform: 'uppercase' }}>{u.day[lang]}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', lineHeight: 1, marginTop: '2px' }}>{u.num}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.what[lang]}</div>
                      <div style={{ fontWeight: 400, color: '#5c6578', fontSize: '11px', marginTop: '2px' }}>{u.sub[lang]}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={sideCard}>
                <Eyebrow en="Quick Links" zh="快速操作" isEn={isEn} />
                {[
                  { icon: '📧', en: 'Message advisor',   zh: '联系顾问', to: null },
                  { icon: '📄', en: 'Download transcript', zh: '下载成绩单', to: null },
                  { icon: '💳', en: 'Billing & payment',  zh: '账单与付款', to: null },
                  { icon: '📅', en: 'School calendar',    zh: '校历',      to: '/school-profile' },
                ].map((q) => (
                  q.to ? (
                    <Link key={q.en} to={q.to} style={{ ...quickLink, color: '#1a1d24', textDecoration: 'none' }}>
                      <span style={{ fontSize: '18px' }}>{q.icon}</span>
                      {isEn ? q.en : q.zh}
                      <span style={{ marginLeft: 'auto', color: '#5c6578' }}>→</span>
                    </Link>
                  ) : (
                    <div key={q.en} style={quickLink}>
                      <span style={{ fontSize: '18px' }}>{q.icon}</span>
                      {isEn ? q.en : q.zh}
                      <span style={{ marginLeft: 'auto', color: '#5c6578' }}>→</span>
                    </div>
                  )
                ))}
              </div>

              {/* Upcoming key dates pulled from school calendar */}
              <UpcomingFromCalendar isEn={isEn} />

              {/* Weekly digest */}
              <div style={{ ...sideCard, background: '#f0f4ff', borderColor: '#c5d0f0' }}>
                <Eyebrow en="Weekly Email Digest" zh="每周邮件摘要" isEn={isEn} />
                <p style={{ fontSize: '13px', lineHeight: 1.55, margin: '0 0 8px' }}>
                  {isEn ? <>You're subscribed to weekly Sunday digests at <b>{p.parent.email}</b>.</> : <>每周日定时收到摘要邮件至 <b>{p.parent.email}</b>。</>}
                </p>
                <p style={{ fontSize: '12px', color: '#5c6578', margin: 0 }}>
                  {isEn ? 'Last sent · May 5' : '上次发送 · 5 月 5 日'}
                </p>
              </div>

            </div>
          </div>

          {/* CTA back to pricing / apply */}
          <div style={{
            marginTop: '48px',
            padding: '32px 36px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)',
            borderRadius: '14px',
            textAlign: 'center',
            color: '#fff',
            boxShadow: '0 12px 32px rgba(26,26,46,0.18)',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#d5a836', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
              {isEn ? 'Like what you see?' : '喜欢这样的家长面板吗？'}
            </p>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, margin: '0 0 14px' }}>
              {isEn ? 'This is what every GIIS parent gets.' : '每位 GIIS 家长都能用上这套。'}
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              {isEn
                ? 'Real teacher feedback. Weekly progress emails. Direct line to your child\'s advisor. Plans start at $49/month.'
                : '真人老师批改、每周进度邮件、与孩子顾问直接对话。方案从 $49/月起。'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/admission" style={{
                padding: '14px 30px', borderRadius: '10px',
                background: '#d5a836', color: '#1a1a2e',
                fontWeight: 800, fontSize: '14px', textDecoration: 'none',
              }}>
                {isEn ? 'Start Application →' : '开始申请 →'}
              </Link>
              <Link to="/pricing" style={{
                padding: '14px 30px', borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
                fontWeight: 700, fontSize: '14px', textDecoration: 'none',
              }}>
                {isEn ? 'See Pricing' : '查看价格'}
              </Link>
            </div>
          </div>

          {/* Foot note */}
          <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
            {isEn
              ? 'GIIS Parent Portal · preview with sample data based on Class of 2026 alumnus Yunfan Yang'
              : 'GIIS 家长门户 · 预览，示例数据基于 2026 届毕业生杨芸帆'}
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .giis-parent-grid { grid-template-columns: 1fr !important; }
          .giis-parent-grid > div:first-child > div:first-child > div:nth-child(2) {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

/* ─── small helper components ─── */

function UpcomingFromCalendar({ isEn }) {
  const events = getUpcomingEvents(undefined, 4);
  if (events.length === 0) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e6f0',
      borderRadius: '12px', padding: '18px 20px',
      marginBottom: '16px', boxShadow: '0 1px 3px rgba(26,26,46,0.06)',
    }}>
      <p style={{
        fontSize: '11px', fontWeight: 700, color: '#2b3d6d',
        letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px',
      }}>
        {isEn ? 'School Calendar · Upcoming' : '校历 · 近期日程'}
      </p>
      {events.map((e, i) => (
        <div key={i} style={{
          fontSize: '12px', padding: '6px 0',
          borderTop: i === 0 ? 'none' : '1px solid #f0f2f8',
          display: 'flex', justifyContent: 'space-between', gap: '10px',
        }}>
          <span style={{ color: '#1a1d24', flex: 1 }}>{e.label}</span>
          <span style={{ color: '#5c6578', whiteSpace: 'nowrap' }}>{formatDate(e.date)}</span>
        </div>
      ))}
      <div style={{ marginTop: '10px', textAlign: 'right' }}>
        <Link to="/school-profile" style={{ fontSize: '12px', color: '#2b3d6d', fontWeight: 700, textDecoration: 'none' }}>
          {isEn ? 'Full calendar →' : '完整校历 →'}
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(213,168,54,0.85)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>{sub}</div>
    </div>
  );
}

function Eyebrow({ en, zh, isEn, color = '#2b3d6d' }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 700, color, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>
      {isEn ? en : zh}
    </p>
  );
}

function CardHead({ en, zh, isEn, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#5c6578', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
        {isEn ? en : zh}
      </p>
      {right}
    </div>
  );
}

/* ─── styles ─── */

const layoutGrid = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '24px',
};

const card = {
  background: '#fff',
  border: '1px solid #e0e6f0',
  borderRadius: '12px',
  padding: '20px 22px',
  marginBottom: '18px',
  boxShadow: '0 1px 3px rgba(26,26,46,0.06)',
};

const studentHero = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)',
  color: '#fff',
  border: 'none',
  padding: '24px 28px',
};

const photo = {
  width: '64px', height: '64px', borderRadius: '50%',
  background: 'rgba(213,168,54,0.25)',
  border: '2px solid #d5a836',
  color: '#d5a836',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: '24px',
  flexShrink: 0,
};

const statsGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '14px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
};

const sideCard = {
  background: '#fff',
  border: '1px solid #e0e6f0',
  borderRadius: '12px',
  padding: '18px 20px',
  marginBottom: '16px',
  boxShadow: '0 1px 3px rgba(26,26,46,0.06)',
};

const quickLink = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '12px 14px',
  border: '1px solid #e0e6f0',
  borderRadius: '10px',
  background: '#fff',
  fontSize: '13px', fontWeight: 600,
  marginBottom: '8px',
  cursor: 'pointer',
};
