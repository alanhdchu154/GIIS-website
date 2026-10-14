#!/usr/bin/env node
/**
 * Dry-run-first, insert-only sync for the two explicitly approved Module 12 rows.
 * The plan hash binds source, database course identity, and module payload.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Prisma, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const MAX_TARGETS = 5;
const ALLOWED_TARGETS = new Set([
  'media-psychology:12',
  'personal-finance-applied-economics:12',
]);
const FIELDS = [
  'title', 'titleZh', 'objectives', 'readingUrl', 'readingNote', 'videoUrl',
  'videoNote', 'video2Url', 'video2Note', 'practiceUrl', 'practiceNote',
  'assignment', 'estimatedHrs',
];

function fail(message) { throw new Error(message); }
function flag(name) { return process.argv.includes(name); }
function arg(name) {
  const prefix = `${name}=`;
  const matches = process.argv.filter((value) => value.startsWith(prefix));
  if (matches.length > 1) fail(`Argument may appear only once: ${name}`);
  return matches[0]?.slice(prefix.length) || '';
}

function validateArgs() {
  const exact = new Set([
    '--apply', '--confirm-no-active-learners', '--allow-existing-enrollments',
  ]);
  const prefixes = [
    '--modules=', '--plan-output=', '--expect-plan-hash=', '--snapshot=', '--rollback=',
  ];
  for (const value of process.argv.slice(2)) {
    if (!exact.has(value) && !prefixes.some((prefix) => value.startsWith(prefix))) {
      fail(`Unknown argument: ${value}`);
    }
  }
}

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('._')) output.push(file);
  }
  return output;
}

function sources() {
  const output = new Map();
  for (const file of walk(COURSE_DIR)) {
    const raw = fs.readFileSync(file);
    const course = JSON.parse(raw);
    if (!course.slug) fail(`Course source missing slug: ${file}`);
    if (output.has(course.slug)) fail(`Duplicate source slug: ${course.slug}`);
    const modules = new Map();
    for (const module of course.modules || []) {
      const order = Number(module.order);
      if (modules.has(order)) fail(`Duplicate module ${course.slug}:${order}`);
      modules.set(order, module);
    }
    output.set(course.slug, {
      modules,
      sourceHash: crypto.createHash('sha256').update(raw).digest('hex'),
    });
  }
  return output;
}

function parseTargetKeys(keys) {
  const output = keys.map((key) => {
    const match = key.match(/^([a-z0-9-]+):(\d+)$/);
    if (!match || !ALLOWED_TARGETS.has(key)) {
      fail(`Target is not allowlisted for this updater: ${key}`);
    }
    return { key, slug: match[1], order: Number(match[2]) };
  });
  if (!output.length || output.length > MAX_TARGETS) {
    fail(`Target count must be 1-${MAX_TARGETS}.`);
  }
  if (new Set(output.map((target) => target.key)).size !== output.length) {
    fail('Targets must be unique.');
  }
  return output.sort((a, b) => a.key.localeCompare(b.key));
}

function targets() {
  const raw = arg('--modules');
  if (!raw) fail('--modules is required.');
  return parseTargetKeys(raw.split(',').filter(Boolean));
}

function dataOf(module, id) {
  if (!module) fail('Source module missing.');
  const data = { id, order: Number(module.order) };
  for (const field of FIELDS) {
    data[field] = field === 'estimatedHrs'
      ? String(module[field] ?? 3)
      : String(module[field] ?? '');
  }
  if (!data.title || !data.objectives || !data.assignment) {
    fail('Source module requires title, objectives, and assignment.');
  }
  if (!Number.isFinite(Number(data.estimatedHrs))) fail('Source module estimatedHrs is invalid.');
  return data;
}

function equal(row, data) {
  return row.id === data.id
    && row.order === data.order
    && FIELDS.every((field) => (
      field === 'estimatedHrs'
        ? Number(row[field]) === Number(data[field])
        : String(row[field] ?? '') === data[field]
    ));
}

function dbIdentity() {
  try {
    const url = new URL(process.env.DATABASE_URL || '');
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

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function privateJson(file, payload) {
  const absolute = path.resolve(file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`, {
    flag: 'wx', mode: 0o600,
  });
  return absolute;
}

async function courseMap(client, selectedTargets) {
  const slugs = [...new Set(selectedTargets.map((target) => target.slug))];
  const rows = await client.course.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' },
  });
  if (rows.length !== slugs.length) {
    const found = new Set(rows.map((row) => row.slug));
    fail(`Database course missing: ${slugs.filter((slug) => !found.has(slug)).join(',')}`);
  }
  return new Map(rows.map((row) => [row.slug, row.id]));
}

function deterministicId(target, sourceHash, sourceModule) {
  return `cma_${crypto.createHash('sha256')
    .update(`giis-module-addition-v1:${target.key}:${sourceHash}:${JSON.stringify(sourceModule)}`)
    .digest('hex').slice(0, 24)}`;
}

async function build(client, selectedTargets) {
  const sourceCourses = sources();
  const courses = await courseMap(client, selectedTargets);
  const plannedItems = [];
  const additions = [];
  const alreadyPresent = [];

  for (const target of selectedTargets) {
    const sourceCourse = sourceCourses.get(target.slug);
    const sourceModule = sourceCourse?.modules.get(target.order);
    if (!sourceModule) fail(`Source module not found: ${target.key}`);
    if (!sourceCourse.sourceHash) fail(`Missing source provenance: ${target.key}`);
    const courseId = courses.get(target.slug);
    const rows = await client.courseModule.findMany({
      where: { courseId, order: target.order },
    });
    if (rows.length > 1) {
      fail(`Expected at most one database module for ${target.key}; found ${rows.length}`);
    }
    const id = rows[0]?.id || deterministicId(target, sourceCourse.sourceHash, sourceModule);
    const data = dataOf(sourceModule, id);
    const item = {
      id, identity: target.key, course: target.slug, courseId,
      order: target.order, sourceHash: sourceCourse.sourceHash, data,
    };
    if (rows.length) {
      if (!equal(rows[0], data)) fail(`Database module exists with different content: ${target.key}`);
      alreadyPresent.push(item);
    } else additions.push(item);
    plannedItems.push(item);
  }
  return {
    plannedItems, additions, alreadyPresent, courseIds: [...courses.values()].sort(),
  };
}

async function counts(client, courseIds) {
  const enrollmentWhere = { courseId: { in: courseIds } };
  const [
    enrollments, openExamAttempts, examAttempts, quizAttempts,
    assignmentSubmissions, moduleProgresses,
  ] = await Promise.all([
    client.enrollment.count({ where: enrollmentWhere }),
    client.examAttempt.count({ where: { submittedAt: null, enrollment: enrollmentWhere } }),
    client.examAttempt.count({ where: { enrollment: enrollmentWhere } }),
    client.moduleQuizAttempt.count({ where: { enrollment: enrollmentWhere } }),
    client.assignmentSubmission.count({ where: { enrollment: enrollmentWhere } }),
    client.moduleProgress.count({ where: { enrollment: enrollmentWhere } }),
  ]);
  return {
    enrollments, openExamAttempts, examAttempts, quizAttempts,
    assignmentSubmissions, moduleProgresses,
  };
}

async function historyDigest(client, courseIds) {
  const rows = await client.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { id: 'asc' },
    include: {
      examAttempts: { orderBy: { id: 'asc' } },
      quizAttempts: { orderBy: { id: 'asc' } },
      assignments: { orderBy: { id: 'asc' } },
      moduleProgresses: { orderBy: { id: 'asc' } },
    },
  });
  return hash(rows);
}

async function lock(client, courseIds, allowExistingEnrollments) {
  await client.$queryRaw(Prisma.sql`
    SELECT "id" FROM "Course" WHERE "id" IN (${Prisma.join(courseIds)}) FOR UPDATE
  `);
  await client.$queryRaw(Prisma.sql`
    SELECT "id" FROM "Enrollment" WHERE "courseId" IN (${Prisma.join(courseIds)}) FOR UPDATE
  `);
  const enrollmentCount = await client.enrollment.count({
    where: { courseId: { in: courseIds } },
  });
  if (enrollmentCount && !allowExistingEnrollments) {
    fail(`Apply transaction found ${enrollmentCount} existing enrollment(s) without override.`);
  }
  const openAttemptCount = await client.examAttempt.count({
    where: { submittedAt: null, enrollment: { courseId: { in: courseIds } } },
  });
  if (openAttemptCount) fail(`Apply transaction found ${openAttemptCount} open exam attempt(s).`);
}

async function verifyPlanned(client, plannedItems) {
  for (const item of plannedItems) {
    const rows = await client.courseModule.findMany({
      where: { courseId: item.courseId, order: item.order },
    });
    if (rows.length !== 1 || !equal(rows[0], item.data)) {
      fail(`Apply readback mismatch: ${item.identity}`);
    }
  }
}

async function apply(plannedItems, additions, courseIds, allowExistingEnrollments) {
  return prisma.$transaction(async (tx) => {
    await lock(tx, courseIds, allowExistingEnrollments);
    const beforeDigest = await historyDigest(tx, courseIds);
    for (const item of additions) {
      const count = await tx.courseModule.count({
        where: { courseId: item.courseId, order: item.order },
      });
      if (count !== 0) fail(`Apply precondition found module: ${item.identity}`);
      await tx.courseModule.create({ data: { ...item.data, courseId: item.courseId } });
    }
    await verifyPlanned(tx, plannedItems);
    const afterDigest = await historyDigest(tx, courseIds);
    if (beforeDigest !== afterDigest) fail('Learner history changed during apply.');
    return { beforeDigest, afterDigest };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

function validateItem(item) {
  if (
    !item || !item.id || !ALLOWED_TARGETS.has(item.identity) || !item.courseId
    || item.course !== item.identity.split(':')[0]
    || Number(item.order) !== Number(item.identity.split(':')[1])
    || !item.data || !String(item.sourceHash || '').match(/^[a-f0-9]{64}$/)
  ) fail('Invalid snapshot item.');
  const normalized = dataOf(item.data, item.id);
  if (!equal(normalized, item.data)) fail('Invalid snapshot item payload.');
}

function validateSnapshot(snapshot) {
  if (
    !snapshot || snapshot.schemaVersion !== 3
    || !['authorized', 'zero-delta'].includes(snapshot.status)
    || !Array.isArray(snapshot.plannedItems) || !snapshot.plannedItems.length
    || snapshot.plannedItems.length > MAX_TARGETS || !Array.isArray(snapshot.additions)
  ) fail('Unsupported or unauthorized snapshot.');
  for (const item of snapshot.plannedItems) validateItem(item);
  for (const item of snapshot.additions) validateItem(item);
  if (new Set(snapshot.plannedItems.map((item) => item.identity)).size !== snapshot.plannedItems.length) {
    fail('Snapshot contains duplicate planned identities.');
  }
  const byIdentity = new Map(snapshot.plannedItems.map((item) => [item.identity, item]));
  for (const addition of snapshot.additions) {
    if (JSON.stringify(byIdentity.get(addition.identity)) !== JSON.stringify(addition)) {
      fail('Snapshot addition is not an exact planned item.');
    }
  }
  if (hash(snapshot.plannedItems) !== snapshot.planHash) fail('Snapshot hash mismatch.');
  if (snapshot.status === 'authorized' && !snapshot.additions.length) {
    fail('Authorized snapshot requires at least one addition.');
  }
  if (snapshot.status === 'zero-delta' && snapshot.additions.length) {
    fail('Zero-delta snapshot cannot contain additions.');
  }
}

async function validateCurrentSource(snapshot) {
  const selectedTargets = parseTargetKeys(snapshot.targets);
  const current = await build(prisma, selectedTargets);
  if (
    hash(current.plannedItems) !== snapshot.planHash
    || JSON.stringify(current.plannedItems) !== JSON.stringify(snapshot.plannedItems)
  ) fail('Current authoritative source or database identity differs from snapshot.');
}

async function rollback(file, expectedPlanHash) {
  if (!expectedPlanHash) fail('Rollback requires --expect-plan-hash.');
  const snapshot = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  validateSnapshot(snapshot);
  if (snapshot.status !== 'authorized') fail('Zero-delta snapshot has nothing to roll back.');
  if (snapshot.planHash !== expectedPlanHash) fail('Snapshot hash does not match expected hash.');
  if (JSON.stringify(snapshot.database) !== JSON.stringify(dbIdentity())) {
    fail('Snapshot database mismatch.');
  }
  await validateCurrentSource(snapshot);
  const courseIds = [...new Set(snapshot.additions.map((item) => item.courseId))].sort();
  const moduleIds = snapshot.additions.map((item) => item.id);
  const history = await prisma.$transaction(async (tx) => {
    await lock(tx, courseIds, true);
    const beforeDigest = await historyDigest(tx, courseIds);
    await tx.$queryRaw(Prisma.sql`
      SELECT "id" FROM "CourseModule" WHERE "id" IN (${Prisma.join(moduleIds)}) FOR UPDATE
    `);
    await tx.$queryRaw(Prisma.sql`
      SELECT mp."id" FROM "ModuleProgress" mp JOIN "Enrollment" e
      ON e."id"=mp."enrollmentId" WHERE e."courseId" IN (${Prisma.join(courseIds)})
      FOR UPDATE OF mp
    `);
    await tx.$queryRaw(Prisma.sql`
      SELECT mq."id" FROM "ModuleQuizQuestion" mq
      WHERE mq."courseId" IN (${Prisma.join(courseIds)}) FOR UPDATE
    `);
    await tx.$queryRaw(Prisma.sql`
      SELECT qa."id" FROM "ModuleQuizAttempt" qa JOIN "Enrollment" e
      ON e."id"=qa."enrollmentId" WHERE e."courseId" IN (${Prisma.join(courseIds)})
      FOR UPDATE OF qa
    `);
    await tx.$queryRaw(Prisma.sql`
      SELECT a."id" FROM "AssignmentSubmission" a JOIN "Enrollment" e
      ON e."id"=a."enrollmentId" WHERE e."courseId" IN (${Prisma.join(courseIds)})
      FOR UPDATE OF a
    `);
    for (const item of [...snapshot.additions].reverse()) {
      const [progress, quizQuestions, quizAttempts, submissions] = await Promise.all([
        tx.moduleProgress.count({
          where: { moduleOrder: item.order, enrollment: { courseId: item.courseId } },
        }),
        tx.moduleQuizQuestion.count({
          where: { courseId: item.courseId, moduleOrder: item.order },
        }),
        tx.moduleQuizAttempt.count({
          where: { moduleOrder: item.order, enrollment: { courseId: item.courseId } },
        }),
        tx.assignmentSubmission.count({
          where: { moduleOrder: item.order, enrollment: { courseId: item.courseId } },
        }),
      ]);
      if (progress || quizQuestions || quizAttempts || submissions) {
        fail(`Rollback refused for ${item.identity}: dependent rows exist.`);
      }
      const row = await tx.courseModule.findUnique({ where: { id: item.id } });
      if (!row || row.courseId !== item.courseId || !equal(row, item.data)) {
        fail(`Rollback precondition mismatch: ${item.identity}`);
      }
      await tx.courseModule.delete({ where: { id: item.id } });
      if (await tx.courseModule.findUnique({ where: { id: item.id } })) {
        fail(`Rollback readback found row: ${item.identity}`);
      }
    }
    const afterDigest = await historyDigest(tx, courseIds);
    if (beforeDigest !== afterDigest) fail('Learner history changed during rollback.');
    return { beforeDigest, afterDigest };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  console.log(JSON.stringify({
    mode: 'rollback', deletedRows: snapshot.additions.length,
    planHash: snapshot.planHash, learnerHistoryDigest: history.afterDigest,
    readback: 'passed',
  }, null, 2));
}

async function main() {
  validateArgs();
  const rollbackFile = arg('--rollback');
  const expectedPlanHash = arg('--expect-plan-hash');
  if (rollbackFile) {
    if (
      flag('--apply') || flag('--confirm-no-active-learners')
      || flag('--allow-existing-enrollments')
      || ['--modules', '--plan-output', '--snapshot'].some((name) => arg(name))
    ) fail('Rollback accepts only rollback and expected hash.');
    return rollback(rollbackFile, expectedPlanHash);
  }

  const selectedTargets = targets();
  const { plannedItems, additions, alreadyPresent, courseIds } = await build(
    prisma, selectedTargets,
  );
  const safetyCounts = await counts(prisma, courseIds);
  const planHash = hash(plannedItems);
  const database = dbIdentity();
  const isApply = flag('--apply');
  const summary = {
    mode: isApply ? 'apply' : 'dry-run', database,
    targets: selectedTargets.map((target) => target.key),
    additions: additions.length, alreadyPresent: alreadyPresent.length,
    safetyCounts, planHash,
  };
  if (!isApply) {
    const output = arg('--plan-output');
    const planOutput = output ? privateJson(output, {
      schemaVersion: 2, status: 'dry-run', createdAt: new Date().toISOString(),
      database, targets: summary.targets, safetyCounts, planHash,
      plannedItems, additions, alreadyPresent,
    }) : undefined;
    console.log(JSON.stringify({ ...summary, ...(planOutput ? { planOutput } : {}) }, null, 2));
    return;
  }
  if (arg('--plan-output')) fail('--plan-output is dry-run only.');
  if (!expectedPlanHash || expectedPlanHash !== planHash) {
    fail('Apply requires matching --expect-plan-hash.');
  }
  if (!flag('--confirm-no-active-learners')) {
    fail('Apply requires --confirm-no-active-learners.');
  }
  if (safetyCounts.openExamAttempts) fail('Open exam attempts block apply.');
  if (safetyCounts.enrollments && !flag('--allow-existing-enrollments')) {
    fail('Existing enrollments require override.');
  }
  const snapshotFile = arg('--snapshot');
  if (!snapshotFile) fail('Apply requires --snapshot.');
  const status = additions.length ? 'authorized' : 'zero-delta';
  const snapshot = privateJson(snapshotFile, {
    schemaVersion: 3, status, createdAt: new Date().toISOString(), database,
    targets: summary.targets, safetyCounts, planHash,
    plannedItems, additions, alreadyPresent,
  });
  const history = await apply(
    plannedItems, additions, courseIds, flag('--allow-existing-enrollments'),
  );
  console.log(JSON.stringify({
    ...summary, status, snapshot,
    learnerHistoryDigest: history.afterDigest, readback: 'passed',
  }, null, 2));
}

main()
  .catch((error) => { console.error(error.message || error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
