import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav';

/*
 * /about — Leadership page
 *
 * Purpose: name the real humans behind GIIS so college admissions, CEEB reviewers,
 * Florida DOE auditors, and prospective parents can verify who runs the school.
 *
 * Current named leaders:
 *   - Alan Hwader Chu (曲华德) — Founder & Head of School
 *   - Shiyu Zhang, Ph.D.       — President & Principal
 *
 * Title decision (2026-05-18): Alan = "Founder & Head of School" (executive
 * leader / owner). Shiyu Zhang continues as "President & Principal" — she
 * signs transcripts and is the academic principal of record.
 *
 * Photos (Alan + Shiyu headshots) + WeChat QR are still TODO — see comments below.
 */

const NAVY = '#1a2d5a';
const GOLD = '#b8962e';
const CREAM = '#faf6ed';
const INK = '#222';
const MUTED = '#5b6479';

const FOUNDER = {
  nameEn: 'Alan Hwader Chu',
  nameZh: '曲华德',
  titleEn: 'Founder & Head of School',
  titleZh: '创办人 · 校长',
  email: 'alanhdchu@genesisideas.school',
  // TODO: upload a real headshot to /src/img/Leadership/alan.jpg and switch this.
  photo: null,
  initials: 'AC',
  bioEn: [
    "Alan founded Genesis of Ideas International School (GIIS) to give Chinese students a credible, US-aligned high school pathway built on real instruction, real research, and real evidence — not just a name on a diploma.",
    "He is a cross-disciplinary educator and engineer with graduate training in Materials Engineering (M.S., Purdue University, with Ph.D.-track research), Artificial Intelligence (M.S. in progress, The University of Texas at Austin), and Chemical Engineering (M.S. & B.S., National Tsing Hua University, Taiwan).",
    "Across more than ten years he has taught Physics, Chemistry, and Mathematics for IGCSE, A-Level, and AP, mentored middle- and high-school student research projects, and trained students toward US high school and undergraduate admissions. He has served as a research-fair judge for the West Central / Lafayette Regional Science Fair (Purdue, 2021) and holds a CAIE Cambridge 9702 Physics professional certification.",
    "Professionally he has built large-scale data and operations systems at Walmart (Fortune 1) and engineering automation tools at KLA-Tencor. He brings that systems and AI background to GIIS — designing the school's GPA architecture, transcript pipeline, learning analytics, and academic operations SOPs from the ground up.",
    "His published research has appeared in Optical Materials Express (2020) and the Journal of Alloys & Compounds (2017), and he has received the TMS and TwICHE Best Poster Awards.",
  ],
  bioZh: [
    '曲华德 (Alan) 创办艾迪尔国际学校 (GIIS) 的目标，是为中国学生提供一条真实可信、与美国体系接轨的高中升学通道 —— 拥有真实的教学、真实的科研、真实的证据链，而不只是一张文凭上的校名。',
    '他是跨学科的教育者与工程师，研究生训练横跨材料工程（普渡大学硕士，含博士阶段研究）、人工智能（德州大学奥斯汀分校硕士在读）与化学工程（国立清华大学硕士与学士，台湾新竹）。',
    '他拥有十年以上 IGCSE、A-Level、AP 体系下 Physics、Chemistry、Mathematics 的国际课程教学经验，长期指导中学生科研项目与升学准备。他曾担任 Purdue West Central / Lafayette Regional Science Fair (2021) 中学生科研竞赛评委，并持有 CAIE Cambridge 9702 Physics 专业认证。',
    '职业上，他曾参与 Walmart (Fortune 1) 大规模实时运营决策与数据系统建设，并在 KLA-Tencor 开发工程自动化工具。他将企业级系统与 AI 背景带入 GIIS，从零搭建学校的 GPA 体系、成绩单流程、学习数据分析与学术运营 SOP。',
    '他的研究成果发表于 Optical Materials Express (2020) 与 Journal of Alloys & Compounds (2017)，并获得 TMS 与 TwICHE Best Poster 奖项。',
  ],
  educationEn: [
    { school: 'The University of Texas at Austin', degree: 'M.S. in Artificial Intelligence', years: '2024 – Present' },
    { school: 'Purdue University', degree: 'M.S. in Materials Engineering (Ph.D.-track research)', years: '2018 – 2020' },
    { school: 'National Tsing Hua University (Taiwan)', degree: 'M.S. & B.S. in Chemical Engineering', years: '2010 – 2016' },
  ],
  educationZh: [
    { school: '德州大学奥斯汀分校 The University of Texas at Austin', degree: '人工智能硕士在读 (M.S. in AI)', years: '2024 – 至今' },
    { school: '普渡大学 Purdue University', degree: '材料工程硕士（含博士阶段研究）', years: '2018 – 2020' },
    { school: '国立清华大学（台湾新竹）', degree: '化学工程硕士与学士', years: '2010 – 2016' },
  ],
  rolesEn: [
    'Built the GPA system, transcript architecture, and Learn Portal academic operations SOPs at GIIS.',
    'Designs AI-assisted learning workflows, learning analytics, and the academic-integrity stack (audit trails, randomized question banks, proctored finals).',
    'Coordinates faculty, advisors, and college pathways across the IGCSE, A-Level, AP, and US high school systems.',
    'Mentors student research and oversees long-term college admissions planning for Class of 2026 onward.',
  ],
  rolesZh: [
    '搭建 GIIS 的 GPA 系统、成绩单架构与 Learn Portal 学术运营 SOP。',
    '设计 AI 辅助学习流程、学习数据分析与学术诚信体系（活动审计、随机题库、监考期末）。',
    '协调教师、升学导师与国际课程升学路径（IGCSE、A-Level、AP、美高体系）。',
    '指导学生科研项目，长期规划 Class of 2026 起的升学路线。',
  ],
};

