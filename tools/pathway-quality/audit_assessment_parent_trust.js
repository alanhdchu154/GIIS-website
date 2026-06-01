#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

const OLD_GENERATED_PATTERNS = [
  /True or False: The answer to/i,
  /Fill in the blank: Complete/i,
  /Evaluate this answer claim/i,
  /correct response is "[A-D]"/i,
];
const RESPONSE_CHECK_RE = /^Review this response for accuracy\./i;
const GENERIC_SHORT_KEY_RE = /^A complete response should answer this prompt directly:/i;
const ASSIGNMENT_EVIDENCE_RE = /\b(submit|include|provide|create|write|draw|design|record|calculate|compare|analyze|research|source|evidence|data|reflection|report|chart|table|outline|plan|link|document|presentation|explain|justify|solve|show|build|label|identify|annotate|summarize|draft|revise|map|diagram|model|graph|list|cite|evaluate|interpret|demonstrate)\b/i;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function issue(severity, code, message, sample) {
  return { severity, code, message, ...(sample ? { sample } : {}) };
}

function questionKind(q) {
  if (Array.isArray(q.options) && q.options.length > 0) {
    const opts = q.options.map((option) => normalize(option));
    if (opts.length === 2 && opts.includes('true') && opts.includes('false')) return 'true_false';
    return 'multiple_choice';
  }
  return 'short_response';
}

function auditCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const questions = [...(course.quizQuestions || []), ...(course.questions || [])];
  const issues = [];
  const metrics = {
    modules: (course.modules || []).length,
    assignments: (course.modules || []).filter((m) => String(m.assignment || '').trim()).length,
    questions: questions.length,
    trueFalse: 0,
    responseCheck: 0,
    genericShortAnswerKeys: 0,
    oldGeneratedPatterns: 0,
    duplicateOptions: 0,
    duplicateQuestionTexts: 0,
    weakAssignmentEvidence: 0,
    missingExamType: 0,
  };

  const seenQuestions = new Set();
  for (const q of questions) {
    const qText = String(q.question || '').trim();
    const key = normalize(qText);
    if (key) {
      if (seenQuestions.has(key)) metrics.duplicateQuestionTexts += 1;
      seenQuestions.add(key);
    }

    if (questionKind(q) === 'true_false') metrics.trueFalse += 1;
    if (RESPONSE_CHECK_RE.test(qText)) metrics.responseCheck += 1;
    if (!q.options && GENERIC_SHORT_KEY_RE.test(String(q.answer || ''))) metrics.genericShortAnswerKeys += 1;
    if (OLD_GENERATED_PATTERNS.some((pattern) => pattern.test(qText) || pattern.test(String(q.explanation || '')))) {
      metrics.oldGeneratedPatterns += 1;
    }

    if (Array.isArray(q.options)) {
      const seenOptions = new Set();
      for (const option of q.options.map(normalize)) {
        if (seenOptions.has(option)) metrics.duplicateOptions += 1;
        seenOptions.add(option);
      }
    }

    if (q.examType && !q.type) metrics.missingExamType += 1;
  }

  for (const mod of course.modules || []) {
    const assignment = String(mod.assignment || '').trim();
    if (assignment && !ASSIGNMENT_EVIDENCE_RE.test(assignment)) metrics.weakAssignmentEvidence += 1;
  }

  if (metrics.oldGeneratedPatterns) {
    issues.push(issue('fail', 'old_generated_assessment_wording', `${metrics.oldGeneratedPatterns} questions still expose old generated wording patterns.`));
  }
  if (metrics.duplicateOptions) {
    issues.push(issue('fail', 'duplicate_options', `${metrics.duplicateOptions} duplicate answer options found in multiple-choice questions.`));
  }
  if (metrics.genericShortAnswerKeys) {
    issues.push(issue('warn', 'generic_short_answer_keys', `${metrics.genericShortAnswerKeys} short-response items use generic rubric answer keys. The backend accepts substantive responses for now, but subject-matter answer keys would be stronger.`));
  }
  const tfRatio = metrics.questions ? metrics.trueFalse / metrics.questions : 0;
  if (tfRatio > 0.25) {
    issues.push(issue('warn', 'high_true_false_ratio', `${Math.round(tfRatio * 100)}% of assessment questions are true/false-style response checks.`));
  }
  if (metrics.responseCheck) {
    issues.push(issue('warn', 'response_check_items', `${metrics.responseCheck} questions use response-accuracy check wording; acceptable as a temporary bridge, but direct MC/short-answer rewrites would feel more teacher-authored.`));
  }
  if (metrics.duplicateQuestionTexts) {
    issues.push(issue('warn', 'duplicate_question_text', `${metrics.duplicateQuestionTexts} duplicate question texts found within the course.`));
  }
  if (metrics.weakAssignmentEvidence) {
    issues.push(issue('warn', 'weak_assignment_evidence_language', `${metrics.weakAssignmentEvidence} assignments may not clearly state the deliverable/evidence students should submit.`));
  }
  if (metrics.missingExamType) {
    issues.push(issue('warn', 'missing_exam_question_type', `${metrics.missingExamType} exam questions rely on implicit type defaults.`));
  }

  const failCount = issues.filter((item) => item.severity === 'fail').length;
  const warnCount = issues.filter((item) => item.severity === 'warn').length;
  const status = failCount ? 'fail' : warnCount ? 'warn' : 'pass';

  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    name: course.name,
    status,
    metrics,
    issues,
  };
}

function main() {
  const courses = walk(COURSE_DIR).map(auditCourse).sort((a, b) => {
    const rank = { fail: 0, warn: 1, pass: 2 };
    return rank[a.status] - rank[b.status] || a.slug.localeCompare(b.slug);
  });
  const summary = courses.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status] += 1;
    for (const [key, value] of Object.entries(row.metrics)) acc.metrics[key] = (acc.metrics[key] || 0) + value;
    return acc;
  }, { total: 0, pass: 0, warn: 0, fail: 0, metrics: {} });

  const report = { generatedAt: new Date().toISOString(), summary, courses };
  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Parent-trust assessment audit: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} courses)`);
    console.log(`Questions=${summary.metrics.questions} assignments=${summary.metrics.assignments} oldGenerated=${summary.metrics.oldGeneratedPatterns || 0} genericShortKeys=${summary.metrics.genericShortAnswerKeys || 0} duplicateOptions=${summary.metrics.duplicateOptions || 0}`);
    for (const row of courses.filter((course) => course.status !== 'pass')) {
      console.log(`\n[${row.status.toUpperCase()}] ${row.slug} — ${row.name}`);
      for (const item of row.issues) console.log(`  - ${item.severity}: ${item.code} — ${item.message}`);
    }
  }

  if (STRICT && summary.fail > 0) process.exitCode = 1;
}

main();
