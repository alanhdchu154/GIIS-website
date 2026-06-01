#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DRY_RUN = process.argv.includes('--dry-run');

const ASSIGNMENT_EVIDENCE_RE = /\b(submit|include|provide|create|write|draw|design|record|calculate|compare|analyze|research|source|evidence|data|reflection|report|chart|table|outline|plan|link|document|presentation|explain|justify|solve|show|build|label|identify|annotate|summarize|draft|revise|map|diagram|model|graph|list|cite|evaluate|interpret|demonstrate)\b/i;
const SUBMISSION_SENTENCE = ' Submit your work as a document, image, or link showing the steps, evidence, and final response.';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function repairCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = 0;

  for (const mod of course.modules || []) {
    const assignment = String(mod.assignment || '').trim();
    if (!assignment || ASSIGNMENT_EVIDENCE_RE.test(assignment)) continue;
    mod.assignment = `${assignment.replace(/\s+$/, '')}${SUBMISSION_SENTENCE}`;
    changed += 1;
  }

  if (changed && !DRY_RUN) {
    fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  }

  return changed ? { file: path.relative(ROOT, file), slug: course.slug, changed } : null;
}

const results = walk(COURSE_DIR).map(repairCourse).filter(Boolean);
const total = results.reduce((sum, row) => sum + row.changed, 0);

console.log(`${DRY_RUN ? 'Would repair' : 'Repaired'} ${total} assignment prompts in ${results.length} course files.`);
for (const row of results) {
  console.log(`- ${row.slug}: ${row.changed} (${row.file})`);
}
