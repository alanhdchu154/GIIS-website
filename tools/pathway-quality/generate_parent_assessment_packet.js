#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_MD = path.join(ROOT, '_audit', 'parent-assessment-sample-packet.md');
const DEFAULT_JSON = path.join(ROOT, '_audit', 'parent-assessment-sample-packet.json');
const DEFAULT_PUBLIC_JSON = path.join(ROOT, 'public', 'data', 'parent-assessment-proof.json');

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

const PROFILES = [
  {
    key: 'data_lab',
    match: /\b(experiment|data|survey|interview|journal|track|record|measure|graph|calculate|audit)\b/i,
    label: 'Data / Lab Evidence',
    evidence: 'Student submits observations, calculations, data, or interview notes with a short interpretation.',
    rubricFocus: 'Data quality, method clarity, accuracy, and evidence-based conclusion.',
  },
  {
    key: 'project_design',
    match: /\b(design|create|build|develop|plan|model|canvas|campaign|program|chart|infographic|map|outline|calendar)\b/i,
    label: 'Project / Design Work',
    evidence: 'Student submits an artifact, plan, chart, model, or project link plus a short rationale.',
    rubricFocus: 'Completeness, practical detail, prompt alignment, and design decisions.',
  },
  {
    key: 'research_evidence',
    match: /\b(research|source|article|current news|report|citation|evidence|investigate|find|compare.*source)\b/i,
    label: 'Research / Evidence Report',
    evidence: 'Student submits sources, evidence notes, and a written explanation using course vocabulary.',
    rubricFocus: 'Source credibility, evidence use, reasoning, citations or links, and clarity.',
  },
  {
    key: 'presentation_performance',
    match: /\b(deliver|speech|present|teach|lead|demonstrate|role-play|role play|record a|video)\b/i,
    label: 'Presentation / Performance',
    evidence: 'Student submits a script, outline, reflection, or recording link when available.',
    rubricFocus: 'Preparation, communication choices, reflection quality, and module criteria.',
  },
  {
    key: 'practice_problem',
    match: /\b(solve|complete|practice|set up|label|classify|draw and label|reference sheet)\b/i,
    label: 'Practice / Problem Set',
    evidence: 'Student submits worked steps, labeled diagrams, classifications, or completed practice artifacts.',
    rubricFocus: 'Accuracy, shown work, corrections, and explanation of process.',
  },
  {
    key: 'writing_reflection',
    match: /\b(write|essay|paragraph|reflection|analysis|analyze|evaluate|explain|describe|compare|critique)\b/i,
    label: 'Writing / Reflection',
    evidence: 'Student submits a written response with examples, reasoning, and course vocabulary.',
    rubricFocus: 'Claim, organization, evidence, reasoning, and clarity of writing.',
  },
];

const DEFAULT_PROFILE = {
  key: 'general_evidence',
  label: 'Learning Evidence',
  evidence: 'Student submits written work, a document link, or a project link that answers the full prompt.',
  rubricFocus: 'Completion, accuracy, reasoning or evidence, and clarity.',
};

const REVIEW_RUBRIC = [
  { label: 'Completion', detail: 'Addresses every required part of the prompt.' },
  { label: 'Accuracy', detail: 'Uses correct concepts, calculations, sources, or course vocabulary.' },
  { label: 'Reasoning / Evidence', detail: 'Explains the answer and supports claims with examples, data, or text evidence.' },
  { label: 'Clarity', detail: 'Organized, readable, and submitted in a form parents can understand.' },
];

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  return process.argv[index + 1] || fallback;
}

