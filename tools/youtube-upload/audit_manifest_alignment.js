#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const MANIFEST_PATH = path.join(ROOT, 'public', 'data', 'lessons-manifest.json');
const MIN_TITLE_OVERLAP = 0.3;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function tokens(value) {
  const stop = new Set([
    'and', 'or', 'the', 'a', 'an', 'of', 'to', 'in', 'with', 'for', 'vs',
    'module', 'ap', 'i', 'ii', 'iii',
  ]);
  return new Set(String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !stop.has(token)));
}

function titleOverlap(expected, actual) {
  const expectedTokens = tokens(expected);
  const actualTokens = tokens(actual);
  if (!expectedTokens.size || !actualTokens.size) return 1;
  let overlap = 0;
  expectedTokens.forEach((token) => {
    if (actualTokens.has(token)) overlap += 1;
  });
  return overlap / expectedTokens.size;
}

function loadCourses() {
  const byName = new Map();
  const bySlug = new Map();
  for (const file of walk(COURSE_DIR)) {
    const course = JSON.parse(fs.readFileSync(file, 'utf8'));
    const record = {
      file: path.relative(ROOT, file),
      slug: course.slug,
      name: course.name,
      modules: new Map((course.modules || []).map((module) => [Number(module.order), module])),
    };
    if (record.name) byName.set(record.name, record);
    if (record.slug) bySlug.set(record.slug, record);
  }
  return { byName, bySlug };
}

function issue(severity, code, lesson, message, details = {}) {
  return {
    severity,
    code,
    course: lesson.course,
    course_slug: lesson.course_slug,
    module_number: lesson.module_number,
    module_title: lesson.module_title,
    lesson_dir: lesson.lesson_dir,
    message,
    ...details,
  };
}

function audit() {
  const courses = loadCourses();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const issues = [];
  const lessons = Object.values(manifest.by_course || {}).flat();

  for (const lesson of lessons) {
    const course = courses.bySlug.get(lesson.course_slug) || courses.byName.get(lesson.course);
    if (!course) {
      issues.push(issue('warn', 'course_not_found', lesson, 'Manifest lesson course is not present in course JSON.'));
      continue;
    }

    const module = course.modules.get(Number(lesson.module_number));
    if (!module) {
      issues.push(issue('warn', 'module_not_found', lesson, 'Manifest lesson module number is not present in course JSON.', {
        course_file: course.file,
      }));
      continue;
    }

    const overlap = titleOverlap(module.title, lesson.module_title);
    if (overlap < MIN_TITLE_OVERLAP) {
      issues.push(issue('warn', 'module_title_mismatch', lesson, 'Manifest lesson title does not match the published course module title.', {
        course_file: course.file,
        expected_title: module.title,
        overlap: Number(overlap.toFixed(2)),
      }));
    }
  }

  const summary = {
    total_lessons: lessons.length,
    warnings: issues.length,
    threshold: MIN_TITLE_OVERLAP,
  };

  return {
    generated_at: new Date().toISOString(),
    source: path.relative(ROOT, MANIFEST_PATH),
    summary,
    issues,
  };
}

function main() {
  const report = audit();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const { total_lessons: total, warnings, threshold } = report.summary;
    console.log(`Lesson manifest alignment audit: ${warnings} warning(s) across ${total} lesson(s); title threshold=${threshold}`);
    for (const item of report.issues) {
      const expected = item.expected_title ? ` expected="${item.expected_title}"` : '';
      const overlap = typeof item.overlap === 'number' ? ` overlap=${item.overlap}` : '';
      console.log(`- ${item.code}: ${item.course} M${item.module_number} "${item.module_title}"${expected}${overlap}`);
      console.log(`  ${item.message}`);
    }
  }

  if (process.argv.includes('--strict') && report.issues.length) process.exit(1);
}

main();
