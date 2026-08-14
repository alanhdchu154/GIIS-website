import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import logoUrl from '../../../img/logo_nobg.png';

const API = getApiBase();

function formatDate(value) {
  if (!value) return 'Not available';
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

export default function EnrollmentVerificationPublicPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/enrollment-verification/verify/${encodeURIComponent(token || '')}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Document could not be verified.');
        return body;
      })
      .then(setData)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [token]);

  const valid = data?.status === 'valid';
  const expired = data?.status === 'expired';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', padding: '48px 20px', fontFamily: 'Arial, sans-serif' }}>
      <Helmet>
        <title>Enrollment Verification | GIIS</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main style={{ maxWidth: 560, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logoUrl} alt="GIIS" style={{ width: 92, height: 68, objectFit: 'contain' }} />
          <p style={{ margin: '8px 0 0', color: '#2b3d6d', fontSize: 13, fontWeight: 800 }}>Genesis of Ideas International School</p>
          <p style={{ margin: '4px 0 0', color: '#5c6578', fontSize: 12 }}>Official Enrollment Verification</p>
        </header>

        {loading && <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 28, textAlign: 'center' }}>Verifying document...</div>}
        {!loading && error && (
          <section style={{ background: '#fff', border: '1px solid #fca5a5', padding: 28 }}>
            <h1 style={{ margin: '0 0 10px', color: '#b91c1c', fontSize: 22 }}>Unable to verify</h1>
            <p style={{ margin: 0, color: '#5c6578', fontSize: 14 }}>{error}</p>
          </section>
        )}
        {!loading && data && (
          <section style={{ background: '#fff', border: `1px solid ${valid ? '#86c98b' : '#e8b65c'}`, padding: 28 }}>
            <div style={{ padding: '12px 14px', background: valid ? '#e8f5e9' : '#fff7e6', color: valid ? '#2e7d32' : '#8a5a00', fontWeight: 800, fontSize: 14, marginBottom: 22 }}>
              {valid ? 'Valid and currently enrolled' : expired ? 'Authentic document, validity period expired' : 'Authentic document, enrollment is no longer current'}
            </div>
            <dl style={{ margin: 0 }}>
              {[
                ['Document Type', 'Enrollment Verification'],
                ['Document ID', data.documentId],
                ['Student Name', data.studentName || 'Record has changed'],
                ['Student ID', data.studentCode || 'Record has changed'],
                ...(data.gradeLevel ? [['Grade Level', `Grade ${data.gradeLevel}`]] : []),
                ['Official Entry Date', formatDate(data.entryDate)],
                ['Issue Date', formatDate(data.issuedOn)],
                ['Valid Through', formatDate(data.validThrough)],
                ['Issuing School', data.schoolName],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '145px 1fr', gap: 14, padding: '11px 0', borderBottom: '1px solid #edf0f5' }}>
                  <dt style={{ color: '#5c6578', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{label}</dt>
                  <dd style={{ margin: 0, color: '#1a1d24', fontSize: 13, overflowWrap: 'anywhere' }}>{value}</dd>
                </div>
              ))}
            </dl>
            <p style={{ margin: '18px 0 0', color: '#5c6578', fontSize: 11, lineHeight: 1.5 }}>
              This result verifies this signed enrollment document only. It does not certify attendance, grades, credits, graduation eligibility, accreditation, identity, age, or work authorization.
            </p>
          </section>
        )}

        <p style={{ margin: '20px 0 0', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#2b3d6d', fontSize: 13, fontWeight: 700 }}>Back to GIIS</Link>
        </p>
      </main>
    </div>
  );
}
