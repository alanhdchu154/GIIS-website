#!/usr/bin/env node
require('../lib/resolveDatabaseUrl');

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { computeRowGpa, computeSemesterTotals } = require('../src/lib/gpa');
const {
  DEFAULT_PARENT_PASSWORD,
  DEFAULT_STUDENT_PASSWORD,
  parentLoginEmailForStudentEmail,
} = require('../src/lib/parentCredentials');

const prisma = new PrismaClient();

const APPLY_CLEANUP = process.argv.includes('--cleanup');
const STUDENT_CODE = 'GIIS-V1-SMOKE';
const STUDENT_EMAIL = 'v1.smoke.student@genesisideas.school';
const PARENT_EMAIL = parentLoginEmailForStudentEmail(STUDENT_EMAIL);
const CONTACT_EMAIL = 'v1.smoke.parent@example.com';

function dateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function cleanup() {
  await prisma.subscription.deleteMany({
    where: {
      OR: [
        { purchaserEmail: PARENT_EMAIL },
        { purchaserEmail: CONTACT_EMAIL },
        { stripeCheckoutSessionId: `v1_smoke_checkout_${STUDENT_CODE}` },
        { stripeSubscriptionId: `v1_smoke_subscription_${STUDENT_CODE}` },
      ],
    },
  });
  await prisma.application.deleteMany({
    where: { parentEmail: CONTACT_EMAIL },
  });
  const existing = await prisma.student.findUnique({ where: { studentCode: STUDENT_CODE } });
  if (existing) await prisma.student.delete({ where: { id: existing.id } });
}

async function selectCourses() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ department: 'asc' }, { name: 'asc' }],
    include: {
      modules: { orderBy: { order: 'asc' } },
      _count: { select: { modules: true } },
    },
    take: 40,
  });
  const usable = courses.filter((course) => course.modules.length >= 3);
  if (usable.length < 4) throw new Error('Need at least four published courses with modules for v1 lifecycle smoke.');
  return usable.slice(0, 4);
}

function transcriptCourseRows(courses) {
  const semesterKeys = [
    'Grade 9 - Fall Semester',
    'Grade 9 - Spring Semester',
    'Grade 10 - Fall Semester',
    'Grade 10 - Spring Semester',
    'Grade 11 - Fall Semester',
    'Grade 11 - Spring Semester',
    'Grade 12 - Fall Semester',
    'Grade 12 - Spring Semester',
  ];
  const rows = [];
  const grades = ['A', 'A-', 'B+', 'A', 'B', 'A-', 'A', 'A-', 'B+', 'A', 'A-', 'B+', 'A', 'A-', 'B+', 'A', 'A-', 'B+', 'A', 'A-', 'B+', 'A', 'A-', 'A'];
  let gradeIndex = 0;
  for (const [semesterIndex, key] of semesterKeys.entries()) {
    const semesterRows = [];
    for (let sortOrder = 0; sortOrder < 3; sortOrder += 1) {
      const course = courses[(semesterIndex + sortOrder) % courses.length];
      const courseName = semesterIndex === 7 && sortOrder < courses.length
        ? courses[sortOrder].name
        : `${course.name}${semesterIndex < 7 ? ` Survey ${semesterIndex + 1}.${sortOrder + 1}` : ''}`;
      const letterGrade = grades[gradeIndex++] || 'A-';
      const gp = computeRowGpa({ courseName, courseType: course.type, letterGrade });
      semesterRows.push({
        sortOrder,
        courseName,
        courseType: course.type,
        credits: 1,
        letterGrade,
        weightedGpa: gp.weightedGpa,
        unweightedGpa: gp.unweightedGpa,
      });
    }
    rows.push({
      key,
      sortOrder: semesterIndex,
      releaseDate: null,
      courseRows: { create: semesterRows },
    });
  }
  return rows;
}

