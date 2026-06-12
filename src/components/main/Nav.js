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
    const [openSection, setOpenSection] = useState(null);
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

    // Mobile menu mirrors the desktop dropdowns from the same siteStrings source,
    // grouped into sections so it reads as a hierarchy instead of a flat wall.
    const mobileSections = [
        { header: t.trustCenter, items: t.dropdownTrust },
        {
            header: t.academics,
            items: isEn
                ? [{ label: 'Course Catalog', to: '/academics' }, { label: 'Lesson Library', to: '/lessons' }, { label: 'All Pathways', to: '/pathways' }, { label: 'Academic Calendar', to: '/calendar' }]
                : [{ label: '课程目录', to: '/academics' }, { label: '课程库', to: '/lessons' }, { label: '学习路径', to: '/pathways' }, { label: '学校日历', to: '/calendar' }],
        },
        { header: t.admission, items: t.dropdownAdmission },
        { header: t.resources, items: t.dropdownResources },
        { header: t.students, items: t.dropdownStudents },
    ];

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
                                {mobileSections.map(sec => {
                                    const open = openSection === sec.header;
                                    return (
                                        <React.Fragment key={sec.header}>
                                            <li className={styles.mobileSectionHead}>
                                                <button
                                                    type="button"
                                                    className={styles.mobileSectionButton}
                                                    onClick={() => setOpenSection(open ? null : sec.header)}
                                                    aria-expanded={open}
                                                >
                                                    <span>{sec.header}</span>
                                                    <span className={styles.mobileChevron} style={{ transform: open ? 'rotate(180deg)' : 'none' }}>⌄</span>
                                                </button>
                                            </li>
                                            {open && sec.items.map(item => (
                                                <li key={`${item.to}-${item.label}`} className={styles.mobileSubItem}
                                                    onClick={() => go(item.to)}>
                                                    <Link to={item.to} onClick={e => e.preventDefault()}>{item.label}</Link>
                                                </li>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
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
                                <>
                                    <Link to="/login" className={`btn btn-link px-2 ${styles.topButton}`}
                                        style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        {isEn ? 'Log In' : '登入'}
                                    </Link>
                                    <Link to="/apply" className={`btn btn-sm px-3 ${styles.topButton}`}
                                        style={{ background: '#d5a836', color: '#1a1a2e', borderRadius: 6, fontWeight: 800 }}>
                                        {isEn ? 'Apply' : '立即申请'}
                                    </Link>
                                </>
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
                        {/* TRUST CENTER */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/trust-center">{t.trustCenter}</Link>
                            <ul className={styles.dropdown}>
                                {t.dropdownTrust.map(item => (
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
                                <Link to="/lessons" className={styles.megaCatalogLink}>
                                    ▶&nbsp;&nbsp;{isEn ? 'Lesson Library' : '课程库'}
                                </Link>
                                <Link to="/calendar" className={styles.megaCatalogLink}>
                                    🗓&nbsp;&nbsp;{isEn ? 'Academic Calendar' : '学校日历'}
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

                        {/* PARENT VIEW */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/trust-center">{t.resources}</Link>
                            <ul className={`${styles.dropdown} ${styles.dropdownRight}`}>
                                {t.dropdownResources.map(item => (
                                    <li key={item.label}>
                                        <Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {/* STUDENT PORTAL */}
                        <li className={styles.navItem}>
                            <Link className={styles.navLink} to="/welcome">{t.students}</Link>
                            <ul className={`${styles.dropdown} ${styles.dropdownRight}`}>
                                {t.dropdownStudents.map(item => (
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
                        {/* Not logged in — Apply is the primary CTA, Log In is secondary */}
                        {!isMobile && !studentSession && !parentSession && (
                            <li className={styles.navItem} style={{ padding: '0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Link to="/login"
                                    className={styles.topButton}
                                    style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, padding: '6px 10px', textDecoration: 'none', display: 'inline-block' }}>
                                    {isEn ? 'Log In' : '登入'}
                                </Link>
                                <Link to="/apply"
                                    className={styles.topButton}
                                    style={{ background: '#d5a836', color: '#1a1a2e', borderRadius: 6, fontWeight: 800, padding: '7px 18px', textDecoration: 'none', display: 'inline-block' }}>
                                    {isEn ? 'Apply' : '立即申请'}
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
