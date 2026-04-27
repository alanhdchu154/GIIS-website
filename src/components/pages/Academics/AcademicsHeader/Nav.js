import React, { useState, useEffect } from 'react';
import styles from './Nav.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { getNavStrings } from '../../../../i18n/siteStrings';

function Nav({ language }) {
    const t = getNavStrings(language);
    const [isNavSticky, setIsNavSticky] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true); 
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPosition = window.pageYOffset;
            setIsNavSticky(currentScrollPosition > 150);
        };

        const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
       };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleNavbar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <nav className={`navbar navbar-expand-lg ${isNavSticky ? 'fixed-top' : ''} ${styles.customBackground}`}>
           <div className={`container-fluid ${styles.navContainer}`}>
             <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarLeftMenu" aria-controls="navbarLeftMenu" aria-expanded={!isCollapsed} aria-label="Toggle navigation" onClick={toggleNavbar}>
              <span className="navbar-toggler-icon"></span>
             </button>

             {isMobile && (
             <div className={`collapse navbar-collapse ${!isCollapsed ? 'show' : ''} ${styles.leftSlideMenu}`} id="navbarLeftMenu">
              <ul className={styles.leftSlideItems}>
                <li onClick={() => navigate("/discovery")}>
                   <Link to="/discovery" onClick={(e) => e.preventDefault()}>
                    {t.discovery}
                   </Link>
                </li>
                <li onClick={() => navigate("/academics")}>
                  <Link to="/academics" onClick={(e) => e.preventDefault()}>
                    {t.academics}
                  </Link>
                </li>
                <li onClick={() => navigate("/pathways/psychology")}>
                  <Link to="/pathways/psychology" onClick={(e) => e.preventDefault()}>
                    {language === 'en' ? 'Psychology Pathway' : '心理学路径'}
                  </Link>
                </li>
                <li onClick={() => navigate("/admission")}>
                    <Link to="/admission" onClick={(e) => e.preventDefault()}>
                        {t.admission}
                    </Link>
                </li>
                <li onClick={() => navigate("/support")}>
                    <Link to="/support" onClick={(e) => e.preventDefault()}>
                        {t.support}
                    </Link>
                </li>
               </ul>
              </div>
              )}
                        
              <div className={`collapse navbar-collapse ${isCollapsed ? '' : ''}`}>
               <ul className={`navbar-nav ${styles.customnavbar}`}>
                <li className={styles.navitem}>
                  <Link className={styles.navLink} to="/discovery">{t.discovery}</Link>
                  <ul className={styles.dropdownMenu}>
                    {t.dropdownDiscovery.map((item) => (
                      <li key={item.label}><Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link></li>
                    ))}
                  </ul>
                </li>
                <li className={styles.navitem}>
                  <Link className={styles.navLink} to="/academics">{t.academics}</Link>
                  <ul className={styles.dropdownMenu}>
                    {t.dropdownAcademics.map((item) => (
                      <li key={item.label}><Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link></li>
                    ))}
                  </ul>
                </li>
                <li className={styles.navitem}>
                   <Link className={styles.navLink} to="/admission">{t.admission}</Link>
                   <ul className={styles.dropdownMenu}>
                     {t.dropdownAdmission.map((item) => (
                       <li key={item.label}><Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link></li>
                     ))}
                   </ul>
                </li>
                <li className={styles.navitem}>
                   <Link className={styles.navLink} to="/support">{t.support}</Link>
                   <ul className={styles.dropdownMenu2}>
                     {t.dropdownSupport.map((item) => (
                       <li key={item.label}><Link to={item.to} style={{ color: 'inherit', textDecoration: 'none' }}>{item.label}</Link></li>
                     ))}
                   </ul>
                </li>
               </ul>
              </div>
           </div>
         </nav>
    );
}

export default Nav;
