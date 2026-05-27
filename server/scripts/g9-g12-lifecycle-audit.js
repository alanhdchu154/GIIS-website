#!/usr/bin/env node
/* eslint-disable no-console */
require('../lib/resolveDatabaseUrl');

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { computeRowGpa, computeSemesterTotals } = require('../src/lib/gpa');
const {
  DEFAULT_PARENT_PASSWORD,
  DEFAULT_STUDENT_PASSWORD,
  parentLoginEmailForStudentEmail,
} = require('../src/lib/parentCredentials');

const prisma = new PrismaClient();

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const STUDENT_CODE = 'GIIS-LIFECYCLE-G9G12';
const STUDENT_EMAIL = 'lifecycle.g9g12.student@genesisideas.school';
const PARENT_EMAIL = parentLoginEmailForStudentEmail(STUDENT_EMAIL);
const CONTACT_EMAIL = 'lifecycle.g9g12.parent@example.com';

const APPLY_CLEANUP = process.argv.includes('--cleanup');
const KEEP_DATA = process.argv.includes('--keep');

const SEMESTERS = [
  {
    key: 'Grade 9 - Fall Semester',
    start: '2022-08-15',
    end: '2022-12-16',
    slugs: ['english-i', 'algebra-i', 'biology', 'world-history'],
  },
  {
    key: 'Grade 9 - Spring Semester',
    start: '2023-01-09',
    end: '2023-05-19',
    slugs: ['english-i-writing', 'geometry', 'environmental-science', 'geography'],
  },
  {
    key: 'Grade 10 - Fall Semester',
    start: '2023-08-14',
    end: '2023-12-15',
    slugs: ['english-ii', 'algebra-ii', 'chemistry', 'us-history'],
  },
  {
    key: 'Grade 10 - Spring Semester',
    start: '2024-01-08',
    end: '2024-05-17',
    slugs: ['english-ii-literature', 'pre-calculus', 'physics-fundamentals', 'government'],
  },
  {
    key: 'Grade 11 - Fall Semester',
    start: '2024-08-12',
    end: '2024-12-13',
    slugs: ['english-iii', 'statistics', 'economics', 'ap-psychology'],
  },
  {
    key: 'Grade 11 - Spring Semester',
    start: '2025-01-13',
    end: '2025-05-23',
    slugs: ['english-iii-literature', 'ap-statistics', 'sociology', 'research-methods-social-science'],
  },
  {
    key: 'Grade 12 - Fall Semester',
    start: '2025-08-11',
    end: '2025-12-12',
    slugs: ['english-iv-advanced-composition', 'calculus', 'physics-mechanics', 'psychology-seminar-capstone'],
  },
  {
    key: 'Grade 12 - Spring Semester',
    start: '2026-01-12',
    end: '2026-05-22',
    slugs: ['english-iv-media-analytical-writing', 'ap-biology', 'abnormal-psychology', 'counseling-mental-health'],
  },
];

function assertLocalDatabase() {
  const url = String(process.env.DATABASE_URL || '');
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  if (process.env.NODE_ENV === 'production' || !isLocal) {
    throw new Error(
      'Refusing to run G9-G12 lifecycle audit outside a local database. Set DATABASE_URL to local Postgres first.'
    );
  }
}

function dateAt(value, hour = 12) {
  return new Date(`${value}T${String(hour).padStart(2, '0')}:00:00.000Z`);
}

function addDays(date, days, hour = 12) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(hour, 0, 0, 0);
  return next;
}

function daysBetween(start, end) {
  return Math.max(1, Math.round((dateAt(end).getTime() - dateAt(start).getTime()) / 86400000));
}

function walkCourseFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkCourseFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

