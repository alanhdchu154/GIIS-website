#!/usr/bin/env node
require('../lib/resolveDatabaseUrl');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const STUDENT_FILTER = (process.argv.find((arg) => arg.startsWith('--student=')) || '').split('=')[1] || '';

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreFromLetter(letter) {
  const key = String(letter || '').trim().toUpperCase();
  const scores = {
    'A+': 98,
    A: 95,
    'A-': 90,
    'B+': 88,
    B: 85,
    'B-': 80,
    'C+': 78,
    C: 75,
    'C-': 70,
    'D+': 68,
    D: 65,
    F: 55,
  };
  return scores[key] || null;
}

function displayAnswer(question) {
  const answer = String(question.answer || '').trim();
  const letterIndex = /^[A-D]$/i.test(answer) ? answer.toUpperCase().charCodeAt(0) - 65 : -1;
  if (letterIndex >= 0 && Array.isArray(question.options) && question.options[letterIndex]) {
    return question.options[letterIndex];
  }
  return answer;
}

function answersFor(questions) {
  return Object.fromEntries((questions || []).map((q) => [q.id, displayAnswer(q)]));
}

async function upsertModuleProgress(tx, enrollmentId, moduleOrder, at) {
  const data = {
    readingCompletedAt: at,
    videoCompletedAt: at,
    supplementalVideoCompletedAt: at,
    practiceCompletedAt: at,
    quizCompletedAt: at,
    moduleCompletedAt: at,
    lastActivityAt: at,
  };
  await tx.moduleProgress.upsert({
    where: { enrollmentId_moduleOrder: { enrollmentId, moduleOrder } },
    update: data,
    create: { enrollmentId, moduleOrder, ...data },
  });
}

function existingQuizSubmittedAt(enrollment, moduleOrder) {
  const attempt = (enrollment.quizAttempts || []).find((q) => q.moduleOrder === moduleOrder);
  return attempt?.submittedAt ? new Date(attempt.submittedAt) : null;
}

