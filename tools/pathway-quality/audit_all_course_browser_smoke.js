#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSES_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'all-course-browser-smoke.md');

function walkJson(dir) {
  const rows = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) rows.push(...walkJson(full));
    else if (name.endsWith('.json')) rows.push(full);
  }
  return rows;
}

function loadCourses() {
  return walkJson(COURSES_DIR)
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
    .filter((course) => course.isPublished)
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

function enrollmentFor(course) {
  return {
    id: `mock-${course.slug}`,
    courseId: course.slug,
    studentId: 'browser-smoke-student',
    quizAttempts: [],
    assignments: [],
    moduleProgresses: [],
    examAttempts: [],
    creditEarned: false,
  };
}

function markdownReport(report) {
  const lines = [];
  lines.push('# All-Course Browser Smoke QA');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Base URL: ${report.baseUrl}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.fail} fail (${report.summary.total} route checks)`);
  lines.push('');
  lines.push('| Course | Route | Viewport | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const row of report.checks) {
    lines.push(`| ${row.slug} | ${row.path} | ${row.viewport} | ${row.status} |`);
  }
  const issues = report.checks.flatMap((row) => row.issues.map((message) => ({ ...row, message })));
  if (issues.length) {
    lines.push('');
    lines.push('## Issues');
    for (const issue of issues) {
      lines.push(`- ${issue.slug} ${issue.viewport} ${issue.path}: ${issue.message}`);
    }
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

async function installApiMocks(page, coursesBySlug) {
  await page.route('**/api/courses', async (route) => {
    const courses = [...coursesBySlug.values()].map((course) => ({
      id: course.slug,
      slug: course.slug,
      name: course.name,
      nameZh: course.nameZh,
      credits: course.credits,
      department: course.department,
      type: course.type,
      gradeLevel: course.gradeLevel,
      description: course.description,
      _count: { modules: course.modules?.length || 0 },
    }));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(courses) });
  });

  await page.route('**/api/courses/*', async (route) => {
    const url = new URL(route.request().url());
    const slug = decodeURIComponent(url.pathname.split('/').pop());
    const course = coursesBySlug.get(slug);
    if (!course) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Course not found' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(course) });
  });

  await page.route('**/api/enrollments/*', async (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split('/').filter(Boolean);
    const slug = parts[2];
    const course = coursesBySlug.get(slug);
    if (!course) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Enrollment not found' }) });
      return;
    }
    if (parts[3] === 'quiz') {
      const moduleOrder = Number(parts[4]);
      const questions = (course.quizQuestions || [])
        .filter((question) => Number(question.moduleOrder) === moduleOrder)
        .map((question, index) => ({ id: `${course.slug}-q-${moduleOrder}-${index}`, ...question }));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ questions }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ course, enrollment: enrollmentFor(course) }),
    });
  });
}

async function checkRoute(page, baseUrl, course, targetPath, viewportName) {
  const issues = [];
  const errors = [];
  const onPageError = (error) => errors.push(error.message);
  const onConsole = (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  try {
    await page.goto(`${baseUrl}${targetPath}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const titleText = await page.locator('h1').first().textContent({ timeout: 8000 }).catch(() => '');
    const bodyText = await page.locator('body').textContent({ timeout: 12000 }).catch(() => '');
    const metrics = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyLength: document.body?.innerText?.trim().length || 0,
    }));

    if (!bodyText || metrics.bodyLength < 120) issues.push('page body rendered too little text');
    if (/Failed to load|Course not found|Loading…|加载中/.test(bodyText)) issues.push('page still shows loading or error text');
    if (targetPath.endsWith('/syllabus')) {
      if (!titleText.includes(course.name)) issues.push(`syllabus h1 does not include course name "${course.name}"`);
      if (!bodyText.includes('Learning Objectives')) issues.push('syllabus missing learning objectives text');
      if (!bodyText.includes('Expert Lens')) issues.push('syllabus missing expert lens text');
    } else if (targetPath.includes('/module/')) {
      const moduleOrder = Number(targetPath.match(/\/module\/(\d+)/)?.[1]);
      const expectedModule = (course.modules || []).find((mod) => Number(mod.order) === moduleOrder);
      if (expectedModule && !titleText.includes(expectedModule.title)) {
        issues.push(`module h1 does not include module ${moduleOrder} title "${expectedModule.title}"`);
      }
      if (!bodyText.includes('Learning Objectives')) issues.push('module page missing learning objectives');
      if (!bodyText.includes('Expert Lens')) issues.push('module page missing expert lens');
      if (!bodyText.includes('Assignment')) issues.push('module page missing assignment section');
    } else {
      if (!titleText.includes(course.name)) issues.push(`course h1 does not include course name "${course.name}"`);
      if (!bodyText.includes('Syllabus')) issues.push('course page missing syllabus link/text');
    }
    if (metrics.scrollWidth > metrics.width + 2) issues.push(`horizontal overflow: scrollWidth ${metrics.scrollWidth}, viewport ${metrics.width}`);
    const materialErrors = errors.filter((message) => !/favicon|ResizeObserver|Failed to load resource.*favicon/i.test(message));
    if (materialErrors.length) issues.push(`console/page errors: ${materialErrors.slice(0, 3).join(' | ')}`);
  } catch (error) {
    issues.push(error.message);
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }

  return {
    slug: course.slug,
    path: targetPath,
    viewport: viewportName,
    status: issues.length ? 'fail' : 'pass',
    issues,
  };
}

