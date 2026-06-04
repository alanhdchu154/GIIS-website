import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

const SCHOOL_EMAIL = 'admissions@genesisideas.school';

const REVIEW_STEPS = [
  {
    title: { en: 'Send official records', zh: '提交正式学籍记录' },
    body: {
      en: 'Upload or email transcripts, report cards, course descriptions, and any school-issued progress records from the previous school.',
      zh: '上传或邮件提交原学校成绩单、报告卡、课程说明，以及学校出具的学习进度记录。',
    },
  },
  {
    title: { en: 'Map transferable credits', zh: '对应可转学分' },
    body: {
      en: 'GIIS reviews completed coursework against its 24-credit graduation framework and identifies which credits can be accepted.',
      zh: 'GIIS 会依本校 24 学分毕业框架审核已完成课程，并判断哪些学分可被接受。',
    },
  },
  {
    title: { en: 'Confirm placement and timeline', zh: '确认年级与毕业时间' },
    body: {
      en: 'Admissions recommends the right grade placement, remaining courses, and the shortest realistic graduation path.',
      zh: '招生团队会建议合适年级、剩余课程，以及最现实的毕业路径。',
    },
  },
  {
    title: { en: 'Start with first-term validation', zh: '第一学期验证学习状态' },
    body: {
      en: 'When records are incomplete or from a very different curriculum, GIIS may use first-term performance to confirm placement.',
      zh: '若资料不完整或原课程体系差异较大，GIIS 可能用第一学期表现来确认最终 placement。',
    },
  },
];

const DOCUMENTS = [
  { en: 'Official transcript or school report for each completed high school term', zh: '每个已完成高中学期的正式成绩单或学校报告' },
  { en: 'Course descriptions or syllabi for unusual, accelerated, or non-US courses', zh: '特殊、加速或非美制课程的课程说明 / syllabus' },
  { en: 'Proof of age and student identity', zh: '年龄与学生身份证明' },
  { en: 'Current school contact, if records need verification', zh: '如需核验记录，请提供现就读学校联系方式' },
  { en: 'English translation for records not issued in English or Chinese', zh: '非英文或中文记录需提供翻译版本' },
];

const LIMITS = [
  {
    title: { en: 'We do not promise automatic credit transfer', zh: '不承诺自动转入所有学分' },
    body: {
      en: 'Credits are reviewed under GIIS policy. A previous school granting credit does not automatically mean the same credit applies to GIIS graduation.',
      zh: '学分会依 GIIS 本校政策审核。原学校授予学分，不代表一定会自动计入 GIIS 毕业要求。',
    },
  },
  {
    title: { en: 'Florida public-school transfer rules are references, not GIIS mandates', zh: 'Florida 公校转学规则是参考，不是 GIIS 强制规则' },
    body: {
      en: 'Florida private schools are responsible for their own academic credits, grades, and graduation requirements. GIIS uses that responsibility carefully and documents transfer decisions.',
      zh: 'Florida 私立学校需自行负责学分、成绩与毕业要求。GIIS 会谨慎使用这项责任，并记录转学分判断。',
    },
  },
  {
    title: { en: 'Graduation timing depends on evidence', zh: '毕业时间取决于可验证证据' },
    body: {
      en: 'Students with strong official records may finish faster. Students with gaps may need bridge courses, placement work, or additional GIIS coursework.',
      zh: '记录完整的学生可能更快完成；资料缺口较大的学生，可能需要桥接课程、placement 作业或额外 GIIS 课程。',
    },
  },
];

function InfoBlock({ item, index, isEn }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dfe5ef', borderRadius: 8, padding: '22px 20px' }}>
      <p style={{ margin: '0 0 10px', color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1 }}>
        {String(index + 1).padStart(2, '0')}
      </p>
      <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 17, fontWeight: 850 }}>
        {item.title[isEn ? 'en' : 'zh']}
      </h3>
      <p style={{ margin: 0, color: '#555', fontSize: 13, lineHeight: 1.7 }}>
        {item.body[isEn ? 'en' : 'zh']}
      </p>
    </div>
  );
}

