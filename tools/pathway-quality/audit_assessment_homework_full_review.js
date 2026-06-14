#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DEFAULT_MD = path.join(ROOT, '_audit', 'assessment-homework-full-review.md');
const DEFAULT_JSON = path.join(ROOT, '_audit', 'assessment-homework-full-review.json');
const STRICT = process.argv.includes('--strict');

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
  return out.sort();
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasMcOptions(question) {
  return Array.isArray(question.options) && question.options.length > 0;
}

function isShort(question) {
  return !hasMcOptions(question) && String(question.type || '').toLowerCase() === 'short';
}

function isExactFill(question) {
  return !hasMcOptions(question) && String(question.type || '').toLowerCase() === 'fill';
}

function isNumericOrFormula(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  return /^[0-9\s.,=%$()+\-*/^:√πxyabcdnmt<>≤≥]+$/i.test(value) || /^(x|y|n|t|r|p)\s*=/.test(value);
}

function issue(severity, code, message, sample) {
  return { severity, code, message, ...(sample ? { sample } : {}) };
}

const ASSIGNMENT_ACTION_RE = /\b(submit|include|provide|create|write|draw|design|record|calculate|compare|analyze|research|source|evidence|data|reflection|report|chart|table|outline|plan|link|document|presentation|explain|justify|solve|show|build|label|identify|annotate|summarize|draft|revise|map|diagram|model|graph|list|cite|evaluate|interpret|demonstrate|construct|argue|classify|complete|find|determine|trace|review|predict)\b/i;
const DELIVERABLE_RE = /\b(paragraph|essay|response|reflection|report|chart|table|diagram|model|graph|timeline|outline|draft|portfolio|presentation|memo|worksheet|problem|steps|calculation|analysis|claim|evidence|citation|source|examples?|sentences?|project|plan|summary|comparison|data|notes|document|map|rubric|revision|justification|explanation|piece|post|thread|bibliography|log|annotation|experiment|hypothesis|profile|case study|fact-check)\b/i;
const EVIDENCE_RE = /\b(evidence|justify|support|show your work|cite|source|data|example|reasoning|because|explain why|reflection|compare|analyze|interpret|evaluate|revise|feedback|criteria|rubric)\b/i;
const OLD_GENERATED_RE = /(True or False: The answer to|Fill in the blank: The answer to|Review this response for accuracy|Student response:|Evaluate this answer claim|correct response is "[A-D]")/i;
const BLOCKED_RE = /(commonlit\.org|noredink\.com|hbr\.org|may require login|paid\/institutional|Removed after)/i;
const FORMULAIC_EXPLANATION_RE = /(choose the concept that directly fits the prompt and rule out nearby distractors|This checks the course concept directly)/i;

function assignmentQuality(course, mod) {
  const text = String(mod.assignment || '').trim();
  const checks = {
    hasAssignment: Boolean(text),
    length: text.length,
    actions: ASSIGNMENT_ACTION_RE.test(text),
    deliverable: DELIVERABLE_RE.test(text),
    evidence: EVIDENCE_RE.test(text),
    structure: /\b\(1\)|\b1\.|;|:|,\s*\(\d\)/.test(text),
    blocked: BLOCKED_RE.test(text),
    oldGenerated: OLD_GENERATED_RE.test(text),
  };
  const issues = [];
  const label = `${course.slug} module ${mod.order} "${mod.title || 'Untitled'}" assignment`;
  if (!checks.hasAssignment) issues.push(issue('fail', 'missing_assignment', `${label} is missing.`));
  if (checks.hasAssignment && checks.length < 120) issues.push(issue('fail', 'thin_assignment', `${label} is too short to be reviewable evidence.`, text));
  if (checks.hasAssignment && !checks.actions) issues.push(issue('warn', 'unclear_assignment_action', `${label} does not clearly tell students what to do.`, text));
  if (checks.hasAssignment && !checks.deliverable) issues.push(issue('warn', 'unclear_assignment_deliverable', `${label} could name the submitted product more explicitly.`, text));
  if (checks.hasAssignment && !checks.evidence) issues.push(issue('warn', 'weak_assignment_evidence_language', `${label} could state reasoning/evidence expectations more clearly.`, text));
  if (checks.hasAssignment && !checks.structure) issues.push(issue('warn', 'unstructured_assignment', `${label} would be easier for students/parents if broken into clearer steps.`, text));
  if (checks.blocked) issues.push(issue('fail', 'blocked_assignment_resource', `${label} references a removed, login-gated, or institutional resource.`, text));
  if (checks.oldGenerated) issues.push(issue('fail', 'old_generated_assignment_wording', `${label} contains generated bridge wording.`, text));
  return { checks, issues };
}

