import logoSlogan from '../../../img/logo_slogan.png';
import logo from '../../../img/logo_nobg.png';
import { TRANSCRIPT_SEMESTER_KEYS } from './transcriptMappers.js';
import { getAllSemesterStatuses, SEMESTER_STATUS } from './semesterStatus.js';

const HEAD_BG  = '#dce6f1';
const ALT_ROW  = '#f5f8fc';

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
    if (w !== null && u !== null) {
      totalW += w * cr;
      totalU += u * cr;
      totalCr += cr;
    }
  }
  if (totalCr <= 0) return { credits: 0, weighted: '—', unweighted: '—' };
  return {
    credits: totalCr,
    weighted: (totalW / totalCr).toFixed(2),
    unweighted: (totalU / totalCr).toFixed(2),
  };
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
      if (w !== null && u !== null) {
        totalW += w * cr;
        totalU += u * cr;
        totalCr += cr;
      }
    }
  }
  if (totalCr <= 0) return { weighted: '—', unweighted: '—', credits: 0 };
  return {
    weighted: (totalW / totalCr).toFixed(2),
    unweighted: (totalU / totalCr).toFixed(2),
    credits: totalCr,
  };
}

function buildSemesterTableHtml(semesterName, rows, semesterStatus) {
  const dataRows = (rows || []).filter((r) => r && r.name && r.name !== 'Semester Totals' && r.name.trim() !== '');
  const totals = computeSemesterTotals(rows || []);
  const isInProgress = semesterStatus === SEMESTER_STATUS.IN_PROGRESS;

  const body = dataRows.map((r, i) => {
    const bg = i % 2 !== 0 ? `style="background:${ALT_ROW};"` : '';
    return `<tr ${bg}>
      <td class="cname">${escapeHtml(r.name || '')}</td>
      <td class="ctype">${escapeHtml(r.type || '')}</td>
      <td class="ccred">${escapeHtml(r.credits != null ? String(r.credits) : '')}</td>
      <td class="cgrade">${escapeHtml(r.grade || '')}</td>
      <td class="cgpa">${escapeHtml(r.weightedGPA != null && r.weightedGPA !== '' ? String(r.weightedGPA) : '')}</td>
      <td class="cgpa">${escapeHtml(r.unweightedGPA != null && r.unweightedGPA !== '' ? String(r.unweightedGPA) : '')}</td>
    </tr>`;
  }).join('');

  const totalsRow = `<tr class="totals-row">
    <td class="cname">Semester Totals</td>
    <td class="ctype"></td>
    <td class="ccred">${totals.credits > 0 ? totals.credits.toFixed(1) : ''}</td>
    <td class="cgrade"></td>
    <td class="cgpa">${escapeHtml(totals.weighted)}</td>
    <td class="cgpa">${escapeHtml(totals.unweighted)}</td>
  </tr>`;

  return `<div class="semester-block">
    <table class="sem-table">
      <thead>
        <tr class="sem-title-row"><th colspan="6">${escapeHtml(semesterName)}${isInProgress ? ' (In Progress)' : ''}</th></tr>
        <tr class="sem-col-row">
          <th class="cname">Course Name</th>
          <th class="ctype">Type</th>
          <th class="ccred">Credits</th>
          <th class="cgrade">Grade</th>
          <th class="cgpa">Weighted GPA</th>
          <th class="cgpa">Unweighted GPA</th>
        </tr>
      </thead>
      <tbody>${body}${totalsRow}</tbody>
    </table>
  </div>`;
}

