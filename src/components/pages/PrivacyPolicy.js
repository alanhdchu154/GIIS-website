import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy({ language }) {
  const isEn = language === 'en';
  const updated = '2026-04-22';

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Privacy Policy' : '隐私权政策'} | Genesis of Ideas International School</title>
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
        <h1 className="h3 mb-2">{isEn ? 'Privacy Policy' : '隐私权政策'}</h1>
        <p className="text-muted mb-4">{isEn ? `Last updated: ${updated}` : `最后更新：${updated}`}</p>

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
            <h2 className="h5 mt-4">我们搜集哪些资料</h2>
            <ul>
              <li>网站联络表单（你主动提供的姓名、Email、讯息内容）</li>
              <li>学生专区帐号资讯（Email 与密码杂凑）</li>
              <li>成绩单抬头资料（例如姓名、生日、监护人、住址等）</li>
              <li>成绩单课程与成绩资料（由你或管理者输入）</li>
            </ul>

            <h2 className="h5 mt-4">我们如何使用</h2>
            <ul>
              <li>提供网站内容并回复咨询</li>
              <li>帐号登入验证与保护学生专区</li>
              <li>建立、查阅与维护成绩单资料</li>
              <li>改善系统稳定性、安全性与使用体验</li>
            </ul>

            <h2 className="h5 mt-4">资料分享</h2>
            <p className="mb-2">
              我们不会贩售个人资料。仅在服务运作所需（例如主机/云端服务供应商）或依法令要求时才可能分享必要资讯。
            </p>

            <h2 className="h5 mt-4">资料安全</h2>
            <p className="mb-2">
              我们采取合理的技术措施保护资料，但任何传输或储存方式都无法保证 100% 安全。
            </p>

            <h2 className="h5 mt-4">你的权利</h2>
            <p className="mb-2">
              你可以向学校提出查询、更正或删除学生专区资料之需求。
            </p>

            <h2 className="h5 mt-4">联络方式</h2>
            <p className="mb-0">
              隐私相关问题请透过官网首页的联络资讯与学校联络。
            </p>
          </>
        )}
      </div>
    </>
  );
}

