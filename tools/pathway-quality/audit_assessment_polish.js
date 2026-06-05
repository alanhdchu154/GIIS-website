#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'assessment-polish.md');

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  return process.argv[index + 1] || fallback;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function isMultipleChoice(question) {
  return Array.isArray(question.options) && question.options.length > 0;
}

function isShortResponse(question) {
  return !isMultipleChoice(question) && String(question.type || '').toLowerCase() === 'short';
}

function isNumericOrFormula(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  return /^[0-9\s.,=%$()+\-*/^:√πxyabcdnmt]+$/i.test(value) || /^(x|y|n|t|r|p)\s*=/.test(value);
}

function contextFor(course, question) {
  if (question.moduleOrder) {
    const module = (course.modules || []).find((item) => Number(item.order) === Number(question.moduleOrder));
    if (module?.title) return `${course.name} module ${question.moduleOrder}: ${module.title}`;
  }
  if (question.examType) return `${course.name} ${question.examType}`;
  return course.name;
}

function issue(code, message, sample) {
  return { code, message, ...(sample ? { sample } : {}) };
}

function auditQuestion(course, question, area) {
  const issues = [];
  const prompt = String(question.question || '').trim();
  const answer = String(question.answer || '').trim();
  const explanation = String(question.explanation || '').trim();
  const label = `${area}${question.moduleOrder ? ` module ${question.moduleOrder}` : ''}${question.order ? ` #${question.order}` : ''}`;

  if (!prompt) issues.push(issue('missing_question', `${label} is missing question text.`));
  if (!answer) issues.push(issue('missing_answer', `${label} is missing an answer key.`));

  if (prompt && prompt.length < 28 && !isNumericOrFormula(prompt)) {
    issues.push(issue('under_contextualized_question', `${label} question is too terse for parent-facing review.`, prompt));
  }

  if (isMultipleChoice(question)) {
    if (explanation.length < 75 || words(explanation).length < 10) {
      issues.push(issue('thin_mc_explanation', `${label} multiple-choice explanation is too thin.`, explanation || prompt));
    }
    if (/This checks .* by asking the student to choose the concept that directly fits the prompt and rule out nearby distractors\./.test(explanation)) {
      issues.push(issue('formulaic_mc_explanation', `${label} explanation still uses the generic repair sentence.`, explanation));
    }
    if (/This checks the course concept directly\./.test(explanation)) {
      issues.push(issue('formulaic_mc_explanation', `${label} explanation still uses a generic course-concept sentence.`, explanation));
    }
  } else if (isShortResponse(question) && !isNumericOrFormula(answer) && (answer.length < 80 || words(answer).length < 10)) {
    issues.push(issue('thin_short_answer_key', `${label} short-answer key needs more scoring guidance.`, answer));
  } else if (!isShortResponse(question) && !isMultipleChoice(question) && /\.$/.test(answer)) {
    issues.push(issue('exact_answer_terminal_period', `${label} exact-match answer should not require a trailing period.`, answer));
  }

  if (/^(because|it is|this is correct)\.?$/i.test(explanation)) {
    issues.push(issue('placeholder_explanation', `${label} explanation is placeholder-like.`, explanation));
  }
  if (/[.!?]['"]\./.test(`${prompt} ${answer} ${explanation}`)) {
    issues.push(issue('awkward_terminal_punctuation', `${label} has duplicate terminal punctuation after a quote.`, prompt));
  }
  if (/^(yes|no|true|false)$/i.test(answer) && isShortResponse(question)) {
    issues.push(issue('thin_binary_short_answer', `${label} short-answer key is binary without reasoning guidance.`, answer));
  }

  return issues.map((item) => ({
    ...item,
    area,
    label,
    context: contextFor(course, question),
  }));
}

function auditCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const issues = [];
  const metrics = {
    quizQuestions: (course.quizQuestions || []).length,
    examQuestions: (course.questions || []).length,
    mcQuestions: 0,
    shortQuestions: 0,
  };

  for (const question of course.quizQuestions || []) {
    if (isMultipleChoice(question)) metrics.mcQuestions += 1;
    else metrics.shortQuestions += 1;
    issues.push(...auditQuestion(course, question, 'quiz'));
  }
  for (const question of course.questions || []) {
    if (isMultipleChoice(question)) metrics.mcQuestions += 1;
    else metrics.shortQuestions += 1;
    issues.push(...auditQuestion(course, question, question.examType || 'exam'));
  }

  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    name: course.name,
    status: issues.length ? 'fail' : 'pass',
    metrics,
    issues,
  };
}

function markdown(report) {
  const lines = [];
  lines.push('# Assessment Polish QA');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.fail} fail (${report.summary.total} courses)`);
  lines.push(`Questions: ${report.summary.metrics.questions}; issues: ${report.summary.metrics.issues}`);
  lines.push('');
  lines.push('| Course | Quiz | Exam | MC | Short | Issues | Status |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const row of report.courses) {
    lines.push(`| ${row.name} | ${row.metrics.quizQuestions} | ${row.metrics.examQuestions} | ${row.metrics.mcQuestions} | ${row.metrics.shortQuestions} | ${row.issues.length} | ${row.status} |`);
  }
  const issues = report.courses.flatMap((course) => course.issues.map((item) => ({ course: course.slug, ...item })));
  if (issues.length) {
    lines.push('');
    lines.push('## Issues');
    for (const item of issues.slice(0, 200)) {
      lines.push(`- ${item.course} ${item.label}: ${item.code} - ${item.message}`);
    }
    if (issues.length > 200) lines.push(`- ... ${issues.length - 200} more issues omitted from markdown report; use --json for full detail.`);
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function main() {
  const reportPath = path.resolve(ROOT, argValue('--report', DEFAULT_REPORT));
  const courses = walk(COURSE_DIR).map(auditCourse).sort((a, b) => b.issues.length - a.issues.length || a.slug.localeCompare(b.slug));
  const summary = courses.reduce((acc, course) => {
    acc.total += 1;
    acc[course.status] += 1;
    acc.metrics.questions += course.metrics.quizQuestions + course.metrics.examQuestions;
    acc.metrics.issues += course.issues.length;
    return acc;
  }, { total: 0, pass: 0, fail: 0, metrics: { questions: 0, issues: 0 } });
  const report = { generatedAt: new Date().toISOString(), summary, courses };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdown(report));

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Assessment polish QA: ${summary.pass} pass / ${summary.fail} fail (${summary.total} courses)`);
    console.log(`Questions=${summary.metrics.questions} issues=${summary.metrics.issues}`);
    console.log(`Report: ${path.relative(ROOT, reportPath)}`);
    for (const row of courses.filter((course) => course.issues.length).slice(0, 12)) {
      console.log(`\n[FAIL] ${row.slug} - ${row.issues.length} issues`);
      for (const item of row.issues.slice(0, 5)) console.log(`  - ${item.label}: ${item.code}`);
      if (row.issues.length > 5) console.log(`  ... ${row.issues.length - 5} more`);
    }
  }

  if (STRICT && summary.fail) process.exitCode = 1;
}

main();
