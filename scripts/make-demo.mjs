#!/usr/bin/env node
/**
 * scripts/make-demo.mjs — Smart, idempotent GIIS walkthrough renderer.
 *
 *   What it does, end-to-end, in one command:
 *     1. Synth per-scene voiceover with edge-tts (4 neural voices)
 *     2. Pad with silence + concat → one master MP3
 *     3. Capture demo as PNG frames via headless Chromium (uses GIIS_DEMO.seek)
 *     4. ffmpeg merges frames + audio → final 1080p MP4
 *
 *   Each step caches its output. Re-running skips finished work.
 *   Use --force to redo everything, or --audio-only / --frames-only / --merge-only
 *   to redo just one stage (handy after editing captions or visuals).
 *
 *   Usage:
 *     npm run make-demo                 # full pipeline (default)
 *     npm run make-demo -- --force      # rebuild from scratch
 *     npm run make-demo -- --audio-only # just regen voiceover
 *     npm run make-demo -- --merge-only # just remux current audio + frames
 *     npm run make-demo -- --no-audio   # silent video
 *
 *   Requirements:
 *     - Node 18+ (for fetch & playwright)
 *     - playwright + chromium  (npx playwright install chromium)
 *     - GIIS Python tools venv  (npm run tools:python:bootstrap)
 *     - ffmpeg + ffprobe       (brew install ffmpeg  /  conda install -c conda-forge ffmpeg)
 */

