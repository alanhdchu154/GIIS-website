#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-admin-browser-smoke.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-admin-browser-smoke.json');

const ROUTES = [
  {
    name: 'consultation',
    path: '/consultation',
    expected: [
      'Talk to the school before you decide.',
      'Shiyu Zhang, Ph.D.',
      'What a consultation covers',
      'Book a free consultation',
      'Request consultation',
    ],
  },
  {
    name: 'consultation submit',
    path: '/consultation',
    expected: [
      'Consultation request received',
      'Admissions will reach out within one business day',
      'Trust Center',
      'Preview Parent Dashboard',
    ],
    afterLoad: async (page) => {
      await page.route('**/', async (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
        }
        return route.fallback();
      });
      const app = page.locator('#root');
      await app.locator('input[name="parentName"]').fill('Jordan Rivera');
      await app.locator('input[name="email"]').fill('jordan@example.com');
      await app.locator('input[name="parentWeChat"]').fill('giis-parent');
      await app.locator('select[name="studentGrade"]').selectOption('10');
      await app.locator('select[name="studentSituation"]').selectOption('transfer');
      await app.locator('select[name="transcriptAvailable"]').selectOption('partial');
      await app.locator('select[name="desiredStart"]').selectOption('this-month');
      await app.locator('select[name="preferredTime"]').selectOption('weekday-evening');
      await app.locator('textarea[name="message"]').fill('We need a transfer-credit review before deciding.');
      await page.getByRole('button', { name: /Request consultation/ }).click();
      await page.getByText('Consultation request received').waitFor({ state: 'visible', timeout: 5000 });
    },
  },
  {
    name: 'homepage contact submit',
    path: '/',
    expected: [
      "We'll be in touch!",
      'Thank you for your inquiry',
    ],
    afterLoad: async (page) => {
      await page.route('**/', async (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
        }
        return route.fallback();
      });
      const app = page.locator('#root');
      await app.locator('input[name="studentName"]').fill('Alex Rivera');
      await app.locator('select[name="grade"]').selectOption('10');
      await app.locator('select[name="pathway"]').selectOption('CS & Engineering');
      await app.locator('input[name="parentWeChat"]').fill('giis-parent');
      await app.locator('input[name="email"]').fill('jordan@example.com');
      await app.locator('textarea[name="message"]').fill('We want to understand tuition and transfer timing.');
      await page.getByRole('button', { name: /Submit Inquiry/ }).click();
      await page.getByText("We'll be in touch!").waitFor({ state: 'visible', timeout: 5000 });
    },
  },
  {
    name: 'graduate stories',
    path: '/graduates',
    expected: [
      'Four students. Four years. Four transcripts you can trace.',
      'Y. Yang',
      'Reported offers',
      'UC Santa Barbara',
      'GIIS does not guarantee admission results',
    ],
  },
  {
    name: 'apply',
    path: '/apply',
    expected: [
      'Know the right path before you pay.',
      'Before You Submit',
      'After You Submit',
      'New student',
      'Transfer student',
      'No payment is collected here',
    ],
  },
  {
    name: 'apply submit',
    path: '/apply',
    expected: [
      'Transfer Path Review received',
      'Admissions will review',
      'jordan@example.com',
      'Open Trust Center',
    ],
    endpointCaps: { '/api/applications': 1 },
    afterLoad: async (page) => {
      await page.getByLabel('Student Full Name').fill('Alex Rivera');
      await page.getByLabel('Date of Birth').fill('2010-09-01');
      await page.getByLabel('Grade Level').selectOption('Grade 10');
      await page.getByLabel('Current or Most Recent School').fill('Current Online School');
      await page.getByLabel('Target Universities').fill('UC Davis');
      await page.locator('input[name="applicantType"][value="transfer"]').check();
      await page.getByLabel('Previous credits estimate').selectOption('12-17');
      await page.getByLabel('Transcript available?').selectOption('partial');
      await page.getByLabel('Desired graduation timing').selectOption('1-year');
      await page.getByLabel('Main family concern').selectOption('credits');
      await page.getByLabel('Parent Full Name').fill('Jordan Rivera');
      await page.getByLabel('Parent Email').fill('jordan@example.com');
      await page.getByLabel('Phone').fill('555-0100');
      await page.getByLabel('Anything else we should know?').fill('Interested in transfer-credit review.');
      await page.getByRole('button', { name: /Request Application Review/ }).click();
      await page.getByText('Transfer Path Review received').waitFor({ state: 'visible', timeout: 5000 });
    },
  },
  {
    name: 'parent dashboard',
    path: '/parent/dashboard',
    expected: ["Alex's progress", 'Weekly Insights', 'Start Here', 'Assessment Evidence', 'Recent Activity'],
    endpointCaps: { '/api/parent/me': 2 },
  },
  {
    name: 'admin dashboard',
    path: '/admin',
    expected: ['School Operations', 'Student Roster', 'Monthly recurring', 'Alex Rivera'],
    endpointCaps: { '/api/students/ops-summary': 2 },
  },
  {
    name: 'admin applications',
    path: '/admin/applications',
    expected: [
      'Applications',
      'Alex Rivera',
      'Application Path Review',
      'Within 1 school year',
      'Admin Record Review Required',
      'Record Manual Payment',
      'Record payment before account activation',
      'Copy family payment receipt',
      'GIIS payment receipt',
      'Refund policy: https://genesisideas.school/refund-policy',
    ],
    endpointCaps: { '/api/applications': 2 },
    afterLoad: async (page) => {
      await page.getByRole('button', { name: /^View$/ }).first().click();
      await page.getByText('Application Path Review').waitFor({ state: 'visible', timeout: 5000 });
      await page.getByRole('button', { name: /^Record Manual Payment$/ }).click();
      await page.locator('input[placeholder="Invoice, payment link, receipt, or Dashboard reference"]').fill('in_manual_smoke_123');
      page.once('dialog', async (dialog) => dialog.accept());
      await page.getByRole('button', { name: /^Confirm Payment Recorded$/ }).click();
      await page.getByText('Copy family payment receipt').waitFor({ state: 'visible', timeout: 5000 });
    },
  },
  {
    name: 'admin assignments',
    path: '/admin/assignments',
    expected: ['Assignment Queue', 'Alex Rivera', 'GIIS review rubric'],
    endpointCaps: { '/api/admin/assignments': 2 },
    afterLoad: async (page) => {
      await page.getByRole('button', { name: /^(Grade|View \/ Edit)$/ }).first().click();
      await page.getByText('GIIS review rubric').waitFor({ state: 'visible', timeout: 5000 });
    },
  },
  {
    name: 'admin weekly report',
    path: '/admin/weekly-report',
    expected: ['Weekly Parent Report', 'Review each draft', 'Alex Rivera', 'Quiet week', 'Advisor note'],
    endpointCaps: { '/api/admin/weekly-report': 2 },
    afterLoad: async (page) => {
      await page.getByText('Alex Rivera').waitFor({ state: 'visible', timeout: 5000 });
      await page.getByText('Quiet week').waitFor({ state: 'visible', timeout: 5000 });
    },
  },
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

