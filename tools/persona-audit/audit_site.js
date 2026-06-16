#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright');
const {
  DEFAULT_PARENT_PASSWORD,
  parentLoginEmailForStudentEmail,
} = require('../../server/src/lib/parentCredentials');

const SITE_URL = trimSlash(process.env.SITE_URL || 'https://genesisideas.school');
const API_URL = trimSlash(process.env.API_URL || 'https://api.genesisideas.school');
const STUDENT_EMAIL = process.env.STUDENT_EMAIL || 'hanxi.xiao@genesisideas.school';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || 'Student2024!!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@genesisideas.school';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const PARENT_EMAIL = process.env.PARENT_EMAIL || parentLoginEmailForStudentEmail(STUDENT_EMAIL) || '';
const PARENT_PASSWORD = process.env.PARENT_PASSWORD || DEFAULT_PARENT_PASSWORD;
const RUN_AUTH = process.env.RUN_AUTH !== '0';
const HEADLESS = process.env.HEADLESS !== '0';
const TIMEOUT = Number(process.env.AUDIT_TIMEOUT_MS || 15000);
const OUT_DIR = process.env.AUDIT_SCREENSHOT_DIR || path.join('/private/tmp', `giis-persona-audit-${Date.now()}`);

const blockers = [];
const warnings = [];
const passes = [];
const BROKEN_STATE_RE = /Signing in…|Signing in\.\.\.|API address is not configured|Something went wrong|Failed to load data|加载失败/i;

function trimSlash(value) {
  return String(value).replace(/\/+$/, '');
}

function markPass(label) {
  passes.push(label);
  console.log(`PASS ${label}`);
}

function markWarn(label, detail) {
  warnings.push({ label, detail });
  console.warn(`WARN ${label}${detail ? ` - ${detail}` : ''}`);
}

function markBlocker(label, detail) {
  blockers.push({ label, detail });
  console.error(`FAIL ${label}${detail ? ` - ${detail}` : ''}`);
}

async function expectText(page, patterns, label) {
  await page.waitForFunction(
    ({ patternDefs }) => {
      const body = document.body?.innerText || '';
      const hasExpected = patternDefs.some((def) => {
        if (def.kind === 'regex') return new RegExp(def.source, def.flags).test(body);
        return body.includes(def.value);
      });
      const hasBrokenState = /Signing in…|Signing in\.\.\.|API address is not configured|Something went wrong/i.test(body);
      return hasExpected && !hasBrokenState;
    },
    {
      patternDefs: patterns.map((pattern) => (
        pattern instanceof RegExp
          ? { kind: 'regex', source: pattern.source, flags: pattern.flags }
          : { kind: 'text', value: pattern }
      )),
    },
    { timeout: TIMEOUT },
  ).catch(() => {
    throw new Error(`${label} missing expected text. Looked for: ${patterns.map(String).join(', ')}`);
  });
  const body = await page.locator('body').innerText({ timeout: TIMEOUT });
  const found = patterns.some((pattern) => (
    pattern instanceof RegExp ? pattern.test(body) : body.includes(pattern)
  ));
  if (!found) {
    throw new Error(`${label} missing expected text. Looked for: ${patterns.map(String).join(', ')}`);
  }
  if (BROKEN_STATE_RE.test(body)) {
    throw new Error(`${label} contains a known broken-state message.`);
  }
  return body;
}

async function visit(page, route, patterns, label) {
  await page.goto(`${SITE_URL}${route}`, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await expectText(page, patterns, label);
  markPass(label);
}

async function fillIfVisible(page, selector, value) {
  const field = page.locator(selector).first();
  await field.waitFor({ state: 'visible', timeout: TIMEOUT });
  await field.fill(value);
}

async function clickSubmit(page) {
  const submit = page.locator('button[type="submit"]').first();
  await submit.waitFor({ state: 'visible', timeout: TIMEOUT });
  await submit.click();
}

async function waitForPath(page, pattern, label) {
  await page.waitForFunction(
    ({ source, flags }) => new RegExp(source, flags).test(window.location.pathname),
    { source: pattern.source, flags: pattern.flags },
    { timeout: TIMEOUT },
  ).catch((err) => {
    throw new Error(`${label} did not reach expected route. Current URL: ${page.url()}. ${err.message}`);
  });
}

async function screenshot(page, name) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
}

