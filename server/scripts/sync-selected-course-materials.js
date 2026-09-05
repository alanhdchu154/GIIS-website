#!/usr/bin/env node

/**
 * Dry-run-first, update-only sync for a small allowlist of course modules.
 *
 * This script never creates/deletes rows and never touches enrollments, grades,
 * attempts, publication flags, question banks, or course-level metadata.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(REPO_ROOT, 'server', 'prisma', 'courses');
const MAX_TARGETS = 20;
const ALLOWED_FIELDS = new Set([
  'readingUrl',
  'readingNote',
  'videoUrl',
  'videoNote',
  'video2Url',
  'video2Note',
  'practiceUrl',
  'practiceNote',
]);

function argValue(name) {
  const prefix = `${name}=`;
  const entry = process.argv.find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : '';
}

function fail(message) {
  throw new Error(message);
}

function walkJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(full, out);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('._')) out.push(full);
  }
  return out;
}

function loadSourceCourses() {
  const courses = new Map();
  for (const file of walkJson(COURSE_DIR)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.slug) fail(`Course source missing slug: ${file}`);
    courses.set(data.slug, {
      file: path.relative(REPO_ROOT, file),
      modules: new Map((data.modules || []).map((module) => [Number(module.order), module])),
    });
  }
  return courses;
}

function parseTargets(raw) {
  if (!raw) fail('Required: --targets=course-slug:module-order[,course-slug:module-order]');
  const targets = raw.split(',').filter(Boolean).map((token) => {
    const match = token.match(/^([a-z0-9-]+):(\d+)$/);
    if (!match) fail(`Invalid target: ${token}`);
    return { slug: match[1], order: Number(match[2]), key: token };
  });
  if (!targets.length) fail('At least one target is required.');
  if (targets.length > MAX_TARGETS) fail(`Refusing more than ${MAX_TARGETS} targets in one run.`);
  if (new Set(targets.map((target) => target.key)).size !== targets.length) fail('Targets must be unique.');
  return targets;
}

function parseFields(raw) {
  if (!raw) fail('Required: --fields=field[,field]');
  const fields = raw.split(',').filter(Boolean);
  if (!fields.length) fail('At least one field is required.');
  for (const field of fields) {
    if (!ALLOWED_FIELDS.has(field)) fail(`Field is not allowlisted: ${field}`);
  }
  if (new Set(fields).size !== fields.length) fail('Fields must be unique.');
  return fields;
}

function databaseIdentity() {
  const raw = process.env.DATABASE_URL || '';
  try {
    const url = new URL(raw);
    return { protocol: url.protocol, host: url.hostname, port: url.port || 'default', database: url.pathname.replace(/^\//, '') };
  } catch {
    return { protocol: 'unknown', host: 'unknown', port: 'unknown', database: 'unknown' };
  }
}

function planHash(changes) {
  const stable = changes.map(({ moduleId, course, order, field, before, after }) => ({ moduleId, course, order, field, before, after }));
  return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

function writeSnapshot(snapshotPath, snapshot) {
  const absolute = path.resolve(snapshotPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  return absolute;
}

function groupChanges(changes, valueKey) {
  const grouped = new Map();
  for (const change of changes) {
    if (!grouped.has(change.moduleId)) grouped.set(change.moduleId, { moduleId: change.moduleId, data: {} });
    grouped.get(change.moduleId).data[change.field] = change[valueKey];
  }
  return [...grouped.values()];
}

async function assertValues(tx, changes, valueKey, label) {
  for (const item of groupChanges(changes, valueKey)) {
    const readback = await tx.courseModule.findUnique({ where: { id: item.moduleId } });
    if (!readback) fail(`${label} missing module ${item.moduleId}`);
    for (const [field, expected] of Object.entries(item.data)) {
      if (String(readback[field] ?? '') !== String(expected ?? '')) {
        fail(`${label} mismatch for ${item.moduleId}.${field}`);
      }
    }
  }
}

async function applyChanges(changes) {
  const grouped = groupChanges(changes, 'after');
  await prisma.$transaction(async (tx) => {
    await assertValues(tx, changes, 'before', 'Apply precondition');
    for (const item of grouped) {
      await tx.courseModule.update({ where: { id: item.moduleId }, data: item.data });
    }
    await assertValues(tx, changes, 'after', 'Apply readback');
  });
}

function validateSnapshot(snapshot) {
  if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.changes)) fail('Unsupported snapshot format.');
  if (!Array.isArray(snapshot.targets) || !snapshot.targets.length || snapshot.targets.length > MAX_TARGETS) {
    fail('Snapshot targets are missing or outside the allowed limit.');
  }
  if (new Set(snapshot.targets).size !== snapshot.targets.length) fail('Snapshot targets must be unique.');
  if (!Array.isArray(snapshot.fields) || !snapshot.fields.length) fail('Snapshot fields are missing.');
  parseFields(snapshot.fields.join(','));

  const targets = new Set(snapshot.targets);
  const fields = new Set(snapshot.fields);
  const changeKeys = new Set();
  for (const change of snapshot.changes) {
    if (!change || typeof change !== 'object') fail('Snapshot contains an invalid change.');
    if (typeof change.course !== 'string' || !Number.isInteger(change.order) || typeof change.moduleId !== 'string') {
      fail('Snapshot change identity is invalid.');
    }
    if (!targets.has(`${change.course}:${change.order}`)) fail('Snapshot change is outside its target list.');
    if (!fields.has(change.field) || !ALLOWED_FIELDS.has(change.field)) fail('Snapshot change uses a field outside its allowlist.');
    if (typeof change.before !== 'string' || typeof change.after !== 'string') fail('Snapshot values must be strings.');
    const key = `${change.moduleId}:${change.field}`;
    if (changeKeys.has(key)) fail('Snapshot contains a duplicate module-field change.');
    changeKeys.add(key);
  }
  if (!snapshot.changes.length) fail('Snapshot contains no changes.');
  if (planHash(snapshot.changes) !== snapshot.planHash) fail('Snapshot contents do not match its plan hash.');
}

async function rollback(snapshotPath, expectedHash) {
  if (!expectedHash) fail('Rollback requires --expect-plan-hash=<sha256>.');
  const absolute = path.resolve(snapshotPath);
  const snapshot = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  validateSnapshot(snapshot);
  if (snapshot.planHash !== expectedHash) fail('Snapshot plan hash does not match --expect-plan-hash.');
  const currentIdentity = databaseIdentity();
  if (JSON.stringify(snapshot.database) !== JSON.stringify(currentIdentity)) fail('Snapshot database identity does not match the current target.');
  const grouped = groupChanges(snapshot.changes, 'before');
  await prisma.$transaction(async (tx) => {
    await assertValues(tx, snapshot.changes, 'after', 'Rollback precondition');
    for (const item of grouped) {
      await tx.courseModule.update({ where: { id: item.moduleId }, data: item.data });
    }
    await assertValues(tx, snapshot.changes, 'before', 'Rollback readback');
  });
  console.log(JSON.stringify({ mode: 'rollback', snapshot: absolute, planHash: snapshot.planHash, rowsRestored: grouped.length, readback: 'passed' }, null, 2));
}

async function buildPlan(targets, fields) {
  const sources = loadSourceCourses();
  const changes = [];

  for (const target of targets) {
    const sourceCourse = sources.get(target.slug);
    if (!sourceCourse) fail(`Source course not found: ${target.slug}`);
    const sourceModule = sourceCourse.modules.get(target.order);
    if (!sourceModule) fail(`Source module not found: ${target.key}`);

    const course = await prisma.course.findUnique({
      where: { slug: target.slug },
      select: { id: true, slug: true, modules: { where: { order: target.order } } },
    });
    if (!course) fail(`Database course not found: ${target.slug}`);
    if (course.modules.length !== 1) fail(`Expected exactly one database module for ${target.key}; found ${course.modules.length}`);
    const current = course.modules[0];

    for (const field of fields) {
      const before = String(current[field] || '');
      const after = String(sourceModule[field] || '');
      if (before !== after) {
        changes.push({
          source: sourceCourse.file,
          course: target.slug,
          order: target.order,
          moduleId: current.id,
          field,
          before,
          after,
        });
      }
    }
  }
  return changes;
}

async function main() {
  const rollbackPath = argValue('--rollback');
  const expectedHash = argValue('--expect-plan-hash');
  if (rollbackPath) {
    await rollback(rollbackPath, expectedHash);
    return;
  }

  const apply = process.argv.includes('--apply');
  const targets = parseTargets(argValue('--targets'));
  const fields = parseFields(argValue('--fields'));
  const changes = await buildPlan(targets, fields);
  const hash = planHash(changes);
  const summary = {
    mode: apply ? 'apply' : 'dry-run',
    database: databaseIdentity(),
    targets: targets.map((target) => target.key),
    fields,
    changedFields: changes.length,
    changedRows: new Set(changes.map((change) => change.moduleId)).size,
    planHash: hash,
    changes,
  };

  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!changes.length) fail('Refusing apply because the reviewed plan has no changes.');
  if (!expectedHash || expectedHash !== hash) fail('Apply requires --expect-plan-hash matching the current dry-run plan.');
  const snapshotArg = argValue('--snapshot');
  if (!snapshotArg) fail('Apply requires --snapshot=/path/to/new-snapshot.json.');
  const snapshot = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    database: summary.database,
    planHash: hash,
    targets: summary.targets,
    fields,
    changes,
  };
  const snapshotPath = writeSnapshot(snapshotArg, snapshot);
  await applyChanges(changes);
  console.log(JSON.stringify({ ...summary, snapshot: snapshotPath, readback: 'passed' }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
