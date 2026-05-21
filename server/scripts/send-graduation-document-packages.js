#!/usr/bin/env node
/* eslint-disable no-console */
require('../lib/resolveDatabaseUrl');

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const { computeRowGpa } = require('../src/lib/gpa');
const { sendGraduationDocumentPackage, ADMIN_EMAIL } = require('../src/lib/mailer');

const ROOT = path.resolve(__dirname, '..', '..');
const SEED_PATH = path.join(ROOT, 'server', 'prisma', 'seed.js');
const OUT_DIR = path.join(ROOT, 'server', 'tmp', 'graduation-documents');
const VERIFY_BASE = 'https://genesisideas.school/verify';

const NAVY = '#2b3d6d';
const GOLD = '#b8962e';
const HEAD_BG = '#dce6f1';
const ALT_ROW = '#f5f8fc';

const ASSETS = {
  logo: path.join(ROOT, 'src', 'img', 'logo_nobg.png'),
  logoSlogan: path.join(ROOT, 'src', 'img', 'logo_slogan.png'),
  seal: path.join(ROOT, 'src', 'img', 'transcript_seal_transparent.png'),
};

const SENIORS = [
  { code: '26-001', name: 'Ruwen Li', email: 'ruwen.li@genesisideas.school', gender: 'Female', birthDate: '2006-11-27', parentGuardian: 'Xiaojun Wu', address: "Unit 1802, Building 12, Baopo Apartment, Jing'an District", city: 'Shanghai', province: 'Shanghai', zipCode: '200000', entryDate: '2022-08-15', semestersVar: 'ruwenLiSemesters', transcriptDate: '2026-03-02', graduationDate: '2026-06-30' },
  { code: '26-002', name: 'Tao Zhang', email: 'tao.zhang@genesisideas.school', gender: 'Male', birthDate: '2007-02-18', parentGuardian: 'Xiaoying Zhang', address: 'Room 601, No. 72, Lane 99, Jinhe Road', city: 'Shanghai', province: 'Shanghai', zipCode: '200120', entryDate: '2022-08-15', semestersVar: 'taoZhangSemesters', transcriptDate: '2026-04-23', graduationDate: '2026-06-30' },
  { code: '26-003', name: 'Baoyi Lu', email: 'baoyi.lu@genesisideas.school', gender: 'Male', birthDate: '2007-12-25', parentGuardian: 'Kaiming Lu', address: 'No. 88 Huasheng Road', city: 'Cixi', province: 'Zhejiang', zipCode: '315300', entryDate: '2022-08-15', semestersVar: 'baoyiLuSemesters', transcriptDate: '2026-02-06', graduationDate: '2026-06-30' },
  { code: '26-004', name: 'Yunfan Yang', email: 'yunfan.yang@genesisideas.school', gender: 'Female', birthDate: '2007-11-01', parentGuardian: 'Chunxiao Lu', address: 'Room 702, Building 9, Poly City Light, Liangxi District', city: 'Wuxi', province: 'Jiangsu', zipCode: '214000', entryDate: '2022-08-23', semestersVar: 'yunfanYangSemesters', transcriptDate: '2026-02-06', graduationDate: '2026-06-30' },
  { code: '26-005', name: 'Hanxi Xiao', email: 'hanxi.xiao@genesisideas.school', gender: 'Female', birthDate: '2007-03-21', parentGuardian: 'Shuying Zhao', address: 'Building 10, Unit 702, Zhongbai Hubin No. 1, Zhujiajiao Town', city: 'Shanghai', province: 'Shanghai', zipCode: '201713', entryDate: '2022-08-15', semestersVar: 'hanxiXiaoSemesters', transcriptDate: '2026-05-12', graduationDate: '2026-06-30' },
];

function assetDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

const logoUri = assetDataUri(ASSETS.logo);
const logoSloganUri = assetDataUri(ASSETS.logoSlogan);
const sealUri = assetDataUri(ASSETS.seal);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function todayForPdf() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function dateDisplay(date) {
  if (!date) return '—';
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' });
}

function normalizeDateForPdf(date) {
  return dateDisplay(date);
}