async function checkApiHealth(request) {
  const res = await request.get(`${API_URL}/api/checkout/tiers`, { timeout: TIMEOUT });
  if (!res.ok()) throw new Error(`API tiers returned ${res.status()}`);
  const json = await res.json();
  assertTierEvidence(json, 'API tiers JSON');
  markPass('API health and multi-tier pricing contract');
}

function assertTierEvidence(json, label) {
  const text = JSON.stringify(json);
  if (!text.includes('self_paced_monthly') || !text.includes('guided_monthly') || !text.includes('premium_monthly')) {
    throw new Error(`${label} did not include current multi-tier pricing evidence.`);
  }
}

async function checkProductionBundleApiBase(request) {
  if (!/https:\/\/(www\.)?genesisideas\.school$/.test(SITE_URL)) {
    markWarn('Production bundle API-base check skipped', `SITE_URL=${SITE_URL}`);
    return;
  }
  const manifestRes = await request.get(`${SITE_URL}/asset-manifest.json`, { timeout: TIMEOUT });
  if (!manifestRes.ok()) throw new Error(`asset-manifest.json returned ${manifestRes.status()}`);
  const manifest = await manifestRes.json();
  const jsFiles = Object.values(manifest.files || {})
    .filter((file) => typeof file === 'string' && file.endsWith('.js'))
    .map((file) => new URL(file, SITE_URL).toString());
  if (!jsFiles.length) throw new Error('asset-manifest.json did not list JS bundles.');

  const directApiHits = [];
  const sameOriginHits = [];
  const relativeApiHits = [];
  for (const jsUrl of jsFiles) {
    const scriptRes = await request.get(jsUrl, { timeout: TIMEOUT });
    if (!scriptRes.ok()) continue;
    const bundle = await scriptRes.text();
    const basename = path.basename(jsUrl);
    if (bundle.includes('api.genesisideas.school')) directApiHits.push(basename);
    if (bundle.includes('https://genesisideas.school')) sameOriginHits.push(basename);
    if (bundle.includes('/api/')) relativeApiHits.push(basename);
  }
  const usesDirectApiHost = directApiHits.length > 0;
  const usesSameOriginProxy = sameOriginHits.length > 0 && relativeApiHits.length > 0;
  if (!usesDirectApiHost && !usesSameOriginProxy) {
    throw new Error(
      `No production JS asset contains a recognized API base. Checked ${jsFiles.length} JS files; expected direct api.genesisideas.school or same-origin /api proxy evidence.`,
    );
  }

  if (usesSameOriginProxy) {
    const proxyRes = await request.get(`${SITE_URL}/api/checkout/tiers`, { timeout: TIMEOUT });
    if (!proxyRes.ok()) throw new Error(`Same-origin /api/checkout/tiers returned ${proxyRes.status()}`);
    assertTierEvidence(await proxyRes.json(), 'Same-origin API proxy tiers JSON');
  }

  const evidence = usesDirectApiHost
    ? `direct API host: ${directApiHits.slice(0, 3).join(', ')}`
    : `same-origin /api proxy: ${sameOriginHits.slice(0, 3).join(', ')}`;
  markPass(`Production frontend API-base bundle check (${evidence})`);
}

async function auditPublicFunnel(page) {
  await visit(page, '/', [/Florida-registered|Florida/i, /Parent|家长/i], 'New student route: homepage trust');
  await visit(page, '/pricing', [/\$49|49\/mo|Self-Paced/i, /\$149|Guided/i, /\$299|Premium/i], 'New student route: pricing');
  await visit(page, '/admission', [/Apply|Admission|申请/i, /Parent|家长/i], 'New student route: admission');
  await visit(page, '/apply', [/Parent|Guardian|家长/i, /Student|学生/i], 'New student route: application form');
  await visit(page, '/pathways', [/Pathway|Credit|路径|学分/i], 'New student route: pathways');
  await visit(page, '/school-profile', [/Florida|1002\.42|Profile/i], 'New student route: school profile');
  await visit(page, '/parent/demo', [/Parent Portal|Parent Dashboard|家长/i, /GPA|Credits|Progress/i], 'Parent route: public dashboard demo');
}

