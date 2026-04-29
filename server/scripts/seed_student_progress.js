/**
 * Seeds quiz + exam progress for all 4 students based on their official transcript grades.
 * For each transcript course row that maps to a GIIS course slug:
 *   - Creates an Enrollment
 *   - Creates ModuleQuizAttempts for every module at the target score
 *   - Creates midterm + final ExamAttempts at the target score
 *   - Sets creditEarned = true (transcript grade = credit awarded)
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

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
  const rows = student.semesters.flatMap(sem => sem.courseRows);
  let done = 0, skipped = 0;

  for (const row of rows) {
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

    // Create or get enrollment
    let enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    });
    if (!enrollment) {
      enrollment = await db.enrollment.create({
        data: { studentId: student.id, courseId: course.id },
      });
    }

    // Quiz attempts for every module
    for (const moduleOrder of allModuleOrders) {
      await db.moduleQuizAttempt.upsert({
        where: { enrollmentId_moduleOrder: { enrollmentId: enrollment.id, moduleOrder } },
        create: {
          enrollmentId: enrollment.id,
          moduleOrder,
          score: targetScore,
          passed: targetScore >= 70,
          answers: {},
        },
        update: {},
      });
    }

    // Remove any old exam attempts for this enrollment (avoid duplicate conflicts)
    await db.examAttempt.deleteMany({ where: { enrollmentId: enrollment.id } });

    // Midterm attempt
    await db.examAttempt.create({
      data: {
        enrollmentId: enrollment.id,
        examType: 'midterm',
        submittedAt: new Date(),
        score: targetScore,
        passed: targetScore >= 70,
        answers: {},
      },
    });

    // Final attempt
    await db.examAttempt.create({
      data: {
        enrollmentId: enrollment.id,
        examType: 'final',
        submittedAt: new Date(),
        score: targetScore,
        passed: targetScore >= 70,
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
  }

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
