#!/usr/bin/env node
/**
 * senior-activity-audit.js — RF-1 / T-002
 *
 * Answers: "Do the 5 Class of 2026 seniors have real platform activity on G12?"
 *
 * For each senior (26-001 … 26-005) prints:
 *   - Enrollments count + creditEarned count
 *   - Modules completed (across all enrollments)
 *   - Quiz attempts + passed
 *   - Assignment submissions + graded
 *   - Exam attempts (midterm/final) + passed
 *   - Estimated hours spent  (completedModules × CourseModule.estimatedHrs)
 *   - Last platform activity timestamp (max of quiz/assignment/exam submittedAt)
 *
 * Gate rule from GIIS-action-backlog (T-002):
 *   < 20h activity on G12 year → triggers T-003 (catch-up before 5/22 release).
 *
 * Note on "login count": there is no LoginLog model today. The closest signal is
 * the most-recent submission timestamp. If a real login audit is required by the
 * accreditor / college audit, we need to add a LoginLog table — flagged at end
 * of report.
 *
 * Run from `server/` directory:
 *   node scripts/senior-activity-audit.js
 *   node scripts/senior-activity-audit.js --json   # machine-readable
 *   node scripts/senior-activity-audit.js --year=12  # only count G12 enrollments
 */

require('../lib/resolveDatabaseUrl');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SENIOR_CODES = ['26-001', '26-002', '26-003', '26-004', '26-005'];
const GATE_HOURS = 20; // T-002 threshold

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const yearFilter = (() => {
  const a = args.find((x) => x.startsWith('--year='));
  if (!a) return null;
  const v = Number(a.split('=')[1]);
  return Number.isFinite(v) ? v : null;
})();

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toISOString().slice(0, 16).replace('T', ' ');
}

function asNum(d) {
  if (d == null) return 0;
  // Prisma Decimal has toNumber
  if (typeof d === 'object' && typeof d.toNumber === 'function') return d.toNumber();
  return Number(d);
}

async function auditOne(code) {
  const student = await prisma.student.findUnique({
    where: { studentCode: code },
    include: {
      enrollments: {
        include: {
          course: {
            include: { modules: true },
          },
          quizAttempts: true,
          assignments: true,
          examAttempts: true,
        },
      },
    },
  });

  if (!student) {
    return { code, found: false };
  }

  // Year filter — gradeLevel on Course (9/10/11/12); if null treat as "open"
  const enrollments = yearFilter
    ? student.enrollments.filter((e) => e.course?.gradeLevel === yearFilter)
    : student.enrollments;

  let modulesCompleted = 0;
  let estimatedHrs = 0;
  let quizCount = 0;
  let quizPassed = 0;
  let assignmentCount = 0;
  let assignmentGraded = 0;
  let examCount = 0;
  let examPassed = 0;
  let lastActivity = null;

  const perCourse = [];

  for (const e of enrollments) {
    const courseHrsByOrder = new Map(
      (e.course?.modules || []).map((m) => [m.order, asNum(m.estimatedHrs)])
    );
    const courseHrs = (e.completedModules || []).reduce(
      (sum, order) => sum + (courseHrsByOrder.get(order) || 0),
      0
    );

    modulesCompleted += (e.completedModules || []).length;
    estimatedHrs += courseHrs;

    quizCount += e.quizAttempts.length;
    quizPassed += e.quizAttempts.filter((q) => q.passed).length;

    assignmentCount += e.assignments.length;
    assignmentGraded += e.assignments.filter((a) => a.gradedAt != null).length;

    examCount += e.examAttempts.length;
    examPassed += e.examAttempts.filter((x) => x.passed).length;

    for (const q of e.quizAttempts) {
      if (!lastActivity || q.submittedAt > lastActivity) lastActivity = q.submittedAt;
    }
    for (const a of e.assignments) {
      if (!lastActivity || a.submittedAt > lastActivity) lastActivity = a.submittedAt;
    }
    for (const x of e.examAttempts) {
      const t = x.submittedAt || x.startedAt;
      if (t && (!lastActivity || t > lastActivity)) lastActivity = t;
    }

    perCourse.push({
      course: e.course?.name || '(unknown)',
      gradeLevel: e.course?.gradeLevel ?? null,
      semesterLabel: e.semesterLabel,
      creditEarned: e.creditEarned,
      modulesCompleted: (e.completedModules || []).length,
      moduleTotal: (e.course?.modules || []).length,
      estHrs: Number(courseHrs.toFixed(1)),
      quizAttempts: e.quizAttempts.length,
      assignments: e.assignments.length,
      exams: e.examAttempts.length,
    });
  }

  const gatePass = estimatedHrs >= GATE_HOURS;

  return {
    code,
    found: true,
    name: student.name,
    enrollments: enrollments.length,
    creditsEarned: enrollments.filter((e) => e.creditEarned).length,
    modulesCompleted,
    estimatedHrs: Number(estimatedHrs.toFixed(1)),
    quizCount,
    quizPassed,
    assignmentCount,
    assignmentGraded,
    examCount,
    examPassed,
    lastActivity,
    gatePass,
    perCourse,
  };
}