function ordinal(n) {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

function diplomaDate(date) {
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  return `${ordinal(d.getUTCDate())} day of ${d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' })}, A.D. ${d.getUTCFullYear()}`;
}

function parseCc(value) {
  if (!value) return ADMIN_EMAIL;
  const entries = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  return entries.length > 1 ? entries : entries[0] || ADMIN_EMAIL;
}

function recipientList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function recordIssueLog({ prisma, student, principalEmail, cc, result }) {
  if (!prisma || !student || !result?.ok) return;
  const dbStudent = await prisma.student.findUnique({
    where: { studentCode: student.code },
    select: { id: true },
  }).catch(() => null);
  const studentId = dbStudent?.id || null;
  const providerId = result.id || null;
  const recipient = [principalEmail, ...recipientList(cc)].filter(Boolean).join(', ');
  await prisma.emailLog.create({
    data: {
      kind: 'official_graduation_documents',
      recipient,
      studentId,
      providerId,
      dedupeKey: providerId ? `official_graduation_documents:${providerId}` : undefined,
      status: 'sent',
    },
  }).catch((err) => {
    console.warn(`[graduation-documents] email log failed ${student.code}: ${err.message}`);
  });
  await prisma.auditLog.create({
    data: {
      action: 'official_documents_sent',
      studentId,
      actorRole: 'admin',
      actorEmail: process.env.GRADUATION_DOCUMENT_ACTOR || 'script:send-graduation-document-packages',
    },
  }).catch((err) => {
    console.warn(`[graduation-documents] audit log failed ${student.code}: ${err.message}`);
  });
}

function loadSeedSemesters() {
  const seedSource = fs.readFileSync(SEED_PATH, 'utf8');
  const mainCallIndex = seedSource.indexOf('\nmain()');
  if (mainCallIndex < 0) throw new Error('Could not find seed main() call.');
  const inspectSource = `${seedSource.slice(0, mainCallIndex)}
globalThis.__seniorSemesters = {
  ruwenLiSemesters,
  taoZhangSemesters,
  baoyiLuSemesters,
  yunfanYangSemesters,
  hanxiXiaoSemesters,
};
`;
  const sandbox = {
    console,
    require: (id) => {
      if (id === '../lib/resolveDatabaseUrl') return {};
      if (id === '@prisma/client') return { PrismaClient: class { $disconnect() {} } };
      if (id === 'bcryptjs') return { hash: async () => '' };
      if (id === '../src/lib/gpa') return require(path.join(ROOT, 'server', 'src', 'lib', 'gpa'));
      return require(id);
    },
    __dirname: path.join(ROOT, 'server', 'prisma'),
    process: { env: {}, exit: (code) => { throw new Error(`process.exit(${code})`); } },
    Date,
  };
  vm.runInNewContext(inspectSource, sandbox, { filename: SEED_PATH });
  return sandbox.__seniorSemesters;
}

function rowsForSemester(semester) {
  return semester.courseRows.create.map((row) => {
    const gpas = computeRowGpa(row);
    return {
      name: row.courseName,
      type: row.courseType,
      credits: Number(row.credits),
      grade: row.letterGrade,
      weightedGpa: row.weightedGpa ?? gpas.weightedGpa,
      unweightedGpa: row.unweightedGpa ?? gpas.unweightedGpa,
    };
  });
}

function semesterTotals(rows) {
  let credits = 0;
  let weighted = 0;
  let unweighted = 0;
  for (const row of rows) {
    if (!row.grade || row.grade === 'F' || !row.credits) continue;
    credits += row.credits;
    weighted += row.weightedGpa * row.credits;
    unweighted += row.unweightedGpa * row.credits;
  }
  return {
    credits,
    weighted: credits ? (weighted / credits).toFixed(2) : '—',
    unweighted: credits ? (unweighted / credits).toFixed(2) : '—',
  };
}

function cumulative(semesters) {
  const rows = semesters.flatMap(rowsForSemester);
  return semesterTotals(rows);
}

function semesterTable(semester) {
  const rows = rowsForSemester(semester);
  const totals = semesterTotals(rows);
  const td = `font-size:6pt;border:0.5px solid #ccc;padding:2px 3px;vertical-align:middle;`;
  const hd = `font-size:5.5pt;font-weight:bold;padding:2px 3px;border:0.5px solid #999;background:${HEAD_BG};white-space:normal;line-height:1.2;`;
  return `
    <div style="margin-bottom:1mm;">
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:&quot;Times New Roman&quot;,Times,serif;">
        <colgroup>
          <col style="width:44%;" />
          <col style="width:10%;" />
          <col style="width:8%;" />
          <col style="width:8%;" />
          <col style="width:15%;" />
          <col style="width:15%;" />
        </colgroup>
        <thead>
          <tr><th colspan="6" style="font-size:7pt;font-weight:bold;padding:1.5px 3px;text-align:left;border:0.5px solid #999;background:#fff;">${escapeHtml(semester.key)}</th></tr>
          <tr>
            <th style="${hd}width:44%;text-align:left;">Course Name</th>
            <th style="${hd}width:10%;text-align:center;">Type</th>
            <th style="${hd}width:8%;text-align:center;">Credits</th>
            <th style="${hd}width:8%;text-align:center;">Grade</th>
            <th style="${hd}width:15%;text-align:center;">Weighted GPA</th>
            <th style="${hd}width:15%;text-align:center;">Unweighted GPA</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td style="${td}width:44%;text-align:left;${index % 2 ? `background:${ALT_ROW};` : ''}">${escapeHtml(row.name)}</td>
              <td style="${td}width:10%;text-align:center;${index % 2 ? `background:${ALT_ROW};` : ''}">${escapeHtml(row.type)}</td>
              <td style="${td}width:8%;text-align:center;${index % 2 ? `background:${ALT_ROW};` : ''}">${row.credits.toFixed(1)}</td>
              <td style="${td}width:8%;text-align:center;${index % 2 ? `background:${ALT_ROW};` : ''}">${escapeHtml(row.grade)}</td>
              <td style="${td}width:15%;text-align:center;${index % 2 ? `background:${ALT_ROW};` : ''}">${row.weightedGpa.toFixed(1)}</td>
              <td style="${td}width:15%;text-align:center;${index % 2 ? `background:${ALT_ROW};` : ''}">${row.unweightedGpa.toFixed(1)}</td>
            </tr>
          `).join('')}
          <tr>
            <td style="font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:2px 3px;vertical-align:middle;">Semester Totals</td>
            <td style="font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:2px 3px;vertical-align:middle;text-align:center;"></td>
            <td style="font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:2px 3px;vertical-align:middle;text-align:center;">${totals.credits.toFixed(1)}</td>
            <td style="font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:2px 3px;vertical-align:middle;text-align:center;"></td>
            <td style="font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:2px 3px;vertical-align:middle;text-align:center;">${totals.weighted}</td>
            <td style="font-size:6pt;background:${HEAD_BG};font-weight:bold;border:0.5px solid #999;border-top:1px solid #999;padding:2px 3px;vertical-align:middle;text-align:center;">${totals.unweighted}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function transcriptHtml(student, semesters) {
  const totals = cumulative(semesters);
  const left = semesters.slice(0, 4).map(semesterTable).join('');
  const right = semesters.slice(4).map(semesterTable).join('');
  const issueDate = todayForPdf();

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #000; font-family: "Times New Roman", Times, serif; }
    .page { width: 210mm; min-height: 297mm; padding: 0; position: relative; overflow: hidden; }
    .inner { width: 190mm; margin: 0 auto; padding: 6mm 7mm 4mm; background: #fff; color: #000; }
    .header { display: grid; grid-template-columns: 12% 66% 22%; align-items: center; }
    .logo { height: 52px; width: auto; display: block; }
    .record { text-align: center; }
    .record .kicker { font-size: 6.5pt; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 0.5mm; }
    .record h1 { margin: 0 0 1.5mm; font-size: 16pt; line-height: 1.1; color: #1a1a2e; }
    .record .meta { font-size: 7pt; color: #444; }
    .badge { display: inline-block; border: 2px solid ${NAVY}; color: ${NAVY}; font: 700 7.5pt "Times New Roman", Times, serif; padding: 2px 6px; letter-spacing: 0.5px; margin-bottom: 2mm; }
    .rightmeta { font: 6.5pt Arial, sans-serif; color: #444; line-height: 1.6; text-align: right; }
    .rule1 { border-top: 2px solid ${NAVY}; margin-top: 0; margin-bottom: 2mm; }
    .info { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 2mm; }
    .info td { border: 0.5px solid #999; padding: 0.8mm 1.5mm; font: 6.5pt "Times New Roman", Times, serif; vertical-align: top; width: 25%; }
    .columns { position: relative; display: grid; grid-template-columns: 49% 2% 49%; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 55%; opacity: 0.18; z-index: 0; }
    .col { position: relative; z-index: 1; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 0.5px solid #ccc; padding: 2px 3px; font: 6pt "Times New Roman", Times, serif; vertical-align: middle; text-align: center; }
    th { background: ${HEAD_BG}; font-weight: 700; font-size: 5.5pt; line-height: 1.2; }
    .semester-title { text-align: left; background: #fff; border-color: #999; font-size: 7pt; padding: 1.5px 3px; }
    .name { width: 44%; text-align: left; }
    .cum { width: 100%; border-collapse: collapse; margin: 1.2mm 0 1.6mm; }
    .cum td { border: 0.5px solid #999; background: ${HEAD_BG}; padding: 1.5px 4px; font-size: 7.5pt; text-align: left; }
    .cum .label { width: 12%; text-align: center; font-weight: 700; }
    .scale { width: 100%; margin-bottom: 1mm; }
    .scale td { border: none; padding: 0; vertical-align: top; }
    .small-title { font: 700 5.5pt "Times New Roman", Times, serif; background: ${HEAD_BG}; border: 0.5px solid #999; border-bottom: none; padding: 1px 3px; }
    .scale table td { border: 0.5px solid #ccc; padding: 0.5px 2px; font-size: 5.5pt; text-align: center; }
    .signature-block { width: 100%; border-collapse: collapse; margin-top: 3mm; margin-bottom: 1mm; }
    .signature-block td { border: none; padding: 0; }
    .seal { width: 62px; height: 62px; object-fit: contain; display: block; margin: 0 auto; filter: saturate(115%) contrast(106%) brightness(103%) drop-shadow(0 1px 2px rgba(120,90,20,0.22)); }
    .sig-title { font-size: 8pt; margin-bottom: 1px; }
    .sig-line { border-bottom: 1px solid #333; margin-bottom: 1mm; height: 10px; }
    .sig-note { font-size: 7pt; color: #333; margin-bottom: 3mm; text-align: right; }
    .sig-table td { text-align: center; font-size: 8pt; font-weight: 600; padding: 1px 4px; }
    .sig-table tr:last-child td { font-size: 6pt; color: #666; letter-spacing: 0.8px; text-transform: uppercase; border-top: 1px solid #555; font-weight: 400; }
    .footer { width: 100%; border-collapse: collapse; border-top: 0.5px solid #ccc; margin-top: 1mm; }
    .footer td { border: none; color: #888; font-size: 6.5pt; padding-top: 1mm; }
  </style>
</head>
<body>
  <div class="page">
  <div class="inner">
    <div class="header">
      <img class="logo" src="${logoUri}" alt="GIIS" />
      <div class="record">
        <div class="kicker">Official Academic Record</div>
        <h1>Genesis of Ideas International School</h1>
        <div class="meta">7901 4th St N STE 300, St. Petersburg, FL 33702 &nbsp;|&nbsp; +1 (813) 501-5756 &nbsp;|&nbsp; genesisideas.school</div>
      </div>
      <div>
        <div class="badge">OFFICIAL TRANSCRIPT</div>
        <div class="rightmeta">FL School Code: 650<br>President &amp; Principal: Shiyu Zhang, Ph.D.<br>admissions@genesisideas.school</div>
      </div>
    </div>
    <div class="rule1"></div>
    <table class="info">
      <tr>
        <td>Name: ${escapeHtml(student.name)}</td><td>Birth Date: ${escapeHtml(normalizeDateForPdf(student.birthDate))}</td><td>Gender: ${escapeHtml(student.gender || '—')}</td><td>Parent/Guardian: ${escapeHtml(student.parentGuardian || '—')}</td>
      </tr>
      <tr>
        <td>Address: ${escapeHtml(student.address || '—')}</td><td>City: ${escapeHtml(student.city || '—')}</td><td>Province: ${escapeHtml(student.province || '—')}</td><td>Zip Code: ${escapeHtml(student.zipCode || '—')}</td>
      </tr>
      <tr>
        <td>Entry Date: ${escapeHtml(normalizeDateForPdf(student.entryDate))}</td><td>Withdrawal Date: —</td><td>Graduation Date: ${dateDisplay(student.graduationDate)}</td><td>Transcript Date: ${issueDate}</td>
      </tr>
    </table>
    <div class="columns">
      <img class="watermark" src="${logoSloganUri}" alt="" />
      <div class="col">${left}</div><div></div><div class="col">${right}</div>
    </div>
    <table class="cum">
      <tr><td class="label">Weighted</td><td>Cumulative GPA: ${totals.weighted}</td><td>Cumulative Credits: ${totals.credits.toFixed(1)}</td></tr>
      <tr><td class="label">Unweighted</td><td>Cumulative GPA: ${totals.unweighted}</td><td>Cumulative Credits: ${totals.credits.toFixed(1)}</td></tr>
    </table>
    <table class="scale"><tr>
      <td style="width:65%;padding-right:3mm;">
        <div class="small-title">Grading Scale (Unweighted — AP courses add +1.0)</div>
        <table><tr>${['A','A−','B+','B','B−','C+','C','D','F'].map((g, i) => `<td style="${i % 2 ? `background:${ALT_ROW};` : ''}font-weight:bold;">${g}</td>`).join('')}</tr>
        <tr>${['4.0','3.7','3.3','3.0','2.7','2.3','2.0','1.0','0.0'].map((g, i) => `<td style="${i % 2 ? `background:${ALT_ROW};` : ''}">${g}</td>`).join('')}</tr></table>
      </td>
      <td style="width:35%;padding-left:2mm;">
        <div class="small-title">Course Types</div>
        <table><tr><td style="width:22%;font-weight:bold;">AP</td><td style="text-align:left;">Advanced Placement</td></tr><tr><td style="background:${ALT_ROW};font-weight:bold;">Core / Elec</td><td style="background:${ALT_ROW};text-align:left;">Core Curriculum / Elective</td></tr></table>
      </td>
    </tr></table>
    <table class="signature-block"><tr>
      <td style="width:18%;text-align:center;vertical-align:middle;padding:0 2mm 0 0;"><img class="seal" src="${sealUri}" alt="Official Seal" /></td>
      <td style="width:82%;vertical-align:top;padding:0;">
        <div class="sig-title">Official(s) Certifying Transcript:</div>
        <div class="sig-line"></div>
        <div class="sig-note">Signature</div>
        <table class="sig-table"><tr><td>Shiyu Zhang, Ph.D.</td><td>President &amp; Principal</td><td>${issueDate}</td></tr><tr><td>Printed Name</td><td>Title</td><td>Date</td></tr></table>
      </td>
    </tr></table>
    <table class="footer"><tr><td>Genesis of Ideas International School — Official Academic Record — Confidential</td><td style="text-align:right;">Page 1 of 1</td></tr></table>
  </div>
  </div>
</body>
</html>`;
}

function qrSvg(value) {
  return ReactDOMServer.renderToStaticMarkup(React.createElement(QRCodeSVG, {
    value,
    size: 52,
    bgColor: 'transparent',
    fgColor: NAVY,
    level: 'M',
  }));
}

function borderPatternSvg() {
  return `
    <svg width="0" height="0" style="position:absolute">
      <defs>
        <pattern id="guilloche" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="none"></rect>
          <path d="M0 10 Q5 0 10 10 Q15 20 20 10" fill="none" stroke="${GOLD}" stroke-width="0.6" opacity="0.7"></path>
          <path d="M0 10 Q5 20 10 10 Q15 0 20 10" fill="none" stroke="${NAVY}" stroke-width="0.4" opacity="0.5"></path>
        </pattern>
        <pattern id="cornerFill" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="none"></rect>
          <circle cx="4" cy="4" r="1" fill="${GOLD}" opacity="0.4"></circle>
        </pattern>
      </defs>
    </svg>`;
}

function cornerOrnamentSvg() {
  return `
    <svg width="80" height="80" viewBox="0 0 80 80" style="display:block">
      <g>
        <path d="M2 2 L2 35 Q2 45 12 45" fill="none" stroke="${GOLD}" stroke-width="1.5"></path>
        <path d="M2 2 L35 2 Q45 2 45 12" fill="none" stroke="${GOLD}" stroke-width="1.5"></path>
        <path d="M5 5 L5 32 Q5 42 15 42" fill="none" stroke="${GOLD}" stroke-width="0.6" opacity="0.6"></path>
        <path d="M5 5 L32 5 Q42 5 42 15" fill="none" stroke="${GOLD}" stroke-width="0.6" opacity="0.6"></path>
        <circle cx="8" cy="8" r="3" fill="${GOLD}" opacity="0.8"></circle>
        <circle cx="8" cy="8" r="1.5" fill="${NAVY}"></circle>
        <path d="M15 8 Q20 3 25 8 Q30 13 35 8" fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.7"></path>
        <path d="M8 15 Q3 20 8 25 Q13 30 8 35" fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.7"></path>
      </g>
    </svg>`;
}

function schoolSealSvg(size = 160) {
  const r = size / 2;
  const textR = r - 12;
  const innerR = r - 22;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;filter:drop-shadow(0 2px 6px rgba(184,150,46,0.35))">
      <defs>
        <path id="sealArc" d="M ${r},${r} m -${textR},0 a ${textR},${textR} 0 1,1 ${textR * 2},0 a ${textR},${textR} 0 1,1 -${textR * 2},0"></path>
        <radialGradient id="sealGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fffdf5"></stop>
          <stop offset="100%" stop-color="#f5ead0"></stop>
        </radialGradient>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r - 1}" fill="url(#sealGrad)" stroke="${GOLD}" stroke-width="2.5"></circle>
      <circle cx="${r}" cy="${r}" r="${r - 6}" fill="none" stroke="${GOLD}" stroke-width="0.6" stroke-dasharray="3 2"></circle>
      <circle cx="${r}" cy="${r}" r="${r - 12}" fill="none" stroke="${NAVY}" stroke-width="0.8"></circle>
      <text font-size="7.2" fill="${NAVY}" font-family="'Cinzel', serif" letter-spacing="1.5">
        <textPath href="#sealArc" startOffset="2%">GENESIS OF IDEAS INTERNATIONAL SCHOOL</textPath>
      </text>
      <circle cx="${r}" cy="${r}" r="${innerR}" fill="${NAVY}" opacity="0.04"></circle>
      <image href="${logoUri}" x="${r - 34}" y="${r - 32}" width="68" height="54" preserveAspectRatio="xMidYMid meet"></image>
      <text x="${r}" y="${r + 44}" text-anchor="middle" font-size="7.5" fill="${GOLD}" font-family="'Cinzel', serif" letter-spacing="2" font-weight="600">EST. 2022</text>
      ${[-2, -1, 0, 1, 2].map((i) => {
        const a = (90 + i * 22) * (Math.PI / 180);
        const sr = r - 7;
        return `<text x="${r + sr * Math.cos(a)}" y="${r + sr * Math.sin(a) + 2.5}" text-anchor="middle" font-size="5" fill="${GOLD}" opacity="0.85">★</text>`;
      }).join('')}
    </svg>`;
}

function studentNameSvg(name) {
  const safeName = escapeHtml(name);
  return `
    <svg class="name-svg" viewBox="0 0 520 82" role="img" aria-label="${safeName}" style="width:5.05in;max-width:100%;height:0.78in;display:block;margin:0 auto 2px;overflow:visible;background:transparent">
      <defs>
        <filter id="studentNameShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(184,150,46,0.25)"></feDropShadow>
        </filter>
      </defs>
      <text x="260" y="52" text-anchor="middle" font-family="'Great Vibes', 'Pinyon Script', cursive" font-size="58" letter-spacing="2" fill="${NAVY}" filter="url(#studentNameShadow)">${safeName}</text>
    </svg>`;
}

function diplomaHtml(student) {
  const classYear = new Date(`${student.graduationDate}T00:00:00Z`).getUTCFullYear();
  const verifyUrl = `${VERIFY_BASE}/${student.code}`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Great+Vibes&family=Pinyon+Script&display=swap" rel="stylesheet" />
  <style>
    @page { size: Letter landscape; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #2a2a2a; }
    .diploma { width: 11in; height: 8.5in; background: #faf6ed; position: relative; overflow: hidden; font-family: "EB Garamond", Georgia, serif; color: ${NAVY}; }
    .outer { position: absolute; inset: 0; border: 18px solid ${NAVY}; pointer-events: none; z-index: 2; }
    .gold { position: absolute; inset: 18px; border: 4px solid ${GOLD}; pointer-events: none; z-index: 2; }
    .thin { position: absolute; inset: 26px; border: 1px solid ${GOLD}; pointer-events: none; z-index: 2; }
    .guilloche { position: absolute; inset: 28px; border: 14px solid transparent; background: linear-gradient(#faf6ed,#faf6ed) padding-box, repeating-linear-gradient(90deg,${GOLD} 0px,${GOLD} 3px,transparent 3px,transparent 10px) border-box; pointer-events: none; z-index: 1; }
    .corner { position:absolute; z-index:3; }
    .content { position: absolute; top: 52px; bottom: 52px; left: 52px; right: 52px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 12px 0 10px; text-align: center; z-index: 5; }
    .top-small { color: ${GOLD}; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 2px; font-family: "Cinzel Decorative", "Cinzel", serif; }
    .school { font-size: 18px; letter-spacing: 5px; text-transform: uppercase; font-weight: 700; line-height: 1.2; font-family: "Cinzel Decorative", "Cinzel", serif; }
    .rule { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 6px; }
    .rule span.line { width: 1.2in; height: 1px; background: ${GOLD}; opacity: 0.6; }
    .middle { display: flex; align-items: center; width: 100%; flex: 1; margin: 6px 0; }
    .seal-wrap { width: 2in; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
    .class { font-size: 8px; color: ${GOLD}; letter-spacing: 2px; margin-top: 6px; text-transform: uppercase; font-family: "Cinzel Decorative", "Cinzel", serif; }
    .divider { width: 2px; background: linear-gradient(to bottom, transparent, ${GOLD} 15%, ${GOLD} 85%, transparent); align-self: stretch; margin: 0 .28in; }
    .known { font-size: 12px; color: #5a3e2b; font-style: italic; margin: 0 0 4px; letter-spacing: .5px; line-height: 1.4; font-family: "Cormorant Garamond", Garamond, serif; }
    .name-svg { background: transparent !important; box-shadow: none !important; }
    .underline { display: flex; align-items: center; gap: 8px; width: 90%; justify-content: center; margin: 0 auto 8px; }
    .underline .line { flex: 1; height: 1.5px; background: linear-gradient(to right, transparent, ${NAVY}); }
    .underline .line:last-child { background: linear-gradient(to left, transparent, ${NAVY}); }
    .body { font-size: 12.5px; color: #4a3728; line-height: 1.8; margin: 0 0 8px; max-width: 4.8in; font-family: "Cormorant Garamond", Garamond, serif; }
    .title { font-size: 26px; color: ${NAVY}; letter-spacing: 4px; font-weight: 700; text-transform: uppercase; text-shadow: 0 1px 0 rgba(184,150,46,.3); margin-bottom: 8px; font-family: "Cinzel Decorative", "Cinzel", serif; }
    .witness { font-size: 11px; color: #5a3e2b; font-style: italic; margin: 0; line-height: 1.7; font-family: "Cormorant Garamond", Garamond, serif; }
    .bottom { width: 100%; }
    .bottom-rule { height: 1px; background: linear-gradient(to right, transparent, ${GOLD} 30%, ${GOLD} 70%, transparent); margin-bottom: 10px; }
    .sigs { display: flex; justify-content: center; width: 100%; }
    .sig { text-align: center; flex: 1; max-width: 2.2in; padding: 0 16px; }
    .script { height: 44px; display: flex; align-items: flex-end; justify-content: center; font-size: 32px; color: ${NAVY}; white-space: nowrap; line-height: 1; letter-spacing: 1px; }
    .script.principal { font-family: "Pinyon Script", cursive; }
    .script.graduate { font-family: "Great Vibes", cursive; }
    .sig-line { border-top: 1.5px solid ${NAVY}; padding-top: 4px; margin-top: 2px; }
    .sig-name { font-size: 11px; color: ${NAVY}; font-weight: 600; font-style: italic; font-family: "Cormorant Garamond", serif; }
    .sig-title { font-size: 8px; color: #888; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; font-family: "Cinzel", serif; }
    .center-seal { width: 90px; height: 90px; border-radius: 50%; overflow: visible; border: none; background: transparent; margin: 0 16px; box-shadow: none; }
    .center-seal img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: normal; display: block; background: transparent; }
    .eligible { font-size: 8px; color: ${GOLD}; letter-spacing: 1.2px; margin-top: 10px; opacity: .8; }
    .eligible-row { display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px; padding-top:4px; }
    .qr { flex:1; display:flex; justify-content:flex-end; align-items:flex-end; gap:6px; }
    .qr p { font-size: 6px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 3px; font-family: "Cinzel", serif; }
  </style>
</head>
<body>
  <div class="diploma">
    ${borderPatternSvg()}
    <div class="outer"></div><div class="gold"></div><div class="thin"></div><div class="guilloche"></div>
    <div class="corner" style="top:30px;left:30px;">${cornerOrnamentSvg()}</div>
    <div class="corner" style="top:30px;right:30px;transform:scaleX(-1);">${cornerOrnamentSvg()}</div>
    <div class="corner" style="bottom:30px;left:30px;transform:scaleY(-1);">${cornerOrnamentSvg()}</div>
    <div class="corner" style="bottom:30px;right:30px;transform:scale(-1,-1);">${cornerOrnamentSvg()}</div>
    <div class="content">
      <div>
        <div class="top-small">Genesis of Ideas</div>
        <div class="school">International School</div>
        <div class="rule"><span class="line"></span><span style="color:${GOLD};font-size:12px;line-height:1;">❧</span><span style="color:${NAVY};font-size:10px;line-height:1;">✦</span><span style="color:${GOLD};font-size:12px;line-height:1;transform:scaleX(-1);display:inline-block;">❧</span><span class="line"></span></div>
      </div>
      <div class="middle">
        <div class="seal-wrap">${schoolSealSvg(160)}<div class="class">Class of ${classYear}</div></div>
        <div class="divider"></div>
        <div style="flex:1;">
          <p class="known">Be it known to all persons by these presents that</p>
          ${studentNameSvg(student.name)}
          <div class="underline"><span class="line"></span><span style="color:${GOLD};">✦</span><span class="line"></span></div>
          <p class="body">having fulfilled with distinction all requirements<br>prescribed for graduation from this institution, is hereby<br>awarded this</p>
          <div class="title">High School Diploma</div>
          <p class="witness">In witness whereof we have caused the seal of this institution to be<br>affixed and our signatures subscribed on this ${escapeHtml(diplomaDate(student.graduationDate))}.</p>
        </div>
      </div>
      <div class="bottom">
        <div class="bottom-rule"></div>
        <div class="sigs">
          <div class="sig"><div class="script principal">Shiyu Zhang</div><div class="sig-line"><div class="sig-name">Shiyu Zhang, Ph.D.</div><div class="sig-title">President & Principal</div></div></div>
          <div class="center-seal"><img src="${sealUri}" alt="Official School Seal" /></div>
          <div class="sig"><div class="script graduate">${escapeHtml(student.name)}</div><div class="sig-line"><div class="sig-name">${escapeHtml(student.name)}</div><div class="sig-title">Graduate</div></div></div>
        </div>
        <div class="eligible-row">
          <div style="flex:1;"></div>
          <div style="flex:1;text-align:center;"><p class="eligible">DIPLOMA ELIGIBLE AS OF MAY 10, 2026</p></div>
          <div class="qr"><div style="text-align:right;"><p>Verify authenticity</p>${qrSvg(verifyUrl)}</div></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function writePdf(page, html, filePath, options = {}) {
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.pdf({
    path: filePath,
    printBackground: true,
    preferCSSPageSize: true,
    scale: options.scale || 1,
  });
}

async function main() {
  const sendMode = process.argv.includes('--send');
  const principalEmail = process.env.GRADUATION_DOCUMENT_TO || 'shiyu.zhang@genesisideas.school';
  const cc = parseCc(process.env.GRADUATION_DOCUMENT_CC);
  const semestersByName = loadSeedSemesters();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const prisma = sendMode ? new PrismaClient() : null;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });

  try {
    for (const student of SENIORS) {
      const semesters = semestersByName[student.semestersVar];
      const totals = cumulative(semesters);
      const studentForEmail = { ...student, totalCredits: Number(totals.credits.toFixed(1)) };
      const safe = `${student.code}-${student.name.replace(/[^A-Za-z0-9]+/g, '-')}`;
      const transcriptPath = path.join(OUT_DIR, `${safe}-Transcript.pdf`);
      const diplomaPath = path.join(OUT_DIR, `${safe}-Diploma.pdf`);

      await writePdf(page, transcriptHtml(studentForEmail, semesters), transcriptPath, { scale: 0.97 });
      await writePdf(page, diplomaHtml(studentForEmail), diplomaPath);

      console.log(`[graduation-documents] generated ${path.relative(ROOT, transcriptPath)}`);
      console.log(`[graduation-documents] generated ${path.relative(ROOT, diplomaPath)}`);

      if (!sendMode) continue;

      const result = await sendGraduationDocumentPackage({
        principalEmail,
        cc,
        student: studentForEmail,
        transcriptPdf: {
          filename: path.basename(transcriptPath),
          content: fs.readFileSync(transcriptPath).toString('base64'),
        },
        diplomaPdf: {
          filename: path.basename(diplomaPath),
          content: fs.readFileSync(diplomaPath).toString('base64'),
        },
      });

      if (!result.ok) {
        console.error(`[graduation-documents] failed ${student.code} ${student.name}:`, result);
        process.exitCode = 1;
      } else {
        await recordIssueLog({ prisma, student: studentForEmail, principalEmail, cc, result });
        console.log(`[graduation-documents] sent ${student.code} ${student.name}: ${result.id || '(no provider id returned)'}`);
      }
    }

    if (!sendMode) {
      console.log('[graduation-documents] dry run only. Add --send to email generated PDFs.');
    }
  } finally {
    await browser.close();
    if (prisma) await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[graduation-documents] crashed:', err);
  process.exitCode = 1;
});
