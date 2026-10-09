#!/usr/bin/env node
/* Synthetic browser walkthrough: no database, email, Stripe charge, or production mutation. */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const buildDir = path.resolve(__dirname, '../../build');

function contentType(file) {
  if (file.endsWith('.js')) return 'text/javascript';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.json')) return 'application/json';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  return 'text/html';
}

function startSpaServer() {
  if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
    throw new Error('build/index.html is missing; run npm run build first.');
  }
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const candidate = path.resolve(buildDir, `.${pathname}`);
    const safeCandidate = candidate.startsWith(`${buildDir}${path.sep}`) ? candidate : '';
    const file = safeCandidate && fs.existsSync(safeCandidate) && fs.statSync(safeCandidate).isFile()
      ? safeCandidate
      : path.join(buildDir, 'index.html');
    res.writeHead(200, { 'Content-Type': contentType(file) });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function main() {
  const server = await startSpaServer();
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const stages = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    let app = {
      id: 'app-placement-smoke',
      studentName: 'Synthetic Grade 9 Candidate',
      dob: '2012-04-12',
      gradeLevel: 'Grade 9',
      currentSchool: '',
      targetUniversities: '',
      preferredLanguage: 'en',
      communicationLanguage: 'en',
      parentName: 'Synthetic Parent',
      parentEmail: 'parent@example.invalid',
      phone: '',
      notes: '',
      applicantType: 'new',
      previousCredits: '',
      transcriptAvailable: '',
      graduationTiming: '',
      mainConcern: 'grade9-path',
      motivation: 'Synthetic browser walkthrough',
      intendedStartTiming: 'within-30-days',
      parentRelationship: 'parent',
      contactPreference: 'email',
      recordsStatus: 'not_requested',
      assignedTo: 'Admissions Reviewer',
      nextAction: 'Review application',
      status: 'pending',
      adminNotes: '',
      accountsCreated: false,
      placementRequired: false,
      placementDecision: null,
      events: [],
      interestConfirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      submissionCount: 1,
      readiness: { code: 'approval_ready', label: 'Approval-ready', action: 'Complete admissions review' },
      enrollmentState: { code: 'pending_review', label: 'Admissions review pending', paid: false, paidUnlinked: false },
    };

    const requestBody = (request) => {
      try { return request.postDataJSON(); } catch { return {}; }
    };
    const respond = (route, status, value, headers = {}) => route.fulfill({
      status,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(value),
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('giis_admin_session', JSON.stringify({ id: 'admin-smoke', email: 'admin@example.invalid' }));
    });
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      const method = request.method();
      if (pathname === '/api/checkout/tiers') {
        return respond(route, 200, {}, { 'X-GIIS-Admissions-Workflow': 'admissions-v5' });
      }
      if (pathname === '/api/applications/capabilities') {
        return respond(route, 200, { applicationStripeCheckout: true, placementDecision: { available: true, reason: '' } });
      }
      if (pathname === '/api/applications' && method === 'GET') return respond(route, 200, [app]);
      if (pathname === `/api/applications/${app.id}` && method === 'PATCH') {
        const body = requestBody(request);
        if (body.placementRequired) {
          app.placementRequired = true;
          app.nextAction = body.nextAction;
          app.readiness = { code: 'placement_pending', label: 'Placement record required', action: 'Complete the placement decision record' };
        }
        if (body.status === 'approved') {
          if (!app.placementDecision?.principalApprovedAt) {
            return respond(route, 400, { error: 'The placement decision requires recorded Principal approval.' });
          }
          app.status = 'approved';
          app.readiness = { code: 'approval_ready', label: 'Approval-ready', action: 'Approve application when admissions review is complete' };
        }
        return respond(route, 200, { ok: true, id: app.id, status: app.status });
      }
      if (pathname === `/api/applications/${app.id}/placement-decision` && method === 'PUT') {
        const body = requestBody(request);
        app.placementDecision = {
          id: 'placement-smoke', applicationId: app.id, ...body,
          assessmentDate: `${body.assessmentDate}T12:00:00.000Z`,
          recheckDate: `${body.recheckDate}T12:00:00.000Z`,
          englishScore: Number(body.englishScore), mathScore: Number(body.mathScore), scienceScore: Number(body.scienceScore),
          principalApprover: '', principalApprovedAt: null,
        };
        app.readiness = { code: 'placement_principal_review', label: 'Placement awaiting Principal review', action: 'Record the Principal decision' };
        return respond(route, 200, { ok: true, decision: app.placementDecision, applicationResetToPending: false });
      }
      if (pathname === `/api/applications/${app.id}/placement-decision/principal-approval` && method === 'POST') {
        app.placementDecision.principalApprover = requestBody(request).principalApprover;
        app.placementDecision.principalApprovedAt = new Date().toISOString();
        app.readiness = { code: 'approval_ready', label: 'Approval-ready', action: 'Approve application when admissions review is complete' };
        return respond(route, 200, { ok: true, alreadyApproved: false, decision: app.placementDecision });
      }
      if (pathname === `/api/applications/${app.id}/stripe-checkout` && method === 'POST') {
        return respond(route, 201, {
          checkoutSessionId: 'cs_synthetic_no_charge',
          url: 'https://checkout.stripe.com/synthetic-no-charge',
          planType: requestBody(request).planType,
          paymentState: 'awaiting_stripe_confirmation',
        });
      }
      if (pathname === `/api/applications/${app.id}/activate` && method === 'POST') {
        if (!app.enrollmentState.paid && !app.enrollmentState.paidUnlinked) {
          return respond(route, 400, { error: 'Verified payment evidence is required before account activation.' });
        }
        app.accountsCreated = true;
        app.enrollmentState = {
          code: 'active_paid', label: 'Active paid enrollment', paid: true, paidUnlinked: false,
          studentId: 'student-placement-smoke',
        };
        return respond(route, 200, {
          ok: true,
          studentCode: 'GIIS-SMOKE-0001',
          studentId: 'student-placement-smoke',
          parentContactEmail: app.parentEmail,
          parentEmail: 'parent.login@example.invalid',
          parentLoginEmail: 'parent.login@example.invalid',
          parentPassword: 'synthetic-not-delivered',
          studentEmail: 'student.login@example.invalid',
          studentPassword: 'synthetic-not-delivered',
          tempPassword: 'synthetic-not-delivered',
          linkedSubscriptions: 1,
          loginUrl: 'https://example.invalid/parent/login',
        });
      }
      return respond(route, 404, { error: `Unhandled smoke route ${method} ${pathname}` });
    });

    await page.goto(`${origin}/admin/applications`, { waitUntil: 'networkidle' });
    await page.getByText(app.studentName).waitFor();
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Require placement review' }).click();
    await page.getByText('Required · Principal approval not yet recorded').waitFor();
    stages.push('placement-required');

    await page.getByLabel('Assessment date').fill('2026-10-09');
    await page.getByLabel('Assessor').fill('Academic Reviewer');
    await page.getByLabel('English / 30').fill('24');
    await page.getByLabel('Math / 36').fill('27');
    await page.getByLabel('Science / 24').fill('19');
    await page.getByLabel('Result').selectOption('ready_with_bridge');
    await page.getByLabel('Recommended grade').fill('Grade 9');
    await page.getByLabel('First-week reviewer').fill('First Week Reviewer');
    await page.getByLabel('Recheck date').fill('2026-11-20');
    await page.getByLabel('Evidence reviewed').fill('GIIS readiness packet, work samples, and Khan Academy evidence.');
    await page.getByLabel('Assistance or accommodations').fill('Procedural directions only.');
    await page.getByLabel('Independent-learning observations').fill('Followed directions and showed work.');
    await page.getByLabel('Decision rationale').fill('Core readiness supports Grade 9 with a named writing bridge.');
    await page.getByLabel('Bridge or next-step plan').fill('Weekly writing review for four weeks.');
    await page.getByLabel('First-term plan').fill('Algebra I, English I, Biology, and World History introductory modules.');
    await page.getByRole('button', { name: 'Save placement record' }).click();
    stages.push('evidence-saved');

    const blockedApproval = page.getByRole('button', { name: 'Not approval-ready' });
    if (!(await blockedApproval.isDisabled())) throw new Error('Approval was not blocked before Principal sign-off.');
    stages.push('approval-blocked-before-signoff');
    await page.getByLabel('Principal approver').fill('Shiyu Zhang, Ph.D.');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Record Principal approval' }).click();
    await page.getByText(/Signed by Shiyu Zhang, Ph\.D\./).waitFor();
    stages.push('principal-signed');

    await page.getByRole('button', { name: 'Approve application' }).click();
    await page.getByRole('button', { name: 'Approved', exact: true }).click();
    await page.getByRole('button', { name: 'View' }).click();
    stages.push('application-approved');
    await page.getByRole('button', { name: 'Create Stripe Checkout' }).click();
    await page.locator('select:has(option[value="self_paced_monthly"])').last().selectOption('self_paced_monthly');
    await page.getByRole('button', { name: 'Create secure payment link' }).click();
    const checkoutField = page.locator('textarea[readonly]');
    await checkoutField.waitFor();
    if (await checkoutField.inputValue() !== 'https://checkout.stripe.com/synthetic-no-charge') {
      throw new Error('Application-bound Checkout URL was not displayed.');
    }
    stages.push('application-bound-checkout-created');

    // Simulate the already-tested signed-webhook receipt boundary without
    // contacting Stripe or claiming a real charge. The UI must then expose
    // activation, not before.
    app.enrollmentState = {
      code: 'paid_unlinked', label: 'Paid, needs account activation', paid: false, paidUnlinked: true,
    };
    stages.push('synthetic-signed-webhook-receipt-observed');
    await page.getByRole('button', { name: 'Done' }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Approved', exact: true }).click();
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Create Accounts' }).click();
    await page.getByText('Account credentials created').waitFor();
    await page.getByRole('button', { name: 'Enroll in courses' }).waitFor();
    stages.push('accounts-activated');
    stages.push('course-enrollment-required-before-handoff');

    console.log(JSON.stringify({
      result: 'PASS', stages,
      externalEmail: false, realCharge: false, productionMutation: false,
      boundary: 'Webhook receipt and activation are synthetic; no real Stripe delivery, account, course, email, or charge was created.',
    }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
