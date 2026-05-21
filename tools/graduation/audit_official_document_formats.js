#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const FILES = {
  contract: path.join(ROOT, 'docs', 'official-document-format-contract.md'),
  transcriptPdf: path.join(ROOT, 'src', 'components', 'pages', 'Transcript', 'transcriptPdf.js'),
  diplomaPage: path.join(ROOT, 'src', 'components', 'pages', 'Diploma', 'DiplomaPage.js'),
  packageScript: path.join(ROOT, 'server', 'scripts', 'send-graduation-document-packages.js'),
  transparentSeal: path.join(ROOT, 'src', 'img', 'transcript_seal_transparent.png'),
};

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function expectFile(label, file) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} missing: ${path.relative(ROOT, file)}`);
  }
}

function expectIncludes(label, content, needle) {
  if (!content.includes(needle)) {
    throw new Error(`${label} missing expected marker: ${needle}`);
  }
}

function expectAnyIncludes(label, content, needles) {
  if (!needles.some((needle) => content.includes(needle))) {
    throw new Error(`${label} missing expected marker; expected one of: ${needles.join(' | ')}`);
  }
}

function expectNotIncludes(label, content, needle) {
  if (content.includes(needle)) {
    throw new Error(`${label} contains forbidden marker: ${needle}`);
  }
}

function main() {
  for (const [label, file] of Object.entries(FILES)) {
    expectFile(label, file);
  }

  const contract = read(FILES.contract);
  const transcript = read(FILES.transcriptPdf);
  const diploma = read(FILES.diplomaPage);
  const packageScript = read(FILES.packageScript);

  expectIncludes('contract', contract, 'Official Document Format Contract');
  expectIncludes('contract', contract, 'npm run audit:official-docs');

  for (const [label, content] of [
    ['frontend transcript PDF', transcript],
    ['frontend diploma page', diploma],
    ['graduation package script', packageScript],
  ]) {
    expectIncludes(label, content, 'transcript_seal_transparent.png');
    expectNotIncludes(label, content, "transcript_seal.jpg'");
    expectNotIncludes(label, content, 'transcript_seal.jpg"');
  }

  for (const [label, content] of [
    ['frontend transcript PDF', transcript],
    ['graduation package script', packageScript],
  ]) {
    expectIncludes(label, content, "const HEAD_BG = '#dce6f1'");
    expectIncludes(label, content, "const ALT_ROW");
    expectIncludes(label, content, '#f5f8fc');
    expectIncludes(label, content, "const NAVY");
    expectIncludes(label, content, '#2b3d6d');
    expectIncludes(label, content, 'OFFICIAL TRANSCRIPT');
    expectAnyIncludes(label, content, ['border:2px solid ${NAVY}', 'border: 2px solid ${NAVY}']);
    expectIncludes(label, content, 'Transcript Date: ${');
  }

  expectIncludes('frontend transcript PDF', transcript, 'const transcriptDateDisplay = exportToday');
  expectIncludes('frontend transcript PDF', transcript, 'President &amp; Principal: Shiyu Zhang, Ph.D.');

  expectIncludes('graduation package script', packageScript, 'const issueDate = todayForPdf()');
  expectIncludes('graduation package script', packageScript, 'parseCc(process.env.GRADUATION_DOCUMENT_CC)');
  expectIncludes('graduation package script', packageScript, 'studentNameSvg(student.name)');
  expectIncludes('graduation package script', packageScript, 'object-fit: contain');
  expectIncludes('graduation package script', packageScript, 'border: none');

  expectIncludes('frontend diploma page', diploma, 'viewBox="0 0 520 82"');
  expectIncludes('frontend diploma page', diploma, 'aria-label={student.name}');
  expectIncludes('frontend diploma page', diploma, 'studentNameShadow');
  expectIncludes('frontend diploma page', diploma, "objectFit: 'contain'");
  expectIncludes('frontend diploma page', diploma, "border: 'none'");
  expectIncludes('frontend diploma page', diploma, "background: 'transparent'");

  const sealBytes = fs.readFileSync(FILES.transparentSeal);
  const pngSignature = '89504e470d0a1a0a';
  if (sealBytes.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error('transparent seal is not a PNG file');
  }
  const colorType = sealBytes[25];
  if (colorType !== 4 && colorType !== 6) {
    throw new Error('transparent seal PNG does not have an alpha channel');
  }

  console.log('PASS official document format contract');
}

try {
  main();
} catch (err) {
  console.error(`FAIL official document format contract: ${err.message}`);
  process.exitCode = 1;
}
