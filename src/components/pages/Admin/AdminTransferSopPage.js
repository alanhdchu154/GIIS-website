import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from './AdminChrome';

const API_BASE = getApiBase();

/**
 * AdminTransferSopPage — admin-only view of the internal Transfer Credit & GPA
 * SOP (docs/transfer-credit-gpa-sop.md). The markdown is served from an
 * admin-authenticated backend endpoint, so the internal reviewer logic never
 * ships in the public frontend bundle. Parent-facing language lives only in the
 * SOP's Appendix C/D, which may be quoted on public pages separately.
 */

// ── Minimal markdown → React renderer (headings, bold, inline code, lists,
// tables, horizontal rules, paragraphs). Scoped to what this SOP uses. ──────
function renderInline(text, keyBase) {
  // Split on **bold** and `code`, keep delimiters.
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`${keyBase}-b${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={`${keyBase}-c${i}`} style={{ background: '#eef1f6', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em' }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyBase}-t${i}`}>{part}</React.Fragment>;
  });
}

function splitRow(line) {
  return line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank
    if (!line.trim()) { i += 1; continue; }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) { blocks.push({ type: 'hr' }); i += 1; continue; }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { blocks.push({ type: 'h', level: h[1].length, text: h[2] }); i += 1; continue; }

    // Table: a `|` line followed by a `|---|` separator line
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
      const header = splitRow(line.trim());
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i].trim()));
        i += 1;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph (gather until blank line or a block starter)
    const para = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|[-*]\s|\d+\.\s|\|)/.test(lines[i]) && !/^-{3,}$/.test(lines[i].trim())) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }

  const H_SIZE = { 1: 28, 2: 21, 3: 16, 4: 14 };
  return blocks.map((b, bi) => {
    const k = `blk-${bi}`;
    switch (b.type) {
      case 'hr':
        return <hr key={k} style={{ border: 0, borderTop: '1px solid #e2e7f0', margin: '22px 0' }} />;
      case 'h':
        return (
          <div
            key={k}
            style={{
              fontSize: H_SIZE[b.level], fontWeight: b.level <= 2 ? 850 : 750,
              color: '#1a2d5a', margin: b.level === 1 ? '4px 0 14px' : '26px 0 10px',
              lineHeight: 1.25,
            }}
          >
            {renderInline(b.text, k)}
          </div>
        );
      case 'ul':
        return (
          <ul key={k} style={{ margin: '6px 0 14px', paddingLeft: 22 }}>
            {b.items.map((it, ii) => <li key={ii} style={{ margin: '3px 0', lineHeight: 1.6, color: '#33404f' }}>{renderInline(it, `${k}-${ii}`)}</li>)}
          </ul>
        );
      case 'ol':
        return (
          <ol key={k} style={{ margin: '6px 0 14px', paddingLeft: 22 }}>
            {b.items.map((it, ii) => <li key={ii} style={{ margin: '3px 0', lineHeight: 1.6, color: '#33404f' }}>{renderInline(it, `${k}-${ii}`)}</li>)}
          </ol>
        );
      case 'table':
        return (
          <div key={k} style={{ overflowX: 'auto', margin: '10px 0 18px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  {b.header.map((c, ci) => (
                    <th key={ci} style={{ border: '1px solid #d7deea', background: '#f4f6fb', padding: '7px 10px', textAlign: 'left', color: '#1a2d5a', fontWeight: 800 }}>
                      {renderInline(c, `${k}-h${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} style={{ border: '1px solid #e2e7f0', padding: '7px 10px', color: '#33404f', verticalAlign: 'top' }}>
                        {renderInline(c, `${k}-r${ri}c${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <p key={k} style={{ margin: '0 0 12px', lineHeight: 1.7, color: '#33404f' }}>{renderInline(b.text, k)}</p>;
    }
  });
}

// Condensed data-entry card for the registrar — the 4-step flow to put a G12
// transfer student's prior grades into the system. The full policy is below.
function TransferQuickCard() {
  const GPA = [
    ['A / A+', '4.0'], ['A-', '3.7'], ['B+', '3.3'], ['B', '3.0'], ['B-', '2.7'],
    ['C+', '2.3'], ['C', '2.0'], ['C-', '1.7'], ['D+', '1.3'], ['D', '1.0'], ['F', '0.0'],
  ];
  const step = { margin: '0 0 10px', lineHeight: 1.6, color: '#22303f' };
  const num = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#2b3d6d', color: '#fff', fontSize: 12, fontWeight: 800, marginRight: 8, verticalAlign: 'middle' };
  return (
    <div style={{ background: '#f4f7fc', border: '1px solid #cfdcef', borderRadius: 10, padding: '22px 26px', maxWidth: 960, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 850, letterSpacing: 1, textTransform: 'uppercase', color: '#2b3d6d', marginBottom: 4 }}>
        Quick Entry Card
      </div>
      <h3 style={{ margin: '0 0 14px', color: '#1a2d5a', fontSize: 19, fontWeight: 850 }}>
        Put a transfer student's prior grades into the system
      </h3>
      <p style={step}><span style={num}>1</span><strong>Get records first.</strong> Official transcript per prior term. No official record → preliminary estimate only; do not promise credits or a graduation date.</p>
      <p style={step}><span style={num}>2</span><strong>Evaluate each course</strong> (academic reviewer + principal sign-off): map to a GIIS subject, decide <em>credit&nbsp;+&nbsp;GPA</em> / <em>credit only</em> / <em>conditional</em> / <em>reject</em>, convert grade to the GIIS scale.</p>
      <p style={step}><span style={num}>3</span><strong>Create the account</strong> — Admin Dashboard → <strong>+ New student</strong>: name, Grade&nbsp;12, <strong>Entry Date</strong> (transfer date), Graduation Date, then set login.</p>
      <p style={step}><span style={num}>4</span><strong>Enter transfer credit</strong> — open <code style={{ background: '#e6edf7', padding: '1px 5px', borderRadius: 4 }}>/admin/transcript/[student]</code>, add a semester <strong>"Transfer Credit — Prior School"</strong>, one row per accepted course, then Save.</p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ flex: '1 1 300px' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 800, color: '#1a2d5a', fontSize: 14 }}>Row entry rule</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.65, color: '#33404f' }}>
            <li><strong>Credit + GPA:</strong> fill course name, credits, <strong>letter grade</strong>.</li>
            <li><strong>Credit only</strong> (Pass/Credit, or no reliable scale): fill name + credits, <strong>leave grade blank</strong> — counts toward 24 credits, not GPA.</li>
          </ul>
          <p style={{ margin: '12px 0 6px', fontWeight: 800, color: '#8a1c1c', fontSize: 14 }}>Never</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.65, color: '#33404f' }}>
            <li>Copy the prior school's cumulative GPA — course by course only.</li>
            <li>Promise a graduation date before records are reviewed.</li>
          </ul>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 800, color: '#1a2d5a', fontSize: 14 }}>GIIS GPA scale</p>
          <table style={{ borderCollapse: 'collapse', fontSize: 12.5 }}>
            <tbody>
              {GPA.map(([g, v]) => (
                <tr key={g}>
                  <td style={{ border: '1px solid #d7deea', padding: '2px 10px', color: '#33404f' }}>{g}</td>
                  <td style={{ border: '1px solid #d7deea', padding: '2px 10px', textAlign: 'right', fontWeight: 700, color: '#1a2d5a' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransferSopPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/admin/login', { replace: true });
      return;
    }
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const r = await fetch(`${API_BASE}/api/admin/documents/transfer-sop`, { credentials: 'include' });
        const data = await r.json().catch(() => ({}));
        if (r.status === 401) {
          clearAdminSession();
          navigate('/admin/login', { replace: true });
          return;
        }
        if (!r.ok) throw new Error(data.error || 'Failed to load the Transfer SOP.');
        setMarkdown(data.markdown || '');
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminPage>
      <AdminHeader
        title="Transfer Credit & GPA SOP"
        subtitle="Internal operating policy — admin access only. Do not publish the full SOP publicly."
      />
      <TransferQuickCard />
      <div style={{ background: '#fff', border: '1px solid #e2e7f0', borderRadius: 10, padding: '28px 30px', maxWidth: 960 }}>
        <div style={{ fontSize: 13, fontWeight: 850, letterSpacing: 1, textTransform: 'uppercase', color: '#7a8294', marginBottom: 14 }}>
          Full SOP
        </div>
        {loading && <p style={{ color: '#7a8294' }}>Loading SOP…</p>}
        {err && <p style={{ color: '#b0342d' }}>{err}</p>}
        {!loading && !err && renderMarkdown(markdown)}
      </div>
    </AdminPage>
  );
}
