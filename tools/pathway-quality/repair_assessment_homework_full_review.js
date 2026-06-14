#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DRY_RUN = process.argv.includes('--dry-run');

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

function hasMcOptions(question) {
  return Array.isArray(question.options) && question.options.length > 0;
}

function isNumericOrFormula(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  return /^[0-9\s.,=%$()+\-*/^:√πxyabcdnmt<>≤≥]+$/i.test(value) || /^(x|y|n|t|r|p)\s*=/.test(value);
}

function inferOpenType(question) {
  const answer = String(question.answer || '').trim();
  const prompt = String(question.question || '').trim();
  if (/^Fill in the blank:/i.test(prompt)) return 'fill';
  if (isNumericOrFormula(answer)) return 'fill';
  if (answer.length <= 80 && words(answer).length <= 8) return 'fill';
  return 'short';
}

function hasHomeworkScaffold(text) {
  return /\bSubmit:\b/i.test(text) && /\bInclude:\b/i.test(text) && /\bEvaluation:\b/i.test(text);
}

function assignmentNeedsScaffold(text) {
  if (!String(text || '').trim()) return false;
  if (hasHomeworkScaffold(text)) return false;
  return true;
}

function subjectNoun(course) {
  const department = String(course.department || '').toLowerCase();
  if (department.includes('math')) return 'calculations, diagrams, equations, or graphs';
  if (department.includes('science')) return 'data, diagrams, observations, calculations, or scientific explanations';
  if (department.includes('english')) return 'drafts, annotations, quotations, analysis, or revised writing';
  if (department.includes('social')) return 'sources, evidence, examples, maps, timelines, or analysis';
  if (department.includes('psychology')) return 'examples, evidence, observations, concepts, or analysis';
  if (department.includes('pe')) return 'logs, observations, plans, diagrams, or reflections';
  return 'notes, examples, evidence, calculations, sources, or analysis';
}

function polishAssignment(course, mod) {
  const original = String(mod.assignment || '').trim();
  if (!assignmentNeedsScaffold(original)) return original;
  const evidenceNoun = subjectNoun(course);
  const topic = mod.title ? `the ${mod.title} module` : 'this module';
  return [
    original,
    `Submit: a document, worksheet, slide, image, or link that shows the completed work.`,
    `Include: ${evidenceNoun} from ${topic}, plus a short explanation of how your work supports your answer.`,
    'Evaluation: the teacher should be able to see the final product, the steps or evidence used, and one clear connection to the module objective.',
  ].join(' ');
}

function repairQuestion(question) {
  if (hasMcOptions(question)) return 0;
  const currentType = String(question.type || '').toLowerCase();
  const inferred = inferOpenType(question);
  if (currentType !== 'short' && currentType !== 'fill') {
    question.type = inferred;
    return 1;
  }
  if (currentType === 'fill' && inferred === 'short') {
    question.type = 'short';
    return 1;
  }
  return 0;
}

function repairCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changes = 0;
  let assignmentChanges = 0;
  let questionChanges = 0;

  for (const mod of course.modules || []) {
    const next = polishAssignment(course, mod);
    if (next !== mod.assignment) {
      mod.assignment = next;
      changes += 1;
      assignmentChanges += 1;
    }
  }

  for (const question of [...(course.quizQuestions || []), ...(course.questions || [])]) {
    const changed = repairQuestion(question);
    changes += changed;
    questionChanges += changed;
  }

  if (changes && !DRY_RUN) {
    fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  }

  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    changes,
    assignmentChanges,
    questionChanges,
  };
}

function main() {
  const rows = walk(COURSE_DIR).map(repairCourse).filter((row) => row.changes);
  const totals = rows.reduce((acc, row) => {
    acc.changes += row.changes;
    acc.assignmentChanges += row.assignmentChanges;
    acc.questionChanges += row.questionChanges;
    return acc;
  }, { changes: 0, assignmentChanges: 0, questionChanges: 0 });

  console.log(`${DRY_RUN ? 'Would repair' : 'Repaired'} ${totals.changes} fields across ${rows.length} course files.`);
  console.log(`Assignments=${totals.assignmentChanges}; open-question metadata=${totals.questionChanges}`);
  for (const row of rows.slice(0, 25)) {
    console.log(`- ${row.slug}: ${row.assignmentChanges} assignments, ${row.questionChanges} questions (${row.file})`);
  }
  if (rows.length > 25) console.log(`- ... ${rows.length - 25} more course files`);
}

main();
