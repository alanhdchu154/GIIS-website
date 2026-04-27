import React, { useState, useEffect } from 'react';
// import img from '../../../../img/cognia.png';

function DiscoveryIntroduction({ language }) {
    const [fontSize, setFontSize] = useState(window.innerWidth < 1100 ? "55px" : "65px");

    useEffect(() => {
    const handleResize = () => {
      setFontSize(window.innerWidth < 1100 ? "55px" : "65px");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    const headlineStyle = {
        marginTop: '115px',
        color: 'white',
        width: '100%',
        paddingLeft: '15%',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        fontSize: fontSize,
        lineHeight: '1',
    };

    const introductionStyle = {
        marginTop: '70px',
        color: 'rgba(255, 255, 255, 0.8)',
        width: '100%',
        paddingLeft: '15%',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        fontSize: '35px',
        lineHeight: '1',
    };

    const container = {
      position: 'relative',
      marginTop: '65px',
      width: '80%',
      paddingLeft: '15%',
      height: '30%',  
      wordWrap: 'break-word',
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Arial, sans-serif', 
      fontSize: '25px',
    };

    const lineStyle = {
        position: 'absolute',
        width: '30%', // Adjust width according to your needs
        height: '2px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        paddingLeft: '15%',
        marginTop: '35px',
        margin: '30px 0',
    };

   const container2 = {
      position: 'relative',
      marginTop: '100px',
      width: '80%',
      paddingLeft: '15%',  
      height: '30%',
      wordWrap: 'break-word',// 父元素高度
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Arial, sans-serif', /* 可选：字体样式 */
      fontSize: '25px',
    };

    const container3 = {
      marginTop: '50px',
      width: '80%',
      paddingLeft: '15%',
      height: '300px',  
      wordWrap: 'break-word',// 父元素高度
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Arial, sans-serif', /* 可选：字体样式 */
      fontSize: '25px',
    };


    return (
      <>
        <div style={headlineStyle}>
          <p style={{ margin: 0 }}>GENESIS OF IDEAS</p>
          <p>INTERNATIONAL SCHOOL</p>
        </div>

        <div style={introductionStyle}>
          <p>9-12 Online School</p>     
        </div>

        <div style={container}>
            {language === 'zh' ? (
                    <p>
                        GIIS 是一所完全线上的全球化现代教育机构，致力于提供世界一流的教育，吸引来自世界各地的优秀学生。我们的教育模式打破了传统教育的地理限制，让学生能够随时随地获取顶尖的教育资源。
                    </p>
                ) : (
                    <p>
                        GIIS is a fully online, globalized modern institution dedicated to providing world-class education, attracting elite students from around the world. Our educational model breaks the geographical constraints of traditional education, allowing students to access top-notch educational resources anytime, anywhere.
                    </p>
                )}
          <div style={lineStyle}></div>
        </div>

        <div style={container2}>
           {/* {language === 'zh' ? (
                    <p>
                        我们的学校目前正在申请 Cognia 认证，Cognia 是一个全球知名的非营利组织，致力于通过严格的标准提升教育品质。这项认证工作反映了我们对实现教育卓越的不懈承诺。
                    </p>
                ) : (
                    <p>
                        Our school is currently in the process of applying for accreditation from Cognia, a globally recognized nonprofit organization dedicated to enhancing educational quality through rigorous standards. This accreditation effort reflects our unwavering commitment to achieving educational excellence.

                    </p>
                )} */}
         </div>
        <div style={container3}>
           {/* {language === 'zh' ? (
                    <p>
                        通过参与 Cognia 全面的评估过程，我们旨在不断改进并确保我们的教育实践符合国际标准，从而提升学生的学习环境和成果。
                    </p>
                ) : (
                    <p>
                        By engaging with Cognia's comprehensive evaluation process, we aim to continuously improve and ensure that our educational practices align with international standards, thereby enhancing the learning environment and outcomes for our students.

                    </p>
                )} */}
         </div>

        {/* <div style={containerStyle}>
          <img src={img} alt="Cognia" style={imageStyle} />
        </div> */}
      </>
   );
}

export default DiscoveryIntroduction;
