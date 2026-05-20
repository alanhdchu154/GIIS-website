#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function normalizeQuestion(q) {
  const answer = String(q.answer || '').trim();
  const index = /^[A-D]$/i.test(answer) ? answer.toUpperCase().charCodeAt(0) - 65 : -1;
  if (index < 0 || !Array.isArray(q.options) || !q.options[index]) return false;
  q.answer = String(q.options[index]);
  return true;
}

let changedFiles = 0;
let changedQuestions = 0;

for (const file of walk(COURSE_DIR)) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = 0;
  for (const q of course.quizQuestions || []) if (normalizeQuestion(q)) changed += 1;
  for (const q of course.questions || []) if (normalizeQuestion(q)) changed += 1;
  if (!changed) continue;

  fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  changedFiles += 1;
  changedQuestions += changed;
  console.log(`Normalized ${changed} answer key(s): ${path.relative(ROOT, file)}`);
}

console.log(`Done. ${changedQuestions} answer key(s) normalized across ${changedFiles} file(s).`);
