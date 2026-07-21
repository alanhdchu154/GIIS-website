#!/usr/bin/env node

/**
 * Sync safe Course metadata from JSON catalog files into Prisma Course rows.
 *
 * This intentionally updates only fields that control routing/visibility:
 * - isPublished
 * - gradeLevel
 *
 * It does not touch modules, enrollments, progress, grades, assignments,
 * exams, or quiz questions.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const APPLY = process.argv.includes('--apply');
const APPLY_ALL = process.argv.includes('--all');
const SLUG_ARG = process.argv.find((arg) => arg.startsWith('--slugs='));
const ONLY_SLUGS = SLUG_ARG
  ? new Set(SLUG_ARG.replace('--slugs=', '').split(',').map((slug) => slug.trim()).filter(Boolean))
  : null;

function walkJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(full, out);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('._')) out.push(full);
  }
  return out;
}

function normalizeGradeLevel(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : value;
}

function metadataFromJson(json) {
  return {
    isPublished: json.isPublished !== false,
    gradeLevel: normalizeGradeLevel(json.gradeLevel),
  };
}

function diffMetadata(course, next) {
  const changed = {};
  for (const field of Object.keys(next)) {
    const before = course[field] ?? null;
    const after = next[field] ?? null;
    if (before !== after) changed[field] = { before, after };
  }
  return changed;
}

async function main() {
  if (APPLY && !APPLY_ALL && !ONLY_SLUGS) {
    throw new Error('Refusing to apply broadly. Pass --slugs=a,b,c or --all.');
  }

  const files = walkJson(COURSE_DIR).sort();
  const changes = [];
  const missingCourses = [];
  const skippedBySlugFilter = [];

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (ONLY_SLUGS && !ONLY_SLUGS.has(json.slug)) {
      skippedBySlugFilter.push(json.slug);
      continue;
    }

    const course = await prisma.course.findUnique({ where: { slug: json.slug } });
    if (!course) {
      missingCourses.push(json.slug);
      continue;
    }

    const data = metadataFromJson(json);
    const changed = diffMetadata(course, data);
    if (Object.keys(changed).length) {
      changes.push({
        slug: json.slug,
        title: json.title || json.name || json.slug,
        changed,
        data,
      });
    }
  }

  if (APPLY) {
    for (const change of changes) {
      await prisma.course.update({
        where: { slug: change.slug },
        data: change.data,
      });
    }
  }

  console.log(JSON.stringify({
    apply: APPLY,
    all: APPLY_ALL,
    slugs: ONLY_SLUGS ? [...ONLY_SLUGS].sort() : null,
    files: files.length,
    consideredFiles: ONLY_SLUGS ? files.length - skippedBySlugFilter.length : files.length,
    changes: changes.length,
    missingCourses,
    skippedBySlugFilter: skippedBySlugFilter.length,
    changedCourses: changes.map(({ data: _data, ...change }) => change),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
