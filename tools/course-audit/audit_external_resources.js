#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const MANIFEST_PATH = path.join(ROOT, 'public', 'data', 'lessons-manifest.json');
const OUT_DIR = path.join(ROOT, 'umi', 'reviews');

const RISK_HOSTS = {
  'apclassroom.collegeboard.org': 'login / restricted College Board AP Classroom',
  'commonlit.org': 'login / teacher-classroom flow likely required for full assignment use',
  'noredink.com': 'login / paid school product risk',
  'jstor.org': 'institutional login/paywall risk',
  'hbr.org': 'paywall/subscription article risk',
  'criterion.com': 'subscription streaming risk',
  'canva.com': 'account/pro features risk',
  'grammarly.com': 'freemium tool risk',
  'docs.google.com': 'permission/account access risk',
  'slides.google.com': 'permission/account access risk',
  'drive.google.com': 'permission/account access risk',
  'medium.com': 'metered/paywall risk',
  'practiceit.cs.washington.edu': 'account/deprecated access risk',
  'academy.hubspot.com': 'free but login/certification flow',
  'learndigital.withgoogle.com': 'free but login/certificate flow',
  'khanacademy.org': 'free nonprofit, not paid, but practice/progress may require a free account',
};

function walkJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(filePath, out);
    else if (entry.name.endsWith('.json')) out.push(filePath);
  }
  return out;
}

