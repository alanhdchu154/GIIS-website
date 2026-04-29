/**
 * Seeds quiz + exam progress for all 4 students based on their official transcript grades.
 * Generates realistic, varied per-module scores rather than identical round numbers.
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

/**
 * Generates varied quiz scores that average close to targetPct.
 * With 5 questions per module, achievable scores are multiples of 20 (0,20,40,60,80,100).
 */
function makeModuleScores(targetPct, numModules) {
  const step = 20; // 5 questions → 20% per question
  const lo = Math.floor(targetPct / step) * step;
  const hi = Math.min(100, lo + step);
  if (lo === hi) return Array(numModules).fill(lo);

  const numHi = Math.round(((targetPct - lo) / step) * numModules);
  const numLo = numModules - numHi;
  const scores = [...Array(numLo).fill(lo), ...Array(numHi).fill(hi)];

  // Fisher-Yates shuffle
  for (let i = scores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scores[i], scores[j]] = [scores[j], scores[i]];
  }

  // ~12% chance any module drops one bracket (simulates harder modules or off days)
  return scores.map(s => (s > 0 && Math.random() < 0.12) ? Math.max(0, s - step) : s);
}

/**
 * Nearest achievable score for an exam with numQuestions questions.
 * Randomly picks between lo/hi bracket weighted by proximity to target.
 */
function nearestAchievable(targetPct, numQuestions) {
  if (!numQuestions) return targetPct;
  const step = 100 / numQuestions;
  const lo = Math.floor(targetPct / step) * step;
  const hi = Math.min(100, lo + step);
  if (lo === hi) return lo;
  const p = (targetPct - lo) / step;
  return Math.random() < p ? hi : lo;
}

// Transcript course name → GIIS slug
const COURSE_MAP = {
  'English I': 'english-i',
  'English I - Writing': 'english-i-writing',
  'English II': 'english-ii',
  'English II - Literature': 'english-ii-literature',
  'English III': 'english-iii',
  'English III - Literature': 'english-iii-literature',
  'English IV - Writing & Communication': 'english-iv-writing',
  'English IV - Advanced Composition': 'english-iv-advanced-composition',
  'Algebra I': 'algebra-i',
  'Algebra II': 'algebra-ii',
  'Geometry': 'geometry',
  'Pre-Calculus': 'pre-calculus',
  'Statistics': 'statistics',
  'Statistics for Social Sciences': 'statistics-for-social-sciences',
  'Biology': 'biology',
  'Chemistry': 'chemistry',
  'Environmental Science': 'environmental-science',
  'Physics Fundamentals': 'physics-fundamentals',
  'World History': 'world-history',
  'U.S. History': 'us-history',
  'Geography': 'geography',
  'Government': 'government',
  'Economics': 'economics',
  'Economics Seminar': 'economics-seminar',
  'Global Economics & Politics': 'global-economics-politics',
  'Sociology': 'sociology',
  'Introduction to Psychology': 'intro-psychology',
  'Introduction to Business & Economics': 'intro-business-economics',
  'Business Technology & Digital Literacy': 'business-technology-digital-literacy',
  'Business Media Literacy': 'business-media-literacy',
  'Entrepreneurship Fundamentals': 'entrepreneurship-fundamentals',
  'Marketing & Communication': 'marketing-communication',
  'Leadership Communication': 'leadership-communication',
  'Digital Marketing': 'digital-marketing',
  'Business Writing': 'business-writing',
  'Business Research Methods': 'business-research-methods',
  'Principles of Marketing': 'principles-of-marketing',
  'Business Ethics & Critical Thinking': 'business-ethics-critical-thinking',
  'Business Strategy & Writing': 'business-strategy-writing',
  'Organizational Behavior & Communication': 'organizational-behavior-communication',
  // English
  'English I - Writing Focus': 'english-i-writing-focus',
  'English IV - Analytical Writing': 'english-iv-analytical-writing',
  'English IV - Media & Analytical Writing': 'english-iv-media-analytical-writing',
  'English IV - Advanced Composition / Media Writing': 'english-iv-media-writing',
  'Academic Writing': 'academic-writing',
  'College Research & Writing': 'college-research-writing',
  'Public Speaking': 'public-speaking',
  'Communication Studies': 'communication-studies',
  'Introduction to Communication': 'intro-communication',
  // Math
  'AP Statistics': 'ap-statistics',
  'Calculus': 'calculus',
  'Trigonometry': 'trigonometry',
  // Science
  'AP Biology': 'ap-biology',
  'Biology Advanced': 'biology-advanced',
  'Physics - Mechanics': 'physics-mechanics',
  // Social Studies
  'World Politics': 'world-politics',
  'AP Human Geography': 'ap-human-geography',
  'Research Methods in Social Science': 'research-methods-social-science',
  'Economics Advanced': 'economics-advanced',
  'Introduction to Economics': 'intro-economics',
  'Ethics & Critical Thinking': 'ethics-critical-thinking',
  'Digital Media & Society': 'digital-media-society',
  'Media & Society': 'media-society',
  'Media Studies': 'media-studies',
  // Psychology
  'Psychology': 'psychology',
  'AP Psychology': 'ap-psychology',
  'Psychology Foundations': 'psychology-foundations',
  'Psychology Seminar / Capstone': 'psychology-seminar-capstone',
  'Abnormal Psychology': 'abnormal-psychology',
  'Cognitive Psychology': 'cognitive-psychology',
  'Experimental Psychology': 'experimental-psychology',
  'Social Psychology': 'social-psychology',
  'Behavioral Science': 'behavioral-science',
  'Human Development': 'human-development',
  'Counseling & Mental Health Studies': 'counseling-mental-health',
  'Media Psychology': 'media-psychology',
  // PE / Sports
  'Physical Education': 'physical-education',
  'Athletic Training': 'athletic-training',
  'Fitness Leadership': 'fitness-leadership',
  'Health & Wellness': 'health-wellness',
  'Health and Nutrition': 'health-nutrition',
  'Sports Psychology': 'sports-psychology',
  'Sports Management Basics': 'sports-management-basics',
  'Sports Management & Leadership': 'sports-management-leadership',
  // Business Electives
  'Marketing Basics': 'marketing-basics',
  'Business Law': 'business-law',
  'Corporate Finance': 'corporate-finance',
  'Personal Finance / Applied Economics': 'personal-finance-applied-economics',
  'Business Management or Entrepreneurship': 'business-management-entrepreneurship',
  'Digital Literacy': 'digital-literacy',
  'Study Skills': 'study-skills',
};

