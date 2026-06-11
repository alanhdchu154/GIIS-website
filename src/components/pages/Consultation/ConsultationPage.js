import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

const NAVY = '#1a1a2e';
const GOLD = '#d5a836';

const COVERS = [
  {
    en: 'Whether GIIS actually fits your child — grade placement, pathway, and pacing.',
    zh: '判断 GIIS 是否真的适合您的孩子——年级定位、学习路径与节奏。',
  },
  {
    en: 'Transfer credits: what can count toward the 24-credit graduation framework.',
    zh: '转学分评估：既有学分如何对应 24 学分毕业框架。',
  },
  {
    en: 'Which plan makes sense — self-paced, guided, or college pathway support.',
    zh: '哪个方案合适——自主学习、顾问指导，还是升学路径支持。',
  },
  {
    en: 'What you will see as a parent after enrollment: dashboard, weekly summaries, advisor notes.',
    zh: '入学后家长能看到什么：家长面板、每周摘要、顾问留言。',
  },
];

const GRADES = ['9', '10', '11', '12'];

const TIMES = [
  { v: 'weekday-day', en: 'Weekday daytime (US Eastern)', zh: '工作日白天（美东时间）' },
  { v: 'weekday-evening', en: 'Weekday evening (US Eastern)', zh: '工作日晚上（美东时间）' },
  { v: 'asia-morning', en: 'Morning in Asia time zones', zh: '亚洲时区的上午' },
  { v: 'asia-evening', en: 'Evening in Asia time zones', zh: '亚洲时区的晚上' },
];

const SITUATIONS = [
  { v: 'transfer', en: 'Transfer student', zh: '转学生' },
  { v: 'new-high-school', en: 'Starting high school with GIIS', zh: '从 GIIS 开始高中' },
  { v: 'credit-recovery', en: 'Needs credit recovery / catch-up', zh: '需要补学分 / 赶进度' },
  { v: 'exploring', en: 'Still exploring options', zh: '仍在了解选择' },
];

const TRANSCRIPT_OPTIONS = [
  { v: 'yes', en: 'Yes, we can share a transcript/report card', zh: '有，可以提供成绩单/成绩报告' },
  { v: 'partial', en: 'Partial records only', zh: '只有部分记录' },
  { v: 'no', en: 'Not yet', zh: '暂时没有' },
];

const START_WINDOWS = [
  { v: 'asap', en: 'As soon as possible', zh: '越快越好' },
  { v: 'this-month', en: 'This month', zh: '本月' },
  { v: 'next-semester', en: 'Next semester', zh: '下学期' },
  { v: 'planning-ahead', en: 'Planning ahead', zh: '提前规划' },
];

function ConsultationPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    setIsSubmitting(true);
    setSubmitError('');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Netlify form submit failed: ${response.status}`);
        setSubmitted(true);
      })
      .catch(() => {
        setSubmitError(isEn
          ? 'We could not submit the form just now. Please try again, or email admissions@genesisideas.school directly.'
          : '刚刚未能成功提交表单。请再试一次，或直接发送邮件至 admissions@genesisideas.school。');
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Book a Consultation' : '预约咨询'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Talk with GIIS before you pay. Book a free consultation with President & Principal Shiyu Zhang, Ph.D. about fit, transfer credits, plans, and parent visibility.'
            : '付款前先和学校谈一谈。免费预约与校长章诗雨博士的咨询，了解孩子是否适合、转学分、方案选择与家长可见度。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      {/* Hero */}
      <section style={{ background: '#10182a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 6% 52px' }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
            {isEn ? 'Before You Pay' : '付款前先聊聊'}
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.08, fontWeight: 850, margin: '0 0 16px', maxWidth: 760 }}>
            {isEn ? 'Talk to the school before you decide.' : '决定之前，先和学校谈一谈。'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 1.75, margin: 0, maxWidth: 640 }}>
            {isEn
              ? 'A free, no-pressure conversation about whether GIIS fits your child. We will tell you honestly if it does not.'
              : '一次免费、没有推销压力的对话，聊聊 GIIS 是否适合您的孩子。如果不适合，我们会诚实告诉您。'}
          </p>
        </div>
      </section>

      <section style={{ background: '#f7f8fb', fontFamily: 'Inter, sans-serif', padding: '56px 0 72px' }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto', padding: '0 6%',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start',
        }}>

          {/* Left: who you talk to + what it covers */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%', background: NAVY, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 850, flexShrink: 0, letterSpacing: 1,
              }}>
                SZ
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 850, color: NAVY }}>
                  {isEn ? 'Shiyu Zhang, Ph.D.' : '章诗雨 博士'}
                </h2>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#8a6d1f' }}>
                  {isEn ? 'President & Principal' : '校长 (President & Principal)'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 14.5, lineHeight: 1.8, color: '#3a3f4c', margin: '0 0 12px' }}>
              {isEn
                ? 'Dr. Zhang serves as President & Principal of GIIS and signs all official transcripts and diplomas issued by the school. She holds a Ph.D. from Purdue University and has over ten years of experience in bilingual education and international university application advising.'
                : '章博士担任 GIIS 校长，所有正式成绩单与文凭均由其签署。她拥有普渡大学博士学位，在双语教育与国际大学升学辅导方面有十年以上经验。'}
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.8, color: '#3a3f4c', margin: '0 0 26px' }}>
              {isEn
                ? 'Consultations are conducted in English or Chinese, whichever is more comfortable for your family.'
                : '咨询可用中文或英文进行，以您的家庭沟通最舒服的语言为准。'}
            </p>

            <h3 style={{ fontSize: 15, fontWeight: 850, color: NAVY, margin: '0 0 12px' }}>
              {isEn ? 'What a consultation covers' : '咨询会聊什么'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {COVERS.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: GOLD, fontWeight: 850, fontSize: 14, lineHeight: '22px' }}>✓</span>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#3a3f4c' }}>{isEn ? c.en : c.zh}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 10, background: '#fff', border: '1px solid #e6e8ee' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: NAVY }}>
                {isEn ? 'Prefer to reach us directly?' : '想直接联系我们？'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 13.5, color: '#3a3f4c' }}>
                ✉️ <a href="mailto:admissions@genesisideas.school" style={{ color: NAVY, fontWeight: 600 }}>admissions@genesisideas.school</a>
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 13.5, color: '#3a3f4c' }}>
                📞 <a href="tel:+18135015756" style={{ color: NAVY, fontWeight: 600 }}>+1 (813) 501-5756</a>
              </p>
              <p style={{ margin: 0, fontSize: 13.5, color: '#3a3f4c' }}>
                💬 {isEn ? 'WeChat available — mention it in the form and we will share the ID.' : '可加微信——在表单中注明，我们会提供微信号。'}
              </p>
            </div>
          </div>

          {/* Right: booking form */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '34px 30px', boxShadow: '0 16px 50px rgba(16,24,42,0.10)', border: '1px solid #e6e8ee' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '46px 0' }}>
                <p style={{ fontSize: 46, margin: '0 0 14px' }}>✅</p>
                <h3 style={{ fontSize: 21, fontWeight: 850, color: NAVY, margin: '0 0 10px' }}>
                  {isEn ? 'Request received' : '已收到您的预约'}
                </h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 22px' }}>
                  {isEn
                    ? 'We will reach out within one business day to confirm a time. While you wait, you can inspect the school yourself:'
                    : '我们会在一个工作日内与您联系并确认时间。等待期间，您可以先自行检查这所学校：'}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/trust-center" style={smallBtn}>{isEn ? 'Trust Center' : '信任中心'}</Link>
                  <Link to="/lessons" style={smallBtn}>{isEn ? 'Lesson Library' : '课程影片库'}</Link>
                  <Link to="/parent/demo" style={smallBtn}>{isEn ? 'Parent dashboard preview' : '家长面板预览'}</Link>
                </div>
              </div>
            ) : (
              <form
                name="consultation"
                method="post"
                data-netlify="true"
                netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="form-name" value="consultation" />
                <p hidden><label>Do not fill: <input name="bot-field" /></label></p>

                <h3 style={{ fontSize: 20, fontWeight: 850, color: NAVY, margin: '0 0 6px' }}>
                  {isEn ? 'Book a free consultation' : '预约免费咨询'}
                </h3>
                <p style={{ fontSize: 13, color: '#777', margin: '0 0 22px', lineHeight: 1.6 }}>
                  {isEn ? 'About 15–20 minutes. No payment required, no obligation.' : '约 15–20 分钟。无需付款，没有任何义务。'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{isEn ? 'Parent name *' : '家长姓名 *'}</label>
                    <input type="text" name="parentName" required style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Contact email *' : '联系邮箱 *'}</label>
                    <input type="email" name="email" required style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Parent WeChat ID' : '家长微信号'}</label>
                    <input type="text" name="parentWeChat" style={inputStyle} placeholder={isEn ? 'optional' : '选填'} />
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? "Student's grade *" : '学生年级 *'}</label>
                    <select name="studentGrade" required style={inputStyle}>
                      <option value="">{isEn ? 'Select grade' : '选择年级'}</option>
                      {GRADES.map((g) => <option key={g} value={g}>{isEn ? `Grade ${g}` : `${g} 年级`}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Student situation *' : '学生情况 *'}</label>
                    <select name="studentSituation" required style={inputStyle}>
                      <option value="">{isEn ? 'Select situation' : '选择情况'}</option>
                      {SITUATIONS.map((s) => <option key={s.v} value={s.v}>{isEn ? s.en : s.zh}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Transcript available? *' : '是否有成绩单？*'}</label>
                    <select name="transcriptAvailable" required style={inputStyle}>
                      <option value="">{isEn ? 'Select one' : '请选择'}</option>
                      {TRANSCRIPT_OPTIONS.map((o) => <option key={o.v} value={o.v}>{isEn ? o.en : o.zh}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Desired start timing *' : '希望何时开始 *'}</label>
                    <select name="desiredStart" required style={inputStyle}>
                      <option value="">{isEn ? 'Select timing' : '选择时间'}</option>
                      {START_WINDOWS.map((w) => <option key={w.v} value={w.v}>{isEn ? w.en : w.zh}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Preferred time *' : '方便的时间 *'}</label>
                    <select name="preferredTime" required style={inputStyle}>
                      <option value="">{isEn ? 'Select a window' : '选择时间段'}</option>
                      {TIMES.map((t) => <option key={t.v} value={t.v}>{isEn ? t.en : t.zh}</option>)}
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{isEn ? 'What would you like to discuss?' : '您想聊什么？'}</label>
                    <textarea
                      name="message"
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder={isEn
                        ? 'e.g. transferring from another school, credits, which plan fits, college planning…'
                        : '例如：从其他学校转入、学分认定、哪个方案合适、升学规划……'}
                    />
                  </div>
                </div>

                {submitError ? (
                  <div role="alert" style={{
                    marginTop: 18,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#fff4f2',
                    border: '1px solid #f1c3bb',
                    color: '#8a2d20',
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontWeight: 650,
                  }}>
                    {submitError}
                  </div>
                ) : null}

                <button type="submit" disabled={isSubmitting} style={{
                  marginTop: 20, width: '100%', padding: 14,
                  background: isSubmitting ? '#5f6678' : NAVY, color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 800,
                  cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif',
                }}>
                  {isSubmitting
                    ? (isEn ? 'Submitting request...' : '正在提交...')
                    : (isEn ? 'Request consultation →' : '提交预约 →')}
                </button>

                <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>
                  {isEn
                    ? '* Required fields. We respond within one business day and never share your information.'
                    : '* 必填项。我们会在一个工作日内回复，且不会共享您的个人信息。'}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#444',
  marginBottom: 5,
  letterSpacing: '0.3px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 14,
  color: '#222',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fafafa',
};

const smallBtn = {
  display: 'inline-block',
  padding: '9px 16px',
  borderRadius: 8,
  border: `1.5px solid ${NAVY}`,
  color: NAVY,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 800,
};

export default ConsultationPage;
