import React from 'react';

function Academicsintroduction({ language }) {
  const isEn = language !== 'zh';

  const headlineStyle = {
    marginTop: '115px',
    color: 'white',
    width: '100%',
    paddingLeft: '15%',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    fontSize: '70px',
    lineHeight: '1',
  };

  const introductionStyle = {
    marginTop: '70px',
    color: 'rgba(255, 255, 255, 0.7)',
    width: '100%',
    paddingLeft: '15%',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    fontSize: '35px',
    lineHeight: '1',
  };

  const containerheading = {
    marginTop: '70px',
    color: 'rgba(255, 255, 255, 0.8)',
    width: '100%',
    paddingLeft: '15%',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'normal',
    fontSize: '30px',
    lineHeight: '1',
  };

  const container = {
    marginTop: '30px',
    width: '80%',
    paddingLeft: '16%',
    height: '30%',
    wordWrap: 'break-word',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '25px',
  };

  const container2 = {
    marginTop: '30px',
    marginBottom: '100px',
    width: '80%',
    paddingLeft: '16%',
    height: '30%',
    wordWrap: 'break-word',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '25px',
  };

  const textStyle = {
    position: 'relative',
    paddingLeft: '25px',
  };

  return (
    <>
      <div style={headlineStyle}>
        <p>{isEn ? 'WHAT MAKES GIIS' : '艾迪尔国际学校'}</p>
        <p>{isEn ? 'DIFFERENT?' : '有何不同？'}</p>
      </div>

      <div style={introductionStyle}>
        <p>{isEn ? 'The GIIS Difference' : '我们的与众不同'}</p>
      </div>

      {/* Point 1: US Accredited Diploma */}
      <div style={containerheading}>
        <p style={textStyle}>
          <span style={{ position: 'absolute', left: '0' }}>•</span>
          {isEn ? 'US High School Diploma' : '美国高中文凭'}
        </p>
      </div>
      <div style={container}>
        <p>
          {isEn
            ? 'GIIS is a registered Florida private school issuing US high school diplomas under the Florida 24-credit graduation framework — the standard recognized by US colleges and universities for international student admissions.'
            : 'GIIS 是在 Florida 注册的私立学校，依据 Florida 24 学分毕业框架颁发美国高中文凭，是美国大学在审核国际学生申请时所认可的学术资历。'}
        </p>
      </div>

      {/* Point 2: AI & Technology */}
      <div style={containerheading}>
        <p style={textStyle}>
          <span style={{ position: 'absolute', left: '0' }}>•</span>
          {isEn ? 'Immersive Learning with AI and Advanced Technologies' : '人工智慧与先进技术的沉浸式学习'}
        </p>
      </div>
      <div style={container}>
        <p>
          {isEn
            ? 'By integrating AI and cutting-edge technologies into teaching, we create immersive learning experiences that make the curriculum more engaging, adaptive, and interactive.'
            : '透过將 AI 和尖端科技整合到教学中，我们打造身臨其境的学习体验，让课程更具吸引力、适应性与互动性。'}
        </p>
      </div>

      {/* Point 3: Personalized Learning */}
      <div style={containerheading}>
        <p style={textStyle}>
          <span style={{ position: 'absolute', left: '0' }}>•</span>
          {isEn ? 'Personalized Learning and Holistic Development' : '个人化学习与全人发展'}
        </p>
      </div>
      <div style={container2}>
        <p>
          {isEn
            ? 'We emphasize personalized instruction with four academic pathways — Psychology, CS & Engineering, Business & Marketing, and Economics & Finance — each designed to match a student\'s college major aspirations.'
            : '我们以因材施教为核心，提供心理学、计算机科学、商业市场营销、经济与金融四大学习路径，根据每位学生的大学申请目标量身设计。'}
        </p>
      </div>
    </>
  );
}

export default Academicsintroduction;