async function auditStudent(page) {
  if (!RUN_AUTH) {
    markWarn('Student login skipped', 'RUN_AUTH=0');
    return;
  }
  await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await fillIfVisible(page, '#portal-email', STUDENT_EMAIL);
  await fillIfVisible(page, '#portal-password', STUDENT_PASSWORD);
  await clickSubmit(page);
  await waitForPath(page, /^\/learn\/?$/, 'Student login');
  await expectText(page, [/My Courses|我的课程|Credits|Progress|Continue/i], 'Student Learn Portal');
  await screenshot(page, 'student-learn');
  markPass('Student route: login to Learn Portal');
}

async function auditAdmin(page) {
  if (!RUN_AUTH) {
    markWarn('Admin login skipped', 'RUN_AUTH=0');
    return;
  }
  await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await fillIfVisible(page, '#portal-email', ADMIN_EMAIL);
  await fillIfVisible(page, '#portal-password', ADMIN_PASSWORD);
  await clickSubmit(page);
  await waitForPath(page, /^\/admin\/?$/, 'Admin login');
  await expectText(page, [/School Operations|学校营运后台|Student Roster|Students/i], 'Admin dashboard');
  await screenshot(page, 'admin-dashboard');
  await page.goto(`${SITE_URL}/admin/progress`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  await expectText(page, [/Student Progress|Progress|Official Credits|Portal Credits/i], 'Admin progress page');
  await screenshot(page, 'admin-progress');
  markPass('Principal assistant route: admin dashboard and progress');
}

async function auditParent(page) {
  if (!PARENT_EMAIL || !PARENT_PASSWORD) {
    markWarn('Real parent login skipped', 'Set PARENT_EMAIL and PARENT_PASSWORD to exercise /parent/login.');
    return;
  }
  await page.goto(`${SITE_URL}/parent/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await fillIfVisible(page, 'input[type="email"]', PARENT_EMAIL);
  await fillIfVisible(page, 'input[type="password"]', PARENT_PASSWORD);
  await clickSubmit(page);
  await waitForPath(page, /^\/parent\/dashboard\/?$/, 'Parent login');
  const body = await expectText(page, [/Parent Portal|家长面板/i, /Credits Earned|已获学分/i, /GPA|Transcript|成绩单/i], 'Parent dashboard');
  if (/^(Loading…|Loading\.\.\.|加载中…?)$/i.test(body.trim())) {
    throw new Error('Parent dashboard is still on the loading shell after data assertion.');
  }
  await page.waitForTimeout(1000);
  const stableBody = await page.locator('body').innerText({ timeout: TIMEOUT });
  if (!/Credits Earned|已获学分/i.test(stableBody) || /^(Loading…|Loading\.\.\.|加载中…?)$/i.test(stableBody.trim())) {
    throw new Error('Parent dashboard did not remain stable before screenshot.');
  }
  await screenshot(page, 'parent-dashboard');
  markPass('Parent route: real login to dashboard');
}

async function runStep(label, fn) {
  try {
    await fn();
  } catch (err) {
    markBlocker(label, err.message);
  }
}

async function main() {
  console.log(`GIIS persona audit`);
  console.log(`SITE_URL=${SITE_URL}`);
  console.log(`API_URL=${API_URL}`);
  console.log(`Screenshots=${OUT_DIR}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  await runStep('API health', () => checkApiHealth(context.request));
  await runStep('Production frontend API-base', () => checkProductionBundleApiBase(context.request));
  await runStep('Public/new student funnel', () => auditPublicFunnel(page));
  await runStep('Student persona route', async () => {
    const isolated = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    try {
      await auditStudent(await isolated.newPage());
    } finally {
      await isolated.close();
    }
  });
  await runStep('Principal assistant persona route', async () => {
    const isolated = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    try {
      await auditAdmin(await isolated.newPage());
    } finally {
      await isolated.close();
    }
  });
  await runStep('Parent persona route', async () => {
    const isolated = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    try {
      await auditParent(await isolated.newPage());
    } finally {
      await isolated.close();
    }
  });

  await context.close();
  await browser.close();

  const report = {
    siteUrl: SITE_URL,
    apiUrl: API_URL,
    generatedAt: new Date().toISOString(),
    passes,
    warnings,
    blockers,
    screenshotDir: OUT_DIR,
  };
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

  console.log('');
  console.log(`Summary: ${passes.length} pass, ${warnings.length} warn, ${blockers.length} fail`);
  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach((w) => console.log(`- ${w.label}${w.detail ? `: ${w.detail}` : ''}`));
  }
  if (blockers.length) {
    console.log('Blockers:');
    blockers.forEach((b) => console.log(`- ${b.label}: ${b.detail}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
