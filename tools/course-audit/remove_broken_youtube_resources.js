#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const AUDIT_PATH = path.join(ROOT, 'umi', 'reviews', '2026-05-30-course-external-video-audit.json');
const MANIFEST_PATH = path.join(ROOT, 'public', 'data', 'lessons-manifest.json');
const OUT_PATH = path.join(ROOT, 'umi', 'reviews', '2026-05-30-broken-youtube-removal.json');
const DRY_RUN = process.argv.includes('--dry-run');

function youtubeId(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (!host.endsWith('youtube.com')) return null;
    if (url.pathname === '/watch') return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null;
    if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
  } catch {
    return null;
  }
  return null;
}

function noteForRemoval(field) {
  if (field === 'videoUrl' || field === 'video2Url') {
    return 'Removed after 2026-05-30 availability audit: previous YouTube resource was unavailable. Use the remaining reading/practice resources until a vetted replacement is added.';
  }
  return 'Removed after 2026-05-30 availability audit: previous YouTube resource was unavailable.';
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function main() {
  const audit = readJson(AUDIT_PATH);
  const brokenRefs = audit.confirmedBrokenYoutubeRefs || [];
  const brokenIds = new Set(brokenRefs.map((ref) => ref.youtubeId).filter(Boolean));
  const isBrokenYoutube = (url) => {
    const id = youtubeId(url);
    return !!id && brokenIds.has(id);
  };

  const refsByFile = new Map();
  for (const ref of brokenRefs) {
    if (!refsByFile.has(ref.file)) refsByFile.set(ref.file, []);
    refsByFile.get(ref.file).push(ref);
  }

  const actions = [];
  for (const [relativeFile, refs] of refsByFile.entries()) {
    const file = path.join(ROOT, relativeFile);
    const course = readJson(file);
    const refsByModule = new Map();
    for (const ref of refs) {
      if (!refsByModule.has(ref.moduleOrder)) refsByModule.set(ref.moduleOrder, []);
      refsByModule.get(ref.moduleOrder).push(ref);
    }

    for (const [moduleOrder, moduleRefs] of refsByModule.entries()) {
      const mod = (course.modules || []).find((item) => Number(item.order) === Number(moduleOrder));
      if (!mod) continue;

      const brokenKeys = new Set(moduleRefs.map((ref) => ref.key));
      if (brokenKeys.has('videoUrl')) {
        if (mod.video2Url && !isBrokenYoutube(mod.video2Url)) {
          actions.push({
            action: 'promote_video2_to_video',
            file: relativeFile,
            course: course.slug,
            moduleOrder,
            oldVideoUrl: mod.videoUrl,
            newVideoUrl: mod.video2Url,
          });
          mod.videoUrl = mod.video2Url;
          mod.videoNote = mod.video2Note || mod.videoNote || 'Supplemental video promoted after unavailable primary video was removed.';
          mod.video2Url = '';
          mod.video2Note = '';
        } else {
          actions.push({
            action: 'clear_broken_video',
            file: relativeFile,
            course: course.slug,
            moduleOrder,
            key: 'videoUrl',
            oldUrl: mod.videoUrl,
          });
          mod.videoUrl = '';
          mod.videoNote = noteForRemoval('videoUrl');
        }
      }

      if (brokenKeys.has('video2Url') && mod.video2Url && isBrokenYoutube(mod.video2Url)) {
        actions.push({
          action: 'clear_broken_supplemental_video',
          file: relativeFile,
          course: course.slug,
          moduleOrder,
          key: 'video2Url',
          oldUrl: mod.video2Url,
        });
        mod.video2Url = '';
        mod.video2Note = '';
      }

      for (const ref of moduleRefs) {
        if (ref.key === 'videoUrl' || ref.key === 'video2Url') continue;
        if (mod[ref.key] && isBrokenYoutube(mod[ref.key])) {
          actions.push({
            action: `clear_broken_${ref.key}`,
            file: relativeFile,
            course: course.slug,
            moduleOrder,
            key: ref.key,
            oldUrl: mod[ref.key],
          });
          mod[ref.key] = '';
          const noteKey = ref.key.replace(/Url$/, 'Note');
          if (Object.prototype.hasOwnProperty.call(mod, noteKey)) mod[noteKey] = noteForRemoval(ref.key);
        }
      }
    }

    if (!DRY_RUN) writeJson(file, course);
  }

  const manifestActions = [];
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = readJson(MANIFEST_PATH);
    const failedManifestIds = new Set((audit.manifestFailedRefs || []).map((item) => item.youtube_id).filter(Boolean));
    if (failedManifestIds.size) {
      const oldLessons = manifest.lessons || [];
      const nextLessons = oldLessons.filter((lesson) => !failedManifestIds.has(lesson.youtube_id));
      for (const lesson of oldLessons.filter((lesson) => failedManifestIds.has(lesson.youtube_id))) {
        manifestActions.push({
          action: 'remove_from_lesson_manifest',
          course: lesson.course_slug,
          module: lesson.module_number,
          youtubeId: lesson.youtube_id,
          url: lesson.url,
          title: lesson.module_title,
        });
      }
      manifest.lessons = nextLessons;
      if (manifest.by_course) {
        for (const [courseName, lessons] of Object.entries(manifest.by_course)) {
          manifest.by_course[courseName] = lessons.filter((lesson) => !failedManifestIds.has(lesson.youtube_id));
          if (!manifest.by_course[courseName].length) delete manifest.by_course[courseName];
        }
      }
      if (!DRY_RUN) writeJson(MANIFEST_PATH, manifest);
    }
  }

  const summary = {
    dryRun: DRY_RUN,
    brokenRefs: brokenRefs.length,
    courseFilesTouched: refsByFile.size,
    courseActions: actions.length,
    promoted: actions.filter((action) => action.action === 'promote_video2_to_video').length,
    cleared: actions.filter((action) => action.action.startsWith('clear_broken')).length,
    manifestActions: manifestActions.length,
  };
  const output = { generatedAt: new Date().toISOString(), summary, actions, manifestActions };
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
