import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function Footer({ language }) {
    const en = language === 'en';
    return (
        <footer className={styles.pageFooter}>
            <div className={styles.footerInner}>
              <div className={styles.footerCopy}>
                {en ? (
                  <>Copyright © {new Date().getFullYear()} Genesis of Ideas International School. All rights reserved.</>
                ) : (
                  <>版权所有 © {new Date().getFullYear()} Genesis of Ideas International School（艾迪尔国际学校）。保留所有权利。</>
                )}
              </div>
              <nav className={styles.footerLinks} aria-label={en ? 'Legal' : '法律资讯'}>
                <Link className={styles.footerLink} to="/privacy">
                  {en ? 'Privacy' : '隐私'}
                </Link>
                <span className={styles.sep} aria-hidden="true">
                  ·
                </span>
                <Link className={styles.footerLink} to="/terms">
                  {en ? 'Terms' : '条款'}
                </Link>
              </nav>
            </div>
        </footer>
    );
}
export default Footer;