function questionArea(question) {
  if (!question.examType) return 'quiz';
  return question.examType === 'midterm' ? 'midterm' : 'final';
}

function questionLabel(course, question) {
  const area = questionArea(question);
  const modulePart = question.moduleOrder ? ` module ${question.moduleOrder}` : '';
  const orderPart = question.order ? ` #${question.order}` : '';
  return `${course.slug} ${area}${modulePart}${orderPart}`;
}

function questionQuality(course, question, moduleOrders, seenByArea) {
  const prompt = String(question.question || '').trim();
  const answer = String(question.answer || '').trim();
  const explanation = String(question.explanation || '').trim();
  const options = Array.isArray(question.options) ? question.options.map((item) => String(item || '').trim()) : [];
  const area = questionArea(question);
  const label = questionLabel(course, question);
  const issues = [];

  if (!prompt) issues.push(issue('fail', 'missing_question', `${label} is missing question text.`));
  if (!answer) issues.push(issue('fail', 'missing_answer', `${label} is missing an answer key.`));
  if (!Number.isFinite(Number(question.points)) || Number(question.points) <= 0) {
    issues.push(issue('fail', 'invalid_points', `${label} has missing or non-positive points.`));
  }
  if (question.moduleOrder && !moduleOrders.has(Number(question.moduleOrder))) {
    issues.push(issue('fail', 'invalid_module_order', `${label} points to a module that does not exist.`));
  }

  if (prompt && prompt.length < 28 && !isNumericOrFormula(prompt)) {
    issues.push(issue('warn', 'terse_prompt', `${label} prompt may be too terse for parent-facing review.`, prompt));
  }
  if (OLD_GENERATED_RE.test(`${prompt} ${explanation}`)) {
    issues.push(issue('fail', 'old_generated_question_wording', `${label} still contains generated bridge wording.`, prompt));
  }

  if (hasMcOptions(question)) {
    if (options.length < 2) issues.push(issue('fail', 'too_few_options', `${label} has fewer than two answer options.`));
    if (options.length === 2) issues.push(issue('warn', 'two_option_item', `${label} is a two-option item; acceptable, but four-option items usually give a better diagnostic signal.`));
    const normalizedOptions = options.map(normalize);
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      issues.push(issue('fail', 'duplicate_options', `${label} has duplicate answer options.`));
    }
    const answerLetterIndex = /^[A-D]$/i.test(answer) ? answer.toUpperCase().charCodeAt(0) - 65 : -1;
    const answerMatches = normalizedOptions.includes(normalize(answer)) || (answerLetterIndex >= 0 && answerLetterIndex < options.length);
    if (answer && !answerMatches) issues.push(issue('fail', 'answer_not_in_options', `${label} answer does not match any option.`));
    if (explanation.length < 75 || words(explanation).length < 10) {
      issues.push(issue('fail', 'thin_explanation', `${label} MC explanation is too thin.`, explanation || prompt));
    }
    if (FORMULAIC_EXPLANATION_RE.test(explanation)) {
      issues.push(issue('fail', 'formulaic_explanation', `${label} explanation still reads like a generic repair sentence.`, explanation));
    }
  } else if (isShort(question)) {
    if (!isNumericOrFormula(answer) && (answer.length < 80 || words(answer).length < 10)) {
      issues.push(issue('fail', 'thin_short_answer_key', `${label} short-answer key lacks scoring guidance.`, answer));
    }
    if (/^(yes|no|true|false)$/i.test(answer)) {
      issues.push(issue('fail', 'binary_short_answer_key', `${label} short-answer key is binary without reasoning guidance.`, answer));
    }
  } else if (isExactFill(question)) {
    if (/\.$/.test(answer)) issues.push(issue('fail', 'fill_answer_terminal_period', `${label} exact fill answer should not require a trailing period.`, answer));
    if (answer.length > 80 && !String(question.answerVariants || '').trim()) {
      issues.push(issue('warn', 'long_exact_fill_answer', `${label} has a long exact-match answer; answer variants may be needed.`, answer));
    }
  } else {
    issues.push(issue('warn', 'implicit_question_type', `${label} relies on implicit question type behavior.`));
  }

  if (/[.!?]['"]\./.test(`${prompt} ${answer} ${explanation}`)) {
    issues.push(issue('fail', 'awkward_terminal_punctuation', `${label} has duplicate punctuation after a quote.`));
  }

  const key = normalize(prompt);
  if (key) {
    const seenKey = `${area}:${key}`;
    if (seenByArea.has(seenKey)) issues.push(issue('fail', 'duplicate_question_text', `${label} duplicates another ${area} prompt in this course.`, prompt));
    seenByArea.add(seenKey);
  }

  return issues;
}

function auditCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const modules = course.modules || [];
  const quizQuestions = course.quizQuestions || [];
  const examQuestions = course.questions || [];
  const moduleOrders = new Set(modules.map((mod) => Number(mod.order)));
  const issues = [];
  const seenByArea = new Set();
  const metrics = {
    modules: modules.length,
    assignments: 0,
    quizQuestions: quizQuestions.length,
    midtermQuestions: examQuestions.filter((q) => q.examType === 'midterm').length,
    finalQuestions: examQuestions.filter((q) => q.examType === 'final' || !q.examType).length,
    mcQuestions: 0,
    shortQuestions: 0,
    fillQuestions: 0,
  };

  if (modules.length < 8) issues.push(issue('fail', 'thin_module_count', `${course.slug} has only ${modules.length} modules.`));
  if (quizQuestions.length < modules.length * 3) issues.push(issue('fail', 'thin_quiz_count', `${course.slug} has ${quizQuestions.length} quiz questions for ${modules.length} modules.`));
  if (metrics.midtermQuestions < 15) issues.push(issue('fail', 'thin_midterm', `${course.slug} has ${metrics.midtermQuestions} midterm questions.`));
  if (metrics.finalQuestions < 20) issues.push(issue('fail', 'thin_final', `${course.slug} has ${metrics.finalQuestions} final questions.`));

  const quizByModule = new Map();
  for (const question of quizQuestions) {
    if (question.moduleOrder) quizByModule.set(Number(question.moduleOrder), (quizByModule.get(Number(question.moduleOrder)) || 0) + 1);
  }
  for (const mod of modules) {
    const assignment = assignmentQuality(course, mod);
    metrics.assignments += assignment.checks.hasAssignment ? 1 : 0;
    issues.push(...assignment.issues);
    const quizCount = quizByModule.get(Number(mod.order)) || 0;
    if (quizCount < 3) issues.push(issue('fail', 'thin_module_quiz_coverage', `${course.slug} module ${mod.order} has only ${quizCount} quiz questions.`));
  }

  for (const question of [...quizQuestions, ...examQuestions]) {
    if (hasMcOptions(question)) metrics.mcQuestions += 1;
    else if (isShort(question)) metrics.shortQuestions += 1;
    else if (isExactFill(question)) metrics.fillQuestions += 1;
    issues.push(...questionQuality(course, question, moduleOrders, seenByArea));
  }

  const failCount = issues.filter((item) => item.severity === 'fail').length;
  const warnCount = issues.filter((item) => item.severity === 'warn').length;
  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    name: course.name,
    department: course.department,
    status: failCount ? 'fail' : warnCount ? 'warn' : 'pass',
    metrics,
    issueCounts: { fail: failCount, warn: warnCount },
    issues,
  };
}