export default function TransferStudentsPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Transfer Students' : '转学生入学'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'How GIIS reviews transfer students, maps previous credits, and builds a realistic online high school graduation plan.'
            : 'GIIS 如何审核转学生、对应既有学分，并制定现实的线上高中毕业路径。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      <section style={{ background: 'linear-gradient(135deg, #172033 0%, #2b3d6d 100%)', padding: '78px 0 70px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ margin: '0 0 14px', color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.7, textTransform: 'uppercase' }}>
            {isEn ? 'Transfer Into GIIS' : '转入 GIIS'}
          </p>
          <h1 style={{ margin: '0 0 16px', color: '#fff', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.06, fontWeight: 850, maxWidth: 780 }}>
            {isEn ? 'Bring your past credits. We will map the realistic path forward.' : '带着既有学分转入，我们帮你规划现实路径。'}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 1.75, maxWidth: 720 }}>
            {isEn
              ? 'Transfer students do not need to restart high school from zero. GIIS reviews official records, accepts appropriate credits under school policy, and builds a remaining course plan.'
              : '转学生不需要从零重读高中。GIIS 会审核正式学籍记录，依本校政策接受合适学分，并规划剩余课程。'}
          </p>
        </div>
      </section>

      <section style={{ background: '#fff', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {REVIEW_STEPS.map((step, index) => <InfoBlock key={step.title.en} item={step} index={index} isEn={isEn} />)}
          </div>
        </div>
      </section>

      <section style={{ background: '#f4f6fa', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 6%', display: 'grid', gridTemplateColumns: 'minmax(260px, 0.9fr) minmax(280px, 1.1fr)', gap: 34 }}>
          <div>
            <p style={{ color: '#2b3d6d', fontSize: 12, fontWeight: 850, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 10px' }}>
              {isEn ? 'What To Prepare' : '需要准备什么'}
            </p>
            <h2 style={{ color: '#1a1a2e', fontSize: 32, lineHeight: 1.15, fontWeight: 850, margin: '0 0 12px' }}>
              {isEn ? 'A faster review starts with stronger evidence.' : '资料越完整，审核越快。'}
            </h2>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.75, margin: 0 }}>
              {isEn
                ? 'If a record is missing, tell us early. GIIS can still advise, but final credit decisions require enough evidence to protect the official transcript.'
                : '如果资料缺失，请尽早说明。GIIS 仍可先给建议，但正式转学分判断需要足够证据，以保护成绩单可信度。'}
            </p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DOCUMENTS.map((doc) => (
              <li key={doc.en} style={{ background: '#fff', border: '1px solid #dfe5ef', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 10, color: '#333', fontSize: 14, lineHeight: 1.55 }}>
                <span style={{ color: '#2b3d6d', fontWeight: 900 }}>✓</span>
                <span>{doc[isEn ? 'en' : 'zh']}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={{ background: '#fff', padding: '64px 0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ color: '#7a3b3b', fontSize: 12, fontWeight: 850, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 10px' }}>
            {isEn ? 'Clear Limits' : '先讲清楚边界'}
          </p>
          <h2 style={{ color: '#1a1a2e', fontSize: 32, lineHeight: 1.15, fontWeight: 850, margin: '0 0 24px' }}>
            {isEn ? 'Transfer credit is a review process, not an automatic promise.' : '转学分是审核流程，不是自动承诺。'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {LIMITS.map((item) => (
              <div key={item.title.en} style={{ border: '1px solid #ead7d7', borderLeft: '4px solid #7a3b3b', borderRadius: 8, padding: '20px 18px', background: '#fffafa' }}>
                <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 16, fontWeight: 850 }}>
                  {item.title[isEn ? 'en' : 'zh']}
                </h3>
                <p style={{ margin: 0, color: '#555', lineHeight: 1.7, fontSize: 13 }}>
                  {item.body[isEn ? 'en' : 'zh']}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin: '18px 0 0', color: '#888', lineHeight: 1.65, fontSize: 12 }}>
            {isEn
              ? 'Policy basis: Florida private schools are responsible for their own educational programs, including credits, grades, and graduation requirements. GIIS documents transfer decisions to keep records defensible.'
              : '政策基础：Florida 私立学校自行负责教育项目，包括学分、成绩与毕业要求。GIIS 会记录转学分判断，让学籍资料可被解释与追溯。'}
          </p>
        </div>
      </section>

      <section style={{ background: '#172033', padding: '62px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 5%' }}>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 850, margin: '0 0 14px' }}>
            {isEn ? 'Want a transfer-credit review?' : '想先做转学分评估？'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, fontSize: 15, margin: '0 0 26px' }}>
            {isEn
              ? 'Apply first, then admissions will request records and estimate the remaining path.'
              : '先提交申请，招生团队会索取资料并估算剩余学习路径。'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/apply" style={{ padding: '13px 28px', borderRadius: 8, background: '#d5a836', color: '#1a1a2e', textDecoration: 'none', fontWeight: 850 }}>
              {isEn ? 'Request Path Review' : '申请路径评估'}
            </Link>
            <Link to="/trust-center" style={{ padding: '13px 28px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', fontWeight: 750 }}>
              {isEn ? 'Open Trust Center' : '打开信任中心'}
            </Link>
            <a href={`mailto:${SCHOOL_EMAIL}`} style={{ padding: '13px 28px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', fontWeight: 750 }}>
              {isEn ? 'Email Admissions' : '联系招生'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