function loadCourse(target) {
  const full = path.join(ROOT, target.file);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function splitExamQuestions(course) {
  const questions = course.questions || [];
  return {
    midterm: questions.filter((question) => question.examType === 'midterm'),
    final: questions.filter((question) => question.examType === 'final' || !question.examType),
  };
}

function profileAssignment(prompt = '') {
  const text = String(prompt || '');
  return PROFILES.find((profile) => profile.match.test(text)) || DEFAULT_PROFILE;
}

function isMultipleChoice(question) {
  return Array.isArray(question?.options) && question.options.length > 0;
}

function sampleQuestion(questions = [], preferShortAnswer = false) {
  const candidates = [...questions];
  const preferred = preferShortAnswer
    ? candidates.find((question) => !isMultipleChoice(question) && String(question.answer || '').length >= 80)
    : candidates.find((question) => isMultipleChoice(question) && String(question.explanation || '').length >= 60);
  return preferred || candidates.find((question) => isMultipleChoice(question)) || candidates[0] || null;
}

function answerPreview(question) {
  if (!question) return '';
  if (isMultipleChoice(question)) return String(question.answer || '');
  return String(question.answer || '').replace(/\s+/g, ' ').trim();
}

function sampleModule(course) {
  const modules = course.modules || [];
  return modules.find((mod) => String(mod.assignment || '').length >= 220) || modules[0] || null;
}

function parentValue(course, module, profile) {
  const department = String(course.department || '').toLowerCase();
  if (department.includes('math')) {
    return 'Parents can see worked steps, correct use of procedures, and whether the student can explain the meaning of an answer.';
  }
  if (department.includes('english')) {
    return 'Parents can see reading evidence, written organization, revision readiness, and whether the student supports claims with text details.';
  }
  if (department.includes('science')) {
    return 'Parents can see concept accuracy, diagrams or data evidence, and whether the student connects facts to scientific reasoning.';
  }
  if (department.includes('social')) {
    return 'Parents can see source use, historical or civic reasoning, and whether the student explains cause, evidence, and consequence.';
  }
  return `Parents can see a concrete ${profile.label.toLowerCase()} artifact instead of only a completion checkbox.`;
}

function buildCoursePacket(target) {
  const course = loadCourse(target);
  const modules = course.modules || [];
  const quizQuestions = course.quizQuestions || [];
  const { midterm, final } = splitExamQuestions(course);
  const module = sampleModule(course);
  const profile = profileAssignment(module?.assignment || '');
  const quizSample = sampleQuestion(quizQuestions);
  const midtermSample = sampleQuestion(midterm);
  const finalSample = sampleQuestion(final, true);

  return {
    slug: course.slug,
    name: course.name,
    department: course.department,
    credits: course.credits,
    courseEvidence: {
      modules: modules.length,
      assignments: modules.filter((mod) => String(mod.assignment || '').trim()).length,
      quizQuestions: quizQuestions.length,
      midtermQuestions: midterm.length,
      finalQuestions: final.length,
    },
    gradingStory: {
      transcriptGrade: 'Module quizzes 40%, midterm 30%, final exam 30%.',
      assignmentRole: 'Assignments are reviewed separately as learning evidence and must be submitted before the final exam unlocks.',
      reviewTarget: 'Teacher review should name one strength, one correction, and one next action.',
    },
    moduleSample: module ? {
      order: module.order,
      title: module.title,
      objectives: module.objectives,
      assignment: module.assignment,
      assignmentType: profile.label,
      expectedEvidence: profile.evidence,
      rubricFocus: profile.rubricFocus,
      parentValue: parentValue(course, module, profile),
    } : null,
    assessmentSamples: {
      quiz: quizSample ? {
        moduleOrder: quizSample.moduleOrder,
        question: quizSample.question,
        options: quizSample.options || [],
        answer: answerPreview(quizSample),
        explanation: quizSample.explanation || '',
      } : null,
      midterm: midtermSample ? {
        question: midtermSample.question,
        options: midtermSample.options || [],
        answer: answerPreview(midtermSample),
        explanation: midtermSample.explanation || '',
      } : null,
      final: finalSample ? {
        question: finalSample.question,
        options: finalSample.options || [],
        answer: answerPreview(finalSample),
        explanation: finalSample.explanation || '',
      } : null,
    },
    rubric: REVIEW_RUBRIC,
  };
}

function validatePacket(course) {
  const issues = [];
  if (course.courseEvidence.modules < 8) issues.push('course has fewer than 8 modules');
  if (course.courseEvidence.assignments !== course.courseEvidence.modules) issues.push('not every module has an assignment');
  if (course.courseEvidence.quizQuestions < course.courseEvidence.modules * 3) issues.push('quiz coverage is thin');
  if (course.courseEvidence.midtermQuestions < 15) issues.push('midterm has fewer than 15 questions');
  if (course.courseEvidence.finalQuestions < 20) issues.push('final has fewer than 20 questions');
  if (!course.moduleSample?.assignment) issues.push('missing parent-facing assignment sample');
  if (!course.moduleSample?.rubricFocus) issues.push('missing rubric focus');
  if (!course.assessmentSamples.quiz) issues.push('missing quiz sample');
  if (!course.assessmentSamples.midterm) issues.push('missing midterm sample');
  if (!course.assessmentSamples.final) issues.push('missing final sample');
  return issues;
}

function mdQuestion(question) {
  if (!question) return '_No sample available._';
  const lines = [];
  lines.push(`Question: ${question.question}`);
  if (question.options?.length) lines.push(`Options: ${question.options.join(' / ')}`);
  lines.push(`Answer: ${question.answer}`);
  if (question.explanation) lines.push(`Explanation: ${question.explanation}`);
  return lines.join('\n');
}

function markdownReport(packet) {
  const lines = [];
  lines.push('# GIIS Parent Assessment Sample Packet');
  lines.push('');
  lines.push(`Generated: ${packet.generatedAt}`);
  lines.push('');
  lines.push('Purpose: give parents and advisors concrete proof that GIIS courses include reviewable student work, quizzes, midterms, finals, and a visible grading story.');
  lines.push('');
  lines.push(`Summary: ${packet.summary.pass} pass / ${packet.summary.fail} fail (${packet.summary.total} proof-point courses)`);
  lines.push('');
  lines.push('## Parent-Facing Grading Story');
  lines.push('');
  lines.push('- Transcript grade: module quizzes 40%, midterm 30%, final exam 30%.');
  lines.push('- Assignments: reviewed separately as learning evidence and required before the final exam unlocks.');
  lines.push('- Feedback standard: name one strength, one correction, and one next action.');
  lines.push('');
  lines.push('## Course Coverage');
  lines.push('');
  lines.push('| Course | Modules | Assignments | Quiz | Midterm | Final | Status |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const course of packet.courses) {
    lines.push(`| ${course.name} | ${course.courseEvidence.modules} | ${course.courseEvidence.assignments} | ${course.courseEvidence.quizQuestions} | ${course.courseEvidence.midtermQuestions} | ${course.courseEvidence.finalQuestions} | ${course.status} |`);
  }
  lines.push('');

  for (const course of packet.courses) {
    lines.push(`## ${course.name}`);
    lines.push('');
    lines.push(`Department: ${course.department} | Credit: ${course.credits}`);
    lines.push('');
    lines.push(`Parent value: ${course.moduleSample.parentValue}`);
    lines.push('');
    lines.push('### Assignment Sample');
    lines.push('');
    lines.push(`Module ${course.moduleSample.order}: ${course.moduleSample.title}`);
    lines.push('');
    lines.push(`Assignment type: ${course.moduleSample.assignmentType}`);
    lines.push('');
    lines.push(`Prompt: ${course.moduleSample.assignment}`);
    lines.push('');
    lines.push(`Expected evidence: ${course.moduleSample.expectedEvidence}`);
    lines.push('');
    lines.push(`Rubric focus: ${course.moduleSample.rubricFocus}`);
    lines.push('');
    lines.push('### Assessment Samples');
    lines.push('');
    lines.push('Quiz sample:');
    lines.push('');
    lines.push(mdQuestion(course.assessmentSamples.quiz));
    lines.push('');
    lines.push('Midterm sample:');
    lines.push('');
    lines.push(mdQuestion(course.assessmentSamples.midterm));
    lines.push('');
    lines.push('Final sample:');
    lines.push('');
    lines.push(mdQuestion(course.assessmentSamples.final));
    lines.push('');
    lines.push('### Review Rubric');
    lines.push('');
    for (const item of course.rubric) lines.push(`- ${item.label}: ${item.detail}`);
    lines.push('');
  }

  const issues = packet.courses.flatMap((course) => course.issues.map((message) => ({ course: course.slug, message })));
  if (issues.length) {
    lines.push('## Issues');
    lines.push('');
    for (const issue of issues) lines.push(`- ${issue.course}: ${issue.message}`);
    lines.push('');
  }

  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function main() {
  const mdPath = path.resolve(ROOT, argValue('--report', DEFAULT_MD));
  const jsonPath = path.resolve(ROOT, argValue('--json-report', DEFAULT_JSON));
  const publicJsonPath = path.resolve(ROOT, argValue('--public-json', DEFAULT_PUBLIC_JSON));

  const courses = TARGETS.map(buildCoursePacket).map((course) => {
    const issues = validatePacket(course);
    return { ...course, status: issues.length ? 'fail' : 'pass', issues };
  });
  const summary = courses.reduce((acc, course) => {
    acc.total += 1;
    acc[course.status] += 1;
    return acc;
  }, { total: 0, pass: 0, fail: 0 });
  const packet = {
    generatedAt: new Date().toISOString(),
    summary,
    courses,
  };

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(publicJsonPath), { recursive: true });
  fs.writeFileSync(mdPath, markdownReport(packet));
  fs.writeFileSync(jsonPath, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(publicJsonPath, `${JSON.stringify(packet, null, 2)}\n`);

  console.log(`Parent assessment sample packet: ${summary.pass} pass / ${summary.fail} fail (${summary.total} courses)`);
  console.log(`Report: ${path.relative(ROOT, mdPath)}`);
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`);
  console.log(`Public JSON: ${path.relative(ROOT, publicJsonPath)}`);
  for (const course of courses.filter((item) => item.status === 'fail')) {
    console.log(`\n[FAIL] ${course.slug}`);
    for (const issue of course.issues) console.log(`  - ${issue}`);
  }

  process.exit(summary.fail ? 1 : 0);
}

main();
