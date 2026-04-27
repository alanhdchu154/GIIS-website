import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Nav from '../../main/Nav.js';

const CATEGORIES = [
  {
    id: 'stem',
    label: 'STEM & Science',
    labelZh: 'STEM与理科',
    desc: 'For students targeting engineering, medical, or quantitative programs at top research universities.',
    descZh: '适合目标申请工程、医学或理工类顶尖研究型大学的学生。',
    pathways: [
      {
        title: 'CS & Engineering',
        titleZh: '计算机科学',
        desc: 'Programming, algorithms, software engineering, AP CS A, and a machine learning capstone.',
        descZh: '编程、算法、软件工程、AP CS A 与机器学习毕业项目。',
        emoji: '💻', color: '#1565C0', to: '/pathways/cs',
        targets: ['Computer Science', 'Software Engineering', 'Data Science', 'AI & ML'],
        targetsZh: ['计算机科学', '软件工程', '数据科学', '人工智能'],
        ap: 1,
      },
      {
        title: 'Engineering Science',
        titleZh: '工程科学',
        desc: 'Design principles, statics, circuits, thermodynamics, AP Physics, and an engineering capstone.',
        descZh: '工程设计、静力学、电路、热力学、AP 物理与工程毕业项目。',
        emoji: '⚙️', color: '#B71C1C', to: '/pathways/engineering',
        targets: ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Aerospace'],
        targetsZh: ['机械工程', '电气工程', '土木工程', '航空航天'],
        ap: 1,
      },
      {
        title: 'Mathematics & Data Science',
        titleZh: '数学与数据科学',
        desc: 'Proof writing, discrete math, AP Statistics, linear algebra, and statistical modeling.',
        descZh: '数学证明、离散数学、AP 统计、线性代数与统计建模。',
        emoji: '📐', color: '#4527A0', to: '/pathways/math',
        targets: ['Mathematics', 'Statistics', 'Data Science', 'Actuarial Science'],
        targetsZh: ['数学', '统计学', '数据科学', '精算科学'],
        ap: 2,
      },
    ],
  },
  {
    id: 'business',
    label: 'Business & Global Affairs',
    labelZh: '商业与全球事务',
    desc: 'For students targeting business schools, policy programs, and internationally-focused careers.',
    descZh: '适合目标申请商学院、政策类项目及国际化职业方向的学生。',
    pathways: [
      {
        title: 'Business & Marketing',
        titleZh: '商业与市场营销',
        desc: 'Marketing, entrepreneurship, consumer behavior, AP Macroeconomics, and a brand launch capstone.',
        descZh: '市场营销、创业、消费者行为、AP 宏观经济学与品牌发布专题。',
        emoji: '📊', color: '#C84B0A', to: '/pathways/business',
        targets: ['Business Admin', 'Marketing', 'Entrepreneurship', 'International Business'],
        targetsZh: ['工商管理', '市场营销', '创业', '国际商务'],
        ap: 1,
      },
      {
        title: 'Economics & Finance',
        titleZh: '经济与金融',
        desc: 'Micro/macro economics, financial markets, behavioral economics, and policy research. 2 AP courses.',
        descZh: '微观/宏观经济学、金融市场、行为经济学与政策研究，含两门 AP 课程。',
        emoji: '📈', color: '#1B6B3A', to: '/pathways/economics',
        targets: ['Economics', 'Finance', 'Investment Banking', 'Public Policy'],
        targetsZh: ['经济学', '金融', '投资银行', '公共政策'],
        ap: 2,
      },
    ],
  },
  {
    id: 'arts',
    label: 'Psychology, Arts & Humanities',
    labelZh: '心理、艺术与人文',
    desc: 'For students with creative, humanistic, or social-scientific ambitions.',
    descZh: '适合有创意、人文或社会科学志向的学生。',
    pathways: [
      {
        title: 'Psychology & Behavioral Science',
        titleZh: '心理学与行为科学',
        desc: 'Behavior, cognition, social psychology, AP Psychology, and an original research capstone.',
        descZh: '行为、认知、社会心理学、AP 心理学与原创研究专题。',
        emoji: '🧠', color: '#5b2c6f', to: '/pathways/psychology',
        targets: ['Psychology', 'Neuroscience', 'Social Work', 'Education'],
        targetsZh: ['心理学', '神经科学', '社会工作', '教育学'],
        ap: 1,
      },
      {
        title: 'Communications & Media',
        titleZh: '传播与媒体',
        desc: 'Media writing, rhetoric, digital storytelling, AP English Language, and a media capstone.',
        descZh: '媒体写作、修辞学、数字叙事、AP 英语语言与媒体作品集专题。',
        emoji: '📡', color: '#E65100', to: '/pathways/communications',
        targets: ['Journalism', 'Public Relations', 'Digital Media', 'Film & TV'],
        targetsZh: ['新闻学', '公共关系', '数字媒体', '影视'],
        ap: 1,
      },
      {
        title: 'Arts & Design',
        titleZh: '艺术与设计',
        desc: 'Visual foundations, art history, digital design, AP Art History, and a portfolio capstone.',
        descZh: '视觉基础、艺术史、数字设计、AP 艺术史与作品集毕业专题。',
        emoji: '🎨', color: '#6A1B9A', to: '/pathways/arts',
        targets: ['Fine Arts', 'Graphic Design', 'Architecture', 'Film & Animation'],
        targetsZh: ['纯艺术', '平面设计', '建筑', '动画与影视'],
        ap: 1,
      },
    ],
  },
];

