const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function collectJsFiles(dir) {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];

  return fs.readdirSync(absDir, { withFileTypes: true }).flatMap((entry) => {
    const relPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(relPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [relPath] : [];
  });
}

const FILES = [
  'public/index.html',
  'src/components/Footer/Footer.js',
  'src/components/main/LessonPreview.js',
  ...collectJsFiles('src/components/pages/Homepage'),
  ...collectJsFiles('src/components/pages/Academics'),
  ...collectJsFiles('src/components/pages/Admission'),
  ...collectJsFiles('src/components/pages/Apply'),
  ...collectJsFiles('src/components/pages/AssessmentProof'),
  ...collectJsFiles('src/components/pages/Discovery'),
  ...collectJsFiles('src/components/pages/Handbook'),
  ...collectJsFiles('src/components/pages/Parent'),
  ...collectJsFiles('src/components/pages/Pathways'),
  ...collectJsFiles('src/components/pages/Pricing'),
  ...collectJsFiles('src/components/pages/SchoolProfile'),
  ...collectJsFiles('src/components/pages/Support'),
  ...collectJsFiles('src/components/pages/TransferStudents'),
  ...collectJsFiles('src/components/pages/TrustCenter'),
  ...collectJsFiles('src/components/pages/Welcome'),
];

const RULES = [
  {
    id: 'stale-hardcoded-lesson-video',
    pattern: /AMF3Wj4cycs/,
    message: 'Homepage lesson preview must read approved videos from the lesson manifest, not a stale hardcoded YouTube ID.',
  },
  {
    id: 'restricted-ap-classroom',
    pattern: /AP Classroom|apclassroom\.collegeboard\.org/i,
    message: 'AP Classroom is login-gated and must not be presented as a required public GIIS resource.',
  },
  {
    id: 'selective-admission-promise',
    pattern: /proven results|well-positioned|colleges? like .*look for|programs? .*look for|top programs at|selective universities|top US universit|top US programs|US university admissions standards|world-class education|guaranteed admission|guaranteed acceptance/i,
    message: 'Public pathway copy should describe evidence-building and advising support, not admissions advantage or outcomes.',
  },
  {
    id: 'direct-admissions-mailto',
    pattern: /mailto:\$\{?SCHOOL_EMAIL|mailto:admissions@genesisideas\.school/i,
    paths: [
      'src/components/pages/Pricing/PricingPage.js',
      'src/components/pages/TransferStudents/TransferStudentsPage.js',
    ],
    message: 'Public admission/pricing CTAs should route through the application/admission flow instead of mailto buttons.',
  },
  {
    id: 'unsafe-school-claim',
    pattern: /US-accredited|Cognia|Common App approved|CEEB code 650/i,
    allow: (line) => /not currently accredited|not accredited|未经过/.test(line),
    message: 'Public school-status claims must stay conservative and verified.',
  },
  {
    id: 'ap-count-as-course-claim',
    pattern: /AP Prep Options|AP Course(?:s)?|门 AP|AP exams and US college applications/i,
    message: 'Public pathway/homepage copy should use conservative exam-prep wording, not AP-course or admissions framing.',
  },
  {
    id: 'ai-adaptive-overclaim',
    pattern: /AI tools are integrated throughout|AI-powered learning tools|adaptive learning experiences|optimal pace|AI 驱动的沉浸式学习|AI 赋能学习|适应性的学习体验|最佳节奏进步/i,
    message: 'Public AI/technology copy must describe software-assisted, human-reviewed support rather than adaptive or automated learning promises.',
  },
];

let issueCount = 0;

for (const relPath of FILES) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;
  const lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue;
      if (rule.paths && !rule.paths.includes(relPath)) continue;
      if (rule.allow && rule.allow(line, relPath)) continue;
      issueCount += 1;
      console.log(`${relPath}:${index + 1} [${rule.id}] ${rule.message}`);
      console.log(`  ${line.trim()}`);
    }
  });
}

if (issueCount > 0) {
  console.error(`\nPublic trust claims audit failed: ${issueCount} issue(s).`);
  process.exit(1);
}

console.log(`Public trust claims audit passed: ${FILES.length} file(s) checked.`);
