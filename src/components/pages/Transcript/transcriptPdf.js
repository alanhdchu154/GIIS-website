import logoSlogan from '../../../img/logo_slogan.png';
import logo from '../../../img/logo_nobg.png';
import { TRANSCRIPT_SEMESTER_KEYS } from './transcriptMappers.js';
import { getAllSemesterStatuses, SEMESTER_STATUS } from './semesterStatus.js';

const HEAD_BG = '#dce6f1';
const ALT_ROW  = '#f5f8fc';
const NAVY     = '#2b3d6d';
const F = "'Times New Roman',Times,serif";
const TD_BASE = `font-family:${F};box-sizing:border-box;`;

// A4 portrait dimensions
const PAGE_W = 210; // mm
const DOC_W  = 190; // mm
const WIN_W  = Math.round(PAGE_W * 96 / 25.4); // ≈794 CSS px

function loadHtml2Pdf() {
  if (typeof window !== 'undefined' && window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-html2pdf]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('html2pdf failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = `${process.env.PUBLIC_URL}/html2pdf.bundle.min.js`;
    s.async = true;
    s.dataset.html2pdf = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('html2pdf failed'));
    document.body.appendChild(s);
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeDateForPdf(v) {
  if (!v) return '—';
  const s = String(v).trim();
  if (!s) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return s;
}

function todayForPdf() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function gpaVal(v) {
  if (v === null || v === undefined || v === '' || v === '-' || v === '—') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function computeSemesterTotals(rows) {
  let totalW = 0, totalU = 0, totalCr = 0;
  for (const r of (rows || [])) {
    if (!r?.name || r.name === 'Semester Totals') continue;
    const cr = parseFloat(String(r.credits ?? '')) || 0;
    if (cr <= 0) continue;
    const w = gpaVal(r.weightedGPA);
    const u = gpaVal(r.unweightedGPA);
    if (w !== null && u !== null) { totalW += w * cr; totalU += u * cr; totalCr += cr; }
  }
  if (totalCr <= 0) return { credits: 0, weighted: '—', unweighted: '—' };
  return { credits: totalCr, weighted: (totalW / totalCr).toFixed(2), unweighted: (totalU / totalCr).toFixed(2) };
}

function computeAllGPA(rowsBySemester) {
  let totalW = 0, totalU = 0, totalCr = 0;
  for (const key of TRANSCRIPT_SEMESTER_KEYS) {
    for (const r of (rowsBySemester[key] || [])) {
      if (!r?.name || r.name === 'Semester Totals') continue;
      const cr = parseFloat(String(r.credits ?? '')) || 0;
      if (cr <= 0) continue;
      const w = gpaVal(r.weightedGPA);
      const u = gpaVal(r.unweightedGPA);
      if (w !== null && u !== null) { totalW += w * cr; totalU += u * cr; totalCr += cr; }
    }
  }
  if (totalCr <= 0) return { weighted: '—', unweighted: '—', credits: 0 };
  return { weighted: (totalW / totalCr).toFixed(2), unweighted: (totalU / totalCr).toFixed(2), credits: totalCr };
}

// All styles are inline — external/head CSS is NOT reliable in html2canvas cloning
function buildSemesterTableHtml(semesterName, rows, semesterStatus) {
  const dataRows = (rows || []).filter(r => r && r.name && r.name !== 'Semester Totals' && r.name.trim() !== '');
  const totals = computeSemesterTotals(rows || []);
  const isInProgress = semesterStatus === SEMESTER_STATUS.IN_PROGRESS;

  const tdBase = `${TD_BASE}font-size:6pt;border:0.5px solid #ccc;padding:1px 1.5px;vertical-align:middle;`;
  const col = {
    name:  `${tdBase}width:40%;`,
    type:  `${tdBase}width:14%;text-align:center;`,
    cred:  `${tdBase}width:6%;text-align:center;`,
    grade: `${tdBase}width:6%;text-align:center;`,
    gpa:   `${tdBase}width:17%;text-align:center;`,
  };
  const hBase = `${TD_BASE}font-size:5.5pt;font-weight:bold;padding:1px 1.5px;border:0.5px solid #999;background:${HEAD_BG};white-space:normal;line-height:1.2;`;
  const hCol = {
    name:  `${hBase}width:40%;text-align:left;`,
    type:  `${hBase}width:14%;text-align:center;`,
    cred:  `${hBase}width:6%;text-align:center;`,
    grade: `${hBase}width:6%;text-align:center;`,
    gpa:   `${hBase}width:17%;text-align:center;`,
  };
  const totBase = `${TD_BASE}font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:1px 1.5px;vertical-align:middle;`;

  const body = dataRows.map((r, i) => {
    const bg = i % 2 !== 0 ? `background:${ALT_ROW};` : '';
    return `<tr>
      <td style="${col.name}${bg}">${escapeHtml(r.name || '')}</td>
      <td style="${col.type}${bg}">${escapeHtml(r.type || '')}</td>
      <td style="${col.cred}${bg}">${escapeHtml(r.credits != null ? String(r.credits) : '')}</td>
      <td style="${col.grade}${bg}">${escapeHtml(r.grade || '')}</td>
      <td style="${col.gpa}${bg}">${escapeHtml(r.weightedGPA != null && r.weightedGPA !== '' ? String(r.weightedGPA) : '')}</td>
      <td style="${col.gpa}${bg}">${escapeHtml(r.unweightedGPA != null && r.unweightedGPA !== '' ? String(r.unweightedGPA) : '')}</td>
    </tr>`;
  }).join('');

  const totalsRow = `<tr>
    <td style="${totBase}width:40%;">Semester Totals</td>
    <td style="${totBase}width:14%;text-align:center;"></td>
    <td style="${totBase}width:6%;text-align:center;">${totals.credits > 0 ? totals.credits.toFixed(1) : ''}</td>
    <td style="${totBase}width:6%;text-align:center;"></td>
    <td style="${totBase}width:17%;text-align:center;">${escapeHtml(totals.weighted)}</td>
    <td style="${totBase}width:17%;text-align:center;">${escapeHtml(totals.unweighted)}</td>
  </tr>`;

  return `<div style="margin-bottom:1.5mm;">
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:${F};">
      <thead>
        <tr><th colspan="6" style="${TD_BASE}font-size:7pt;font-weight:bold;padding:1.5px 3px;text-align:left;border:0.5px solid #999;background:#fff;">${escapeHtml(semesterName)}${isInProgress ? ' (In Progress)' : ''}</th></tr>
        <tr>
          <th style="${hCol.name}">Course Name</th>
          <th style="${hCol.type}">Type</th>
          <th style="${hCol.cred}">Credits</th>
          <th style="${hCol.grade}">Grade</th>
          <th style="${hCol.gpa}">Weighted GPA</th>
          <th style="${hCol.gpa}">Unweighted GPA</th>
        </tr>
      </thead>
      <tbody>${body}${totalsRow}</tbody>
    </table>
  </div>`;
}

export async function exportTranscriptToPDF({ profile, semesterRowsRef, semesterInitialRows, setIsStaticMode }) {
  try { await loadHtml2Pdf(); } catch { return; }
  if (!window.html2pdf) return;

  setIsStaticMode(true);

  setTimeout(() => {
    const rowsBySemester = {};
    for (const key of TRANSCRIPT_SEMESTER_KEYS) {
      rowsBySemester[key] = semesterRowsRef.current[key] || semesterInitialRows[key] || [];
    }

    const cumulative = computeAllGPA(rowsBySemester);
    const p = profile || {};
    const transcriptDate = p.transcriptDate ? new Date(p.transcriptDate) : new Date();
    const graduationYear = p.graduationDate ? new Date(p.graduationDate).getFullYear() : null;
    const semStatuses = getAllSemesterStatuses(TRANSCRIPT_SEMESTER_KEYS, graduationYear, transcriptDate);

    const visibleKeys = TRANSCRIPT_SEMESTER_KEYS.filter(k => semStatuses[k] !== SEMESTER_STATUS.UPCOMING);
    const half = Math.ceil(visibleKeys.length / 2);
    const leftKeys  = visibleKeys.length > 4 ? visibleKeys.slice(0, half) : visibleKeys.slice(0, 4);
    const rightKeys = visibleKeys.length > 4 ? visibleKeys.slice(half)    : visibleKeys.slice(4);

    const leftHtml  = leftKeys.map(k => buildSemesterTableHtml(k, rowsBySemester[k], semStatuses[k])).join('');
    const rightHtml = rightKeys.map(k => buildSemesterTableHtml(k, rowsBySemester[k], semStatuses[k])).join('');

    const exportToday = todayForPdf();
    const transcriptDateDisplay = normalizeDateForPdf(p.transcriptDate) !== '—'
      ? normalizeDateForPdf(p.transcriptDate) : exportToday;

    const siTd = `${TD_BASE}border:0.5px solid #999;padding:0.8mm 1.5mm;vertical-align:top;width:25%;font-size:6.5pt;`;
    const cumTd = `${TD_BASE}border:0.5px solid #999;padding:1.5px 4px;font-size:7.5pt;background:${HEAD_BG};`;
    const scaleTh = `${TD_BASE}font-size:6pt;font-weight:bold;border:0.5px solid #999;padding:1px 3px;text-align:center;background:${HEAD_BG};`;
    const scaleTd = `${TD_BASE}font-size:6pt;border:0.5px solid #999;padding:1px 3px;text-align:center;background:${ALT_ROW};`;

    const pdfDoc = document.createElement('div');
    pdfDoc.style.cssText = `font-family:${F};color:#000;width:${DOC_W}mm;margin:0 auto;padding:6mm 7mm 4mm 7mm;box-sizing:border-box;background:#fff;`;
    pdfDoc.innerHTML = `
<!-- HEADER -->
<table style="width:100%;border-collapse:collapse;margin-bottom:0;padding-bottom:2mm;">
  <tbody><tr>
    <td style="${TD_BASE}width:12%;vertical-align:middle;padding:0;border:none;">
      <img src="${logo}" alt="GIIS" style="height:52px;width:auto;display:block;" />
    </td>
    <td style="${TD_BASE}text-align:center;vertical-align:middle;padding:0 4mm;border:none;">
      <div style="${TD_BASE}font-size:6.5pt;color:#666;letter-spacing:1px;text-transform:uppercase;margin:0 0 0.5mm;">Official Academic Record</div>
      <div style="${TD_BASE}font-size:16pt;font-weight:bold;color:#1a1a2e;line-height:1.1;margin:0 0 1.5mm;">Genesis of Ideas International School</div>
      <div style="${TD_BASE}font-size:7pt;color:#444;">7901 4th St N STE 300, St. Petersburg, FL 33702 &nbsp;|&nbsp; +1 (813) 501-5756 &nbsp;|&nbsp; genesisideas.school</div>
    </td>
    <td style="${TD_BASE}width:22%;text-align:right;vertical-align:top;padding:0;border:none;">
      <div style="${TD_BASE}display:inline-block;border:2px solid ${NAVY};color:${NAVY};font-weight:bold;font-size:7.5pt;padding:2px 6px;letter-spacing:0.5px;margin-bottom:2mm;">OFFICIAL TRANSCRIPT</div>
      <div style="${TD_BASE}font-size:6.5pt;color:#444;line-height:1.6;text-align:right;">FL School Code: 650<br/>President: Shiyu Zhang, Ph.D.<br/>admissions@genesisideas.school</div>
    </td>
  </tr></tbody>
</table>
<div style="border-top:2px solid ${NAVY};margin-bottom:2mm;"></div>

<!-- STUDENT INFO -->
<table style="width:100%;border-collapse:collapse;margin-bottom:2mm;table-layout:fixed;">
  <tbody>
    <tr>
      <td style="${siTd}">Name: ${escapeHtml(p.name || '—')}</td>
      <td style="${siTd}">Birth Date: ${escapeHtml(normalizeDateForPdf(p.birthDate))}</td>
      <td style="${siTd}">Gender: ${escapeHtml(p.gender || '—')}</td>
      <td style="${siTd}">Parent/Guardian: ${escapeHtml(p.parentGuardian || '—')}</td>
    </tr>
    <tr>
      <td style="${siTd}">Address: ${escapeHtml(p.address || '—')}</td>
      <td style="${siTd}">City: ${escapeHtml(p.city || '—')}</td>
      <td style="${siTd}">Province: ${escapeHtml(p.province || '—')}</td>
      <td style="${siTd}">Zip Code: ${escapeHtml(p.zipCode || '—')}</td>
    </tr>
    <tr>
      <td style="${siTd}">Entry Date: ${escapeHtml(normalizeDateForPdf(p.entryDate))}</td>
      <td style="${siTd}">Withdrawal Date: ${escapeHtml(normalizeDateForPdf(p.withdrawalDate))}</td>
      <td style="${siTd}">Graduation Date: ${escapeHtml(normalizeDateForPdf(p.graduationDate))}</td>
      <td style="${siTd}">Transcript Date: ${escapeHtml(transcriptDateDisplay)}</td>
    </tr>
  </tbody>
</table>

<!-- GRADE TABLES (two-column) -->
<div style="position:relative;margin-bottom:1mm;">
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:55%;pointer-events:none;z-index:0;opacity:0.22;text-align:center;">
    <img src="${logoSlogan}" alt="" style="width:100%;display:block;" />
  </div>
  <div style="position:relative;z-index:1;">
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tbody><tr>
        <td style="width:49%;vertical-align:top;border:none;padding:0;">${leftHtml}</td>
        <td style="width:2%;border:none;padding:0;"></td>
        <td style="width:49%;vertical-align:top;border:none;padding:0;">${rightHtml}</td>
      </tr></tbody>
    </table>
  </div>
</div>

<!-- CUMULATIVE GPA -->
<table style="width:100%;border-collapse:collapse;margin-bottom:2mm;">
  <tbody>
    <tr>
      <td style="${cumTd}font-weight:bold;text-align:center;width:12%;">Weighted</td>
      <td style="${cumTd}width:44%;">Cumulative GPA: ${escapeHtml(cumulative.weighted)}</td>
      <td style="${cumTd}width:44%;">Cumulative Credits: ${escapeHtml(cumulative.credits > 0 ? cumulative.credits.toFixed(1) : '—')}</td>
    </tr>
    <tr>
      <td style="${cumTd}font-weight:bold;text-align:center;width:12%;">Unweighted</td>
      <td style="${cumTd}width:44%;">Cumulative GPA: ${escapeHtml(cumulative.unweighted)}</td>
      <td style="${cumTd}width:44%;">Cumulative Credits: ${escapeHtml(cumulative.credits > 0 ? cumulative.credits.toFixed(1) : '—')}</td>
    </tr>
  </tbody>
</table>

<!-- GRADING SCALE -->
<table style="width:100%;border-collapse:collapse;margin-bottom:2mm;">
  <thead>
    <tr>
      <th colspan="9" style="${scaleTh}text-align:left;">Grading Scale (Unweighted &mdash; AP courses add +1.0)</th>
      <th colspan="2" style="${scaleTh}text-align:left;">Course Types</th>
    </tr>
    <tr>
      <th style="${scaleTh}">A</th>
      <th style="${scaleTh}">A&minus;</th>
      <th style="${scaleTh}">B+</th>
      <th style="${scaleTh}">B</th>
      <th style="${scaleTh}">B&minus;</th>
      <th style="${scaleTh}">C+</th>
      <th style="${scaleTh}">C</th>
      <th style="${scaleTh}">D</th>
      <th style="${scaleTh}">F</th>
      <td rowspan="2" colspan="2" style="${TD_BASE}font-size:6pt;border:0.5px solid #999;padding:1px 4px;vertical-align:top;text-align:left;">
        <strong>AP</strong>&nbsp;&nbsp;Advanced Placement<br/>
        <strong>Core / Elec</strong>&nbsp;&nbsp;Core Curriculum / Elective
      </td>
    </tr>
    <tr>
      <td style="${scaleTd}">4.0</td>
      <td style="${scaleTd}">3.7</td>
      <td style="${scaleTd}">3.3</td>
      <td style="${scaleTd}">3.0</td>
      <td style="${scaleTd}">2.7</td>
      <td style="${scaleTd}">2.3</td>
      <td style="${scaleTd}">2.0</td>
      <td style="${scaleTd}">1.0</td>
      <td style="${scaleTd}">0.0</td>
    </tr>
  </thead>
</table>

<!-- SIGNATURE -->
<table style="width:100%;border-collapse:collapse;margin-top:3mm;margin-bottom:1mm;">
  <tbody><tr>
    <td style="${TD_BASE}white-space:nowrap;font-size:8pt;padding-right:4px;vertical-align:bottom;border:none;">Official(s) Certifying Transcript:</td>
    <td style="${TD_BASE}border-bottom:1px solid #333;border-top:none;border-left:none;border-right:none;vertical-align:bottom;">&nbsp;</td>
  </tr></tbody>
</table>
<div style="${TD_BASE}text-align:right;font-size:7pt;color:#333;margin-bottom:3mm;">Signature</div>
<table style="width:50%;margin-left:auto;border-collapse:collapse;">
  <tbody>
    <tr>
      <td style="${TD_BASE}text-align:center;font-size:8pt;font-weight:600;padding:1px 4px;border:none;">Shiyu Zhang, Ph.D.</td>
      <td style="${TD_BASE}text-align:center;font-size:8pt;font-weight:600;padding:1px 4px;border:none;">President</td>
      <td style="${TD_BASE}text-align:center;font-size:8pt;font-weight:600;padding:1px 4px;border:none;">${escapeHtml(exportToday)}</td>
    </tr>
    <tr>
      <td style="${TD_BASE}text-align:center;font-size:7pt;color:#555;padding:1px 4px;border:none;border-top:1px solid #333;">Printed Name</td>
      <td style="${TD_BASE}text-align:center;font-size:7pt;color:#555;padding:1px 4px;border:none;border-top:1px solid #333;">Title</td>
      <td style="${TD_BASE}text-align:center;font-size:7pt;color:#555;padding:1px 4px;border:none;border-top:1px solid #333;">Date</td>
    </tr>
  </tbody>
</table>

<!-- NOT VALID WITHOUT OFFICIAL SEAL -->
<div style="${TD_BASE}text-align:center;font-weight:bold;font-size:8pt;color:#b00020;letter-spacing:1px;margin:3mm 0 2mm;">NOT VALID WITHOUT OFFICIAL SEAL</div>

<!-- FOOTER -->
<table style="width:100%;border-collapse:collapse;border-top:0.5px solid #ccc;margin-top:1mm;">
  <tbody><tr>
    <td style="${TD_BASE}font-size:6.5pt;color:#888;padding-top:1mm;border:none;">Genesis of Ideas International School &mdash; Official Academic Record &mdash; Confidential</td>
    <td style="${TD_BASE}font-size:6.5pt;color:#888;padding-top:1mm;border:none;text-align:right;">Page 1 of 1</td>
  </tr></tbody>
</table>`;

    // position:absolute at doc origin + high z-index so html2canvas sees it correctly
    const pdfWrapper = document.createElement('div');
    pdfWrapper.style.cssText = `position:absolute;top:0;left:0;width:${PAGE_W}mm;background:#fff;box-sizing:border-box;z-index:999999;`;
    pdfWrapper.appendChild(pdfDoc);
    document.body.appendChild(pdfWrapper);
    void pdfWrapper.offsetHeight; // force layout reflow before capture

    const savedScrollX = window.scrollX;
    const savedScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const options = {
      margin: 0,
      filename: `${(profile?.name || 'Transcript').replace(/[\\/:*?"<>|]/g, '-')}_Transcript.pdf`,
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: WIN_W,
        ignoreElements: el => el.tagName === 'BUTTON',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    window.html2pdf()
      .set(options)
      .from(pdfWrapper)
      .save()
      .finally(() => {
        document.body.removeChild(pdfWrapper);
        window.scrollTo(savedScrollX, savedScrollY);
        setIsStaticMode(false);
      });
  }, 0);
}
