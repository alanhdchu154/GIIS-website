import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function NotFound({ language }) {
  const isEn = language === 'en';
  return (
    <>
      <Helmet>
        <title>
          {isEn ? 'Page not found' : '找不到页面'} | Genesis of Ideas International School
        </title>
        <meta name="description" content={isEn ? 'The page you requested does not exist.' : '您要找的页面不存在。'} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="container py-5 text-center">
        <h1 className="display-4">404</h1>
        <p className="lead mb-4">
          {isEn ? 'We could not find that page.' : '找不到此页面。'}
        </p>
        <Link to="/" className="btn btn-primary">
          {isEn ? 'Back to home' : '返回首页'}
        </Link>
      </div>
    </>
  );
}

export default NotFound;