function renderHuman(reports) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`  SENIOR ACTIVITY AUDIT — RF-1 / T-002`);
  console.log(`  Gate: ≥ ${GATE_HOURS} h estimated activity ${yearFilter ? `(G${yearFilter} only)` : '(all enrollments)'}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');

  const summaryRows = reports.map((r) => {
    if (!r.found) return [r.code, 'NOT FOUND', '', '', '', '', '', '', ''];
    return [
      r.code,
      r.name,
      String(r.enrollments),
      String(r.creditsEarned),
      String(r.modulesCompleted),
      `${r.estimatedHrs}h`,
      `${r.quizPassed}/${r.quizCount}`,
      `${r.assignmentGraded}/${r.assignmentCount}`,
      `${r.examPassed}/${r.examCount}`,
      r.gatePass ? 'PASS' : 'FAIL',
      fmtDate(r.lastActivity),
    ];
  });

  const headers = ['Code', 'Name', 'Enroll', 'Cred', 'Mods', 'Hrs', 'Quiz P/T', 'Asg G/T', 'Exam P/T', 'Gate', 'LastActivity'];
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...summaryRows.map((r) => (r[i] || '').length))
  );
  const pad = (s, w) => (s || '').padEnd(w, ' ');

  console.log('');
  console.log(headers.map((h, i) => pad(h, widths[i])).join('  '));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const row of summaryRows) {
    console.log(row.map((c, i) => pad(c, widths[i])).join('  '));
  }
  console.log('');

  // Per-course breakdown for any senior failing the gate
  const failing = reports.filter((r) => r.found && !r.gatePass);
  if (failing.length) {
    console.log('─── FAILING SENIORS — per-course breakdown ─────────────────────────────────────');
    for (const r of failing) {
      console.log('');
      console.log(`◼ ${r.code} ${r.name} — ${r.estimatedHrs}h total (gate ${GATE_HOURS}h)`);
      for (const c of r.perCourse) {
        const lvl = c.gradeLevel ? `G${c.gradeLevel}` : 'open';
        console.log(
          `   ${lvl} ${c.semesterLabel.padEnd(28)} ${c.course.padEnd(40)}  ` +
            `${String(c.modulesCompleted).padStart(2)}/${String(c.moduleTotal).padEnd(2)} mods · ` +
            `${String(c.estHrs).padStart(4)}h · ` +
            `quiz ${c.quizAttempts} · asg ${c.assignments} · exam ${c.exams}` +
            (c.creditEarned ? ' · ✓ credit' : '')
        );
      }
    }
    console.log('');
  }

  console.log('─── Notes & limitations ────────────────────────────────────────────────────────');
  console.log('• "Hours" = sum of CourseModule.estimatedHrs for each completed module — a UPPER');
  console.log('  bound on what we can claim. The real metric the College Board / audit cares');
  console.log('  about is timestamped logins + session duration. We do not track that yet.');
  console.log('• No LoginLog model exists. Recommend adding one before 5/22 release — even a');
  console.log('  simple insert on /me + parent-auth would give us defensible login history.');
  console.log('• AuditLog table tracks only admin actions, not student activity.');
  console.log('');
}

(async () => {
  try {
    const reports = [];
    for (const code of SENIOR_CODES) {
      reports.push(await auditOne(code));
    }

    if (asJson) {
      console.log(JSON.stringify(reports, null, 2));
    } else {
      renderHuman(reports);
    }

    const failing = reports.filter((r) => r.found && !r.gatePass);
    if (failing.length) {
      console.log(`⚠  ${failing.length}/${reports.length} senior(s) below ${GATE_HOURS}h gate. Trigger T-003 catch-up.`);
      process.exitCode = 2; // CI-friendly
    } else if (reports.every((r) => r.found)) {
      console.log(`✓  All ${reports.length} seniors meet ${GATE_HOURS}h gate.`);
    }
  } catch (err) {
    console.error('senior-activity-audit failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
