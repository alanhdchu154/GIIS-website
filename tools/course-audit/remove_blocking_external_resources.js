#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const OUT_PATH = path.join(ROOT, 'umi', 'reviews', 'latest-blocking-external-resource-removal.json');
const DRY_RUN = process.argv.includes('--dry-run');

const BLOCKING_HOSTS = new Set([
  'apclassroom.collegeboard.org',
  'canva.com',
  'commonlit.org',
  'criterion.com',
  'docs.google.com',
  'drive.google.com',
  'grammarly.com',
  'hbr.org',
  'jstor.org',
  'khanacademy.org',
  'medium.com',
  'noredink.com',
  'practiceit.cs.washington.edu',
  'slides.google.com',
]);

const URL_FIELDS = [
  'readingUrl',
  'videoUrl',
  'video2Url',
  'practiceUrl',
];

const BLOCKING_TEXT_RE = /\b(Khan Academy|khanacademy\.org|CommonLit|NoRedInk|JSTOR|HBR|Criterion|AP Classroom)\b/i;

function walkJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(full, out);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('._')) out.push(full);
  }
  return out;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function noteFor(host) {
  if (host === 'khanacademy.org') {
    return 'GIIS Learn Portal — use the module lesson, assigned course materials, and teacher-reviewed practice inside the GIIS course path; no external practice platform is required.';
  }
  return 'GIIS Learn Portal — use the module lesson, assigned course materials, and teacher-reviewed practice inside the GIIS course path; the removed external resource may require login, permission, or paid/institutional access.';
}

function cleanTextResidue(value, field) {
  const text = String(value || '');
  if (!BLOCKING_TEXT_RE.test(text)) return text;
  if (/assignment/i.test(field)) {
    return text
      .replace(/,\s*and one additional 21st-century text of your choice from CommonLit featuring a diverse American voice/i, ', and one additional teacher-provided or public-domain contemporary text featuring a diverse American voice')
      .replace(/\bJSTOR,\s*/gi, '')
      .replace(/\s*or ProQuest\b/gi, '')
      .replace(/\busing Google Scholar or JSTOR\b/gi, 'using Google Scholar or an open scholarly source')
      .replace(/\bJSTOR\b/gi, 'an open scholarly source')
      .replace(/\bCommonLit\b/gi, 'a teacher-provided reading')
      .replace(/\bKhan Academy\b/gi, 'the GIIS Learn Portal');
  }
  return 'GIIS Learn Portal — use the module lesson, assigned course materials, and teacher-reviewed practice inside the GIIS course path; no external practice platform is required.';
}

function main() {
  const files = walkJson(COURSE_DIR).sort();
  const actions = [];

  for (const file of files) {
    const course = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const mod of course.modules || []) {
      for (const field of URL_FIELDS) {
        const url = mod[field];
        if (!url) continue;
        const host = hostOf(url);
        if (!BLOCKING_HOSTS.has(host)) continue;

        const noteField = field.replace(/Url$/, 'Note');
        actions.push({
          file: path.relative(ROOT, file),
          course: course.slug,
          moduleOrder: mod.order,
          moduleTitle: mod.title,
          field,
          host,
          oldUrl: url,
          oldNote: mod[noteField] || '',
        });
        mod[field] = 'https://genesisideas.school/learn';
        if (Object.prototype.hasOwnProperty.call(mod, noteField)) mod[noteField] = noteFor(host);
      }
      for (const [field, value] of Object.entries(mod)) {
        if (typeof value !== 'string' || !BLOCKING_TEXT_RE.test(value)) continue;
        const next = cleanTextResidue(value, field);
        if (next === value) continue;
        actions.push({
          file: path.relative(ROOT, file),
          course: course.slug,
          moduleOrder: mod.order,
          moduleTitle: mod.title,
          field,
          host: 'text-residue',
          oldUrl: '',
          oldNote: value,
        });
        mod[field] = next;
      }
    }
    if (!DRY_RUN) fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  }

  const byHost = {};
  for (const action of actions) byHost[action.host] = (byHost[action.host] || 0) + 1;
  const summary = {
    dryRun: DRY_RUN,
    files: files.length,
    actions: actions.length,
    byHost: Object.entries(byHost).sort((a, b) => b[1] - a[1]).map(([host, count]) => ({ host, count })),
  };
  fs.writeFileSync(OUT_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, actions }, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
