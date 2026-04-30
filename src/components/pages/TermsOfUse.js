import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function TermsOfUse({ language }) {
  const isEn = language === 'en';
  const updated = '2026-04-22';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Terms of Use' : '使用条款'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={
            isEn
              ? 'Terms of use for the Genesis of Ideas International School website and student portal.'
              : '艾迪尔国际学校网站与学生专区之使用条款。'
          }
        />
        <link rel="canonical" href="https://genesisideas.school/terms" />
      </Helmet>

      <div className="container py-5" style={{ maxWidth: 920 }}>
        <h1 className="h3 mb-2">{isEn ? 'Terms of Use' : '使用条款'}</h1>
        <p className="text-muted mb-4">{isEn ? `Last updated: ${updated}` : `最后更新：${updated}`}</p>

        {isEn ? (
          <>
            <h2 className="h5 mt-4">Website content</h2>
            <p className="mb-2">
              This website is provided for informational purposes. The school may update content at any time.
            </p>

            <h2 className="h5 mt-4">Student portal</h2>
            <ul>
              <li>Keep your login credentials confidential.</li>
              <li>Students may view their transcript data; only authorized administrators may edit official records.</li>
              <li>You agree not to attempt to disrupt or bypass security controls.</li>
            </ul>

            <h2 className="h5 mt-4">Acceptable use</h2>
            <p className="mb-2">
              You may not use the site for unlawful activity, automated abuse, or to submit false information.
            </p>

            <h2 className="h5 mt-4">Disclaimers</h2>
            <p className="mb-2">
              The site and services are provided “as is” without warranties. Availability may change due to maintenance
              or technical issues.
            </p>

            <h2 className="h5 mt-4">Contact</h2>
            <p className="mb-0">For questions, contact the school using the information on the website.</p>
          </>
        ) : (
          <>
            <h2 className="h5 mt-4">网站内容</h2>
            <p className="mb-2">
              本网站提供资讯用途。学校可能随时更新内容。
            </p>

            <h2 className="h5 mt-4">学生专区</h2>
            <ul>
              <li>请妥善保管帐号密码并保持机密。</li>
              <li>学生可查看成绩单资料；只有经授权的管理者可编辑正式纪录。</li>
              <li>不得尝试干扰系统运作或绕过安全控管。</li>
            </ul>

            <h2 className="h5 mt-4">使用规范</h2>
            <p className="mb-2">
              你不得将本网站用于违法行为、滥用自动化程式、或提交不实资讯。
            </p>

            <h2 className="h5 mt-4">免责声明</h2>
            <p className="mb-2">
              本网站与服务以「现状」提供，不提供任何明示或默示保证。服务可能因维护或技术因素暂停或变更。
            </p>

            <h2 className="h5 mt-4">联络方式</h2>
            <p className="mb-0">如有疑问，请使用官网联络资讯与学校联络。</p>
          </>
        )}
      </div>
    </>
  );
}

