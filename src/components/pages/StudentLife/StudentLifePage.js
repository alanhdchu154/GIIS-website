import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

/**
 * StudentLifePage — "A week as a GIIS student", written to the prospective
 * student (teenager) rather than only the parent.
 *
 * The buyer is the parent, but the daily user is the student. A teenager who
 * refuses to engage becomes churn, and parents weighing the decision quietly
 * ask: "will my kid actually use this?" This page answers that in the student's
 * own voice while staying honest about the self-discipline self-paced learning
 * requires — which also reassures the parent. It deliberately routes back into
 * the existing conversion flow (Lesson Library, Parent Demo, Pricing, Apply).
 */

const DAY_BLOCKS = [
  {
    time: { en: 'Morning, your schedule', zh: '早上，由你安排' },
    title: { en: 'Start when you focus best', zh: '在你最专注的时间开始' },
    body: {
      en: 'There is no 8 a.m. bell. You open the Learn Portal, see your courses and where you left off, and pick the block you want to work on first.',
      zh: '没有早上 8 点的铃声。你打开 Learn 学习平台，看到自己的课程和上次的进度，自己决定先做哪一块。',
    },
  },
  {
    time: { en: 'A learning block', zh: '一个学习时段' },
    title: { en: 'Watch, read, then practice', zh: '看、读，然后练习' },
    body: {
      en: 'Each module gives you a short lesson video, a reading, and practice. You go at your pace — rewind the video, re-read, and try the practice until it clicks.',
      zh: '每个模块都有一段课程视频、阅读材料和练习。节奏由你掌握——视频可以倒回、材料可以重读、练习可以反复做到真正弄懂。',
    },
  },
  {
    time: { en: 'Show your work', zh: '提交你的成果' },
    title: { en: 'Submit an assignment', zh: '完成一份作业' },
    body: {
      en: 'You submit real work that a teacher reviews — not just clicking "next". That work becomes the evidence behind your grade and your transcript.',
      zh: '你提交的是会被老师批改的真实作业，而不是一直点「下一步」。这些作业就是你成绩和成绩单背后的证据。',
    },
  },
  {
    time: { en: 'Check yourself', zh: '检验自己' },
    title: { en: 'Quizzes, midterm, final', zh: '小测、期中、期末' },
    body: {
      en: 'Quizzes after units, then a midterm and final per course. You see your score and can review what you missed, so a grade is something you understand, not a surprise.',
      zh: '每个单元后有小测，每门课有期中和期末。你能看到分数，也能复习错在哪里——成绩是你看得懂的，而不是突然冒出来的。',
    },
  },
];

const SUPPORT = [
  {
    title: { en: 'You are not learning alone', zh: '你不是一个人在学' },
    body: {
      en: 'On the Guided plan you get a monthly check-in with an advisor who looks at your pacing and course plan. Premium adds higher-touch pathway and college-readiness guidance.',
      zh: '选择 Guided 方案时，你每月会有一次顾问沟通，看你的进度和选课规划；Premium 方案则提供更深入的路径与升学准备指导。',
    },
  },
  {
    title: { en: 'Your parents see progress, not your every click', zh: '家长看到的是进度，不是你的每一次点击' },
    body: {
      en: 'Parents get a weekly summary — modules done, study time, pacing. It keeps them reassured without hovering, and advisor notes shared with them are reviewed first.',
      zh: '家长每周会收到一份摘要——完成的模块、学习时长、进度情况。这让他们安心，又不会一直盯着你；分享给家长的顾问留言也会先经过审核。',
    },
  },
  {
    title: { en: 'Your record is real and yours', zh: '你的学籍记录是真实、且属于你的' },
    body: {
      en: 'GIIS is a Florida-registered private school. Your coursework builds an official transcript on a 24-credit framework toward a real high school diploma.',
      zh: 'GIIS 是 Florida 注册的私立学校。你的课程会按 24 学分框架累积成正式成绩单，指向真实的高中文凭。',
    },
  },
];