const PRESIDENT = {
  nameEn: 'Shiyu Zhang, Ph.D.',
  nameZh: '章诗雨 博士',
  titleEn: 'President & Principal',
  titleZh: '校长',
  email: 'shiyu.zhang@genesisideas.school',
  // TODO: upload Dr. Zhang's headshot to /src/img/Leadership/shiyu.jpg and switch this.
  initials: 'SZ',
  bioEn: [
    "Dr. Shiyu Zhang serves as President & Principal of Genesis of Ideas International School and signs all official transcripts and diplomas issued by the school.",
    "Dr. Zhang is an experienced international educator and academic mentor with over ten years of experience teaching TOEFL, IELTS, GRE, and A-Level Chinese. She specializes in bilingual education and has extensive experience teaching both Chinese and English in multicultural learning environments.",
    "She holds a Ph.D. in Comparative Literature from Purdue University and has also completed advanced studies in education and computer science. Her interdisciplinary academic background allows her to combine strong language training with critical thinking, communication skills, and personalized learning strategies.",
    "Over the years, she has guided students from diverse educational backgrounds in language development, academic writing, standardized test preparation, and international university applications. Her teaching philosophy emphasizes individualized instruction, student confidence-building, and cross-cultural communication.",
    "In addition to classroom teaching, she has extensive experience in online education and educational management, with a strong focus on helping students develop both academic excellence and the independent learning ability required to thrive in a global context.",
  ],
  bioZh: [
    '章诗雨博士担任艾迪尔国际学校 (GIIS) 校长，所有正式成绩单与文凭均由其签署。',
    '章博士是经验丰富的国际教育者与学术导师，拥有十年以上 TOEFL、IELTS、GRE 与 A-Level 中文教学经验，专长于双语教育，在多文化学习环境中同时教授中文与英文。',
    '她拥有普渡大学比较文学博士学位 (Ph.D., Purdue University)，并完成教育学与计算机科学之进阶研究。跨学科的学术背景让她能将扎实的语言训练与批判性思维、沟通能力及个性化学习策略相结合。',
    '多年来，她辅导来自不同教育背景的学生发展语言能力、学术写作、标准化考试准备与国际大学申请。她的教学理念强调：个性化教学、建立学生自信、跨文化沟通能力。',
    '除课堂教学之外，她在线上教育与教育管理方面亦有丰富经验，专注于帮助学生在全球化背景下同时发展学术卓越与独立学习能力。',
  ],
  educationEn: [
    { school: 'Purdue University', degree: 'Ph.D. in Comparative Literature', years: '' },
    { school: 'Purdue University (advanced studies)', degree: 'Education & Computer Science', years: '' },
  ],
  educationZh: [
    { school: '普渡大学 Purdue University', degree: '比较文学博士 (Ph.D. in Comparative Literature)', years: '' },
    { school: '普渡大学（进阶研究）', degree: '教育学与计算机科学', years: '' },
  ],
  rolesEn: [
    'Academic authority over curriculum, faculty oversight, and instructional standards at GIIS.',
    'Signs all official GIIS transcripts and diplomas as President & Principal.',
    'Leads bilingual (English/Chinese) instruction strategy and language-program design.',
    'Oversees standardized-test preparation pathways (TOEFL, IELTS, GRE, A-Level Chinese) and international college application advising.',
  ],
  rolesZh: [
    '主管 GIIS 课程、教师团队与教学标准之学术权威。',
    '以校长 (President & Principal) 身份签署所有 GIIS 正式成绩单与文凭。',
    '统筹中英双语教学策略与语言课程设计。',
    '督导标准化考试准备路径（TOEFL、IELTS、GRE、A-Level 中文）与国际大学升学辅导。',
  ],
};

