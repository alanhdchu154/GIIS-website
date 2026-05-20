import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';

const API = getApiBase();

export default function VerifyPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) { setError('No student code provided.'); setLoading(false); return; }
    fetch(`${API}/api/verify/${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error || 'Not found')))
      .then(d => setData(d))
      .catch(e => setError(typeof e === 'string' ? e : 'Verification failed.'))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <>
      <Helmet>
        <title>Document Verification | Genesis of Ideas International School</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{
        minHeight: '100vh', background: '#f4f6fa',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', fontFamily: 'Inter, sans-serif',
      }}>

        {/* School header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2d5a, #2b3d6d)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#d5a836', marginBottom: 12 }}>G</div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Genesis of Ideas International School</p>
          <p style={{ fontSize: 13, color: '#5c6578', margin: 0 }}>Official Document Verification</p>
        </div>

        <div style={{ width: '100%', maxWidth: 480 }}>
          {loading && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', textAlign: 'center', border: '1px solid #e8ecf5', color: '#9aa0ad', fontSize: 14 }}>
              Verifying…
            </div>
          )}

          {!loading && error && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', border: '1px solid #fca5a5', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>Unable to Verify</h2>
              <p style={{ fontSize: 14, color: '#5c6578', margin: '0 0 20px' }}>
                {error === 'Not found' ? 'No student record found for this code. The document may be invalid or the code may be incorrect.' : error}
              </p>
              <p style={{ fontSize: 12, color: '#9aa0ad', margin: 0 }}>
                If you believe this is an error, contact <a href="mailto:admissions@genesisideas.school" style={{ color: '#2b3d6d' }}>admissions@genesisideas.school</a>.
              </p>
            </div>
          )}

          {!loading && data && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', border: '1px solid #e8ecf5', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              {/* Verified badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: '#e8f5e9', borderRadius: 10, border: '1px solid #a5d6a7' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, flexShrink: 0 }}>✓</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32', margin: 0 }}>Verified — Authentic GIIS Document</p>
                  <p style={{ fontSize: 11, color: '#4caf50', margin: '2px 0 0' }}>Issued by Genesis of Ideas International School</p>
                </div>
              </div>

              {/* Student info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Student Name', data.name],
                  ['Student ID', data.studentCode],
                  ['Status', data.graduated ? '✓ Graduated' : (data.graduationScheduled ? 'Graduation Scheduled' : 'Active Student')],
                  ...(data.graduationDate ? [['Graduation Date', new Date(data.graduationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]] : []),
                  ...(data.transcriptDate ? [['Document Date', new Date(data.transcriptDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]] : []),
                  ['Issuing Institution', 'Genesis of Ideas International School'],
                  ['Registration', 'Florida Private School · Statute 1002.42'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid #f0f2f8' }}>
                    <span style={{ fontSize: 12, color: '#9aa0ad', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0, marginRight: 12 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: (data.graduated || data.graduationScheduled) && label === 'Status' ? 700 : 400, textAlign: 'right', color: data.graduated && label === 'Status' ? '#2e7d32' : '#1a1d24' }}>{value}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: '#9aa0ad', margin: '20px 0 0', textAlign: 'center' }}>
                Verified on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/" style={{ fontSize: 13, color: '#2b3d6d', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to GIIS
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
