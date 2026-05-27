#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TEACHING_DIR = path.join(ROOT, 'teaching-videos');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const MANIFEST_PATH = path.join(ROOT, 'public', 'data', 'lessons-manifest.json');
const REFERENCES_DIR = path.join(ROOT, 'references');

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full, entry)) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file);
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenOverlap(expected, actual) {
  const stop = new Set(['and', 'or', 'the', 'with', 'for', 'module', 'ap', 'i', 'ii', 'iii']);
  const a = normalize(expected).split(/\s+/).filter((t) => t.length >= 3 && !stop.has(t));
  const b = new Set(normalize(actual).split(/\s+/).filter(Boolean));
  if (!a.length || !b.size) return 1;
  return a.filter((token) => b.has(token)).length / a.length;
}

function loadCourses() {
  const bySlug = new Map();
  const byName = new Map();
  for (const file of walk(COURSE_DIR, (full) => full.endsWith('.json'))) {
    const course = readJson(file);
    if (!course) continue;
    const modules = new Map((course.modules || []).map((m) => [Number(m.order), m]));
    const record = { file: rel(file), slug: course.slug, name: course.name, modules };
    if (course.slug) bySlug.set(course.slug, record);
    if (course.name) byName.set(course.name, record);
  }
  return { bySlug, byName };
}

function loadManifest() {
  const manifest = readJson(MANIFEST_PATH, {});
  const lessons = Object.values(manifest.by_course || {}).flat();
  const byDir = new Map();
  for (const lesson of lessons) {
    if (lesson.lesson_dir) byDir.set(lesson.lesson_dir, lesson);
  }
  return { generatedAt: manifest.generated_at, lessons, byDir };
}

function findMp4(folder) {
  const canonical = path.join(folder, `${path.basename(folder).replace(/-/g, '_')}.mp4`);
  if (fs.existsSync(canonical)) return canonical;
  const mp4s = fs.readdirSync(folder).filter((name) => name.endsWith('.mp4'));
  return mp4s.length === 1 ? path.join(folder, mp4s[0]) : null;
}

function reviewerState(folder) {
  const files = fs.readdirSync(folder).filter((name) => /^_review.*\.json$/.test(name)).sort();
  const reviewers = files.map((name) => {
    const data = readJson(path.join(folder, name), {});
    const label = `${data.reviewer || name} ${data.role || ''}`.toLowerCase();
    return {
      file: name,
      reviewer: data.reviewer || name.replace(/\.json$/, ''),
      verdict: String(data.verdict || 'unknown').toLowerCase(),
      hasReviewerNote: Boolean(data.summary || data.notes || data.findings || data.issues),
      isPhdOrPeer: label.includes('phd') || label.includes('peer'),
      isStudent: label.includes('student') || label.includes('adversarial'),
      isCitation: label.includes('citation') || label.includes('source'),
    };
  });
  return {
    files,
    count: reviewers.length,
    hasPhdOrPeer: reviewers.some((r) => r.isPhdOrPeer),
    hasAdversarialStudent: reviewers.some((r) => r.isStudent),
    hasCitationChecker: reviewers.some((r) => r.isCitation),
    hasReviewContent: reviewers.every((r) => r.hasReviewerNote),
    verdicts: reviewers.map((r) => ({ file: r.file, reviewer: r.reviewer, verdict: r.verdict })),
  };
}

function referenceFor(script) {
  const courseSlug = String(script.course_slug || '').trim();
  const course = String(script.course || '').toLowerCase();
  const candidates = [];
  if (courseSlug) candidates.push(`${courseSlug}-ced.md`, `${courseSlug}-reference.md`);
  if (course.includes('computer science')) candidates.push('ap-cs-a-ced.md');
  if (course.includes('psychology')) candidates.push('ap-psychology-ced.md');
  if (course.includes('biology')) candidates.push('ap-biology-ced.md');
  if (course.includes('calculus')) candidates.push('ap-calc-ab-ced.md');
  const found = candidates.find((name) => fs.existsSync(path.join(REFERENCES_DIR, name)));
  return { required: /\bAP\b/.test(String(script.course || '')), found: found || null, candidates };
}

function classify(row) {
  if (row.brokenJson) return 'blocked';
  if (row.isAp && !row.reference.found) return 'needs_reference_review';
  if (row.manifestVisible && !row.reviewers.hasFullCascade) return 'visible_needs_posthoc_review';
  if (row.hasMp4 && !row.reviewers.hasFullCascade) return 'pending_needs_review';
  if (row.hasMp4 && !row.hasLearningCheck) return 'needs_learning_check';
  if (row.hasMp4 && !row.hasContactSheet) return 'needs_visual_review';
  if (row.manifestVisible) return 'visible_keep_candidate';
  return row.hasMp4 ? 'upload_candidate_after_human_approval' : 'draft';
}

