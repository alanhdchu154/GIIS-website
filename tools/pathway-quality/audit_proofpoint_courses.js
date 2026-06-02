#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const TARGETS = [
  { slug: 'algebra-i', file: 'server/prisma/courses/math/algebra-i.json', label: 'Algebra I' },
  { slug: 'geometry', file: 'server/prisma/courses/math/geometry.json', label: 'Geometry' },
  { slug: 'english-i', file: 'server/prisma/courses/english/english-i.json', label: 'English I' },
  { slug: 'english-ii', file: 'server/prisma/courses/english/english-ii.json', label: 'English II' },
  { slug: 'biology', file: 'server/prisma/courses/science/biology.json', label: 'Biology' },
  { slug: 'chemistry', file: 'server/prisma/courses/science/chemistry.json', label: 'Chemistry' },
  { slug: 'us-history', file: 'server/prisma/courses/social-studies/us-history.json', label: 'U.S. History' },
  { slug: 'government', file: 'server/prisma/courses/social-studies/government.json', label: 'Government' },
];

const BLOCKED_RESOURCE_PATTERNS = [
  { pattern: /aaFrAFZATKU/, reason: 'unrelated natural-number formula video previously appeared in Geometry Pythagorean module' },
  { pattern: /KdxEAt91D7k/, reason: 'non-instructional sketch video previously appeared in Geometry solids module' },
  { pattern: /SkMNREAMNvc/, reason: 'systems-of-equations video previously appeared in Algebra I one-step/two-step equations module' },
];

function issue(severity, code, message) {
  return { severity, code, message };
}

function splitQuestions(questions = []) {
  return {
    midterm: questions.filter((q) => q.examType === 'midterm'),
    final: questions.filter((q) => q.examType === 'final' || !q.examType),
  };
}

function hasSubstantiveAssignment(text) {
  const action = /\b(submit|write|create|draw|solve|analyze|compare|explain|design|research|calculate|classify|identify|annotate|reflect|predict|complete|find|determine|label|trace|review)\b/i;
  const deliverable = /\b(evidence|table|diagram|paragraph|essay|chart|reflection|explanation|work|analysis|citation|source|steps|justification|claim|timeline|profile|equation|graph|model|problem|examples?|sentences?|formula|draft|outline|response)\b/i;
  const quantityOrStructure = /\b\d+|:|\(|\)|;|,/;
  return text.length >= 170 && action.test(text) && (deliverable.test(text) || quantityOrStructure.test(text));
}

function validateQuestions(kind, questions, issues) {
  const seen = new Set();
  for (const q of questions || []) {
    const label = `${kind}${q.moduleOrder ? ` module ${q.moduleOrder}` : ''}${q.order ? ` #${q.order}` : ''}`;
    const question = String(q.question || '').trim();
    const answer = String(q.answer || '').trim();
    const options = Array.isArray(q.options) ? q.options.map((option) => String(option)) : [];

    if (!question) issues.push(issue('fail', 'missing_question_text', `${label} is missing question text.`));
    if (!answer) issues.push(issue('fail', 'missing_question_answer', `${label} is missing an answer.`));
    if (/Review this response for accuracy|Student response:|Evaluate this answer claim/i.test(question)) {
      issues.push(issue('fail', 'assessment_bridge_wording', `${label} still uses bridge wording instead of a direct assessment item.`));
    }
    if (/^(True or False|Fill in the blank): The answer to/i.test(question)) {
      issues.push(issue('fail', 'generated_assessment_wording', `${label} still has generated-looking assessment wording.`));
    }

    if (q.type === 'mc') {
      if (options.length < 2) issues.push(issue('fail', 'invalid_mc_options', `${label} is multiple choice but has fewer than 2 options.`));
      const answerLetterIndex = /^[A-D]$/i.test(answer) ? answer.toUpperCase().charCodeAt(0) - 65 : -1;
      const answerMatchesOption = options.includes(answer) || (answerLetterIndex >= 0 && answerLetterIndex < options.length);
      if (answer && !answerMatchesOption) issues.push(issue('fail', 'answer_not_in_options', `${label} answer is not one of its options.`));
      const normalized = options.map((option) => option.trim().toLowerCase());
      if (new Set(normalized).size !== normalized.length) issues.push(issue('fail', 'duplicate_options', `${label} has duplicate answer options.`));
    }

    const key = question.toLowerCase();
    if (key) {
      if (seen.has(key)) issues.push(issue('fail', 'duplicate_question_text', `${label} duplicates another question in this course.`));
      seen.add(key);
    }
  }
}

