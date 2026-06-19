#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getExpertLens } = require('../../src/components/pages/Learn/syllabusExpertLens');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DEFAULT_MD = path.join(ROOT, '_audit', 'module-syllabus-full-review.md');
const DEFAULT_JSON = path.join(ROOT, '_audit', 'module-syllabus-full-review.json');
const STRICT = process.argv.includes('--strict');

const ACTION_VERBS = /\b(analyze|apply|argue|calculate|check|classify|compare|complete|connect|construct|create|define|demonstrate|describe|design|determine|differentiate|document|draft|evaluate|explain|identify|interpret|justify|model|predict|research|revise|show|solve|summarize|support|trace|use|write)\b/gi;
const BLOCKED_RE = /(commonlit\.org|khanacademy\.org|noredink\.com|hbr\.org|may require login|paid\/institutional|Removed after)/i;
const PLACEHOLDER_RE = /\b(TBD|placeholder|coming soon|example\.com|lorem ipsum)\b/i;
const RESOURCE_NOTE_GENERIC_RE = /^(reading|video|practice|lesson|article|exercise|worksheet|resource|tutorial)$/i;
const ASSIGNMENT_STRUCTURE_RE = /\bSubmit:.*\bInclude:.*\bEvaluation:/is;
const ASSIGNMENT_EVIDENCE_RE = /\b(evidence|reasoning|show your work|cite|source|data|example|justify|explain|analysis|reflection|rubric|criteria|feedback)\b/i;

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

function rel(file) {
  return path.relative(ROOT, file);
}

function issue(severity, code, message, sample) {
  return { severity, code, message, ...(sample ? { sample } : {}) };
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function actionVerbCount(text) {
  const matches = String(text || '').match(ACTION_VERBS) || [];
  return new Set(matches.map((item) => item.toLowerCase())).size;
}

function uniqueCount(items) {
  return new Set(items.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)).size;
}

function expectedHours(course) {
  const credits = Number(course.credits || 0);
  if (credits >= 1) return 36;
  if (credits >= 0.5) return 18;
  return 8;
}

function isApCourse(course) {
  return String(course.type || '').toLowerCase() === 'ap' || /\bAP\b/.test(String(course.name || ''));
}

function validateCourseShell(course, file, issues, metrics) {
  if (!course.slug) issues.push(issue('fail', 'missing_slug', `${rel(file)} is missing slug.`));
  if (!course.name) issues.push(issue('fail', 'missing_course_name', `${course.slug || rel(file)} is missing name.`));
  if (!course.nameZh) issues.push(issue('warn', 'missing_course_name_zh', `${course.slug} is missing Chinese course name.`));
  if (!course.department) issues.push(issue('fail', 'missing_department', `${course.slug} is missing department.`));
  if (!course.type) issues.push(issue('warn', 'missing_course_type', `${course.slug} is missing type.`));
  if (!Number.isFinite(Number(course.credits)) || Number(course.credits) <= 0) {
    issues.push(issue('fail', 'invalid_credits', `${course.slug} has invalid credits.`));
  }
  if (!String(course.description || '').trim() || words(course.description).length < 18) {
    issues.push(issue('warn', 'thin_course_description', `${course.slug} course description is too thin for a parent-facing syllabus.`, course.description));
  }
  if (isApCourse(course) && !/AP|College Board|exam|college-level/i.test(String(course.description || ''))) {
    issues.push(issue('warn', 'ap_alignment_not_visible', `${course.slug} is AP-labeled but its description does not visibly name AP/college-level alignment.`));
  }
  if (!course.isPublished) issues.push(issue('warn', 'not_published', `${course.slug} is not published.`));
  metrics.totalHours = Number((course.modules || []).reduce((sum, mod) => sum + Number(mod.estimatedHrs || 0), 0).toFixed(1));
  const minHours = expectedHours(course);
  if (metrics.totalHours < minHours) {
    issues.push(issue('warn', 'low_syllabus_hours', `${course.slug} has ${metrics.totalHours} estimated module hours; expected at least ${minHours} for ${course.credits} credit(s).`));
  }
}

function validateModuleSequence(course, modules, issues) {
  if (modules.length < 8) issues.push(issue('fail', 'thin_module_count', `${course.slug} has only ${modules.length} modules.`));
  const orders = modules.map((mod) => Number(mod.order));
  if (uniqueCount(orders) !== orders.length) issues.push(issue('fail', 'duplicate_module_order', `${course.slug} has duplicate module order values.`));
  const expected = [...Array(modules.length)].map((_, index) => index + 1);
  if (orders.some((order, index) => order !== expected[index])) {
    issues.push(issue('fail', 'non_contiguous_module_order', `${course.slug} module orders should be contiguous from 1 to ${modules.length}; found ${orders.join(', ')}.`));
  }
  if (uniqueCount(modules.map((mod) => mod.title)) !== modules.length) {
    issues.push(issue('warn', 'duplicate_module_titles', `${course.slug} has duplicate module titles.`));
  }
}

