/**
 * Seeds ONLY new courses that don't yet exist in the DB.
 * Safe to run alongside existing student enrollments — never deletes any course.
 */
require('../lib/resolveDatabaseUrl');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function collectCourseFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectCourseFiles(full));
    else if (entry.name.endsWith('.json')) results.push(full);
  }
  return results;
}

async function main() {
  const dir = path.join(__dirname, '../prisma/courses');
  const files = collectCourseFiles(dir);
  let created = 0, skipped = 0;

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const { modules, questions, quizQuestions, ...meta } = data;
    const cleanQuizQuestions = (quizQuestions || []).map(({ type: _t, ...q }) => q);

    const existing = await prisma.course.findUnique({ where: { slug: meta.slug } });
    if (existing) {
      console.log(`SKIP (exists): ${meta.name}`);
      skipped++;
      continue;
    }

    await prisma.course.create({
      data: {
        ...meta,
        modules: { create: modules },
        questions: { create: questions || [] },
        quizQuestions: { create: cleanQuizQuestions },
      },
    });
    console.log(`CREATED: ${meta.name} (${modules.length} modules, ${(questions || []).length} exam q, ${cleanQuizQuestions.length} quiz q)`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
