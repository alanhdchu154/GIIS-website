#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const JSON_OUT = process.argv.includes('--json');

const RESPONSE_CHECK_RE = /^Review this response for accuracy\./i;

const PRIORITY_SLUGS = new Map([
  ['algebra-i', 1],
  ['english-i', 1],
  ['biology', 1],
  ['us-history', 1],
  ['government', 1],
  ['geometry', 2],
  ['algebra-ii', 2],
  ['chemistry', 2],
  ['english-ii', 2],
  ['world-history', 2],
]);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function extractCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const items = [];

  for (const q of course.quizQuestions || []) {
    if (RESPONSE_CHECK_RE.test(String(q.question || ''))) {
      items.push({
        area: 'quiz',
        moduleOrder: q.moduleOrder,
        order: q.order,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
      });
    }
  }

  for (const q of course.questions || []) {
    if (RESPONSE_CHECK_RE.test(String(q.question || ''))) {
      items.push({
        area: q.examType || 'final',
        order: q.order,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
      });
    }
  }

  if (!items.length) return null;
  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    name: course.name,
    priority: PRIORITY_SLUGS.get(course.slug) || (/\bAP\b/i.test(course.name || '') ? 4 : 3),
    count: items.length,
    quizCount: items.filter((item) => item.area === 'quiz').length,
    examCount: items.filter((item) => item.area !== 'quiz').length,
    items,
  };
}

const courses = walk(COURSE_DIR)
  .map(extractCourse)
  .filter(Boolean)
  .sort((a, b) => a.priority - b.priority || b.count - a.count || a.slug.localeCompare(b.slug));

const summary = courses.reduce((acc, course) => {
  acc.courses += 1;
  acc.items += course.count;
  acc.quiz += course.quizCount;
  acc.exam += course.examCount;
  acc.byPriority[course.priority] = (acc.byPriority[course.priority] || 0) + course.count;
  return acc;
}, { courses: 0, items: 0, quiz: 0, exam: 0, byPriority: {} });

if (JSON_OUT) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), summary, courses }, null, 2));
} else {
  console.log(`Assessment rewrite queue: ${summary.items} response-check items across ${summary.courses} courses`);
  console.log(`quiz=${summary.quiz} exam=${summary.exam} priority=${JSON.stringify(summary.byPriority)}`);
  for (const course of courses) {
    console.log(`\n[P${course.priority}] ${course.slug} — ${course.name}: ${course.count} items (${course.file})`);
    for (const item of course.items.slice(0, 5)) {
      const label = item.area === 'quiz' ? `quiz m${item.moduleOrder} #${item.order}` : `${item.area} #${item.order}`;
      console.log(`  - ${label}: ${item.question}`);
    }
    if (course.items.length > 5) console.log(`  ... ${course.items.length - 5} more`);
  }
}