function validateResource(course, mod, field, noteField, required, issues, metrics) {
  const label = `${course.slug} module ${mod.order} "${mod.title || 'Untitled'}"`;
  const url = String(mod[field] || '').trim();
  const note = String(mod[noteField] || '').trim();
  if (required && !url) issues.push(issue('fail', 'missing_required_resource', `${label} is missing ${field}.`));
  if (url) {
    metrics.resourceLinks += 1;
    if (!/^https:\/\//.test(url)) issues.push(issue('fail', 'non_https_resource', `${label} ${field} must use https.`));
    if (BLOCKED_RE.test(url) || BLOCKED_RE.test(note)) {
      issues.push(issue('fail', 'blocked_resource_residue', `${label} ${field}/${noteField} references a removed, login-gated, or institutional resource.`, `${url} ${note}`));
    }
    if (PLACEHOLDER_RE.test(url) || PLACEHOLDER_RE.test(note)) {
      issues.push(issue('fail', 'placeholder_resource', `${label} ${field}/${noteField} still contains placeholder wording.`, `${url} ${note}`));
    }
    if (!note) {
      issues.push(issue('fail', 'missing_resource_note', `${label} is missing ${noteField}.`));
    } else if (note.length < 35 || RESOURCE_NOTE_GENERIC_RE.test(note)) {
      issues.push(issue('warn', 'thin_resource_note', `${label} ${noteField} is too thin to help a family understand why the resource is assigned.`, note));
    }
  } else if (note && (BLOCKED_RE.test(note) || PLACEHOLDER_RE.test(note))) {
    issues.push(issue('fail', 'stale_empty_resource_note', `${label} ${noteField} contains stale resource residue without a URL.`, note));
  }
}

function validateModule(course, mod, issues, metrics) {
  const label = `${course.slug} module ${mod.order} "${mod.title || 'Untitled'}"`;
  metrics.modules += 1;

  if (!String(mod.title || '').trim()) issues.push(issue('fail', 'missing_module_title', `${label} is missing title.`));
  if (!String(mod.titleZh || '').trim()) issues.push(issue('warn', 'missing_module_title_zh', `${label} is missing titleZh.`));
  if (String(mod.title || '').trim().length < 8) issues.push(issue('warn', 'thin_module_title', `${label} title is too terse for a syllabus.`));

  const estimatedHrs = Number(mod.estimatedHrs || 0);
  if (!Number.isFinite(estimatedHrs) || estimatedHrs <= 0) {
    issues.push(issue('fail', 'invalid_estimated_hours', `${label} has invalid estimatedHrs.`));
  } else if (estimatedHrs < 1.5 || (estimatedHrs > 6.5 && !(estimatedHrs <= 12 && /capstone|research|portfolio|argument|project/i.test(`${mod.title || ''} ${mod.assignment || ''}`)))) {
    issues.push(issue('warn', 'unusual_estimated_hours', `${label} estimatedHrs ${estimatedHrs} is outside the expected module range.`));
  }

  const objectives = String(mod.objectives || '').trim();
  const objectiveWords = words(objectives).length;
  const verbs = actionVerbCount(objectives);
  if (!objectives) {
    issues.push(issue('fail', 'missing_objectives', `${label} is missing learning objectives.`));
  } else {
    metrics.objectiveWords += objectiveWords;
    if (objectives.length < 90 || objectiveWords < 12) {
      issues.push(issue('fail', 'thin_objectives', `${label} objectives are too thin for a syllabus.`, objectives));
    } else if (objectives.length < 130 || objectiveWords < 18 || verbs < 2) {
      issues.push(issue('warn', 'could_strengthen_objectives', `${label} objectives should be more measurable and parent-readable.`, objectives));
    }
  }

  validateResource(course, mod, 'readingUrl', 'readingNote', true, issues, metrics);
  validateResource(course, mod, 'videoUrl', 'videoNote', true, issues, metrics);
  validateResource(course, mod, 'video2Url', 'video2Note', false, issues, metrics);
  validateResource(course, mod, 'practiceUrl', 'practiceNote', true, issues, metrics);

  const assignment = String(mod.assignment || '').trim();
  if (!assignment) {
    issues.push(issue('fail', 'missing_assignment', `${label} is missing assignment.`));
  } else {
    metrics.assignments += 1;
    if (assignment.length < 170) issues.push(issue('fail', 'thin_assignment', `${label} assignment is too thin for reviewable evidence.`, assignment));
    if (!ASSIGNMENT_STRUCTURE_RE.test(assignment)) {
      issues.push(issue('fail', 'missing_assignment_structure', `${label} assignment should state Submit, Include, and Evaluation expectations.`, assignment));
    }
    if (!ASSIGNMENT_EVIDENCE_RE.test(assignment)) {
      issues.push(issue('warn', 'weak_assignment_evidence_language', `${label} assignment should make evidence/reasoning expectations visible.`, assignment));
    }
    if (BLOCKED_RE.test(assignment) || PLACEHOLDER_RE.test(assignment)) {
      issues.push(issue('fail', 'blocked_or_placeholder_assignment', `${label} assignment contains blocked-resource or placeholder residue.`, assignment));
    }
  }

  const lens = getExpertLens(course, mod);
  if (!lens || !lens.insight || !lens.watchFor || !lens.transfer) {
    issues.push(issue('fail', 'missing_expert_lens', `${label} is missing a complete expert lens.`));
  } else {
    metrics.expertLens += 1;
    for (const [field, value] of Object.entries(lens)) {
      const text = String(value || '').trim();
      if (words(text).length < 10) {
        issues.push(issue('fail', 'thin_expert_lens', `${label} expert lens ${field} is too thin.`, text));
      }
      if (/PhD|doctorate|doctoral|guarantee|expert-authored/i.test(text)) {
        issues.push(issue('fail', 'unsafe_expert_claim', `${label} expert lens makes an unsupported credential claim.`, text));
      }
    }
  }
}

function auditCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const modules = [...(course.modules || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const issues = [];
  const metrics = {
    modules: 0,
    assignments: 0,
    resourceLinks: 0,
    objectiveWords: 0,
    expertLens: 0,
    totalHours: 0,
    quizQuestions: (course.quizQuestions || []).length,
    midtermQuestions: (course.questions || []).filter((q) => q.examType === 'midterm').length,
    finalQuestions: (course.questions || []).filter((q) => q.examType === 'final' || !q.examType).length,
  };

  validateCourseShell(course, file, issues, metrics);
  validateModuleSequence(course, modules, issues);
  for (const mod of modules) validateModule(course, mod, issues, metrics);

  const quizByModule = new Map();
  for (const question of course.quizQuestions || []) {
    quizByModule.set(Number(question.moduleOrder), (quizByModule.get(Number(question.moduleOrder)) || 0) + 1);
  }
  for (const mod of modules) {
    const count = quizByModule.get(Number(mod.order)) || 0;
    if (count < 3) issues.push(issue('fail', 'thin_module_quiz_coverage', `${course.slug} module ${mod.order} has only ${count} quiz questions.`));
  }
  if (metrics.midtermQuestions < 15) issues.push(issue('fail', 'thin_midterm', `${course.slug} has ${metrics.midtermQuestions} midterm questions.`));
  if (metrics.finalQuestions < 20) issues.push(issue('fail', 'thin_final', `${course.slug} has ${metrics.finalQuestions} final questions.`));

  const failCount = issues.filter((item) => item.severity === 'fail').length;
  const warnCount = issues.filter((item) => item.severity === 'warn').length;

  return {
    file: rel(file),
    slug: course.slug,
    name: course.name,
    department: course.department,
    type: course.type,
    credits: Number(course.credits || 0),
    status: failCount ? 'fail' : warnCount ? 'warn' : 'pass',
    metrics: {
      ...metrics,
      averageObjectiveWords: metrics.modules ? Number((metrics.objectiveWords / metrics.modules).toFixed(1)) : 0,
    },
    issueCounts: { fail: failCount, warn: warnCount },
    issues,
  };
}

function buildSummary(courses) {
  const summary = courses.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status] += 1;
    acc.metrics.modules += row.metrics.modules;
    acc.metrics.assignments += row.metrics.assignments;
    acc.metrics.resourceLinks += row.metrics.resourceLinks;
    acc.metrics.expertLens += row.metrics.expertLens;
    acc.metrics.hours += row.metrics.totalHours;
    acc.metrics.quizQuestions += row.metrics.quizQuestions;
    acc.metrics.midtermQuestions += row.metrics.midtermQuestions;
    acc.metrics.finalQuestions += row.metrics.finalQuestions;
    acc.issueCounts.fail += row.issueCounts.fail;
    acc.issueCounts.warn += row.issueCounts.warn;
    return acc;
  }, {
    total: 0,
    pass: 0,
    warn: 0,
    fail: 0,
    metrics: { modules: 0, assignments: 0, resourceLinks: 0, expertLens: 0, hours: 0, quizQuestions: 0, midtermQuestions: 0, finalQuestions: 0 },
    issueCounts: { fail: 0, warn: 0 },
  });
  summary.metrics.hours = Number(summary.metrics.hours.toFixed(1));
  summary.metrics.averageModules = summary.total ? Number((summary.metrics.modules / summary.total).toFixed(1)) : 0;
  summary.metrics.averageHours = summary.total ? Number((summary.metrics.hours / summary.total).toFixed(1)) : 0;
  return summary;
}

