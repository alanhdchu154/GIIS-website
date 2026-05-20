#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const SEED_PATH = path.join(ROOT, 'server', 'prisma', 'seed.js');

const seedSource = fs.readFileSync(SEED_PATH, 'utf8');
const mainCallIndex = seedSource.indexOf('\nmain()');
if (mainCallIndex < 0) throw new Error('Could not find seed main() call.');

const inspectSource = `${seedSource.slice(0, mainCallIndex)}
const __students = [
  ['26-001', 'Ruwen Li', ruwenLiSemesters],
  ['26-002', 'Tao Zhang', taoZhangSemesters],
  ['26-003', 'Baoyi Lu', baoyiLuSemesters],
  ['26-004', 'Yunfan Yang', yunfanYangSemesters],
  ['26-005', 'Hanxi Xiao', hanxiXiaoSemesters],
].map(([code, name, semesters]) => ({
  code,
  name,
  rows: semesters.flatMap((semester) => semester.courseRows.create.map((row) => ({
    semester: semester.key,
    releaseDate: semester.releaseDate ? semester.releaseDate.toISOString().slice(0, 10) : null,
    ...row,
  }))),
}));
globalThis.__students = __students;
`;

const sandbox = {
  console,
  require: (id) => {
    if (id === '../lib/resolveDatabaseUrl') return {};
    if (id === '@prisma/client') return { PrismaClient: class { $disconnect() {} } };
    if (id === 'bcryptjs') return { hash: async () => '' };
    if (id === '../src/lib/gpa') return require(path.join(ROOT, 'server', 'src', 'lib', 'gpa'));
    return require(id);
  },
  __dirname: path.join(ROOT, 'server', 'prisma'),
  process: { env: {}, exit: (code) => { throw new Error(`process.exit(${code})`); } },
  Date,
};

vm.runInNewContext(inspectSource, sandbox, { filename: SEED_PATH });

const requirements = {
  total: 24,
  english: 4,
  math: 4,
  science: 3,
  socialStudies: 3,
};

function credits(rows, predicate) {
  return rows.filter(predicate).reduce((sum, row) => sum + Number(row.credits || 0), 0);
}

function passed(row) {
  return row.courseName && row.letterGrade && row.letterGrade !== 'F';
}

function classify(rows) {
  const earned = rows.filter(passed);
  const total = credits(earned, () => true);
  const springUnreleased = credits(earned, (row) => row.releaseDate === '2026-05-22');
  const english = credits(earned, (row) => /^English/i.test(row.courseName));
  const math = credits(earned, (row) => /(Algebra|Geometry|Calculus|Statistics|Trigonometry)/i.test(row.courseName));
  const science = credits(earned, (row) => /(Biology|Chemistry|Physics|Environmental Science)/i.test(row.courseName));
  const socialStudies = credits(earned, (row) => {
    const name = row.courseName;
    if (/(World History|Geography|U\.S\. History|World Politics|Government|Economics|Sociology|AP Human Geography|Research Methods|Business Research Methods|Economics Seminar|Statistics for Social Sciences|Economics Advanced)/i.test(name)) return true;
    return false;
  });

  const pathwayElectives = total - english - math - science - socialStudies;
  const worldLanguagesRecommended = credits(earned, (row) => /(Chinese|Mandarin|Spanish|French|World Language)/i.test(row.courseName));
  const peHealthOptional = credits(earned, (row) => /(Physical Education|Health|Fitness|Sports|Athletic Training|Nutrition)/i.test(row.courseName));
  const buckets = { total, english, math, science, socialStudies, pathwayElectives, worldLanguagesRecommended, peHealthOptional, springUnreleased };
  const missing = Object.entries(requirements)
    .filter(([key, needed]) => (buckets[key] || 0) < needed)
    .map(([key, needed]) => ({ area: key, have: buckets[key] || 0, need: needed }));

  const weightedGpa = (earned.reduce((sum, row) => sum + Number(row.weightedGpa || 0) * Number(row.credits || 0), 0) / total).toFixed(2);
  const unweightedGpa = (earned.reduce((sum, row) => sum + Number(row.unweightedGpa || 0) * Number(row.credits || 0), 0) / total).toFixed(2);

  return {
    credits: buckets,
    weightedGpa,
    unweightedGpa,
    adminCreditsOnlyEligible: total >= requirements.total,
    giisRequirementsEligible: missing.length === 0,
    missing,
  };
}

const report = sandbox.__students.map((student) => ({
  code: student.code,
  name: student.name,
  ...classify(student.rows),
}));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const row of report) {
    console.log(`${row.code} ${row.name}: ${row.credits.total} credits, UW ${row.unweightedGpa}, admin=${row.adminCreditsOnlyEligible ? 'eligible' : 'not eligible'}, giis=${row.giisRequirementsEligible ? 'eligible' : 'not eligible'}`);
    if (row.missing.length) {
      console.log(`  missing: ${row.missing.map((m) => `${m.area} ${m.have}/${m.need}`).join(', ')}`);
    }
    if (row.credits.worldLanguagesRecommended < 2) {
      console.log(`  note: world language is recommended for selective colleges (${row.credits.worldLanguagesRecommended}/2), but not required for GIIS graduation`);
    }
  }
}
