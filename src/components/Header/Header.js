import React from 'react';
import logo_slogan from '../../img/logo_slogan.png';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import { getNavStrings } from '../../i18n/siteStrings';

function Header({ language,toggleLanguage }) {
    const t = getNavStrings(language);

    return (
        <header className={`${styles.header}`}>
            {/* First row for logo and buttons */}
            <div className="row align-items-center">
                <div className="col-10 d-flex align-items-center">
                    <Link to="/">
                        <img src={logo_slogan} alt="Genesis of Ideas International School logo" className={`img-fluid ${styles.logoImage}`} />
                    </Link>
                </div>
                <div className= "col-2 d-flex justify-content-center flex-wrap gap-1" >
                    {/* <Link to="/contact" className="btn btn-link px-2">Contact Us</Link> */}
                    <Link to="/login" className={`btn btn-link px-2 ${styles.button}`}>{t.signIn}</Link>
                </div>
            </div> 
        </header>
    );
}

export default Header;