function PathwayCard({ p, isEn }) {
  return (
    <Link to={p.to} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: '#fff',
          border: `1px solid ${p.color}20`,
          borderTop: `5px solid ${p.color}`,
          borderRadius: '12px',
          padding: '24px 22px',
          height: '100%',
          boxSizing: 'border-box',
          transition: 'box-shadow 0.2s, transform 0.15s',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 8px 28px ${p.color}28`;
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }}>{p.emoji}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: `${p.color}15`, color: p.color }}>
            {p.ap} {isEn ? `AP Course${p.ap > 1 ? 's' : ''}` : `门 AP`}
          </span>
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: p.color, margin: '0 0 8px', lineHeight: 1.2 }}>
          {isEn ? p.title : p.titleZh}
        </h3>
        <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.65, margin: '0 0 14px', flex: 1 }}>
          {isEn ? p.desc : p.descZh}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
          {(isEn ? p.targets : p.targetsZh).map((t) => (
            <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: `${p.color}12`, color: p.color, fontWeight: 600 }}>
              {t}
            </span>
          ))}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: p.color }}>
          {isEn ? 'View 4-Year Plan →' : '查看四年规划 →'}
        </span>
      </div>
    </Link>
  );
}

export default function PathwaysHub({ language, toggleLanguage }) {
  const isEn = language !== 'zh';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Academic Pathways' : '学习路径'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? '8 four-year academic pathways at GIIS — designed around the top US university majors for international students.'
            : '艾迪尔国际学校提供 8 条四年学习路径，针对国际学生最热门的美国大学申请专业方向而设计。'}
        />
      </Helmet>

      <div className="row">
        <Nav language={language} toggleLanguage={toggleLanguage} />
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3d6d 60%, #1a1a2e 100%)', padding: '72px 10% 56px', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', margin: '0 0 10px', textTransform: 'uppercase' }}>
          {isEn ? 'Genesis of Ideas International School' : '艾迪尔国际学校'}
        </p>
        <h1 style={{ color: '#fff', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 16px' }}>
          {isEn ? 'Academic Pathways' : '学习路径'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '17px', maxWidth: '640px', lineHeight: 1.7, margin: '0 0 36px' }}>
          {isEn
            ? '8 four-year elective sequences built around the top US university majors chosen by Chinese international students. Each pathway includes a complete course schedule, full syllabi, curated resources, and interactive quizzes.'
            : '围绕中国留学生最热门的美国大学申请专业方向，精心设计的八条四年选修课程序列。每条路径均含完整课程安排、详细大纲、精选学习资源与互动测验。'}
        </p>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { v: '8', l: isEn ? 'Pathways' : '条路径' },
            { v: '8', l: isEn ? 'Courses Each' : '门课程/路径' },
            { v: '14+', l: isEn ? 'AP Options' : '门 AP 选项' },
            { v: '4', l: isEn ? 'Years of Guidance' : '年学业规划' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', padding: '12px 18px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, backdropFilter: 'blur(4px)' }}>
              <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#fff' }}>{s.v}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ background: '#f4f6fb', fontFamily: 'Inter, sans-serif' }}>
        {CATEGORIES.map((cat, ci) => (
          <div key={cat.id} style={{ padding: '64px 10%', background: ci % 2 === 0 ? '#f4f6fb' : '#fff' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  {isEn ? 'Category' : '方向'}
                </p>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', color: '#1a1a2e' }}>
                  {isEn ? cat.label : cat.labelZh}
                </h2>
                <p style={{ fontSize: '15px', color: '#666', margin: 0, maxWidth: '560px', lineHeight: 1.65 }}>
                  {isEn ? cat.desc : cat.descZh}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                {cat.pathways.map(p => (
                  <PathwayCard key={p.to} p={p} isEn={isEn} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: 'rgba(43,61,109,1)', padding: '64px 10%', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>
          {isEn ? 'Not sure which pathway fits you?' : '不确定哪条路径适合你？'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '16px', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.7 }}>
          {isEn
            ? 'Our academic advisors work with every student to design a personalized course plan aligned with your college major goals.'
            : '我们的学业顾问与每位学生合作，根据大学申请方向量身设计个人化选课计划。'}
        </p>
        <Link to="/support" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: '8px',
          background: 'rgba(213,168,54,1)', color: '#1a1a2e',
          fontWeight: 700, fontSize: '15px', textDecoration: 'none',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {isEn ? 'Talk to an advisor →' : '联系学业顾问 →'}
        </Link>
      </div>
    </>
  );
}