async function main() {
  await cleanup();
  const courses = await selectCourses();
  const studentPasswordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 12);
  const parentPasswordHash = await bcrypt.hash(DEFAULT_PARENT_PASSWORD, 12);

  const application = await prisma.application.create({
    data: {
      studentName: 'V1 Smoke Student',
      dob: '2008-05-01',
      gradeLevel: 'Grade 12',
      currentSchool: 'GIIS lifecycle smoke',
      targetUniversities: 'Operational readiness',
      preferredLanguage: 'en',
      parentName: 'V1 Smoke Parent',
      parentEmail: CONTACT_EMAIL,
      phone: '000-000-0000',
      notes: 'Temporary v1 lifecycle smoke application; safe to delete.',
      status: 'approved',
      accountsCreated: true,
      reviewedAt: new Date(),
    },
  });

  const student = await prisma.student.create({
    data: {
      studentCode: STUDENT_CODE,
      name: 'V1 Smoke Student',
      birthDate: dateOnly('2008-05-01'),
      gender: 'Female',
      parentGuardian: 'V1 Smoke Parent',
      parentEmail: CONTACT_EMAIL,
      address: '1 Lifecycle Smoke Way',
      city: 'Austin',
      province: 'TX',
      zipCode: '78701',
      entryDate: dateOnly('2022-08-15'),
      graduationDate: dateOnly('2026-06-30'),
      transcriptDate: new Date(),
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
      semesters: { create: transcriptCourseRows(courses) },
    },
    include: {
      account: true,
      parentAccounts: true,
      semesters: { include: { courseRows: true } },
    },
  });

  const now = new Date();
  const enrollments = [];
  for (const course of courses) {
    const moduleOrders = course.modules.map((m) => m.order);
    const finalModule = moduleOrders[moduleOrders.length - 1];
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        semesterLabel: 'Grade 12 - Spring Semester',
        completedModules: moduleOrders,
        creditEarned: true,
        creditEarnedAt: now,
        quizAttempts: {
          create: moduleOrders.map((moduleOrder, index) => ({
            moduleOrder,
            score: 90 + (index % 8),
            passed: true,
            answers: { smoke: true, moduleOrder },
          })),
        },
        moduleProgresses: {
          create: moduleOrders.map((moduleOrder) => ({
            moduleOrder,
            readingCompletedAt: now,
            videoCompletedAt: now,
            practiceCompletedAt: now,
            quizCompletedAt: now,
            moduleCompletedAt: now,
            lastActivityAt: now,
          })),
        },
        assignments: {
          create: {
            moduleOrder: finalModule,
            content: 'V1 smoke capstone submission.',
            feedback: 'V1 smoke feedback: complete, organized, and ready for records.',
            score: 94,
            submittedAt: now,
            gradedAt: now,
            gradedById: 'v1-smoke',
          },
        },
        examAttempts: {
          create: [
            { examType: 'midterm', submittedAt: now, score: 91, passed: true, answers: { smoke: true, examType: 'midterm' } },
            { examType: 'final', submittedAt: now, score: 94, passed: true, answers: { smoke: true, examType: 'final' } },
          ],
        },
      },
      include: {
        course: { select: { name: true, slug: true, credits: true, _count: { select: { modules: true } } } },
        quizAttempts: true,
        moduleProgresses: true,
        assignments: true,
        examAttempts: true,
      },
    });
    enrollments.push(enrollment);
  }

  const subscription = await prisma.subscription.create({
    data: {
      purchaserEmail: PARENT_EMAIL,
      stripeCustomerId: `v1_smoke_customer_${STUDENT_CODE}`,
      stripeSubscriptionId: `v1_smoke_subscription_${STUDENT_CODE}`,
      stripeCheckoutSessionId: `v1_smoke_checkout_${STUDENT_CODE}`,
      planType: 'founders_monthly',
      maxStudents: 1,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amountTotal: 1990,
      studentId: student.id,
    },
  });

  const refreshed = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      account: true,
      parentAccounts: true,
      semesters: { include: { courseRows: true }, orderBy: { sortOrder: 'asc' } },
      enrollments: {
        include: {
          quizAttempts: true,
          examAttempts: true,
          assignments: true,
          moduleProgresses: true,
          course: { include: { modules: true } },
        },
      },
      subscriptions: true,
    },
  });

  const transcriptRows = refreshed.semesters.flatMap((semester) => semester.courseRows || []);
  const gradedRows = transcriptRows.filter((row) => row.courseName && row.letterGrade);
  const totalCredits = gradedRows.reduce((sum, row) => sum + Number(row.credits || 0), 0);
  const totals = computeSemesterTotals(gradedRows);
  const completedEnrollments = refreshed.enrollments.filter((enr) => enr.creditEarned);
  const gpaComputed = totals.unweightedGPA !== '-' && totals.weightedGPA !== '-';
  const completeAssessmentTrail = refreshed.enrollments.every((enr) => {
    const moduleCount = enr.course.modules.length;
    return moduleCount >= 3
    && enr.quizAttempts.length >= moduleCount
    && enr.moduleProgresses.length >= moduleCount
    && enr.examAttempts.some((exam) => exam.examType === 'midterm' && exam.passed)
    && enr.examAttempts.some((exam) => exam.examType === 'final' && exam.passed)
    && enr.assignments.some((assignment) => assignment.gradedAt);
  });

  const result = {
    ok: totalCredits >= 24 && gpaComputed && refreshed.subscriptions.some((sub) => sub.status === 'active') && completeAssessmentTrail,
    application: {
      id: application.id,
      status: application.status,
      accountsCreated: application.accountsCreated,
    },
    student: {
      id: student.id,
      studentCode: student.studentCode,
      loginEmail: refreshed.account.email,
      parentLoginEmail: refreshed.parentAccounts[0].email,
      parentContactEmail: refreshed.parentEmail,
    },
    payment: {
      id: subscription.id,
      status: subscription.status,
      linkedStudentId: subscription.studentId,
    },
    learning: {
      enrolledCourses: refreshed.enrollments.length,
      completedEnrollments: completedEnrollments.length,
      quizAttempts: refreshed.enrollments.reduce((sum, enr) => sum + enr.quizAttempts.length, 0),
      examAttempts: refreshed.enrollments.reduce((sum, enr) => sum + enr.examAttempts.length, 0),
      gradedAssignments: refreshed.enrollments.reduce((sum, enr) => sum + enr.assignments.filter((a) => a.gradedAt).length, 0),
      moduleProgresses: refreshed.enrollments.reduce((sum, enr) => sum + enr.moduleProgresses.length, 0),
      completeAssessmentTrail,
    },
    transcript: {
      semesters: refreshed.semesters.length,
      rows: transcriptRows.length,
      totalCredits,
      unweightedGpa: totals.unweightedGPA,
      weightedGpa: totals.weightedGPA,
      gpaComputed,
      graduationEligibleByCredits: totalCredits >= 24,
      transcriptDate: refreshed.transcriptDate?.toISOString().slice(0, 10),
      graduationDate: refreshed.graduationDate?.toISOString().slice(0, 10),
    },
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) throw new Error('V1 lifecycle smoke verification failed');

  if (APPLY_CLEANUP) {
    await cleanup();
    const leftover = await prisma.student.findUnique({ where: { studentCode: STUDENT_CODE } });
    console.log(JSON.stringify({ cleanup: 'complete', leftoverStudent: !!leftover }, null, 2));
  } else {
    console.log('\nSmoke data was left in place. Re-run with --cleanup to delete it.');
  }
}

main()
  .catch((err) => {
    console.error('[v1-lifecycle-smoke] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