const SCHOOL = {
  legalNameEn: 'Genesis of Ideas International School, LLC',
  legalNameZh: '艾迪尔国际学校',
  address: '7901 4th St N STE 300, St. Petersburg, FL 33702, USA',
  founded: '2022',
  registered: 'March 19, 2024',
  ein: '99-2175408',
  flCode: '650',
  ceebStatus: 'Applied and pending',
  statute: 'Florida Statute 1002.42',
};

function Avatar({ initials, photo, color = NAVY }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={initials}
        style={{
          width: 168, height: 168, borderRadius: '50%', objectFit: 'cover',
          border: `4px solid ${GOLD}`, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: 168, height: 168, borderRadius: '50%',
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 54, fontWeight: 700, letterSpacing: '2px',
        fontFamily: "'Georgia', serif",
        border: `4px solid ${GOLD}`, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}
    >
      {initials}
    </div>
  );
}

function LeaderCard({ leader, language, accentLeft = true }) {
  const en = language !== 'zh';
  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #e7e2d4',
        borderRadius: 12,
        padding: '32px 36px',
        boxShadow: '0 4px 16px rgba(26,45,90,0.06)',
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: 36,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, [accentLeft ? 'left' : 'right']: 0,
        width: 6, height: '100%', background: GOLD,
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Avatar initials={leader.initials} photo={leader.photo} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, fontFamily: "'Georgia', serif" }}>
            {en ? leader.nameEn : leader.nameZh}
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
            {en ? leader.nameZh : leader.nameEn}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: GOLD,
            letterSpacing: '1.4px', textTransform: 'uppercase', marginTop: 8,
          }}>
            {en ? leader.titleEn : leader.titleZh}
          </div>
          {leader.email && (
            <a
              href={`mailto:${leader.email}`}
              style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: NAVY, textDecoration: 'underline' }}
            >
              {leader.email}
            </a>
          )}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: INK }}>
          {(en ? leader.bioEn : leader.bioZh).map((p, i) => (
            <p key={i} style={{ marginBottom: 14 }}>{p}</p>
          ))}
        </div>

        {leader.educationEn && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{
              fontSize: 11, fontWeight: 700, color: GOLD,
              letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 10,
              borderBottom: `1px solid ${GOLD}`, paddingBottom: 6,
            }}>
              {en ? 'Education' : '教育背景'}
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {(en ? leader.educationEn : leader.educationZh).map((e, i) => (
                <li key={i} style={{ marginBottom: 8, fontSize: 13.5, color: INK }}>
                  <span style={{ fontWeight: 600 }}>{e.school}</span>
                  <span style={{ color: MUTED }}> · {e.degree}{e.years ? ` · ${e.years}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {leader.rolesEn && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{
              fontSize: 11, fontWeight: 700, color: GOLD,
              letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 10,
              borderBottom: `1px solid ${GOLD}`, paddingBottom: 6,
            }}>
              {en ? 'Role at GIIS' : 'GIIS 角色与职责'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(en ? leader.rolesEn : leader.rolesZh).map((r, i) => (
                <li key={i} style={{ marginBottom: 6, fontSize: 13.5, color: INK, lineHeight: 1.65 }}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

function ResponsiveStyle() {
  return (
    <style>{`
      @media (max-width: 760px) {
        .giis-about-leader-card {
          grid-template-columns: 1fr !important;
          padding: 24px !important;
          gap: 20px !important;
        }
        .giis-about-hero h1 {
          font-size: 32px !important;
        }
        .giis-about-shell {
          padding: 32px 16px 48px !important;
        }
      }
    `}</style>
  );
}

export default function AboutPage({ language, toggleLanguage }) {
  const en = language !== 'zh';

  return (
    <>
      <Nav language={language} toggleLanguage={toggleLanguage} />
      <Helmet>
        <title>{en
          ? 'About & Leadership | Genesis of Ideas International School'
          : '关于我们与学校领导 | 艾迪尔国际学校'}</title>
        <meta
          name="description"
          content={en
            ? 'Genesis of Ideas International School (GIIS) is a Florida-registered private school. Meet the founder Alan Hwader Chu and President & Principal Shiyu Zhang, Ph.D.'
            : '艾迪尔国际学校 (GIIS) 是 Florida 注册私立学校。了解创办人曲华德 (Alan Hwader Chu) 与校长章诗雨博士。'}
        />
      </Helmet>

      <ResponsiveStyle />

      {/* Hero */}
      <section
        className="giis-about-hero"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #283d6e 100%)`,
          color: '#fff',
          padding: '72px 8% 56px',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            color: GOLD, letterSpacing: '2px', textTransform: 'uppercase',
            border: `1px solid ${GOLD}`, borderRadius: 4, padding: '4px 11px',
            marginBottom: 22,
          }}>
            {en ? 'About GIIS · Leadership' : '关于 GIIS · 学校领导'}
          </div>
          <h1 style={{
            margin: 0, fontSize: 42, fontWeight: 700, lineHeight: 1.2,
            fontFamily: "'Georgia', serif",
          }}>
            {en ? 'The people behind GIIS' : '艾迪尔国际学校背后的人'}
          </h1>
          <p style={{
            marginTop: 18, fontSize: 17, lineHeight: 1.7,
            color: 'rgba(255,255,255,0.82)', maxWidth: 760,
          }}>
            {en
              ? "GIIS is a Florida-registered private school (Florida Statute 1002.42) serving students worldwide. We list our leadership here so that families, college admissions officers, and regulators can see — by name — who is accountable for the curriculum, transcripts, and diplomas the school issues."
              : '艾迪尔国际学校是依据 Florida Statute 1002.42 注册的美国私立学校，面向全球招生。我们在此公开列出学校领导，让家长、美国大学招生办与监管单位都能清楚知道：是谁在为本校的课程、成绩单与文凭负责。'}
          </p>
        </div>
      </section>

      {/* Body */}
      <section
        className="giis-about-shell"
        style={{
          background: CREAM,
          padding: '56px 8% 80px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 36 }}>
          <div className="giis-about-leader-card">
            <LeaderCard leader={FOUNDER} language={language} />
          </div>
          <div className="giis-about-leader-card">
            <LeaderCard leader={PRESIDENT} language={language} accentLeft={false} />
          </div>

          {/* School verification block */}
          <div style={{
            background: '#fff', border: `2px solid ${GOLD}`, borderRadius: 12,
            padding: '28px 32px', marginTop: 8,
          }}>
            <h3 style={{
              margin: 0, fontSize: 12, fontWeight: 700, color: GOLD,
              letterSpacing: '1.6px', textTransform: 'uppercase',
            }}>
              {en ? 'School Verification' : '学校信息核验'}
            </h3>
            <div style={{ marginTop: 14, fontSize: 14.5, color: INK, lineHeight: 1.8 }}>
              <div><strong>{en ? 'Legal name' : '法定名称'}:</strong> {en ? SCHOOL.legalNameEn : `${SCHOOL.legalNameZh} (${SCHOOL.legalNameEn})`}</div>
              <div><strong>{en ? 'Address' : '地址'}:</strong> {SCHOOL.address}</div>
              <div><strong>{en ? 'School type' : '学校类型'}:</strong> {en
                ? `Florida-registered private school · ${SCHOOL.statute}`
                : `Florida 注册私立学校 · ${SCHOOL.statute}`}</div>
              <div><strong>{en ? 'Founded / FL LLC Registered' : '成立 / FL LLC 注册'}:</strong> {en
                ? `${SCHOOL.founded} (founded) · ${SCHOOL.registered} (FL LLC filed)`
                : `${SCHOOL.founded} 创办 · ${SCHOOL.registered} FL LLC 完成注册`}</div>
              <div><strong>EIN:</strong> {SCHOOL.ein}</div>
              <div><strong>{en ? 'FL school code' : 'FL 学校代码'}:</strong> {SCHOOL.flCode}</div>
              <div><strong>CEEB:</strong> {en ? SCHOOL.ceebStatus : '已申请，等待审核'}</div>
              <div><strong>{en ? 'Accreditation' : '认证'}:</strong> {en
                ? 'Currently pursuing regional accreditation. Independent of any third-party accreditor.'
                : '正在申请区域认证，目前为独立 Florida 注册私立学校。'}</div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/school-profile"
                style={{
                  background: NAVY, color: '#fff', padding: '10px 22px',
                  borderRadius: 6, textDecoration: 'none', fontSize: 13.5, fontWeight: 600,
                }}
              >
                {en ? 'View full School Profile (PDF)' : '查看完整 School Profile (PDF)'}
              </Link>
              <Link
                to="/admission"
                style={{
                  background: '#fff', color: NAVY, border: `1.5px solid ${NAVY}`,
                  padding: '10px 22px', borderRadius: 6, textDecoration: 'none',
                  fontSize: 13.5, fontWeight: 600,
                }}
              >
                {en ? 'Admission information' : '招生信息'}
              </Link>
            </div>
          </div>

          {/* Contact strip */}
          <div style={{
            textAlign: 'center', padding: '20px 16px', color: MUTED,
            fontSize: 13.5, borderTop: `1px solid #e7e2d4`, marginTop: 4,
          }}>
            {en
              ? 'Questions for school leadership? Email '
              : '如需联系学校领导，请来信 '}
            <a href="mailto:admissions@genesisideas.school" style={{ color: NAVY, fontWeight: 600 }}>
              admissions@genesisideas.school
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