async function main() {
  const students = await prisma.student.findMany({
    where: {
      withdrawalDate: null,
      ...(STUDENT_FILTER
        ? {
            OR: [
              { id: STUDENT_FILTER },
              { studentCode: STUDENT_FILTER },
              { name: { contains: STUDENT_FILTER, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      semesters: {
        include: { courseRows: true },
        orderBy: { sortOrder: 'asc' },
      },
      enrollments: {
        include: {
          course: {
            include: {
              modules: { orderBy: { order: 'asc' } },
              quizQuestions: { orderBy: [{ moduleOrder: 'asc' }, { order: 'asc' }] },
              questions: { orderBy: [{ examType: 'asc' }, { order: 'asc' }] },
            },
          },
          quizAttempts: true,
          examAttempts: true,
          moduleProgresses: true,
        },
        orderBy: { enrolledAt: 'asc' },
      },
    },
  });

  const planned = [];
  const skipped = [];
  const now = new Date();

  for (const student of students) {
    const transcriptRows = student.semesters.flatMap((semester) => semester.courseRows || []);
    const transcriptByCourse = new Map(
      transcriptRows
        .filter((row) => row.courseName && row.letterGrade)
        .map((row) => [normalize(row.courseName), row])
    );

    for (const enrollment of student.enrollments) {
      const row = transcriptByCourse.get(normalize(enrollment.course.name));
      const targetScore = scoreFromLetter(row?.letterGrade);
      if (!row || targetScore === null) {
        skipped.push({
          student: student.name,
          course: enrollment.course.name,
          reason: row ? `unsupported transcript grade ${row.letterGrade}` : 'no matching transcript row',
        });
        continue;
      }

      const moduleOrders = enrollment.course.modules.map((m) => m.order);
      const existingQuizOrders = new Set(enrollment.quizAttempts.map((q) => q.moduleOrder));
      const existingProgressOrders = new Set(
        enrollment.moduleProgresses
          .filter((progress) => progress.moduleCompletedAt)
          .map((progress) => progress.moduleOrder)
      );
      const missingQuizModules = moduleOrders.filter((order) => !existingQuizOrders.has(order));
      const missingProgressModules = moduleOrders.filter((order) => !existingProgressOrders.has(order));
      const hasMidterm = enrollment.examAttempts.some((a) => a.examType === 'midterm' && a.submittedAt);
      const hasFinal = enrollment.examAttempts.some((a) => a.examType === 'final' && a.submittedAt);
      const needsCredit = !enrollment.creditEarned;

      if (
        missingQuizModules.length === 0 &&
        missingProgressModules.length === 0 &&
        hasMidterm &&
        hasFinal &&
        !needsCredit
      ) {
        continue;
      }

      planned.push({
        student: student.name,
        studentCode: student.studentCode,
        course: enrollment.course.name,
        transcriptGrade: row.letterGrade,
        targetScore,
        missingQuizModules,
        missingProgressModules,
        missingExams: [hasMidterm ? null : 'midterm', hasFinal ? null : 'final'].filter(Boolean),
        needsCredit,
      });

      if (!APPLY) continue;

      const quizQuestionsByModule = new Map();
      for (const question of enrollment.course.quizQuestions || []) {
        if (!quizQuestionsByModule.has(question.moduleOrder)) quizQuestionsByModule.set(question.moduleOrder, []);
        quizQuestionsByModule.get(question.moduleOrder).push(question);
      }
      const examQuestionsByType = new Map();
      for (const question of enrollment.course.questions || []) {
        if (!examQuestionsByType.has(question.examType)) examQuestionsByType.set(question.examType, []);
        examQuestionsByType.get(question.examType).push(question);
      }

      await prisma.$transaction(async (tx) => {
        for (const moduleOrder of missingQuizModules) {
          await tx.moduleQuizAttempt.create({
            data: {
              enrollmentId: enrollment.id,
              moduleOrder,
              submittedAt: now,
              score: targetScore,
              passed: targetScore >= 70,
              answers: answersFor(quizQuestionsByModule.get(moduleOrder) || []),
            },
          });
        }
        for (const moduleOrder of moduleOrders) {
          await upsertModuleProgress(
            tx,
            enrollment.id,
            moduleOrder,
            existingQuizSubmittedAt(enrollment, moduleOrder) || now
          );
        }
        if (!hasMidterm) {
          await tx.examAttempt.create({
            data: {
              enrollmentId: enrollment.id,
              examType: 'midterm',
              startedAt: now,
              submittedAt: now,
              score: targetScore,
              passed: targetScore >= 70,
              answers: answersFor(examQuestionsByType.get('midterm') || []),
            },
          });
        }
        if (!hasFinal) {
          await tx.examAttempt.create({
            data: {
              enrollmentId: enrollment.id,
              examType: 'final',
              startedAt: now,
              submittedAt: now,
              score: targetScore,
              passed: targetScore >= 70,
              answers: answersFor(examQuestionsByType.get('final') || []),
            },
          });
        }
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            completedModules: moduleOrders,
            creditEarned: targetScore >= 70,
            creditEarnedAt: targetScore >= 70 ? now : null,
          },
        });
        await tx.auditLog.create({
          data: {
            action: 'learn_portal_completion_repair',
            studentId: student.id,
            actorRole: 'admin',
            actorEmail: 'script:repair-learn-completions-from-transcripts',
          },
        });
      });
    }
  }

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    studentFilter: STUDENT_FILTER || null,
    planned,
    skipped,
    summary: {
      studentsScanned: students.length,
      enrollmentsToRepair: planned.length,
      skippedEnrollments: skipped.length,
    },
  }, null, 2));
}

main()
  .catch((err) => {
    console.error('[repair-learn-completions-from-transcripts] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