function markdown(report) {
  const lines = [];
  lines.push('# Module Syllabus Full Review');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.warn} warn / ${report.summary.fail} fail (${report.summary.total} courses)`);
  lines.push(`Coverage: ${report.summary.metrics.modules} modules, ${report.summary.metrics.assignments} assignments, ${report.summary.metrics.resourceLinks} resource links, ${report.summary.metrics.expertLens} expert-lens sections, ${report.summary.metrics.hours} estimated hours.`);
  lines.push(`Assessment context: ${report.summary.metrics.quizQuestions} quiz questions, ${report.summary.metrics.midtermQuestions} midterm questions, ${report.summary.metrics.finalQuestions} final questions.`);
  lines.push('');
  lines.push('## Standard');
  lines.push('');
  lines.push('- Every course must have parent-readable metadata, module sequence, estimated hours, learning objectives, expert-lens guidance, required resources, structured assignment evidence, and quiz/exam coverage.');
  lines.push('- `fail` means the syllabus could look incomplete or operationally unsafe.');
  lines.push('- `warn` means the course is usable, but not yet at the strongest parent-facing syllabus standard.');
  lines.push('');
  lines.push('| Course | Dept | Modules | Hours | Resources | Expert Lens | Avg Obj Words | Fail | Warn | Status |');
  lines.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const row of report.courses) {
    lines.push(`| ${row.name} | ${row.department || ''} | ${row.metrics.modules} | ${row.metrics.totalHours} | ${row.metrics.resourceLinks} | ${row.metrics.expertLens} | ${row.metrics.averageObjectiveWords} | ${row.issueCounts.fail} | ${row.issueCounts.warn} | ${row.status} |`);
  }
  const issueRows = report.courses.flatMap((course) => course.issues.map((item) => ({ course: course.slug, file: course.file, ...item })));
  if (issueRows.length) {
    lines.push('');
    lines.push('## Issues');
    for (const item of issueRows.slice(0, 500)) {
      lines.push(`- ${item.severity.toUpperCase()} ${item.course}: ${item.code} - ${item.message} (${item.file})`);
    }
    if (issueRows.length > 500) lines.push(`- ... ${issueRows.length - 500} more issues omitted; see JSON for full detail.`);
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function main() {
  const mdPath = path.resolve(ROOT, argValue('--report', DEFAULT_MD));
  const jsonPath = path.resolve(ROOT, argValue('--json-report', DEFAULT_JSON));
  const courses = walk(COURSE_DIR)
    .map(auditCourse)
    .sort((a, b) => {
      const rank = { fail: 0, warn: 1, pass: 2 };
      return rank[a.status] - rank[b.status] || a.slug.localeCompare(b.slug);
    });
  const report = {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(courses),
    courses,
  };

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, markdown(report));
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Module syllabus full review: ${report.summary.pass} pass / ${report.summary.warn} warn / ${report.summary.fail} fail (${report.summary.total} courses)`);
  console.log(`Coverage: ${report.summary.metrics.modules} modules, ${report.summary.metrics.resourceLinks} resource links, ${report.summary.metrics.expertLens} expert-lens sections, ${report.summary.metrics.hours} estimated hours`);
  console.log(`Issues: ${report.summary.issueCounts.fail} fail / ${report.summary.issueCounts.warn} warn`);
  console.log(`Report: ${rel(mdPath)}`);
  console.log(`JSON: ${rel(jsonPath)}`);
  for (const row of courses.filter((item) => item.status !== 'pass').slice(0, 20)) {
    console.log(`\n[${row.status.toUpperCase()}] ${row.slug} - ${row.name}`);
    for (const item of row.issues.slice(0, 8)) {
      console.log(`  - ${item.severity}: ${item.code} - ${item.message}`);
    }
    if (row.issues.length > 8) console.log(`  - ... ${row.issues.length - 8} more`);
  }

  if (report.summary.fail > 0 || (STRICT && report.summary.warn > 0)) process.exit(1);
}

main();
