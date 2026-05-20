#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const SEED_PATH = path.join(ROOT, 'server', 'prisma', 'seed.js');
const COURSES_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const { computeRowGpa } = require(path.join(ROOT, 'server', 'src', 'lib', 'gpa'));

const seedSource = fs.readFileSync(SEED_PATH, 'utf8');

const SENIORS = [
  { code: '26-001', name: 'Ruwen Li', email: 'ruwen.li@genesisideas.school', semestersVar: 'ruwenLiSemesters', transcriptDate: '2026-03-02', graduationDate: '2026-06-30' },
  { code: '26-002', name: 'Tao Zhang', email: 'tao.zhang@genesisideas.school', semestersVar: 'taoZhangSemesters', transcriptDate: '2026-04-23', graduationDate: '2026-06-30' },
  { code: '26-003', name: 'Baoyi Lu', email: 'baoyi.lu@genesisideas.school', semestersVar: 'baoyiLuSemesters', transcriptDate: '2026-02-06', graduationDate: '2026-06-30' },
  { code: '26-004', name: 'Yunfan Yang', email: 'yunfan.yang@genesisideas.school', semestersVar: 'yunfanYangSemesters', transcriptDate: '2026-02-06', graduationDate: '2026-06-30' },
  { code: '26-005', name: 'Hanxi Xiao', email: 'hanxi.xiao@genesisideas.school', semestersVar: 'hanxiXiaoSemesters', transcriptDate: '2026-05-12', graduationDate: '2026-06-30' },
];

function extractConstArray(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Could not find ${constName}.`);
  const arrayStart = source.indexOf('[', start);
  let depth = 0;
  let inString = false;
  let quote = null;
  let escaped = false;

  for (let i = arrayStart; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
        quote = null;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(arrayStart, i + 1);
    }
  }
  throw new Error(`Could not parse ${constName}.`);
}

function loadSeedSemesters() {
  const mainCallIndex = seedSource.indexOf('\nmain()');
  if (mainCallIndex < 0) throw new Error('Could not find seed main() call.');
  const inspectSource = `${seedSource.slice(0, mainCallIndex)}
globalThis.__seniorSemesters = {
  ruwenLiSemesters,
  taoZhangSemesters,
  baoyiLuSemesters,
  yunfanYangSemesters,
  hanxiXiaoSemesters,
};
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
  return sandbox.__seniorSemesters;
}

function loadG12Progress() {
  const arraySource = extractConstArray(seedSource, 'g12Progress');
  return vm.runInNewContext(arraySource, {}, { filename: SEED_PATH });
}

