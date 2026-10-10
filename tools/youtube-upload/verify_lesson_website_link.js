#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function courseNameFromSummary(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*\(\d+\s+(?:lessons?|课程影片|课程|節課)\)\s*$/i, '')
    .trim();
}

function isExactYouTubeEmbedUrl(value, videoId) {
  try {
    const parsed = new URL(value);
    return parsed.origin === 'https://www.youtube.com'
      && parsed.pathname === `/embed/${videoId}`
      && parsed.username === ''
      && parsed.password === '';
  } catch (_error) {
    return false;
  }
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument near ${key || '<end>'}`);
    }
    values[key.slice(2)] = value;
  }
  for (const key of ['url', 'course', 'module', 'video-id', 'receipt']) {
    if (!values[key]) throw new Error(`Missing --${key}`);
  }
  const moduleNumber = Number(values.module);
  if (!Number.isInteger(moduleNumber) || moduleNumber < 1) throw new Error('Invalid --module');
  const timeout = Number(values.timeout || 90) * 1000;
  if (!Number.isFinite(timeout) || timeout < 1000) throw new Error('Invalid --timeout');
  return {
    url: values.url,
    course: values.course,
    moduleNumber,
    videoId: values['video-id'],
    receipt: path.resolve(values.receipt),
    timeout,
  };
}

async function verify(options) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
    const search = page.locator('input[aria-label="Search lessons"], input[aria-label="搜索课程影片"]');
    await search.waitFor({ state: 'visible', timeout: options.timeout });
    await search.fill(options.course);

    const courseSections = page.locator('details');
    const matchingSections = [];
    for (let index = 0; index < await courseSections.count(); index += 1) {
      const section = courseSections.nth(index);
      const summary = section.locator('summary').first();
      if (await summary.count() && courseNameFromSummary(await summary.innerText()) === options.course) {
        matchingSections.push(section);
      }
    }
    if (matchingSections.length !== 1) {
      throw new Error(`Expected one course section for ${options.course}, found ${matchingSections.length}`);
    }
    const details = matchingSections[0];
    const cards = details.locator('button[type="button"]');
    const cardCount = await cards.count();
    let target = null;
    const englishModule = new RegExp(`\\bmodule\\s+${options.moduleNumber}(?!\\d)`, 'i');
    const chineseModule = new RegExp(`第\\s*${options.moduleNumber}(?!\\d)\\s*模块`);
    for (let index = 0; index < cardCount; index += 1) {
      const card = cards.nth(index);
      const text = (await card.innerText()).replace(/\s+/g, ' ').trim();
      if (englishModule.test(text) || chineseModule.test(text)) {
        if (target) throw new Error(`Multiple lesson cards matched ${options.course} M${options.moduleNumber}`);
        target = card;
      }
    }
    if (!target) throw new Error(`Lesson card not found for ${options.course} M${options.moduleNumber}`);
    await target.click();

    const expectedTitle = `${options.course} Module ${options.moduleNumber}`;
    const frames = page.locator('iframe');
    await frames.first().waitFor({ state: 'attached', timeout: options.timeout });
    let frame = null;
    for (let index = 0; index < await frames.count(); index += 1) {
      const candidate = frames.nth(index);
      if (await candidate.getAttribute('title') === expectedTitle) {
        if (frame) throw new Error(`Multiple lesson iframes matched ${expectedTitle}`);
        frame = candidate;
      }
    }
    if (!frame) throw new Error(`Lesson iframe not found for ${expectedTitle}`);
    await frame.waitFor({ state: 'visible', timeout: options.timeout });
    const iframeSrc = await frame.getAttribute('src');
    const expectedEmbed = `https://www.youtube.com/embed/${options.videoId}`;
    if (!isExactYouTubeEmbedUrl(iframeSrc, options.videoId)) {
      throw new Error(`Lesson iframe points to ${iframeSrc || '<missing>'}, expected ${expectedEmbed}`);
    }
    return {
      schema_version: 'giis.website-lesson-video-readback.v1',
      status: 'PASS',
      verified_at: new Date().toISOString(),
      page_url: page.url(),
      course: options.course,
      module_number: options.moduleNumber,
      video_id: options.videoId,
      iframe_src: iframeSrc,
      course_section_count: 1,
      matching_card_count: 1,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const receipt = await verify(options);
  fs.mkdirSync(path.dirname(options.receipt), { recursive: true });
  fs.writeFileSync(options.receipt, `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`[website-browser-pass] ${receipt.course} M${receipt.module_number} -> ${receipt.video_id}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[HOLD] ${error.message}\n`);
    process.exitCode = 2;
  });
}

module.exports = { courseNameFromSummary, isExactYouTubeEmbedUrl };
