import React, { useRef, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './Testimonial.module.css';
import { getTestimonialCopy } from '../../../../i18n/siteStrings';

import student1 from '../../../../img/Homepage/StuPhoto/student1.png';
import student2 from '../../../../img/Homepage/StuPhoto/student2.png';
import student3 from '../../../../img/Homepage/StuPhoto/student3.png';
import student4 from '../../../../img/Homepage/StuPhoto/student4.png';
import student5 from '../../../../img/Homepage/StuPhoto/student5.png';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Li Wei Zhang',
    comment: 'Participating in this program has profoundly impacted my career trajectory. The hands-on projects and real-world applications taught here have enabled me to excel in my role as a data scientist at a leading tech firm.',
    commentZh: '参与本项目深刻影响了我的职业路径。这里的实战项目与真实场景训练，使我在顶尖科技公司担任数据科学家时能够脱颖而出。',
    photoUrl: student1,
  },
  {
    id: 2,
    name: 'Suki Kim',
    comment: 'The comprehensive curriculum bridged my academic knowledge with practical skills. The mentorship program opened doors I never anticipated.',
    commentZh: '完整的课程体系将学术知识与实务能力衔接起来。导师计划为我打开了意想不到的机会。',
    photoUrl: student2,
  },
  {
    id: 3,
    name: 'Ananya Rao',
    comment: 'The supportive faculty fostered an environment that encouraged exploration and innovation, which helped me develop a critical analytical mindset invaluable in my entrepreneurial ventures.',
    commentZh: '支持性的师资营造了鼓励探索与创新的环境，帮助我建立批判性分析思维，对创业之路弥足珍贵。',
    photoUrl: student3,
  },
  {
    id: 4,
    name: 'Chen Yu Yan',
    comment: 'The knowledge and support from the teaching staff were phenomenal. Their expertise provided a well-rounded education and they were always available for guidance.',
    commentZh: '教师团队给予的知识与支持非常出色，随时提供指导，让我在学习过程中始终方向明确。',
    photoUrl: student4,
  },
  {
    id: 5,
    name: 'Haruto Takahashi',
    comment: 'The skills I developed here — especially in innovative problem-solving and strategic planning — have greatly propelled my career in technology management.',
    commentZh: '我在这里培养的能力，特别是在创新解题与策略规划方面，大幅推进了我在科技管理领域的职涯。',
    photoUrl: student5,
  },
];

export default function Testimonial({ language = 'en' }) {
  const sliderRef = useRef();
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 736);
  const ui = getTestimonialCopy(language);
  const isEn = language === 'en';

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 736);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
  };

  const textOf = (item) => (isEn ? item.comment : item.commentZh);

  return (
    <div className={styles.testimonialContainer}>
      <div className={styles.inner}>
        <p className={styles.heading}>{isEn ? 'Student Voices' : '学生心声'}</p>
        <h2 className={styles.title}>{ui.title}</h2>

        {!isMobile ? (
          <div className={styles.sliderWrap}>
            <Slider ref={sliderRef} {...settings}>
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className={styles.testimonialItem}>
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <img src={t.photoUrl} alt={t.name} className={styles.testimonialPhoto} loading="lazy" decoding="async" />
                      <div className={styles.nameBlock}>
                        <p className={styles.name}>{t.name}</p>
                        <p className={styles.stars}>★★★★★</p>
                      </div>
                    </div>
                    <p className={styles.quote}>"{textOf(t)}"</p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <div className={styles.staticList}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className={styles.listItem}
                onClick={() => setSelectedTestimonial(t)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTestimonial(t); } }}
                role="button"
                tabIndex={0}
              >
                <img src={t.photoUrl} alt={t.name} className={styles.photo} loading="lazy" decoding="async" />
                <p className={styles.nameStyle}>{t.name}</p>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>→</span>
              </div>
            ))}
          </div>
        )}

        {selectedTestimonial && (
          <div className={styles.modal} onClick={() => setSelectedTestimonial(null)} role="presentation">
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className={styles.cardHeader}>
                <img src={selectedTestimonial.photoUrl} alt={selectedTestimonial.name} className={styles.photo} />
                <div className={styles.nameBlock}>
                  <p className={styles.name}>{selectedTestimonial.name}</p>
                  <p className={styles.stars}>★★★★★</p>
                </div>
              </div>
              <p className={styles.commentStyle}>"{textOf(selectedTestimonial)}"</p>
              <button type="button" className={styles.closeButton} onClick={() => setSelectedTestimonial(null)}>
                {ui.close}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
