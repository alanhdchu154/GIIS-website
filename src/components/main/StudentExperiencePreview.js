import React from 'react';
import { Link } from 'react-router-dom';

function pick(copy, isEn) {
  return copy[isEn ? 'en' : 'zh'];
}

const WEEK_STEPS = [
  {
    label: { en: 'Plan', zh: '规划' },
    title: { en: 'Open the assigned course plan', zh: '打开已安排课程' },
    body: {
      en: 'Students start from the course dashboard, syllabus, module sequence, and estimated module hours instead of guessing what to do next.',
      zh: '学生从课程面板、syllabus、模块顺序与预计学习时间开始，不需要猜下一步做什么。',
    },
  },
  {
    label: { en: 'Study', zh: '学习' },
    title: { en: 'Work through one module at a time', zh: '一次完成一个模块' },
    body: {
      en: 'Each module shows objectives, required resources, expert-lens guidance, and lesson videos when available.',
      zh: '每个模块会显示学习目标、必要资源、专家视角提示，以及已上线的课程影片。',
    },
  },
  {
    label: { en: 'Submit', zh: '提交' },
    title: { en: 'Turn learning into evidence', zh: '把学习变成证据' },
    body: {
      en: 'Students complete quizzes and submit assignments as written work or a document link before moving through major exams.',
      zh: '学生完成测验，并以文字作业或文件链接提交任务，再进入主要考试节点。',
    },
  },
  {
    label: { en: 'Review', zh: '批改' },
    title: { en: 'Feedback becomes visible', zh: '反馈会被看见' },
    body: {
      en: 'Scores and written feedback appear in the student grade view and parent dashboard after review.',
      zh: '批改后，分数与书面反馈会显示在学生成绩页与家长面板。',
    },
  },
];

const FIRST_WEEK = [
  {
    title: { en: 'Account activation', zh: '帐号开通' },
    body: {
      en: 'After payment is verified, GIIS activates student and parent access and confirms the first active course list.',
      zh: '付款核验后，GIIS 开通学生与家长入口，并确认第一批进行中课程。',
    },
  },
  {
    title: { en: 'First module start', zh: '开始第一个模块' },
    body: {
      en: 'The student checks the syllabus, estimated hours, required resources, quiz, and assignment expectations.',
      zh: '学生查看 syllabus、预计学习时间、必要资源、测验与作业要求。',
    },
  },
  {
    title: { en: 'First evidence trail', zh: '第一条学习证据' },
    body: {
      en: 'The first quiz, assignment, or activity record gives the parent dashboard something concrete to show.',
      zh: '第一份测验、作业或学习活动记录，会让家长面板开始有具体证据。',
    },
  },
  {
    title: { en: 'Support check', zh: '支持层级确认' },
    body: {
      en: 'If pacing or motivation is already unclear, admissions can revisit whether Self-Paced, Guided, or Premium fits better.',
      zh: '如果一开始就发现节奏或动力不清楚，招生团队可重新确认 Self-Paced、Guided 或 Premium 哪个更合适。',
    },
  },
];

const SUPPORT_LEVELS = [
  {
    title: { en: 'Self-Paced', zh: '自主学习' },
    body: {
      en: 'Best when the student can follow the module sequence independently and the parent checks the dashboard regularly.',
      zh: '适合能自主按照模块推进、家长愿意定期查看面板的学生。',
    },
  },
  {
    title: { en: 'Guided', zh: '顾问指导' },
    body: {
      en: 'Adds monthly advisor check-ins, course planning, transfer-credit review, and parent progress review.',
      zh: '加入每月顾问 check-in、课程规划、转学分审核与家长进度解读。',
    },
  },
  {
    title: { en: 'Premium', zh: '升学路径' },
    body: {
      en: 'Adds higher-touch pathway planning, writing or project portfolio guidance, and college-readiness framing.',
      zh: '加入更密集的 pathway 规划、写作或项目 portfolio 指导，以及升学准备定位。',
    },
  },
];

