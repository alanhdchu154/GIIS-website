#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'conversion-bilingual-smoke.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'conversion-bilingual-smoke.json');

const ROUTES = [
  {
    name: 'trust center zh proof path',
    path: '/trust-center',
    expected: [
      '付款前先验证',
      '一所认真的学校，应该经得起家长检查。',
      'Florida 注册私立学校',
      'CEEB 状态：已申请，待审核',
      '查看学校简介',
    ],
  },
  {
    name: 'pricing zh payment boundary',
    path: '/pricing',
    expected: [
      '家长付款前可验证',
      '付款前完成转学分初审',
      '所有方案先经过申请审核；确认入学路径后再付款。',
      '阅读 30 天退款政策。',
    ],
  },
  {
    name: 'apply zh no-payment review',
    path: '/apply',
    expected: [
      '付款前，先看清楚适合哪条路径。',
      'GIIS 会先确认学生属于一般新生还是转学生',
      '此处不会收款。',
      '申请入学路径评估',
    ],
  },
  {
    name: 'school profile zh reading layer',
    path: '/school-profile',
    expected: [
      '家长核验文件',
      'School Profile 学校简介',
      'GIIS 是 Florida 注册私立学校',
      '认证与 CEEB 状态会在文件中以保守方式说明',
      '中文说明只协助家长阅读，不取代英文正式文件。',
      'Florida Registered Private School',
      'Applied and pending',
    ],
  },
  {
    name: 'refund policy zh before payment',
    path: '/refund-policy',
    expected: [
      '付款前可阅读',
      '完成路径审核后付款，享有 30 天退款政策。',
      '退款政策不承诺转学分一定通过、大学录取、认证完成、AP 授权或外部机构接受。',
      '人工审核付款模式',
    ],
  },
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function pageText(page) {
  return page.locator('body').innerText({ timeout: 8000 });
}

async function runRoute(page, baseUrl, route) {
  await page.goto(new URL(route.path, baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.locator('body').waitFor({ state: 'visible', timeout: 8000 });
  const text = await pageText(page);
  const missing = route.expected.filter((needle) => !text.includes(needle));
  return {
    name: route.name,
    path: route.path,
    status: missing.length ? 'fail' : 'pass',
    missing,
  };
}

async function main() {
  const baseUrl = argValue('--base-url', process.env.GIIS_BASE_URL || 'http://localhost:3000');
  const reportPath = argValue('--report', DEFAULT_REPORT);
  const jsonReportPath = argValue('--json-report', DEFAULT_JSON_REPORT);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    window.localStorage.setItem('giis-language', 'zh');
  });

  const results = [];
  try {
    for (const route of ROUTES) {
      results.push(await runRoute(page, baseUrl, route));
    }
  } finally {
    await browser.close();
  }

  const passed = results.filter((result) => result.status === 'pass').length;
  const failed = results.length - passed;
  const verdict = failed ? 'fail' : 'pass';

  const lines = [
    '# Conversion Bilingual Smoke',
    '',
    `Base URL: ${baseUrl}`,
    `Verdict: ${verdict}`,
    `Summary: ${passed} pass / ${failed} fail`,
    '',
    '## Routes',
    '',
    ...results.flatMap((result) => [
      `- ${result.status.toUpperCase()} ${result.name} (${result.path})`,
      ...(result.missing.length ? result.missing.map((item) => `  - missing: ${item}`) : []),
    ]),
    '',
  ];

  ensureDir(reportPath);
  fs.writeFileSync(reportPath, lines.join('\n'));
  ensureDir(jsonReportPath);
  fs.writeFileSync(jsonReportPath, JSON.stringify({ baseUrl, verdict, results }, null, 2));

  console.log(`Conversion bilingual smoke: ${passed} pass / ${failed} fail`);
  console.log(`Report: ${reportPath}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
