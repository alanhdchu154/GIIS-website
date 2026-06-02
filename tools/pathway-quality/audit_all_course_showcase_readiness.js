#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSES_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'all-course-showcase-readiness.md');

const BLOCKED_RESOURCE_PATTERNS = [
  { pattern: /aaFrAFZATKU/, reason: 'known unrelated natural-number formula video' },
  { pattern: /KdxEAt91D7k/, reason: 'known non-instructional sketch video' },
  { pattern: /SkMNREAMNvc/, reason: 'known wrong systems-of-equations video' },
];

const LOGIN_OR_REMOVED_PATTERNS = [
  /Removed after/i,
  /may require login/i,
  /paid\/institutional/i,
  /commonlit\.org/i,
  /noredink\.com/i,
  /hbr\.org/i,
];

const ENGLISH_MISMATCH_PATTERNS = [
  /health-and-medicine/i,
  /economics-finance-domain/i,
  /Health and medicine/i,
  /Economics and finance/i,
];

function walkJson(dir) {
  const rows = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) rows.push(...walkJson(full));
    else if (name.endsWith('.json')) rows.push(full);
  }
  return rows;
}

function rel(full) {
  return path.relative(ROOT, full);
}

function issue(severity, code, message) {
  return { severity, code, message };
}

function splitQuestions(questions = []) {
  return {
    midterm: questions.filter((q) => q.examType === 'midterm'),
    final: questions.filter((q) => q.examType === 'final' || !q.examType),
  };
}

function isResourceRequired(field) {
  return field === 'readingUrl' || field === 'videoUrl' || field === 'practiceUrl';
}

function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/.test(String(url || ''));
}

function youtubeVideoId(url) {
  const value = String(url || '').trim();
  let match = value.match(/[?&]v=([^&]+)/);
  if (match) return match[1];
  match = value.match(/youtu\.be\/([^?&/]+)/);
  if (match) return match[1];
  match = value.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (match) return match[1];
  return null;
}

function hasSubstantiveAssignment(text) {
  const action = /\b(submit|write|create|draw|solve|analyze|compare|explain|design|research|calculate|classify|identify|annotate|reflect|predict|complete|find|determine|label|trace|review|draft|construct|evaluate|argue)\b/i;
  const deliverable = /\b(evidence|table|diagram|paragraph|essay|chart|reflection|explanation|work|analysis|citation|source|steps|justification|claim|timeline|profile|equation|graph|model|problem|examples?|sentences?|formula|draft|outline|response|project|report|portfolio|memo)\b/i;
  const quantityOrStructure = /\b\d+|:|\(|\)|;|,/;
  return String(text || '').trim().length >= 140 && action.test(text) && (deliverable.test(text) || quantityOrStructure.test(text));
}

function likelyHealthContext(course, mod) {
  const haystack = [
    course.department,
    course.name,
    course.slug,
    mod.title,
    mod.objectives,
    mod.assignment,
  ].join(' ').toLowerCase();
  return /\b(health|medicine|medical|anatomy|physiology|nutrition|wellness|fitness|athletic|injury|rehabilitation|concussion|body|exercise|muscular|strength|endurance|flexibility|mental|psychology|cognitive|biology|sports psychology)\b/.test(haystack);
}

function likelyFinanceContext(course, mod) {
  const haystack = [
    course.department,
    course.name,
    course.slug,
    mod.title,
    mod.objectives,
    mod.assignment,
  ].join(' ').toLowerCase();
  return /\b(economic|economics|finance|financial|business|marketing|advertising|consumer|entrepreneur|management|strategy|accounting|banking|market|investment|corporate|sports management|leadership|organization|organizational|job design|teamwork)\b/.test(haystack);
}

function isEnglishLiteratureCourse(course) {
  const haystack = `${course.slug || ''} ${course.name || ''}`.toLowerCase();
  return course.department === 'English' && /\benglish\b|literature|writing|composition|poetry|novel|drama|rhetoric/.test(haystack);
}

