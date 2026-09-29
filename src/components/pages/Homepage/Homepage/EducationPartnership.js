import React from 'react';
import schoolLogo from '../../../../img/logo_slogan.png';
import geniusLogo from '../../../../img/genius-logo.png';
import styles from './EducationPartnership.module.css';

export default function EducationPartnership({ language = 'en' }) {
  const en = language !== 'zh';
  return (
    <section id="education-partner" className={styles.section} aria-labelledby="education-partner-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{en ? 'Education & university planning' : '教育与升学规划合作'}</p>
        <div className={styles.brands}>
          <img className={styles.schoolLogo} src={schoolLogo} width="1468" height="206" alt="Genesis of Ideas International School" loading="lazy" />
          <span className={styles.times} aria-hidden="true">×</span>
          <img className={styles.geniusLogo} src={geniusLogo} width="869" height="213" alt={en ? 'Genius Academy' : '杰尼教育 Genius Academy'} loading="lazy" />
        </div>
        <div className={styles.layout}>
          <div className={styles.intro}>
            <h2 id="education-partner-title">{en ? 'Plan beyond graduation.' : '从高中学习，走向更广阔的世界。'}</h2>
            <p className={styles.lead}>{en
              ? 'A thoughtful education plan looks beyond the next qualification. GIIS partners with Genius Academy to connect families worldwide with personal study-abroad planning and university application advisory.'
              : '好的教育规划，不止于下一张文凭。GIIS 携手杰尼教育，为全球家庭连接个性化留学规划与大学申请顾问服务。'}</p>
            <ul className={styles.pathways} aria-label={en ? 'Advisory pathways' : '顾问服务方向'}>
              {(en ? ['Undergraduate', 'Master’s', 'University transfer'] : ['本科申请', '硕士申请', '大学转学']).map(item => <li key={item}>{item}</li>)}
            </ul>
            <a className={styles.cta} href={en ? 'https://genius.genesisideas.school/en' : 'https://genius.genesisideas.school/'}>
              {en ? 'Explore personal university planning' : '了解私人升学规划'} <span aria-hidden="true">↗</span>
            </a>
            <p className={styles.destination}>{en ? 'Discover the approach at Genius Academy' : '前往杰尼教育，了解服务方式'}</p>
          </div>
          <div className={styles.roles}>
            <div>
              <p className={styles.roleLabel}>{en ? 'The school' : '学校教育'}</p>
              <h3>GIIS</h3>
              <p>{en ? 'High school education, coursework and academic records, with visibility into learning progress for families.' : '提供高中教育、课程学习与学籍记录，让家庭看见学习进度。'}</p>
            </div>
            <div>
              <p className={styles.roleLabel}>{en ? 'The advisory partner' : '升学顾问'}</p>
              <h3>{en ? 'Genius Academy' : '杰尼教育'}</h3>
              <p>{en ? 'Study-abroad planning and application guidance, shaped around the student’s goals, academic background and intended destinations.' : '围绕学生目标、学术背景与意向国家，提供留学规划及申请指导。'}</p>
            </div>
          </div>
        </div>
        <p className={styles.note}>{en
          ? 'Additional advisory services are agreed and priced separately; they are not automatically included in GIIS tuition. Each university makes its own admissions decisions.'
          : '额外顾问服务的范围与费用须另行确认，不自动包含在 GIIS 学费内。录取决定由各院校独立作出。'}</p>
      </div>
    </section>
  );
}
