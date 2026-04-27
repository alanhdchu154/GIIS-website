import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function TermsOfUse({ language }) {
  const isEn = language === 'en';
  const updated = '2026-04-22';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Terms of Use' : '使用條款'} | Genesis of Ideas International School</title>
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
        <h1 className="h3 mb-2">{isEn ? 'Terms of Use' : '使用條款'}</h1>
        <p className="text-muted mb-4">{isEn ? `Last updated: ${updated}` : `最後更新：${updated}`}</p>

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
            <h2 className="h5 mt-4">網站內容</h2>
            <p className="mb-2">
              本網站提供資訊用途。學校可能隨時更新內容。
            </p>

            <h2 className="h5 mt-4">學生專區</h2>
            <ul>
              <li>請妥善保管帳號密碼並保持機密。</li>
              <li>學生可查看成績單資料；只有經授權的管理者可編輯正式紀錄。</li>
              <li>不得嘗試干擾系統運作或繞過安全控管。</li>
            </ul>

            <h2 className="h5 mt-4">使用規範</h2>
            <p className="mb-2">
              你不得將本網站用於違法行為、濫用自動化程式、或提交不實資訊。
            </p>

            <h2 className="h5 mt-4">免責聲明</h2>
            <p className="mb-2">
              本網站與服務以「現狀」提供，不提供任何明示或默示保證。服務可能因維護或技術因素暫停或變更。
            </p>

            <h2 className="h5 mt-4">聯絡方式</h2>
            <p className="mb-0">如有疑問，請使用官網聯絡資訊與學校聯絡。</p>
          </>
        )}
      </div>
    </>
  );
}