function validateUrl(value, label, issues) {
  const url = String(value || '').trim();
  if (!url) {
    issues.push(issue('fail', 'missing_resource_url', `${label} is missing a URL.`));
    return;
  }
  if (!/^https:\/\//.test(url)) issues.push(issue('fail', 'non_https_resource_url', `${label} must use https.`));
}

function auditCourse(target) {
  const full = path.join(ROOT, target.file);
  const course = JSON.parse(fs.readFileSync(full, 'utf8'));
  const modules = course.modules || [];
  const quizQuestions = course.quizQuestions || [];
  const { midterm, final } = splitQuestions(course.questions || []);
  const issues = [];
  const resourceUrls = [];

  if (course.slug !== target.slug) issues.push(issue('fail', 'slug_mismatch', `${target.file} has slug "${course.slug}", expected "${target.slug}".`));
  if (!course.isPublished) issues.push(issue('fail', 'not_published', `${course.slug} is not published.`));
  if (modules.length < 8) issues.push(issue('fail', 'thin_module_count', `${course.slug} has only ${modules.length} modules.`));
  if (quizQuestions.length < modules.length * 3) issues.push(issue('fail', 'thin_quiz_count', `${course.slug} has ${quizQuestions.length} quiz questions for ${modules.length} modules.`));
  if (midterm.length < 15) issues.push(issue('fail', 'thin_midterm', `${course.slug} has ${midterm.length} midterm questions; proof-point courses should have at least 15.`));
  if (final.length < 20) issues.push(issue('fail', 'thin_final', `${course.slug} has ${final.length} final questions; proof-point courses should have at least 20.`));

  for (const mod of modules) {
    const moduleLabel = `${course.slug} module ${mod.order} "${mod.title}"`;
    for (const [field, noteField] of [
      ['readingUrl', 'readingNote'],
      ['videoUrl', 'videoNote'],
      ['practiceUrl', 'practiceNote'],
    ]) {
      validateUrl(mod[field], `${moduleLabel} ${field}`, issues);
      if (!String(mod[noteField] || '').trim()) issues.push(issue('fail', 'missing_resource_note', `${moduleLabel} ${noteField} is missing.`));
      if (String(mod[field] || '').trim()) resourceUrls.push({ course: course.slug, module: mod.order, field, url: String(mod[field]).trim() });
    }
    if (String(mod.video2Url || '').trim()) {
      validateUrl(mod.video2Url, `${moduleLabel} video2Url`, issues);
      if (!String(mod.video2Note || '').trim()) issues.push(issue('fail', 'missing_resource_note', `${moduleLabel} video2Note is missing.`));
      resourceUrls.push({ course: course.slug, module: mod.order, field: 'video2Url', url: String(mod.video2Url).trim() });
    }

    const moduleText = JSON.stringify(mod);
    if (/Removed after|commonlit\.org|noredink\.com|paid\/institutional|may require login/i.test(moduleText)) {
      issues.push(issue('fail', 'blocked_resource_residue', `${moduleLabel} still references removed or login-gated resources.`));
    }
    for (const blocked of BLOCKED_RESOURCE_PATTERNS) {
      if (blocked.pattern.test(moduleText)) {
        issues.push(issue('fail', 'blocked_proofpoint_resource', `${moduleLabel} references a known bad proof-point resource: ${blocked.reason}.`));
      }
    }
    if (course.department === 'English' && /health-and-medicine|economics-finance-domain|Health and medicine|Economics and finance/i.test(moduleText)) {
      issues.push(issue('fail', 'english_resource_domain_mismatch', `${moduleLabel} uses a subject-domain resource that does not fit English/literature practice.`));
    }
    if (!String(mod.objectives || '').trim() || String(mod.objectives || '').trim().length < 90) {
      issues.push(issue('fail', 'weak_objectives', `${moduleLabel} objectives are too thin for a proof-point course.`));
    }
    if (!hasSubstantiveAssignment(String(mod.assignment || '').trim())) {
      issues.push(issue('fail', 'thin_assignment_evidence', `${moduleLabel} assignment does not yet read like reviewable student evidence.`));
    }
  }

  validateQuestions('quiz', quizQuestions, issues);
  validateQuestions('exam', course.questions || [], issues);

  const failCount = issues.filter((item) => item.severity === 'fail').length;
  const warnCount = issues.filter((item) => item.severity === 'warn').length;

  return {
    slug: course.slug,
    name: course.name,
    file: target.file,
    modules: modules.length,
    quizQuestions: quizQuestions.length,
    midtermQuestions: midterm.length,
    finalQuestions: final.length,
    resourceUrls,
    status: failCount ? 'fail' : warnCount ? 'warn' : 'pass',
    issues,
  };
}

async function smokeCheckUrls(rows) {
  const seen = new Map();
  for (const row of rows) {
    for (const resource of row.resourceUrls) {
      if (resource.url.includes('youtube.com') || resource.url.includes('youtu.be')) continue;
      if (!seen.has(resource.url)) seen.set(resource.url, []);
      seen.get(resource.url).push(resource);
    }
  }

  const checks = [];
  async function check(url, uses) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 GIIS proof-point resource audit',
          connection: 'close',
        },
      });
      checks.push({ url, ok: res.status >= 200 && res.status < 400, status: res.status, uses: uses.length, finalUrl: res.url });
    } catch (err) {
      checks.push({ url, ok: false, error: err.name || err.message, uses: uses.length });
    } finally {
      clearTimeout(timeout);
    }
  }

  const entries = [...seen.entries()];
  for (let index = 0; index < entries.length; index += 8) {
    await Promise.all(entries.slice(index, index + 8).map(([url, uses]) => check(url, uses)));
  }

  return {
    checked: checks.length,
    bad: checks.filter((item) => !item.ok),
    skippedYouTube: rows.reduce((sum, row) => sum + row.resourceUrls.filter((item) => item.url.includes('youtube.com') || item.url.includes('youtu.be')).length, 0),
  };
}

