#!/usr/bin/env node

/**
 * Dry-run-first, insert-only sync for explicitly selected module quiz questions.
 *
 * Answer-bearing plans and rollback snapshots are written only to new files
 * with mode 0600. Stdout contains identities and counts, never question text,
 * options, answers, or explanations.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Prisma, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(REPO_ROOT, 'server', 'prisma', 'courses');
const MAX_TARGETS = 20;
const FIELDS = ['question', 'options', 'answer', 'explanation', 'points'];

function fail(message) {
  throw new Error(message);
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function argValue(name) {
  const prefix = `${name}=`;
  const matches = process.argv.filter((arg) => arg.startsWith(prefix));
  if (matches.length > 1) fail(`Argument may appear only once: ${name}`);
  return matches.length ? matches[0].slice(prefix.length) : '';
}

function validateArguments() {
  const exact = new Set(['--apply', '--confirm-no-active-learners', '--allow-existing-enrollments']);
  const prefixes = ['--quiz-questions=', '--plan-output=', '--expect-plan-hash=', '--snapshot=', '--rollback='];
  for (const arg of process.argv.slice(2)) {
    if (!exact.has(arg) && !prefixes.some((prefix) => arg.startsWith(prefix))) fail(`Unknown argument: ${arg}`);
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

function loadSources() {
  const courses = new Map();
  for (const file of walkJson(COURSE_DIR)) {
    const course = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!course.slug) fail(`Course source missing slug: ${file}`);
    if (courses.has(course.slug)) fail(`Duplicate course source slug: ${course.slug}`);
    const quizzes = new Map();
    for (const item of course.quizQuestions || []) {
      const key = `${Number(item.moduleOrder)}:${Number(item.order)}`;
      if (quizzes.has(key)) fail(`Duplicate quiz identity ${course.slug}:${key}`);
      quizzes.set(key, item);
    }
    courses.set(course.slug, quizzes);
  }
  return courses;
}

function parseTargets() {
  const raw = argValue('--quiz-questions');
  if (!raw) fail('--quiz-questions is required.');
  const targets = raw.split(',').filter(Boolean).map((token) => {
    const match = token.match(/^([a-z0-9-]+):(\d+):(\d+)$/);
    if (!match) fail(`Invalid quiz target: ${token}`);
    return { key: token, slug: match[1], moduleOrder: Number(match[2]), order: Number(match[3]) };
  });
  if (!targets.length || targets.length > MAX_TARGETS) fail(`Target count must be between 1 and ${MAX_TARGETS}.`);
  if (new Set(targets.map((target) => target.key)).size !== targets.length) fail('Quiz targets must be unique.');
  return targets;
}

function validateSource(item, identity) {
  if (!item) fail(`Source quiz question not found: ${identity}`);
  if (!Array.isArray(item.options) || item.options.length !== 4) fail(`Source ${identity} must have four options.`);
  if (item.options.some((option) => typeof option !== 'string' || !option.trim())) fail(`Source ${identity} has an invalid option.`);
  const normalized = item.options.map((option) => option.trim().toLowerCase());
  if (new Set(normalized).size !== 4) fail(`Source ${identity} options must be distinct.`);
  if (typeof item.answer !== 'string' || !normalized.includes(item.answer.trim().toLowerCase())) {
    fail(`Source ${identity} answer must match one option.`);
  }
  for (const field of ['question', 'explanation']) {
    if (typeof item[field] !== 'string' || !item[field].trim()) fail(`Source ${identity} ${field} must be non-empty.`);
  }
  if (!Number.isInteger(item.points) || item.points < 1) fail(`Source ${identity} points must be a positive integer.`);
}

function sourceData(item) {
  return Object.fromEntries(FIELDS.map((field) => [field, item[field]]));
}

function equalData(row, data) {
  return FIELDS.every((field) => JSON.stringify(row[field]) === JSON.stringify(data[field]));
}

function databaseIdentity() {
  try {
    const url = new URL(process.env.DATABASE_URL || '');
    return { protocol: url.protocol, host: url.hostname, port: url.port || 'default', database: url.pathname.replace(/^\//, '') };
  } catch {
    return { protocol: 'unknown', host: 'unknown', port: 'unknown', database: 'unknown' };
  }
}

function planHash(plan) {
  return crypto.createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}

function writePrivateJson(filePath, payload) {
  const absolute = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  return absolute;
}

async function courseMap(targets) {
  const slugs = [...new Set(targets.map((target) => target.slug))];
  const rows = await prisma.course.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  if (rows.length !== slugs.length) {
    const found = new Set(rows.map((row) => row.slug));
    fail(`Database course not found: ${slugs.filter((slug) => !found.has(slug)).join(', ')}`);
  }
  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function buildPlan(targets) {
  const sources = loadSources();
  const courses = await courseMap(targets);
  const additions = [];
  const alreadyPresent = [];
  for (const target of targets) {
    const source = sources.get(target.slug)?.get(`${target.moduleOrder}:${target.order}`);
    validateSource(source, target.key);
    const data = sourceData(source);
    const rows = await prisma.moduleQuizQuestion.findMany({
      where: { courseId: courses.get(target.slug), moduleOrder: target.moduleOrder, order: target.order },
    });
    if (rows.length > 1) fail(`Expected at most one database quiz row for ${target.key}; found ${rows.length}`);
    if (rows.length === 1) {
      if (!equalData(rows[0], data)) fail(`Database quiz identity already exists with different content: ${target.key}`);
      alreadyPresent.push(target.key);
    } else {
      const id = `mqa_${crypto.createHash('sha256')
        .update(`giis-quiz-addition-v1:${target.key}:${JSON.stringify(data)}`)
        .digest('hex').slice(0, 24)}`;
      additions.push({ id, identity: target.key, course: target.slug, courseId: courses.get(target.slug), moduleOrder: target.moduleOrder, order: target.order, data });
    }
  }
  return { additions, alreadyPresent, courseIds: [...courses.values()] };
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

async function lockScope(tx, courseIds, allowExistingEnrollments) {
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Course" WHERE "id" IN (${Prisma.join(courseIds)}) FOR UPDATE`);
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Enrollment" WHERE "courseId" IN (${Prisma.join(courseIds)}) FOR UPDATE`);
  const enrollments = await tx.enrollment.count({ where: { courseId: { in: courseIds } } });
  if (enrollments !== 0 && !allowExistingEnrollments) {
    fail(`Apply transaction found ${enrollments} existing enrollment(s) without override.`);
  }
  const openExamAttempts = await tx.examAttempt.count({
    where: { submittedAt: null, enrollment: { courseId: { in: courseIds } } },
  });
  if (openExamAttempts !== 0) fail(`Apply transaction found ${openExamAttempts} open exam attempt(s).`);
}

async function applyAdditions(additions, courseIds, allowExistingEnrollments) {
  await prisma.$transaction(async (tx) => {
    await lockScope(tx, courseIds, allowExistingEnrollments);
    for (const item of additions) {
      const existing = await tx.moduleQuizQuestion.findMany({
        where: { courseId: item.courseId, moduleOrder: item.moduleOrder, order: item.order },
      });
      if (existing.length !== 0) fail(`Apply precondition expected no database row for ${item.identity}.`);
      const created = await tx.moduleQuizQuestion.create({
        data: { id: item.id, courseId: item.courseId, moduleOrder: item.moduleOrder, order: item.order, ...item.data },
      });
      const readback = await tx.moduleQuizQuestion.findUnique({
        where: { courseId_moduleOrder_order: { courseId: item.courseId, moduleOrder: item.moduleOrder, order: item.order } },
      });
      if (!readback || created.id !== item.id || readback.id !== item.id || !equalData(readback, item.data)) {
        fail(`Apply readback mismatch for ${item.identity}.`);
      }
    }
  });
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 2 || snapshot.status !== 'authorized' || !Array.isArray(snapshot.additions)) {
    fail('Unsupported or unapplied snapshot format.');
  }
  if (!snapshot.additions.length || snapshot.additions.length > MAX_TARGETS) fail('Snapshot addition count is outside the allowed range.');
  for (const item of snapshot.additions) {
    if (!item.identity?.match(/^[a-z0-9-]+:\d+:\d+$/) || !item.courseId || !item.id || !item.data) fail('Snapshot item is invalid.');
    validateSource(item.data, item.identity);
  }
  if (planHash(snapshot.additions) !== snapshot.planHash) fail('Snapshot contents do not match its plan hash.');
}

async function rollback(snapshotPath, expectedHash) {
  if (!expectedHash) fail('Rollback requires --expect-plan-hash=<sha256>.');
  const absolute = path.resolve(snapshotPath);
  const snapshot = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  validateSnapshot(snapshot);
  if (snapshot.planHash !== expectedHash) fail('Snapshot plan hash does not match --expect-plan-hash.');
  if (JSON.stringify(snapshot.database) !== JSON.stringify(databaseIdentity())) fail('Snapshot database identity does not match current target.');
  const courseIds = [...new Set(snapshot.additions.map((item) => item.courseId))];
  await prisma.$transaction(async (tx) => {
    await lockScope(tx, courseIds, true);
    for (const item of snapshot.additions) {
      const attempts = await tx.moduleQuizAttempt.count({
        where: { moduleOrder: item.moduleOrder, enrollment: { courseId: item.courseId } },
      });
      if (attempts !== 0) fail(`Rollback refused because ${item.identity} module has quiz attempt history.`);
      const row = await tx.moduleQuizQuestion.findUnique({ where: { id: item.id } });
      if (!row || !equalData(row, item.data)) fail(`Rollback precondition mismatch for ${item.identity}.`);
      if (row.courseId !== item.courseId || row.moduleOrder !== item.moduleOrder || row.order !== item.order) {
        fail(`Rollback identity mismatch for ${item.identity}.`);
      }
      await tx.moduleQuizQuestion.delete({ where: { id: row.id } });
      const deleted = await tx.moduleQuizQuestion.findUnique({ where: { id: item.id } });
      if (deleted !== null) fail(`Rollback readback found undeleted row for ${item.identity}.`);
    }
  });
  console.log(JSON.stringify({ mode: 'rollback', deletedRows: snapshot.additions.length, planHash: snapshot.planHash, readback: 'passed' }, null, 2));
}

async function main() {
  validateArguments();
  const rollbackPath = argValue('--rollback');
  const expectedHash = argValue('--expect-plan-hash');
  if (rollbackPath) {
    const forbidden = hasFlag('--apply') || hasFlag('--confirm-no-active-learners') || hasFlag('--allow-existing-enrollments') ||
      ['--quiz-questions', '--plan-output', '--snapshot'].some((name) => Boolean(argValue(name)));
    if (forbidden) fail('Rollback accepts only --rollback and --expect-plan-hash.');
    await rollback(rollbackPath, expectedHash);
    return;
  }

  const targets = parseTargets();
  const { additions, alreadyPresent, courseIds } = await buildPlan(targets);
  const counts = await safetyCounts(courseIds);
  const hash = planHash(additions);
  const database = databaseIdentity();
  const apply = hasFlag('--apply');
  const summary = {
    mode: apply ? 'apply' : 'dry-run', database, targets: targets.map((target) => target.key),
    additions: additions.length, alreadyPresent: alreadyPresent.length, safetyCounts: counts, planHash: hash,
  };

  if (!apply) {
    const outputArg = argValue('--plan-output');
    const planOutput = outputArg ? writePrivateJson(outputArg, {
      schemaVersion: 1, status: 'dry-run', createdAt: new Date().toISOString(), database, targets: summary.targets,
      safetyCounts: counts, planHash: hash, additions,
    }) : undefined;
    console.log(JSON.stringify({ ...summary, ...(planOutput ? { planOutput } : {}) }, null, 2));
    return;
  }

  if (argValue('--plan-output')) fail('--plan-output is for dry-run only.');
  if (!additions.length) fail('Refusing apply because the reviewed plan has no additions.');
  if (!expectedHash || expectedHash !== hash) fail('Apply requires --expect-plan-hash matching the current dry-run plan.');
  if (!hasFlag('--confirm-no-active-learners')) fail('Apply requires --confirm-no-active-learners.');
  if (counts.openExamAttempts !== 0) fail(`Refusing apply with ${counts.openExamAttempts} open exam attempt(s).`);
  if (counts.enrollments > 0 && !hasFlag('--allow-existing-enrollments')) {
    fail(`Refusing apply with ${counts.enrollments} existing enrollment(s) unless --allow-existing-enrollments is provided.`);
  }
  const snapshotArg = argValue('--snapshot');
  if (!snapshotArg) fail('Apply requires --snapshot=/path/to/new-snapshot.json.');
  const snapshot = writePrivateJson(snapshotArg, {
    schemaVersion: 2, status: 'authorized', createdAt: new Date().toISOString(), database, targets: summary.targets,
    safetyCounts: counts, planHash: hash, additions,
  });
  await applyAdditions(additions, courseIds, hasFlag('--allow-existing-enrollments'));
  console.log(JSON.stringify({ ...summary, snapshot, readback: 'passed' }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
