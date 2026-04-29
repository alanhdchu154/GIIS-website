/**
 * Seeds quiz + exam progress for all 4 students based on their official transcript grades.
 * Stores actual per-question answers so the review panel shows which questions were wrong.
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

/**
 * Given quiz questions and a target score (0-100), builds a realistic answers object
 * {questionId: submittedAnswer} where the score matches as closely as possible.
 */
function buildAnswers(questions, targetPct) {
  const total = questions.length;
  if (total === 0) return { answers: {}, score: 0 };

  const numCorrect = Math.round((targetPct / 100) * total);
  // Shuffle questions to randomise which are "wrong"
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const correctSet = new Set(shuffled.slice(0, numCorrect).map(q => q.id));

  const answers = {};
  for (const q of questions) {
    if (correctSet.has(q.id)) {
      answers[q.id] = q.answer;
    } else {
      // Pick a wrong option; for fill-blank / T/F use a plausible wrong value
      const wrong = pickWrongAnswer(q);
      answers[q.id] = wrong;
    }
  }
  const score = total > 0 ? (numCorrect / total) * 100 : 0;
  return { answers, score };
}

function pickWrongAnswer(q) {
  const opts = Array.isArray(q.options) && q.options.length > 0 ? q.options : null;
  if (opts) {
    const wrongs = opts.filter(o => o !== q.answer);
    return wrongs.length > 0 ? wrongs[Math.floor(Math.random() * wrongs.length)] : opts[0];
  }
  // fill-in-blank: submit a plausible wrong answer
  return q.answer.split(' ').reverse().join(' ') + ' (incorrect)';
}

/**
 * Nearest achievable score for an exam with numQuestions questions.
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
    } else {
      enrollment = await db.enrollment.update({
        where: { id: enrollment.id },
        data: { semesterLabel },
      });
    }

    // Quiz attempts — fetch actual questions and build per-question answers
    for (const moduleOrder of allModuleOrders) {
      const qs = await db.moduleQuizQuestion.findMany({
        where: { courseId: course.id, moduleOrder },
        orderBy: { order: 'asc' },
      });
      if (qs.length === 0) continue;
      // Use targetScore with small per-module variation (±8%)
      const modTarget = Math.min(100, Math.max(0, targetScore + (Math.random() * 16 - 8)));
      const { answers, score } = buildAnswers(qs, modTarget);
      await db.moduleQuizAttempt.upsert({
        where: { enrollmentId_moduleOrder: { enrollmentId: enrollment.id, moduleOrder } },
        create: { enrollmentId: enrollment.id, moduleOrder, score, passed: score >= 70, answers },
        update: { score, passed: score >= 70, answers },
      });
    }

    // Remove any old exam attempts for this enrollment
    await db.examAttempt.deleteMany({ where: { enrollmentId: enrollment.id } });

    // Midterm — build per-question answers from actual exam questions
    const midQs = await db.examQuestion.findMany({
      where: { courseId: course.id, examType: 'midterm' },
      orderBy: { order: 'asc' },
    });
    const midTarget = nearestAchievable(targetScore, midQs.length || 15);
    const midData = midQs.length > 0 ? buildAnswers(midQs, midTarget) : { answers: {}, score: midTarget };
    await db.examAttempt.create({
      data: {
        enrollmentId: enrollment.id, examType: 'midterm',
        submittedAt: new Date(), score: midData.score,
        passed: midData.score >= 70, answers: midData.answers,
      },
    });

    // Final — build per-question answers from actual exam questions
    const finalQs = await db.examQuestion.findMany({
      where: { courseId: course.id, examType: 'final' },
      orderBy: { order: 'asc' },
    });
    const finalTarget = nearestAchievable(targetScore, finalQs.length || 20);
    const finalData = finalQs.length > 0 ? buildAnswers(finalQs, finalTarget) : { answers: {}, score: finalTarget };
    await db.examAttempt.create({
      data: {
        enrollmentId: enrollment.id, examType: 'final',
        submittedAt: new Date(), score: finalData.score,
        passed: finalData.score >= 70, answers: finalData.answers,
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