export async function exportTranscriptToPDF({ profile, semesterRowsRef, semesterInitialRows, setIsStaticMode }) {
  try {
    await loadHtml2Pdf();
  } catch {
    return;
  }
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

    const visibleKeys = TRANSCRIPT_SEMESTER_KEYS.filter(
      (k) => semStatuses[k] !== SEMESTER_STATUS.UPCOMING,
    );

    const leftKeys = visibleKeys.length > 4 ? visibleKeys.slice(0, Math.ceil(visibleKeys.length / 2)) : visibleKeys.slice(0, 4);
    const rightKeys = visibleKeys.length > 4 ? visibleKeys.slice(Math.ceil(visibleKeys.length / 2)) : visibleKeys.slice(4);

    const leftHtml = leftKeys
      .map((k) => buildSemesterTableHtml(k, rowsBySemester[k], semStatuses[k]))
      .join('');
    const rightHtml = rightKeys
      .map((k) => buildSemesterTableHtml(k, rowsBySemester[k], semStatuses[k]))
      .join('');
    const exportToday = todayForPdf();
    const transcriptDateDisplay =
      normalizeDateForPdf(p.transcriptDate) !== '—'
        ? normalizeDateForPdf(p.transcriptDate)
        : exportToday;

    const pdfDoc = document.createElement('div');
    pdfDoc.className = 'transcript-pdf-export';
    pdfDoc.innerHTML = `
<style>
  @page { size: A4 portrait; margin: 0; }
  .transcript-pdf-export {
    font-family: 'Times New Roman', Times, serif;
    color: #000;
    width: 190mm;
    margin: 0 auto;
    padding: 6mm 7mm 4mm 7mm;
    box-sizing: border-box;
    background: #fff;
  }
  .transcript-pdf-export * { box-sizing: border-box; }

  /* ── HEADER ── */
  .hdr-table { width: 100%; border-collapse: collapse; border-bottom: 2px solid #2b3d6d; padding-bottom: 2mm; margin-bottom: 2mm; }
  .hdr-logo-cell { width: 13%; vertical-align: middle; padding: 0; }
  .hdr-logo-cell img { height: 52px; width: auto; display: block; }
  .hdr-center-cell { text-align: center; vertical-align: middle; padding: 0 4mm; }
  .hdr-subtitle { font-size: 6.5pt; color: #666; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 0.5mm; }
  .hdr-schoolname { font-size: 16pt; font-weight: bold; color: #1a1a2e; line-height: 1.1; margin: 0 0 1.5mm; }
  .hdr-contact { font-size: 7pt; color: #444; }
  .hdr-badge-cell { width: 22%; text-align: right; vertical-align: top; padding: 0; }
  .hdr-official-badge {
    display: inline-block;
    border: 2px solid #2b3d6d;
    color: #2b3d6d;
    font-weight: bold;
    font-size: 7.5pt;
    padding: 2px 6px;
    letter-spacing: 0.5px;
    margin-bottom: 2mm;
  }
  .hdr-meta-right { font-size: 6.5pt; color: #444; line-height: 1.6; text-align: right; }

  /* ── STUDENT INFO TABLE ── */
  .si-table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
  .si-table td { border: 0.5px solid #999; padding: 0.8mm 1.5mm; vertical-align: top; width: 25%; font-size: 6.5pt; }

  /* ── GRADE TABLES ── */
  .grades-section { position: relative; margin-bottom: 1mm; }
  .grades-inner { position: relative; z-index: 1; }
  .grades-cols-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .grades-col { width: 49%; vertical-align: top; }
  .grades-col-gap { width: 2%; }
  .semester-block { margin-bottom: 1.5mm; }
  .sem-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .sem-title-row th {
    background: #fff;
    font-size: 7pt;
    font-weight: bold;
    padding: 1.5px 3px;
    text-align: left;
    border: 0.5px solid #999;
  }
  .sem-col-row th {
    background: ${HEAD_BG};
    font-size: 5.5pt;
    font-weight: bold;
    padding: 1px 1.5px;
    text-align: center;
    border: 0.5px solid #999;
    white-space: normal;
    line-height: 1.2;
  }
  .sem-col-row .cname { text-align: left; }
  .sem-table td {
    font-size: 6pt;
    border: 0.5px solid #ccc;
    padding: 1px 1.5px;
    vertical-align: middle;
  }
  .cname  { width: 40%; }
  .ctype  { width: 14%; text-align: center; }
  .ccred  { width: 6%;  text-align: center; }
  .cgrade { width: 6%;  text-align: center; }
  .cgpa   { width: 17%; text-align: center; }
  .totals-row td { background: ${HEAD_BG}; font-weight: bold; font-size: 6pt; border-top: 1px solid #999; }

  /* watermark */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 55%;
    pointer-events: none;
    z-index: 0;
    user-select: none;
    opacity: 0.22;
    text-align: center;
  }
  .watermark img { width: 100%; display: block; }

  /* ── CUMULATIVE GPA ── */
  .cum-table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
  .cum-table td { border: 0.5px solid #999; padding: 1.5px 4px; font-size: 7.5pt; background: ${HEAD_BG}; }
  .cum-label { font-weight: bold; text-align: center; width: 12%; }

  /* ── GRADING SCALE ── */
  .scale-table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; font-size: 6.5pt; }
  .scale-table th, .scale-table td { border: 0.5px solid #999; padding: 1px 3px; text-align: center; }
  .scale-header { background: ${HEAD_BG}; font-weight: bold; text-align: left !important; }
  .scale-val { background: #f5f8fc; }

  /* ── SIGNATURE ── */
  .sig-certify-row { display: flex; align-items: flex-end; gap: 4px; margin-top: 3mm; margin-bottom: 1mm; font-size: 8pt; }
  .sig-certify-text { white-space: nowrap; }
  .sig-underline { flex: 1; border-bottom: 1px solid #333; }
  .sig-sub-label { text-align: right; font-size: 7pt; color: #333; margin-bottom: 3mm; }
  .sig-name-row { display: flex; justify-content: flex-end; gap: 10mm; font-size: 8pt; font-weight: 600; }
  .sig-role-row { display: flex; justify-content: flex-end; gap: 10mm; font-size: 7pt; color: #555; margin-top: 1px; }
  .sig-seal { text-align: center; font-weight: bold; font-size: 8pt; color: #b00020; letter-spacing: 1px; margin: 3mm 0 2mm; }

  /* ── FOOTER ── */
  .footer {
    border-top: 0.5px solid #ccc;
    padding-top: 1mm;
    display: flex;
    justify-content: space-between;
    font-size: 6.5pt;
    color: #888;
  }
</style>

<!-- HEADER -->
<table class="hdr-table">
  <tr>
    <td class="hdr-logo-cell"><img src="${logo}" alt="GIIS" /></td>
    <td class="hdr-center-cell">
      <div class="hdr-subtitle">Official Academic Record</div>
      <div class="hdr-schoolname">Genesis of Ideas International School</div>
      <div class="hdr-contact">7901 4th St N STE 300, St. Petersburg, FL 33702 &nbsp;|&nbsp; +1 (813) 501-5756 &nbsp;|&nbsp; genesisideas.school</div>
    </td>
    <td class="hdr-badge-cell">
      <div class="hdr-official-badge">OFFICIAL TRANSCRIPT</div>
      <div class="hdr-meta-right">FL School Code: 650<br/>President: Shiyu Zhang, Ph.D.<br/>admissions@genesisideas.school</div>
    </td>
  </tr>
</table>

<!-- STUDENT INFO -->
<table class="si-table">
  <tbody>
    <tr>
      <td>Name: ${escapeHtml(p.name || '—')}</td>
      <td>Birth Date: ${escapeHtml(normalizeDateForPdf(p.birthDate))}</td>
      <td>Gender: ${escapeHtml(p.gender || '—')}</td>
      <td>Parent/Guardian: ${escapeHtml(p.parentGuardian || '—')}</td>
    </tr>
    <tr>
      <td>Address: ${escapeHtml(p.address || '—')}</td>
      <td>City: ${escapeHtml(p.city || '—')}</td>
      <td>Province: ${escapeHtml(p.province || '—')}</td>
      <td>Zip Code: ${escapeHtml(p.zipCode || '—')}</td>
    </tr>
    <tr>
      <td>Entry Date: ${escapeHtml(normalizeDateForPdf(p.entryDate))}</td>
      <td>Withdrawal Date: ${escapeHtml(normalizeDateForPdf(p.withdrawalDate))}</td>
      <td>Graduation Date: ${escapeHtml(normalizeDateForPdf(p.graduationDate))}</td>
      <td>Transcript Date: ${escapeHtml(transcriptDateDisplay)}</td>
    </tr>
  </tbody>
</table>

<!-- GRADE TABLES -->
<div class="grades-section">
  <div class="watermark"><img src="${logoSlogan}" alt="" /></div>
  <div class="grades-inner">
    <table class="grades-cols-table">
      <tr>
        <td class="grades-col">${leftHtml}</td>
        <td class="grades-col-gap"></td>
        <td class="grades-col">${rightHtml}</td>
      </tr>
    </table>
  </div>
</div>

<!-- CUMULATIVE GPA -->
<table class="cum-table">
  <tbody>
    <tr>
      <td class="cum-label" style="width:12%">Weighted</td>
      <td style="width:44%">Cumulative GPA: ${escapeHtml(cumulative.weighted)}</td>
      <td style="width:44%">Cumulative Credits: ${escapeHtml(cumulative.credits > 0 ? cumulative.credits.toFixed(1) : '—')}</td>
    </tr>
    <tr>
      <td class="cum-label">Unweighted</td>
      <td>Cumulative GPA: ${escapeHtml(cumulative.unweighted)}</td>
      <td>Cumulative Credits: ${escapeHtml(cumulative.credits > 0 ? cumulative.credits.toFixed(1) : '—')}</td>
    </tr>
  </tbody>
</table>

<!-- GRADING SCALE -->
<table class="scale-table">
  <thead>
    <tr>
      <th class="scale-header" colspan="9">Grading Scale (Unweighted &mdash; AP courses add +1.0)</th>
      <th class="scale-header" colspan="2">Course Types</th>
    </tr>
    <tr>
      <th>A</th><th>A&minus;</th><th>B+</th><th>B</th><th>B&minus;</th><th>C+</th><th>C</th><th>D</th><th>F</th>
      <td rowspan="2" colspan="2" style="text-align:left;padding:1px 4px;vertical-align:top;border:0.5px solid #999;">
        <strong>AP</strong>&nbsp;&nbsp;Advanced Placement<br/>
        <strong>Core / Elec</strong>&nbsp;&nbsp;Core Curriculum / Elective
      </td>
    </tr>
    <tr>
      <td class="scale-val">4.0</td><td class="scale-val">3.7</td><td class="scale-val">3.3</td><td class="scale-val">3.0</td><td class="scale-val">2.7</td><td class="scale-val">2.3</td><td class="scale-val">2.0</td><td class="scale-val">1.0</td><td class="scale-val">0.0</td>
    </tr>
  </thead>
</table>

<!-- SIGNATURE -->
<div class="sig-certify-row">
  <span class="sig-certify-text">Official(s) Certifying Transcript:</span>
  <div class="sig-underline"></div>
</div>
<div class="sig-sub-label">Signature</div>
<div class="sig-name-row">
  <span>Shiyu Zhang, Ph.D.</span>
  <span>President</span>
  <span>${escapeHtml(exportToday)}</span>
</div>
<div class="sig-role-row">
  <span>Printed Name</span>
  <span>Title</span>
  <span>Date</span>
</div>
<div class="sig-seal">NOT VALID WITHOUT OFFICIAL SEAL</div>

<!-- FOOTER -->
<div class="footer">
  <span>Genesis of Ideas International School &mdash; Official Academic Record &mdash; Confidential</span>
  <span>Page 1 of 1</span>
</div>
`;

    const pdfWrapper = document.createElement('div');
    pdfWrapper.style.cssText = 'width:210mm;min-width:210mm;max-width:210mm;margin:0 auto;padding:0;background:#fff;box-sizing:border-box;';
    pdfWrapper.appendChild(pdfDoc);

    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.cssText = 'position:fixed;top:0;left:0;width:210mm;opacity:0;pointer-events:none;z-index:-9999;';
    hiddenContainer.appendChild(pdfWrapper);
    document.body.appendChild(hiddenContainer);

    const options = {
      margin: 0,
      filename: `${(profile?.name || 'Transcript').replace(/[\\/:*?"<>|]/g, '-')}_Transcript.pdf`,
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        ignoreElements: (el) => el.tagName === 'BUTTON',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    window.html2pdf()
      .set(options)
      .from(pdfWrapper)
      .save()
      .finally(() => {
        document.body.removeChild(hiddenContainer);
        setIsStaticMode(false);
      });
  }, 0);
}