function parentPayload() {
  return {
    student: {
      id: 'student-ops-1',
      name: 'Alex Rivera',
      studentCode: 'GIIS-OPS-001',
      gradeLevel: 'Grade 10',
    },
    stats: { creditsEarned: 5.5, gpa: '3.80' },
    subscription: { status: 'active', planType: 'guided' },
    weeklyInsights: {
      activeDays: 4,
      estimatedStudyHours: 6.5,
      modulesCompleted: 0,
      videoActivities: 1,
      quizAttempts: 0,
      assignmentSubmissions: 0,
    },
    advisor: { name: 'GIIS Advisor', nextCheckInDueAt: '2026-06-09T15:00:00.000Z' },
    advisorNotes: [{
      id: 'note-1',
      type: 'weekly_checkin',
      at: '2026-06-03T15:00:00.000Z',
      title: 'Weekly progress check',
      summary: 'Alex is on pace and should submit the next English assignment this week.',
    }],
    enrollments: [
      {
        id: 'enr-1',
        name: 'English I',
        nameZh: '英语一',
        department: 'English',
        completedModules: 0,
        totalModules: 14,
        creditEarned: false,
        pacing: { status: 'on_track', label: 'On Track', deltaModules: 0 },
        assessment: {
          quizzesSubmitted: 0,
          assignmentsSubmitted: 0,
          assignmentsReviewed: 0,
          midterm: null,
          final: null,
        },
        weeklyInsights: {
          activeDays: 1,
          modulesCompleted: 0,
          estimatedStudyHours: 0,
          videoActivities: 1,
          quizAttempts: 0,
          assignmentSubmissions: 0,
        },
        assignments: [{
          moduleOrder: 1,
          moduleTitle: 'Reading Comprehension Strategies',
          submittedAt: '2026-06-01T15:00:00.000Z',
          gradedAt: '2026-06-02T15:00:00.000Z',
          status: 'reviewed',
          score: 92,
          feedback: 'Strong evidence and clear reflection.',
          contentPreview: 'I identified the claim and supporting detail.',
        }],
      },
    ],
    recentActivity: [
      { type: 'video', course: 'English I', moduleOrder: 1, at: '2026-06-03T15:00:00.000Z' },
    ],
  };
}

