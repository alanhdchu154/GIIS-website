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
  'src/components/pages/Discovery/Discovery/DiscoveryIntroduction2.js',
  ...collectJsFiles('src/components/pages/Homepage'),
  ...collectJsFiles('src/components/pages/Academics'),
  ...collectJsFiles('src/components/pages/Discovery'),
  ...collectJsFiles('src/components/pages/Pathways'),
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
    pattern: /well-positioned|colleges? like .*look for|programs? .*look for|top programs at|selective universities|top US universit|top US programs|US university admissions standards|world-class education|guaranteed admission|guaranteed acceptance/i,
    message: 'Public pathway copy should describe evidence-building and advising support, not admissions advantage or outcomes.',
  },
  {
    id: 'unsafe-school-claim',
    pattern: /US-accredited|Cognia|Common App approved|CEEB code 650/i,
    message: 'Public school-status claims must stay conservative and verified.',
  },
  {
    id: 'ap-count-as-course-claim',
    pattern: /AP Prep Options|AP Course(?:s)?|门 AP|AP exams and US college applications/i,
    message: 'Public pathway/homepage copy should use conservative exam-prep wording, not AP-course or admissions framing.',
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