function markdown(report) {
  const lines = [];
  lines.push('# Assessment And Homework Full Review');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.warn} warn / ${report.summary.fail} fail (${report.summary.total} courses)`);
  lines.push(`Coverage: ${report.summary.metrics.modules} modules, ${report.summary.metrics.assignments} assignments, ${report.summary.metrics.quizQuestions} quiz questions, ${report.summary.metrics.midtermQuestions} midterm questions, ${report.summary.metrics.finalQuestions} final questions.`);
  lines.push(`Question types: ${report.summary.metrics.mcQuestions} MC, ${report.summary.metrics.shortQuestions} short, ${report.summary.metrics.fillQuestions} fill/exact.`);
  lines.push('');
  lines.push('| Course | Assignments | Quiz | Midterm | Final | Fail | Warn | Status |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const row of report.courses) {
    lines.push(`| ${row.name} | ${row.metrics.assignments}/${row.metrics.modules} | ${row.metrics.quizQuestions} | ${row.metrics.midtermQuestions} | ${row.metrics.finalQuestions} | ${row.issueCounts.fail} | ${row.issueCounts.warn} | ${row.status} |`);
  }
  const issueRows = report.courses.flatMap((course) => course.issues.map((item) => ({ course: course.slug, ...item })));
  if (issueRows.length) {
    lines.push('');
    lines.push('## Issues');
    for (const item of issueRows.slice(0, 300)) {
      lines.push(`- ${item.severity.toUpperCase()} ${item.course}: ${item.code} - ${item.message}`);
    }
    if (issueRows.length > 300) lines.push(`- ... ${issueRows.length - 300} more issues omitted; see JSON for full detail.`);
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function main() {
  const mdPath = path.resolve(ROOT, argValue('--report', DEFAULT_MD));
  const jsonPath = path.resolve(ROOT, argValue('--json-report', DEFAULT_JSON));
  const courses = walk(COURSE_DIR).map(auditCourse).sort((a, b) => {
    const rank = { fail: 0, warn: 1, pass: 2 };
    return rank[a.status] - rank[b.status] || b.issueCounts.fail - a.issueCounts.fail || b.issueCounts.warn - a.issueCounts.warn || a.slug.localeCompare(b.slug);
  });
  const summary = courses.reduce((acc, course) => {
    acc.total += 1;
    acc[course.status] += 1;
    for (const [key, value] of Object.entries(course.metrics)) acc.metrics[key] = (acc.metrics[key] || 0) + value;
    acc.metrics.failIssues += course.issueCounts.fail;
    acc.metrics.warnIssues += course.issueCounts.warn;
    return acc;
  }, { total: 0, pass: 0, warn: 0, fail: 0, metrics: { failIssues: 0, warnIssues: 0 } });
  const report = { generatedAt: new Date().toISOString(), summary, courses };

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, markdown(report));
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Assessment/homework full review: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} courses)`);
  console.log(`Coverage=${summary.metrics.modules} modules, ${summary.metrics.assignments} assignments, ${summary.metrics.quizQuestions} quiz, ${summary.metrics.midtermQuestions} midterm, ${summary.metrics.finalQuestions} final`);
  console.log(`Issues=${summary.metrics.failIssues} fail / ${summary.metrics.warnIssues} warn`);
  console.log(`Report: ${path.relative(ROOT, mdPath)}`);
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`);
  for (const row of courses.filter((course) => course.status !== 'pass').slice(0, 12)) {
    console.log(`\n[${row.status.toUpperCase()}] ${row.slug}: ${row.issueCounts.fail} fail / ${row.issueCounts.warn} warn`);
    for (const item of row.issues.slice(0, 5)) console.log(`  - ${item.severity}: ${item.code}`);
    if (row.issues.length > 5) console.log(`  ... ${row.issues.length - 5} more`);
  }

  if (STRICT && summary.fail) process.exitCode = 1;
}

main();