import { chromium } from 'playwright';
import { execSync, spawnSync } from 'node:child_process';
import {
  mkdirSync, existsSync, rmSync, readdirSync, writeFileSync, statSync, readFileSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

// ─────────── paths ───────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const GIIS_PYTHON = process.env.GIIS_PYTHON
  || (existsSync(resolve(homedir(), '.cache/giis-video-pipeline-venv/bin/python'))
    ? resolve(homedir(), '.cache/giis-video-pipeline-venv/bin/python')
    : 'python3');
const HTML_PATH = resolve(ROOT, 'public/demo/walkthrough.html');
const OUT_DIR = resolve(ROOT, 'demo-output');
const CACHE_DIR = resolve(OUT_DIR, '_cache');
const AUDIO_DIR = resolve(CACHE_DIR, 'audio');
const FRAMES_DIR = resolve(CACHE_DIR, 'frames');
const FINAL_MP4 = resolve(OUT_DIR, 'giis-demo.mp4');
const FINAL_MP3 = resolve(OUT_DIR, 'giis-demo-voiceover.mp3');

// ─────────── args ───────────
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const AUDIO_ONLY = args.includes('--audio-only');
const FRAMES_ONLY = args.includes('--frames-only');
const MERGE_ONLY = args.includes('--merge-only');
const NO_AUDIO = args.includes('--no-audio');
const FPS = parseInt(args.find(a => a.startsWith('--fps='))?.split('=')[1] || '5');

// ─────────── helpers ───────────
const log = (m) => console.log(`\x1b[36m▸\x1b[0m ${m}`);
const ok  = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const skip = (m) => console.log(`\x1b[2m·\x1b[0m  ${m} \x1b[2m(cached)\x1b[0m`);
const die = (m) => { console.error(`\x1b[31m✗\x1b[0m ${m}`); process.exit(1); };

function findBinary(name) {
  const onPath = spawnSync('which', [name], { encoding: 'utf8' });
  if (onPath.status === 0) return onPath.stdout.trim();
  const home = process.env.HOME || '';
  const candidates = [
    `${home}/anaconda3/bin/${name}`, `${home}/miniconda3/bin/${name}`,
    `${home}/opt/anaconda3/bin/${name}`, `${home}/opt/miniconda3/bin/${name}`,
    `/opt/homebrew/bin/${name}`, `/usr/local/bin/${name}`, `/opt/local/bin/${name}`,
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  return null;
}

const FFMPEG = findBinary('ffmpeg');
const FFPROBE = findBinary('ffprobe');
if (!FFMPEG || !FFPROBE) {
  die(`Couldn't find ffmpeg / ffprobe.\n  brew install ffmpeg  (or)  conda install -c conda-forge ffmpeg`);
}

function sh(cmd, opts = {}) {
  const cmdResolved = cmd
    .replace(/(^|\s)ffmpeg(\s|$)/g, `$1"${FFMPEG}"$2`)
    .replace(/(^|\s)ffprobe(\s|$)/g, `$1"${FFPROBE}"$2`);
  try { return execSync(cmdResolved, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', ...opts }); }
  catch (e) { die(`Command failed:\n  ${cmdResolved}\n  ${(e.stderr || e.message).slice(0, 800)}`); }
}
function mp3Duration(path) {
  return parseFloat(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${path}"`).trim());
}
function fileHash(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex').slice(0, 12);
}

// ─────────── parse captions out of walkthrough.html ───────────
// Source-of-truth lives in the HTML so we never get out of sync.
function loadCaptions() {
  const html = readFileSync(HTML_PATH, 'utf8');
  // Run the inline script in a sandboxed eval to extract CAPTIONS array.
  // Simpler: regex pluck.
  const m = html.match(/const CAPTIONS = \[([\s\S]*?)\];/);
  if (!m) die('Could not find `const CAPTIONS = [...]` in walkthrough.html');
  // eval only the array literal (we control the source). Wrap in parens.
  // eslint-disable-next-line no-eval
  const arr = eval(`([${m[1]}])`);
  return arr;
}
function loadTotalSec() {
  const html = readFileSync(HTML_PATH, 'utf8');
  const m = html.match(/const TOTAL_SEC = ([\d.]+);/);
  return m ? parseFloat(m[1]) : 80;
}
const CAPTIONS = loadCaptions();
const TOTAL_SEC = loadTotalSec();

// ─────────── stage 1: voiceover (edge-tts, multi-voice) ───────────
async function stageAudio() {
  if (NO_AUDIO) { log('Audio: skipped (--no-audio)'); return null; }
  if (MERGE_ONLY || FRAMES_ONLY) {
    if (existsSync(FINAL_MP3)) { skip('Audio: existing voiceover.mp3 reused'); return FINAL_MP3; }
    log('No cached voiceover.mp3 — generating audio anyway');
  }

  // Cache key = hash of caption text + voices
  const cacheKey = createHash('md5')
    .update(CAPTIONS.map(c => `${c.voice}|${c.en}|${c.at}`).join('\n'))
    .digest('hex').slice(0, 12);
  const stamp = resolve(AUDIO_DIR, `_key_${cacheKey}`);

  if (!FORCE && !AUDIO_ONLY && existsSync(FINAL_MP3) && existsSync(stamp)) {
    skip(`Audio: cached (key ${cacheKey})`);
    return FINAL_MP3;
  }

  if (existsSync(AUDIO_DIR)) rmSync(AUDIO_DIR, { recursive: true });
  mkdirSync(AUDIO_DIR, { recursive: true });
  log(`Synthesising ${CAPTIONS.length} caption lines with edge-tts…`);

  // Write a single Python script that synthesises all lines (one network call per line, but in one process)
  const captionsJson = resolve(AUDIO_DIR, '_captions.json');
  writeFileSync(captionsJson, JSON.stringify(
    CAPTIONS.map((c, i) => ({ id: i, voice: c.voice, text: c.en }))
  ));
  const synthScript = resolve(AUDIO_DIR, '_synth.py');
  writeFileSync(synthScript, `
import asyncio, json, os, sys
try:
    import edge_tts
except ImportError:
    sys.exit("MISSING_EDGE_TTS")
RATE = "-5%"  # slightly slower for clarity
async def main():
    with open("${captionsJson}") as f:
        caps = json.load(f)
    for c in caps:
        out = os.path.join("${AUDIO_DIR}", f"cap_{c['id']:02d}.mp3")
        comm = edge_tts.Communicate(c["text"], c["voice"], rate=RATE)
        await comm.save(out)
        print(f"  cap_{c['id']:02d}.mp3  voice={c['voice']}")
asyncio.run(main())
`);

  const r = spawnSync(GIIS_PYTHON, [synthScript], { encoding: 'utf8' });
  if (r.stdout?.includes('MISSING_EDGE_TTS') || r.stderr?.includes('MISSING_EDGE_TTS')) {
    die(`edge-tts not installed for ${GIIS_PYTHON}.\n  npm run tools:python:bootstrap`);
  }
  if (r.status !== 0) die(`edge-tts synth failed:\n${r.stderr}`);
  process.stdout.write(r.stdout || '');

  // Pad with silence to align with caption.at; concat to master mp3
  log('Padding + concatenating…');
  const concat = [];
  let cursor = 0;
  for (let i = 0; i < CAPTIONS.length; i++) {
    const c = CAPTIONS[i];
    const mp3 = resolve(AUDIO_DIR, `cap_${String(i).padStart(2, '0')}.mp3`);
    if (!existsSync(mp3)) die(`Missing synthesised file: ${mp3}`);
    const dur = mp3Duration(mp3);
    const gap = c.at - cursor;
    if (gap > 0.05) {
      const sil = resolve(AUDIO_DIR, `sil_${i}.mp3`);
      sh(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t ${gap.toFixed(2)} -b:a 160k "${sil}"`);
      concat.push(sil);
      cursor += gap;
    }
    concat.push(mp3);
    cursor += dur;
  }
  if (cursor < TOTAL_SEC + 0.5) {
    const tail = resolve(AUDIO_DIR, 'sil_tail.mp3');
    sh(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t ${(TOTAL_SEC + 0.5 - cursor).toFixed(2)} -b:a 160k "${tail}"`);
    concat.push(tail);
  }
  const listFile = resolve(AUDIO_DIR, 'concat.txt');
  writeFileSync(listFile, concat.map(f => `file '${f}'`).join('\n'));
  sh(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -b:a 192k "${FINAL_MP3}"`);

  writeFileSync(stamp, new Date().toISOString());
  ok(`Voiceover: ${FINAL_MP3} (${mp3Duration(FINAL_MP3).toFixed(1)}s)`);
  return FINAL_MP3;
}

// ─────────── stage 2: capture frames ───────────
async function stageFrames() {
  if (MERGE_ONLY || AUDIO_ONLY) {
    if (existsSync(FRAMES_DIR) && readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png')).length > 0) {
      skip('Frames: existing frames reused');
      return;
    }
    if (AUDIO_ONLY) return; // audio-only really means audio only
    log('No cached frames — capturing now');
  }

  // Cache key = hash of walkthrough.html + fps
  const htmlHash = fileHash(HTML_PATH);
  const stamp = resolve(FRAMES_DIR, `_key_${htmlHash}_${FPS}fps`);
  if (!FORCE && !FRAMES_ONLY && existsSync(stamp)) {
    skip(`Frames: cached (html ${htmlHash}, ${FPS}fps)`);
    return;
  }

  if (existsSync(FRAMES_DIR)) rmSync(FRAMES_DIR, { recursive: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  log(`Capturing ${TOTAL_SEC * FPS + 1} frames @ ${FPS}fps via headless Chromium…`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(`file://${HTML_PATH}`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  // Hide controls and progress bar so the captured video is clean
  await page.addStyleTag({ content: '.controls, .progress-bar { display: none !important; }' });

  const total = TOTAL_SEC * FPS;
  const t0 = Date.now();
  for (let i = 0; i <= total; i++) {
    const t = i / FPS;
    await page.evaluate((time) => window.GIIS_DEMO.seek(time), t);
    await page.waitForTimeout(15);
    await page.screenshot({ path: resolve(FRAMES_DIR, `f_${String(i).padStart(4, '0')}.png`) });
    if (i % 25 === 0) {
      const el = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(`\r  ${i}/${total} frames (${el}s)  `);
    }
  }
  process.stdout.write('\n');
  await page.close();
  await ctx.close();
  await browser.close();

  writeFileSync(stamp, new Date().toISOString());
  ok(`Frames: ${FRAMES_DIR}`);
}

// ─────────── stage 3: merge → MP4 ───────────
function stageMerge(audioPath) {
  if (AUDIO_ONLY) return; // skip merge entirely
  log('Encoding final MP4 (libx264 + AAC)…');
  const inputs = audioPath
    ? `-framerate ${FPS} -i "${FRAMES_DIR}/f_%04d.png" -i "${audioPath}"`
    : `-framerate ${FPS} -i "${FRAMES_DIR}/f_%04d.png"`;
  const audioMap = audioPath ? `-map 0:v -map 1:a -c:a aac -b:a 192k -shortest` : `-map 0:v`;
  sh(
    `ffmpeg -y -loglevel error ${inputs} ` +
    `-vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 21 ` +
    `${audioMap} -movflags +faststart "${FINAL_MP4}"`
  );
  const sizeMB = (statSync(FINAL_MP4).size / 1e6).toFixed(1);
  const dur = parseFloat(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${FINAL_MP4}"`).trim());
  ok(`MP4: ${FINAL_MP4} (${sizeMB} MB, ${dur.toFixed(1)}s)`);

  // Auto-deploy: copy MP4 + regenerate poster into public/demo/ so the
  // homepage embed picks it up without an extra manual step.
  const publicDemo = resolve(ROOT, 'public/demo');
  if (existsSync(publicDemo)) {
    const publicMp4 = resolve(publicDemo, 'giis-demo.mp4');
    const publicPoster = resolve(publicDemo, 'giis-demo-poster.jpg');
    sh(`ffmpeg -y -loglevel error -i "${FINAL_MP4}" -c copy -movflags +faststart "${publicMp4}"`);
    // Poster: grab the diploma scene at ~58s
    sh(`ffmpeg -y -loglevel error -ss 58 -i "${FINAL_MP4}" -frames:v 1 -q:v 3 "${publicPoster}"`);
    ok(`Deployed to public/demo/ (homepage embed updated)`);
  }
}

// ─────────── orchestrate ───────────
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

console.log(`\n\x1b[1mGIIS demo render\x1b[0m`);
console.log(`  scenes   : ${CAPTIONS.length}`);
console.log(`  duration : ${TOTAL_SEC}s`);
console.log(`  voices   : ${[...new Set(CAPTIONS.map(c => c.voice))].join(', ')}`);
console.log(`  fps      : ${FPS}`);
console.log(`  output   : ${FINAL_MP4}\n`);

const audioPath = await stageAudio();
if (AUDIO_ONLY) {
  console.log(`\nDone (audio only). Listen: open "${FINAL_MP3}"\n`);
  process.exit(0);
}
await stageFrames();
if (FRAMES_ONLY) {
  console.log(`\nDone (frames only). Inspect: open "${FRAMES_DIR}/f_0050.png"\n`);
  process.exit(0);
}
stageMerge(audioPath);

console.log(`\n\x1b[1mNext steps:\x1b[0m`);
console.log(`  Preview:   open "${FINAL_MP4}"`);
console.log(`  Hero embed: cp "${FINAL_MP4}" public/demo/giis-demo.mp4`);
console.log(`              <video src="/demo/giis-demo.mp4" autoplay muted playsinline loop>`);
console.log(`  Edit captions: walkthrough.html → CAPTIONS array, then:`);
console.log(`                 npm run make-demo -- --audio-only && npm run make-demo -- --merge-only\n`);