function main() {
  const courses = loadCourses();
  const manifest = loadManifest();
  const lessons = fs.existsSync(TEACHING_DIR)
    ? fs.readdirSync(TEACHING_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && fs.existsSync(path.join(TEACHING_DIR, entry.name, 'script.json')))
      .map((entry) => path.join(TEACHING_DIR, entry.name))
      .sort()
    : [];

  const rows = lessons.map((folder) => {
    const slug = path.basename(folder);
    const script = readJson(path.join(folder, 'script.json'));
    const manifestLesson = manifest.byDir.get(slug);
    if (!script) {
      return { slug, path: rel(folder), brokenJson: true, classification: 'blocked' };
    }
    const mp4 = findMp4(folder);
    const reviewers = reviewerState(folder);
    reviewers.hasFullCascade = reviewers.hasPhdOrPeer && reviewers.hasAdversarialStudent && reviewers.hasCitationChecker;
    const course = courses.bySlug.get(script.course_slug) || courses.byName.get(script.course);
    const moduleNumber = Number(script.module_number || script.moduleNumber || (String(script.module || '').match(/module\s+(\d+)/i) || [])[1]);
    const module = course && Number.isFinite(moduleNumber) ? course.modules.get(moduleNumber) : null;
    const reference = referenceFor(script);
    const row = {
      slug,
      path: rel(folder),
      course: script.course || manifestLesson?.course || null,
      course_slug: script.course_slug || manifestLesson?.course_slug || course?.slug || null,
      module_number: moduleNumber || manifestLesson?.module_number || null,
      module_title: script.module || manifestLesson?.module_title || null,
      course_json_title: module?.title || null,
      course_json_file: course?.file || null,
      title_overlap: module ? Number(tokenOverlap(module.title, script.module || '').toFixed(2)) : null,
      isAp: /\bAP\b/.test(String(script.course || manifestLesson?.course || '')),
      hasMp4: Boolean(mp4),
      mp4: mp4 ? rel(mp4) : null,
      hasTranscript: fs.existsSync(path.join(folder, 'transcript.txt')),
      hasContactSheet: fs.existsSync(path.join(folder, 'contact-sheet.jpg')),
      hasLearningCheck: fs.existsSync(path.join(folder, 'learning_check.json')) || fs.existsSync(path.join(folder, 'quiz.json')),
      manifestVisible: Boolean(manifestLesson),
      youtube_id: manifestLesson?.youtube_id || script.youtube?.video_id || null,
      reviewers,
      reference,
    };
    row.classification = classify(row);
    return row;
  });

  const summary = rows.reduce((acc, row) => {
    acc.total += 1;
    acc[row.classification] = (acc[row.classification] || 0) + 1;
    if (row.manifestVisible) acc.visible += 1;
    if (row.hasMp4) acc.with_mp4 += 1;
    if (row.reviewers?.hasFullCascade) acc.full_reviewer_cascade += 1;
    if (row.isAp && !row.reference?.found) acc.ap_missing_reference += 1;
    return acc;
  }, {
    total: 0,
    visible: 0,
    with_mp4: 0,
    full_reviewer_cascade: 0,
    ap_missing_reference: 0,
  });

  const report = {
    generated_at: new Date().toISOString(),
    sources: {
      teaching_videos: rel(TEACHING_DIR),
      course_json: rel(COURSE_DIR),
      manifest: rel(MANIFEST_PATH),
      manifest_generated_at: manifest.generatedAt || null,
      references: rel(REFERENCES_DIR),
    },
    summary,
    rows,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Video quality inventory: ${summary.total} folders, ${summary.visible} visible, ${summary.with_mp4} with MP4`);
  console.log(`Full reviewer cascade: ${summary.full_reviewer_cascade}/${summary.total}`);
  console.log(`AP missing reference packet: ${summary.ap_missing_reference}`);
  for (const [key, value] of Object.entries(summary)) {
    if (!['total', 'visible', 'with_mp4', 'full_reviewer_cascade', 'ap_missing_reference'].includes(key)) {
      console.log(`- ${key}: ${value}`);
    }
  }
  const urgent = rows.filter((row) => ['needs_reference_review', 'visible_needs_posthoc_review'].includes(row.classification));
  if (urgent.length) {
    console.log('\nPriority review queue:');
    for (const row of urgent.slice(0, 20)) {
      console.log(`- ${row.classification}: ${row.slug} (${row.course || 'unknown'}; ${row.module_title || 'unknown module'})`);
    }
    if (urgent.length > 20) console.log(`... ${urgent.length - 20} more`);
  }
}

main();