const HONEST = [
  {
    en: 'Self-paced means you set the pace — it rewards students who can build a weekly habit.',
    zh: '自主进度意味着节奏由你掌握——它最适合能建立每周学习习惯的学生。',
  },
  {
    en: 'You need reliable internet and a quiet place where you can actually focus.',
    zh: '你需要稳定的网络，和一个能真正专注的安静空间。',
  },
  {
    en: 'Lesson videos and advisor communication are in English; reading along in English is part of the experience.',
    zh: '课程视频和与顾问的沟通以英文为主；用英文跟着学习本身就是体验的一部分。',
  },
];

function DayCard({ item, index, isEn }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dfe5ef', borderRadius: 10, padding: '24px 22px' }}>
      <p style={{ margin: '0 0 6px', color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1 }}>
        {String(index + 1).padStart(2, '0')} · {item.time[isEn ? 'en' : 'zh']}
      </p>
      <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 18, fontWeight: 850 }}>
        {item.title[isEn ? 'en' : 'zh']}
      </h3>
      <p style={{ margin: 0, color: '#555', fontSize: 13.5, lineHeight: 1.7 }}>
        {item.body[isEn ? 'en' : 'zh']}
      </p>
    </div>
  );
}

export default function StudentLifePage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'A Week as a GIIS Student' : '你在 GIIS 的一周'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'What a real week of online high school at GIIS looks like for a student: self-paced lessons, real assignments, quizzes and exams, advisor support, and an official transcript.'
            : 'GIIS 在线高中学生真实的一周长怎样：自主进度的课程、真实作业、小测与考试、顾问支持，以及正式成绩单。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero — student voice */}
      <section style={{ background: 'linear-gradient(135deg, #172033 0%, #2b3d6d 100%)', padding: '78px 0 70px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ margin: '0 0 14px', color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.7, textTransform: 'uppercase' }}>
            {isEn ? 'For Students' : '写给学生'}
          </p>
          <h1 style={{ margin: '0 0 16px', color: '#fff', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.06, fontWeight: 850, maxWidth: 800 }}>
            {isEn ? 'What a real week at GIIS actually looks like.' : '你在 GIIS 的一周，真实长这样。'}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 1.75, maxWidth: 720 }}>
            {isEn
              ? "No 8 a.m. bell, no busywork. You decide when you learn, do real coursework a teacher reviews, and build an official transcript — with people checking in on you along the way."
              : '没有早八的铃声，没有无意义的杂活。你决定何时学习，完成会被老师批改的真实作业，累积正式成绩单——而且一路上有人关心你的进度。'}
          </p>
        </div>
      </section>

      {/* A day in the life */}
      <section style={{ background: '#fff', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ color: '#2b3d6d', fontSize: 12, fontWeight: 850, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'A Day, Your Way' : '一天，由你安排' }
          </p>
          <h2 style={{ color: '#1a1a2e', fontSize: 32, lineHeight: 1.15, fontWeight: 850, margin: '0 0 24px' }}>
            {isEn ? 'How a learning day flows' : '一天的学习是怎么流动的'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {DAY_BLOCKS.map((block, index) => <DayCard key={block.title.en} item={block} index={index} isEn={isEn} />)}
          </div>
        </div>
      </section>

      {/* Support / not alone */}
      <section style={{ background: '#f4f6fa', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ color: '#2b3d6d', fontSize: 12, fontWeight: 850, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Independent, Not Isolated' : '独立，但不孤单'}
          </p>
          <h2 style={{ color: '#1a1a2e', fontSize: 32, lineHeight: 1.15, fontWeight: 850, margin: '0 0 24px' }}>
            {isEn ? 'Self-paced does not mean on your own' : '自主进度，不等于孤军奋战'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {SUPPORT.map((item) => (
              <div key={item.title.en} style={{ background: '#fff', border: '1px solid #dfe5ef', borderRadius: 10, padding: '22px 20px' }}>
                <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 16, fontWeight: 850 }}>
                  {item.title[isEn ? 'en' : 'zh']}
                </h3>
                <p style={{ margin: 0, color: '#555', lineHeight: 1.7, fontSize: 13.5 }}>
                  {item.body[isEn ? 'en' : 'zh']}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* See it before you apply */}
      <section style={{ background: '#fff', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ color: '#2b3d6d', fontSize: 12, fontWeight: 850, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? "Don't Take Our Word For It" : '不用只听我们说'}
          </p>
          <h2 style={{ color: '#1a1a2e', fontSize: 32, lineHeight: 1.15, fontWeight: 850, margin: '0 0 24px' }}>
            {isEn ? 'Try the real thing before you apply' : '申请前，先体验真实的内容'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Link to="/lessons" style={{ display: 'block', textDecoration: 'none', background: '#f4f6fa', border: '1px solid #dfe5ef', borderRadius: 10, padding: '22px 20px' }}>
              <h3 style={{ margin: '0 0 8px', color: '#2b3d6d', fontSize: 16, fontWeight: 850 }}>
                {isEn ? 'Watch real lessons →' : '观看真实课程 →'}
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.65, fontSize: 13.5 }}>
                {isEn
                  ? 'Open the Lesson Library and play actual foundation lessons — the same videos enrolled students watch.'
                  : '打开课程库，播放真实的基础课程视频——和在读学生看到的是同一批。'}
              </p>
            </Link>
            <Link to="/parent/demo" style={{ display: 'block', textDecoration: 'none', background: '#f4f6fa', border: '1px solid #dfe5ef', borderRadius: 10, padding: '22px 20px' }}>
              <h3 style={{ margin: '0 0 8px', color: '#2b3d6d', fontSize: 16, fontWeight: 850 }}>
                {isEn ? 'See what your parents see →' : '看看家长会看到什么 →'}
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.65, fontSize: 13.5 }}>
                {isEn
                  ? 'Preview the parent dashboard — the weekly progress your family actually receives.'
                  : '预览家长面板——你的家人每周真正会收到的进度内容。'}
              </p>
            </Link>
            <Link to="/pathways" style={{ display: 'block', textDecoration: 'none', background: '#f4f6fa', border: '1px solid #dfe5ef', borderRadius: 10, padding: '22px 20px' }}>
              <h3 style={{ margin: '0 0 8px', color: '#2b3d6d', fontSize: 16, fontWeight: 850 }}>
                {isEn ? 'Find your pathway →' : '找到你的方向 →'}
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.65, fontSize: 13.5 }}>
                {isEn
                  ? 'Explore subject pathways — from computer science to arts & design — and see where courses can lead.'
                  : '探索学科路径——从计算机科学到艺术设计——看看课程能带你走向哪里。'}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Honest expectations */}
      <section style={{ background: '#fffafa', padding: '56px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ color: '#7a3b3b', fontSize: 12, fontWeight: 850, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Real Talk' : '说点实在的'}
          </p>
          <h2 style={{ color: '#1a1a2e', fontSize: 28, lineHeight: 1.18, fontWeight: 850, margin: '0 0 20px' }}>
            {isEn ? 'What this actually asks of you' : '这对你的真实要求'}
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HONEST.map((item) => (
              <li key={item.en} style={{ display: 'flex', gap: 10, color: '#3a4250', fontSize: 14, lineHeight: 1.65, alignItems: 'flex-start' }}>
                <span style={{ color: '#7a3b3b', fontWeight: 900, flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{item[isEn ? 'en' : 'zh']}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#172033', padding: '62px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 850, margin: '0 0 14px' }}>
            {isEn ? 'Ready to make this your week?' : '准备好让这成为你的一周了吗？'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, fontSize: 15, margin: '0 0 26px' }}>
            {isEn
              ? 'Talk it through with your family, check the plans, and apply when it feels right.'
              : '和家人聊一聊，看看各个方案，觉得合适就提交申请。'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/apply" style={{ padding: '13px 28px', borderRadius: 8, background: '#d5a836', color: '#1a1a2e', textDecoration: 'none', fontWeight: 850 }}>
              {isEn ? 'Apply Now' : '立即申请'}
            </Link>
            <Link to="/pricing" style={{ padding: '13px 28px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', fontWeight: 750 }}>
              {isEn ? 'See plans & pricing' : '查看方案与价格'}
            </Link>
            <Link to="/lessons" style={{ padding: '13px 28px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', fontWeight: 750 }}>
              {isEn ? 'Browse lessons' : '浏览课程'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
