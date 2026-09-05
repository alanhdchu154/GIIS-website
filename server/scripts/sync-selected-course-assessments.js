#!/usr/bin/env node

/**
 * Dry-run-first, update-only sync for selected module assignments/outlines,
 * exam questions, and module quiz questions.
 *
 * Full plans and rollback snapshots contain answer keys. They are written only
 * to explicitly named, newly created files with mode 0600. Stdout is summary
 * only and never includes prompts, options, answers, or explanations.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Prisma, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(REPO_ROOT, 'server', 'prisma', 'courses');
const MAX_TARGETS = 100;

const DEFINITIONS = {
  module: {
    model: 'courseModule',
    targetKey: 'moduleFields',
    fields: ['objectives', 'assignment'],
  },
  exam: {
    model: 'examQuestion',
    targetKey: 'examQuestions',
    fields: ['question', 'type', 'options', 'answer', 'explanation'],
  },
  quiz: {
    model: 'moduleQuizQuestion',
    targetKey: 'quizQuestions',
    fields: ['question', 'options', 'answer', 'explanation'],
  },
};

function fail(message) {
  throw new Error(message);
}

function argValues(name) {
  const prefix = `${name}=`;
  const matches = process.argv.filter((arg) => arg.startsWith(prefix));
  if (matches.length > 1) fail(`Argument may appear only once: ${name}`);
  return matches.length ? matches[0].slice(prefix.length) : '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function validateArguments() {
  const exact = new Set([
    '--apply',
    '--confirm-no-active-learners',
    '--allow-existing-enrollments',
  ]);
  const prefixes = [
    '--module-fields=',
    '--exam-questions=',
    '--quiz-questions=',
    '--plan-output=',
    '--expect-plan-hash=',
    '--snapshot=',
    '--rollback=',
  ];
  for (const arg of process.argv.slice(2)) {
    if (!exact.has(arg) && !prefixes.some((prefix) => arg.startsWith(prefix))) {
      fail(`Unknown argument: ${arg}`);
    }
  }
}

function walkJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(full, out);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('._')) out.push(full);
  }
  return out;
}

function uniqueMap(items, identity, label, file) {
  const result = new Map();
  for (const item of items || []) {
    const key = identity(item);
    if (result.has(key)) fail(`Duplicate ${label} identity ${key} in ${file}`);
    result.set(key, item);
  }
  return result;
}

function loadSourceCourses() {
  const courses = new Map();
  for (const file of walkJson(COURSE_DIR)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.slug) fail(`Course source missing slug: ${file}`);
    if (courses.has(data.slug)) fail(`Duplicate course source slug: ${data.slug}`);
    const relative = path.relative(REPO_ROOT, file);
    courses.set(data.slug, {
      file: relative,
      modules: uniqueMap(data.modules, (item) => String(Number(item.order)), 'module', relative),
      exams: uniqueMap(data.questions, (item) => `${item.examType}:${Number(item.order)}`, 'exam question', relative),
      quizzes: uniqueMap(data.quizQuestions, (item) => `${Number(item.moduleOrder)}:${Number(item.order)}`, 'quiz question', relative),
    });
  }
  return courses;
}

function parseList(raw, label, pattern, build) {
  if (!raw) return [];
  const targets = raw.split(',').filter(Boolean).map((token) => {
    const match = token.match(pattern);
    if (!match) fail(`Invalid ${label} target: ${token}`);
    return build(match, token);
  });
  if (new Set(targets.map((target) => target.key)).size !== targets.length) {
    fail(`${label} targets must be unique.`);
  }
  return targets;
}

function parseTargets() {
  const moduleFields = parseList(
    argValues('--module-fields'),
    'module field',
    /^([a-z0-9-]+):(\d+):(objectives|assignment)$/,
    (match, key) => ({ kind: 'module', slug: match[1], order: Number(match[2]), field: match[3], key }),
  );
  const examQuestions = parseList(
    argValues('--exam-questions'),
    'exam question',
    /^([a-z0-9-]+):(midterm|final):(\d+)$/,
    (match, key) => ({ kind: 'exam', slug: match[1], examType: match[2], order: Number(match[3]), key }),
  );
  const quizQuestions = parseList(
    argValues('--quiz-questions'),
    'quiz question',
    /^([a-z0-9-]+):(\d+):(\d+)$/,
    (match, key) => ({ kind: 'quiz', slug: match[1], moduleOrder: Number(match[2]), order: Number(match[3]), key }),
  );
  const total = moduleFields.length + examQuestions.length + quizQuestions.length;
  if (!total) fail('At least one --module-fields, --exam-questions, or --quiz-questions target is required.');
  if (total > MAX_TARGETS) fail(`Refusing more than ${MAX_TARGETS} combined targets.`);
  return { moduleFields, examQuestions, quizQuestions };
}

function databaseIdentity() {
  const raw = process.env.DATABASE_URL || '';
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: url.port || 'default',
      database: url.pathname.replace(/^\//, ''),
    };
  } catch {
    return { protocol: 'unknown', host: 'unknown', port: 'unknown', database: 'unknown' };
  }
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateValue(kind, field, value, label, { allowEmpty = false } = {}) {
  if (field === 'options') {
    if (value !== null && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
      fail(`${label} ${kind}.${field} must be null or an array of strings.`);
    }
    return;
  }
  if (typeof value !== 'string') fail(`${label} ${kind}.${field} must be a string.`);
  if (!allowEmpty && ['question', 'type', 'answer'].includes(field) && value.trim() === '') {
    fail(`${label} ${kind}.${field} must not be empty.`);
  }
}

function validateChoiceContract(kind, item, label) {
  if (kind === 'exam' && !new Set(['mc', 'fill', 'short']).has(item.type)) {
    fail(`${label} exam.type is unsupported: ${item.type}`);
  }
  const requiresChoices = kind === 'quiz' || (kind === 'exam' && item.type === 'mc');
  if (!requiresChoices) return;
  if (!Array.isArray(item.options) || item.options.length !== 4) {
    fail(`${label} ${kind} must have exactly four options.`);
  }
  const normalized = item.options.map((option) => option.trim().toLowerCase());
  if (new Set(normalized).size !== 4) fail(`${label} ${kind} options must be case-insensitively distinct.`);
  if (!normalized.includes(String(item.answer).trim().toLowerCase())) {
    fail(`${label} ${kind} answer must match exactly one option after grading normalization.`);
  }
}

function stableChange(change) {
  const { kind, model, id, identity, course, field, before, after } = change;
  return { kind, model, id, identity, course, field, before, after };
}

function planHash(changes) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(changes.map(stableChange)))
    .digest('hex');
}

function writePrivateJson(filePath, payload) {
  const absolute = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  });
  return absolute;
}

function targetSummary(targets) {
  return {
    moduleFields: targets.moduleFields.map((target) => target.key),
    examQuestions: targets.examQuestions.map((target) => target.key),
    quizQuestions: targets.quizQuestions.map((target) => target.key),
  };
}

function groupChanges(changes, valueKey) {
  const grouped = new Map();
  for (const change of changes) {
    const key = `${change.model}:${change.id}`;
    if (!grouped.has(key)) grouped.set(key, { kind: change.kind, model: change.model, id: change.id, data: {} });
    grouped.get(key).data[change.field] = change[valueKey];
  }
  return [...grouped.values()];
}

async function assertValues(tx, changes, valueKey, label) {
  for (const item of groupChanges(changes, valueKey)) {
    const row = await tx[item.model].findUnique({ where: { id: item.id } });
    if (!row) fail(`${label} missing ${item.model} row ${item.id}`);
    for (const [field, expected] of Object.entries(item.data)) {
      if (!deepEqual(row[field], expected)) fail(`${label} mismatch for ${item.model} ${item.id}.${field}`);
    }
  }
}

async function writeChanges(tx, changes, valueKey) {
  for (const item of groupChanges(changes, valueKey)) {
    await tx[item.model].update({ where: { id: item.id }, data: item.data });
  }
}

async function lockScopeAndAssertNoOpenAttempts(tx, courseIds) {
  await tx.$queryRaw(Prisma.sql`
    SELECT "id" FROM "Course"
    WHERE "id" IN (${Prisma.join(courseIds)})
    FOR UPDATE
  `);
  await tx.$queryRaw(Prisma.sql`
    SELECT "id" FROM "Enrollment"
    WHERE "courseId" IN (${Prisma.join(courseIds)})
    FOR UPDATE
  `);
  const openExamAttempts = await tx.examAttempt.count({
    where: { submittedAt: null, enrollment: { courseId: { in: courseIds } } },
  });
  if (openExamAttempts !== 0) {
    fail(`Apply transaction found ${openExamAttempts} open exam attempt(s).`);
  }
}

async function applyChanges(changes, courseIds) {
  await prisma.$transaction(async (tx) => {
    await lockScopeAndAssertNoOpenAttempts(tx, courseIds);
    await assertValues(tx, changes, 'before', 'Apply precondition');
    await writeChanges(tx, changes, 'after');
    await assertValues(tx, changes, 'after', 'Apply readback');
  });
}

async function courseIdsForTargets(targets) {
  const slugs = [...new Set([
    ...targets.moduleFields,
    ...targets.examQuestions,
    ...targets.quizQuestions,
  ].map((target) => target.slug))];
  const courses = await prisma.course.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  if (courses.length !== slugs.length) {
    const found = new Set(courses.map((course) => course.slug));
    fail(`Database course not found: ${slugs.filter((slug) => !found.has(slug)).join(', ')}`);
  }
  return new Map(courses.map((course) => [course.slug, course.id]));
}

async function buildPlan(targets) {
  const sources = loadSourceCourses();
  const courseIds = await courseIdsForTargets(targets);
  const changes = [];

  async function compareTarget(target, sourceItem, rows, definition, fields = definition.fields) {
    if (!sourceItem) fail(`Source ${target.kind} not found: ${target.key}`);
    if (rows.length !== 1) fail(`Expected exactly one database ${target.kind} for ${target.key}; found ${rows.length}`);
    const row = rows[0];
    if (target.kind !== 'module') {
      validateChoiceContract(target.kind, sourceItem, 'Source');
    }
    for (const field of fields) {
      const before = row[field] === undefined ? null : row[field];
      const after = sourceItem[field] === undefined ? null : sourceItem[field];
      validateValue(target.kind, field, before, 'Database', { allowEmpty: true });
      validateValue(target.kind, field, after, 'Source');
      if (!deepEqual(before, after)) {
        changes.push({
          kind: target.kind,
          model: definition.model,
          id: row.id,
          identity: target.key,
          course: target.slug,
          field,
          before,
          after,
        });
      }
    }
  }

  for (const target of targets.moduleFields) {
    const source = sources.get(target.slug);
    if (!source) fail(`Source course not found: ${target.slug}`);
    const rows = await prisma.courseModule.findMany({
      where: { courseId: courseIds.get(target.slug), order: target.order },
    });
    await compareTarget(target, source.modules.get(String(target.order)), rows, DEFINITIONS.module, [target.field]);
  }

  for (const target of targets.examQuestions) {
    const source = sources.get(target.slug);
    if (!source) fail(`Source course not found: ${target.slug}`);
    const rows = await prisma.examQuestion.findMany({
      where: { courseId: courseIds.get(target.slug), examType: target.examType, order: target.order },
    });
    await compareTarget(target, source.exams.get(`${target.examType}:${target.order}`), rows, DEFINITIONS.exam);
  }

  for (const target of targets.quizQuestions) {
    const source = sources.get(target.slug);
    if (!source) fail(`Source course not found: ${target.slug}`);
    const rows = await prisma.moduleQuizQuestion.findMany({
      where: { courseId: courseIds.get(target.slug), moduleOrder: target.moduleOrder, order: target.order },
    });
    await compareTarget(target, source.quizzes.get(`${target.moduleOrder}:${target.order}`), rows, DEFINITIONS.quiz);
  }

  return { changes, courseIds: [...courseIds.values()] };
}

async function safetyCounts(courseIds) {
  const enrollmentWhere = { courseId: { in: courseIds } };
  const [enrollments, openExamAttempts, examAttempts, quizAttempts, assignmentSubmissions] = await Promise.all([
    prisma.enrollment.count({ where: enrollmentWhere }),
    prisma.examAttempt.count({ where: { submittedAt: null, enrollment: enrollmentWhere } }),
    prisma.examAttempt.count({ where: { enrollment: enrollmentWhere } }),
    prisma.moduleQuizAttempt.count({ where: { enrollment: enrollmentWhere } }),
    prisma.assignmentSubmission.count({ where: { enrollment: enrollmentWhere } }),
  ]);
  return { enrollments, openExamAttempts, examAttempts, quizAttempts, assignmentSubmissions };
}

function perKindSummary(changes) {
  const summary = {};
  for (const kind of Object.keys(DEFINITIONS)) {
    const selected = changes.filter((change) => change.kind === kind);
    summary[kind] = {
      changedRows: new Set(selected.map((change) => change.id)).size,
      changedFields: selected.length,
    };
  }
  return summary;
}

function safeSummary(mode, database, targets, changes, counts, hash) {
  return {
    mode,
    database,
    targets: targetSummary(targets),
    changedRows: new Set(changes.map((change) => `${change.model}:${change.id}`)).size,
    changedFields: changes.length,
    changesByKind: perKindSummary(changes),
    safetyCounts: counts,
    planHash: hash,
  };
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.changes)) {
    fail('Unsupported snapshot format.');
  }
  if (!snapshot.targets || typeof snapshot.targets !== 'object') fail('Snapshot targets are missing.');
  const targetArrays = ['moduleFields', 'examQuestions', 'quizQuestions'];
  for (const key of targetArrays) {
    if (!Array.isArray(snapshot.targets[key])) fail(`Snapshot ${key} targets are missing.`);
    if (new Set(snapshot.targets[key]).size !== snapshot.targets[key].length) fail(`Snapshot ${key} targets must be unique.`);
  }
  const totalTargets = targetArrays.reduce((sum, key) => sum + snapshot.targets[key].length, 0);
  if (!totalTargets || totalTargets > MAX_TARGETS) fail('Snapshot target count is outside the allowed range.');
  if (!snapshot.changes.length) fail('Snapshot contains no changes.');

  const targetSets = Object.fromEntries(targetArrays.map((key) => [key, new Set(snapshot.targets[key])]));
  const seen = new Set();
  for (const change of snapshot.changes) {
    if (!change || typeof change !== 'object') fail('Snapshot contains an invalid change.');
    const definition = DEFINITIONS[change.kind];
    if (!definition || change.model !== definition.model) fail('Snapshot change model/kind is outside the allowlist.');
    if (!definition.fields.includes(change.field)) fail('Snapshot change field is outside the allowlist.');
    if (typeof change.id !== 'string' || !change.id || typeof change.course !== 'string') {
      fail('Snapshot change row identity is invalid.');
    }
    if (typeof change.identity !== 'string' || !targetSets[definition.targetKey].has(change.identity)) {
      fail('Snapshot change is outside its target list.');
    }
    if (change.kind === 'module') {
      const match = change.identity.match(/^([a-z0-9-]+):(\d+):(objectives|assignment)$/);
      if (!match || match[1] !== change.course || match[3] !== change.field) {
        fail('Snapshot module-field identity does not match its course and field.');
      }
    } else if (change.kind === 'exam') {
      const match = change.identity.match(/^([a-z0-9-]+):(midterm|final):(\d+)$/);
      if (!match || match[1] !== change.course) fail('Snapshot exam identity does not match its course.');
    } else {
      const match = change.identity.match(/^([a-z0-9-]+):(\d+):(\d+)$/);
      if (!match || match[1] !== change.course) fail('Snapshot quiz identity does not match its course.');
    }
    validateValue(change.kind, change.field, change.before, 'Snapshot before');
    validateValue(change.kind, change.field, change.after, 'Snapshot after');
    const key = `${change.model}:${change.id}:${change.field}`;
    if (seen.has(key)) fail('Snapshot contains a duplicate row-field change.');
    seen.add(key);
  }
  if (planHash(snapshot.changes) !== snapshot.planHash) fail('Snapshot contents do not match its plan hash.');
}

async function rollback(snapshotPath, expectedHash) {
  if (!expectedHash) fail('Rollback requires --expect-plan-hash=<sha256>.');
  const absolute = path.resolve(snapshotPath);
  const snapshot = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  validateSnapshot(snapshot);
  if (snapshot.planHash !== expectedHash) fail('Snapshot plan hash does not match --expect-plan-hash.');
  if (!deepEqual(snapshot.database, databaseIdentity())) fail('Snapshot database identity does not match the current target.');

  await prisma.$transaction(async (tx) => {
    await assertValues(tx, snapshot.changes, 'after', 'Rollback precondition');
    await writeChanges(tx, snapshot.changes, 'before');
    await assertValues(tx, snapshot.changes, 'before', 'Rollback readback');
  });

  console.log(JSON.stringify({
    mode: 'rollback',
    database: snapshot.database,
    changedRows: new Set(snapshot.changes.map((change) => `${change.model}:${change.id}`)).size,
    changedFields: snapshot.changes.length,
    planHash: snapshot.planHash,
    snapshot: absolute,
    readback: 'passed',
  }, null, 2));
}

async function main() {
  validateArguments();
  const rollbackPath = argValues('--rollback');
  const expectedHash = argValues('--expect-plan-hash');
  if (rollbackPath) {
    const forbidden = [
      '--apply',
      '--confirm-no-active-learners',
      '--allow-existing-enrollments',
    ].some(hasFlag) || [
      '--module-fields',
      '--exam-questions',
      '--quiz-questions',
      '--plan-output',
      '--snapshot',
    ].some((name) => Boolean(argValues(name)));
    if (forbidden) fail('Rollback accepts only --rollback and --expect-plan-hash.');
    await rollback(rollbackPath, expectedHash);
    return;
  }

  const apply = hasFlag('--apply');
  const targets = parseTargets();
  const { changes, courseIds } = await buildPlan(targets);
  const counts = await safetyCounts(courseIds);
  const hash = planHash(changes);
  const database = databaseIdentity();
  const summary = safeSummary(apply ? 'apply' : 'dry-run', database, targets, changes, counts, hash);

  if (!apply) {
    const planOutputArg = argValues('--plan-output');
    let planOutput;
    if (planOutputArg) {
      planOutput = writePrivateJson(planOutputArg, {
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        database,
        targets: summary.targets,
        safetyCounts: counts,
        planHash: hash,
        changes,
      });
    }
    console.log(JSON.stringify({ ...summary, ...(planOutput ? { planOutput } : {}) }, null, 2));
    return;
  }

  if (argValues('--plan-output')) fail('--plan-output is for dry-run only.');
  if (!changes.length) fail('Refusing apply because the reviewed plan has no changes.');
  if (!expectedHash || expectedHash !== hash) fail('Apply requires --expect-plan-hash matching the current dry-run plan.');
  if (!hasFlag('--confirm-no-active-learners')) fail('Apply requires --confirm-no-active-learners.');
  if (counts.openExamAttempts !== 0) fail(`Refusing apply with ${counts.openExamAttempts} open exam attempt(s).`);
  if (counts.enrollments > 0 && !hasFlag('--allow-existing-enrollments')) {
    fail(`Refusing apply with ${counts.enrollments} existing enrollment(s) unless --allow-existing-enrollments is provided.`);
  }
  const snapshotArg = argValues('--snapshot');
  if (!snapshotArg) fail('Apply requires --snapshot=/path/to/new-snapshot.json.');
  const snapshot = writePrivateJson(snapshotArg, {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    database,
    targets: summary.targets,
    safetyCounts: counts,
    planHash: hash,
    changes,
  });
  await applyChanges(changes, courseIds);
  console.log(JSON.stringify({ ...summary, snapshot, readback: 'passed' }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