function opsSummaryPayload() {
  return {
    students: [{
      id: 'student-ops-1',
      name: 'Alex Rivera',
      studentCode: 'GIIS-OPS-001',
      parentGuardian: 'Jordan Rivera',
      currentGrade: 10,
      creditsEarned: 5.5,
      graduationCreditThreshold: 24,
      meetsGraduationCredits: false,
      gpa: '3.80',
      subscriptionState: 'active',
      subscriptionPlan: 'Guided',
      loginEmail: 'alex@example.com',
      daysInactive: 1,
      ungradedCount: 1,
      paymentIssue: false,
      followUpDue: false,
      riskLevel: null,
    }],
    actionCounts: {
      paymentIssues: 0,
      assignmentsToGrade: 1,
      applicationsPending: 1,
      inactive: 0,
      careFollowUpsDue: 0,
      noLogin: 0,
      graduationReady: 0,
    },
    revenue: { mrrCents: 14900, activeCount: 1, atRiskCount: 0 },
  };
}

function applicationsPayload() {
  return [{
    id: 'app-1',
    studentName: 'Alex Rivera',
    dob: '2010-09-01',
    gradeLevel: 'Grade 10',
    currentSchool: 'Current Online School',
    targetUniversities: 'UC Davis',
    preferredLanguage: 'en',
    parentName: 'Jordan Rivera',
    parentEmail: 'jordan@example.com',
    phone: '555-0100',
    notes: 'Transfer Path Review: credits=12-17; graduationTiming=1-year; transcriptAvailable=partial; concern=credits; Family Notes: Interested in transfer-credit review.',
    adminNotes: 'Needs transcript follow-up.',
    status: 'approved',
    accountsCreated: false,
    createdAt: '2026-06-01T15:00:00.000Z',
    enrollmentState: {
      code: 'approved_unactivated',
      label: 'Approved, accounts not created',
      action: 'Record payment, then create accounts',
      studentEmail: 'alex@example.com',
      parentLoginEmail: 'alex_parent@example.com',
      subscriptionStatus: null,
    },
  }];
}

function isIgnoredConsoleError(message) {
  return /favicon|ResizeObserver/i.test(message) ||
    /Permissions policy violation: compute-pressure is not allowed/i.test(message);
}

