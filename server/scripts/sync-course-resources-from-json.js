#!/usr/bin/env node

/**
 * Sync course-module resource fields from the course JSON catalog
 * into Prisma CourseModule rows.
 *
 * This intentionally updates only resource/link fields so it can repair broken
 * student-facing links without reseeding courses or touching enrollments,
 * progress, grades, assignments, or assessments.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const APPLY = process.argv.includes('--apply');

const RESOURCE_FIELDS = [
  'readingUrl',
  'readingNote',
  'videoUrl',
  'videoNote',
  'video2Url',
  'video2Note',
  'practiceUrl',
  'practiceNote',
];

function walkJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(full, out);
    else if (entry.name.endsWith('.json') && !entry.name.startsWith('._')) out.push(full);
  }
  return out;
}

function resourceData(module) {
  const data = {};
  for (const field of RESOURCE_FIELDS) data[field] = module[field] || '';
  return data;
}

function diffResourceFields(current, next) {
  const changed = {};
  for (const field of RESOURCE_FIELDS) {
    const before = current[field] || '';
    const after = next[field] || '';
    if (before !== after) changed[field] = { before, after };
  }
  return changed;
}

async function main() {
  const files = walkJson(COURSE_DIR).sort();
  const changes = [];
  const missingCourses = [];
  const missingModules = [];

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const course = await prisma.course.findUnique({
      where: { slug: json.slug },
      include: { modules: true },
    });
    if (!course) {
      missingCourses.push(json.slug);
      continue;
    }

    const modulesByOrder = new Map(course.modules.map((mod) => [Number(mod.order), mod]));
    for (const moduleJson of json.modules || []) {
      const dbModule = modulesByOrder.get(Number(moduleJson.order));
      if (!dbModule) {
        missingModules.push({ course: json.slug, order: moduleJson.order, title: moduleJson.title });
        continue;
      }

      const next = resourceData(moduleJson);
      const changed = diffResourceFields(dbModule, next);
      if (Object.keys(changed).length) {
        changes.push({
          course: json.slug,
          moduleId: dbModule.id,
          order: moduleJson.order,
          title: moduleJson.title,
          changed,
          data: next,
        });
      }
    }
  }

  if (APPLY && changes.length) {
    for (const change of changes) {
      await prisma.courseModule.update({
        where: { id: change.moduleId },
        data: change.data,
      });
    }
  }

  console.log(JSON.stringify({
    apply: APPLY,
    files: files.length,
    changes: changes.length,
    missingCourses,
    missingModules,
    sample: changes.slice(0, 20).map(({ data: _data, ...change }) => change),
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
