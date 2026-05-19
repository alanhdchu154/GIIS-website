import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav';

/*
 * /handbook — Student & Family Handbook
 *
 * Purpose: complete academic and conduct policy document for GIIS, drafted to
 * satisfy CEEB / Florida DOE auditor review. Mirrors the standard structure
 * of a US private high school handbook.
 *
 * Authority: this handbook is published under the authority of the Head of
 * School (Alan Hwader Chu) and the President & Principal (Shiyu Zhang,
 * Ph.D.). Any policy change must be reflected here within one school day.
 *
 * IMPORTANT — for Alan to review before sharing externally:
 *   - Section 4 (Assessment & Proctoring) describes the webcam proctoring
 *     model that is PLANNED (Sprint 5, backlog T-501-503). I wrote it in
 *     present tense for the policy framing, but verify that's accurate to
 *     ship today, or change to forward-looking language.
 *   - Section 9 (Appeals) lists Alan + Shiyu as the appeals panel — confirm
 *     that division of labor.
 *   - Section 7 (AI Use) — Alan is the AI lead; this is the area where the
 *     policy should reflect your actual stance. I drafted a balanced one
 *     (AI as research aid, not for assessments) but adjust.
 */

const NAVY = '#1a2d5a';
const GOLD = '#b8962e';
const CREAM = '#faf6ed';
const INK = '#222';
const MUTED = '#5b6479';

const SECTIONS = [
  { id: 'about', en: '1. About GIIS', zh: '1. 关于 GIIS' },
  { id: 'academic', en: '2. Academic Program', zh: '2. 学术课程' },
  { id: 'graduation', en: '3. Graduation Requirements', zh: '3. 毕业要求' },
  { id: 'assessment', en: '4. Assessment & Proctoring', zh: '4. 评量与监考' },
  { id: 'integrity', en: '5. Academic Integrity', zh: '5. 学术诚信' },
  { id: 'attendance', en: '6. Attendance & Engagement', zh: '6. 出勤与参与' },
  { id: 'ai', en: '7. AI & Technology Use', zh: '7. AI 与科技使用' },
  { id: 'conduct', en: '8. Conduct & Community', zh: '8. 行为与社群规范' },
  { id: 'appeals', en: '9. Appeals & Grievances', zh: '9. 申诉与陈情' },
  { id: 'records', en: '10. Records, Transcripts & Diplomas', zh: '10. 档案、成绩单与文凭' },
  { id: 'privacy', en: '11. Privacy & FERPA', zh: '11. 隐私与 FERPA' },
  { id: 'authority', en: '12. Governance & Authority', zh: '12. 治理与授权' },
];

const t = (en, zh, language) => (language === 'zh' ? zh : en);

function SectionHeading({ id, en, zh, language }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: 26,
        color: NAVY,
        fontFamily: "'Georgia', serif",
        fontWeight: 700,
        marginTop: 56,
        marginBottom: 4,
        scrollMarginTop: 24,
        paddingBottom: 8,
        borderBottom: `2px solid ${GOLD}`,
      }}
    >
      {t(en, zh, language)}
    </h2>
  );
}

function P({ children }) {
  return (
    <p style={{ fontSize: 15.5, lineHeight: 1.8, color: INK, marginTop: 14 }}>{children}</p>
  );
}

function UL({ children }) {
  return (
    <ul style={{ fontSize: 15.5, lineHeight: 1.85, color: INK, marginTop: 14, paddingLeft: 22 }}>
      {children}
    </ul>
  );
}

function Quote({ children }) {
  return (
    <div style={{
      borderLeft: `4px solid ${GOLD}`,
      background: '#fff',
      padding: '16px 22px',
      margin: '18px 0',
      borderRadius: 6,
      fontSize: 14.5,
      lineHeight: 1.75,
      color: INK,
      boxShadow: '0 2px 8px rgba(26,45,90,0.06)',
    }}>
      {children}
    </div>
  );
}

