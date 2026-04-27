import React from 'react';

function DiscoveryIntroduction({ language }) {
  const isEn = language !== 'zh';
  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '72px 10%', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: 'rgba(213,168,54,1)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 10px' }}>
        {isEn ? 'About Us' : '关于我们'}
      </p>
      <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 32px' }}>
        {isEn ? 'A New Kind of High School' : '一所全新的高中'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '16px', lineHeight: 1.8, margin: 0 }}>
          {isEn
            ? 'GIIS is a fully online, globally-minded high school dedicated to providing world-class education for Chinese students who aspire to study at top US universities. Our model breaks the geographical constraints of traditional schooling — students learn at their own pace, from anywhere.'
            : 'GIIS 是一所完全在线的全球化高中，致力于为有志申请美国顶尖大学的中国学生提供世界一流的教育。我们的模式打破了传统教育的地理限制，让学生可以在任何地方、按自己的节奏学习。'}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '16px', lineHeight: 1.8, margin: 0 }}>
          {isEn
            ? 'Students graduate with a Florida-registered private school diploma, a strong GPA record, and a course transcript built around their target US university major — giving them a compelling application package.'
            : '学生毕业时将获得佛罗里达州注册私立学校的文凭、优秀的 GPA 记录，以及围绕目标美国大学专业方向量身打造的成绩单，为申请提供有力支撑。'}
        </p>
      </div>
    </section>
  );
}

export default DiscoveryIntroduction;