function validateQuestions(kind, questions, issues, courseSlug) {
  const seen = new Set();
  for (const q of questions || []) {
    const label = `${courseSlug} ${kind}${q.moduleOrder ? ` module ${q.moduleOrder}` : ''}${q.order ? ` #${q.order}` : ''}`;
    const question = String(q.question || '').trim();
    const answer = String(q.answer || '').trim();
    const options = Array.isArray(q.options) ? q.options.map((option) => String(option).trim()) : [];

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
      const normalized = options.map((option) => option.toLowerCase());
      if (new Set(normalized).size !== normalized.length) issues.push(issue('fail', 'duplicate_options', `${label} has duplicate answer options.`));
    }

    const key = question.toLowerCase();
    if (key) {
      if (seen.has(key)) issues.push(issue('fail', 'duplicate_question_text', `${label} duplicates another question in this course.`));
      seen.add(key);
    }
  }
}

function auditCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const modules = course.modules || [];
  const quizQuestions = course.quizQuestions || [];
  const { midterm, final } = splitQuestions(course.questions || []);
  const issues = [];
  const resourceUrls = [];

  if (!course.slug) issues.push(issue('fail', 'missing_slug', `${rel(file)} is missing slug.`));
  if (!course.isPublished) issues.push(issue('warn', 'not_published', `${course.slug} is not published.`));
  if (modules.length < 8) issues.push(issue('fail', 'thin_module_count', `${course.slug} has only ${modules.length} modules.`));
  if (quizQuestions.length < modules.length * 3) issues.push(issue('fail', 'thin_quiz_count', `${course.slug} has ${quizQuestions.length} quiz questions for ${modules.length} modules.`));
  if (midterm.length < 15) issues.push(issue('fail', 'thin_midterm', `${course.slug} has ${midterm.length} midterm questions.`));
  if (final.length < 20) issues.push(issue('fail', 'thin_final', `${course.slug} has ${final.length} final questions.`));

  for (const mod of modules) {
    const moduleLabel = `${course.slug} module ${mod.order} "${mod.title}"`;
    for (const [field, noteField] of [
      ['readingUrl', 'readingNote'],
      ['videoUrl', 'videoNote'],
      ['video2Url', 'video2Note'],
      ['practiceUrl', 'practiceNote'],
    ]) {
      const url = String(mod[field] || '').trim();
      const note = String(mod[noteField] || '').trim();
      if (isResourceRequired(field) && !url) issues.push(issue('fail', 'missing_resource_url', `${moduleLabel} ${field} is missing.`));
      if (url && !/^https:\/\//.test(url)) issues.push(issue('fail', 'non_https_resource_url', `${moduleLabel} ${field} must use https.`));
      if (url && !note) issues.push(issue('fail', 'missing_resource_note', `${moduleLabel} ${noteField} is missing.`));
      if (url) {
        resourceUrls.push({
          course: course.slug,
          module: mod.order,
          moduleTitle: mod.title,
          field,
          url,
        });
      }
      if (!url && note && LOGIN_OR_REMOVED_PATTERNS.some((pattern) => pattern.test(note))) {
        issues.push(issue('fail', 'removed_resource_placeholder', `${moduleLabel} ${noteField} is still a removed-resource placeholder.`));
      }
    }

    const moduleText = JSON.stringify(mod);
    for (const pattern of LOGIN_OR_REMOVED_PATTERNS) {
      if (pattern.test(moduleText)) {
        issues.push(issue('fail', 'blocked_resource_residue', `${moduleLabel} still references removed, login-gated, or institutional resources.`));
        break;
      }
    }
    for (const blocked of BLOCKED_RESOURCE_PATTERNS) {
      if (blocked.pattern.test(moduleText)) {
        issues.push(issue('fail', 'blocked_known_bad_resource', `${moduleLabel} references a known bad resource: ${blocked.reason}.`));
      }
    }
    if (isEnglishLiteratureCourse(course) && ENGLISH_MISMATCH_PATTERNS.some((pattern) => pattern.test(moduleText))) {
      issues.push(issue('fail', 'english_resource_domain_mismatch', `${moduleLabel} uses a subject-domain resource that does not fit English/literature practice.`));
    }
    if (/health-and-medicine|Health and medicine/i.test(moduleText) && !likelyHealthContext(course, mod)) {
      issues.push(issue('warn', 'possible_health_domain_mismatch', `${moduleLabel} uses health/medicine resources outside an obvious health context.`));
    }
    if (/economics-finance-domain|Economics and finance/i.test(moduleText) && !likelyFinanceContext(course, mod)) {
      issues.push(issue('warn', 'possible_finance_domain_mismatch', `${moduleLabel} uses economics/finance resources outside an obvious finance/business context.`));
    }
    if (!String(mod.objectives || '').trim() || String(mod.objectives || '').trim().length < 80) {
      issues.push(issue('fail', 'weak_objectives', `${moduleLabel} objectives are too thin.`));
    }
    if (!hasSubstantiveAssignment(mod.assignment)) {
      issues.push(issue('fail', 'thin_assignment_evidence', `${moduleLabel} assignment does not yet read like reviewable student evidence.`));
    }
  }

  validateQuestions('quiz', quizQuestions, issues, course.slug);
  validateQuestions('exam', course.questions || [], issues, course.slug);

  const failCount = issues.filter((item) => item.severity === 'fail').length;
  const warnCount = issues.filter((item) => item.severity === 'warn').length;

  return {
    slug: course.slug,
    name: course.name,
    department: course.department,
    file: rel(file),
    modules: modules.length,
    quizQuestions: quizQuestions.length,
    midtermQuestions: midterm.length,
    finalQuestions: final.length,
    status: failCount ? 'fail' : warnCount ? 'warn' : 'pass',
    resourceUrls,
    issues,
  };
}