function youtubeId(rawUrl) {
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

function courseUrls() {
  const files = walkJson(COURSE_DIR).sort();
  const urls = [];

  for (const file of files) {
    const course = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [index, mod] of (course.modules || []).entries()) {
      for (const [key, value] of Object.entries(mod)) {
        if (typeof value !== 'string' || !/^https?:\/\//.test(value)) continue;
        const url = new URL(value);
        urls.push({
          file: path.relative(ROOT, file),
          courseSlug: course.slug,
          courseName: course.name,
          moduleOrder: mod.order || index + 1,
          moduleTitle: mod.title,
          key,
          url: value,
          host: url.hostname.replace(/^www\./, ''),
          note: mod[key.replace(/Url$/, 'Note')] || '',
          youtubeId: youtubeId(value),
        });
      }
    }
  }

  return { files, urls };
}

async function checkOembed(id) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`;
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'GIIS-course-link-audit/1.0' } });
    const body = await res.text();
    let data = {};
    try {
      data = JSON.parse(body);
    } catch {}
    return {
      id,
      ok: res.ok,
      status: res.status,
      title: data.title || '',
      author: data.author_name || '',
      body: res.ok ? '' : body.slice(0, 160),
    };
  } catch (error) {
    return {
      id,
      ok: false,
      status: 'FETCH_ERROR',
      title: '',
      author: '',
      body: String(error).slice(0, 160),
    };
  }
}

async function checkWatchPage(id) {
  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 GIIS-course-link-audit/1.0' },
    });
    const html = await res.text();
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
    if (!match) {
      return { id, watchHttp: res.status, playabilityStatus: 'NO_PLAYER_RESPONSE', reason: '', title: '', author: '' };
    }
    const player = JSON.parse(match[1]);
    return {
      id,
      watchHttp: res.status,
      playabilityStatus: player.playabilityStatus?.status || '',
      reason: player.playabilityStatus?.reason || '',
      title: player.videoDetails?.title || '',
      author: player.videoDetails?.author || '',
    };
  } catch (error) {
    return { id, watchHttp: 'FETCH_ERROR', playabilityStatus: 'FETCH_ERROR', reason: String(error).slice(0, 160), title: '', author: '' };
  }
}

async function mapLimit(items, limit, fn, label) {
  const results = [];
  let index = 0;
  let done = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const item = items[index++];
      results.push(await fn(item));
      done += 1;
      if (label && done % 100 === 0) console.error(`${label} ${done}/${items.length}`);
    }
  }));
  return results;
}

function table(rows, cols) {
  return [
    `| ${cols.join(' | ')} |`,
    `| ${cols.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${cols.map((col) => String(row[col] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`),
  ].join('\n');
}

function countBy(rows, getter) {
  const counts = {};
  for (const row of rows) {
    const key = getter(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function manifestLessons() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  return manifest.lessons || Object.values(manifest.by_course || {}).flat();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { files, urls } = courseUrls();
  const youtube = urls.filter((item) => item.youtubeId);
  const refsById = new Map();
  for (const item of youtube) {
    if (!refsById.has(item.youtubeId)) refsById.set(item.youtubeId, []);
    refsById.get(item.youtubeId).push(item);
  }

  const ids = [...refsById.keys()];
  const oembed = await mapLimit(ids, 25, checkOembed, 'youtube oembed');
  const oembedFailures = oembed.filter((item) => !item.ok).sort((a, b) => String(a.status).localeCompare(String(b.status)) || a.id.localeCompare(b.id));
  const watchRecheck = await mapLimit(oembedFailures.map((item) => item.id), 8, checkWatchPage, 'youtube watch');
  const brokenWatch = watchRecheck.filter((item) => !['OK', 'LOGIN_REQUIRED'].includes(item.playabilityStatus));

  const brokenRefs = [];
  for (const item of brokenWatch) {
    for (const ref of refsById.get(item.id) || []) {
      brokenRefs.push({ ...ref, watchStatus: item.playabilityStatus, watchReason: item.reason, watchTitle: item.title, watchAuthor: item.author });
    }
  }

  const hostCounts = {};
  for (const item of urls) hostCounts[item.host] = (hostCounts[item.host] || 0) + 1;
  const riskRefs = urls.filter((item) => RISK_HOSTS[item.host]).map((item) => ({ ...item, risk: RISK_HOSTS[item.host] }));

  const lessons = manifestLessons();
  const manifestIds = [...new Set(lessons.map((lesson) => lesson.youtube_id).filter(Boolean))];
  const manifestOembed = await mapLimit(manifestIds, 10, checkOembed);
  const manifestFailures = manifestOembed.filter((item) => !item.ok);
  const manifestFailedRefs = [];
  for (const failure of manifestFailures) {
    for (const lesson of lessons.filter((lesson) => lesson.youtube_id === failure.id)) {
      manifestFailedRefs.push({ ...lesson, status: failure.status, body: failure.body });
    }
  }

  const now = new Date().toISOString();
  const summary = {
    generatedAt: now,
    courseFiles: files.length,
    totalUrls: urls.length,
    uniqueUrls: new Set(urls.map((item) => item.url)).size,
    youtubeRefs: youtube.length,
    uniqueYoutubeIds: ids.length,
    youtubeOembedOk: oembed.filter((item) => item.ok).length,
    youtubeOembedFailed: oembedFailures.length,
    youtubeWatchRecheck: {
      checked: watchRecheck.length,
      ok: watchRecheck.filter((item) => item.playabilityStatus === 'OK').length,
      loginRequired: watchRecheck.filter((item) => item.playabilityStatus === 'LOGIN_REQUIRED').length,
      unavailableOrBroken: brokenWatch.length,
      unavailableRefs: brokenRefs.length,
    },
    manifestYoutube: {
      lessonRefs: lessons.length,
      uniqueYoutubeIds: manifestIds.length,
      oembedOk: manifestOembed.filter((item) => item.ok).length,
      oembedFailed: manifestFailures.length,
      failedRefs: manifestFailedRefs.length,
    },
    brokenYoutubeByCourse: countBy(brokenRefs, (item) => item.courseSlug).slice(0, 30).map(([course, count]) => ({ course, count })),
    brokenYoutubeByKey: countBy(brokenRefs, (item) => item.key).map(([key, count]) => ({ key, count })),
    topHosts: Object.entries(hostCounts).sort((a, b) => b[1] - a[1]).slice(0, 30),
    riskHostCounts: Object.entries(RISK_HOSTS)
      .map(([host, risk]) => ({ host, risk, count: hostCounts[host] || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count),
  };

  const jsonPath = path.join(OUT_DIR, '2026-05-30-course-external-video-audit.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    summary,
    youtubeOembedFailures: oembedFailures,
    youtubeWatchRecheck: watchRecheck,
    confirmedBrokenYoutubeRefs: brokenRefs,
    riskHostCounts: summary.riskHostCounts,
    riskRefs,
    manifestFailedRefs,
  }, null, 2));

  let md = `# Course External Video / Link Audit\n\nGenerated: ${now}\n\n## Summary\n\n`;
  md += `- Course files scanned: ${summary.courseFiles}\n`;
  md += `- External URL references: ${summary.totalUrls} (${summary.uniqueUrls} unique URLs)\n`;
  md += `- Course YouTube references: ${summary.youtubeRefs} (${summary.uniqueYoutubeIds} unique video IDs)\n`;
  md += `- Course YouTube confirmed broken/unavailable: ${summary.youtubeWatchRecheck.unavailableOrBroken} unique IDs / ${summary.youtubeWatchRecheck.unavailableRefs} course references\n`;
  md += `- GIIS lesson manifest YouTube failures: ${summary.manifestYoutube.oembedFailed} unique IDs / ${summary.manifestYoutube.failedRefs} lesson references\n\n`;
  md += `## Top Hosts\n\n${table(summary.topHosts.map(([host, count]) => ({ host, count })), ['host', 'count'])}\n\n`;
  md += `## Login / Paid / Account Risk Hosts\n\n${table(summary.riskHostCounts, ['host', 'count', 'risk'])}\n\n`;
  md += `## Broken YouTube References By Course\n\n${table(summary.brokenYoutubeByCourse, ['course', 'count'])}\n\n`;
  md += `## Broken YouTube References By Field\n\n${table(summary.brokenYoutubeByKey, ['key', 'count'])}\n\n`;
  md += `## Confirmed Broken Course YouTube References\n\n`;
  md += brokenRefs.length
    ? table(brokenRefs.slice(0, 300).map((item) => ({
      course: item.courseSlug,
      module: item.moduleOrder,
      key: item.key,
      id: item.youtubeId,
      status: item.watchStatus,
      reason: item.watchReason,
      url: item.url,
      moduleTitle: item.moduleTitle,
    })), ['course', 'module', 'key', 'id', 'status', 'reason', 'url', 'moduleTitle'])
    : 'No confirmed broken course YouTube references.\n';
  md += `\n\n## GIIS Lesson Manifest YouTube Failures\n\n`;
  md += manifestFailedRefs.length
    ? table(manifestFailedRefs.map((item) => ({
      course: item.course_slug,
      module: item.module_number,
      id: item.youtube_id,
      status: item.status,
      url: item.url,
      title: item.module_title,
    })), ['course', 'module', 'id', 'status', 'url', 'title'])
    : 'No manifest YouTube failures.\n';
  md += `\n\n## Notes\n\n`;
  md += `- Khan Academy links are classified as free nonprofit external resources, not paid courses. Some Khan practice/progress features may ask students to sign in with a free account.\n`;
  md += `- YouTube failures are checked in two passes: oEmbed first, then watch-page playability status for oEmbed failures.\n`;
  md += `- This audit checks availability and access risk; it does not watch every minute for content quality.\n`;

  fs.writeFileSync(path.join(OUT_DIR, '2026-05-30-course-external-video-audit.md'), md);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