function Section({ id, children }) {
  return <section id={id} style={{ scrollMarginTop: 24 }}>{children}</section>;
}

function TOC({ language }) {
  return (
    <nav
      aria-label={t('Table of contents', '目录', language)}
      style={{
        background: '#fff',
        border: '1px solid #e7e2d4',
        borderRadius: 12,
        padding: '22px 26px',
        marginBottom: 32,
        boxShadow: '0 4px 12px rgba(26,45,90,0.05)',
      }}
    >
      <div style={{
        fontSize: 11, fontWeight: 700, color: GOLD,
        letterSpacing: '1.6px', textTransform: 'uppercase', marginBottom: 14,
      }}>
        {t('Table of Contents', '目录', language)}
      </div>
      <ol style={{
        margin: 0, padding: 0, listStyle: 'none',
        columns: 2, columnGap: 28,
      }}>
        {SECTIONS.map((s) => (
          <li key={s.id} style={{ marginBottom: 8, breakInside: 'avoid' }}>
            <a
              href={`#${s.id}`}
              style={{ color: NAVY, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
            >
              {t(s.en, s.zh, language)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Hero({ language }) {
  const en = language !== 'zh';
  return (
    <section style={{
      background: `linear-gradient(135deg, ${NAVY} 0%, #283d6e 100%)`,
      color: '#fff',
      padding: '64px 8% 48px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          color: GOLD, letterSpacing: '2px', textTransform: 'uppercase',
          border: `1px solid ${GOLD}`, borderRadius: 4, padding: '4px 11px',
          marginBottom: 18,
        }}>
          {en ? 'Official Policy Document' : '正式政策文件'}
        </div>
        <h1 style={{
          margin: 0, fontSize: 38, lineHeight: 1.2, fontFamily: "'Georgia', serif", fontWeight: 700,
        }}>
          {en ? 'Student & Family Handbook' : '学生与家庭手册'}
        </h1>
        <p style={{ marginTop: 14, fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
          {en
            ? 'Genesis of Ideas International School · Academic year 2025–2026 · Published under the authority of the Head of School and the President & Principal.'
            : '艾迪尔国际学校 · 2025–2026 学年 · 由校务长（Head of School）及校长（President & Principal）共同授权发布。'}
        </p>
        <div style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {en
            ? 'Last revised: May 2026 · This handbook supersedes any prior policy circulated by GIIS.'
            : '最近修订：2026 年 5 月 · 本手册取代此前 GIIS 发布之任何政策。'}
        </div>
      </div>
    </section>
  );
}

export default function HandbookPage({ language, toggleLanguage }) {
  const en = language !== 'zh';

  return (
    <>
      <Nav language={language} toggleLanguage={toggleLanguage} />
      <Helmet>
        <title>{en
          ? 'Student & Family Handbook | Genesis of Ideas International School'
          : '学生与家庭手册 | 艾迪尔国际学校'}</title>
        <meta name="description" content={en
          ? 'Official Student & Family Handbook of Genesis of Ideas International School — academic policies, integrity, attendance, appeals, and governance.'
          : '艾迪尔国际学校 (GIIS) 正式《学生与家庭手册》— 涵盖学术政策、诚信、出勤、申诉与治理结构。'} />
      </Helmet>

      <Hero language={language} />

      <main style={{
        background: CREAM, padding: '40px 8% 80px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          <TOC language={language} />

          {/* §1 About */}
          <Section id="about">
            <SectionHeading {...SECTIONS[0]} language={language} />
            <P>{en
              ? "Genesis of Ideas International School (GIIS) is an independent private school registered with the Florida Department of Education under Florida Statute 1002.42. Founded in 2022 and formally registered in 2024, GIIS operates as a fully online, asynchronous secondary school serving students worldwide in Grades 9 through 12."
              : '艾迪尔国际学校（Genesis of Ideas International School, 简称 GIIS）依据 Florida Statute 1002.42 在 Florida Department of Education 注册为独立私立学校。学校于 2022 年创办、2024 年完成正式注册，以异步线上模式运营，面向全球招收 9–12 年级学生。'}</P>
            <P>{en
              ? "Our mission is to deliver a college-preparatory secondary education that emphasizes academic rigor, individual mentorship, and the development of critical thinking, scientific literacy, and international citizenship. The school is currently in the process of pursuing regional accreditation. A CEEB code application has been submitted to the College Board."
              : '本校宗旨是提供严谨、个性化的大学预备教育，培养学生的批判性思维、科学素养与国际视野。目前正在申请区域认证（regional accreditation），并已向 College Board 提交 CEEB 申请。'}</P>
            <Quote>{en
              ? <><strong>Accreditation note.</strong> GIIS is not currently accredited by Cognia, MSA, WASC, NEASC, or any other regional accreditor. The school is, however, lawfully registered as a private school with the Florida Department of Education, and operates under Florida Statute 1002.42, which entitles it to issue secondary transcripts and diplomas.</>
              : <><strong>认证说明。</strong>GIIS 目前未经过 Cognia、MSA、WASC、NEASC 等区域认证机构认证；但已依据 Florida Statute 1002.42 在 Florida 教育厅完成私立学校注册，依法具备颁发高中成绩单与文凭之资格。</>}</Quote>
          </Section>

          {/* §2 Academic Program */}
          <Section id="academic">
            <SectionHeading {...SECTIONS[1]} language={language} />
            <P>{en
              ? "The GIIS academic program is delivered through the GIIS Learn Portal, a proprietary online learning environment. Each course consists of 14 instructional modules with embedded quizzes, a midterm examination (15 questions), and a final examination (20 questions). Each course earns 1.0 credit when delivered as a full-year course, and 0.5 credit when delivered as a single-semester course. All instruction and assessment are conducted in English."
              : 'GIIS 学术课程通过自建的 GIIS Learn Portal 在线平台进行。每门课程包含 14 个教学模块（含课中 quiz）、1 次期中考（15 题）与 1 次期末考（20 题）。整学年课程获 1.0 学分，单学期课程获 0.5 学分。所有教学与评量均以英文进行。'}</P>
            <P><strong>{en ? 'Grading scale (unweighted, 4.0 system):' : '成绩等第对应（未加权，4.0 制）：'}</strong></P>
            <UL>
              <li>A+ / A (93–100): 4.0 GPA</li>
              <li>A− (90–92): 3.7 GPA</li>
              <li>B+ (87–89): 3.3 · B (83–86): 3.0 · B− (80–82): 2.7</li>
              <li>C+ (77–79): 2.3 · C (73–76): 2.0 · C− (70–72): 1.7</li>
              <li>D+ (67–69): 1.3 · D (63–66): 1.0 · D− (60–62): 0.7</li>
              <li>F (0–59): 0.0 · {en ? 'no credit awarded' : '不计学分'}</li>
            </UL>
            <P>{en
              ? <>Credit is awarded only upon satisfactory completion of all modules, the midterm, and the final exam, with an overall course grade of 60% (D−) or higher. The GPA is calculated on an unweighted 4.0 scale at this time; weighting for Honors and Advanced coursework will be introduced once external course audits (where applicable) are complete.</>
              : <>仅当学生完成全部模块、期中与期末考、且总成绩达 60%（D−）以上方可获得学分。目前 GPA 采用未加权 4.0 制；待 Honors 与 Advanced 课程之外部审核完成后，将引入加权计算方式。</>}</P>
          </Section>

          {/* §3 Graduation */}
          <Section id="graduation">
            <SectionHeading {...SECTIONS[2]} language={language} />
            <P>{en
              ? 'Students must earn a minimum of 24 credits to qualify for the GIIS High School Diploma. The credit distribution is:'
              : '获得 GIIS 高中文凭需累计至少 24 个学分，分配如下：'}</P>
            <UL>
              <li>{en ? 'English Language Arts — 4 credits' : '英语语文 — 4 学分'}</li>
              <li>{en ? 'Mathematics — 4 credits' : '数学 — 4 学分'}</li>
              <li>{en ? 'Sciences — 3 credits' : '科学 — 3 学分'}</li>
              <li>{en ? 'Social Studies — 3 credits' : '社会科学 — 3 学分'}</li>
              <li>{en ? 'World Languages — 2 credits' : '外语 — 2 学分'}</li>
              <li>{en ? 'Arts or Electives — 2 credits' : '艺术或选修 — 2 学分'}</li>
              <li>{en ? 'Physical Education / Health — 1 credit' : '体育 / 健康 — 1 学分'}</li>
              <li>{en ? 'Free Electives — 5 credits' : '自由选修 — 5 学分'}</li>
            </UL>
            <P>{en
              ? 'Florida Statute 1002.42 requires a minimum of 170 instructional days per year. GIIS operates two semesters of approximately 18 weeks each, totaling ~180 instructional days. The diploma is signed by the President & Principal, carries a unique student code, and is verifiable at /verify/{code} via QR code.'
              : '依据 Florida Statute 1002.42 规定，每学年至少需有 170 个教学日。GIIS 每学年分为两个约 18 周的学期，共约 180 个教学日。文凭由 President & Principal 签署，每份附唯一学生代码与 QR 码，可通过 /verify/{code} 进行验证。'}</P>
          </Section>

          {/* §4 Assessment */}
          <Section id="assessment">
            <SectionHeading {...SECTIONS[3]} language={language} />
            <P>{en
              ? 'Summative assessments at GIIS are structured to ensure the integrity of every credit awarded.'
              : 'GIIS 的总结性评量经过设计，以保证所发学分的可信度：'}</P>
            <UL>
              <li>{en
                ? <><strong>Randomized question banks.</strong> Midterm and final exams draw from a question bank at least three times larger than the test length; each student receives a unique, randomly ordered question set with randomized answer-option ordering.</>
                : <><strong>题库随机化。</strong>期中、期末考从至少为考题数 3 倍以上的题库中随机抽取，每位学生收到独立、顺序随机的题组（含选项顺序随机化）。</>}</li>
              <li>{en
                ? <><strong>Proctored sessions.</strong> Final examinations are administered as proctored online sessions. Students activate webcam and present a valid ID at exam start; periodic frame captures are stored for the integrity period defined in §11.</>
                : <><strong>监考机制。</strong>期末考以线上监考方式进行：考生需开启 webcam、出示身份证明；考试期间将定期截取画面，依 §11 隐私政策规定期限保存。</>}</li>
              <li>{en
                ? <><strong>Lockdown monitoring.</strong> The Learn Portal logs page focus, tab switches, and developer-tool activation during exams. Repeated infractions void that examination attempt.</>
                : <><strong>页面监测。</strong>考试期间 Learn Portal 将记录页面失焦、切换标签页、开发者工具启用等行为。多次违规将使该次考试无效。</>}</li>
              <li>{en
                ? <><strong>Oral defense.</strong> Selected courses require a short oral defense recording in which the student explains a core concept; this is graded by faculty alongside the written exam.</>
                : <><strong>口头答辩。</strong>部分课程要求录制 5 分钟左右的概念阐述影片，由任课教师与笔试成绩一并评分。</>}</li>
            </UL>
            <P>{en
              ? 'Every assessment session — start time, end time, IP address, device fingerprint, completion duration, and any integrity events — is recorded in the student\'s audit trail (see §10).'
              : '每次评量的开始时间、结束时间、IP、设备指纹、用时与诚信事件均完整记录于学生学习审计日志（详见 §10）。'}</P>
          </Section>

          {/* §5 Integrity */}
          <Section id="integrity">
            <SectionHeading {...SECTIONS[4]} language={language} />
            <P>{en
              ? 'Academic integrity is the foundation of the GIIS diploma. The following are violations and are subject to discipline up to and including loss of credit, exam invalidation, and (for repeated or severe cases) dismissal from the school:'
              : '学术诚信是 GIIS 文凭的根本。以下行为构成违规，处分由扣分至取消学分、考试作废，严重或屡犯者将予以开除学籍：'}</P>
            <UL>
              <li>{en ? 'Plagiarism — submitting another person\'s work, ideas, or words without attribution.' : '抄袭 — 未注明出处地使用他人作品、观点或文字。'}</li>
              <li>{en ? 'Unauthorized collaboration on individually-assigned work.' : '在指定为个人作业的任务上未经允许进行协作。'}</li>
              <li>{en ? 'Using prohibited resources during a proctored exam (including any AI assistant).' : '在监考考试期间使用未经允许之资源（包含任何 AI 助手）。'}</li>
              <li>{en ? 'Impersonation — having a third party take an assessment on the student\'s behalf.' : '冒名考试 — 请第三方代为完成评量。'}</li>
              <li>{en ? 'Fabrication of research data, citations, or sources.' : '伪造研究数据、引用或来源。'}</li>
              <li>{en ? 'Unauthorized circulation of exam questions or answers.' : '未经允许传播考题或答案。'}</li>
            </UL>
            <P>{en
              ? 'A first offense ordinarily results in zero credit on the affected assignment, a written record in the student\'s academic file, and parent notification. A second offense ordinarily results in failure of the course. A third offense, or any single offense judged egregious by the Head of School, may result in expulsion. Students retain the right to appeal under §9.'
              : '首次违规通常会该项作业 0 分、入档案并通知家长。二次违规通常会致使该课程不及格。三次违规或情节严重者，校务长可处以开除学籍。学生保有依 §9 申诉之权利。'}</P>
          </Section>

          {/* §6 Attendance */}
          <Section id="attendance">
            <SectionHeading {...SECTIONS[5]} language={language} />
            <P>{en
              ? 'Because GIIS operates asynchronously, "attendance" is measured by demonstrated engagement rather than by physical presence. A student is deemed in good attendance standing when they:'
              : '由于 GIIS 采用异步线上模式，"出勤"以学习参与度而非物理到场计算。学生须达成下列项目方为出勤合格：'}</P>
            <UL>
              <li>{en ? 'Log in to the Learn Portal at least once per week during each active semester.' : '学期中每周至少登入 Learn Portal 一次。'}</li>
              <li>{en ? 'Complete at least one module or assessment per enrolled course per two-week period.' : '每两周内每门所修课程至少完成一个模块或评量。'}</li>
              <li>{en ? 'Submit all required midterm and final examinations during the announced exam window.' : '在公告之考试期间内完成所有期中、期末考。'}</li>
              <li>{en ? 'Attend any scheduled mandatory advisor or principal events (recorded for asynchronous viewing where reasonable).' : '出席所有强制性导师或校长会议（合理情况下提供录影供异步观看）。'}</li>
            </UL>
            <P>{en
              ? 'Students who fall below these thresholds receive an attendance notice. Repeated non-engagement may result in administrative withdrawal from the course with no credit awarded. Annual instructional engagement of less than 170 days\' equivalent will be reviewed for compliance with Florida Statute 1002.42.'
              : '低于上述标准者将收到出勤通知。持续未参与可能被强制退课，且不获学分。若全年参与度低于 170 教学日之等量，将依 Florida Statute 1002.42 复核合规性。'}</P>
          </Section>

          {/* §7 AI */}
          <Section id="ai">
            <SectionHeading {...SECTIONS[6]} language={language} />
            <P>{en
              ? 'GIIS embraces artificial intelligence as a learning tool while requiring that all credit-bearing work reflect the student\'s own understanding.'
              : 'GIIS 鼓励学生善用人工智能作为学习工具，但所有可获学分之作业必须反映学生本身的理解与思考。'}</P>
            <P><strong>{en ? 'Permitted use of AI:' : '允许使用 AI 的情境：'}</strong></P>
            <UL>
              <li>{en ? 'Explaining concepts, generating practice questions, summarizing reading.' : '解释概念、产生练习题、摘要阅读材料。'}</li>
              <li>{en ? 'Brainstorming, outlining, debugging code (with disclosure).' : '脑力激荡、拟定大纲、debug 代码（须如实揭露使用）。'}</li>
              <li>{en ? 'Translation between English and Chinese for comprehension.' : '为理解所做之中英互译。'}</li>
            </UL>
            <P><strong>{en ? 'Prohibited use of AI:' : '禁止使用 AI 的情境：'}</strong></P>
            <UL>
              <li>{en ? 'Any use during a proctored midterm, final exam, or oral defense recording.' : '在任何监考期中、期末考或口头答辩录影期间使用。'}</li>
              <li>{en ? 'Submitting AI-generated prose as one\'s own writing without disclosure.' : '将 AI 产出之文字未经揭露当作个人作品提交。'}</li>
              <li>{en ? 'Generating research data, citations, or quotations that are not independently verified.' : '产生未经核实之研究数据、引用或摘录。'}</li>
            </UL>
            <P>{en
              ? 'When AI is used to assist work that is submitted for credit (e.g., a research paper), the student must disclose the model used, the nature of the use, and any verbatim text retained. Faculty may require revisions or invalidation of work where AI involvement is undisclosed or exceeds permitted scope.'
              : '当 AI 协助完成的作业提交以求学分时（例如研究论文），学生必须如实揭露使用之模型、用途与保留之原文。如未揭露或超出允许范围，教师可要求重做或宣告该作业无效。'}</P>
          </Section>

          {/* §8 Conduct */}
          <Section id="conduct">
            <SectionHeading {...SECTIONS[7]} language={language} />
            <P>{en
              ? 'Students, families, faculty, and staff are expected to treat one another with respect in every channel of school communication (Learn Portal, email, video sessions, WeChat, and any in-person event).'
              : '学生、家庭、教师与员工在所有学校沟通管道（Learn Portal、邮件、视讯、微信、实体活动）中均应彼此尊重。'}</P>
            <P><strong>{en ? 'Specifically prohibited:' : '具体禁止行为：'}</strong></P>
            <UL>
              <li>{en ? 'Harassment, bullying, threats, or discrimination based on race, ethnicity, gender, sexual orientation, religion, or nationality.' : '基于种族、民族、性别、性取向、宗教或国籍之骚扰、霸凌、威胁或歧视。'}</li>
              <li>{en ? 'Sharing of explicit, violent, or otherwise inappropriate material in school channels.' : '在学校管道中分享色情、暴力或其他不当内容。'}</li>
              <li>{en ? 'Recording or screenshotting other students without consent.' : '未经同意录制或截屏其他学生。'}</li>
              <li>{en ? 'Misrepresenting one\'s identity in school communications.' : '在学校沟通中冒用他人身份。'}</li>
            </UL>
            <P>{en
              ? 'Violations are handled in proportion to severity, ranging from a documented warning to suspension or, for severe cases, expulsion. The school cooperates with local authorities when conduct constitutes a credible threat to safety.'
              : '违规处分依严重性分级，由记录警告至停课，严重者开除学籍。当行为构成可信安全威胁时，学校将与当地执法单位合作。'}</P>
          </Section>

          {/* §9 Appeals */}
          <Section id="appeals">
            <SectionHeading {...SECTIONS[8]} language={language} />
            <P>{en
              ? 'Any student or family who believes a grade, conduct decision, or administrative action was incorrect or unfair may file a written appeal:'
              : '若学生或家长认为某项成绩、行为处分或行政决定有误或不公，可依下列程序提出书面申诉：'}</P>
            <UL>
              <li>{en ? 'Step 1 — Email the course instructor (for grades) or the President & Principal (for conduct / administrative actions) within 14 calendar days of the decision.' : '第 1 步 — 于裁定后 14 个日历日内发送邮件至授课教师（成绩争议）或 President & Principal（行为/行政决定）。'}</li>
              <li>{en ? 'Step 2 — If unresolved, escalate to the Head of School within 14 days of the Step-1 response.' : '第 2 步 — 如未解决，可于收到第 1 步回应起 14 日内升级至校务长。'}</li>
              <li>{en ? 'Step 3 — The Head of School and President & Principal jointly review and issue a final written decision within 30 days.' : '第 3 步 — 校务长与校长共同复核，30 日内发出最终书面裁定。'}</li>
            </UL>
            <P>{en
              ? 'During the appeal, the original decision remains in effect unless the Head of School issues a temporary stay. Records of the appeal are retained in the student\'s academic file.'
              : '申诉期间原裁定仍然有效，除非校务长另行作出临时缓和决定。申诉记录将存入学生档案。'}</P>
          </Section>

          {/* §10 Records */}
          <Section id="records">
            <SectionHeading {...SECTIONS[9]} language={language} />
            <P>{en
              ? 'GIIS maintains a complete academic record for every enrolled student, including: course enrollments, module completion timestamps, quiz and exam session logs, assignment submissions with faculty feedback, attendance/engagement summaries, and any integrity events.'
              : 'GIIS 为每位在册学生保存完整学术记录，包含：选课记录、模块完成时间戳、quiz 及考试 session 日志、作业提交及教师评语、出勤参与摘要、以及任何诚信事件。'}</P>
            <P>{en
              ? <>Official transcripts are issued upon written request from the student or parent and are signed by the <strong>President & Principal</strong>. Each transcript carries a unique student code and a QR code linking to <code>/verify/&lt;code&gt;</code> for third-party verification (used by colleges and employers).</>
              : <>正式成绩单依学生或家长之书面请求发出，由 <strong>President & Principal</strong> 亲签。每份成绩单附唯一学生代码及 QR 码，第三方（大学、雇主）可通过 <code>/verify/&lt;code&gt;</code> 进行验证。</>}</P>
            <P>{en
              ? 'Diplomas issued by GIIS bear the signature of the President & Principal, the school seal, and a verification QR code. Diplomas become officially valid on the diploma issuance date listed on the school calendar (see /school-profile).'
              : 'GIIS 文凭附校长亲签、校印与验证 QR 码。文凭自校历公告之"文凭生效日"起方为正式有效（详见 /school-profile）。'}</P>
          </Section>

          {/* §11 Privacy */}
          <Section id="privacy">
            <SectionHeading {...SECTIONS[10]} language={language} />
            <P>{en
              ? 'GIIS treats student records in accordance with the principles of the Family Educational Rights and Privacy Act (FERPA), even though as a private school we are not subject to FERPA by statute.'
              : 'GIIS 依据 Family Educational Rights and Privacy Act (FERPA) 之原则处理学生档案。虽然本校为私立机构、法律上不受 FERPA 直接约束，但仍主动遵循其精神。'}</P>
            <UL>
              <li>{en ? 'Personally identifiable student data is shared only with: enrolled parents/guardians, faculty assigned to the student, designated college admissions offices upon request, and law enforcement under valid legal process.' : '学生可辨识资料仅与下列对象共享：在册家长/监护人、被指派之任课教师、学生书面同意后之大学招生办、合法法律程序下之执法单位。'}</li>
              <li>{en ? 'Proctoring video frames are retained for 12 months after the exam date and then deleted unless flagged for an active integrity review.' : '监考画面自考试日起保留 12 个月后删除，但若标记为待审之诚信案件则继续保留至案件结束。'}</li>
              <li>{en ? 'Academic transcripts and diploma records are retained permanently.' : '学术成绩单与文凭记录将永久保存。'}</li>
              <li>{en ? 'Parents and students 18+ may request a copy of their full academic record within 30 days of written request.' : '家长及年满 18 岁之学生可于书面请求后 30 日内取得完整学术档案副本。'}</li>
            </UL>
            <P>{en
              ? <>For full data handling details see our <Link to="/privacy" style={{ color: NAVY, textDecoration: 'underline' }}>Privacy Policy</Link>.</>
              : <>详细资料处理说明请见 <Link to="/privacy" style={{ color: NAVY, textDecoration: 'underline' }}>隐私政策</Link>。</>}</P>
          </Section>

          {/* §12 Authority */}
          <Section id="authority">
            <SectionHeading {...SECTIONS[11]} language={language} />
            <P>{en
              ? 'Genesis of Ideas International School is governed by:'
              : '艾迪尔国际学校之治理结构如下：'}</P>
            <UL>
              <li>{en ? <><strong>Alan Hwader Chu, Founder & Head of School</strong> — owner, executive authority over school policy, finance, technology, and external representation.</> : <><strong>曲华德 (Alan Hwader Chu)，创办人 · 校长 (Founder & Head of School)</strong> — 学校所有人，对学校政策、财务、科技与对外代表行使执行权。</>}</li>
              <li>{en ? <><strong>Shiyu Zhang, Ph.D., President & Principal</strong> — academic authority over curriculum, faculty oversight, and signs all official transcripts and diplomas.</> : <><strong>张诗雨博士，校长 (President & Principal)</strong> — 学术权威，统筹课程、教师监督，并签署所有正式成绩单与文凭。</>}</li>
            </UL>
            <P>{en
              ? <>The school is a Florida-registered private school under Florida Statute 1002.42 (FL school code 650, registered 2024, founded 2022). For verification of registration, see the Florida Department of Education private school directory. For school profile, accreditation status, calendar, and grading policy, see <Link to="/school-profile" style={{ color: NAVY, textDecoration: 'underline' }}>/school-profile</Link>. For named leadership and contact information, see <Link to="/about" style={{ color: NAVY, textDecoration: 'underline' }}>/about</Link>.</>
              : <>本校依据 Florida Statute 1002.42 于 Florida 教育厅注册为私立学校（FL school code 650，2024 年注册，2022 年创办）。注册信息查询请至 Florida Department of Education 私立学校目录。School Profile、认证状态、校历与评分政策请见 <Link to="/school-profile" style={{ color: NAVY, textDecoration: 'underline' }}>/school-profile</Link>，学校领导与联络方式请见 <Link to="/about" style={{ color: NAVY, textDecoration: 'underline' }}>/about</Link>。</>}</P>
            <Quote>{en
              ? <><strong>Authority of this handbook.</strong> This document is published under the joint authority of the Head of School and the President & Principal. Both leaders have endorsed its contents as the current operating policy of Genesis of Ideas International School as of the last-revised date stated above.</>
              : <><strong>本手册之授权说明。</strong>本文件由校务长与校长共同授权发布。两位领导确认本手册内容为艾迪尔国际学校自上述修订日起之有效运营政策。</>}</Quote>
            <P style={{ marginTop: 28 }}><Link to="/about" style={{
              background: NAVY, color: '#fff', padding: '10px 22px',
              borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}>
              {en ? '← Return to About & Leadership' : '← 返回学校领导页'}
            </Link></P>
          </Section>

          <div style={{
            marginTop: 56, paddingTop: 24, borderTop: '1px solid #d6cfba',
            color: MUTED, fontSize: 13, lineHeight: 1.7,
          }}>
            {en
              ? 'This handbook is a living document. Updates are versioned on the school website. For inquiries: '
              : '本手册为持续更新之文件，最新版本以学校网站为准。如有疑问，请来信：'}
            <a href="mailto:admissions@genesisideas.school" style={{ color: NAVY, fontWeight: 600 }}>
              admissions@genesisideas.school
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
