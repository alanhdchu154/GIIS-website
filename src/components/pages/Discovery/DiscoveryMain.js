import React from 'react';
import { Helmet } from 'react-helmet-async';
import Nav from '../../main/Nav.js';
import img from '../../../img/Homepage/homepage3.png';
import DiscoveryIntroduction from'./Discovery/DiscoveryIntroduction.js';
import DiscoveryIntroduction2 from'./Discovery/DiscoveryIntroduction2.js';

function DiscoveryMain({ language , toggleLanguage }) {

    const containerStyle = {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center', // 水平居中
        marginTop: '0', // 与导航欄保持距离
        width: '100%',
    };

    const imageStyle = {
        width: '100%', // 保持容器的寬度
        height: '400px', // 固定高度
        objectFit: 'cover'
    };

        const textOverlayStyle = {
        position: 'absolute',
        bottom: '-70px', // 固定在图片底部
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // 半透明黑色背景
        color: 'white',
        width: language === 'en' ? '50%' : '35%',
        zIndex: '20', 
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        padding: '10px',
    };

        const headline = {
        fontSize:'35px', 
        textAlign: 'center',
        paddingTop: '10px',
    };
        const paragraph = {
        fontSize:'20px', 
        textAlign: 'center',
    };

        const cardStyle = {
        position: 'relative', // 需要设置 position 来使 z-index 生效
        zIndex: '10', // 调整層级
        marginTop: '0', // 保持一些间距
        backgroundColor: 'rgba(43, 61, 109, 1)',
        borderBottom: '20px solid rgba(213, 168, 54, 1)',
    };
   
   return (
    <>
        <Helmet>
          <title>{language === 'en' ? 'Discovery' : '发现我们'} | Genesis of Ideas International School</title>
          <meta
            name="description"
            content={language === 'en'
              ? 'Explore Genesis of Ideas International School — community, learning culture, and what makes us unique.'
              : '了解艾迪尔国际学校的校園与学习文化。'}
          />
        </Helmet>
        <div className="row">
            <Nav language={language} toggleLanguage={toggleLanguage}  />
        </div>
      
        <div style={containerStyle}>
          <img src={img} alt="Discovery" style={imageStyle} />
          <div style={textOverlayStyle}>
            <p style={headline}>{language === 'en' ? 'DISCOVERY' : '发现我们'}</p>
            <p style={paragraph}>{language === 'en' ? 'Take the opportunity to freely explore new knowledge and discover your potential.Continuous learning fuels personal growth and innovation.' : '抓住机会，自由探索新知识，发现你的潜力。持续学习推动个人成长和创新。'}</p>
          </div>
        </div>

       <div className="card mt-0" id="introduction" style={cardStyle}>
         <div className="container">
            <div className="card-body">
               <DiscoveryIntroduction language={language} />
            </div>
         </div>
       </div>

       <div className="card mt-0" id="introduction2">
         <div className="container">
               <DiscoveryIntroduction2 language={language} />
         </div>
       </div>
       
    </>
  );
}

export default DiscoveryMain;

