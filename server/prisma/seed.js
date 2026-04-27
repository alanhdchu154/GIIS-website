/* eslint-disable no-console */
require('../lib/resolveDatabaseUrl');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { computeRowGpa } = require('../src/lib/gpa');

const prisma = new PrismaClient();

function courseRow(sortOrder, courseName, courseType, credits, letterGrade) {
  const gp = computeRowGpa({ courseName, courseType, letterGrade });
  return {
    sortOrder,
    courseName,
    courseType,
    credits: Number.isFinite(parseFloat(String(credits))) ? parseFloat(String(credits)) : null,
    letterGrade,
    weightedGpa: gp.weightedGpa,
    unweightedGpa: gp.unweightedGpa,
  };
}

function makeSemesters(coursesBySemester) {
  return coursesBySemester.map(({ key, sortOrder, courses }) => ({
    key,
    sortOrder,
    courseRows: { create: courses },
  }));
}

// ── Ruwen Li (Class of 2026, #001) ────────────────────────────────────────────
const ruwenLiSemesters = makeSemesters([
  {
    key: 'Grade 9 - Fall Semester', sortOrder: 0, courses: [
      courseRow(0, 'English I',                           'Core',     '1',   'A-'),
      courseRow(1, 'Algebra I',                           'Core',     '1',   'A-'),
      courseRow(2, 'Biology',                             'Core',     '1',   'B+'),
      courseRow(3, 'World History',                       'Core',     '0.5', 'A-'),
      courseRow(4, 'Business Technology & Digital Literacy', 'Elective', '0.5', 'A'),
      courseRow(5, 'Introduction to Business & Economics', 'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 9 - Spring Semester', sortOrder: 1, courses: [
      courseRow(0, 'English I - Writing',                 'Core',     '1',   'A-'),
      courseRow(1, 'Geometry',                            'Core',     '1',   'A-'),
      courseRow(2, 'Environmental Science',               'Core',     '1',   'A-'),
      courseRow(3, 'Geography',                           'Core',     '0.5', 'A-'),
      courseRow(4, 'Business Media Literacy',             'Elective', '0.5', 'A'),
      courseRow(5, 'Entrepreneurship Fundamentals',       'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Fall Semester', sortOrder: 2, courses: [
      courseRow(0, 'English II',                          'Core',     '1',   'A-'),
      courseRow(1, 'Algebra II',                          'Core',     '1',   'A-'),
      courseRow(2, 'Chemistry',                           'Core',     '1',   'B+'),
      courseRow(3, 'U.S. History',                        'Core',     '0.5', 'A'),
      courseRow(4, 'Marketing & Communication',           'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Spring Semester', sortOrder: 3, courses: [
      courseRow(0, 'English II - Literature',             'Core',     '1',   'A-'),
      courseRow(1, 'Pre-Calculus',                        'Core',     '1',   'A-'),
      courseRow(2, 'Physics Fundamentals',                'Core',     '1',   'B+'),
      courseRow(3, 'Global Economics & Politics',         'Core',     '0.5', 'A'),
      courseRow(4, 'Leadership Communication',            'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Fall Semester', sortOrder: 4, courses: [
      courseRow(0, 'English III',                         'Core',     '1',   'A'),
      courseRow(1, 'Statistics',                          'Core',     '1',   'A-'),
      courseRow(2, 'Economics',                           'Core',     '1',   'A-'),
      courseRow(3, 'Digital Marketing',                   'Elective', '0.5', 'A'),
      courseRow(4, 'Business Writing',                    'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Spring Semester', sortOrder: 5, courses: [
      courseRow(0, 'English III - Literature',            'Core',     '1',   'A'),
      courseRow(1, 'Government',                          'Core',     '1',   'A-'),
      courseRow(2, 'Business Research Methods',           'Core',     '1',   'A-'),
      courseRow(3, 'Principles of Marketing',             'Elective', '0.5', 'A'),
      courseRow(4, 'Business Ethics & Critical Thinking', 'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Fall Semester', sortOrder: 6, courses: [
      courseRow(0, 'English IV - Writing & Communication', 'Core',    '1',   'A'),
      courseRow(1, 'Economics Seminar',                   'Core',     '1',   'A'),
      courseRow(2, 'Statistics for Social Sciences',      'Core',     '1',   'A-'),
      courseRow(3, 'Organizational Behavior & Communication', 'Elective', '0.5', 'A'),
      courseRow(4, 'Business Strategy & Writing',         'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Spring Semester', sortOrder: 7, courses: [
      courseRow(0, 'English IV - Advanced Composition',   'Core',     '1',   ''),
      courseRow(1, 'Sociology',                           'Core',     '1',   ''),
      courseRow(2, 'Business Law',                        'Elective', '1',   ''),
      courseRow(3, 'Corporate Finance',                   'Elective', '1',   ''),
    ],
  },
]);

// ── Tao Zhang (Class of 2026, #002) ───────────────────────────────────────────
const taoZhangSemesters = makeSemesters([
  {
    key: 'Grade 9 - Fall Semester', sortOrder: 0, courses: [
      courseRow(0, 'English I',                           'Core',     '1',   'A-'),
      courseRow(1, 'Algebra I',                           'Core',     '1',   'A-'),
      courseRow(2, 'Biology',                             'Core',     '1',   'B+'),
      courseRow(3, 'World History',                       'Core',     '0.5', 'A-'),
      courseRow(4, 'Introduction to Psychology',          'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 9 - Spring Semester', sortOrder: 1, courses: [
      courseRow(0, 'English I - Writing',                 'Core',     '1',   'A-'),
      courseRow(1, 'Geometry',                            'Core',     '1',   'A-'),
      courseRow(2, 'Environmental Science',               'Core',     '1',   'A-'),
      courseRow(3, 'Geography',                           'Core',     '0.5', 'A-'),
      courseRow(4, 'Human Development',                   'Elective', '0.5', 'A'),
      courseRow(5, 'Health & Wellness',                   'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Fall Semester', sortOrder: 2, courses: [
      courseRow(0, 'English II',                          'Core',     '1',   'A'),
      courseRow(1, 'Algebra II',                          'Core',     '1',   'A-'),
      courseRow(2, 'Chemistry',                           'Core',     '1',   'A-'),
      courseRow(3, 'U.S. History',                        'Core',     '0.5', 'A'),
      courseRow(4, 'Psychology Foundations',              'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Spring Semester', sortOrder: 3, courses: [
      courseRow(0, 'English II - Literature',             'Core',     '1',   'A'),
      courseRow(1, 'Pre-Calculus',                        'Core',     '1',   'A-'),
      courseRow(2, 'Physics Fundamentals',                'Core',     '1',   'A-'),
      courseRow(3, 'World Politics',                      'Core',     '0.5', 'A'),
      courseRow(4, 'Social Psychology',                   'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Fall Semester', sortOrder: 4, courses: [
      courseRow(0, 'English III',                         'Core',     '1',   'A-'),
      courseRow(1, 'Statistics',                          'Core',     '1',   'A-'),
      courseRow(2, 'AP Psychology',                       'Core (AP)', '1',  'A'),
      courseRow(3, 'Biology Advanced',                    'Core',     '1',   'A-'),
    ],
  },
  {
    key: 'Grade 11 - Spring Semester', sortOrder: 5, courses: [
      courseRow(0, 'English III - Literature',            'Core',     '1',   'A-'),
      courseRow(1, 'AP Statistics',                       'Core (AP)', '1',  'A-'),
      courseRow(2, 'Government',                          'Core',     '1',   'B+'),
      courseRow(3, 'Cognitive Psychology',                'Elective', '0.5', 'A'),
      courseRow(4, 'Experimental Psychology',             'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Fall Semester', sortOrder: 6, courses: [
      courseRow(0, 'English IV - Analytical Writing',     'Core',     '1',   'A'),
      courseRow(1, 'AP Biology',                          'Core (AP)', '1',  'A-'),
      courseRow(2, 'Psychology Seminar / Capstone',       'Core',     '1',   'A'),
      courseRow(3, 'Behavioral Science',                  'Elective', '0.5', 'A'),
      courseRow(4, 'College Research & Writing',          'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Spring Semester', sortOrder: 7, courses: [
      courseRow(0, 'English IV - Advanced Composition',   'Core',     '1',   ''),
      courseRow(1, 'AP Human Geography',                  'Core (AP)', '1',  ''),
      courseRow(2, 'Abnormal Psychology',                 'Elective', '1',   ''),
      courseRow(3, 'Counseling & Mental Health Studies',  'Elective', '1',   ''),
    ],
  },
]);

// ── Baoyi Lu (Class of 2026, #003) ────────────────────────────────────────────
const baoyiLuSemesters = makeSemesters([
  {
    key: 'Grade 9 - Fall Semester', sortOrder: 0, courses: [
      courseRow(0, 'English I',                           'Core',     '1',   'A-'),
      courseRow(1, 'Algebra I',                           'Core',     '1',   'A-'),
      courseRow(2, 'Biology',                             'Core',     '1',   'B+'),
      courseRow(3, 'World History',                       'Core',     '0.5', 'A-'),
      courseRow(4, 'Digital Literacy',                    'Elective', '0.5', 'A'),
      courseRow(5, 'Introduction to Economics',           'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 9 - Spring Semester', sortOrder: 1, courses: [
      courseRow(0, 'English I - Writing',                 'Core',     '1',   'A-'),
      courseRow(1, 'Geometry',                            'Core',     '1',   'A-'),
      courseRow(2, 'Environmental Science',               'Core',     '1',   'A-'),
      courseRow(3, 'Geography',                           'Core',     '0.5', 'A-'),
      courseRow(4, 'Media Studies',                       'Elective', '0.5', 'A'),
      courseRow(5, 'Study Skills',                        'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Fall Semester', sortOrder: 2, courses: [
      courseRow(0, 'English II',                          'Core',     '1',   'A-'),
      courseRow(1, 'Algebra II',                          'Core',     '1',   'A-'),
      courseRow(2, 'Chemistry',                           'Core',     '1',   'B+'),
      courseRow(3, 'U.S. History',                        'Core',     '0.5', 'A'),
      courseRow(4, 'Introduction to Communication',       'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Spring Semester', sortOrder: 3, courses: [
      courseRow(0, 'English II - Literature',             'Core',     '1',   'A-'),
      courseRow(1, 'Pre-Calculus',                        'Core',     '1',   'A-'),
      courseRow(2, 'Physics Fundamentals',                'Core',     '1',   'B+'),
      courseRow(3, 'World Politics',                      'Core',     '0.5', 'A'),
      courseRow(4, 'Public Speaking',                     'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Fall Semester', sortOrder: 4, courses: [
      courseRow(0, 'English III',                         'Core',     '1',   'A'),
      courseRow(1, 'Statistics',                          'Core',     '1',   'A-'),
      courseRow(2, 'Economics',                           'Core',     '1',   'A-'),
      courseRow(3, 'Media & Society',                     'Elective', '0.5', 'A'),
      courseRow(4, 'Academic Writing',                    'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Spring Semester', sortOrder: 5, courses: [
      courseRow(0, 'English III - Literature',            'Core',     '1',   'A'),
      courseRow(1, 'Government',                          'Core',     '1',   'A-'),
      courseRow(2, 'Research Methods in Social Science',  'Core',     '1',   'A-'),
      courseRow(3, 'Marketing Basics',                    'Elective', '0.5', 'A'),
      courseRow(4, 'Ethics & Critical Thinking',          'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Fall Semester', sortOrder: 6, courses: [
      courseRow(0, 'English IV - Writing & Communication', 'Core',    '1',   'A'),
      courseRow(1, 'Economics Seminar',                   'Core',     '1',   'A'),
      courseRow(2, 'Statistics for Social Sciences',      'Core',     '1',   'A-'),
      courseRow(3, 'Communication Studies',               'Elective', '0.5', 'A'),
      courseRow(4, 'College Research & Writing',          'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Spring Semester', sortOrder: 7, courses: [
      courseRow(0, 'English IV - Advanced Composition / Media Writing', 'Core', '1', ''),
      courseRow(1, 'Sociology',                           'Core',     '1',   ''),
      courseRow(2, 'Personal Finance / Applied Economics', 'Elective', '1',  ''),
      courseRow(3, 'Digital Media & Society',             'Elective', '1',   ''),
    ],
  },
]);

// ── Yunfan Yang (Class of 2026, #004) ─────────────────────────────────────────
const yunfanYangSemesters = makeSemesters([
  {
    key: 'Grade 9 - Fall Semester', sortOrder: 0, courses: [
      courseRow(0, 'English I',                           'Core',     '1',   'A'),
      courseRow(1, 'Algebra I',                           'Core',     '1',   'A'),
      courseRow(2, 'Biology',                             'Core',     '1',   'B+'),
      courseRow(3, 'World History',                       'Core',     '0.5', 'A'),
      courseRow(4, 'Physical Education',                  'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 9 - Spring Semester', sortOrder: 1, courses: [
      courseRow(0, 'English I - Writing Focus',           'Core',     '1',   'A'),
      courseRow(1, 'Geometry',                            'Core',     '1',   'B+'),
      courseRow(2, 'Environmental Science',               'Core',     '1',   'A'),
      courseRow(3, 'Geography',                           'Core',     '0.5', 'A-'),
      courseRow(4, 'Health and Nutrition',                'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Fall Semester', sortOrder: 2, courses: [
      courseRow(0, 'English II',                          'Core',     '1',   'A'),
      courseRow(1, 'Algebra II',                          'Core',     '1',   'A'),
      courseRow(2, 'Chemistry',                           'Core',     '1',   'A-'),
      courseRow(3, 'U.S. History',                        'Core',     '0.5', 'A'),
      courseRow(4, 'Sports Psychology',                   'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 10 - Spring Semester', sortOrder: 3, courses: [
      courseRow(0, 'English II - Literature',             'Core',     '1',   'A'),
      courseRow(1, 'Physics Fundamentals',                'Core',     '1',   'A-'),
      courseRow(2, 'Pre-Calculus',                        'Core',     '1',   'A'),
      courseRow(3, 'World Politics',                      'Core',     '0.5', 'A'),
      courseRow(4, 'Sports Management Basics',            'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Fall Semester', sortOrder: 4, courses: [
      courseRow(0, 'English III',                         'Core',     '1',   'A'),
      courseRow(1, 'Statistics',                          'Core',     '1',   'B+'),
      courseRow(2, 'Biology Advanced',                    'Core',     '1',   'A-'),
      courseRow(3, 'Government',                          'Core',     '0.5', 'A'),
      courseRow(4, 'Fitness Leadership',                  'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 11 - Spring Semester', sortOrder: 5, courses: [
      courseRow(0, 'English III - Literature',            'Core',     '1',   'A'),
      courseRow(1, 'Physics - Mechanics',                 'Core',     '1',   'A'),
      courseRow(2, 'Economics',                           'Core',     '0.5', 'A-'),
      courseRow(3, 'Trigonometry',                        'Core',     '1',   'B+'),
      courseRow(4, 'Psychology',                          'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Fall Semester', sortOrder: 6, courses: [
      courseRow(0, 'English IV - Writing & Communication', 'Core',    '1',   'A'),
      courseRow(1, 'Calculus',                            'Core',     '1',   'A'),
      courseRow(2, 'Economics Advanced',                  'Core',     '1',   'A-'),
      courseRow(3, 'Business Management or Entrepreneurship', 'Elective', '0.5', 'A'),
      courseRow(4, 'Athletic Training',                   'Elective', '0.5', 'A'),
    ],
  },
  {
    key: 'Grade 12 - Spring Semester', sortOrder: 7, courses: [
      courseRow(0, 'English IV - Media & Analytical Writing', 'Core', '1',  ''),
      courseRow(1, 'Media Psychology',                    'Elective', '1',   ''),
      courseRow(2, 'Sports Management & Leadership',      'Elective', '1',   ''),
    ],
  },
]);

async function upsertStudentWithAccount({ email, password, studentCode, student, semestersCreate }) {
  const existing = await prisma.studentAccount.findUnique({
    where: { email: email.toLowerCase() },
    include: { student: true },
  });

  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.studentAccount.delete({ where: { email: email.toLowerCase() } });
      await tx.student.delete({ where: { id: existing.studentId } });
    });
    console.log(`Deleted existing student: ${email}`);
  }

  // Also remove any orphaned student with the same studentCode
  if (studentCode) {
    const orphan = await prisma.student.findUnique({ where: { studentCode } });
    if (orphan) {
      await prisma.student.delete({ where: { studentCode } });
      console.log(`Deleted orphaned student with code: ${studentCode}`);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const st = await tx.student.create({
      data: {
        ...student,
        studentCode,
        semesters: { create: semestersCreate },
      },
    });
    await tx.studentAccount.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        studentId: st.id,
      },
    });
  });
  console.log(`Seeded: ${email} / ${password}`);
}

function collectCourseFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectCourseFiles(full));
    else if (entry.name.endsWith('.json')) results.push(full);
  }
  return results;
}

async function seedCourses() {
  const dir = path.join(__dirname, 'courses');
  const files = collectCourseFiles(dir);
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const { modules, questions, quizQuestions, ...meta } = data;
    const existing = await prisma.course.findUnique({ where: { slug: meta.slug } });
    if (existing) await prisma.course.delete({ where: { slug: meta.slug } });
    await prisma.course.create({
      data: {
        ...meta,
        modules: { create: modules },
        questions: { create: questions || [] },
        quizQuestions: { create: quizQuestions || [] },
      },
    });
    console.log(`Seeded: ${meta.name} (${modules.length} modules, ${(questions || []).length} exam q, ${(quizQuestions || []).length} quiz q)`);
  }
}


async function seedPsychology() {
  const psycho = {
    slug: 'intro-psychology',
    name: 'Introduction to Psychology',
    nameZh: '心理学导论',
    credits: 1.0,
    department: 'Psychology',
    type: 'Elective',
    description: 'An exploration of human behavior and mental processes — from neurons and perception to personality, social influence, and therapy — covering the major perspectives and key findings of modern psychology.',
    isPublished: true,
  };

  const existing = await prisma.course.findUnique({ where: { slug: psycho.slug } });
  if (existing) {
    await prisma.course.delete({ where: { slug: psycho.slug } });
    console.log('Deleted existing Introduction to Psychology course');
  }

  await prisma.course.create({
    data: {
      ...psycho,
      modules: {
        create: [
          {
            order: 1,
            title: 'What Is Psychology?',
            titleZh: '什么是心理学？',
            objectives: 'Define psychology; identify major theoretical perspectives; understand the history from Wundt to modern approaches; recognize psychology as a science.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/1-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 1: Introduction to Psychology',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/history-and-approaches-to-psychology-ap/history-of-psychology-ap/v/history-of-psychology',
            videoNote: 'Khan Academy — History of Psychology',
            video2Url: 'https://www.youtube.com/watch?v=vo4pMVb0R6M',
            video2Note: 'Crash Course Psychology #1 — Intro to Psychology',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/history-and-approaches-to-psychology-ap',
            practiceNote: 'Khan Academy AP Psychology — History & Approaches (practice questions)',
            assignment: 'Choose two psychological perspectives (e.g., behavioral and cognitive). Write a short paragraph explaining how each would interpret the same behavior — for example, why a student procrastinates. Compare the explanations.',
            estimatedHrs: 3.0,
          },
          {
            order: 2,
            title: 'Research Methods in Psychology',
            titleZh: '心理学研究方法',
            objectives: 'Distinguish experimental, correlational, and descriptive research; identify variables; understand ethics in psychological research.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/2-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 2: Psychological Research',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/research-methods-and-statistics-ap/research-methods-ap/v/correlational-studies',
            videoNote: 'Khan Academy — Research Methods in Psychology',
            video2Url: 'https://www.youtube.com/watch?v=nubHSp2N6GU',
            video2Note: 'Crash Course Psychology #2 — Psychological Research',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/research-methods-and-statistics-ap',
            practiceNote: 'Khan Academy AP Psychology — Research Methods (practice questions)',
            assignment: 'Design a simple experiment to test the hypothesis that background music affects memory recall. Identify the independent variable, dependent variable, control group, and one potential confound. Explain how you would obtain informed consent.',
            estimatedHrs: 3.0,
          },
          {
            order: 3,
            title: 'Biological Bases of Behavior',
            titleZh: '行为的生物学基础',
            objectives: 'Describe neuron structure and function; identify key neurotransmitters and their effects; locate major brain structures and their roles.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/3-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 3: Biopsychology',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/biological-bases-of-behavior-ap/the-neuron-and-neural-firing-ap/v/neuron-3d-animation',
            videoNote: 'Khan Academy — The Neuron & Neural Firing',
            video2Url: 'https://www.youtube.com/watch?v=qPix_X-9t7E',
            video2Note: 'Crash Course Psychology #3 — The Brain',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/biological-bases-of-behavior-ap',
            practiceNote: 'Khan Academy AP Psychology — Biological Bases (practice questions)',
            assignment: 'Research one neurotransmitter (e.g., dopamine, serotonin, GABA). Write a one-page summary explaining its function, which behaviors or disorders it is associated with, and one drug or therapy that targets it.',
            estimatedHrs: 3.0,
          },
          {
            order: 4,
            title: 'Sensation and Perception',
            titleZh: '感觉与知觉',
            objectives: 'Distinguish sensation from perception; explain absolute and difference thresholds; describe Gestalt principles and depth cues.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/5-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 5: Sensation and Perception',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/sensation-and-perception-ap/vision-ap/v/how-we-see-vision-and-the-eye',
            videoNote: 'Khan Academy — Vision and the Eye',
            video2Url: 'https://www.youtube.com/watch?v=unWnZvXJH2o',
            video2Note: 'Crash Course Psychology #5 — Sensation & Perception',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/sensation-and-perception-ap',
            practiceNote: 'Khan Academy AP Psychology — Sensation & Perception (practice)',
            assignment: 'Find three optical illusions online. For each, explain which Gestalt principle or perceptual concept (e.g., figure-ground, closure, depth cue) is involved and why our brain is "fooled."',
            estimatedHrs: 3.0,
          },
          {
            order: 5,
            title: 'States of Consciousness',
            titleZh: '意识状态',
            objectives: 'Describe sleep stages and their functions; explain theories of dreaming; understand how hypnosis and psychoactive drugs alter consciousness.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/4-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 4: States of Consciousness',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/states-of-consciousness-ap/sleep-ap/v/sleep-stages',
            videoNote: 'Khan Academy — Sleep Stages',
            video2Url: 'https://www.youtube.com/watch?v=hpSQsRNNl-A',
            video2Note: 'Crash Course Psychology #9 — Sleep',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/states-of-consciousness-ap',
            practiceNote: 'Khan Academy AP Psychology — States of Consciousness (practice)',
            assignment: 'Keep a sleep journal for 3 days. Record your bedtime, wake time, any dreams you recall, and how rested you feel (1–10). Analyze your data in relation to what you learned about sleep stages and circadian rhythms.',
            estimatedHrs: 3.0,
          },
          {
            order: 6,
            title: 'Learning and Conditioning',
            titleZh: '学习与条件作用',
            objectives: 'Explain classical and operant conditioning with examples; describe schedules of reinforcement; apply observational learning theory.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/6-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 6: Learning',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/learning-ap/classical-conditioning-ap/v/classical-conditioning-ivan-pavlov',
            videoNote: 'Khan Academy — Classical Conditioning',
            video2Url: 'https://www.youtube.com/watch?v=jTH3ob1IRFo',
            video2Note: 'Crash Course Psychology #11 — Learning',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/learning-ap',
            practiceNote: 'Khan Academy AP Psychology — Learning (practice questions)',
            assignment: 'Identify one example of classical conditioning and one example of operant conditioning from your own life or from a TV show/movie. Label all relevant components (US, UR, CS, CR for classical; reinforcer/punisher type for operant).',
            estimatedHrs: 3.0,
          },
          {
            order: 7,
            title: 'Memory',
            titleZh: '记忆',
            objectives: 'Describe encoding, storage, and retrieval; compare short-term and long-term memory; explain forgetting and memory distortion.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/8-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 8: Memory',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/memory-ap/introduction-to-memory-ap/v/memory-encoding',
            videoNote: 'Khan Academy — Memory Encoding',
            video2Url: 'https://www.youtube.com/watch?v=bSycdIx-C48',
            video2Note: 'Crash Course Psychology #13 — Memory',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/memory-ap',
            practiceNote: 'Khan Academy AP Psychology — Memory (practice questions)',
            assignment: 'Test the serial position effect on yourself: memorize a list of 12 unrelated words, wait 2 minutes, then write down as many as you recall. Circle which positions (beginning, middle, end) you remembered best. Explain your results using the primacy and recency effects.',
            estimatedHrs: 3.0,
          },
          {
            order: 8,
            title: 'Thinking and Intelligence',
            titleZh: '思维与智力',
            objectives: 'Describe problem-solving strategies and cognitive biases; compare theories of intelligence; discuss the nature–nurture debate in intelligence.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/7-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 7: Thinking and Intelligence',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/cognition-ap/language-and-thought-ap/v/problem-solving-and-decision-making',
            videoNote: 'Khan Academy — Problem Solving and Decision Making',
            video2Url: 'https://www.youtube.com/watch?v=OX5PnDFHQhU',
            video2Note: 'Crash Course Psychology #14 — Cognition',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/cognition-ap',
            practiceNote: 'Khan Academy AP Psychology — Cognition (practice questions)',
            assignment: 'Describe a real-life decision you made recently. Identify at least two cognitive biases (e.g., confirmation bias, availability heuristic, anchoring) that may have influenced your thinking. How could you have decided more rationally?',
            estimatedHrs: 3.0,
          },
          {
            order: 9,
            title: 'Developmental Psychology',
            titleZh: '发展心理学',
            objectives: "Describe Piaget\'s and Erikson\'s stage theories; explain attachment theory; apply developmental concepts to adolescence and adulthood.",
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/9-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 9: Lifespan Development',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/developmental-psychology-ap/piaget-stages-of-cognitive-development-ap/v/piagets-stages-of-cognitive-development',
            videoNote: "Khan Academy — Piaget\'s Stages of Cognitive Development",
            video2Url: 'https://www.youtube.com/watch?v=TRF27F2bn-A',
            video2Note: 'Crash Course Psychology #22 — Childhood Development',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/developmental-psychology-ap',
            practiceNote: 'Khan Academy AP Psychology — Developmental Psychology (practice)',
            assignment: "Interview a family member or friend from a different generation (a young child, a teenager, or an older adult). Write a one-page reflection connecting what you observed to a concept from Piaget\'s or Erikson\'s stage theory.",
            estimatedHrs: 3.0,
          },
          {
            order: 10,
            title: 'Motivation and Emotion',
            titleZh: '动机与情绪',
            objectives: "Apply Maslow\'s hierarchy of needs; compare theories of emotion; distinguish intrinsic from extrinsic motivation.",
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/10-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 10: Emotion and Motivation',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/motivation-and-emotion-ap/theories-of-motivation-ap/v/maslows-hierarchy-of-needs',
            videoNote: "Khan Academy — Maslow\'s Hierarchy of Needs",
            video2Url: 'https://www.youtube.com/watch?v=IiOkMFM_4-E',
            video2Note: 'Crash Course Psychology #17 — Motivation',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/motivation-and-emotion-ap',
            practiceNote: 'Khan Academy AP Psychology — Motivation & Emotion (practice)',
            assignment: "Apply Maslow\'s hierarchy to a character from a book, film, or TV show. Identify which level of the hierarchy that character is primarily operating from and provide specific evidence from the story. Suggest what they would need to move to the next level.",
            estimatedHrs: 3.0,
          },
          {
            order: 11,
            title: 'Personality',
            titleZh: '人格',
            objectives: 'Compare major personality theories (psychoanalytic, humanistic, trait); describe the Big Five; distinguish projective from objective personality tests.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/11-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 11: Personality',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/personality-ap/psychodynamic-theories-of-personality-ap/v/freuds-stages-of-psychosexual-development',
            videoNote: "Khan Academy — Freud\'s Psychoanalytic Theory",
            video2Url: 'https://www.youtube.com/watch?v=3BwKTMRJSFo',
            video2Note: 'Crash Course Psychology #22 — Personality',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/personality-ap',
            practiceNote: 'Khan Academy AP Psychology — Personality (practice questions)',
            assignment: 'Research one of the Big Five personality traits. Describe how psychologists measure it, what outcomes it predicts (career, relationships, health), and reflect on where you think you would score on that trait and why.',
            estimatedHrs: 3.0,
          },
          {
            order: 12,
            title: 'Social Psychology',
            titleZh: '社会心理学',
            objectives: 'Explain attribution theory; describe conformity, obedience, and group dynamics; apply social psychological principles to real-world behavior.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/12-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 12: Social Psychology',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/social-psychology-ap/social-influence-ap/v/conformity-and-obedience',
            videoNote: 'Khan Academy — Conformity and Obedience',
            video2Url: 'https://www.youtube.com/watch?v=UGxGDdQnC1Y',
            video2Note: 'Crash Course Psychology #37 — Social Thinking',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/social-psychology-ap',
            practiceNote: 'Khan Academy AP Psychology — Social Psychology (practice questions)',
            assignment: "Describe a time when you conformed to group pressure or witnessed someone else conforming. Analyze the situation using Asch\'s conformity research or Milgram\'s obedience research. What factors made conformity more or less likely?",
            estimatedHrs: 3.0,
          },
          {
            order: 13,
            title: 'Psychological Disorders',
            titleZh: '心理障碍',
            objectives: 'Describe the DSM-5 classification system; identify symptoms of major anxiety, mood, and psychotic disorders; apply the diathesis-stress model.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/15-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 15: Psychological Disorders',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/treatment-of-psychological-disorders-ap/introduction-to-treatment-ap/v/introduction-to-psychological-disorders',
            videoNote: 'Khan Academy — Introduction to Psychological Disorders',
            video2Url: 'https://www.youtube.com/watch?v=wuhJ-GkRRQc',
            video2Note: 'Crash Course Psychology #28 — Psychological Disorders',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/psychological-disorders-ap',
            practiceNote: 'Khan Academy AP Psychology — Psychological Disorders (practice)',
            assignment: 'Choose one psychological disorder (not one affecting you personally) and write a one-page research summary covering: main diagnostic criteria, estimated prevalence, one biological factor, and one environmental factor that contribute to it.',
            estimatedHrs: 3.0,
          },
          {
            order: 14,
            title: 'Treatment and Therapy',
            titleZh: '治疗与干预',
            objectives: 'Compare types of psychotherapy; explain how CBT works; describe common medications used in mental health treatment; evaluate therapy effectiveness.',
            readingUrl: 'https://openstax.org/books/psychology-2e/pages/16-introduction',
            readingNote: 'OpenStax Psychology 2e — Chapter 16: Therapy and Treatment',
            videoUrl: 'https://www.khanacademy.org/science/ap-psychology/treatment-of-psychological-disorders-ap/types-of-psychological-therapies-ap/v/types-of-therapy',
            videoNote: 'Khan Academy — Types of Psychological Therapies',
            video2Url: 'https://www.youtube.com/watch?v=IexOR7KBiLI',
            video2Note: 'Crash Course Psychology #35 — Therapy',
            practiceUrl: 'https://www.khanacademy.org/science/ap-psychology/treatment-of-psychological-disorders-ap',
            practiceNote: 'Khan Academy AP Psychology — Treatment (practice questions)',
            assignment: 'Compare cognitive-behavioral therapy (CBT) to psychoanalysis. For each: describe the core technique used, the type of disorder it is best suited for, and one limitation. Which approach do you find more convincing based on the evidence?',
            estimatedHrs: 3.0,
          },
        ],
      },
      questions: {
        create: [
          // ── Midterm Exam — modules 1–7 ─────────────────────────────────────
          { examType: 'midterm', order: 1, question: 'Which psychological perspective would most likely explain aggression in terms of unconscious childhood conflicts?', type: 'mc', options: ['Behavioral', 'Cognitive', 'Psychoanalytic', 'Humanistic'], answer: 'Psychoanalytic', explanation: 'The psychoanalytic perspective, founded by Freud, emphasizes unconscious drives and early childhood experiences as drivers of behavior.', points: 1 },
          { examType: 'midterm', order: 2, question: 'A researcher randomly assigns participants to treatment or control groups. This primarily controls for:', type: 'mc', options: ['Observer bias', 'Pre-existing differences between groups', 'The placebo effect', 'Demand characteristics'], answer: 'Pre-existing differences between groups', explanation: 'Random assignment ensures that any pre-existing differences between participants are distributed equally across groups.', points: 1 },
          { examType: 'midterm', order: 3, question: 'Damage to the hippocampus would most directly impair:', type: 'mc', options: ['Breathing and heart rate', 'Balance and coordination', 'Formation of new long-term memories', 'Processing of visual information'], answer: 'Formation of new long-term memories', explanation: 'The hippocampus is critical for consolidating new declarative (explicit) memories into long-term storage.', points: 1 },
          { examType: 'midterm', order: 4, question: 'The Gestalt principle that states we tend to group nearby objects together is called:', type: 'mc', options: ['Similarity', 'Closure', 'Proximity', 'Figure-ground'], answer: 'Proximity', explanation: 'The proximity principle holds that we perceptually group objects that are physically close together.', points: 1 },
          { examType: 'midterm', order: 5, question: 'Research suggests that __________ sleep plays an important role in consolidating emotional memories and procedural skills.', type: 'mc', options: ['Stage 1', 'Stage 2', 'REM', 'Slow-wave (Stage 3)'], answer: 'REM', explanation: 'REM sleep is associated with the consolidation of emotional memories and procedural learning.', points: 1 },
          { examType: 'midterm', order: 6, question: 'A child is rewarded with candy every 5 math problems completed. This is a:', type: 'mc', options: ['Variable-ratio schedule', 'Fixed-ratio schedule', 'Fixed-interval schedule', 'Variable-interval schedule'], answer: 'Fixed-ratio schedule', explanation: 'A fixed-ratio schedule delivers reinforcement after a set number of responses (every 5 problems).', points: 1 },
          { examType: 'midterm', order: 7, question: 'The part of a neuron that carries signals AWAY from the cell body is the:', type: 'mc', options: ['Dendrite', 'Synapse', 'Axon', 'Myelin sheath'], answer: 'Axon', explanation: 'Axons conduct electrical impulses away from the neuron\'s cell body toward the terminal buttons.', points: 1 },
          { examType: 'midterm', order: 8, question: 'According to the absolute threshold, a stimulus must be detectable __________ of the time.', type: 'mc', options: ['100%', '75%', '50%', '25%'], answer: '50%', explanation: 'The absolute threshold is defined as the minimum stimulus intensity detectable 50% of the time.', points: 1 },
          { examType: 'midterm', order: 9, question: 'When a previously conditioned response disappears because the CS is repeatedly presented without the UCS, this is called:', type: 'mc', options: ['Spontaneous recovery', 'Generalization', 'Discrimination', 'Extinction'], answer: 'Extinction', explanation: 'Extinction occurs when the conditioned stimulus no longer reliably predicts the unconditioned stimulus, and the conditioned response fades.', points: 1 },
          { examType: 'midterm', order: 10, question: 'The "fight-or-flight" stress response is controlled primarily by the:', type: 'mc', options: ['Parasympathetic nervous system', 'Sympathetic nervous system', 'Somatic nervous system', 'Peripheral nervous system'], answer: 'Sympathetic nervous system', explanation: 'The sympathetic division of the autonomic nervous system triggers the fight-or-flight response.', points: 1 },
          { examType: 'midterm', order: 11, question: 'Which research method is best suited to establishing a cause-and-effect relationship?', type: 'mc', options: ['Survey', 'Case study', 'Naturalistic observation', 'Controlled experiment'], answer: 'Controlled experiment', explanation: 'Only a controlled experiment — with manipulation of an independent variable and random assignment — can establish causation.', points: 1 },
          { examType: 'midterm', order: 12, question: 'George Miller found that short-term memory holds approximately __________ chunks of information.', type: 'mc', options: ['3 ± 1', '7 ± 2', '12 ± 3', '20 ± 5'], answer: '7 ± 2', explanation: 'Miller\'s famous "magical number seven" paper described short-term memory capacity as 7 ± 2 chunks.', points: 1 },
          { examType: 'midterm', order: 13, question: 'Elizabeth Loftus\'s misinformation effect research demonstrated that:', type: 'mc', options: ['Memory is a perfect recording of events', 'Repressed memories are always accurate', 'Post-event information can alter memory', 'Only emotional events are reliably remembered'], answer: 'Post-event information can alter memory', explanation: 'Loftus showed that leading questions and post-event information can create false memories or distort existing ones.', points: 1 },
          { examType: 'midterm', order: 14, question: 'Which schedule of reinforcement produces the highest and most consistent rate of responding?', type: 'mc', options: ['Fixed-ratio', 'Fixed-interval', 'Variable-ratio', 'Variable-interval'], answer: 'Variable-ratio', explanation: 'Variable-ratio schedules produce the highest, most persistent response rates because reinforcement is unpredictable — as in slot machines.', points: 1 },
          { examType: 'midterm', order: 15, question: 'Which perspective emphasizes the role of conscious thought processes in shaping behavior?', type: 'mc', options: ['Psychoanalytic', 'Behavioral', 'Cognitive', 'Biological'], answer: 'Cognitive', explanation: 'The cognitive perspective focuses on mental processes such as thinking, reasoning, and problem-solving as the primary influences on behavior.', points: 1 },

          // ── Final Exam — all modules ───────────────────────────────────────
          { examType: 'final', order: 1, question: 'Psychology is best defined as:', type: 'mc', options: ['The study of the brain\'s physical structure', 'The scientific study of behavior and mental processes', 'The treatment of mental illness', 'The study of human society and culture'], answer: 'The scientific study of behavior and mental processes', explanation: 'Psychology is the scientific discipline that studies both observable behavior and internal mental processes.', points: 1 },
          { examType: 'final', order: 2, question: 'In a controlled experiment, participants who do NOT receive the treatment belong to the:', type: 'mc', options: ['Experimental group', 'Control group', 'Random sample', 'Longitudinal group'], answer: 'Control group', explanation: 'The control group does not receive the independent variable, providing a baseline against which to compare the experimental group.', points: 1 },
          { examType: 'final', order: 3, question: 'Which neurotransmitter deficit is most associated with Parkinson\'s disease?', type: 'mc', options: ['Serotonin', 'Dopamine', 'GABA', 'Norepinephrine'], answer: 'Dopamine', explanation: 'Parkinson\'s disease results from the degeneration of dopamine-producing neurons in the substantia nigra.', points: 1 },
          { examType: 'final', order: 4, question: 'The smallest detectable change in stimulus intensity is the:', type: 'mc', options: ['Absolute threshold', 'Just noticeable difference (JND)', 'Signal detection point', 'Sensory adaptation level'], answer: 'Just noticeable difference (JND)', explanation: 'The JND (or difference threshold) is the minimum change in stimulation that can be detected 50% of the time.', points: 1 },
          { examType: 'final', order: 5, question: 'Which of the following is classified as a stimulant?', type: 'mc', options: ['Alcohol', 'Heroin', 'Caffeine', 'Barbiturates'], answer: 'Caffeine', explanation: 'Caffeine is a stimulant that increases CNS activity by blocking adenosine receptors.', points: 1 },
          { examType: 'final', order: 6, question: 'A dog no longer salivates to a bell after the bell is repeatedly presented without food. This is:', type: 'mc', options: ['Spontaneous recovery', 'Stimulus generalization', 'Extinction', 'Discrimination'], answer: 'Extinction', explanation: 'Extinction occurs when the conditioned stimulus is presented repeatedly without the unconditioned stimulus.', points: 1 },
          { examType: 'final', order: 7, question: 'Chunking improves short-term memory by:', type: 'mc', options: ['Increasing number of items stored', 'Organizing information into meaningful units', 'Converting memories to long-term storage', 'Reducing the recency effect'], answer: 'Organizing information into meaningful units', explanation: 'Chunking groups individual pieces of information into larger meaningful units, allowing more information to fit within memory limits.', points: 1 },
          { examType: 'final', order: 8, question: 'The ability to reason abstractly and solve novel problems is called:', type: 'mc', options: ['Crystallized intelligence', 'Fluid intelligence', 'Emotional intelligence', 'Practical intelligence'], answer: 'Fluid intelligence', explanation: 'Fluid intelligence refers to the capacity for novel reasoning, independent of acquired knowledge.', points: 1 },
          { examType: 'final', order: 9, question: 'According to Piaget, understanding that the amount of liquid does not change when poured into a different container is called:', type: 'mc', options: ['Object permanence', 'Conservation', 'Egocentrism', 'Assimilation'], answer: 'Conservation', explanation: 'Conservation is the understanding that quantity remains the same despite changes in appearance, typically acquired in the concrete operational stage.', points: 1 },
          { examType: 'final', order: 10, question: 'According to Maslow, self-actualization represents:', type: 'mc', options: ['Physical safety and security', 'Love and belonging needs', 'Esteem and recognition', 'Reaching one\'s full potential'], answer: 'Reaching one\'s full potential', explanation: 'Self-actualization is the highest level of Maslow\'s hierarchy, representing the fulfillment of one\'s unique potential.', points: 1 },
          { examType: 'final', order: 11, question: 'The defense mechanism in which threatening thoughts are pushed into the unconscious is called:', type: 'mc', options: ['Projection', 'Rationalization', 'Repression', 'Sublimation'], answer: 'Repression', explanation: 'Repression is the unconscious blocking of anxiety-producing thoughts from conscious awareness.', points: 1 },
          { examType: 'final', order: 12, question: 'The bystander effect predicts that individuals are __________ likely to help in an emergency when many others are present.', type: 'mc', options: ['More', 'Less', 'Equally', 'Unpredictably'], answer: 'Less', explanation: 'Diffusion of responsibility in larger groups reduces any individual\'s sense of personal obligation to act.', points: 1 },
          { examType: 'final', order: 13, question: 'A person experiencing at least two weeks of depressed mood, loss of interest, and changes in sleep/appetite likely has:', type: 'mc', options: ['Bipolar disorder', 'Generalized Anxiety Disorder', 'Major depressive disorder', 'Dysthymia'], answer: 'Major depressive disorder', explanation: 'DSM-5 requires at least two weeks of depressed mood plus at least 5 total symptoms for a major depressive episode diagnosis.', points: 1 },
          { examType: 'final', order: 14, question: 'Systematic desensitization is a behavioral technique most effective for:', type: 'mc', options: ['Schizophrenia', 'Personality disorders', 'Phobias and anxiety', 'Bipolar disorder'], answer: 'Phobias and anxiety', explanation: 'Systematic desensitization pairs relaxation with gradual exposure to feared stimuli to extinguish fear responses.', points: 1 },
          { examType: 'final', order: 15, question: 'Erik Erikson\'s stage of "Trust vs. Mistrust" occurs during:', type: 'mc', options: ['Infancy', 'Toddlerhood', 'Preschool age', 'Middle childhood'], answer: 'Infancy', explanation: 'Erikson\'s first stage (0–18 months) centers on whether infants develop trust based on the reliability of caregivers.', points: 1 },
          { examType: 'final', order: 16, question: 'Which disorder is characterized by alternating episodes of mania and depression?', type: 'mc', options: ['Major depressive disorder', 'Schizophrenia', 'Bipolar disorder', 'Cyclothymia'], answer: 'Bipolar disorder', explanation: 'Bipolar disorder involves cycles of extreme mood elevation (mania or hypomania) and depressive episodes.', points: 1 },
          { examType: 'final', order: 17, question: 'Watson and Rayner\'s "Little Albert" experiment demonstrated:', type: 'mc', options: ['Operant conditioning in infants', 'The power of observational learning', 'Classical conditioning of fear in humans', 'Instrumental conditioning of phobias'], answer: 'Classical conditioning of fear in humans', explanation: 'Watson and Rayner classically conditioned fear of a white rat in Little Albert by pairing it with a loud noise.', points: 1 },
          { examType: 'final', order: 18, question: 'A therapist who helps a client identify and challenge distorted thinking patterns is using:', type: 'mc', options: ['Psychoanalysis', 'Humanistic therapy', 'Behavioral therapy', 'Cognitive-behavioral therapy (CBT)'], answer: 'Cognitive-behavioral therapy (CBT)', explanation: 'CBT targets maladaptive thought patterns (cognitive distortions) and uses behavioral techniques to change them.', points: 1 },
          { examType: 'final', order: 19, question: 'SSRIs are most commonly prescribed for:', type: 'mc', options: ['Schizophrenia', 'Depression and anxiety disorders', 'Bipolar disorder exclusively', 'ADHD'], answer: 'Depression and anxiety disorders', explanation: 'Selective serotonin reuptake inhibitors increase serotonin availability and are first-line treatments for depression and many anxiety disorders.', points: 1 },
          { examType: 'final', order: 20, question: 'The biopsychosocial model proposes that mental disorders arise from:', type: 'mc', options: ['Biological factors alone', 'Psychological factors alone', 'Social factors alone', 'The interaction of biological, psychological, and social factors'], answer: 'The interaction of biological, psychological, and social factors', explanation: 'The biopsychosocial model holds that mental health and illness result from the interplay of genetic, psychological, and sociocultural influences.', points: 1 },
        ],
      },
      quizQuestions: {
        create: [
          // ── Module 1: What Is Psychology? ──────────────────────────────────
          { moduleOrder: 1, order: 1, question: 'Psychology is best defined as:', options: ['The study of the brain\'s physical structure', 'The scientific study of behavior and mental processes', 'The treatment of mental illness', 'The study of human society'], answer: 'The scientific study of behavior and mental processes', explanation: 'Psychology is the scientific discipline studying both observable behavior and internal mental processes.', points: 1 },
          { moduleOrder: 1, order: 2, question: 'Wilhelm Wundt established the first psychology laboratory in:', options: ['1776', '1879', '1920', '1953'], answer: '1879', explanation: 'Wundt opened his lab in Leipzig, Germany in 1879, marking the formal beginning of experimental psychology.', points: 1 },
          { moduleOrder: 1, order: 3, question: 'Which perspective focuses on unconscious drives and early childhood experiences?', options: ['Behaviorism', 'Humanism', 'Psychoanalytic', 'Cognitive'], answer: 'Psychoanalytic', explanation: 'Freud\'s psychoanalytic perspective emphasizes unconscious conflicts and childhood experiences as drivers of behavior.', points: 1 },
          { moduleOrder: 1, order: 4, question: 'The behavioral perspective was most strongly championed by:', options: ['Sigmund Freud', 'Carl Rogers', 'B.F. Skinner', 'Abraham Maslow'], answer: 'B.F. Skinner', explanation: 'Skinner was the leading figure in behaviorism, emphasizing observable behavior and the role of reinforcement.', points: 1 },
          { moduleOrder: 1, order: 5, question: 'Using positive reinforcement to encourage a child\'s good behavior is an example of which psychological perspective in practice?', options: ['Psychoanalytic', 'Biological', 'Behavioral', 'Humanistic'], answer: 'Behavioral', explanation: 'Behavioral psychology focuses on how reinforcement and punishment shape observable actions.', points: 1 },

          // ── Module 2: Research Methods ─────────────────────────────────────
          { moduleOrder: 2, order: 1, question: 'In an experiment, the variable the researcher manipulates is called the:', options: ['Dependent variable', 'Control variable', 'Independent variable', 'Confounding variable'], answer: 'Independent variable', explanation: 'The independent variable is deliberately changed to observe its effect on the dependent variable.', points: 1 },
          { moduleOrder: 2, order: 2, question: 'Ice cream sales and drowning rates are positively correlated. The best explanation is:', options: ['Ice cream causes drowning', 'Drowning increases ice cream sales', 'Hot weather causes both', 'The data must be incorrect'], answer: 'Hot weather causes both', explanation: 'This is a classic example of a confounding variable (hot weather) creating a spurious correlation.', points: 1 },
          { moduleOrder: 2, order: 3, question: 'The placebo effect is best controlled by using a:', options: ['Case study', 'Double-blind procedure', 'Survey method', 'Naturalistic observation'], answer: 'Double-blind procedure', explanation: 'In a double-blind study, neither participants nor experimenters know who received the real treatment, controlling for expectation effects.', points: 1 },
          { moduleOrder: 2, order: 4, question: 'Which ethical principle requires participants to be fully informed of risks before agreeing to participate?', options: ['Debriefing', 'Confidentiality', 'Informed consent', 'Random assignment'], answer: 'Informed consent', explanation: 'Informed consent requires researchers to explain risks and procedures before participants agree to join a study.', points: 1 },
          { moduleOrder: 2, order: 5, question: 'Observing animals in their natural habitat without interfering is called:', options: ['Case study', 'Naturalistic observation', 'Laboratory experiment', 'Survey'], answer: 'Naturalistic observation', explanation: 'Naturalistic observation records behavior in real-world settings without manipulation or interference.', points: 1 },

          // ── Module 3: Biological Bases of Behavior ─────────────────────────
          { moduleOrder: 3, order: 1, question: 'The gap between two neurons across which neurotransmitters travel is called the:', options: ['Axon', 'Dendrite', 'Synapse', 'Myelin sheath'], answer: 'Synapse', explanation: 'The synapse is the tiny gap between neurons where chemical communication via neurotransmitters occurs.', points: 1 },
          { moduleOrder: 3, order: 2, question: 'Which neurotransmitter is most associated with pleasure and reward?', options: ['Serotonin', 'Dopamine', 'Acetylcholine', 'GABA'], answer: 'Dopamine', explanation: 'Dopamine is central to the brain\'s reward pathway and is linked to feelings of pleasure and motivation.', points: 1 },
          { moduleOrder: 3, order: 3, question: 'The brain structure most responsible for regulating breathing and heartbeat is the:', options: ['Cerebellum', 'Hippocampus', 'Medulla oblongata', 'Prefrontal cortex'], answer: 'Medulla oblongata', explanation: 'The medulla oblongata in the brainstem controls vital autonomic functions like breathing and heart rate.', points: 1 },
          { moduleOrder: 3, order: 4, question: 'In most right-handed people, language is primarily processed in the:', options: ['Right hemisphere', 'Left hemisphere', 'Both hemispheres equally', 'Cerebellum'], answer: 'Left hemisphere', explanation: 'Language areas (Broca\'s and Wernicke\'s) are typically located in the left hemisphere in right-handed individuals.', points: 1 },
          { moduleOrder: 3, order: 5, question: 'The limbic system is most associated with:', options: ['Voluntary muscle movement', 'Processing visual information', 'Emotion and memory', 'Regulating heart rate'], answer: 'Emotion and memory', explanation: 'The limbic system, including the amygdala and hippocampus, plays key roles in emotional responses and memory formation.', points: 1 },

          // ── Module 4: Sensation and Perception ────────────────────────────
          { moduleOrder: 4, order: 1, question: 'The minimum intensity needed to detect a stimulus 50% of the time is the:', options: ['Signal detection threshold', 'Just noticeable difference', 'Absolute threshold', 'Sensory adaptation level'], answer: 'Absolute threshold', explanation: 'The absolute threshold is the minimum stimulus level detectable half the time under ideal conditions.', points: 1 },
          { moduleOrder: 4, order: 2, question: 'The Gestalt principle that we tend to "fill in" incomplete figures is called:', options: ['Proximity', 'Similarity', 'Closure', 'Continuity'], answer: 'Closure', explanation: 'Closure describes the tendency to perceive incomplete shapes as complete whole figures.', points: 1 },
          { moduleOrder: 4, order: 3, question: 'Gradually adjusting to low light after entering a dark room is called:', options: ['Sensory adaptation', 'Dark adaptation', 'Visual accommodation', 'Perceptual constancy'], answer: 'Dark adaptation', explanation: 'Dark adaptation is the process by which the eyes increase sensitivity to light in low-light conditions over several minutes.', points: 1 },
          { moduleOrder: 4, order: 4, question: 'Which depth cue requires BOTH eyes to work together?', options: ['Linear perspective', 'Binocular disparity', 'Texture gradient', 'Interposition'], answer: 'Binocular disparity', explanation: 'Binocular disparity uses the slightly different images from each eye to judge depth — it is a binocular (two-eye) cue.', points: 1 },
          { moduleOrder: 4, order: 5, question: 'The process converting physical stimuli into neural signals is called:', options: ['Perception', 'Transduction', 'Adaptation', 'Habituation'], answer: 'Transduction', explanation: 'Transduction is the conversion of physical energy (light, sound, etc.) into electrical neural signals that the brain can process.', points: 1 },

          // ── Module 5: States of Consciousness ─────────────────────────────
          { moduleOrder: 5, order: 1, question: 'Which sleep stage is characterized by rapid eye movement and vivid dreaming?', options: ['Stage 1', 'Stage 2', 'Slow-wave sleep', 'REM sleep'], answer: 'REM sleep', explanation: 'REM (rapid eye movement) sleep is when most vivid dreaming occurs and brain activity resembles that of wakefulness.', points: 1 },
          { moduleOrder: 5, order: 2, question: 'According to Freud, the actual story and images of a dream represent the:', options: ['Latent content', 'Manifest content', 'Symbolic meaning', 'Unconscious wish'], answer: 'Manifest content', explanation: 'The manifest content is the literal, surface-level storyline of the dream, as opposed to the latent (hidden symbolic) content.', points: 1 },
          { moduleOrder: 5, order: 3, question: 'Hypnosis is best described as:', options: ['A state of unconsciousness', 'A form of sleep', 'A state of heightened suggestibility and focused attention', 'A method of permanent mind control'], answer: 'A state of heightened suggestibility and focused attention', explanation: 'Hypnosis is a trance-like state of focused attention and heightened openness to suggestion — not sleep or unconsciousness.', points: 1 },
          { moduleOrder: 5, order: 4, question: 'A drug that reduces central nervous system activity is classified as a:', options: ['Stimulant', 'Psychedelic', 'Depressant', 'Hallucinogen'], answer: 'Depressant', explanation: 'Depressants (e.g., alcohol, benzodiazepines) slow CNS activity, reducing arousal and anxiety.', points: 1 },
          { moduleOrder: 5, order: 5, question: 'The body\'s 24-hour biological clock is called the:', options: ['Sleep cycle', 'Circadian rhythm', 'Ultradian rhythm', 'Homeostatic drive'], answer: 'Circadian rhythm', explanation: 'The circadian rhythm is a roughly 24-hour internal cycle that regulates sleep, wakefulness, and other biological processes.', points: 1 },

          // ── Module 6: Learning and Conditioning ───────────────────────────
          { moduleOrder: 6, order: 1, question: 'In Pavlov\'s experiment, after conditioning the bell became a:', options: ['Unconditioned stimulus', 'Neutral stimulus', 'Conditioned stimulus', 'Unconditioned response'], answer: 'Conditioned stimulus', explanation: 'Initially neutral, the bell became a conditioned stimulus after repeated pairing with food (the UCS).', points: 1 },
          { moduleOrder: 6, order: 2, question: 'Positive reinforcement __________ a behavior; positive punishment __________ it.', options: ['Decreases; increases', 'Increases; decreases', 'Eliminates; maintains', 'Maintains; eliminates'], answer: 'Increases; decreases', explanation: 'Positive reinforcement adds a pleasant stimulus to increase behavior; positive punishment adds an unpleasant stimulus to decrease it.', points: 1 },
          { moduleOrder: 6, order: 3, question: 'A slot machine pays out on an unpredictable, random schedule. This is a __________ schedule of reinforcement.', options: ['Fixed-ratio', 'Fixed-interval', 'Variable-ratio', 'Variable-interval'], answer: 'Variable-ratio', explanation: 'Variable-ratio schedules deliver reinforcement after an unpredictable number of responses, producing high, steady response rates.', points: 1 },
          { moduleOrder: 6, order: 4, question: 'Albert Bandura\'s Bobo doll experiments demonstrated:', options: ['Classical conditioning in humans', 'The power of negative reinforcement', 'Observational (social) learning', 'Operant extinction'], answer: 'Observational (social) learning', explanation: 'Children imitated aggressive behavior modeled by an adult, showing that learning can occur through observation alone.', points: 1 },
          { moduleOrder: 6, order: 5, question: 'Taking aspirin to relieve a headache is an example of:', options: ['Positive reinforcement', 'Negative reinforcement', 'Positive punishment', 'Negative punishment'], answer: 'Negative reinforcement', explanation: 'Negative reinforcement removes an unpleasant stimulus (pain) to increase the likelihood of a behavior (taking aspirin).', points: 1 },

          // ── Module 7: Memory ───────────────────────────────────────────────
          { moduleOrder: 7, order: 1, question: 'The three stages of memory processing in correct order are:', options: ['Storage → Encoding → Retrieval', 'Encoding → Storage → Retrieval', 'Retrieval → Encoding → Storage', 'Encoding → Retrieval → Storage'], answer: 'Encoding → Storage → Retrieval', explanation: 'Information must first be encoded, then stored, and finally retrieved when needed.', points: 1 },
          { moduleOrder: 7, order: 2, question: 'George Miller found that short-term memory holds approximately:', options: ['3 ± 1 chunks', '7 ± 2 chunks', '12 ± 3 chunks', '20 ± 5 chunks'], answer: '7 ± 2 chunks', explanation: 'Miller\'s "magical number seven" research established short-term memory capacity at approximately 7 ± 2 chunks.', points: 1 },
          { moduleOrder: 7, order: 3, question: 'Better recall for items at the BEGINNING of a list is the:', options: ['Recency effect', 'Primacy effect', 'Spacing effect', 'Von Restorff effect'], answer: 'Primacy effect', explanation: 'The primacy effect occurs because early items get more rehearsal and are transferred to long-term memory.', points: 1 },
          { moduleOrder: 7, order: 4, question: 'Anterograde amnesia is the inability to:', options: ['Recall memories from before an injury', 'Form new long-term memories after an injury', 'Remember procedural skills', 'Access implicit memories'], answer: 'Form new long-term memories after an injury', explanation: 'Anterograde amnesia affects the ability to create new long-term memories following brain damage.', points: 1 },
          { moduleOrder: 7, order: 5, question: 'Elizabeth Loftus\'s research on eyewitness testimony showed that:', options: ['Memory is a perfect recording of past events', 'Post-event information can distort existing memories', 'Repressed memories are always accurate', 'Only emotional events are reliably remembered'], answer: 'Post-event information can distort existing memories', explanation: 'Loftus demonstrated that misleading post-event information can alter or create false memories.', points: 1 },

          // ── Module 8: Thinking and Intelligence ───────────────────────────
          { moduleOrder: 8, order: 1, question: 'Searching only for information that confirms existing beliefs is called:', options: ['Functional fixedness', 'Hindsight bias', 'Confirmation bias', 'Availability heuristic'], answer: 'Confirmation bias', explanation: 'Confirmation bias leads people to favor information consistent with their existing beliefs while ignoring contradictory evidence.', points: 1 },
          { moduleOrder: 8, order: 2, question: 'Howard Gardner\'s theory of multiple intelligences proposes that:', options: ['IQ is the most accurate measure of intelligence', 'Intelligence is a single general ability', 'Intelligence encompasses multiple distinct abilities', 'Intelligence is entirely genetic'], answer: 'Intelligence encompasses multiple distinct abilities', explanation: 'Gardner proposed at least 8 distinct intelligences (linguistic, logical-mathematical, musical, etc.).', points: 1 },
          { moduleOrder: 8, order: 3, question: 'A mental shortcut that usually leads to correct answers but is not guaranteed is called a:', options: ['Algorithm', 'Heuristic', 'Schema', 'Mental set'], answer: 'Heuristic', explanation: 'Heuristics are cognitive shortcuts that allow for quick decisions with reasonable accuracy, though not guaranteed correctness.', points: 1 },
          { moduleOrder: 8, order: 4, question: 'The Flynn Effect refers to:', options: ['Declining IQ scores in recent generations', 'Rising average IQ scores across populations over time', 'The heritability of general intelligence', 'IQ differences between genders'], answer: 'Rising average IQ scores across populations over time', explanation: 'The Flynn Effect describes the consistent generational increase in average IQ scores observed across many nations.', points: 1 },
          { moduleOrder: 8, order: 5, question: 'The Sapir-Whorf (linguistic relativity) hypothesis proposes that:', options: ['Language is universal and doesn\'t affect thought', 'The language we speak influences how we think', 'Thought develops completely independently of language', 'All languages share identical grammatical structures'], answer: 'The language we speak influences how we think', explanation: 'Linguistic relativity suggests that the structure and vocabulary of one\'s language shape perception and cognition.', points: 1 },

          // ── Module 9: Developmental Psychology ───────────────────────────
          { moduleOrder: 9, order: 1, question: 'Piaget\'s stage in which children first develop object permanence is the:', options: ['Preoperational stage', 'Concrete operational stage', 'Formal operational stage', 'Sensorimotor stage'], answer: 'Sensorimotor stage', explanation: 'Object permanence — knowing objects exist even when out of sight — develops during the sensorimotor stage (0–2 years).', points: 1 },
          { moduleOrder: 9, order: 2, question: 'Erikson\'s stage of "Identity vs. Role Confusion" is most associated with:', options: ['Infancy', 'Early childhood', 'Middle childhood', 'Adolescence'], answer: 'Adolescence', explanation: 'Erikson\'s fifth stage, Identity vs. Role Confusion, occurs during adolescence as individuals explore who they are.', points: 1 },
          { moduleOrder: 9, order: 3, question: 'Mary Ainsworth\'s Strange Situation experiments were designed to reveal:', options: ['Cognitive development styles', 'Attachment patterns', 'Moral reasoning levels', 'Learning preferences'], answer: 'Attachment patterns', explanation: 'Ainsworth identified secure, anxious-ambivalent, and avoidant attachment patterns using the Strange Situation procedure.', points: 1 },
          { moduleOrder: 9, order: 4, question: 'Vygotsky\'s Zone of Proximal Development (ZPD) refers to:', options: ['Tasks a child can do alone', 'The gap between what a child can do alone versus with guidance', 'Developmental delays in premature infants', 'The period of peak cognitive development'], answer: 'The gap between what a child can do alone versus with guidance', explanation: 'The ZPD identifies tasks a child cannot yet do independently but can accomplish with appropriate support (scaffolding).', points: 1 },
          { moduleOrder: 9, order: 5, question: 'Kohlberg found that most adults operate primarily at which level of moral development?', options: ['Pre-conventional', 'Conventional', 'Post-conventional', 'Intuitive'], answer: 'Conventional', explanation: 'Most adults reason at the conventional level, making moral judgments based on social norms, laws, and maintaining relationships.', points: 1 },

          // ── Module 10: Motivation and Emotion ────────────────────────────
          { moduleOrder: 10, order: 1, question: 'According to Maslow\'s hierarchy, which need must be met before "belonging" needs are addressed?', options: ['Self-actualization', 'Esteem', 'Safety', 'Cognitive'], answer: 'Safety', explanation: 'Maslow\'s hierarchy places safety needs (security, stability) below social belonging needs.', points: 1 },
          { moduleOrder: 10, order: 2, question: 'The James-Lange theory of emotion proposes that emotions:', options: ['Precede physiological arousal', 'Occur simultaneously with physiological responses', 'Are produced by physiological arousal', 'Are triggered by cognitive appraisal alone'], answer: 'Are produced by physiological arousal', explanation: 'James-Lange: we feel afraid BECAUSE we run, not we run because we feel afraid — emotion follows bodily change.', points: 1 },
          { moduleOrder: 10, order: 3, question: 'When someone loses interest in a hobby after being paid to do it, this is the:', options: ['Extrinsic motivation effect', 'Self-actualization effect', 'Overjustification effect', 'Drive reduction effect'], answer: 'Overjustification effect', explanation: 'The overjustification effect occurs when external rewards undermine intrinsic motivation.', points: 1 },
          { moduleOrder: 10, order: 4, question: 'The Schachter-Singer two-factor theory of emotion emphasizes:', options: ['Facial feedback in producing emotions', 'Physiological arousal + cognitive labeling', 'Unconscious drives in emotional responses', 'Hardwired emotional circuits in the brain'], answer: 'Physiological arousal + cognitive labeling', explanation: 'Schachter-Singer: emotion requires both physiological arousal AND a cognitive label for that arousal.', points: 1 },
          { moduleOrder: 10, order: 5, question: 'Intrinsic motivation refers to doing something:', options: ['To earn a reward', 'To avoid punishment', 'For its own inherent satisfaction', 'To meet a social expectation'], answer: 'For its own inherent satisfaction', explanation: 'Intrinsic motivation comes from within — engaging in an activity because it is inherently enjoyable or meaningful.', points: 1 },

          // ── Module 11: Personality ─────────────────────────────────────────
          { moduleOrder: 11, order: 1, question: 'Freud\'s concept of the __________ mediates between the id\'s desires and the superego\'s moral demands.', options: ['Conscious mind', 'Preconscious', 'Ego', 'Defense mechanism'], answer: 'Ego', explanation: 'The ego operates on the reality principle, balancing the id\'s impulses with the superego\'s moral standards.', points: 1 },
          { moduleOrder: 11, order: 2, question: 'According to Carl Rogers, a fully functioning person requires:', options: ['Strict moral discipline', 'Unconditional positive regard', 'A strong superego', 'Behavioral conditioning'], answer: 'Unconditional positive regard', explanation: 'Rogers believed healthy development requires acceptance and respect regardless of one\'s actions — unconditional positive regard.', points: 1 },
          { moduleOrder: 11, order: 3, question: 'Which of the following is NOT one of the Big Five personality traits?', options: ['Openness', 'Neuroticism', 'Extraversion', 'Submissiveness'], answer: 'Submissiveness', explanation: 'The Big Five (OCEAN) are: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.', points: 1 },
          { moduleOrder: 11, order: 4, question: 'The Minnesota Multiphasic Personality Inventory (MMPI) is an example of a:', options: ['Projective test', 'Self-report inventory', 'Behavioral assessment', 'Neuropsychological test'], answer: 'Self-report inventory', explanation: 'The MMPI is a standardized self-report questionnaire used to assess personality traits and psychological disorders.', points: 1 },
          { moduleOrder: 11, order: 5, question: 'The Rorschach inkblot test is classified as a:', options: ['Self-report inventory', 'Behavioral checklist', 'Projective test', 'Structured clinical interview'], answer: 'Projective test', explanation: 'Projective tests present ambiguous stimuli for subjects to interpret, theoretically revealing unconscious thoughts.', points: 1 },

          // ── Module 12: Social Psychology ──────────────────────────────────
          { moduleOrder: 12, order: 1, question: 'Attributing others\' behavior to internal traits while ignoring situational factors is the:', options: ['Actor-observer bias', 'Self-serving bias', 'Fundamental attribution error', 'Cognitive dissonance'], answer: 'Fundamental attribution error', explanation: 'The FAE describes the tendency to over-attribute others\' behavior to character while under-weighting situational influences.', points: 1 },
          { moduleOrder: 12, order: 2, question: 'Milgram\'s obedience experiments demonstrated that:', options: ['People rarely comply with authority figures', 'Ordinary people can follow orders to harm others', 'Conformity is more powerful than obedience', 'Social pressure has little effect on behavior'], answer: 'Ordinary people can follow orders to harm others', explanation: 'Milgram found that 65% of participants delivered the maximum apparent shock under experimenter authority.', points: 1 },
          { moduleOrder: 12, order: 3, question: 'Asch\'s conformity experiments showed that people gave incorrect answers primarily to:', options: ['Gain monetary rewards', 'Avoid cognitive dissonance', 'Avoid standing out from the group', 'Test the limits of social norms'], answer: 'Avoid standing out from the group', explanation: 'Most participants conformed to clearly wrong group answers to avoid social rejection or embarrassment.', points: 1 },
          { moduleOrder: 12, order: 4, question: 'Cognitive dissonance occurs when we:', options: ['Conform to group pressure', 'Hold contradictory beliefs or act against our beliefs', 'Attribute behavior to situational factors', 'Display in-group favoritism'], answer: 'Hold contradictory beliefs or act against our beliefs', explanation: 'Cognitive dissonance is the psychological discomfort of holding inconsistent cognitions or acting contrary to one\'s beliefs.', points: 1 },
          { moduleOrder: 12, order: 5, question: 'The bystander effect predicts individuals are __________ likely to help in an emergency when others are present.', options: ['More', 'Less', 'Equally', 'Completely unpredictably'], answer: 'Less', explanation: 'Diffusion of responsibility means each person feels less personally obligated to act when others are present.', points: 1 },

          // ── Module 13: Psychological Disorders ───────────────────────────
          { moduleOrder: 13, order: 1, question: 'The primary classification system for mental disorders used in the U.S. is the:', options: ['ICD-10', 'Psychodynamic Diagnostic Manual', 'DSM-5', 'WHO Mental Health Atlas'], answer: 'DSM-5', explanation: 'The Diagnostic and Statistical Manual of Mental Disorders, 5th edition (DSM-5) is published by the APA and is the standard classification tool in the U.S.', points: 1 },
          { moduleOrder: 13, order: 2, question: 'Major depressive disorder is characterized by all of the following EXCEPT:', options: ['Persistent sadness', 'Loss of interest in activities', 'Periods of elevated mood and grandiosity', 'Changes in sleep and appetite'], answer: 'Periods of elevated mood and grandiosity', explanation: 'Elevated mood and grandiosity (mania) characterize bipolar disorder, not major depressive disorder.', points: 1 },
          { moduleOrder: 13, order: 3, question: 'A person who checks whether the door is locked 40 times before leaving home most likely shows symptoms of:', options: ['Generalized Anxiety Disorder', 'PTSD', 'Obsessive-Compulsive Disorder', 'Specific Phobia'], answer: 'Obsessive-Compulsive Disorder', explanation: 'OCD is characterized by recurring obsessions (intrusive thoughts) and/or compulsions (repetitive behaviors) that reduce anxiety.', points: 1 },
          { moduleOrder: 13, order: 4, question: 'Schizophrenia is primarily characterized by:', options: ['Extreme mood swings between mania and depression', 'Multiple distinct personality states', 'Hallucinations, delusions, and disorganized thinking', 'Persistent, irrational fears'], answer: 'Hallucinations, delusions, and disorganized thinking', explanation: 'Schizophrenia is a psychotic disorder featuring positive symptoms (hallucinations, delusions) and negative symptoms (flat affect, alogia).', points: 1 },
          { moduleOrder: 13, order: 5, question: 'The diathesis-stress model of psychological disorders proposes that disorders result from:', options: ['Pure genetic factors', 'Purely environmental triggers', 'A combination of genetic vulnerability and environmental stress', 'Repressed childhood memories'], answer: 'A combination of genetic vulnerability and environmental stress', explanation: 'The diathesis-stress model: a biological predisposition (diathesis) combined with stressful life events triggers a disorder.', points: 1 },

          // ── Module 14: Treatment and Therapy ──────────────────────────────
          { moduleOrder: 14, order: 1, question: 'Cognitive-behavioral therapy (CBT) focuses primarily on:', options: ['Exploring unconscious childhood conflicts', 'Changing maladaptive thought patterns and behaviors', 'Prescribing medication for symptom relief', 'Encouraging peak experiences and self-actualization'], answer: 'Changing maladaptive thought patterns and behaviors', explanation: 'CBT targets cognitive distortions (unhelpful thinking patterns) and uses behavioral techniques to create lasting change.', points: 1 },
          { moduleOrder: 14, order: 2, question: 'Which type of therapy involves free association and dream analysis?', options: ['Cognitive therapy', 'Behavioral therapy', 'Humanistic therapy', 'Psychoanalysis'], answer: 'Psychoanalysis', explanation: 'Freudian psychoanalysis uses free association and dream interpretation to uncover unconscious conflicts.', points: 1 },
          { moduleOrder: 14, order: 3, question: 'SSRIs are most commonly prescribed to treat:', options: ['Schizophrenia', 'Depression and anxiety disorders', 'Bipolar disorder exclusively', 'ADHD'], answer: 'Depression and anxiety disorders', explanation: 'Selective serotonin reuptake inhibitors are the first-line pharmacological treatment for depression and many anxiety disorders.', points: 1 },
          { moduleOrder: 14, order: 4, question: 'Systematic desensitization treats phobias by:', options: ['Prescribing anti-anxiety medication', 'Analyzing the unconscious roots of the fear', 'Pairing relaxation with gradual exposure to the feared stimulus', 'Removing the patient from anxiety-provoking situations'], answer: 'Pairing relaxation with gradual exposure to the feared stimulus', explanation: 'Systematic desensitization uses a hierarchy of feared stimuli with relaxation training to extinguish the fear response.', points: 1 },
          { moduleOrder: 14, order: 5, question: 'Research consistently shows that for most psychological disorders, the most effective treatment combines:', options: ['Medication alone', 'Therapy alone', 'Medication and psychotherapy together', 'Hospitalization and supervision'], answer: 'Medication and psychotherapy together', explanation: 'Meta-analyses show that combined pharmacological and psychological treatment outperforms either approach alone for most disorders.', points: 1 },
        ],
      },
    },
  });

  console.log('Seeded: Introduction to Psychology (14 modules, 20 final + 15 midterm exam questions, 70 module quiz questions)');
}

async function seedWorldHistory() {
  const course = {
    slug: 'world-history',
    name: 'World History',
    nameZh: '世界历史',
    credits: 1.0,
    department: 'Social Studies',
    type: 'Core',
    description: 'A survey of human civilizations from ancient Mesopotamia through the modern era, examining political, economic, social, and cultural developments across the globe.',
    isPublished: true,
  };

  const existing = await prisma.course.findUnique({ where: { slug: course.slug } });
  if (existing) { await prisma.course.delete({ where: { slug: course.slug } }); }

  await prisma.course.create({
    data: {
      ...course,
      modules: {
        create: [
          {
            order: 1, title: 'Early Humans & the Neolithic Revolution', titleZh: '早期人类与新石器革命',
            objectives: 'Trace human migration out of Africa; explain how agriculture transformed society.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/1-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 1: Prehistory',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/world-history-beginnings/origin-humans-early-societies/v/the-agricultural-revolution',
            videoNote: 'Khan Academy — The Agricultural Revolution',
            video2Url: 'https://www.youtube.com/watch?v=nJPIoeh9FDs',
            video2Note: 'Crash Course World History #1 — The Agricultural Revolution',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/world-history-beginnings/origin-humans-early-societies/a/where-did-humans-come-from',
            practiceNote: 'Khan Academy — Early Humans reading & questions',
            assignment: 'Compare hunter-gatherer life with early agricultural societies on 3 dimensions: diet, social structure, and population density.',
            estimatedHrs: 3.0,
          },
          {
            order: 2, title: 'Ancient Mesopotamia & Egypt', titleZh: '古代美索不达米亚与埃及',
            objectives: 'Describe the rise of river-valley civilizations; analyze writing, law codes, and monumental architecture.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/2-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 2: Early Civilizations',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/world-history-beginnings/ancient-mesopotamia/v/mesopotamia-and-the-fertile-crescent-world-history',
            videoNote: 'Khan Academy — Mesopotamia & the Fertile Crescent',
            video2Url: 'https://www.youtube.com/watch?v=sohXPx_XZ6Y',
            video2Note: 'Crash Course World History #3 — Mesopotamia',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/world-history-beginnings/ancient-mesopotamia/a/ancient-mesopotamia-article',
            practiceNote: 'Khan Academy — Mesopotamia article & questions',
            assignment: "Compare Hammurabi's Code with a modern law. What does each reveal about its society's values?",
            estimatedHrs: 3.0,
          },
          {
            order: 3, title: 'Ancient India & China', titleZh: '古代印度与中国',
            objectives: 'Identify the key features of the Indus Valley Civilization; trace the Shang and Zhou dynasties of China.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/3-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 3: India & China',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/ancient-civilizations/ancient-india-art-culture/v/indus-valley-civilization',
            videoNote: 'Khan Academy — Indus Valley Civilization',
            video2Url: 'https://www.youtube.com/watch?v=pgRXqbAI9U4',
            video2Note: 'Crash Course World History #8 — Ancient India',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/ancient-civilizations/ancient-india-art-culture/a/the-indus-river-valley-civilizations',
            practiceNote: 'Khan Academy — Ancient India reading & questions',
            assignment: 'Create a table comparing political structure, religion, and trade of early India and early China.',
            estimatedHrs: 3.0,
          },
          {
            order: 4, title: 'Ancient Greece & the Persian Wars', titleZh: '古希腊与波斯战争',
            objectives: 'Explain the development of democracy in Athens; analyze the causes and consequences of the Persian Wars.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/5-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 5: The Greeks',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/ancient-civilizations/ancient-greece-hittites/v/ancient-greece',
            videoNote: 'Khan Academy — Ancient Greece',
            video2Url: 'https://www.youtube.com/watch?v=AvFl6UBZLv4',
            video2Note: 'Crash Course World History #5 — Ancient Greece',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/ancient-civilizations/ancient-greece-hittites/a/athens-article',
            practiceNote: 'Khan Academy — Athens article & questions',
            assignment: 'Evaluate: Was Athenian democracy truly democratic? Support your argument with specific evidence.',
            estimatedHrs: 3.5,
          },
          {
            order: 5, title: 'The Roman Empire', titleZh: '罗马帝国',
            objectives: "Trace Rome's rise from republic to empire; explain factors that led to its fall.",
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/6-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 6: Rome',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/ancient-civilizations/roman-republic/v/roman-empire',
            videoNote: 'Khan Academy — The Roman Empire',
            video2Url: 'https://www.youtube.com/watch?v=oPj2_1HwpIE',
            video2Note: 'Crash Course World History #10 — The Roman Empire',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/ancient-civilizations/roman-republic/a/roman-republic-article',
            practiceNote: 'Khan Academy — Roman Republic article & questions',
            assignment: "Analyze three internal and two external factors in Rome's decline. Which was most significant and why?",
            estimatedHrs: 3.5,
          },
          {
            order: 6, title: 'The Rise of Islam & Islamic Golden Age', titleZh: '伊斯兰的兴起与黄金时代',
            objectives: 'Describe the origins of Islam; explain the spread of the Islamic caliphates and their cultural contributions.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/11-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 11: Islam',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/medieval-times/cross-cultural-diffusion-of-knowledge/v/islam-and-the-caliphates',
            videoNote: 'Khan Academy — Islam & the Caliphates',
            video2Url: 'https://www.youtube.com/watch?v=TgtSFkZHSMY',
            video2Note: 'Crash Course World History #13 — Islam',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/medieval-times/cross-cultural-diffusion-of-knowledge/a/what-is-the-islamic-golden-age',
            practiceNote: 'Khan Academy — Islamic Golden Age article & questions',
            assignment: 'Identify 3 scientific or mathematical contributions of the Islamic Golden Age and explain their lasting impact.',
            estimatedHrs: 3.0,
          },
          {
            order: 7, title: 'Medieval Europe & the Feudal System', titleZh: '中世纪欧洲与封建制度',
            objectives: 'Explain how feudalism organized medieval society; analyze the role of the Catholic Church.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/12-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 12: Medieval Europe',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/medieval-times/european-middle-ages/v/feudalism-and-the-feudal-system',
            videoNote: 'Khan Academy — Feudalism',
            video2Url: 'https://www.youtube.com/watch?v=Pr-8AP0To4k',
            video2Note: 'Crash Course World History #14 — The Dark Ages',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/medieval-times/european-middle-ages/a/feudalism-article',
            practiceNote: 'Khan Academy — Feudalism article & questions',
            assignment: 'Draw and label a feudal pyramid. Write a paragraph explaining how each level depended on the others.',
            estimatedHrs: 3.0,
          },
          {
            order: 8, title: 'The Mongol Empire & Global Trade', titleZh: '蒙古帝国与全球贸易',
            objectives: 'Assess the impact of Mongol conquests on Eurasia; explain how the Silk Road facilitated cultural exchange.',
            readingUrl: 'https://openstax.org/books/world-history-volume-1/pages/13-introduction',
            readingNote: 'OpenStax World History Vol 1 — Ch 13: The Mongols',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/medieval-times/mongol-empire/v/the-mongols',
            videoNote: 'Khan Academy — The Mongols',
            video2Url: 'https://www.youtube.com/watch?v=szxPar0BcMo',
            video2Note: 'Crash Course World History #17 — Mongols',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/medieval-times/mongol-empire/a/the-mongol-empire-article',
            practiceNote: 'Khan Academy — Mongol Empire article & questions',
            assignment: 'Was the Mongol Empire a force for destruction or development? Write a 300-word position essay.',
            estimatedHrs: 3.0,
          },
          {
            order: 9, title: 'The Renaissance & Reformation', titleZh: '文艺复兴与宗教改革',
            objectives: 'Describe humanist ideas of the Renaissance; explain causes and consequences of the Protestant Reformation.',
            readingUrl: 'https://openstax.org/books/world-history-volume-2/pages/1-introduction',
            readingNote: 'OpenStax World History Vol 2 — Ch 1: Renaissance & Reformation',
            videoUrl: 'https://www.khanacademy.org/humanities/renaissance-reformation/renaissance-in-europe/an-introduction-to-the-renaissance/v/an-introduction-to-the-renaissance',
            videoNote: 'Khan Academy — Introduction to the Renaissance',
            video2Url: 'https://www.youtube.com/watch?v=1SnFYSxpHiM',
            video2Note: 'Crash Course World History #22 — The Renaissance & Reformation',
            practiceUrl: 'https://www.khanacademy.org/humanities/renaissance-reformation/reformation-in-europe/introduction-reformation/a/reformation-article',
            practiceNote: 'Khan Academy — Reformation article & questions',
            assignment: 'How did the printing press accelerate both the Renaissance and the Reformation? Give two specific examples for each.',
            estimatedHrs: 3.0,
          },
          {
            order: 10, title: 'The Age of Exploration & Columbian Exchange', titleZh: '大航海时代与哥伦布大交换',
            objectives: 'Explain European motivations for exploration; assess the global impact of the Columbian Exchange.',
            readingUrl: 'https://openstax.org/books/world-history-volume-2/pages/2-introduction',
            readingNote: 'OpenStax World History Vol 2 — Ch 2: Age of Exploration',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/eurasia-and-global-interaction/age-of-exploration/v/the-columbian-exchange',
            videoNote: 'Khan Academy — The Columbian Exchange',
            video2Url: 'https://www.youtube.com/watch?v=VN1GnhGtfAA',
            video2Note: 'Crash Course World History #23 — Exploration',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/eurasia-and-global-interaction/age-of-exploration/a/columbian-exchange-article',
            practiceNote: 'Khan Academy — Columbian Exchange article & questions',
            assignment: 'List 4 items exchanged between the Old and New Worlds. For each, describe one positive and one negative consequence.',
            estimatedHrs: 3.0,
          },
          {
            order: 11, title: 'The Atlantic Slave Trade & Colonial Americas', titleZh: '大西洋奴隶贸易与殖民地美洲',
            objectives: 'Describe the scale and mechanics of the Atlantic slave trade; analyze its long-term economic and social effects.',
            readingUrl: 'https://openstax.org/books/world-history-volume-2/pages/3-introduction',
            readingNote: 'OpenStax World History Vol 2 — Ch 3: Colonialism & Slavery',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/1600s-1800s/slavery-neocolonialism/v/the-slave-trade',
            videoNote: 'Khan Academy — The Slave Trade',
            video2Url: 'https://www.youtube.com/watch?v=dnV_MTMH4oQ',
            video2Note: 'Crash Course World History #24 — Atlantic Slave Trade',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/1600s-1800s/slavery-neocolonialism/a/slavery-in-the-americas-article',
            practiceNote: 'Khan Academy — Slavery in the Americas article & questions',
            assignment: 'Describe three ways the Atlantic slave trade shaped the economies of Europe, Africa, and the Americas.',
            estimatedHrs: 3.0,
          },
          {
            order: 12, title: 'The Scientific Revolution & Enlightenment', titleZh: '科学革命与启蒙运动',
            objectives: 'Trace the shift to empirical thinking; connect Enlightenment ideas to political revolutions.',
            readingUrl: 'https://openstax.org/books/world-history-volume-2/pages/4-introduction',
            readingNote: 'OpenStax World History Vol 2 — Ch 4: Scientific Revolution & Enlightenment',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/1600s-1800s/enlightenment-revolution/v/the-enlightenment',
            videoNote: 'Khan Academy — The Enlightenment',
            video2Url: 'https://www.youtube.com/watch?v=NnoFj2cMRLY',
            video2Note: 'Crash Course World History #29 — Enlightenment',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/1600s-1800s/enlightenment-revolution/a/enlightenment-article',
            practiceNote: 'Khan Academy — Enlightenment article & questions',
            assignment: 'Choose one Enlightenment thinker. Write a paragraph on their main idea and which modern right or institution it inspired.',
            estimatedHrs: 3.0,
          },
          {
            order: 13, title: 'The Industrial Revolution', titleZh: '工业革命',
            objectives: 'Explain why industrialization began in Britain; analyze social consequences including urbanization and labor movements.',
            readingUrl: 'https://openstax.org/books/world-history-volume-2/pages/7-introduction',
            readingNote: 'OpenStax World History Vol 2 — Ch 7: Industrial Revolution',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/1600s-1800s/europe-and-industrial-revolution/v/the-industrial-revolution',
            videoNote: 'Khan Academy — The Industrial Revolution',
            video2Url: 'https://www.youtube.com/watch?v=zhL5DCizj5c',
            video2Note: 'Crash Course World History #32 — Industrial Revolution',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/1600s-1800s/europe-and-industrial-revolution/a/why-europe-industrialized-first',
            practiceNote: 'Khan Academy — Industrial Revolution article & questions',
            assignment: 'Research one positive and one negative effect of the Industrial Revolution. Write a 250-word analysis.',
            estimatedHrs: 3.5,
          },
          {
            order: 14, title: 'World Wars & the Modern World', titleZh: '两次世界大战与现代世界',
            objectives: 'Identify causes of WWI and WWII; explain how these conflicts reshaped global power structures.',
            readingUrl: 'https://openstax.org/books/world-history-volume-2/pages/10-introduction',
            readingNote: 'OpenStax World History Vol 2 — Ch 10: World War I',
            videoUrl: 'https://www.khanacademy.org/humanities/world-history/euro-hist/world-war-i-tutorial/v/world-war-i',
            videoNote: 'Khan Academy — World War I',
            video2Url: 'https://www.youtube.com/watch?v=Cd_o5O0Ci0E',
            video2Note: 'Crash Course World History #36 — World War II',
            practiceUrl: 'https://www.khanacademy.org/humanities/world-history/euro-hist/world-war-i-tutorial/a/world-war-i-article',
            practiceNote: 'Khan Academy — WWI article & questions',
            assignment: 'Write a 300-word essay: How did the Treaty of Versailles plant the seeds of WWII?',
            estimatedHrs: 4.0,
          },
        ],
      },
      questions: {
        create: [
          // Midterm (modules 1–7)
          { examType: 'midterm', order: 1, question: 'Which of the following best describes the Neolithic Revolution?', type: 'mc', options: ["The discovery of fire", "The transition from nomadic to agricultural lifestyles", "The invention of the wheel", "The migration of humans from Africa"], answer: "The transition from nomadic to agricultural lifestyles", explanation: '', points: 1 },
          { examType: 'midterm', order: 2, question: 'Mesopotamia is located between which two rivers?', type: 'mc', options: ["Nile and Niger", "Rhine and Danube", "Tigris and Euphrates", "Indus and Ganges"], answer: "Tigris and Euphrates", explanation: '', points: 1 },
          { examType: 'midterm', order: 3, question: "Hammurabi's Code is historically significant because it:", type: 'mc', options: ["Was the first known written law code", "Granted equal rights to all people", "Established democracy", "Created the first alphabet"], answer: "Was the first known written law code", explanation: '', points: 1 },
          { examType: 'midterm', order: 4, question: 'Which civilization built the Indus Valley cities of Mohenjo-daro and Harappa?', type: 'mc', options: ["Dravidians", "Aryans", "Mesopotamians", "Harappan civilization"], answer: "Harappan civilization", explanation: '', points: 1 },
          { examType: 'midterm', order: 5, question: 'The Mandate of Heaven was a political concept from:', type: 'mc', options: ["Ancient Egypt", "Ancient China", "Ancient Greece", "Ancient Rome"], answer: "Ancient China", explanation: '', points: 1 },
          { examType: 'midterm', order: 6, question: 'Athenian democracy differed from modern democracy primarily because:', type: 'mc', options: ["Citizens voted on all laws directly", "Slaves and women could not participate", "There was no written constitution", "Both A and B"], answer: "Both A and B", explanation: '', points: 1 },
          { examType: 'midterm', order: 7, question: 'The Persian Wars (490–480 BCE) were fought between:', type: 'mc', options: ["Greece and Rome", "Athens and Sparta", "Greece and Persia", "Egypt and Persia"], answer: "Greece and Persia", explanation: '', points: 1 },
          { examType: 'midterm', order: 8, question: "Rome's transition from Republic to Empire was triggered largely by:", type: 'mc', options: ["An invasion from Carthage", "Political instability and Julius Caesar's dictatorship", "A popular referendum", "Economic collapse"], answer: "Political instability and Julius Caesar's dictatorship", explanation: '', points: 1 },
          { examType: 'midterm', order: 9, question: 'Which religion emerged from the Arabian Peninsula in the 7th century CE?', type: 'mc', options: ["Buddhism", "Hinduism", "Islam", "Christianity"], answer: "Islam", explanation: '', points: 1 },
          { examType: 'midterm', order: 10, question: 'The Islamic Golden Age is best known for contributions to:', type: 'mc', options: ["Military conquest only", "Mathematics, astronomy, and medicine", "Naval exploration", "Gothic architecture"], answer: "Mathematics, astronomy, and medicine", explanation: '', points: 1 },
          { examType: 'midterm', order: 11, question: 'In the feudal system, lords received land (fiefs) from:', type: 'mc', options: ["Merchants", "Serfs", "The king or higher lords", "The Pope"], answer: "The king or higher lords", explanation: '', points: 1 },
          { examType: 'midterm', order: 12, question: 'The Silk Road primarily facilitated:', type: 'mc', options: ["Military invasions", "Trade and cultural exchange between East and West", "Forced migrations", "Religious wars"], answer: "Trade and cultural exchange between East and West", explanation: '', points: 1 },
          { examType: 'midterm', order: 13, question: 'Genghis Khan united the Mongol tribes around:', type: 'mc', options: ["800 CE", "1200 CE", "1500 CE", "1000 CE"], answer: "1200 CE", explanation: '', points: 1 },
          { examType: 'midterm', order: 14, question: "The Black Death (1346–1353) killed approximately what fraction of Europe's population?", type: 'mc', options: ["One-tenth", "One-quarter", "One-third", "Two-thirds"], answer: "One-third", explanation: '', points: 1 },
          { examType: 'midterm', order: 15, question: 'Which city-state was the center of the Italian Renaissance?', type: 'mc', options: ["Rome", "Venice", "Florence", "Milan"], answer: "Florence", explanation: '', points: 1 },

          // Final (modules 1–14)
          { examType: 'final', order: 1, question: 'Agriculture first emerged independently in multiple regions including:', type: 'mc', options: ["Only the Fertile Crescent", "The Fertile Crescent, China, and Mesoamerica", "Only Europe", "Only Africa"], answer: "The Fertile Crescent, China, and Mesoamerica", explanation: '', points: 1 },
          { examType: 'final', order: 2, question: "Egypt's Old Kingdom is best known for:", type: 'mc', options: ["The Exodus", "Building pyramids at Giza", "Military campaigns in Persia", "Creating democracy"], answer: "Building pyramids at Giza", explanation: '', points: 1 },
          { examType: 'final', order: 3, question: 'The caste system in ancient India was tied to:', type: 'mc', options: ["Geography", "Economic wealth", "Hindu religious beliefs", "Military rank"], answer: "Hindu religious beliefs", explanation: '', points: 1 },
          { examType: 'final', order: 4, question: "Alexander the Great's conquests spread which culture across the Middle East and Central Asia?", type: 'mc', options: ["Roman", "Hellenistic (Greek)", "Persian", "Egyptian"], answer: "Hellenistic (Greek)", explanation: '', points: 1 },
          { examType: 'final', order: 5, question: "The Pax Romana refers to:", type: 'mc', options: ["A peace treaty with Carthage", "Two centuries of relative peace in the Roman Empire", "Roman surrender to the Germanic tribes", "The founding of the Republic"], answer: "Two centuries of relative peace in the Roman Empire", explanation: '', points: 1 },
          { examType: 'final', order: 6, question: 'The Five Pillars of Islam include all EXCEPT:', type: 'mc', options: ["Salah (prayer)", "Hajj (pilgrimage)", "Meditation", "Zakat (charity)"], answer: "Meditation", explanation: '', points: 1 },
          { examType: 'final', order: 7, question: 'Serfs in medieval Europe were different from enslaved people because:', type: 'mc', options: ["They were paid wages", "They were bound to the land but not owned as property", "They could vote", "They were free to move anywhere"], answer: "They were bound to the land but not owned as property", explanation: '', points: 1 },
          { examType: 'final', order: 8, question: "The Mongol Empire's 'Pax Mongolica' refers to:", type: 'mc', options: ["Religious unification of Asia", "A period of relative stability enabling trade across Eurasia", "A peace treaty with China", "Genghis Khan's conversion to Buddhism"], answer: "A period of relative stability enabling trade across Eurasia", explanation: '', points: 1 },
          { examType: 'final', order: 9, question: 'The printing press, invented by Gutenberg around 1440, most directly:', type: 'mc', options: ["Caused the Black Death", "Spread ideas of the Renaissance and Reformation rapidly", "Ended feudalism", "Led to the discovery of the Americas"], answer: "Spread ideas of the Renaissance and Reformation rapidly", explanation: '', points: 1 },
          { examType: 'final', order: 10, question: "Columbus's 1492 voyage was funded by:", type: 'mc', options: ["England", "Portugal", "Spain", "France"], answer: "Spain", explanation: '', points: 1 },
          { examType: 'final', order: 11, question: 'The Middle Passage refers to:', type: 'mc', options: ["A mountain route through the Alps", "The sea journey enslaved Africans were forced to take to the Americas", "A trade route through Central Asia", "A canal connecting the Mediterranean to the Red Sea"], answer: "The sea journey enslaved Africans were forced to take to the Americas", explanation: '', points: 1 },
          { examType: 'final', order: 12, question: "Isaac Newton's laws of motion are a product of which intellectual movement?", type: 'mc', options: ["The Reformation", "The Renaissance", "The Scientific Revolution", "The Enlightenment"], answer: "The Scientific Revolution", explanation: '', points: 1 },
          { examType: 'final', order: 13, question: 'The Industrial Revolution began first in:', type: 'mc', options: ["France", "Germany", "Britain", "United States"], answer: "Britain", explanation: '', points: 1 },
          { examType: 'final', order: 14, question: 'The spark that ignited World War I was:', type: 'mc', options: ["Germany's invasion of France", "The assassination of Archduke Franz Ferdinand", "Britain's blockade of Germany", "Russia's revolution"], answer: "The assassination of Archduke Franz Ferdinand", explanation: '', points: 1 },
          { examType: 'final', order: 15, question: 'The Treaty of Versailles (1919) contributed to WWII by:', type: 'mc', options: ["Giving Germany new territories", "Eliminating war reparations", "Imposing harsh penalties that fueled German resentment", "Creating the United Nations"], answer: "Imposing harsh penalties that fueled German resentment", explanation: '', points: 1 },
          { examType: 'final', order: 16, question: 'The Holocaust refers to:', type: 'mc', options: ["Germany's firebombing of Britain", "Nazi Germany's genocide of six million Jews and others", "The Allied bombing of Dresden", "The Japanese attack on Pearl Harbor"], answer: "Nazi Germany's genocide of six million Jews and others", explanation: '', points: 1 },
          { examType: 'final', order: 17, question: 'Decolonization in the mid-20th century was primarily driven by:', type: 'mc', options: ["Economic agreements", "Nationalist movements demanding independence", "Soviet expansion", "UN military force"], answer: "Nationalist movements demanding independence", explanation: '', points: 1 },
          { examType: 'final', order: 18, question: 'The Cold War was characterized by:', type: 'mc', options: ["Direct military conflict between the US and USSR", "Proxy wars, arms races, and ideological competition", "Economic cooperation between superpowers", "Nuclear exchange"], answer: "Proxy wars, arms races, and ideological competition", explanation: '', points: 1 },
          { examType: 'final', order: 19, question: 'Globalization in the late 20th century was accelerated by:', type: 'mc', options: ["The printing press", "The steam engine", "The internet and containerized shipping", "The Industrial Revolution alone"], answer: "The internet and containerized shipping", explanation: '', points: 1 },
          { examType: 'final', order: 20, question: 'The United Nations was founded after WWII primarily to:', type: 'mc', options: ["Replace all national governments", "Promote international peace and cooperation", "Enforce a world government", "Divide the world between the US and USSR"], answer: "Promote international peace and cooperation", explanation: '', points: 1 },
        ],
      },
      quizQuestions: {
        create: [
          // Module 1
          { moduleOrder: 1, order: 1, question: 'What is the Neolithic Revolution?', options: ["A military uprising", "Transition from hunting-gathering to farming", "The invention of writing", "Building of the first cities"], answer: "Transition from hunting-gathering to farming", explanation: '', points: 1 },
          { moduleOrder: 1, order: 2, question: 'Which feature best defines a civilization?', options: ["Nomadic lifestyle", "Complex society with cities, government, and specialization", "Use of stone tools", "Hunter-gatherer economy"], answer: "Complex society with cities, government, and specialization", explanation: '', points: 1 },
          { moduleOrder: 1, order: 3, question: 'Where did Homo sapiens first evolve?', options: ["Asia", "Europe", "Africa", "Australia"], answer: "Africa", explanation: '', points: 1 },
          { moduleOrder: 1, order: 4, question: 'Agriculture allowed populations to:', options: ["Remain small and mobile", "Grow larger and settle permanently", "Decline due to disease", "Depend entirely on hunting"], answer: "Grow larger and settle permanently", explanation: '', points: 1 },
          { moduleOrder: 1, order: 5, question: 'The Paleolithic era is characterized by:', options: ["Farming and settlement", "Use of iron tools", "Nomadic hunting and gathering", "Urban civilization"], answer: "Nomadic hunting and gathering", explanation: '', points: 1 },

          // Module 2
          { moduleOrder: 2, order: 1, question: 'The first civilization emerged in:', options: ["Egypt", "Mesopotamia (Sumer)", "India", "China"], answer: "Mesopotamia (Sumer)", explanation: '', points: 1 },
          { moduleOrder: 2, order: 2, question: "Hammurabi's Code is significant because:", options: ["It abolished slavery", "It was among the first written legal codes", "It established democracy", "It created a professional army"], answer: "It was among the first written legal codes", explanation: '', points: 1 },
          { moduleOrder: 2, order: 3, question: 'The Nile River was important to ancient Egypt because:', options: ["It provided a trade route to Rome", "Its annual floods deposited fertile silt", "It was a military barrier only", "It connected Egypt to Mesopotamia"], answer: "Its annual floods deposited fertile silt", explanation: '', points: 1 },
          { moduleOrder: 2, order: 4, question: 'Cuneiform is best described as:', options: ["An Egyptian hieroglyph system", "An early writing system from Mesopotamia", "A Chinese character system", "A Greek alphabet"], answer: "An early writing system from Mesopotamia", explanation: '', points: 1 },
          { moduleOrder: 2, order: 5, question: "Egyptian pharaohs were considered:", options: ["Elected officials", "Military generals only", "Divine rulers — gods on earth", "High priests with no political power"], answer: "Divine rulers — gods on earth", explanation: '', points: 1 },

          // Module 3
          { moduleOrder: 3, order: 1, question: 'The Indus Valley Civilization flourished along which river?', options: ["Ganges", "Indus", "Brahmaputra", "Yamuna"], answer: "Indus", explanation: '', points: 1 },
          { moduleOrder: 3, order: 2, question: 'Ancient China was founded along which river?', options: ["Yangtze", "Pearl", "Yellow River (Huang He)", "Mekong"], answer: "Yellow River (Huang He)", explanation: '', points: 1 },
          { moduleOrder: 3, order: 3, question: 'The Vedas are sacred texts of:', options: ["Buddhism", "Hinduism", "Islam", "Confucianism"], answer: "Hinduism", explanation: '', points: 1 },
          { moduleOrder: 3, order: 4, question: 'The Mandate of Heaven legitimized the rule of Chinese dynasties by:', options: ["Military conquest", "Popular elections", "Divine approval that could be revoked by bad rulers", "Inherited wealth"], answer: "Divine approval that could be revoked by bad rulers", explanation: '', points: 1 },
          { moduleOrder: 3, order: 5, question: "Harappa and Mohenjo-daro are notable because of their:", options: ["Large armies", "Advanced urban planning and sanitation", "Massive pyramids", "Written legal codes"], answer: "Advanced urban planning and sanitation", explanation: '', points: 1 },

          // Module 4
          { moduleOrder: 4, order: 1, question: 'What form of government did ancient Athens develop?', options: ["Monarchy", "Oligarchy", "Direct democracy", "Theocracy"], answer: "Direct democracy", explanation: '', points: 1 },
          { moduleOrder: 4, order: 2, question: 'The Battle of Marathon (490 BCE) was fought between:', options: ["Athens and Sparta", "Greeks and Persians", "Rome and Greece", "Persia and Egypt"], answer: "Greeks and Persians", explanation: '', points: 1 },
          { moduleOrder: 4, order: 3, question: "Sparta's society was primarily organized around:", options: ["Trade and commerce", "Philosophy and art", "Military training and discipline", "Democratic governance"], answer: "Military training and discipline", explanation: '', points: 1 },
          { moduleOrder: 4, order: 4, question: 'Alexander the Great was a student of:', options: ["Socrates", "Plato", "Aristotle", "Pythagoras"], answer: "Aristotle", explanation: '', points: 1 },
          { moduleOrder: 4, order: 5, question: 'Hellenism refers to:', options: ["A Greek religious movement", "The spread of Greek culture after Alexander", "The decline of Athens", "The Persian Empire"], answer: "The spread of Greek culture after Alexander", explanation: '', points: 1 },

          // Module 5
          { moduleOrder: 5, order: 1, question: "Rome's government before 27 BCE was a:", options: ["Democracy", "Monarchy", "Republic", "Theocracy"], answer: "Republic", explanation: '', points: 1 },
          { moduleOrder: 5, order: 2, question: 'Julius Caesar was assassinated in:', options: ["100 BCE", "44 BCE", "27 BCE", "476 CE"], answer: "44 BCE", explanation: '', points: 1 },
          { moduleOrder: 5, order: 3, question: "A major factor in Rome's fall was:", options: ["Overpopulation of cities", "Lack of military", "Political corruption and Germanic invasions", "A volcanic eruption"], answer: "Political corruption and Germanic invasions", explanation: '', points: 1 },
          { moduleOrder: 5, order: 4, question: 'Roman law contributed to modern legal systems through the concept of:', options: ["Guilty until proven innocent", "Innocent until proven guilty", "Trial by combat", "Divine judgment"], answer: "Innocent until proven guilty", explanation: '', points: 1 },
          { moduleOrder: 5, order: 5, question: 'The Pax Romana lasted approximately:', options: ["50 years", "100 years", "200 years", "500 years"], answer: "200 years", explanation: '', points: 1 },

          // Module 6
          { moduleOrder: 6, order: 1, question: 'Islam was founded by the Prophet Muhammad in:', options: ["Jerusalem", "Baghdad", "Mecca", "Cairo"], answer: "Mecca", explanation: '', points: 1 },
          { moduleOrder: 6, order: 2, question: "The Quran is Islam's:", options: ["Prayer book", "Holy scripture revealed to Muhammad", "Law code", "History book"], answer: "Holy scripture revealed to Muhammad", explanation: '', points: 1 },
          { moduleOrder: 6, order: 3, question: 'The Islamic Golden Age produced advances in which fields?', options: ["Military tactics only", "Mathematics, medicine, and philosophy", "Agriculture only", "Architecture only"], answer: "Mathematics, medicine, and philosophy", explanation: '', points: 1 },
          { moduleOrder: 6, order: 4, question: 'Islam spread rapidly because of:', options: ["Only military conquest", "Only trade", "Both trade and military expansion", "Forced conversions exclusively"], answer: "Both trade and military expansion", explanation: '', points: 1 },
          { moduleOrder: 6, order: 5, question: 'The word "algebra" comes from:', options: ["Latin", "Greek", "Arabic", "Persian"], answer: "Arabic", explanation: '', points: 1 },

          // Module 7
          { moduleOrder: 7, order: 1, question: 'In the feudal system, the lowest social class was:', options: ["Knights", "Lords", "Serfs", "Clergy"], answer: "Serfs", explanation: '', points: 1 },
          { moduleOrder: 7, order: 2, question: 'The Catholic Church in medieval Europe held power because:', options: ["It controlled all armies", "It held spiritual authority over kings and peasants alike", "It owned all the land", "It elected kings"], answer: "It held spiritual authority over kings and peasants alike", explanation: '', points: 1 },
          { moduleOrder: 7, order: 3, question: 'The Crusades were military campaigns to control:', options: ["Rome", "Constantinople", "The Holy Land (Jerusalem)", "Cairo"], answer: "The Holy Land (Jerusalem)", explanation: '', points: 1 },
          { moduleOrder: 7, order: 4, question: 'A vassal in the feudal system pledged loyalty to a lord in exchange for:', options: ["Freedom", "Land (fief)", "Gold", "Military rank"], answer: "Land (fief)", explanation: '', points: 1 },
          { moduleOrder: 7, order: 5, question: 'The Magna Carta (1215) was significant because:', options: ["It ended feudalism", "It limited royal power for the first time", "It created Parliament", "It began the Crusades"], answer: "It limited royal power for the first time", explanation: '', points: 1 },

          // Module 8
          { moduleOrder: 8, order: 1, question: 'Genghis Khan founded the Mongol Empire in approximately:', options: ["1000 CE", "1206 CE", "1300 CE", "1450 CE"], answer: "1206 CE", explanation: '', points: 1 },
          { moduleOrder: 8, order: 2, question: 'The Silk Road connected:', options: ["Europe to Africa", "China to the Mediterranean", "India to South America", "Japan to Arabia"], answer: "China to the Mediterranean", explanation: '', points: 1 },
          { moduleOrder: 8, order: 3, question: 'Kublai Khan ruled which empire?', options: ["Ottoman", "Mongol (Yuan Dynasty of China)", "Mughal", "Persian"], answer: "Mongol (Yuan Dynasty of China)", explanation: '', points: 1 },
          { moduleOrder: 8, order: 4, question: 'The Black Death reached Europe via:', options: ["Mongol armies directly", "Trade ships from Asia", "African caravans", "Crusaders returning from Jerusalem"], answer: "Trade ships from Asia", explanation: '', points: 1 },
          { moduleOrder: 8, order: 5, question: "Marco Polo's travels to China are notable because:", options: ["He conquered China", "He introduced gunpowder to Europe", "He documented China's wealth and culture for European readers", "He established the Silk Road"], answer: "He documented China's wealth and culture for European readers", explanation: '', points: 1 },

          // Module 9
          { moduleOrder: 9, order: 1, question: 'The Renaissance began in:', options: ["France", "Germany", "Northern Italy", "England"], answer: "Northern Italy", explanation: '', points: 1 },
          { moduleOrder: 9, order: 2, question: 'Humanism, a key Renaissance idea, emphasized:', options: ["Devotion to God above all", "Human potential and reason", "Military power", "Agricultural improvement"], answer: "Human potential and reason", explanation: '', points: 1 },
          { moduleOrder: 9, order: 3, question: 'Martin Luther sparked the Reformation by protesting:', options: ["The Crusades", "The sale of indulgences by the Catholic Church", "The Pope being elected", "The Inquisition"], answer: "The sale of indulgences by the Catholic Church", explanation: '', points: 1 },
          { moduleOrder: 9, order: 4, question: "The printing press was invented around 1440 by:", options: ["Leonardo da Vinci", "Johannes Gutenberg", "Galileo Galilei", "Erasmus"], answer: "Johannes Gutenberg", explanation: '', points: 1 },
          { moduleOrder: 9, order: 5, question: "The Protestant Reformation led to:", options: ["A unified European church", "The end of Christianity in Europe", "A permanent split in Western Christianity", "The rise of Islam in Europe"], answer: "A permanent split in Western Christianity", explanation: '', points: 1 },

          // Module 10
          { moduleOrder: 10, order: 1, question: 'The Columbian Exchange refers to:', options: ["A trade agreement between Spain and Portugal", "The transfer of plants, animals, and diseases between Old and New Worlds", "Columbus's discovery of a trade route to Asia", "A diplomatic mission to China"], answer: "The transfer of plants, animals, and diseases between Old and New Worlds", explanation: '', points: 1 },
          { moduleOrder: 10, order: 2, question: 'Which disease devastated Native American populations after European contact?', options: ["Cholera", "Malaria", "Smallpox", "Typhoid"], answer: "Smallpox", explanation: '', points: 1 },
          { moduleOrder: 10, order: 3, question: 'The primary motivation for European exploration was:', options: ["Religious conversion only", "Trade, wealth, and spreading Christianity", "Scientific curiosity", "Overpopulation"], answer: "Trade, wealth, and spreading Christianity", explanation: '', points: 1 },
          { moduleOrder: 10, order: 4, question: 'Vasco da Gama is known for:', options: ["Discovering the Americas", "Sailing around Africa to reach India", "Circumnavigating the globe", "Exploring the Pacific"], answer: "Sailing around Africa to reach India", explanation: '', points: 1 },
          { moduleOrder: 10, order: 5, question: 'The encomienda system in the Americas was:', options: ["A system of land grants with forced indigenous labor", "A free market economy", "A form of democratic governance", "A religious mission system"], answer: "A system of land grants with forced indigenous labor", explanation: '', points: 1 },

          // Module 11
          { moduleOrder: 11, order: 1, question: 'The Atlantic slave trade transported enslaved Africans primarily to:', options: ["Europe", "Asia", "The Americas", "Australia"], answer: "The Americas", explanation: '', points: 1 },
          { moduleOrder: 11, order: 2, question: 'The "triangular trade" involved exchanges among:', options: ["Europe, Africa, and the Americas", "Asia, Africa, and Europe", "North America, South America, and Europe", "Spain, Portugal, and England"], answer: "Europe, Africa, and the Americas", explanation: '', points: 1 },
          { moduleOrder: 11, order: 3, question: 'The Middle Passage was notorious for:', options: ["High profit for traders", "The brutal conditions enslaved people endured at sea", "Peaceful ocean crossings", "Scientific exploration"], answer: "The brutal conditions enslaved people endured at sea", explanation: '', points: 1 },
          { moduleOrder: 11, order: 4, question: 'Mercantilism held that a nation gained wealth by:', options: ["Free trade", "Exporting more than it imported and acquiring colonies", "Sharing resources equally", "Avoiding trade"], answer: "Exporting more than it imported and acquiring colonies", explanation: '', points: 1 },
          { moduleOrder: 11, order: 5, question: 'The Haitian Revolution (1791–1804) was significant because:', options: ["It was the first successful slave revolt leading to an independent nation", "It ended the Atlantic slave trade", "It was led by Napoleon", "It created the United States"], answer: "It was the first successful slave revolt leading to an independent nation", explanation: '', points: 1 },

          // Module 12
          { moduleOrder: 12, order: 1, question: 'Copernicus proposed that:', options: ["Earth is flat", "The sun orbits the Earth", "Earth and planets orbit the sun (heliocentric model)", "The universe has no center"], answer: "Earth and planets orbit the sun (heliocentric model)", explanation: '', points: 1 },
          { moduleOrder: 12, order: 2, question: "John Locke's ideas most influenced:", options: ["The French monarchy", "The American and French Revolutions", "The Industrial Revolution", "Napoleon's empire"], answer: "The American and French Revolutions", explanation: '', points: 1 },
          { moduleOrder: 12, order: 3, question: 'The Enlightenment emphasized:', options: ["Faith over reason", "Absolute monarchy", "Reason, individual rights, and progress", "The Church as supreme authority"], answer: "Reason, individual rights, and progress", explanation: '', points: 1 },
          { moduleOrder: 12, order: 4, question: "Voltaire's writings criticized:", options: ["Democracy", "Religious intolerance and arbitrary power", "Scientific inquiry", "Free trade"], answer: "Religious intolerance and arbitrary power", explanation: '', points: 1 },
          { moduleOrder: 12, order: 5, question: 'The social contract theory (Rousseau/Locke) states that governments derive power from:', options: ["Divine right", "Military force", "Consent of the governed", "Economic wealth"], answer: "Consent of the governed", explanation: '', points: 1 },

          // Module 13
          { moduleOrder: 13, order: 1, question: 'The Industrial Revolution first occurred in:', options: ["France", "Germany", "Britain", "United States"], answer: "Britain", explanation: '', points: 1 },
          { moduleOrder: 13, order: 2, question: "The steam engine's most transformative application was in:", options: ["Agriculture", "Textile mills and railways", "Medicine", "Communication"], answer: "Textile mills and railways", explanation: '', points: 1 },
          { moduleOrder: 13, order: 3, question: 'Urbanization during the Industrial Revolution meant:', options: ["People moved from cities to farms", "Large numbers moved from farms to industrial cities", "Population declined", "Villages became more self-sufficient"], answer: "Large numbers moved from farms to industrial cities", explanation: '', points: 1 },
          { moduleOrder: 13, order: 4, question: 'Child labor was common in early industrialization because:', options: ["Laws required it", "Children were considered more skilled", "Factory owners paid children less and they could operate machinery", "Schools were unavailable"], answer: "Factory owners paid children less and they could operate machinery", explanation: '', points: 1 },
          { moduleOrder: 13, order: 5, question: "Karl Marx's response to industrialization was:", options: ["Praise for capitalism", "A call for communist revolution by the working class", "Support for child labor", "Advocacy for monarchy"], answer: "A call for communist revolution by the working class", explanation: '', points: 1 },

          // Module 14
          { moduleOrder: 14, order: 1, question: 'The acronym MAIN summarizes WWI causes as Militarism, Alliances, Imperialism, and:', options: ["Industry", "Nationalism", "Navigation", "Nuclear weapons"], answer: "Nationalism", explanation: '', points: 1 },
          { moduleOrder: 14, order: 2, question: 'The League of Nations was proposed by:', options: ["Winston Churchill", "Woodrow Wilson", "David Lloyd George", "Georges Clemenceau"], answer: "Woodrow Wilson", explanation: '', points: 1 },
          { moduleOrder: 14, order: 3, question: 'Hitler rose to power in Germany largely due to:', options: ["Military coup", "Foreign invasion", "Economic hardship, political instability, and his nationalist appeal", "A peaceful democratic election only"], answer: "Economic hardship, political instability, and his nationalist appeal", explanation: '', points: 1 },
          { moduleOrder: 14, order: 4, question: 'D-Day (June 6, 1944) was:', options: ["Germany's surrender", "The Allied invasion of Normandy, France", "Japan's attack on Pearl Harbor", "The liberation of Paris"], answer: "The Allied invasion of Normandy, France", explanation: '', points: 1 },
          { moduleOrder: 14, order: 5, question: 'The United Nations was established in:', options: ["1919", "1939", "1945", "1950"], answer: "1945", explanation: '', points: 1 },
        ],
      },
    },
  });
  console.log('Seeded: World History (14 modules, 20 final + 15 midterm exam questions, 70 module quiz questions)');
}

async function seedBiology() {
  const course = {
    slug: 'biology',
    name: 'Biology',
    nameZh: '生物学',
    credits: 1.0,
    department: 'Science',
    type: 'Core',
    description: 'An introduction to living systems — from cell biology and genetics to evolution, ecology, and the diversity of life on Earth.',
    isPublished: true,
  };

  const existing = await prisma.course.findUnique({ where: { slug: course.slug } });
  if (existing) { await prisma.course.delete({ where: { slug: course.slug } }); }

  await prisma.course.create({
    data: {
      ...course,
      modules: {
        create: [
          {
            order: 1, title: 'The Chemistry of Life', titleZh: '生命的化学基础',
            objectives: 'Describe atoms, bonds, and the four macromolecules essential to life.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/2-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 2: The Chemistry of Life',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/chemistry-of-life/elements-of-life/v/elements-and-atoms',
            videoNote: 'Khan Academy AP Biology — Elements and Atoms',
            video2Url: 'https://www.youtube.com/watch?v=H8WJ2KENlK0',
            video2Note: "Crash Course Biology #1 — That's Why Carbon Is A Tramp",
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/chemistry-of-life/elements-of-life/e/biological-macromolecules',
            practiceNote: 'Khan Academy — Biological Macromolecules practice',
            assignment: 'Build a concept map showing how each of the four macromolecules (carbs, lipids, proteins, nucleic acids) relates to its monomer and main function.',
            estimatedHrs: 3.0,
          },
          {
            order: 2, title: 'Cell Structure & Function', titleZh: '细胞结构与功能',
            objectives: 'Compare prokaryotic and eukaryotic cells; identify organelles and their roles.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/4-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 4: Cell Structure',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/cell-structure-and-function/cell-structures/v/cells',
            videoNote: 'Khan Academy AP Biology — Cell Structures',
            video2Url: 'https://www.youtube.com/watch?v=URUJD5NEXC8',
            video2Note: 'Crash Course Biology #4 — Eukaryopolis',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/cell-structure-and-function/cell-structures/e/cell-structure-review',
            practiceNote: 'Khan Academy — Cell Structure Review',
            assignment: 'Draw and label a eukaryotic cell. For each organelle, write one sentence on its function using an analogy.',
            estimatedHrs: 3.0,
          },
          {
            order: 3, title: 'Cell Membrane & Transport', titleZh: '细胞膜与物质运输',
            objectives: 'Explain the fluid mosaic model; distinguish passive from active transport and osmosis.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/5-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 5: Membrane Structure & Function',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/cell-structure-and-function/membrane-transport/v/fluid-mosaic-model-of-cell-membranes',
            videoNote: 'Khan Academy AP Biology — Fluid Mosaic Model',
            video2Url: 'https://www.youtube.com/watch?v=Ptmlvtei8hw',
            video2Note: 'Crash Course Biology #5 — Membranes & Transport',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/cell-structure-and-function/membrane-transport/e/passive-transport',
            practiceNote: 'Khan Academy — Passive Transport practice',
            assignment: 'Design an experiment to demonstrate osmosis using potato cubes in different salt solutions. Predict and explain expected results.',
            estimatedHrs: 3.0,
          },
          {
            order: 4, title: 'Cellular Respiration', titleZh: '细胞呼吸',
            objectives: 'Trace the steps of glycolysis, the Krebs cycle, and the electron transport chain; calculate net ATP yield.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/7-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 7: Cellular Respiration',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/cellular-energetics/cellular-respiration-ap/v/steps-of-cellular-respiration',
            videoNote: 'Khan Academy AP Biology — Steps of Cellular Respiration',
            video2Url: 'https://www.youtube.com/watch?v=00jbG_cfGuQ',
            video2Note: 'Crash Course Biology #7 — Cellular Respiration',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/cellular-energetics/cellular-respiration-ap/e/steps-of-cellular-respiration',
            practiceNote: 'Khan Academy — Cellular Respiration practice',
            assignment: 'Create a flow chart of cellular respiration showing inputs, outputs, and ATP produced at each stage.',
            estimatedHrs: 3.5,
          },
          {
            order: 5, title: 'Photosynthesis', titleZh: '光合作用',
            objectives: 'Explain the light-dependent and light-independent reactions; describe the role of chlorophyll.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/8-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 8: Photosynthesis',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/cellular-energetics/photosynthesis/v/photosynthesis',
            videoNote: 'Khan Academy AP Biology — Photosynthesis',
            video2Url: 'https://www.youtube.com/watch?v=sQK3Yr4Sc_k',
            video2Note: 'Crash Course Biology #8 — Photosynthesis',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/cellular-energetics/photosynthesis/e/photosynthesis',
            practiceNote: 'Khan Academy — Photosynthesis practice',
            assignment: 'Write the overall equation for photosynthesis. Explain what would happen to a plant placed in complete darkness for two weeks.',
            estimatedHrs: 3.0,
          },
          {
            order: 6, title: 'Cell Division: Mitosis & Meiosis', titleZh: '细胞分裂：有丝分裂与减数分裂',
            objectives: 'Describe the stages of mitosis and meiosis; compare their purposes and outcomes.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/10-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 10–11: Cell Division',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/cell-communication-and-cell-cycle/cell-cycle/v/mitosis-stages',
            videoNote: 'Khan Academy AP Biology — Mitosis Stages',
            video2Url: 'https://www.youtube.com/watch?v=f-ldPgEfAHI',
            video2Note: 'Crash Course Biology #12 — Mitosis vs Meiosis',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/cell-communication-and-cell-cycle/cell-cycle/e/mitosis',
            practiceNote: 'Khan Academy — Mitosis practice',
            assignment: 'Create a table comparing mitosis and meiosis on: purpose, number of divisions, daughter cells produced, and ploidy.',
            estimatedHrs: 3.5,
          },
          {
            order: 7, title: 'Mendelian Genetics', titleZh: '孟德尔遗传学',
            objectives: "Apply Mendel's laws to predict offspring ratios; construct and interpret Punnett squares.",
            readingUrl: 'https://openstax.org/books/biology-2e/pages/12-introduction',
            readingNote: "OpenStax Biology 2e — Ch 12: Mendel\'s Experiments",
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/heredity/mendelian-genetics-ap/v/introduction-to-heredity',
            videoNote: 'Khan Academy AP Biology — Mendelian Genetics',
            video2Url: 'https://www.youtube.com/watch?v=CBezq1fFUEA',
            video2Note: 'Crash Course Biology #9 — Heredity',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/heredity/mendelian-genetics-ap/e/monohybrid-punnett-squares',
            practiceNote: 'Khan Academy — Monohybrid Punnett Square practice',
            assignment: 'Set up and solve 3 monohybrid and 1 dihybrid cross. Calculate phenotype and genotype ratios for each.',
            estimatedHrs: 3.5,
          },
          {
            order: 8, title: 'DNA Structure & Replication', titleZh: 'DNA结构与复制',
            objectives: 'Describe DNA double helix structure; explain semi-conservative replication step by step.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/14-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 14: DNA Structure & Replication',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation/replication/v/dna-replication-and-rna-transcription-and-translation',
            videoNote: 'Khan Academy AP Biology — DNA Replication',
            video2Url: 'https://www.youtube.com/watch?v=8kK2zwjRV0M',
            video2Note: 'Crash Course Biology #10 — DNA Structure & Replication',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation/replication/e/dna-replication',
            practiceNote: 'Khan Academy — DNA Replication practice',
            assignment: 'Given a template DNA strand, write out the complementary strand. Then show the two daughter strands after replication.',
            estimatedHrs: 3.0,
          },
          {
            order: 9, title: 'Gene Expression: Transcription & Translation', titleZh: '基因表达：转录与翻译',
            objectives: 'Trace the central dogma DNA → RNA → Protein; explain codon, anticodon, and the role of ribosomes.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/15-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 15: Genes & Proteins',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation/transcription-and-rna-processing/v/rna-transcription-and-translation',
            videoNote: 'Khan Academy AP Biology — Transcription & Translation',
            video2Url: 'https://www.youtube.com/watch?v=gG7uCskUOrA',
            video2Note: 'Crash Course Biology #11 — DNA, Hot Pockets & Genetics',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation/translation/e/translation',
            practiceNote: 'Khan Academy — Translation practice',
            assignment: 'Given a DNA sequence, transcribe to mRNA and translate to an amino acid chain using a codon chart.',
            estimatedHrs: 3.5,
          },
          {
            order: 10, title: 'Evolution & Natural Selection', titleZh: '进化与自然选择',
            objectives: "State Darwin's theory of natural selection; distinguish between types of natural selection.",
            readingUrl: 'https://openstax.org/books/biology-2e/pages/18-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 18: Evolution & Natural Selection',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/natural-selection/natural-selection-ap/v/evolution-and-natural-selection',
            videoNote: 'Khan Academy AP Biology — Natural Selection',
            video2Url: 'https://www.youtube.com/watch?v=aTftyFboC_M',
            video2Note: 'Crash Course Biology #14 — Natural Selection',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/natural-selection/natural-selection-ap/e/natural-selection',
            practiceNote: 'Khan Academy — Natural Selection practice',
            assignment: 'Describe a real-world example of natural selection (e.g., antibiotic resistance). Explain how each of the four conditions of natural selection applies.',
            estimatedHrs: 3.0,
          },
          {
            order: 11, title: 'Diversity of Life & Classification', titleZh: '生命多样性与分类',
            objectives: 'Use binomial nomenclature; classify organisms into the six kingdoms and three domains.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/20-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 20: Phylogenies & the History of Life',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/natural-selection/phylogeny/v/phylogenetic-trees',
            videoNote: 'Khan Academy AP Biology — Phylogenetic Trees',
            video2Url: 'https://www.youtube.com/watch?v=LdsmqZT260g',
            video2Note: 'Crash Course Biology #19 — Taxonomy',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/natural-selection/phylogeny/e/phylogenetic-trees',
            practiceNote: 'Khan Academy — Phylogenetic Trees practice',
            assignment: 'Classify 5 organisms (from a provided list) using domain, kingdom, phylum, class, order, family, genus, species.',
            estimatedHrs: 3.0,
          },
          {
            order: 12, title: 'Plant Biology', titleZh: '植物生物学',
            objectives: 'Identify plant organ systems and tissues; explain vascular transport and the life cycle of flowering plants.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/30-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 30: Plant Form & Physiology',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/plant-biology/plant-structure-and-function/v/plant-structures',
            videoNote: 'Khan Academy AP Biology — Plant Structures',
            video2Url: 'https://www.youtube.com/watch?v=s_Hd9QKUVQY',
            video2Note: 'Crash Course Biology #37 — Plant Cells',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/plant-biology/plant-structure-and-function/e/plant-structures-and-functions',
            practiceNote: 'Khan Academy — Plant Structures & Functions practice',
            assignment: 'Label a diagram of a flower showing all major structures. Explain the role of each in reproduction.',
            estimatedHrs: 3.0,
          },
          {
            order: 13, title: 'Human Body Systems', titleZh: '人体系统',
            objectives: 'Describe the major organ systems and explain how they interact to maintain homeostasis.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/16-5-ribosomes-and-protein-synthesis',
            readingNote: 'OpenStax Biology 2e — Ch 33: Animal Form & Function',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/animal-structure-and-function/body-structure/v/overview-of-animal-tissues',
            videoNote: 'Khan Academy AP Biology — Animal Tissues',
            video2Url: 'https://www.youtube.com/watch?v=Ae4MadKPJC0',
            video2Note: 'Crash Course Biology #31 — Your Immune System',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/animal-structure-and-function/body-structure/e/animal-form-and-function',
            practiceNote: 'Khan Academy — Animal Form & Function practice',
            assignment: 'Choose any three organ systems. For each, name the major organs and describe one way it interacts with another system.',
            estimatedHrs: 3.0,
          },
          {
            order: 14, title: 'Ecology & Ecosystems', titleZh: '生态学与生态系统',
            objectives: 'Define biotic/abiotic factors, food webs, and energy flow; explain population dynamics and human impact.',
            readingUrl: 'https://openstax.org/books/biology-2e/pages/44-introduction',
            readingNote: 'OpenStax Biology 2e — Ch 44: Ecology & the Biosphere',
            videoUrl: 'https://www.khanacademy.org/science/ap-biology/ecology-ap/energy-flow-through-ecosystems/v/food-chains-and-food-webs',
            videoNote: 'Khan Academy AP Biology — Food Chains & Webs',
            video2Url: 'https://www.youtube.com/watch?v=2D7hZpIYlCA',
            video2Note: 'Crash Course Biology #40 — Ecology',
            practiceUrl: 'https://www.khanacademy.org/science/ap-biology/ecology-ap/energy-flow-through-ecosystems/e/food-chains-and-food-webs',
            practiceNote: 'Khan Academy — Food Chains & Food Webs practice',
            assignment: 'Draw a food web for a local ecosystem. Identify the producers, primary consumers, and top predators. Predict what happens if one species is removed.',
            estimatedHrs: 3.5,
          },
        ],
      },
      questions: {
        create: [
          // Midterm (modules 1–7)
          { examType: 'midterm', order: 1, question: 'Which macromolecule serves as the primary energy source for cells?', type: 'mc', options: ["Proteins", "Lipids", "Carbohydrates", "Nucleic acids"], answer: "Carbohydrates", explanation: '', points: 1 },
          { examType: 'midterm', order: 2, question: 'The powerhouse of the cell is the:', type: 'mc', options: ["Nucleus", "Ribosome", "Mitochondrion", "Golgi apparatus"], answer: "Mitochondrion", explanation: '', points: 1 },
          { examType: 'midterm', order: 3, question: 'Which type of transport requires no energy?', type: 'mc', options: ["Active transport", "Endocytosis", "Passive transport (diffusion)", "Exocytosis"], answer: "Passive transport (diffusion)", explanation: '', points: 1 },
          { examType: 'midterm', order: 4, question: 'The net ATP yield from one glucose molecule in aerobic respiration is approximately:', type: 'mc', options: ["2 ATP", "4 ATP", "30–32 ATP", "100 ATP"], answer: "30–32 ATP", explanation: '', points: 1 },
          { examType: 'midterm', order: 5, question: 'In photosynthesis, what molecule absorbs light energy?', type: 'mc', options: ["Glucose", "ATP", "Chlorophyll", "NADPH"], answer: "Chlorophyll", explanation: '', points: 1 },
          { examType: 'midterm', order: 6, question: 'Mitosis results in:', type: 'mc', options: ["Two genetically identical daughter cells", "Four haploid cells", "Two haploid cells", "Four identical cells"], answer: "Two genetically identical daughter cells", explanation: '', points: 1 },
          { examType: 'midterm', order: 7, question: 'In a monohybrid cross of two heterozygous parents (Aa × Aa), the expected phenotype ratio is:', type: 'mc', options: ["1:1", "3:1", "1:2:1", "2:1"], answer: "3:1", explanation: '', points: 1 },
          { examType: 'midterm', order: 8, question: 'A prokaryotic cell differs from a eukaryotic cell in that it:', type: 'mc', options: ["Has mitochondria", "Has a nucleus", "Lacks a membrane-bound nucleus", "Lacks ribosomes"], answer: "Lacks a membrane-bound nucleus", explanation: '', points: 1 },
          { examType: 'midterm', order: 9, question: 'Osmosis is defined as:', type: 'mc', options: ["Movement of solutes across a membrane", "Movement of water across a semipermeable membrane from low to high solute", "Active transport of water", "Movement of proteins through channels"], answer: "Movement of water across a semipermeable membrane from low to high solute", explanation: '', points: 1 },
          { examType: 'midterm', order: 10, question: 'The Krebs cycle takes place in the:', type: 'mc', options: ["Cytoplasm", "Nucleus", "Mitochondrial matrix", "Chloroplast"], answer: "Mitochondrial matrix", explanation: '', points: 1 },
          { examType: 'midterm', order: 11, question: 'Meiosis is necessary for:', type: 'mc', options: ["Growth and repair", "Sexual reproduction (forming gametes)", "Asexual reproduction", "Cell replacement"], answer: "Sexual reproduction (forming gametes)", explanation: '', points: 1 },
          { examType: 'midterm', order: 12, question: 'Dominant alleles are represented by:', type: 'mc', options: ["Lowercase letters", "Uppercase letters", "Numbers", "Symbols"], answer: "Uppercase letters", explanation: '', points: 1 },
          { examType: 'midterm', order: 13, question: 'The light reactions of photosynthesis occur in the:', type: 'mc', options: ["Stroma", "Thylakoid membrane", "Cytoplasm", "Mitochondria"], answer: "Thylakoid membrane", explanation: '', points: 1 },
          { examType: 'midterm', order: 14, question: "The Calvin cycle produces:", type: 'mc', options: ["Oxygen", "Water", "G3P (used to build glucose)", "ATP only"], answer: "G3P (used to build glucose)", explanation: '', points: 1 },
          { examType: 'midterm', order: 15, question: 'Enzymes function as biological catalysts by:', type: 'mc', options: ["Increasing the activation energy", "Decreasing the activation energy of reactions", "Providing energy for reactions", "Changing the products of reactions"], answer: "Decreasing the activation energy of reactions", explanation: '', points: 1 },

          // Final (modules 1–14)
          { examType: 'final', order: 1, question: 'Which bond holds the two strands of DNA together?', type: 'mc', options: ["Ionic bonds", "Covalent bonds", "Hydrogen bonds", "Peptide bonds"], answer: "Hydrogen bonds", explanation: '', points: 1 },
          { examType: 'final', order: 2, question: 'DNA replication is described as semi-conservative because:', type: 'mc', options: ['Only half the DNA is copied', 'Each new double helix contains one old and one new strand', 'The process is only 50% accurate', "Half the cell's DNA is conserved"], answer: 'Each new double helix contains one old and one new strand', explanation: '', points: 1 },
          { examType: 'final', order: 3, question: 'During transcription, DNA is used to produce:', type: 'mc', options: ["Proteins", "mRNA", "tRNA", "Ribosomes"], answer: "mRNA", explanation: '', points: 1 },
          { examType: 'final', order: 4, question: 'A codon consists of:', type: 'mc', options: ["One nucleotide", "Two nucleotides", "Three nucleotides on mRNA", "Four nucleotides"], answer: "Three nucleotides on mRNA", explanation: '', points: 1 },
          { examType: 'final', order: 5, question: "Darwin's theory of natural selection requires all EXCEPT:", type: 'mc', options: ["Variation in a population", "Inheritance of traits", "Intentional adaptation by individuals", "Differential reproductive success"], answer: "Intentional adaptation by individuals", explanation: '', points: 1 },
          { examType: 'final', order: 6, question: 'Binomial nomenclature uses which two classification levels?', type: 'mc', options: ["Family and Order", "Kingdom and Phylum", "Genus and Species", "Class and Family"], answer: "Genus and Species", explanation: '', points: 1 },
          { examType: 'final', order: 7, question: 'Xylem and phloem are plant tissues responsible for:', type: 'mc', options: ["Photosynthesis", "Reproduction", "Transporting water/minerals and sugars respectively", "Providing structural support only"], answer: "Transporting water/minerals and sugars respectively", explanation: '', points: 1 },
          { examType: 'final', order: 8, question: 'Homeostasis refers to:', type: 'mc', options: ["The body's ability to maintain stable internal conditions", "The growth of organisms", "Genetic mutations", "Ecosystem balance"], answer: "The body's ability to maintain stable internal conditions", explanation: '', points: 1 },
          { examType: 'final', order: 9, question: 'In an ecological food web, producers are typically:', type: 'mc', options: ["Herbivores", "Carnivores", "Plants and photosynthetic organisms", "Decomposers"], answer: "Plants and photosynthetic organisms", explanation: '', points: 1 },
          { examType: 'final', order: 10, question: 'A mutation in a somatic cell:', type: 'mc', options: ["Can be passed to offspring", "Cannot be passed to offspring", "Always causes cancer", "Is beneficial"], answer: "Cannot be passed to offspring", explanation: '', points: 1 },
          { examType: 'final', order: 11, question: 'The three domains of life are:', type: 'mc', options: ["Plants, Animals, Fungi", "Bacteria, Archaea, Eukarya", "Prokaryotes, Eukaryotes, Viruses", "Animalia, Plantae, Protista"], answer: "Bacteria, Archaea, Eukarya", explanation: '', points: 1 },
          { examType: 'final', order: 12, question: 'Antibiotic resistance in bacteria is an example of:', type: 'mc', options: ["Artificial selection", "Natural selection in action", "Genetic engineering", "Random mutation only"], answer: "Natural selection in action", explanation: '', points: 1 },
          { examType: 'final', order: 13, question: 'The primary function of the cell membrane is:', type: 'mc', options: ["Energy production", "Protein synthesis", "Regulating what enters and exits the cell", "DNA storage"], answer: "Regulating what enters and exits the cell", explanation: '', points: 1 },
          { examType: 'final', order: 14, question: 'Which process breaks down glucose in the absence of oxygen?', type: 'mc', options: ["Aerobic respiration", "Photosynthesis", "Fermentation (anaerobic respiration)", "Transcription"], answer: "Fermentation (anaerobic respiration)", explanation: '', points: 1 },
          { examType: 'final', order: 15, question: 'The human nervous system consists of:', type: 'mc', options: ["The brain and spinal cord only", "The central and peripheral nervous systems", "Only peripheral nerves", "The brain, heart, and lungs"], answer: "The central and peripheral nervous systems", explanation: '', points: 1 },
          { examType: 'final', order: 16, question: 'Hardy-Weinberg equilibrium requires:', type: 'mc', options: ["Natural selection occurring", "No mutation, migration, selection, or genetic drift (large random mating population)", "Small population size", "Environmental changes"], answer: "No mutation, migration, selection, or genetic drift (large random mating population)", explanation: '', points: 1 },
          { examType: 'final', order: 17, question: 'Which organelle is responsible for protein synthesis?', type: 'mc', options: ["Lysosome", "Mitochondrion", "Ribosome", "Vacuole"], answer: "Ribosome", explanation: '', points: 1 },
          { examType: 'final', order: 18, question: 'Crossing over during meiosis increases:', type: 'mc', options: ["The number of chromosomes", "Genetic diversity in offspring", "Cell size", "Mutation rates"], answer: "Genetic diversity in offspring", explanation: '', points: 1 },
          { examType: 'final', order: 19, question: 'An organism with two identical alleles for a trait is called:', type: 'mc', options: ["Heterozygous", "Homozygous", "Codominant", "Hemizygous"], answer: "Homozygous", explanation: '', points: 1 },
          { examType: 'final', order: 20, question: 'The 10% rule in ecology states that:', type: 'mc', options: ["10% of organisms survive predation", "Only 10% of energy transfers to the next trophic level", "10% of species are endangered", "Ecosystems use 10% of sunlight"], answer: "Only 10% of energy transfers to the next trophic level", explanation: '', points: 1 },
        ],
      },
      quizQuestions: {
        create: [
          // Module 1 — Chemistry of Life
          { moduleOrder: 1, order: 1, question: 'Which element is the backbone of all organic molecules?', options: ["Oxygen", "Nitrogen", "Carbon", "Hydrogen"], answer: "Carbon", explanation: '', points: 1 },
          { moduleOrder: 1, order: 2, question: 'Proteins are polymers of:', options: ["Glucose", "Fatty acids", "Amino acids", "Nucleotides"], answer: "Amino acids", explanation: '', points: 1 },
          { moduleOrder: 1, order: 3, question: 'Lipids are primarily used for:', options: ["Energy storage and membrane structure", "Carrying genetic information", "Catalyzing reactions", "Building cell walls"], answer: "Energy storage and membrane structure", explanation: '', points: 1 },
          { moduleOrder: 1, order: 4, question: 'DNA and RNA are examples of:', options: ["Carbohydrates", "Nucleic acids", "Lipids", "Proteins"], answer: "Nucleic acids", explanation: '', points: 1 },
          { moduleOrder: 1, order: 5, question: 'A hydrogen bond is:', options: ["A bond within a water molecule", "A weak attraction between a H atom and an electronegative atom", "A bond in carbohydrates", "A covalent bond in proteins"], answer: "A weak attraction between a H atom and an electronegative atom", explanation: '', points: 1 },

          // Module 2 — Cell Structure
          { moduleOrder: 2, order: 1, question: "Which organelle contains the cell's genetic material?", options: ['Mitochondrion', 'Nucleus', 'Ribosome', 'Lysosome'], answer: 'Nucleus', explanation: '', points: 1 },
          { moduleOrder: 2, order: 2, question: 'Ribosomes are sites of:', options: ["Energy production", "Protein synthesis", "Lipid synthesis", "DNA replication"], answer: "Protein synthesis", explanation: '', points: 1 },
          { moduleOrder: 2, order: 3, question: 'The Golgi apparatus:', options: ["Produces energy", "Modifies and packages proteins for export", "Digests old organelles", "Controls cell division"], answer: "Modifies and packages proteins for export", explanation: '', points: 1 },
          { moduleOrder: 2, order: 4, question: 'Which structure is found in plant cells but NOT animal cells?', options: ["Mitochondrion", "Nucleus", "Cell wall and chloroplast", "Ribosome"], answer: "Cell wall and chloroplast", explanation: '', points: 1 },
          { moduleOrder: 2, order: 5, question: 'Lysosomes contain:', options: ["Chlorophyll", "Digestive enzymes", "DNA", "Glucose"], answer: "Digestive enzymes", explanation: '', points: 1 },

          // Module 3 — Cell Membrane
          { moduleOrder: 3, order: 1, question: 'The cell membrane is composed of a:', options: ["Single lipid layer", "Phospholipid bilayer", "Protein sheet", "Cellulose wall"], answer: "Phospholipid bilayer", explanation: '', points: 1 },
          { moduleOrder: 3, order: 2, question: 'Diffusion moves molecules:', options: ["Against the concentration gradient", "From high to low concentration", "Using ATP energy", "Only through protein channels"], answer: "From high to low concentration", explanation: '', points: 1 },
          { moduleOrder: 3, order: 3, question: 'A cell placed in a hypotonic solution will:', options: ["Shrink", "Remain the same", "Swell and potentially burst (lyse)", "Divide"], answer: "Swell and potentially burst (lyse)", explanation: '', points: 1 },
          { moduleOrder: 3, order: 4, question: 'Active transport differs from passive transport in that it:', options: ["Requires a concentration gradient", "Uses ATP energy", "Only moves small molecules", "Does not require proteins"], answer: "Uses ATP energy", explanation: '', points: 1 },
          { moduleOrder: 3, order: 5, question: 'The sodium-potassium pump is an example of:', options: ["Osmosis", "Facilitated diffusion", "Active transport", "Endocytosis"], answer: "Active transport", explanation: '', points: 1 },

          // Module 4 — Cellular Respiration
          { moduleOrder: 4, order: 1, question: 'Glycolysis occurs in the:', options: ["Mitochondria", "Nucleus", "Cytoplasm", "Chloroplast"], answer: "Cytoplasm", explanation: '', points: 1 },
          { moduleOrder: 4, order: 2, question: 'The overall equation for cellular respiration shows glucose being converted to:', options: ["Oxygen and water", "CO₂, water, and ATP", "Sugar and oxygen", "Lactic acid only"], answer: "CO₂, water, and ATP", explanation: '', points: 1 },
          { moduleOrder: 4, order: 3, question: 'The electron transport chain is located on the:', options: ["Outer mitochondrial membrane", "Cristae (inner mitochondrial membrane)", "Cytoplasm", "Nucleus"], answer: "Cristae (inner mitochondrial membrane)", explanation: '', points: 1 },
          { moduleOrder: 4, order: 4, question: 'Fermentation is used when:', options: ["Oxygen is abundant", "Oxygen is absent or limited", "Glucose is unavailable", "Light is available"], answer: "Oxygen is absent or limited", explanation: '', points: 1 },
          { moduleOrder: 4, order: 5, question: 'ATP stands for:', options: ["Adenine Triphosphate", "Adenosine Triphosphate", "Amino Triphosphate", "Adenosine Trisphosphate"], answer: "Adenosine Triphosphate", explanation: '', points: 1 },

          // Module 5 — Photosynthesis
          { moduleOrder: 5, order: 1, question: 'The overall equation for photosynthesis shows:', options: ["Glucose + O₂ → CO₂ + H₂O", "CO₂ + H₂O + light → glucose + O₂", "Glucose → CO₂ + ATP", "H₂O + CO₂ → ATP + protein"], answer: "CO₂ + H₂O + light → glucose + O₂", explanation: '', points: 1 },
          { moduleOrder: 5, order: 2, question: 'Chlorophyll absorbs light primarily in which colors?', options: ["Green", "Yellow", "Red and blue", "UV only"], answer: "Red and blue", explanation: '', points: 1 },
          { moduleOrder: 5, order: 3, question: 'The light-independent reactions (Calvin cycle) take place in the:', options: ["Thylakoid", "Stroma of the chloroplast", "Nucleus", "Cell membrane"], answer: "Stroma of the chloroplast", explanation: '', points: 1 },
          { moduleOrder: 5, order: 4, question: 'Oxygen is released as a byproduct of:', options: ["The Calvin cycle", "The light reactions (water splitting)", "Glycolysis", "Cellular respiration"], answer: "The light reactions (water splitting)", explanation: '', points: 1 },
          { moduleOrder: 5, order: 5, question: 'Which gas do plants absorb for photosynthesis?', options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: "Carbon dioxide", explanation: '', points: 1 },

          // Module 6 — Cell Division
          { moduleOrder: 6, order: 1, question: 'The correct order of mitosis phases is:', options: ["Metaphase, Prophase, Anaphase, Telophase", "Prophase, Metaphase, Anaphase, Telophase", "Anaphase, Metaphase, Prophase, Telophase", "Telophase, Prophase, Metaphase, Anaphase"], answer: "Prophase, Metaphase, Anaphase, Telophase", explanation: '', points: 1 },
          { moduleOrder: 6, order: 2, question: 'During anaphase, sister chromatids:', options: ["Align at the cell equator", "Are pulled to opposite poles", "Condense for the first time", "Reform into nuclear envelopes"], answer: "Are pulled to opposite poles", explanation: '', points: 1 },
          { moduleOrder: 6, order: 3, question: 'Meiosis II is most similar to:', options: ["DNA replication", "Mitosis", "Meiosis I", "Fertilization"], answer: "Mitosis", explanation: '', points: 1 },
          { moduleOrder: 6, order: 4, question: 'How many haploid cells result from one round of meiosis?', options: ["2", "3", "4", "8"], answer: "4", explanation: '', points: 1 },
          { moduleOrder: 6, order: 5, question: 'Cytokinesis refers to:', options: ["DNA replication", "The division of the cytoplasm", "Chromosome condensation", "Spindle formation"], answer: "The division of the cytoplasm", explanation: '', points: 1 },

          // Module 7 — Mendelian Genetics
          { moduleOrder: 7, order: 1, question: 'Gregor Mendel conducted his genetics experiments on:', options: ["Fruit flies", "Mice", "Pea plants", "Bacteria"], answer: "Pea plants", explanation: '', points: 1 },
          { moduleOrder: 7, order: 2, question: 'A heterozygous genotype contains:', options: ["Two dominant alleles", "Two recessive alleles", "One dominant and one recessive allele", "No alleles"], answer: "One dominant and one recessive allele", explanation: '', points: 1 },
          { moduleOrder: 7, order: 3, question: 'The law of segregation states that:', options: ["Alleles for different traits assort independently", "Each gamete receives one allele for each trait", "Dominant traits always appear", "Offspring are identical to parents"], answer: "Each gamete receives one allele for each trait", explanation: '', points: 1 },
          { moduleOrder: 7, order: 4, question: 'If Tt × Tt, what fraction of offspring will be homozygous recessive (tt)?', options: ["1/4", "1/2", "3/4", "0"], answer: "1/4", explanation: '', points: 1 },
          { moduleOrder: 7, order: 5, question: 'Incomplete dominance results in:', options: ["Only dominant phenotype", "A blended phenotype (intermediate)", "Both phenotypes expressed equally", "Recessive phenotype"], answer: "A blended phenotype (intermediate)", explanation: '', points: 1 },

          // Module 8 — DNA Structure & Replication
          { moduleOrder: 8, order: 1, question: 'The base pairing rule in DNA is:', options: ["A-G and T-C", "A-T and G-C", "A-C and G-T", "A-U and G-C"], answer: "A-T and G-C", explanation: '', points: 1 },
          { moduleOrder: 8, order: 2, question: 'DNA helicase unwinds the double helix by:', options: ["Adding new nucleotides", "Breaking hydrogen bonds between base pairs", "Sealing the sugar-phosphate backbone", "Transcribing DNA to RNA"], answer: "Breaking hydrogen bonds between base pairs", explanation: '', points: 1 },
          { moduleOrder: 8, order: 3, question: 'DNA polymerase adds nucleotides in which direction?', options: ["3' to 5'", "5' to 3'", 'Both directions equally', 'Direction depends on the strand'], answer: "5' to 3'", explanation: '', points: 1 },
          { moduleOrder: 8, order: 4, question: 'The sugar in DNA is:', options: ["Ribose", "Deoxyribose", "Glucose", "Fructose"], answer: "Deoxyribose", explanation: '', points: 1 },
          { moduleOrder: 8, order: 5, question: 'Adenine always pairs with which base in DNA?', options: ["Guanine", "Cytosine", "Thymine", "Uracil"], answer: "Thymine", explanation: '', points: 1 },

          // Module 9 — Gene Expression
          { moduleOrder: 9, order: 1, question: 'The central dogma of molecular biology is:', options: ["Protein → RNA → DNA", "DNA → RNA → Protein", "RNA → Protein → DNA", "DNA → Protein → RNA"], answer: "DNA → RNA → Protein", explanation: '', points: 1 },
          { moduleOrder: 9, order: 2, question: 'Transcription occurs in the:', options: ["Ribosome", "Nucleus", "Cytoplasm", "Mitochondria"], answer: "Nucleus", explanation: '', points: 1 },
          { moduleOrder: 9, order: 3, question: 'In mRNA, thymine (T) is replaced by:', options: ["Adenine", "Cytosine", "Guanine", "Uracil"], answer: "Uracil", explanation: '', points: 1 },
          { moduleOrder: 9, order: 4, question: 'tRNA carries:', options: ["DNA instructions to the ribosome", "Amino acids to the ribosome during translation", "mRNA to the nucleus", "Enzymes to the Golgi"], answer: "Amino acids to the ribosome during translation", explanation: '', points: 1 },
          { moduleOrder: 9, order: 5, question: 'A stop codon signals:', options: ["The beginning of translation", "Addition of a specific amino acid", "The end of the protein chain", "The start of transcription"], answer: "The end of the protein chain", explanation: '', points: 1 },

          // Module 10 — Evolution
          { moduleOrder: 10, order: 1, question: "Darwin's book proposing evolution by natural selection was called:", options: ["Principia Mathematica", "On the Origin of Species", "The Descent of Man", "The Selfish Gene"], answer: "On the Origin of Species", explanation: '', points: 1 },
          { moduleOrder: 10, order: 2, question: 'Fitness in evolutionary terms means:', options: ["Physical strength", "Ability to survive and reproduce successfully", "Intelligence", "Disease resistance only"], answer: "Ability to survive and reproduce successfully", explanation: '', points: 1 },
          { moduleOrder: 10, order: 3, question: 'Vestigial structures are:', options: ["New adaptations", "Remnants of structures that served a function in ancestors", "Organs used for reproduction", "Homologous structures"], answer: "Remnants of structures that served a function in ancestors", explanation: '', points: 1 },
          { moduleOrder: 10, order: 4, question: 'Genetic drift has the greatest effect in:', options: ["Large populations", "Small populations", "Populations with high mutation rates", "Tropical populations"], answer: "Small populations", explanation: '', points: 1 },
          { moduleOrder: 10, order: 5, question: 'Speciation occurs when:', options: ["Two populations interbreed freely", "Populations become reproductively isolated and diverge", "Mutation rates increase", "Environments stay identical"], answer: "Populations become reproductively isolated and diverge", explanation: '', points: 1 },

          // Module 11 — Diversity & Classification
          { moduleOrder: 11, order: 1, question: 'The correct order of taxonomic hierarchy from broadest to most specific is:', options: ["Species, Genus, Family, Order, Class, Phylum, Kingdom, Domain", "Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species", "Kingdom, Domain, Phylum, Class, Order, Family, Genus, Species", "Domain, Phylum, Kingdom, Class, Order, Family, Genus, Species"], answer: "Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species", explanation: '', points: 1 },
          { moduleOrder: 11, order: 2, question: 'In Homo sapiens, "sapiens" is the:', options: ["Genus", "Family", "Species", "Kingdom"], answer: "Species", explanation: '', points: 1 },
          { moduleOrder: 11, order: 3, question: 'Archaea are similar to bacteria in that they are both:', options: ["Eukaryotes", "Multicellular", "Prokaryotes", "Photosynthetic"], answer: "Prokaryotes", explanation: '', points: 1 },
          { moduleOrder: 11, order: 4, question: 'A phylogenetic tree shows:', options: ["Geographic distribution of organisms", "Evolutionary relationships among organisms", "Anatomical structure", "Ecological niches"], answer: "Evolutionary relationships among organisms", explanation: '', points: 1 },
          { moduleOrder: 11, order: 5, question: 'Fungi differ from plants in that fungi:', options: ["Perform photosynthesis", "Absorb nutrients from their environment (heterotrophs)", "Have cell walls", "Are multicellular"], answer: "Absorb nutrients from their environment (heterotrophs)", explanation: '', points: 1 },

          // Module 12 — Plant Biology
          { moduleOrder: 12, order: 1, question: 'Xylem transports:', options: ["Sugars from leaves to roots", "Water and minerals from roots upward", "Carbon dioxide into leaves", "Hormones only"], answer: "Water and minerals from roots upward", explanation: '', points: 1 },
          { moduleOrder: 12, order: 2, question: 'Stomata are openings that:', options: ["Absorb water", "Regulate gas exchange in leaves", "Anchor the plant", "Produce seeds"], answer: "Regulate gas exchange in leaves", explanation: '', points: 1 },
          { moduleOrder: 12, order: 3, question: 'The reproductive structures of a flowering plant are found in the:', options: ["Stem", "Roots", "Flower", "Leaves"], answer: "Flower", explanation: '', points: 1 },
          { moduleOrder: 12, order: 4, question: 'Pollination is the transfer of:', options: ["Eggs from pistil to stamen", "Pollen from stamen to pistil", "Water through xylem", "Nutrients through phloem"], answer: "Pollen from stamen to pistil", explanation: '', points: 1 },
          { moduleOrder: 12, order: 5, question: 'Phloem transports:', options: ["Water upward", "Sugars (products of photosynthesis) throughout the plant", "Minerals from soil", "Hormones only"], answer: "Sugars (products of photosynthesis) throughout the plant", explanation: '', points: 1 },

          // Module 13 — Human Body Systems
          { moduleOrder: 13, order: 1, question: 'The primary function of the respiratory system is:', options: ["Pumping blood", "Gas exchange (O₂ in, CO₂ out)", "Digesting food", "Filtering blood"], answer: "Gas exchange (O₂ in, CO₂ out)", explanation: '', points: 1 },
          { moduleOrder: 13, order: 2, question: 'The site of gas exchange in the lungs is the:', options: ["Bronchi", "Trachea", "Alveoli", "Diaphragm"], answer: "Alveoli", explanation: '', points: 1 },
          { moduleOrder: 13, order: 3, question: 'Insulin is produced by the pancreas to:', options: ["Break down fats", "Lower blood glucose levels", "Raise blood glucose levels", "Stimulate growth"], answer: "Lower blood glucose levels", explanation: '', points: 1 },
          { moduleOrder: 13, order: 4, question: 'The function of red blood cells is to:', options: ["Fight infections", "Carry oxygen via hemoglobin", "Produce antibodies", "Form blood clots"], answer: "Carry oxygen via hemoglobin", explanation: '', points: 1 },
          { moduleOrder: 13, order: 5, question: 'Neurons transmit signals via:', options: ["Hormones in the bloodstream", "Electrical impulses and neurotransmitters", "Muscular contractions", "Lymph fluid"], answer: "Electrical impulses and neurotransmitters", explanation: '', points: 1 },

          // Module 14 — Ecology
          { moduleOrder: 14, order: 1, question: 'Producers in an ecosystem are:', options: ["Organisms that eat herbivores", "Organisms that make their own food via photosynthesis", "Organisms that decompose dead matter", "Animals that eat producers"], answer: "Organisms that make their own food via photosynthesis", explanation: '', points: 1 },
          { moduleOrder: 14, order: 2, question: 'The 10% energy rule means:', options: ["10% of organisms survive", "Only 10% of energy passes to the next trophic level", "Ecosystems are 10% efficient", "10% of species are producers"], answer: "Only 10% of energy passes to the next trophic level", explanation: '', points: 1 },
          { moduleOrder: 14, order: 3, question: 'A niche is best described as:', options: ["An organism's physical location", "An organism's role and resource use in its ecosystem", "The number of organisms in a habitat", "A type of food web"], answer: "An organism's role and resource use in its ecosystem", explanation: '', points: 1 },
          { moduleOrder: 14, order: 4, question: 'Biodiversity is important because:', options: ["It makes ecosystems simpler", "Greater diversity increases ecosystem stability and resilience", "It reduces competition", "It speeds up evolution"], answer: "Greater diversity increases ecosystem stability and resilience", explanation: '', points: 1 },
          { moduleOrder: 14, order: 5, question: 'Decomposers play a critical role by:', options: ["Producing oxygen", "Recycling nutrients back into the ecosystem", "Preying on herbivores", "Fixing nitrogen in soil"], answer: "Recycling nutrients back into the ecosystem", explanation: '', points: 1 },
        ],
      },
    },
  });
  console.log('Seeded: Biology (14 modules, 20 final + 15 midterm exam questions, 70 module quiz questions)');
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@genesisideas.school').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log('');
  console.log('=== Admin ===');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('');
  console.log('=== Seeding students ===');

  await upsertStudentWithAccount({
    email: 'ruwen.li@genesisideas.school',
    password: 'Student2024!!',
    studentCode: '26-001',
    student: {
      name: 'Ruwen Li',
      gender: 'Female',
      birthDate: new Date('2006-11-27T00:00:00.000Z'),
      parentGuardian: 'Xiaojun Wu',
      address: "Unit 1802, Building 12, Baopo Apartment, Jing\'an District",
      city: 'Shanghai',
      province: 'Shanghai',
      zipCode: '200000',
      entryDate: new Date('2022-08-15T00:00:00.000Z'),
      graduationDate: new Date('2026-06-30T00:00:00.000Z'),
      transcriptDate: new Date('2026-03-02T00:00:00.000Z'),
    },
    semestersCreate: ruwenLiSemesters,
  });

  await upsertStudentWithAccount({
    email: 'tao.zhang@genesisideas.school',
    password: 'Student2024!!',
    studentCode: '26-002',
    student: {
      name: 'Tao Zhang',
      gender: 'Male',
      birthDate: new Date('2007-02-18T00:00:00.000Z'),
      parentGuardian: 'Xiaoying Zhang',
      address: 'Room 601, No. 72, Lane 99, Jinhe Road',
      city: 'Shanghai',
      province: 'Shanghai',
      zipCode: '200120',
      entryDate: new Date('2022-08-15T00:00:00.000Z'),
      graduationDate: new Date('2026-06-30T00:00:00.000Z'),
      transcriptDate: new Date('2026-04-23T00:00:00.000Z'),
    },
    semestersCreate: taoZhangSemesters,
  });

  await upsertStudentWithAccount({
    email: 'baoyi.lu@genesisideas.school',
    password: 'Student2024!!',
    studentCode: '26-003',
    student: {
      name: 'Baoyi Lu',
      gender: 'Male',
      birthDate: new Date('2007-12-25T00:00:00.000Z'),
      parentGuardian: 'Kaiming Lu',
      address: 'No. 88 Huasheng Road',
      city: 'Cixi',
      province: 'Zhejiang',
      zipCode: '315300',
      entryDate: new Date('2022-08-15T00:00:00.000Z'),
      graduationDate: new Date('2026-06-30T00:00:00.000Z'),
      transcriptDate: new Date('2026-02-06T00:00:00.000Z'),
    },
    semestersCreate: baoyiLuSemesters,
  });

  await upsertStudentWithAccount({
    email: 'yunfan.yang@genesisideas.school',
    password: 'Student2024!!',
    studentCode: '26-004',
    student: {
      name: 'Yunfan Yang',
      gender: 'Female',
      birthDate: new Date('2007-11-01T00:00:00.000Z'),
      parentGuardian: 'Chunxiao Lu',
      address: 'Room 702, Building 9, Poly City Light, Liangxi District',
      city: 'Wuxi',
      province: 'Jiangsu',
      zipCode: '214000',
      entryDate: new Date('2022-08-23T00:00:00.000Z'),
      graduationDate: new Date('2026-06-30T00:00:00.000Z'),
      transcriptDate: new Date('2026-02-06T00:00:00.000Z'),
    },
    semestersCreate: yunfanYangSemesters,
  });

  console.log('');
  console.log('=== Student accounts (password: Student2024!!) ===');
  console.log('  26-001  ruwen.li@genesisideas.school');
  console.log('  26-002  tao.zhang@genesisideas.school');
  console.log('  26-003  baoyi.lu@genesisideas.school');
  console.log('  26-004  yunfan.yang@genesisideas.school');
  console.log('');

  console.log('=== Seeding courses ===');
  await seedCourses();
  console.log('');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