async function smokeCheckUrls(rows) {
  const seen = new Map();
  for (const row of rows) {
    for (const resource of row.resourceUrls) {
      if (isYouTubeUrl(resource.url)) continue;
      if (!seen.has(resource.url)) seen.set(resource.url, []);
      seen.get(resource.url).push(resource);
    }
  }

  const checks = [];
  async function check(url, uses) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 GIIS all-course resource audit',
          connection: 'close',
        },
      });
      checks.push({
        url,
        ok: res.status >= 200 && res.status < 400,
        status: res.status,
        uses: uses.length,
        sample: uses[0],
        finalUrl: res.url,
      });
    } catch (err) {
      checks.push({
        url,
        ok: false,
        error: err.name || err.message,
        uses: uses.length,
        sample: uses[0],
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  const entries = [...seen.entries()];
  for (let index = 0; index < entries.length; index += 24) {
    await Promise.all(entries.slice(index, index + 24).map(([url, uses]) => check(url, uses)));
  }

  return {
    checked: checks.length,
    bad: checks.filter((item) => !item.ok),
  };
}

async function smokeCheckYouTube(rows) {
  const seen = new Map();
  for (const row of rows) {
    for (const resource of row.resourceUrls) {
      if (!isYouTubeUrl(resource.url)) continue;
      const id = youtubeVideoId(resource.url);
      if (!id) continue;
      if (!seen.has(id)) seen.set(id, []);
      seen.get(id).push(resource);
    }
  }

  const checks = [];
  async function check(id, uses) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 GIIS all-course YouTube audit',
          connection: 'close',
        },
      });
      checks.push({
        id,
        ok: res.ok,
        status: res.status,
        uses: uses.length,
        sample: uses[0],
      });
    } catch (err) {
      checks.push({
        id,
        ok: false,
        error: err.name || err.message,
        uses: uses.length,
        sample: uses[0],
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  const entries = [...seen.entries()];
  for (let index = 0; index < entries.length; index += 24) {
    await Promise.all(entries.slice(index, index + 24).map(([id, uses]) => check(id, uses)));
  }

  return {
    checked: checks.length,
    bad: checks.filter((item) => !item.ok),
  };
}

function markdownReport(report) {
  const lines = [];
  lines.push('# All-Course Showcase Readiness QA');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.warn} warn / ${report.summary.fail} fail (${report.summary.total} courses)`);
  if (report.urlSmoke) {
    lines.push(`Non-YouTube URL smoke: ${report.urlSmoke.checked} checked / ${report.urlSmoke.bad.length} bad.`);
  }
  if (report.youtubeSmoke) {
    lines.push(`YouTube oEmbed smoke: ${report.youtubeSmoke.checked} checked / ${report.youtubeSmoke.bad.length} bad.`);
  }
  lines.push('');
  lines.push('| Course | Department | Modules | Quiz | Midterm | Final | Status |');
  lines.push('| --- | --- | ---: | ---: | ---: | ---: | --- |');
  for (const row of report.courses) {
    lines.push(`| ${row.name} | ${row.department || ''} | ${row.modules} | ${row.quizQuestions} | ${row.midtermQuestions} | ${row.finalQuestions} | ${row.status} |`);
  }

  const issues = report.courses.flatMap((row) => row.issues.map((item) => ({ course: row.slug, file: row.file, ...item })));
  if (issues.length) {
    lines.push('');
    lines.push('## Issues');
    for (const item of issues) {
      lines.push(`- ${item.severity.toUpperCase()} ${item.course}: ${item.code} — ${item.message} (${item.file})`);
    }
  }
  if (report.urlSmoke?.bad?.length) {
    lines.push('');
    lines.push('## URL Smoke Issues');
    for (const item of report.urlSmoke.bad) {
      lines.push(`- ${item.status || item.error}: ${item.url} (${item.sample.course} module ${item.sample.module} ${item.sample.field})`);
    }
  }
  if (report.youtubeSmoke?.bad?.length) {
    lines.push('');
    lines.push('## YouTube Smoke Issues');
    for (const item of report.youtubeSmoke.bad) {
      lines.push(`- ${item.status || item.error}: ${item.id} (${item.sample.course} module ${item.sample.module} ${item.sample.field})`);
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const json = process.argv.includes('--json');
  const checkUrls = process.argv.includes('--check-urls');
  const checkYouTube = process.argv.includes('--check-youtube');
  const reportIndex = process.argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? path.resolve(ROOT, process.argv[reportIndex + 1]) : DEFAULT_REPORT;

  const courses = walkJson(COURSES_DIR).map(auditCourse);
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
  if (checkYouTube) report.youtubeSmoke = await smokeCheckYouTube(courses);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdownReport(report));

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`All-course showcase readiness QA: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} courses)`);
    console.log(`Report: ${rel(reportPath)}`);
    if (report.urlSmoke) {
      console.log(`Non-YouTube URL smoke: ${report.urlSmoke.checked} checked / ${report.urlSmoke.bad.length} bad`);
    }
    if (report.youtubeSmoke) {
      console.log(`YouTube oEmbed smoke: ${report.youtubeSmoke.checked} checked / ${report.youtubeSmoke.bad.length} bad`);
    }
    for (const row of courses.filter((item) => item.status !== 'pass')) {
      console.log(`\n[${row.status.toUpperCase()}] ${row.slug} — ${row.name}`);
      for (const item of row.issues) console.log(`  - ${item.severity}: ${item.code} — ${item.message}`);
    }
    if (report.urlSmoke?.bad?.length) {
      console.log('\nURL smoke issues:');
      for (const item of report.urlSmoke.bad) console.log(`  - ${item.status || item.error}: ${item.url}`);
    }
    if (report.youtubeSmoke?.bad?.length) {
      console.log('\nYouTube smoke issues:');
      for (const item of report.youtubeSmoke.bad) console.log(`  - ${item.status || item.error}: ${item.id}`);
    }
  }

  process.exit(summary.fail || report.urlSmoke?.bad?.length || report.youtubeSmoke?.bad?.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
