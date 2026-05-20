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

function splitQuestions(questions = []) {
  const midterm = questions.filter((q) => q.examType === 'midterm');
  const final = questions.filter((q) => q.examType === 'final' || !q.examType);
  return { midterm, final };
}

function issue(severity, code, message) {
  return { severity, code, message };
}

function hasMeasurableVerb(text) {
  return /\b(define|explain|compare|contrast|analyze|evaluate|apply|calculate|construct|design|write|solve|identify|describe|interpret|model|prove|trace|differentiate|integrate|implement|classify|summarize|argue|research|present|create|demonstrate)\b/i.test(text);
}

function validateQuestionSet(kind, questions, issues) {
  const seen = new Set();
  for (const q of questions) {
    const parts = [kind];
    if (q.examType) parts.push(q.examType);
    if (q.moduleOrder) parts.push(`module ${q.moduleOrder}`);
    if (q.order) parts.push(`#${q.order}`);
    const label = parts.join(' ');

    const options = Array.isArray(q.options) ? q.options.map((option) => String(option)) : [];
    if (!String(q.question || '').trim()) issues.push(issue('fail', 'missing_question_text', `${label} is missing question text.`));
    if (!String(q.answer || '').trim()) issues.push(issue('fail', 'missing_question_answer', `${label} is missing answer.`));

    const answer = String(q.answer || '').trim();
    const answerLetterIndex = /^[A-D]$/i.test(answer) ? answer.toUpperCase().charCodeAt(0) - 65 : -1;
    const answerMatchesOption = options.includes(answer) || (answerLetterIndex >= 0 && answerLetterIndex < options.length);
    if (q.type === 'mc' && options.length < 2) issues.push(issue('fail', 'invalid_mc_options', `${label} is multiple choice but has fewer than 2 options.`));
    if (options.length && answer && !answerMatchesOption) {
      issues.push(issue('fail', 'answer_not_in_options', `${label} answer is not one of its options.`));
    }
    if (!options.length && /^[A-D]$/i.test(answer)) {
      issues.push(issue('warn', 'open_response_answer_looks_like_option_key', `${label} has no options, but answer is "${answer}".`));
    }
    if (!String(q.explanation || '').trim()) issues.push(issue('warn', 'missing_question_explanation', `${label} is missing explanation.`));

    const key = String(q.question || '').trim().toLowerCase();
    if (key) {
      if (seen.has(key)) issues.push(issue('warn', 'duplicate_question_text', `${label} duplicates question text.`));
      seen.add(key);
    }
  }
}

function auditCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const modules = course.modules || [];
  const quizQuestions = course.quizQuestions || [];
  const questions = course.questions || [];
  const { midterm, final } = splitQuestions(questions);
  const issues = [];

  if (!course.slug || !course.name) issues.push(issue('fail', 'missing_identity', 'Course must have slug and name.'));
  if (!course.isPublished) issues.push(issue('warn', 'not_published', 'Course is not published.'));
  if (modules.length < 8) issues.push(issue('fail', 'thin_module_count', `Only ${modules.length} modules; expected at least 8.`));
  if (modules.length > 0 && quizQuestions.length < modules.length * 3) {
    issues.push(issue('fail', 'thin_module_quizzes', `${quizQuestions.length} module quiz questions for ${modules.length} modules; expected at least 3 per module.`));
  }

  const quizCountsByModule = new Map();
  for (const q of quizQuestions) {
    if (q.moduleOrder) quizCountsByModule.set(q.moduleOrder, (quizCountsByModule.get(q.moduleOrder) || 0) + 1);
  }
  const underQuizzedModules = modules
    .map((m) => m.order)
    .filter((order) => (quizCountsByModule.get(order) || 0) < 3);
  if (underQuizzedModules.length) {
    issues.push(issue('fail', 'thin_module_quiz_distribution', `${underQuizzedModules.length}/${modules.length} modules have fewer than 3 quiz questions: ${underQuizzedModules.join(', ')}.`));
  }

  if (midterm.length < 10) issues.push(issue('fail', 'thin_midterm', `${midterm.length} midterm questions; expected at least 10.`));
  if (final.length < 15) issues.push(issue('fail', 'thin_final', `${final.length} final questions; expected at least 15.`));
  validateQuestionSet('module quiz', quizQuestions, issues);
  validateQuestionSet('exam', questions, issues);

  const requiredModuleFields = ['objectives', 'videoUrl', 'practiceUrl', 'assignment'];
  for (const field of requiredModuleFields) {
    const missing = modules.filter((m) => !String(m[field] || '').trim()).length;
    if (missing) issues.push(issue('warn', `missing_${field}`, `${missing}/${modules.length} modules missing ${field}.`));
  }

  const weakObjectives = modules.filter((m) => {
    const text = String(m.objectives || '').trim();
    return text.length < 90 || !hasMeasurableVerb(text);
  }).map((m) => m.order);
  if (weakObjectives.length) {
    issues.push(issue('warn', 'weak_module_objectives', `${weakObjectives.length}/${modules.length} modules have objectives that are too short or not clearly measurable: ${weakObjectives.join(', ')}.`));
  }

  const thinAssignments = modules.filter((m) => String(m.assignment || '').trim().length < 120).map((m) => m.order);
  if (thinAssignments.length) {
    issues.push(issue('warn', 'thin_module_assignments', `${thinAssignments.length}/${modules.length} module assignments are too thin to show real student work: ${thinAssignments.join(', ')}.`));
  }

  const apNamed = /\bAP\b/i.test(course.name || '') || course.type === 'AP';
  if (apNamed && !/College Board|AP exam|Course and Exam Description|AP Classroom/i.test(course.description || '')) {
    issues.push(issue('warn', 'ap_alignment_not_explicit', 'AP course description should explicitly state AP alignment source.'));
  }

  const totalEstimatedHours = modules.reduce((sum, m) => sum + Number(m.estimatedHrs || 0), 0);
  if (Number(course.credits || 0) >= 1 && totalEstimatedHours < 40) {
    issues.push(issue('warn', 'low_estimated_hours', `${totalEstimatedHours.toFixed(1)} estimated module hours for ${course.credits} credit(s).`));
  }

  const failCount = issues.filter((i) => i.severity === 'fail').length;
  const warnCount = issues.filter((i) => i.severity === 'warn').length;
  const status = failCount ? 'fail' : warnCount ? 'warn' : 'pass';

  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    name: course.name,
    department: course.department,
    type: course.type,
    credits: Number(course.credits || 0),
    modules: modules.length,
    moduleQuizQuestions: quizQuestions.length,
    midtermQuestions: midterm.length,
    finalQuestions: final.length,
    totalEstimatedHours: Number(totalEstimatedHours.toFixed(1)),
    weakObjectiveModules: weakObjectives,
    thinAssignmentModules: thinAssignments,
    status,
    issues,
  };
}

function main() {
  const rows = walk(COURSE_DIR).map(auditCourse).sort((a, b) => {
    const rank = { fail: 0, warn: 1, pass: 2 };
    return rank[a.status] - rank[b.status] || a.slug.localeCompare(b.slug);
  });
  const summary = rows.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status] += 1;
    acc.modules += row.modules;
    acc.credits += row.credits;
    return acc;
  }, { total: 0, pass: 0, warn: 0, fail: 0, modules: 0, credits: 0 });
  summary.averageModules = Number((summary.modules / Math.max(summary.total, 1)).toFixed(1));
  summary.credits = Number(summary.credits.toFixed(1));

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    courses: rows,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Course quality audit: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} courses)`);
  for (const row of rows.filter((r) => r.status !== 'pass')) {
    console.log(`\n[${row.status.toUpperCase()}] ${row.slug} — ${row.name}`);
    console.log(`  modules=${row.modules} quiz=${row.moduleQuizQuestions} midterm=${row.midtermQuestions} final=${row.finalQuestions} hours=${row.totalEstimatedHours}`);
    for (const item of row.issues) console.log(`  - ${item.severity}: ${item.code} — ${item.message}`);
  }
}

main();