async function syncCourseCatalog() {
  const files = walkCourseFiles(COURSE_DIR);
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const { modules = [], questions = [], quizQuestions = [], ...meta } = data;
    const existing = await prisma.course.findUnique({ where: { slug: meta.slug } });
    if (existing) {
      await prisma.course.update({ where: { id: existing.id }, data: meta });
      await prisma.courseModule.deleteMany({ where: { courseId: existing.id } });
      await prisma.examQuestion.deleteMany({ where: { courseId: existing.id } });
      await prisma.moduleQuizQuestion.deleteMany({ where: { courseId: existing.id } });
      await prisma.courseModule.createMany({ data: modules.map((m) => ({ ...m, courseId: existing.id })) });
      await prisma.examQuestion.createMany({ data: questions.map((q) => ({ ...q, courseId: existing.id })) });
      await prisma.moduleQuizQuestion.createMany({
        data: quizQuestions.map(({ type: _type, ...q }) => ({ ...q, courseId: existing.id })),
      });
    } else {
      await prisma.course.create({
        data: {
          ...meta,
          modules: { create: modules },
          questions: { create: questions },
          quizQuestions: { create: quizQuestions.map(({ type: _type, ...q }) => q) },
        },
      });
    }
  }
}

async function cleanup() {
  await prisma.subscription.deleteMany({
    where: {
      OR: [
        { purchaserEmail: CONTACT_EMAIL },
        { purchaserEmail: PARENT_EMAIL },
        { stripeCheckoutSessionId: `g9g12_checkout_${STUDENT_CODE}` },
        { stripeSubscriptionId: `g9g12_subscription_${STUDENT_CODE}` },
      ],
    },
  });
  await prisma.application.deleteMany({ where: { parentEmail: CONTACT_EMAIL } });
  const existing = await prisma.student.findUnique({ where: { studentCode: STUDENT_CODE } });
  if (existing) await prisma.student.delete({ where: { id: existing.id } });
}

function letterFromAverage(score) {
  if (score >= 96) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  return 'B-';
}

function scoreFor(semesterIndex, courseIndex, moduleIndex = 0) {
  return 88 + ((semesterIndex * 3 + courseIndex * 5 + moduleIndex * 2) % 10);
}

function classifyCredits(rows) {
  const earned = rows.filter((row) => row.courseName && row.letterGrade && row.letterGrade !== 'F');
  const credits = (predicate) => earned.filter(predicate).reduce((sum, row) => sum + Number(row.credits || 0), 0);
  const english = credits((row) => /^English/i.test(row.courseName));
  const math = credits((row) => /(Algebra|Geometry|Calculus|Statistics|Pre-Calculus)/i.test(row.courseName));
  const science = credits((row) => /(Biology|Chemistry|Physics|Environmental Science)/i.test(row.courseName));
  const socialStudies = credits((row) => (
    /(World History|Geography|U\.S\. History|Government|Economics|Sociology|Research Methods|AP Human Geography)/i
      .test(row.courseName)
  ));
  const total = earned.reduce((sum, row) => sum + Number(row.credits || 0), 0);
  const worldLanguage = credits((row) => /(Spanish|French|Chinese|Mandarin|World Language)/i.test(row.courseName));
  return {
    total,
    english,
    math,
    science,
    socialStudies,
    electives: Number((total - english - math - science - socialStudies).toFixed(1)),
    worldLanguage,
  };
}

