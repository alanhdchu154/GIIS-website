#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const { getExpertLens, familyFor } = require(path.join(
  ROOT,
  'src',
  'components',
  'pages',
  'Learn',
  'syllabusExpertLens',
));

function usage() {
  console.error('usage: node tools/lesson-video/expert_lens_packet.js <course-json> <module-order>');
  process.exit(2);
}

const [, , coursePathArg, moduleOrderArg] = process.argv;
if (!coursePathArg || !moduleOrderArg) usage();

const coursePath = path.resolve(ROOT, coursePathArg);
const moduleOrder = Number(moduleOrderArg);
if (!Number.isFinite(moduleOrder)) usage();

const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
const mod = (course.modules || []).find((item) => Number(item.order) === moduleOrder);
if (!mod) {
  console.error(`module order ${moduleOrder} not found in ${path.relative(ROOT, coursePath)}`);
  process.exit(3);
}

const lens = getExpertLens(course, mod);
for (const key of ['insight', 'watchFor', 'transfer']) {
  if (!lens || !String(lens[key] || '').trim()) {
    console.error(`expert lens missing ${key} for ${course.slug} module ${moduleOrder}`);
    process.exit(4);
  }
}

process.stdout.write(`${JSON.stringify({
  source: 'src/components/pages/Learn/syllabusExpertLens.js',
  family: familyFor(course),
  insight: lens.insight,
  watchFor: lens.watchFor,
  transfer: lens.transfer,
}, null, 2)}\n`);