function walkJson(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walkJson(full, out);
    } else if (name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

function loadCourses() {
  const courses = new Map();
  for (const file of walkJson(COURSES_DIR)) {
    const course = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (course.slug) courses.set(course.slug, { ...course, file });
  }
  return courses;
}

function letterGrade(pct) {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

function computedCourseGrade(progress) {
  const quizAvg = Number(progress.quizScore);
  const midterm = Number(progress.examScore);
  const final = Number(progress.examScore);
  const pct = Math.round((quizAvg * 0.4 + midterm * 0.3 + final * 0.3) * 10) / 10;
  return { pct, letter: letterGrade(pct) };
}

function flattenRows(semesters) {
  return semesters.flatMap((semester) => semester.courseRows.create.map((row) => ({
    semester: semester.key,
    releaseDate: semester.releaseDate ? semester.releaseDate.toISOString().slice(0, 10) : null,
    ...row,
  })));
}

function credits(rows) {
  return rows.reduce((sum, row) => sum + Number(row.credits || 0), 0);
}

function auditStudent(student, semesters, progressEntry, courses) {
  const issues = [];
  const warnings = [];
  const notes = [];
  const rows = flattenRows(semesters);
  const springRows = rows.filter((row) => row.semester === 'Grade 12 - Spring Semester');
  const catalogNames = new Set([...courses.values()].map((course) => course.name));
  const catalogByName = new Map([...courses.values()].map((course) => [course.name, course]));

  if (semesters.length !== 8) issues.push(`expected 8 semesters, found ${semesters.length}`);
  if (!student.transcriptDate) issues.push('missing transcript date');
  if (!student.graduationDate) issues.push('missing graduation date');
  if (!student.code) issues.push('missing student code; transcript/diploma QR verification cannot work');
  if (!springRows.length) issues.push('missing Grade 12 Spring transcript rows');

  for (const semester of semesters) {
    if (!semester.courseRows.create.length) issues.push(`${semester.key} has no course rows`);
  }

  for (const row of rows) {
    if (!row.courseName) issues.push(`${row.semester} has a blank course name`);
    if (!Number(row.credits)) issues.push(`${row.semester} / ${row.courseName} has no credit value`);
    if (!row.letterGrade) issues.push(`${row.semester} / ${row.courseName} has no letter grade`);
    if (row.semester === 'Grade 12 - Spring Semester' && !catalogNames.has(row.courseName)) {
      issues.push(`${row.semester} / ${row.courseName} does not match a current course catalog name`);
    } else if (!catalogNames.has(row.courseName)) {
      warnings.push(`${row.semester} / ${row.courseName} is transcript/import-only and does not exactly match a current course catalog name`);
    }
    const catalogCourse = catalogByName.get(row.courseName);
    if (catalogCourse && Number(row.credits) !== Number(catalogCourse.credits)) {
      const message = `${row.semester} / ${row.courseName} credit ${row.credits} does not match current catalog ${catalogCourse.credits}`;
      if (row.semester === 'Grade 12 - Spring Semester') issues.push(message);
      else warnings.push(`${message}; treat as historical/import variation unless corrected by official revision log`);
    }
    const expected = computeRowGpa(row);
    if (expected.unweightedGpa !== row.unweightedGpa || expected.weightedGpa !== row.weightedGpa) {
      issues.push(`${row.semester} / ${row.courseName} GPA mismatch for ${row.letterGrade}`);
    }
  }

  const totalCredits = credits(rows.filter((row) => row.letterGrade && row.letterGrade !== 'F'));
  if (totalCredits < 24) issues.push(`credits below graduation threshold: ${totalCredits}/24`);

  if (!progressEntry) {
    issues.push('missing G12 Spring Learn Portal progress entry');
  } else {
    const progressCourses = progressEntry.courses || [];
    if (progressCourses.length !== springRows.length) {
      issues.push(`G12 Spring progress course count ${progressCourses.length} does not match transcript row count ${springRows.length}`);
    }

    for (const progress of progressCourses) {
      const course = courses.get(progress.slug);
      if (!course) {
        issues.push(`missing course JSON for ${progress.slug}`);
        continue;
      }
      if (Number(progress.modules) !== (course.modules || []).length) {
        issues.push(`${progress.slug} completed module count ${progress.modules} does not match course JSON ${(course.modules || []).length}`);
      }
      if (!Number.isFinite(Number(progress.quizScore)) || !Number.isFinite(Number(progress.examScore))) {
        issues.push(`${progress.slug} missing quiz or exam score`);
      }
      const transcriptRow = springRows.find((row) => row.courseName === course.name);
      if (!transcriptRow) {
        issues.push(`${progress.slug} (${course.name}) is complete in Learn Portal but missing from G12 Spring transcript`);
        continue;
      }
      const computed = computedCourseGrade(progress);
      if (computed.letter !== transcriptRow.letterGrade) {
        issues.push(`${student.code} ${course.name}: Learn Portal computes ${computed.pct}%/${computed.letter}, transcript has ${transcriptRow.letterGrade}`);
      }
    }

    const progressNames = new Set(progressCourses.map((progress) => courses.get(progress.slug)?.name).filter(Boolean));
    for (const row of springRows) {
      if (!progressNames.has(row.courseName)) {
        issues.push(`${row.courseName} appears on G12 Spring transcript but has no matching Learn Portal completion`);
      }
      if (row.releaseDate !== '2026-05-22') {
        issues.push(`${row.courseName} has unexpected release date ${row.releaseDate || 'none'}`);
      }
    }
  }

  notes.push('Earlier semesters are transcript/import records; Learn Portal quiz and exam attempts are only seeded for current G12 Spring courses.');
  notes.push(`Diploma/verification source fields present: studentCode=${student.code}, graduationDate=${student.graduationDate}, transcriptDate=${student.transcriptDate}.`);

  return {
    code: student.code,
    name: student.name,
    email: student.email,
    transcriptDate: student.transcriptDate,
    graduationDate: student.graduationDate,
    semesters: semesters.length,
    transcriptRows: rows.length,
    totalCredits,
    g12SpringCourses: springRows.length,
    g12SpringReleaseDate: springRows[0]?.releaseDate || null,
    status: issues.length ? 'fail' : 'pass',
    issues,
    warnings,
    notes,
  };
}

const semestersByName = loadSeedSemesters();
const courses = loadCourses();
const g12Progress = loadG12Progress();
const progressByEmail = new Map(g12Progress.map((entry) => [entry.email, entry]));

const report = SENIORS.map((student) => auditStudent(
  student,
  semestersByName[student.semestersVar],
  progressByEmail.get(student.email),
  courses
));

const hasFailures = report.some((student) => student.status !== 'pass');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const student of report) {
    console.log(`${student.status === 'pass' ? 'PASS' : 'FAIL'} ${student.code} ${student.name}: ${student.totalCredits} credits, ${student.semesters} semesters, ${student.transcriptRows} transcript rows, G12 Spring ${student.g12SpringCourses} courses released ${student.g12SpringReleaseDate}`);
    for (const issue of student.issues) console.log(`  issue: ${issue}`);
    for (const warning of student.warnings) console.log(`  warning: ${warning}`);
    for (const note of student.notes) console.log(`  note: ${note}`);
  }
}

process.exit(hasFailures ? 1 : 0);