function admissionsReview({ credits, transcriptRows, enrollments, loginSessions, totalEstimatedHours }) {
  const flags = [];
  const strengths = [];
  const recommendations = [];

  if (credits.total >= 24 && credits.english >= 4 && credits.math >= 4 && credits.science >= 3 && credits.socialStudies >= 3) {
    strengths.push('Meets the 24-credit graduation frame with strong English, math, science, and social-studies coverage.');
  }
  if (transcriptRows.some((row) => /^AP /i.test(row.courseName))) {
    strengths.push('Shows AP exam-preparation rigor across multiple subjects.');
    recommendations.push('For selective universities, pair AP-prep coursework with official external AP exam scores where possible.');
  }
  if (credits.worldLanguage < 2) {
    flags.push('No 2-credit world-language sequence appears in the transcript; many selective universities expect or prefer this.');
    recommendations.push('Add a Spanish/French/Chinese language sequence or clearly explain prior language proficiency.');
  }
  if (!enrollments.every((enr) => enr.assignments.length === enr.course.modules.length)) {
    flags.push('Some courses do not have one graded assignment per module.');
  }
  if (!enrollments.every((enr) => enr.moduleProgresses.length === enr.course.modules.length)) {
    flags.push('Some courses have incomplete module-progress records.');
  }
  if (!enrollments.every((enr) => enr.examAttempts.some((x) => x.examType === 'midterm' && x.passed) && enr.examAttempts.some((x) => x.examType === 'final' && x.passed))) {
    flags.push('Some courses are missing a passed midterm or final.');
  }
  if (totalEstimatedHours < 720) {
    flags.push(`Estimated module hours are only ${totalEstimatedHours.toFixed(1)}; this may look thin for a full four-year record.`);
  } else {
    strengths.push(`${totalEstimatedHours.toFixed(1)} estimated module hours across the pathway gives a defensible activity volume.`);
  }
  if (!loginSessions.length) {
    flags.push('This synthetic seed run has no actual login sessions yet; run the API smoke to create student/parent LoginSession records.');
  } else {
    strengths.push(`Includes ${loginSessions.length} login/session record(s), giving staff a last-seen and rough duration signal.`);
  }
  recommendations.push('Use LoginSession as an operational care signal, but do not overclaim exact seat time from heartbeat-based duration.');
  recommendations.push('Keep official records centered on transcript, quiz/exam results, and real submitted student work; generated placeholder assignments should never be used as real evidence.');

  return { strengths, flags, recommendations };
}

