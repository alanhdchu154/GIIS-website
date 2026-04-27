import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy({ language }) {
  const isEn = language === 'en';
  const updated = '2026-04-22';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Privacy Policy' : '隱私權政策'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={
            isEn
              ? 'Privacy policy for the Genesis of Ideas International School website and student portal.'
              : '艾迪尔国际学校网站与学生专区之隐私权政策。'
          }
        />
        <link rel="canonical" href="https://genesisideas.school/privacy" />
      </Helmet>

      <div className="container py-5" style={{ maxWidth: 920 }}>
        <h1 className="h3 mb-2">{isEn ? 'Privacy Policy' : '隱私權政策'}</h1>
        <p className="text-muted mb-4">{isEn ? `Last updated: ${updated}` : `最後更新：${updated}`}</p>

        {isEn ? (
          <>
            <h2 className="h5 mt-4">What we collect</h2>
            <ul>
              <li>Contact form submissions (name, email, and message content if you choose to provide them)</li>
              <li>Student portal account information (email and password hash)</li>
              <li>Transcript profile fields you enter (e.g., name, birth date, guardian, address)</li>
              <li>Transcript course and grade data you or an administrator enter</li>
            </ul>

            <h2 className="h5 mt-4">How we use information</h2>
            <ul>
              <li>To provide website content and respond to inquiries</li>
              <li>To authenticate accounts and protect the student portal</li>
              <li>To create, view, and maintain transcript records</li>
              <li>To improve reliability, security, and user experience</li>
            </ul>

            <h2 className="h5 mt-4">Sharing</h2>
            <p className="mb-2">
              We do not sell personal information. We may share information only when required to operate the service
              (for example, hosting providers) or when required by law.
            </p>

            <h2 className="h5 mt-4">Security</h2>
            <p className="mb-2">
              We use reasonable technical measures to protect data. No method of transmission or storage is 100%
              secure.
            </p>

            <h2 className="h5 mt-4">Your choices</h2>
            <p className="mb-2">
              You may request access, correction, or deletion of your student portal data by contacting the school.
            </p>

            <h2 className="h5 mt-4">Contact</h2>
            <p className="mb-0">
              For privacy questions, contact the school via the information on the website home page.
            </p>
          </>
        ) : (
          <>
            <h2 className="h5 mt-4">我們蒐集哪些資料</h2>
            <ul>
              <li>網站聯絡表單（你主動提供的姓名、Email、訊息內容）</li>
              <li>學生專區帳號資訊（Email 與密碼雜湊）</li>
              <li>成績單抬頭資料（例如姓名、生日、監護人、住址等）</li>
              <li>成績單課程與成績資料（由你或管理者輸入）</li>
            </ul>

            <h2 className="h5 mt-4">我們如何使用</h2>
            <ul>
              <li>提供網站內容並回覆諮詢</li>
              <li>帳號登入驗證與保護學生專區</li>
              <li>建立、查閱與維護成績單資料</li>
              <li>改善系統穩定性、安全性與使用體驗</li>
            </ul>

            <h2 className="h5 mt-4">資料分享</h2>
            <p className="mb-2">
              我們不會販售個人資料。僅在服務運作所需（例如主機/雲端服務供應商）或依法令要求時才可能分享必要資訊。
            </p>

            <h2 className="h5 mt-4">資料安全</h2>
            <p className="mb-2">
              我們採取合理的技術措施保護資料，但任何傳輸或儲存方式都無法保證 100% 安全。
            </p>

            <h2 className="h5 mt-4">你的權利</h2>
            <p className="mb-2">
              你可以向學校提出查詢、更正或刪除學生專區資料之需求。
            </p>

            <h2 className="h5 mt-4">聯絡方式</h2>
            <p className="mb-0">
              隱私相關問題請透過官網首頁的聯絡資訊與學校聯絡。
            </p>
          </>
        )}
      </div>
    </>
  );
}

