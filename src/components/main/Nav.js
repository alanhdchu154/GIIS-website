import React, { useState, useEffect } from 'react';
import styles from './Nav.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { getNavStrings } from '../../i18n/siteStrings';
import { getStudentSession } from '../../api/authStorage';

const PATHWAY_CATEGORIES = [
  {
    label: 'STEM & Science',
    labelZh: 'STEM与理科',
    pathways: [
      { label: 'CS & Engineering',      zh: '计算机科学',    emoji: '💻', to: '/pathways/cs' },
      { label: 'Engineering Science',   zh: '工程科学',      emoji: '⚙️', to: '/pathways/engineering' },
      { label: 'Math & Data Science',   zh: '数学与数据',    emoji: '📐', to: '/pathways/math' },
    ],
  },
  {
    label: 'Business & Global',
    labelZh: '商业与全球',
    pathways: [
      { label: 'Business & Marketing',  zh: '商业与营销',    emoji: '📊', to: '/pathways/business' },
      { label: 'Economics & Finance',   zh: '经济与金融',    emoji: '📈', to: '/pathways/economics' },
    ],
  },
  {
    label: 'Psychology & Arts',
    labelZh: '心理与艺术',
    pathways: [
      { label: 'Psychology',            zh: '心理学',        emoji: '🧠', to: '/pathways/psychology' },
      { label: 'Communications',        zh: '传播与媒体',    emoji: '📡', to: '/pathways/communications' },
      { label: 'Arts & Design',         zh: '艺术与设计',    emoji: '🎨', to: '/pathways/arts' },
    ],
  },
];

function Nav({ language, toggleLanguage }) {
    const t = getNavStrings(language);
    const studentSession = getStudentSession();
    const isEn = language !== 'zh';
    const [isNavSticky, setIsNavSticky] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1000);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsNavSticky(window.pageYOffset > 150);
        const handleResize = () => setIsMobile(window.innerWidth <= 1000);
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    function go(path) {
        navigate(path);
        setIsCollapsed(true);
    }

    return (
        <nav className={`navbar navbar-expand-lg ${isNavSticky ? 'fixed-top' : ''} ${styles.customBackground}`}>
            <div className="container-fluid">
                <button className="navbar-toggler" type="button"
                    onClick={() => setIsCollapsed(c => !c)}
                    aria-controls="navbarMenu" aria-expanded={!isCollapsed} aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                {isMobile && (
                    <>
                        <div className={`collapse navbar-collapse ${!isCollapsed ? 'show' : ''} ${styles.mobileMenu}`}>
                            <ul className={styles.mobileItems}>
                                <li onClick={() => go('/discovery')}>
                                    <Link to="/discovery" onClick={e => e.preventDefault()}>{t.discovery}</Link>
                                </li>
                                <li onClick={() => go('/academics')}>
                                    <Link to="/academics" onClick={e => e.preventDefault()}>{t.academics}</Link>
                                </li>
                                <li onClick={() => go('/pathways')}>
                                    <Link to="/pathways" onClick={e => e.preventDefault()}>
                                        {isEn ? 'All Pathways' : '学习路径'}
                                    </Link>
                                </li>
                                <li onClick={() => go('/admission')}>
                                    <Link to="/admission" onClick={e => e.preventDefault()}>{t.admission}</Link>
                                </li>
                                <li onClick={() => go('/pricing')}>
                                    <Link to="/pricing" onClick={e => e.preventDefault()}>{isEn ? 'Tuition & Pricing' : '学费'}</Link>
                                </li>
                                <li onClick={() => go('/support')}>
                                    <Link to="/support" onClick={e => e.preventDefault()}>{t.support}</Link>
                                </li>
                            </ul>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <a href="https://moodles.genesisideas.school" target="_blank" rel="noopener noreferrer"
                                className={`btn btn-link px-2 ${styles.topButton}`}>
                                Moodle
                            </a>
                            {toggleLanguage && (
                                <button type="button" className={`btn btn-link px-2 ${styles.topButton}`}
                                    onClick={toggleLanguage} aria-label={t.langToggleAria}>
                                    {language === 'en' ? '中文' : 'English'}
                                </button>
                            )}
                        </div>
                    </>
                )}

                <div className="collapse navbar-collapse">
                    <ul className={`navbar-nav ${styles.desktopNav}`}>
                        {/* DISCOVERY */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/discovery">{t.discovery}</Link>
                            <ul className={styles.dropdown}>
                                {t.dropdownDiscovery.map(item => (
                                    <li key={item.label}>
                                        <Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {/* ACADEMICS — mega menu */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/academics">{t.academics}</Link>
                            <div className={styles.megaMenu}>
                                <Link to="/academics" className={styles.megaCatalogLink}>
                                    📋&nbsp;&nbsp;{isEn ? 'Course Catalog' : '课程目录'}
                                </Link>
                                <p className={styles.megaSection}>
                                    {isEn ? 'PATHWAYS' : '学习路径'}
                                </p>
                                <div className={styles.megaGrid}>
                                    {PATHWAY_CATEGORIES.map(cat => (
                                        <div key={cat.label} className={styles.megaCol}>
                                            <p className={styles.megaColLabel}>
                                                {isEn ? cat.label : cat.labelZh}
                                            </p>
                                            {cat.pathways.map(p => (
                                                <Link key={p.to} to={p.to} className={styles.megaPathLink}>
                                                    {p.emoji}&nbsp;{isEn ? p.label : p.zh}
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <Link to="/pathways" className={styles.megaAllLink}>
                                    {isEn ? 'View all 8 pathways →' : '查看全部 8 条路径 →'}
                                </Link>
                            </div>
                        </li>

                        {/* ADMISSION */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/admission">{t.admission}</Link>
                            <ul className={styles.dropdown}>
                                {t.dropdownAdmission.map(item => (
                                    <li key={item.label}>
                                        <Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {/* STUDENT SUPPORT */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/support">{t.support}</Link>
                            <ul className={`${styles.dropdown} ${styles.dropdownRight}`}>
                                {t.dropdownSupport.map(item => (
                                    <li key={item.label}>
                                        <Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {/* Language toggle + Login */}
                        {!isMobile && toggleLanguage && (
                            <li className={styles.navItem} style={{ padding: '0 8px' }}>
                                <button type="button"
                                    className={`btn btn-link ${styles.navLink} ${styles.topButton}`}
                                    onClick={toggleLanguage} aria-label={t.langToggleAria}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    {language === 'en' ? '中文' : 'English'}
                                </button>
                            </li>
                        )}
                        {!isMobile && studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/learn" className={`${styles.navLink} ${styles.topButton}`}>
                                    {language === 'en' ? 'My Courses' : '我的课程'}
                                </Link>
                            </li>
                        )}
                        {!isMobile && studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/profile" className={`${styles.navLink} ${styles.topButton}`}>
                                    {language === 'en' ? 'Profile' : '我的档案'}
                                </Link>
                            </li>
                        )}
                        {!isMobile && !studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/login" className={`${styles.navLink} ${styles.topButton}`}>
                                    {language === 'en' ? 'Sign In' : '登录'}
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Nav;