async function main() {
  assertLocalDatabase();
  if (APPLY_CLEANUP) {
    await cleanup();
    console.log(JSON.stringify({ cleanup: 'complete', studentCode: STUDENT_CODE }, null, 2));
    return;
  }

  await syncCourseCatalog();
  await cleanup();

  const studentPasswordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 12);
  const parentPasswordHash = await bcrypt.hash(DEFAULT_PARENT_PASSWORD, 12);
  const courseSlugs = SEMESTERS.flatMap((semester) => semester.slugs);
  const courses = await prisma.course.findMany({
    where: { slug: { in: courseSlugs } },
    include: {
      modules: { orderBy: { order: 'asc' } },
      questions: true,
      quizQuestions: true,
    },
  });
  const bySlug = new Map(courses.map((course) => [course.slug, course]));
  const missing = courseSlugs.filter((slug) => !bySlug.has(slug));
  if (missing.length) throw new Error(`Missing course(s): ${missing.join(', ')}`);

  const application = await prisma.application.create({
    data: {
      studentName: 'G9-G12 Lifecycle Student',
      dob: '2008-09-01',
      gradeLevel: 'Grade 9',
      currentSchool: 'GIIS lifecycle audit',
      targetUniversities: 'Selective US universities',
      preferredLanguage: 'en',
      parentName: 'G9-G12 Lifecycle Parent',
      parentEmail: CONTACT_EMAIL,
      phone: '000-000-0000',
      notes: 'Synthetic local-only lifecycle audit student. Not a real record.',
      status: 'approved',
      accountsCreated: true,
      reviewedAt: new Date(),
    },
  });

  const student = await prisma.student.create({
    data: {
      studentCode: STUDENT_CODE,
      name: 'G9-G12 Lifecycle Student',
      birthDate: dateAt('2008-09-01'),
      gender: 'Female',
      parentGuardian: 'G9-G12 Lifecycle Parent',
      parentEmail: CONTACT_EMAIL,
      address: '1 Local Audit Way',
      city: 'Austin',
      province: 'TX',
      zipCode: '78701',
      entryDate: dateAt('2022-08-15'),
      graduationDate: dateAt('2026-06-30'),
      transcriptDate: dateAt('2026-05-26'),
      account: {
        create: {
          email: STUDENT_EMAIL,
          passwordHash: studentPasswordHash,
          isActive: true,
        },
      },
      parentAccounts: {
        create: {
          email: PARENT_EMAIL,
          passwordHash: parentPasswordHash,
        },
      },
    },
  });

  const transcriptCreates = [];
  for (const [semesterIndex, semester] of SEMESTERS.entries()) {
    const semesterRows = [];
    for (const [courseIndex, slug] of semester.slugs.entries()) {
      const course = bySlug.get(slug);
      const avg = scoreFor(semesterIndex, courseIndex, 2);
      const gp = computeRowGpa({
        courseName: course.name,
        courseType: course.type,
        letterGrade: letterFromAverage(avg),
      });
      semesterRows.push({
        sortOrder: courseIndex,
        courseName: course.name,
        courseType: course.type,
        credits: course.credits,
        letterGrade: letterFromAverage(avg),
        weightedGpa: gp.weightedGpa,
        unweightedGpa: gp.unweightedGpa,
      });
    }
    transcriptCreates.push({
      studentId: student.id,
      key: semester.key,
      sortOrder: semesterIndex,
      releaseDate: null,
      courseRows: { create: semesterRows },
    });
  }

  for (const semester of transcriptCreates) {
    await prisma.semester.create({ data: semester });
  }

  for (const [semesterIndex, semester] of SEMESTERS.entries()) {
    const semesterDays = daysBetween(semester.start, semester.end);
    for (const [courseIndex, slug] of semester.slugs.entries()) {
      const course = bySlug.get(slug);
      const moduleOrders = course.modules.map((m) => m.order);
      const start = dateAt(semester.start, 9 + courseIndex);
      const spacing = Math.max(3, Math.floor((semesterDays - 20) / Math.max(moduleOrders.length, 1)));
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          semesterLabel: semester.key,
          completedModules: moduleOrders,
          creditEarned: true,
          creditEarnedAt: addDays(dateAt(semester.end), -2, 16),
        },
      });

      for (const [moduleIndex, moduleOrder] of moduleOrders.entries()) {
        const moduleStart = addDays(start, 4 + moduleIndex * spacing, 10);
        const quizAt = addDays(moduleStart, 1, 15);
        const submittedAt = addDays(moduleStart, 2, 18);
        const gradedAt = addDays(moduleStart, 4, 14);
        await prisma.moduleProgress.create({
          data: {
            enrollmentId: enrollment.id,
            moduleOrder,
            readingCompletedAt: moduleStart,
            videoCompletedAt: addDays(moduleStart, 0, 11),
            supplementalVideoCompletedAt: addDays(moduleStart, 0, 12),
            practiceCompletedAt: addDays(moduleStart, 1, 13),
            quizCompletedAt: quizAt,
            assignmentSubmittedAt: submittedAt,
            assignmentGradedAt: gradedAt,
            moduleCompletedAt: gradedAt,
            lastActivityAt: gradedAt,
          },
        });
        await prisma.moduleQuizAttempt.create({
          data: {
            enrollmentId: enrollment.id,
            moduleOrder,
            submittedAt: quizAt,
            score: scoreFor(semesterIndex, courseIndex, moduleIndex),
            passed: true,
            answers: { lifecycleAudit: true, moduleOrder },
          },
        });
        await prisma.assignmentSubmission.create({
          data: {
            enrollmentId: enrollment.id,
            moduleOrder,
            submittedAt,
            content: `Synthetic lifecycle-audit submission for ${course.name} module ${moduleOrder}.`,
            feedback: 'Synthetic local audit feedback: complete and aligned to module objective.',
            score: scoreFor(semesterIndex, courseIndex, moduleIndex + 1),
            gradedAt,
            gradedById: 'g9-g12-lifecycle-audit',
          },
        });
      }

      await prisma.examAttempt.createMany({
        data: [
          {
            enrollmentId: enrollment.id,
            examType: 'midterm',
            startedAt: addDays(dateAt(semester.start), Math.floor(semesterDays * 0.48), 9),
            submittedAt: addDays(dateAt(semester.start), Math.floor(semesterDays * 0.48), 11),
            score: scoreFor(semesterIndex, courseIndex, 3),
            passed: true,
            answers: { lifecycleAudit: true, examType: 'midterm' },
          },
          {
            enrollmentId: enrollment.id,
            examType: 'final',
            startedAt: addDays(dateAt(semester.end), -5, 9),
            submittedAt: addDays(dateAt(semester.end), -5, 11),
            score: scoreFor(semesterIndex, courseIndex, 4),
            passed: true,
            answers: { lifecycleAudit: true, examType: 'final' },
          },
        ],
      });
    }
  }

  const subscription = await prisma.subscription.create({
    data: {
      purchaserEmail: PARENT_EMAIL,
      stripeCustomerId: `g9g12_customer_${STUDENT_CODE}`,
      stripeSubscriptionId: `g9g12_subscription_${STUDENT_CODE}`,
      stripeCheckoutSessionId: `g9g12_checkout_${STUDENT_CODE}`,
      planType: 'premium_monthly',
      maxStudents: 1,
      status: 'active',
      currentPeriodEnd: dateAt('2026-06-30'),
      amountTotal: 29900,
      studentId: student.id,
    },
  });

  await prisma.studentCareState.create({
    data: {
      studentId: student.id,
      advisorOwner: 'Umi Advisor',
      status: 'progressing',
      riskLevel: 'watch',
      careTier: 'premium',
      manualOverride: false,
      lastReviewedAt: dateAt('2026-05-26'),
      nextCheckInDueAt: dateAt('2026-06-02'),
      currentGoal: 'Finalize graduation readiness and confirm parent-facing weekly support plan.',
      internalFlags: { lifecycleAudit: true, needsWorldLanguageAdvising: true },
    },
  });

  await prisma.studentCareLog.create({
    data: {
      studentId: student.id,
      type: 'graduation_review',
      visibility: 'parent_safe',
      title: 'Lifecycle audit graduation review',
      bodyInternal: 'Synthetic local audit note: staff reviewed G9-G12 progression, credit coverage, assessment evidence, and admissions-facing risks.',
      parentSummary: 'GIIS reviewed the student pathway, credits, and next steps for graduation readiness.',
      channel: 'internal',
      outcome: 'Graduation trajectory structurally complete; world-language recommendation and AP external-score planning remain advising notes.',
      followUpAt: dateAt('2026-06-02'),
      authorEmail: 'umi@genesisideas.school',
    },
  });

  const refreshed = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      account: true,
      parentAccounts: true,
      semesters: { orderBy: { sortOrder: 'asc' }, include: { courseRows: true } },
      enrollments: {
        include: {
          course: { include: { modules: true } },
          quizAttempts: true,
          assignments: true,
          examAttempts: true,
          moduleProgresses: true,
        },
      },
      subscriptions: true,
      loginSessions: true,
      careState: true,
      careLogs: { orderBy: { createdAt: 'desc' } },
    },
  });

  const transcriptRows = refreshed.semesters.flatMap((semester) => semester.courseRows);
  const totals = computeSemesterTotals(transcriptRows);
  const credits = classifyCredits(transcriptRows);
  const totalEstimatedHours = refreshed.enrollments.reduce((sum, enr) => (
    sum + enr.course.modules.reduce((courseSum, module) => courseSum + Number(module.estimatedHrs || 0), 0)
  ), 0);
  const totalModules = refreshed.enrollments.reduce((sum, enr) => sum + enr.course.modules.length, 0);
  const totalQuizAttempts = refreshed.enrollments.reduce((sum, enr) => sum + enr.quizAttempts.length, 0);
  const totalAssignments = refreshed.enrollments.reduce((sum, enr) => sum + enr.assignments.length, 0);
  const totalExams = refreshed.enrollments.reduce((sum, enr) => sum + enr.examAttempts.length, 0);
  const assessmentTrailComplete = refreshed.enrollments.every((enr) => (
    enr.moduleProgresses.length === enr.course.modules.length
    && enr.quizAttempts.length === enr.course.modules.length
    && enr.assignments.length === enr.course.modules.length
    && enr.examAttempts.some((exam) => exam.examType === 'midterm' && exam.passed)
    && enr.examAttempts.some((exam) => exam.examType === 'final' && exam.passed)
  ));
  const review = admissionsReview({
    credits,
    transcriptRows,
    enrollments: refreshed.enrollments,
    loginSessions: refreshed.loginSessions || [],
    totalEstimatedHours,
  });
  const result = {
    ok: assessmentTrailComplete
      && credits.total >= 24
      && credits.english >= 4
      && credits.math >= 4
      && credits.science >= 3
      && credits.socialStudies >= 3
      && totals.unweightedGPA !== '-'
      && refreshed.subscriptions.some((sub) => sub.status === 'active')
      && !!refreshed.careState
      && refreshed.careLogs.length > 0,
    application: { id: application.id, status: application.status, accountsCreated: application.accountsCreated },
    student: {
      id: refreshed.id,
      studentCode: refreshed.studentCode,
      loginEmail: refreshed.account.email,
      parentLoginEmail: refreshed.parentAccounts[0].email,
      parentContactEmail: refreshed.parentEmail,
    },
    payment: { id: subscription.id, status: subscription.status, planType: subscription.planType },
    learning: {
      semesters: refreshed.semesters.length,
      courses: refreshed.enrollments.length,
      modules: totalModules,
      moduleProgresses: refreshed.enrollments.reduce((sum, enr) => sum + enr.moduleProgresses.length, 0),
      quizAttempts: totalQuizAttempts,
      gradedAssignments: refreshed.enrollments.reduce((sum, enr) => sum + enr.assignments.filter((a) => a.gradedAt).length, 0),
      assignments: totalAssignments,
      examAttempts: totalExams,
      loginSessions: refreshed.loginSessions.length,
      estimatedHours: Number(totalEstimatedHours.toFixed(1)),
      assessmentTrailComplete,
    },
    care: {
      status: refreshed.careState?.status || null,
      riskLevel: refreshed.careState?.riskLevel || null,
      careTier: refreshed.careState?.careTier || null,
      advisorOwner: refreshed.careState?.advisorOwner || null,
      manualOverride: refreshed.careState?.manualOverride || false,
      careLogs: refreshed.careLogs.length,
      parentSafeCareLogs: refreshed.careLogs.filter((log) => log.visibility === 'parent_safe').length,
      latestCareLogType: refreshed.careLogs[0]?.type || null,
    },
    transcript: {
      rows: transcriptRows.length,
      totalCredits: credits.total,
      credits,
      unweightedGpa: totals.unweightedGPA,
      weightedGpa: totals.weightedGPA,
      graduationEligibleByCredits: credits.total >= 24,
      giisRequirementSnapshot: {
        english: `${credits.english}/4`,
        math: `${credits.math}/4`,
        science: `${credits.science}/3`,
        socialStudies: `${credits.socialStudies}/3`,
      },
      transcriptDate: refreshed.transcriptDate?.toISOString().slice(0, 10),
      graduationDate: refreshed.graduationDate?.toISOString().slice(0, 10),
    },
    admissionsOfficerReview: review,
    credentials: {
      studentEmail: STUDENT_EMAIL,
      studentPassword: DEFAULT_STUDENT_PASSWORD,
      parentEmail: PARENT_EMAIL,
      parentPassword: DEFAULT_PARENT_PASSWORD,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) throw new Error('G9-G12 lifecycle audit failed.');

  if (!KEEP_DATA) {
    await cleanup();
    console.log(JSON.stringify({ cleanup: 'complete', keptData: false, studentCode: STUDENT_CODE }, null, 2));
  } else {
    console.log(JSON.stringify({ cleanup: 'skipped', keptData: true, studentCode: STUDENT_CODE }, null, 2));
  }
}

main()
  .catch((err) => {
    console.error('[g9-g12-lifecycle-audit] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
