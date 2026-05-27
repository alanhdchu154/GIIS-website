import React, { useState, useEffect } from 'react';
import styles from './Nav.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { getNavStrings } from '../../i18n/siteStrings';
import { getStudentSession, getParentSession, clearStudentSession, clearParentSession } from '../../api/authStorage';
import { getApiBase } from '../../config/apiBase';

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
    const parentSession = getParentSession();
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

    async function handleLogout() {
        const API = getApiBase();
        if (studentSession) {
            clearStudentSession();
            if (API) await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        } else if (parentSession) {
            clearParentSession();
            if (API) await fetch(`${API}/api/parent/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        }
        navigate('/');
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
                                    <Link to="/discovery" onClick={e => e.preventDefault()}>{t.about}</Link>
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
                                <li onClick={() => go('/transfer-students')}>
                                    <Link to="/transfer-students" onClick={e => e.preventDefault()}>{isEn ? 'Transfer Students' : '转学生'}</Link>
                                </li>
                                <li onClick={() => go('/pricing')}>
                                    <Link to="/pricing" onClick={e => e.preventDefault()}>{isEn ? 'Tuition & Pricing' : '学费'}</Link>
                                </li>
                                <li onClick={() => go('/support')}>
                                    <Link to="/support" onClick={e => e.preventDefault()}>{t.resources}</Link>
                                </li>
                            </ul>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {studentSession ? (
                                <>
                                    <Link to="/learn" className={`btn btn-link px-2 ${styles.topButton}`}>
                                        {isEn ? 'My Courses' : '我的课程'}
                                    </Link>
                                    <Link to="/profile" className={`btn btn-link px-2 ${styles.topButton}`}>
                                        {isEn ? 'Profile' : '我的档案'}
                                    </Link>
                                    <button type="button" onClick={handleLogout} className={`btn btn-link px-2 ${styles.topButton}`}
                                        style={{ color: 'rgba(255,255,255,0.55)' }}>
                                        {isEn ? 'Log Out' : '登出'}
                                    </button>
                                </>
                            ) : parentSession ? (
                                <>
                                    <Link to="/parent/dashboard" className={`btn btn-link px-2 ${styles.topButton}`}>
                                        {isEn ? 'Parent Portal' : '家长中心'}
                                    </Link>
                                    <button type="button" onClick={handleLogout} className={`btn btn-link px-2 ${styles.topButton}`}
                                        style={{ color: 'rgba(255,255,255,0.55)' }}>
                                        {isEn ? 'Log Out' : '登出'}
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className={`btn btn-sm px-3 ${styles.topButton}`}
                                    style={{ background: '#1a73e8', color: '#fff', borderRadius: 6, fontWeight: 600 }}>
                                    {isEn ? 'Log In' : '登入'}
                                </Link>
                            )}
                            {toggleLanguage && (
                                <button type="button" onClick={toggleLanguage} aria-label={t.langToggleAria}
                                    className={styles.topButton}
                                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    🌐 {language === 'en' ? '中文' : 'EN'}
                                </button>
                            )}
                        </div>
                    </>
                )}

                <div className="collapse navbar-collapse">
                    <ul className={`navbar-nav ${styles.desktopNav}`}>
                        {/* ABOUT */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/discovery">{t.about}</Link>
                            <ul className={styles.dropdown}>
                                {t.dropdownAbout.map(item => (
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

                        {/* RESOURCES */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/support">{t.resources}</Link>
                            <ul className={`${styles.dropdown} ${styles.dropdownRight}`}>
                                {t.dropdownResources.map(item => (
                                    <li key={item.label}>
                                        <Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {/* Language toggle */}
                        {!isMobile && toggleLanguage && (
                            <li className={styles.navItem} style={{ padding: '0 8px' }}>
                                <button type="button" onClick={toggleLanguage} aria-label={t.langToggleAria}
                                    className={styles.topButton}
                                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    🌐 {language === 'en' ? '中文' : 'EN'}
                                </button>
                            </li>
                        )}
                        {/* Logged-in: student */}
                        {!isMobile && studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/learn" className={`${styles.navLink} ${styles.topButton}`}>
                                    {isEn ? 'My Courses' : '我的课程'}
                                </Link>
                            </li>
                        )}
                        {!isMobile && studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/profile" className={`${styles.navLink} ${styles.topButton}`}>
                                    {isEn ? 'Profile' : '我的档案'}
                                </Link>
                            </li>
                        )}
                        {!isMobile && studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <button type="button" onClick={handleLogout}
                                    className={`${styles.navLink} ${styles.topButton}`}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}>
                                    {isEn ? 'Log Out' : '登出'}
                                </button>
                            </li>
                        )}
                        {/* Logged-in: parent */}
                        {!isMobile && parentSession && !studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/parent/dashboard" className={`${styles.navLink} ${styles.topButton}`}>
                                    {isEn ? 'Parent Portal' : '家长中心'}
                                </Link>
                            </li>
                        )}
                        {!isMobile && parentSession && !studentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <button type="button" onClick={handleLogout}
                                    className={`${styles.navLink} ${styles.topButton}`}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}>
                                    {isEn ? 'Log Out' : '登出'}
                                </button>
                            </li>
                        )}
                        {/* Not logged in */}
                        {!isMobile && !studentSession && !parentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px' }}>
                                <Link to="/login"
                                    className={styles.topButton}
                                    style={{ background: '#1a73e8', color: '#fff', borderRadius: 6, fontWeight: 600, padding: '6px 16px', textDecoration: 'none', display: 'inline-block' }}>
                                    {isEn ? 'Log In' : '登入'}
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