function markdownReport(report) {
  const lines = [];
  lines.push('# Proof-Point Course QA');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.warn} warn / ${report.summary.fail} fail (${report.summary.total} courses)`);
  if (report.urlSmoke) {
    lines.push(`Non-YouTube URL smoke: ${report.urlSmoke.checked} checked / ${report.urlSmoke.bad.length} bad; YouTube resources skipped: ${report.urlSmoke.skippedYouTube}.`);
  }
  lines.push('');
  lines.push('| Course | Modules | Quiz | Midterm | Final | Status |');
  lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
  for (const row of report.courses) {
    lines.push(`| ${row.name} | ${row.modules} | ${row.quizQuestions} | ${row.midtermQuestions} | ${row.finalQuestions} | ${row.status} |`);
  }
  const issues = report.courses.flatMap((row) => row.issues.map((item) => ({ course: row.slug, ...item })));
  if (issues.length) {
    lines.push('');
    lines.push('## Issues');
    for (const item of issues) lines.push(`- ${item.course}: ${item.code} — ${item.message}`);
  }
  if (report.urlSmoke?.bad?.length) {
    lines.push('');
    lines.push('## URL Smoke Issues');
    for (const item of report.urlSmoke.bad) lines.push(`- ${item.status || item.error}: ${item.url}`);
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

async function main() {
  const checkUrls = process.argv.includes('--check-urls');
  const json = process.argv.includes('--json');
  const reportIndex = process.argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? process.argv[reportIndex + 1] : null;

  const courses = TARGETS.map(auditCourse);
  const summary = courses.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status] += 1;
    return acc;
  }, { total: 0, pass: 0, warn: 0, fail: 0 });

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    courses: courses.map(({ resourceUrls, ...row }) => row),
  };

  if (checkUrls) report.urlSmoke = await smokeCheckUrls(courses);

  if (reportPath) {
    const full = path.resolve(ROOT, reportPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, markdownReport(report));
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Proof-point course QA: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} courses)`);
    if (report.urlSmoke) {
      console.log(`Non-YouTube URL smoke: ${report.urlSmoke.checked} checked / ${report.urlSmoke.bad.length} bad; YouTube skipped: ${report.urlSmoke.skippedYouTube}`);
    }
    for (const row of courses.filter((item) => item.status !== 'pass')) {
      console.log(`\n[${row.status.toUpperCase()}] ${row.slug} — ${row.name}`);
      for (const item of row.issues) console.log(`  - ${item.severity}: ${item.code} — ${item.message}`);
    }
    if (report.urlSmoke?.bad?.length) {
      console.log('\nURL smoke issues:');
      for (const item of report.urlSmoke.bad) console.log(`  - ${item.status || item.error}: ${item.url}`);
    }
  }

  process.exit(summary.fail || report.urlSmoke?.bad?.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
