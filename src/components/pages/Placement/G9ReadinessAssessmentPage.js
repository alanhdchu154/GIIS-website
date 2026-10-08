import React from 'react';
import { Helmet } from 'react-helmet-async';
import './g9-readiness-assessment.css';

const PDF_PATH = '/admissions-materials/giis-grade-9-readiness-assessment.pdf';
const EMAIL = 'admissions@genesisideas.school';

const copy = {
  en: {
    eyebrow: 'Invitation-only admissions resource',
    title: 'Grade 9 Readiness Assessment',
    intro: 'This assessment helps GIIS understand a student’s current skills and plan a responsible starting point. It is not an automatic admission decision, grade placement, transfer-credit award, or transcript grade.',
    privacy: 'This page is unlisted and excluded from search indexing. Anyone who receives the link can still open it, so please do not forward it publicly.',
    heading: 'How to complete the assessment',
    steps: [
      ['Download and print', 'Download the complete PDF and print it at 100% scale. One-sided printing is recommended.'],
      ['Student writes by hand', 'The student completes each section independently and writes directly on the printed pages. Follow the calculator and timing rules in the booklet.'],
      ['Add supporting work', 'Include extra work pages, two recent independent work samples, and Khan Academy or IXL progress screenshots or links if available.'],
      ['Scan or photograph', 'Combine the finished pages into one clear PDF when possible. Clear, flat, well-lit photos are also acceptable.'],
      ['Email the school', `Send the completed work to ${EMAIL}. Use the subject “Grade 9 Readiness Assessment - Student Full Name.”`],
    ],
    download: 'Download the assessment PDF',
    email: 'Email completed assessment',
    format: 'Printable student booklet',
    time: 'About 90 minutes, in one or two sessions',
    sections: 'English, Mathematics, and Science Reasoning',
    afterTitle: 'What happens after submission',
    after: 'A GIIS reviewer evaluates the student’s work by skill area, checks the supporting evidence, and may request a short oral walkthrough. The Principal then provides a written placement decision: Ready for a conditional Grade 9 start, Ready with a named bridge plan, or Not Yet with a preparation recommendation. If information is incomplete, the case remains Pending Clarification rather than receiving an academic result.',
    help: 'Questions before you begin?',
    helpBody: `Email ${EMAIL}. Please do not send identity documents or sensitive medical information with the assessment unless GIIS specifically requests them through an approved process.`,
  },
  zh: {
    eyebrow: '仅限受邀家庭使用的招生资料',
    title: '九年级入学准备度评量',
    intro: '本评量用于帮助 GIIS 了解学生目前的能力，并制定负责任的起始学习方案。它本身不代表自动录取、最终年级定位、转学分认定或正式成绩。',
    privacy: '本页面不会出现在网站导航或搜索引擎索引中，但任何拿到网址的人仍可开启，请勿公开转发。',
    heading: '家长与学生操作步骤',
    steps: [
      ['下载并打印', '下载完整 PDF，以 100% 比例打印。建议单面打印，方便学生书写。'],
      ['学生亲笔独立完成', '学生直接在纸本上作答，并遵守考卷内的时间及计算器规定。家长可解释操作说明，但不能翻译文章、提示解法或修改答案。'],
      ['附上学习证据', '如有，请一并提供额外草稿、两份近期独立作品，以及 Khan Academy 或 IXL 进度截图或链接。'],
      ['扫描或清楚拍照', '尽量将全部页面合并为一个 PDF；若使用照片，请确保页面平整、光线充足、文字清楚且四角完整。'],
      ['寄回学校', `寄至 ${EMAIL}，邮件主旨请写“Grade 9 Readiness Assessment - 学生英文全名”。`],
    ],
    download: '下载评量 PDF',
    email: '寄送完成的评量',
    format: '可直接打印的学生作答本',
    time: '总计约 90 分钟，可分 1-2 次完成',
    sections: '英文、数学与科学推理',
    afterTitle: '寄回后会发生什么',
    after: 'GIIS 审核人员会按能力项目评分、查看补充学习证据，并可能安排一次简短口头说明。之后由校长书面决定：可有条件开始九年级、九年级加指定衔接方案，或目前尚未准备好并提供准备建议。若资料不完整，个案会列为待补充资料，而不会被判定为学术未达标。',
    help: '开始前有问题？',
    helpBody: `请联系 ${EMAIL}。除非 GIIS 通过核准流程另行要求，请勿把身份证件或敏感医疗资料与考卷一起寄送。`,
  },
};

function G9ReadinessAssessmentPage({ language }) {
  const isZh = language === 'zh';
  const t = isZh ? copy.zh : copy.en;

  return (
    <>
      <Helmet>
        <title>{t.title} | GIIS</title>
        <meta name="description" content={t.intro} />
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Helmet>

      <div className="g9-assessment-page">
        <header className="g9-assessment-hero">
          <div className="g9-assessment-shell">
            <p className="g9-assessment-eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="g9-assessment-intro">{t.intro}</p>
            <div className="g9-assessment-actions">
              <a className="g9-button g9-button-primary" href={PDF_PATH} download>
                {t.download}
              </a>
              <a className="g9-button g9-button-secondary" href={`mailto:${EMAIL}?subject=Grade%209%20Readiness%20Assessment`}>
                {t.email}
              </a>
            </div>
            <p className="g9-assessment-privacy">{t.privacy}</p>
          </div>
        </header>

        <main className="g9-assessment-shell g9-assessment-main">
          <section className="g9-assessment-facts" aria-label="Assessment overview">
            <div><span>01</span><strong>{t.format}</strong></div>
            <div><span>02</span><strong>{t.time}</strong></div>
            <div><span>03</span><strong>{t.sections}</strong></div>
          </section>

          <section className="g9-assessment-card">
            <p className="g9-assessment-section-label">01 / Instructions</p>
            <h2>{t.heading}</h2>
            <ol className="g9-assessment-steps">
              {t.steps.map(([title, body]) => (
                <li key={title}>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="g9-assessment-card g9-assessment-result">
            <p className="g9-assessment-section-label">02 / Review</p>
            <h2>{t.afterTitle}</h2>
            <p>{t.after}</p>
          </section>

          <section className="g9-assessment-help">
            <div>
              <p className="g9-assessment-section-label">03 / Contact</p>
              <h2>{t.help}</h2>
              <p>{t.helpBody}</p>
            </div>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </section>
        </main>
      </div>
    </>
  );
}

export default G9ReadinessAssessmentPage;
