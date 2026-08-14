import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { getAdminSession, getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from '../Admin/AdminChrome';
import logoUrl from '../../../img/logo_nobg.png';
import sealUrl from '../../../img/transcript_seal_transparent.png';
import './enrollment-verification.css';

const API = getApiBase();
const DOCUMENT_WIDTH = 816;
const DOCUMENT_HEIGHT = 1056;

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function safeFilename(value) {
  return String(value || 'Student').replace(/[\\/:*?"<>|]/g, '-');
}

function Certificate({ document, bilingual, documentRef }) {
  const school = document.school;
  return (
    <article ref={documentRef} className="enrollment-document" aria-label="Official enrollment verification">
      <div className="enrollment-document-frame" />
      <header className="enrollment-document-header">
        <img src={logoUrl} alt="GIIS" className="enrollment-document-logo" />
        <div className="enrollment-document-school">
          <p>{school.name}</p>
          <span>{school.address}</span>
          <span>{school.phone} | {school.email}</span>
        </div>
        <div className="enrollment-document-badge">OFFICIAL</div>
      </header>

      <div className="enrollment-document-rule" />
      <section className="enrollment-document-title">
        <p>Student Records Office</p>
        <h1>Enrollment Verification</h1>
        {bilingual && <h2>在学证明</h2>}
      </section>

      <section className="enrollment-document-meta">
        <div><span>Document ID</span><strong>{document.documentId || 'Issued upon generation'}</strong></div>
        <div><span>Issue Date</span><strong>{formatDate(document.issuedOn)}</strong></div>
        <div><span>Valid Through</span><strong>{formatDate(document.validThrough)}</strong></div>
      </section>

      <section className="enrollment-document-body">
        <p>To Whom It May Concern:</p>
        <p>
          This letter certifies that the student identified below is currently enrolled at
          Genesis of Ideas International School as of the issue date shown above.
        </p>
        {bilingual && (
          <p className="enrollment-document-translation">
            本函证明下列学生于上述签发日期为 Genesis of Ideas International School 正式在读学生。
          </p>
        )}

        <dl className="enrollment-document-fields">
          <div><dt>Student Legal Name</dt><dd>{document.studentName}</dd></div>
          <div><dt>GIIS Student ID</dt><dd>{document.studentCode}</dd></div>
          {document.gradeLevel && <div><dt>Current Grade Level</dt><dd>Grade {document.gradeLevel}</dd></div>}
          <div><dt>Official Entry Date</dt><dd>{formatDate(document.entryDate)}</dd></div>
          <div><dt>Enrollment Status</dt><dd>Active</dd></div>
          <div><dt>Instructional Mode</dt><dd>{document.enrollmentMode}</dd></div>
        </dl>

        <p>
          GIIS is a Florida-registered private school operating under Florida Statute 1002.42.
          The school maintains the student's enrollment and academic records.
        </p>
        {bilingual && (
          <p className="enrollment-document-translation">
            GIIS 是依据 Florida Statute 1002.42 注册的 Florida 私立学校，并保存该学生的入学与学业记录。
          </p>
        )}
        <p className="enrollment-document-boundary">
          This document confirms current enrollment only. It does not certify attendance,
          academic standing, earned credits, graduation eligibility, accreditation, identity,
          age, or authorization to work.
        </p>
        {bilingual && (
          <p className="enrollment-document-translation enrollment-document-translation-boundary">
            本文件仅证明当前在读状态，不证明出勤、成绩、已获学分、毕业资格、认证状态、身份、年龄或工作许可。
          </p>
        )}
      </section>

      <footer className="enrollment-document-footer">
        <div className="enrollment-document-signature">
          <img src={sealUrl} alt="Official school seal" />
          <div>
            <span className="enrollment-document-signature-line" />
            <strong>{school.principalName}</strong>
            <span>{school.principalTitle}</span>
            <small>Electronically issued by the GIIS Student Records Office</small>
          </div>
        </div>
        <div className="enrollment-document-verify">
          {document.verificationUrl ? (
            <QRCodeSVG value={document.verificationUrl} size={82} bgColor="#ffffff" fgColor="#2b3d6d" level="M" />
          ) : <div className="enrollment-document-qr-placeholder" />}
          <strong>Verify this document</strong>
          <span>{document.verificationUrl ? 'Scan the QR code' : 'QR added when issued'}</span>
        </div>
      </footer>

      <div className="enrollment-document-bottom">
        <span>{school.website.replace('https://', '')}</span>
        <span>{school.registration}</span>
      </div>
    </article>
  );
}

function PageBody({ language, isAdmin, studentId }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const documentRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [issued, setIssued] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [bilingual, setBilingual] = useState(language === 'zh');
  const [scale, setScale] = useState(1);

  const endpointSuffix = isAdmin ? `/${encodeURIComponent(studentId)}` : '';

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = !isAdmin ? localStorage.getItem('giis_student_token') : '';
    try {
      const response = await fetch(`${API}/api/enrollment-verification/status${endpointSuffix}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        navigate(isAdmin ? '/admin/login' : '/login', { replace: true });
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Enrollment status could not be loaded.');
      setStatus(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [endpointSuffix, isAdmin, navigate]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    const updateScale = () => {
      const available = Math.max(280, window.innerWidth - (isAdmin ? 72 : 32));
      setScale(Math.min(1, available / DOCUMENT_WIDTH));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isAdmin]);

  async function issueDocument() {
    setIssuing(true);
    setError('');
    const token = !isAdmin ? localStorage.getItem('giis_student_token') : '';
    try {
      const response = await fetch(`${API}/api/enrollment-verification/issue${endpointSuffix}`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.messages?.join(' ') || data.error || 'Certificate could not be issued.');
      setIssued(data.document);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIssuing(false);
    }
  }

  async function downloadPdf() {
    if (!issued || !documentRef.current) return;
    setDownloading(true);
    setError('');
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 8.5, 11);
      pdf.save(`${safeFilename(issued.studentName)}_GIIS_Enrollment_Verification.pdf`);
    } catch {
      setError(isEn ? 'The PDF could not be generated. Please try again.' : 'PDF 产生失败，请重试。');
    } finally {
      setDownloading(false);
    }
  }

  const preview = issued || status?.document;
  return (
    <div className="enrollment-verification-workspace">
      <div className="enrollment-verification-toolbar">
        <div>
          <Link to={isAdmin ? `/admin/transcript/${studentId}` : '/profile'}>
            {isEn ? 'Back to student record' : '返回学生档案'}
          </Link>
          <h1>{isEn ? 'Enrollment Verification' : '在学证明'}</h1>
          <p>{isEn ? 'Review the current school record before issuing an official PDF.' : '签发正式 PDF 前，请先检查目前的学校记录。'}</p>
        </div>
        <div className="enrollment-verification-actions">
          <div className="enrollment-verification-segment" aria-label="Certificate language">
            <button type="button" className={!bilingual ? 'active' : ''} onClick={() => setBilingual(false)}>English</button>
            <button type="button" className={bilingual ? 'active' : ''} onClick={() => setBilingual(true)}>EN + 中文</button>
          </div>
          {!issued ? (
            <button type="button" className="btn btn-primary" disabled={loading || issuing || !status?.eligible} onClick={issueDocument}>
              {issuing ? (isEn ? 'Issuing...' : '签发中...') : (isEn ? 'Issue official certificate' : '签发正式证明')}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={downloading} onClick={downloadPdf}>
              {downloading ? (isEn ? 'Preparing PDF...' : '正在产生 PDF...') : (isEn ? 'Download PDF' : '下载 PDF')}
            </button>
          )}
        </div>
      </div>

      {loading && <div className="alert alert-light border">{isEn ? 'Checking enrollment status...' : '正在检查在读状态...'}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && status && !status.eligible && (
        <div className="alert alert-warning">
          <strong>{isEn ? 'Certificate cannot be issued yet.' : '目前还不能签发证明。'}</strong>
          <ul className="mb-0 mt-2">{(status.messages || []).map((message) => <li key={message}>{message}</li>)}</ul>
        </div>
      )}
      {issued && (
        <div className="alert alert-success">
          {isEn
            ? `Issued as ${issued.documentId}. The QR code checks both the signed document and current enrollment status.`
            : `已签发 ${issued.documentId}。QR code 会同时核对文件签章与目前在读状态。`}
        </div>
      )}

      {preview && (
        <div className="enrollment-document-stage" style={{ width: DOCUMENT_WIDTH * scale, height: DOCUMENT_HEIGHT * scale }}>
          <div className="enrollment-document-scale" style={{ transform: `scale(${scale})` }}>
            <Certificate document={preview} bilingual={bilingual} documentRef={documentRef} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function EnrollmentVerificationPage({ language = 'en', toggleLanguage }) {
  const { studentId } = useParams();
  const adminSession = getAdminSession();
  const studentSession = getStudentSession();
  const isAdminRoute = Boolean(studentId);

  if (isAdminRoute && !adminSession) return <Navigate to="/admin/login" replace />;
  if (!isAdminRoute && !studentSession) return <Navigate to="/login" replace />;

  return (
    <>
      <Helmet>
        <title>Enrollment Verification | Genesis of Ideas International School</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      {isAdminRoute ? (
        <AdminPage>
          <AdminHeader
            language={language}
            toggleLanguage={toggleLanguage}
            title={language === 'zh' ? '在学证明' : 'Enrollment Verification'}
            subtitle={language === 'zh' ? '检查资格、签发并下载可验证的正式文件。' : 'Check eligibility, issue, and download a verifiable official document.'}
          />
          <PageBody language={language} isAdmin studentId={studentId} />
        </AdminPage>
      ) : <PageBody language={language} isAdmin={false} />}
    </>
  );
}