function assignmentsPayload() {
  return [{
    id: 'assignment-1',
    student: { id: 'student-ops-1', name: 'Alex Rivera', studentCode: 'GIIS-OPS-001' },
    course: { id: 'english-i', name: 'English I' },
    moduleOrder: 1,
    moduleTitle: 'Reading Comprehension Strategies',
    assignmentPrompt: 'Use one paragraph to explain how context clues changed your interpretation.',
    assignmentProfile: {
      label: 'Written Evidence',
      evidence: 'Short response',
      rubricFocus: 'Look for a claim, evidence, and reflection.',
    },
    content: 'Context clues helped me revise my interpretation of the passage.',
    submittedAt: '2026-06-03T15:00:00.000Z',
    gradedAt: null,
    feedback: '',
    score: null,
  }];
}

function weeklyReportPayload() {
  return {
    week: '2026-06-08',
    sent: 0,
    skipped: 1,
    errors: 0,
    details: {
      sent: [],
      skipped: [{
        email: 'jordan@example.com',
        studentId: 'student-ops-1',
        reason: 'dry_run',
        dedupeKey: 'weekly_report:student-ops-1:2026-06-08',
        payload: {
          parentEmail: 'jordan@example.com',
          studentName: 'Alex Rivera',
          creditsEarned: 5.5,
          gpa: '3.80',
          gradPercent: 23,
          weeklyActivity: {
            modulesCompleted: 0,
            estimatedStudyHours: 0,
            activeDays: 0,
          },
          advisorNote: {
            title: 'Weekly progress check',
            summary: 'Alex should restart English I Module 2 this week and submit the reading response by Friday.',
            date: '2026-06-03T15:00:00.000Z',
          },
        },
      }],
      errors: [],
    },
  };
}

async function installMocks(page, endpointCounts) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname;
    endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);

    if (endpoint === '/api/parent/me') return route.fulfill(json(parentPayload()));
    if (endpoint === '/api/students/ops-summary') return route.fulfill(json(opsSummaryPayload()));
    if (endpoint === '/api/applications/app-1/manual-payment') {
      return route.fulfill(json({
        ok: true,
        subscription: {
          id: 'sub_manual_smoke_1',
          purchaserEmail: 'jordan@example.com',
          planType: 'guided_monthly',
          status: 'active',
          amountTotal: 14900,
          currentPeriodEnd: '2026-07-16T15:00:00.000Z',
          studentId: null,
          stripeCheckoutSessionId: 'manual:in_manual_smoke_123',
        },
        linkedToStudent: false,
        enrollmentState: {
          code: 'paid_unlinked',
          label: 'Payment recorded, link account',
          action: 'Create accounts or link payment',
        },
      }, 201));
    }
    if (endpoint === '/api/applications') return route.fulfill(json(applicationsPayload()));
    if (endpoint === '/api/admin/assignments') return route.fulfill(json(assignmentsPayload()));
    if (endpoint === '/api/admin/weekly-report') return route.fulfill(json(weeklyReportPayload()));
    if (endpoint === '/api/parent/logout' || endpoint === '/api/auth/logout') return route.fulfill(json({ ok: true }));
    if (endpoint === '/api/billing/portal') return route.fulfill(json({ url: 'https://billing.example.test/session' }));
    if (endpoint === '/api/checkout/create-session') return route.fulfill(json({ url: 'https://checkout.example.test/session' }));

    return route.fulfill(json({ error: `Unhandled mock endpoint: ${endpoint}` }, 404));
  });
}

