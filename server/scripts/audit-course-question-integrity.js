#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const SERVER_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SERVER_ROOT, '..');
const COURSE_DIR = path.join(SERVER_ROOT, 'prisma', 'courses');

dotenv.config({ path: path.join(SERVER_ROOT, '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const apply = process.argv.includes('--apply');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function normalize(value) {
  return String(value ?? '').trim();
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return null;
  return options.map(normalize);
}

function answerFromLetter(answer, options) {
  const index = /^[A-D]$/i.test(answer) ? answer.toUpperCase().charCodeAt(0) - 65 : -1;
  return index >= 0 && Array.isArray(options) ? normalize(options[index]) : '';
}

function isMultipleChoiceQuestion(question) {
  const type = normalize(question.type).toLowerCase();
  if (type && type !== 'mc' && type !== 'multiple_choice' && type !== 'multiple-choice') return false;
  return type === 'mc' || Array.isArray(question.options);
}

function isSameArray(a, b) {
  if (a == null && b == null) return true;
  const aa = normalizeOptions(a);
  const bb = normalizeOptions(b);
  if (!aa || !bb || aa.length !== bb.length) return false;
  return aa.every((value, index) => value === bb[index]);
}

function validateMultipleChoice(question, context) {
  if (!isMultipleChoiceQuestion(question)) return null;
  const options = normalizeOptions(question.options);
  const answer = normalize(question.answer);
  if (!options || options.length < 2 || options.some((option) => !option)) {
    return { ...context, issue: 'bad_options', answer, options: question.options };
  }
  if (!answer) return { ...context, issue: 'missing_answer', options: question.options };
  if (options.includes(answer)) return null;
  const letterAnswer = answerFromLetter(answer, options);
  if (letterAnswer) {
    return { ...context, issue: 'normalizable_answer_key', answer, normalizedAnswer: letterAnswer, options: question.options };
  }
  return { ...context, issue: 'answer_not_in_options', answer, options: question.options };
}

function loadSourceCourses() {
  const courses = new Map();
  const sourceIssues = [];
  for (const file of walk(COURSE_DIR)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rel = path.relative(REPO_ROOT, file);
    const questions = data.questions || [];
    const quizQuestions = data.quizQuestions || [];
    for (const question of questions) {
      const issue = validateMultipleChoice(question, {
        source: rel,
        course: data.slug,
        table: 'source.questions',
        examType: question.examType || 'final',
        order: question.order,
      });
      if (issue && issue.issue !== 'normalizable_answer_key') sourceIssues.push(issue);
    }
    for (const question of quizQuestions) {
      const issue = validateMultipleChoice(question, {
        source: rel,
        course: data.slug,
        table: 'source.quizQuestions',
        moduleOrder: question.moduleOrder,
        order: question.order,
      });
      if (issue && issue.issue !== 'normalizable_answer_key') sourceIssues.push(issue);
    }
    courses.set(data.slug, { file: rel, data, questions, quizQuestions });
  }
  return { courses, sourceIssues };
}

function makeExamKey(question) {
  return `${question.examType || 'final'}:${question.order}`;
}

function makeQuizKey(question) {
  return `${question.moduleOrder}:${question.order}`;
}

function sourceExamPayload(sourceQuestion, courseId) {
  return {
    courseId,
    examType: sourceQuestion.examType || 'final',
    order: Number(sourceQuestion.order),
    question: sourceQuestion.question || '',
    type: sourceQuestion.type || 'mc',
    options: sourceQuestion.options ?? null,
    answer: sourceQuestion.answer || '',
    explanation: sourceQuestion.explanation || '',
    points: Number(sourceQuestion.points || 1),
  };
}

function sourceQuizPayload(sourceQuestion, courseId) {
  return {
    courseId,
    moduleOrder: Number(sourceQuestion.moduleOrder),
    order: Number(sourceQuestion.order),
    question: sourceQuestion.question || '',
    options: sourceQuestion.options ?? null,
    answer: sourceQuestion.answer || '',
    explanation: sourceQuestion.explanation || '',
    points: Number(sourceQuestion.points || 1),
  };
}

function differsFromSource(dbQuestion, sourceQuestion, fields) {
  return fields.some((field) => {
    if (field === 'options') return !isSameArray(dbQuestion.options, sourceQuestion.options);
    return normalize(dbQuestion[field]) !== normalize(sourceQuestion[field]);
  });
}

async function main() {
  const { courses: sourceCourses, sourceIssues } = loadSourceCourses();
  const dbCourses = await prisma.course.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      questions: {
        select: { id: true, examType: true, order: true, question: true, type: true, options: true, answer: true, explanation: true, points: true },
      },
      quizQuestions: {
        select: { id: true, moduleOrder: true, order: true, question: true, options: true, answer: true, explanation: true, points: true },
      },
    },
  });

  const issues = [];
  const actions = [];

  for (const dbCourse of dbCourses) {
    const source = sourceCourses.get(dbCourse.slug);
    if (!source) {
      issues.push({ course: dbCourse.slug, issue: 'db_course_missing_source' });
      continue;
    }

    const sourceExamByKey = new Map(source.questions.map((question) => [makeExamKey(question), question]));
    const dbExamByKey = new Map(dbCourse.questions.map((question) => [makeExamKey(question), question]));
    for (const dbQuestion of dbCourse.questions) {
      if (String(dbQuestion.type || 'mc').toLowerCase() === 'mc') {
        const issue = validateMultipleChoice(dbQuestion, {
          course: dbCourse.slug,
          table: 'ExamQuestion',
          examType: dbQuestion.examType,
          order: dbQuestion.order,
          id: dbQuestion.id,
        });
        if (issue) issues.push(issue);
      }
      const sourceQuestion = sourceExamByKey.get(makeExamKey(dbQuestion));
      if (!sourceQuestion) {
        issues.push({ course: dbCourse.slug, table: 'ExamQuestion', issue: 'db_question_missing_source', examType: dbQuestion.examType, order: dbQuestion.order, id: dbQuestion.id });
      } else if (differsFromSource(dbQuestion, sourceQuestion, ['question', 'type', 'options', 'answer', 'explanation', 'points'])) {
        issues.push({ course: dbCourse.slug, table: 'ExamQuestion', issue: 'db_differs_from_source', examType: dbQuestion.examType, order: dbQuestion.order, id: dbQuestion.id });
        actions.push({ table: 'ExamQuestion', id: dbQuestion.id, data: sourceExamPayload(sourceQuestion, dbCourse.id) });
      }
    }
    for (const [key, sourceQuestion] of sourceExamByKey) {
      if (!dbExamByKey.has(key)) {
        issues.push({ course: dbCourse.slug, table: 'ExamQuestion', issue: 'db_question_missing', examType: sourceQuestion.examType || 'final', order: sourceQuestion.order });
        actions.push({ table: 'ExamQuestion', create: true, data: sourceExamPayload(sourceQuestion, dbCourse.id) });
      }
    }

    const sourceQuizByKey = new Map(source.quizQuestions.map((question) => [makeQuizKey(question), question]));
    const dbQuizByKey = new Map(dbCourse.quizQuestions.map((question) => [makeQuizKey(question), question]));
    for (const dbQuestion of dbCourse.quizQuestions) {
      const issue = validateMultipleChoice(dbQuestion, {
        course: dbCourse.slug,
        table: 'ModuleQuizQuestion',
        moduleOrder: dbQuestion.moduleOrder,
        order: dbQuestion.order,
        id: dbQuestion.id,
      });
      if (issue) issues.push(issue);
      const sourceQuestion = sourceQuizByKey.get(makeQuizKey(dbQuestion));
      if (!sourceQuestion) {
        issues.push({ course: dbCourse.slug, table: 'ModuleQuizQuestion', issue: 'db_question_missing_source', moduleOrder: dbQuestion.moduleOrder, order: dbQuestion.order, id: dbQuestion.id });
      } else if (differsFromSource(dbQuestion, sourceQuestion, ['question', 'options', 'answer', 'explanation', 'points'])) {
        issues.push({ course: dbCourse.slug, table: 'ModuleQuizQuestion', issue: 'db_differs_from_source', moduleOrder: dbQuestion.moduleOrder, order: dbQuestion.order, id: dbQuestion.id });
        actions.push({ table: 'ModuleQuizQuestion', id: dbQuestion.id, data: sourceQuizPayload(sourceQuestion, dbCourse.id) });
      }
    }
    for (const [key, sourceQuestion] of sourceQuizByKey) {
      if (!dbQuizByKey.has(key)) {
        issues.push({ course: dbCourse.slug, table: 'ModuleQuizQuestion', issue: 'db_question_missing', moduleOrder: sourceQuestion.moduleOrder, order: sourceQuestion.order });
        actions.push({ table: 'ModuleQuizQuestion', create: true, data: sourceQuizPayload(sourceQuestion, dbCourse.id) });
      }
    }
  }

  if (sourceIssues.length > 0) {
    console.error(JSON.stringify({ sourceIssues }, null, 2));
    process.exitCode = 2;
    return;
  }

  if (apply && actions.length > 0) {
    for (const action of actions) {
      if (action.table === 'ExamQuestion') {
        if (action.create) await prisma.examQuestion.create({ data: action.data });
        else await prisma.examQuestion.update({ where: { id: action.id }, data: action.data });
      } else if (action.table === 'ModuleQuizQuestion') {
        if (action.create) await prisma.moduleQuizQuestion.create({ data: action.data });
        else await prisma.moduleQuizQuestion.update({ where: { id: action.id }, data: action.data });
      }
    }
  }

  const summary = {
    sourceFiles: sourceCourses.size,
    dbCourses: dbCourses.length,
    issues: issues.length,
    repairActions: actions.length,
    applied: apply,
    issueSummary: issues.reduce((acc, issue) => {
      acc[issue.issue] = (acc[issue.issue] || 0) + 1;
      return acc;
    }, {}),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!apply && issues.length > 0) {
    console.log('Run `npm run repair:course-question-integrity` from server/ to apply source-of-truth repairs.');
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