export default function StudentExperiencePreview({ language, variant = 'full' }) {
  const isEn = language !== 'zh';
  const compact = variant === 'compact';

  return (
    <section style={{
      background: compact ? '#fff' : '#f4f6fa',
      fontFamily: 'Inter, sans-serif',
      padding: compact ? '48px 0' : '66px 0',
      borderTop: compact ? '1px solid #e8ecf5' : 'none',
      borderBottom: '1px solid #e8ecf5',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 6%' }}>
        <div className="giis-student-experience-grid" style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'minmax(280px, 0.82fr) minmax(360px, 1.18fr)',
          gap: compact ? 24 : 34,
          alignItems: 'start',
        }}>
          <div>
            <p style={eyebrow}>{isEn ? 'Student Week' : '学生每周怎么学'}</p>
            <h2 style={sectionTitle}>
              {isEn ? 'What does a GIIS week actually look like?' : 'GIIS 的一周，到底会发生什么？'}
            </h2>
            <p style={{ margin: '14px 0 20px', color: '#4f5868', fontSize: 15, lineHeight: 1.75 }}>
              {isEn
                ? 'GIIS is not just a checkout and a video library. A student week should create a visible trail: assigned courses, module work, submitted evidence, reviewed feedback, and a parent-safe next action.'
                : 'GIIS 不是付款后丢给孩子一堆影片。每一周应该留下看得见的轨迹：已安排课程、模块学习、提交证据、批改反馈，以及家长能理解的下一步。'}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/parent/demo" style={primaryLink}>{isEn ? 'Preview parent view' : '预览家长视角'}</Link>
              <Link to="/lessons" style={secondaryLink}>{isEn ? 'Browse lesson library' : '查看课程影片'}</Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {WEEK_STEPS.map((step) => (
                <div key={step.label.en} style={card}>
                  <p style={{ margin: '0 0 8px', color: '#2b3d6d', fontSize: 11, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    {pick(step.label, isEn)}
                  </p>
                  <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 17, lineHeight: 1.25, fontWeight: 850 }}>
                    {pick(step.title, isEn)}
                  </h3>
                  <p style={{ margin: 0, color: '#4f5868', fontSize: 13, lineHeight: 1.65 }}>
                    {pick(step.body, isEn)}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              border: '1px solid #e1e7f0',
              borderRadius: 8,
              background: '#fff',
              padding: '20px 20px 18px',
            }}>
              <p style={eyebrow}>{isEn ? 'First Week After Enrollment' : '入学后第一周'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                {FIRST_WEEK.map((item, index) => (
                  <div key={item.title.en} style={{ borderLeft: '3px solid #d5a836', paddingLeft: 12 }}>
                    <p style={{ margin: '0 0 5px', color: '#8a6a14', fontSize: 11, fontWeight: 900 }}>
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 style={{ margin: '0 0 6px', color: '#1a1a2e', fontSize: 15, lineHeight: 1.3, fontWeight: 850 }}>
                      {pick(item.title, isEn)}
                    </h3>
                    <p style={{ margin: 0, color: '#4f5868', fontSize: 12.5, lineHeight: 1.6 }}>
                      {pick(item.body, isEn)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {SUPPORT_LEVELS.map((level) => (
                <div key={level.title.en} style={{ ...card, background: '#fffbef', borderColor: '#ead58e' }}>
                  <h3 style={{ margin: '0 0 7px', color: '#1a1a2e', fontSize: 16, lineHeight: 1.25, fontWeight: 850 }}>
                    {pick(level.title, isEn)}
                  </h3>
                  <p style={{ margin: 0, color: '#5c4a12', fontSize: 12.5, lineHeight: 1.6 }}>
                    {pick(level.body, isEn)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .giis-student-experience-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const eyebrow = {
  margin: '0 0 9px',
  color: '#b8962e',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.6,
  textTransform: 'uppercase',
};

const sectionTitle = {
  margin: 0,
  color: '#1a1a2e',
  fontSize: 'clamp(26px, 3.4vw, 42px)',
  lineHeight: 1.12,
  fontWeight: 850,
  letterSpacing: 0,
};

const card = {
  border: '1px solid #e1e7f0',
  borderRadius: 8,
  background: '#fff',
  padding: '18px 18px 17px',
};

const primaryLink = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  background: '#2b3d6d',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};

const secondaryLink = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  border: '1.5px solid #cbd4e2',
  color: '#2b3d6d',
  background: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
};