async function main() {
  const baseUrl = process.argv.includes('--base-url')
    ? process.argv[process.argv.indexOf('--base-url') + 1]
    : 'http://localhost:3000';
  const reportIndex = process.argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? path.resolve(ROOT, process.argv[reportIndex + 1]) : DEFAULT_REPORT;
  const jsonIndex = process.argv.indexOf('--json-report');
  const jsonPath = jsonIndex >= 0 ? path.resolve(ROOT, process.argv[jsonIndex + 1]) : null;
  const allModules = process.argv.includes('--all-modules');

  const courses = loadCourses();
  const coursesBySlug = new Map(courses.map((course) => [course.slug, course]));
  const viewports = [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];
  const browser = await chromium.launch({ headless: true });
  const checks = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      await context.addInitScript(() => {
        localStorage.setItem('giis_student_info', JSON.stringify({
          id: 'browser-smoke-student',
          email: 'browser-smoke@example.com',
          name: 'Browser Smoke Student',
        }));
      });
      const page = await context.newPage();
      await installApiMocks(page, coursesBySlug);
      let completed = 0;
      const totalForViewport = courses.reduce((sum, course) => {
        const moduleCount = allModules ? (course.modules?.length || 0) : 1;
        return sum + 2 + moduleCount;
      }, 0);
      for (const course of courses) {
        const paths = [
          `/learn/${course.slug}`,
          `/learn/${course.slug}/syllabus`,
          ...(allModules
            ? (course.modules || []).map((mod) => `/learn/${course.slug}/module/${mod.order}`)
            : [`/learn/${course.slug}/module/1`]),
        ];
        for (const targetPath of paths) {
          checks.push(await checkRoute(page, baseUrl, course, targetPath, viewport.name));
          completed += 1;
          if (completed % 50 === 0 || completed === totalForViewport) {
            console.error(`browser smoke ${viewport.name}: ${completed}/${totalForViewport}`);
          }
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const summary = checks.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status] += 1;
    return acc;
  }, { total: 0, pass: 0, fail: 0 });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    summary,
    checks,
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdownReport(report));
  if (jsonPath) {
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(`All-course browser smoke QA: ${summary.pass} pass / ${summary.fail} fail (${summary.total} route checks)`);
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
  for (const row of checks.filter((item) => item.status === 'fail')) {
    console.log(`\n[FAIL] ${row.slug} ${row.viewport} ${row.path}`);
    for (const message of row.issues) console.log(`  - ${message}`);
  }
  process.exit(summary.fail ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