// Letter grade → target score (midpoint of each band, always >= 70 so final "passes")
const GRADE_SCORE = {
  'A':  96,
  'A-': 91,
  'B+': 88,
  'B':  85,
  'B-': 81,
  'C+': 78,
  'C':  75,
  'C-': 72,
  'D+': 72, // keep at 72 so final is still "passed" but GPA reflects D+
  'D':  72, // same reasoning
};

async function seedStudent(student) {
  let done = 0, skipped = 0;

  for (const sem of student.semesters) {
    const semesterLabel = sem.key; // e.g. "Grade 9 - Fall Semester"

    for (const row of sem.courseRows) {
    const slug = COURSE_MAP[row.courseName];
    const targetScore = GRADE_SCORE[row.letterGrade];

    if (!slug || !targetScore) {
      skipped++;
      continue;
    }

    const course = await db.course.findUnique({
      where: { slug },
      include: { modules: { select: { order: true } } },
    });
    if (!course) { skipped++; continue; }

    const totalModules = course.modules.length;
    const allModuleOrders = course.modules.map(m => m.order);

    // Create or update enrollment with semesterLabel
    let enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    });
    if (!enrollment) {
      enrollment = await db.enrollment.create({
        data: { studentId: student.id, courseId: course.id, semesterLabel },
      });
    } else if (!enrollment.semesterLabel) {
      enrollment = await db.enrollment.update({
        where: { id: enrollment.id },
        data: { semesterLabel },
      });
    }

    // Quiz attempts for every module — varied realistic scores, not identical round numbers
    const moduleScores = makeModuleScores(targetScore, allModuleOrders.length);
    for (let idx = 0; idx < allModuleOrders.length; idx++) {
      const moduleOrder = allModuleOrders[idx];
      const score = moduleScores[idx];
      await db.moduleQuizAttempt.upsert({
        where: { enrollmentId_moduleOrder: { enrollmentId: enrollment.id, moduleOrder } },
        create: { enrollmentId: enrollment.id, moduleOrder, score, passed: score >= 70, answers: {} },
        update: { score, passed: score >= 70 },
      });
    }

    // Remove any old exam attempts for this enrollment (avoid duplicate conflicts)
    await db.examAttempt.deleteMany({ where: { enrollmentId: enrollment.id } });

    // Midterm attempt — 15 questions, score varies realistically
    const midScore = nearestAchievable(targetScore, 15);
    await db.examAttempt.create({
      data: {
        enrollmentId: enrollment.id,
        examType: 'midterm',
        submittedAt: new Date(),
        score: midScore,
        passed: midScore >= 70,
        answers: {},
      },
    });

    // Final attempt — 20 questions, score varies realistically
    const finalScore = nearestAchievable(targetScore, 20);
    await db.examAttempt.create({
      data: {
        enrollmentId: enrollment.id,
        examType: 'final',
        submittedAt: new Date(),
        score: finalScore,
        passed: finalScore >= 70,
        answers: {},
      },
    });

    // Mark enrollment complete
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedModules: allModuleOrders,
        creditEarned: true,
        creditEarnedAt: new Date(),
      },
    });

    console.log(`  ✓ ${course.name} → ${row.letterGrade} (${targetScore}%)`);
    done++;
    } // end courseRow loop
  } // end semester loop

  console.log(`  → ${done} courses seeded, ${skipped} skipped (no GIIS match)\n`);
}

async function main() {
  const students = await db.student.findMany({
    include: {
      semesters: {
        orderBy: { sortOrder: 'asc' },
        include: { courseRows: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  for (const student of students) {
    console.log(`\n=== ${student.name} ===`);
    await seedStudent(student);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => db.$disconnect());