async function checkRoute(context, baseUrl, routeSpec, viewportName) {
  const page = await context.newPage();
  const endpointCounts = new Map();
  const errors = [];
  const onPageError = (error) => errors.push(error.message);
  const onConsole = (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  await installMocks(page, endpointCounts);

  const issues = [];
  try {
    await page.goto(`${baseUrl}${routeSpec.path}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.locator('body').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    if (routeSpec.afterLoad) await routeSpec.afterLoad(page);

    const bodyText = await page.locator('body').textContent({ timeout: 8000 });
    for (const expected of routeSpec.expected) {
      if (!bodyText.includes(expected)) issues.push(`missing expected text: ${expected}`);
    }
    if (/Failed to load data|Network error|Loading…|加载中/.test(bodyText)) {
      issues.push('page still shows loading or error text');
    }

    const metrics = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyLength: document.body?.innerText?.trim().length || 0,
    }));
    if (metrics.bodyLength < 120) issues.push('page body rendered too little text');
    if (metrics.scrollWidth > metrics.width + 2) {
      issues.push(`horizontal overflow: scrollWidth ${metrics.scrollWidth}, viewport ${metrics.width}`);
    }

    const materialErrors = errors.filter((message) => !isIgnoredConsoleError(message));
    if (materialErrors.length) issues.push(`console/page errors: ${materialErrors.slice(0, 3).join(' | ')}`);

    for (const [endpoint, max] of Object.entries(routeSpec.endpointCaps || {})) {
      const count = endpointCounts.get(endpoint) || 0;
      if (count === 0) issues.push(`endpoint was not called: ${endpoint}`);
      if (count > max) issues.push(`endpoint repeated too often: ${endpoint} called ${count} times (max ${max})`);
    }
  } catch (error) {
    issues.push(error.message);
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    await page.close();
  }

  return {
    name: routeSpec.name,
    path: routeSpec.path,
    viewport: viewportName,
    status: issues.length ? 'fail' : 'pass',
    issues,
    endpointCounts: Object.fromEntries(endpointCounts),
  };
}

function markdownReport(report) {
  const lines = [];
  lines.push('# Parent/Admin Browser Smoke QA');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Base URL: ${report.baseUrl}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.pass} pass / ${report.summary.fail} fail (${report.summary.total} route checks)`);
  lines.push('');
  lines.push('| Route | Viewport | Status | API counts |');
  lines.push('| --- | --- | --- | --- |');
  for (const row of report.checks) {
    const counts = Object.entries(row.endpointCounts).map(([endpoint, count]) => `${endpoint}: ${count}`).join('<br>');
    lines.push(`| ${row.path} | ${row.viewport} | ${row.status} | ${counts || '-'} |`);
  }
  const issues = report.checks.flatMap((row) => row.issues.map((message) => ({ ...row, message })));
  if (issues.length) {
    lines.push('');
    lines.push('## Issues');
    for (const issue of issues) lines.push(`- ${issue.viewport} ${issue.path}: ${issue.message}`);
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

async function main() {
  const baseUrl = argValue('--base-url', 'http://localhost:3000');
  const reportPath = path.resolve(ROOT, argValue('--report', DEFAULT_REPORT));
  const jsonPath = path.resolve(ROOT, argValue('--json-report', DEFAULT_JSON_REPORT));
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
        window.localStorage.setItem('giis_parent_info', JSON.stringify({
          studentId: 'student-ops-1',
          email: 'jordan@example.com',
          parentName: 'Jordan Rivera',
        }));
        window.sessionStorage.setItem('giis_admin_session', JSON.stringify({
          id: 'admin-ops-1',
          email: 'admin@example.com',
        }));
      });
      for (const routeSpec of ROUTES) {
        checks.push(await checkRoute(context, baseUrl, routeSpec, viewport.name));
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
  const report = { generatedAt: new Date().toISOString(), baseUrl, summary, checks };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, markdownReport(report));
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Parent/admin browser smoke QA: ${summary.pass} pass / ${summary.fail} fail (${summary.total} route checks)`);
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`);
  for (const row of checks.filter((item) => item.status === 'fail')) {
    console.log(`\n[FAIL] ${row.viewport} ${row.path}`);
    for (const message of row.issues) console.log(`  - ${message}`);
  }
  process.exit(summary.fail ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
