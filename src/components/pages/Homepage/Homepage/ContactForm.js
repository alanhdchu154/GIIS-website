import React, { useState } from 'react';

const PATHWAYS_EN = [
  'Not sure yet',
  'CS & Engineering',
  'Engineering Science',
  'Mathematics & Data Science',
  'Business & Marketing',
  'Economics & Finance',
  'Psychology & Behavioral Science',
  'Communications & Media',
  'Arts & Design',
];

const PATHWAYS_ZH = [
  '还不确定',
  '计算机科学',
  '工程科学',
  '数学与数据科学',
  '商业与市场营销',
  '经济与金融',
  '心理学与行为科学',
  '传播与媒体',
  '艺术与设计',
];

const CONTACT_INFO = [
  { icon: '📞', labelEn: 'Phone', labelZh: '电话', value: '+1 (813) 501-5756', href: 'tel:+18135015756' },
  { icon: '✉️', labelEn: 'Admissions Email', labelZh: '招生邮箱', value: 'admissions@genesisideas.school', href: 'mailto:admissions@genesisideas.school' },
  { icon: '💬', labelEn: 'WeChat', labelZh: '微信', value: 'Contact us for WeChat ID', hrefZh: '联系我们获取微信号' },
];

export default function ContactForm({ language = 'en' }) {
  const isEn = language === 'en';
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(() => setSubmitted(true))
      .catch(() => setSubmitted(true));
  }

  return (
    <section style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 100%)',
      padding: '80px 0',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 10%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'start' }}>

          {/* Left: info */}
          <div>
            <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
              {isEn ? 'Get Started' : '开始申请'}
            </p>
            <h2 style={{ color: '#fff', fontSize: '40px', fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px' }}>
              {isEn ? 'Request Information' : '索取招生资料'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 36px' }}>
              {isEn
                ? "Fill in the form and our admissions team will reach out within one business day. We're happy to answer questions about our pathways, schedule, tuition, and enrollment process."
                : '填写表单后，我们的招生团队将在一个工作日内与您联系。欢迎咨询路径课程、课程安排、学费及入学流程等相关问题。'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {CONTACT_INFO.map((c) => (
                <div key={c.labelEn} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{c.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {isEn ? c.labelEn : c.labelZh}
                    </p>
                    {c.href ? (
                      <a href={c.href} style={{ color: '#fff', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>{c.value}</a>
                    ) : (
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 500 }}>
                        {isEn ? c.value : c.hrefZh}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '36px', padding: '18px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: 'rgba(213,168,54,1)' }}>
                {isEn ? '🕐 Response time' : '🕐 回复时间'}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                {isEn
                  ? 'We typically respond within 24 hours on business days. For urgent inquiries, please call or email directly.'
                  : '我们通常在工作日24小时内回复。如有紧急问题，请直接致电或发送邮件。'}
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px' }}>✅</p>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 10px' }}>
                  {isEn ? "We'll be in touch!" : '我们会尽快联系您！'}
                </h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7 }}>
                  {isEn
                    ? 'Thank you for your inquiry. Our admissions team will reach out within one business day.'
                    : '感谢您的咨询，招生团队将在一个工作日内与您联系。'}
                </p>
              </div>
            ) : (
              <form
                name="contact"
                method="post"
                data-netlify="true"
                netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="form-name" value="contact" />
                <p hidden><label>Do not fill: <input name="bot-field" /></label></p>

                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 24px' }}>
                  {isEn ? 'Inquiry Form' : '咨询表单'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{isEn ? 'Student name *' : '学生姓名 *'}</label>
                    <input type="text" name="studentName" required style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Grade applying for *' : '申请年级 *'}</label>
                    <select name="grade" required style={inputStyle}>
                      <option value="">{isEn ? 'Select grade' : '选择年级'}</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Pathway interest' : '感兴趣的路径'}</label>
                    <select name="pathway" style={inputStyle}>
                      {(isEn ? PATHWAYS_EN : PATHWAYS_ZH).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Parent WeChat ID *' : '家长微信号 *'}</label>
                    <input type="text" name="parentWeChat" required style={inputStyle} placeholder="e.g. wechat_id" />
                  </div>

                  <div>
                    <label style={labelStyle}>{isEn ? 'Contact email *' : '联系邮箱 *'}</label>
                    <input type="email" name="email" required style={inputStyle} />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{isEn ? 'Message or questions' : '留言或问题'}</label>
                    <textarea
                      name="message"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder={isEn ? 'What would you like to know?' : '请告诉我们您想了解什么'}
                    />
                  </div>
                </div>

                <button type="submit" style={{
                  marginTop: '20px', width: '100%', padding: '14px',
                  background: 'rgba(43,61,109,1)', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer', transition: 'background 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(43,61,109,1)'}
                >
                  {isEn ? 'Submit Inquiry →' : '提交咨询 →'}
                </button>

                <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>
                  {isEn ? '* Required fields. We will never share your information.' : '* 必填项。我们不会共享您的个人信息。'}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#444',
  marginBottom: '5px',
  letterSpacing: '0.3px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#222',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fafafa',
};
