#!/usr/bin/env node
require('../lib/resolveDatabaseUrl');

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { computeRowGpa } = require('../src/lib/gpa');

const prisma = new PrismaClient();

const STUDENT_CODE = 'GIIS-SMOKE-20260519';
const STUDENT_EMAIL = 'codex.smoke.student@genesisideas.school';
const PARENT_EMAIL = 'codex.smoke.parent@genesisideas.school';
const TEMP_PASSWORD = 'SmokeTest2026!';

function dateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  const course = await prisma.course.findFirst({
    where: { isPublished: true },
    orderBy: { modules: { _count: 'desc' } },
    include: {
      modules: { orderBy: { order: 'asc' }, take: 3 },
      _count: { select: { modules: true } },
    },
  });
  if (!course) {
    throw new Error('No published course found. Seed or publish at least one course before running this smoke test.');
  }

  await prisma.subscription.deleteMany({
    where: {
      OR: [
        { purchaserEmail: PARENT_EMAIL },
        { stripeCheckoutSessionId: `smoke_checkout_${STUDENT_CODE}` },
      ],
    },
  });

  const existing = await prisma.student.findUnique({ where: { studentCode: STUDENT_CODE } });
  if (existing) {
    await prisma.student.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12);
  const gpas = computeRowGpa({
    courseName: course.name,
    courseType: course.type,
    letterGrade: 'A-',
  });

  const moduleOrders = course.modules.map((m) => m.order);
  const completedModules = moduleOrders.length ? moduleOrders : [1];
  const finalModule = completedModules[completedModules.length - 1];

  const student = await prisma.student.create({
    data: {
      studentCode: STUDENT_CODE,
      name: 'Codex Smoke Student',
      birthDate: dateOnly('2009-09-09'),
      gender: 'Female',
      parentGuardian: 'Codex Smoke Parent',
      parentEmail: PARENT_EMAIL,
      address: '123 Smoke Test Way',
      city: 'Austin',
      province: 'TX',
      zipCode: '78701',
      entryDate: dateOnly('2025-08-15'),
      graduationDate: dateOnly('2029-06-15'),
      transcriptDate: dateOnly('2026-05-19'),
      account: {
        create: {
          email: STUDENT_EMAIL,
          passwordHash,
          isActive: true,
        },
      },
      parentAccounts: {
        create: {
          email: PARENT_EMAIL,
          passwordHash,
        },
      },
      semesters: {
        create: {
          key: 'Grade 9 - Spring Semester',
          sortOrder: 1,
          releaseDate: null,
          courseRows: {
            create: {
              sortOrder: 0,
              courseName: course.name,
              courseType: course.type,
              credits: course.credits,
              letterGrade: 'A-',
              weightedGpa: gpas.weightedGpa,
              unweightedGpa: gpas.unweightedGpa,
            },
          },
        },
      },
    },
    include: {
      account: true,
      parentAccounts: true,
      semesters: { include: { courseRows: true } },
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      semesterLabel: 'G9 Spring',
      completedModules,
      creditEarned: true,
      creditEarnedAt: new Date(),
      quizAttempts: {
        create: completedModules.map((moduleOrder, index) => ({
          moduleOrder,
          score: [92, 88, 95][index] || 90,
          passed: true,
          answers: { smoke: true, moduleOrder },
        })),
      },
      assignments: {
        create: {
          moduleOrder: finalModule,
          content: 'Smoke-test assignment submission for lifecycle verification.',
          feedback: 'Strong work. Evidence is organized and complete.',
          score: 95,
          gradedAt: new Date(),
          gradedById: 'codex-smoke',
        },
      },
      examAttempts: {
        create: [
          {
            examType: 'midterm',
            submittedAt: new Date(),
            score: 90,
            passed: true,
            answers: { smoke: true, examType: 'midterm' },
          },
          {
            examType: 'final',
            submittedAt: new Date(),
            score: 93,
            passed: true,
            answers: { smoke: true, examType: 'final' },
          },
        ],
      },
    },
    include: {
      course: { select: { name: true, slug: true, credits: true, _count: { select: { modules: true } } } },
      quizAttempts: true,
      assignments: true,
      examAttempts: true,
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      purchaserEmail: PARENT_EMAIL,
      stripeCustomerId: `smoke_customer_${STUDENT_CODE}`,
      stripeSubscriptionId: `smoke_subscription_${STUDENT_CODE}`,
      stripeCheckoutSessionId: `smoke_checkout_${STUDENT_CODE}`,
      planType: 'founders_monthly',
      maxStudents: 1,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amountTotal: 1990,
      studentId: student.id,
    },
  });

  const audit = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      account: true,
      parentAccounts: true,
      enrollments: {
        include: {
          course: { select: { name: true, slug: true, credits: true, _count: { select: { modules: true } } } },
          quizAttempts: true,
          assignments: true,
          examAttempts: true,
        },
      },
      semesters: { include: { courseRows: true } },
      subscriptions: true,
    },
  });

  const transcriptRows = audit.semesters.flatMap((semester) => semester.courseRows);
  const parentProjection = {
    creditsEarned: transcriptRows
      .filter((row) => row.courseName && row.letterGrade)
      .reduce((sum, row) => sum + Number(row.credits || 0), 0),
    totalEnrollments: audit.enrollments.length,
    recentActivity: enrollment.quizAttempts.length + enrollment.assignments.length + enrollment.examAttempts.length,
    activeSubscription: audit.subscriptions.some((sub) => sub.status === 'active'),
  };

  const result = {
    ok: true,
    student: {
      id: student.id,
      name: student.name,
      studentCode: student.studentCode,
      loginEmail: student.account.email,
      parentEmail: student.parentEmail,
      parentLoginEmail: student.parentAccounts[0].email,
    },
    course: {
      name: enrollment.course.name,
      slug: enrollment.course.slug,
      credits: Number(enrollment.course.credits),
      completedModules: enrollment.completedModules,
      totalModules: enrollment.course._count.modules,
      creditEarned: enrollment.creditEarned,
      quizAttempts: enrollment.quizAttempts.length,
      assignmentScore: Number(enrollment.assignments[0].score),
      midtermScore: Number(enrollment.examAttempts.find((x) => x.examType === 'midterm').score),
      finalScore: Number(enrollment.examAttempts.find((x) => x.examType === 'final').score),
    },
    transcript: {
      semester: student.semesters[0].key,
      courseName: student.semesters[0].courseRows[0].courseName,
      letterGrade: student.semesters[0].courseRows[0].letterGrade,
      credits: Number(student.semesters[0].courseRows[0].credits),
      unweightedGpa: Number(student.semesters[0].courseRows[0].unweightedGpa),
      weightedGpa: Number(student.semesters[0].courseRows[0].weightedGpa),
    },
    subscription: {
      id: subscription.id,
      status: subscription.status,
      planType: subscription.planType,
      linkedStudentId: subscription.studentId,
    },
    parentProjection,
    credentials: {
      studentEmail: STUDENT_EMAIL,
      parentEmail: PARENT_EMAIL,
      temporaryPassword: TEMP_PASSWORD,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error('[smoke-student-lifecycle] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
