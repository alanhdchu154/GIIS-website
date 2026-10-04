// Local built-UI smoke. All APIs are synthetic; external network is blocked.
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../build');
const app = {
  id: 'synthetic_application', studentName: 'Synthetic Student', parentName: 'Synthetic Parent',
  parentEmail: 'parent@example.invalid', status: 'approved', applicantType: 'new',
  gradeLevel: 'Grade 9', createdAt: new Date().toISOString(), interestConfirmedAt: new Date().toISOString(),
  readiness: { code: 'approval_ready', label: 'Approval-ready' },
  enrollmentState: { paid: false, paidUnlinked: false }, events: [],
};
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'index.html');
    const ext = path.extname(target);
    res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html' })[ext] || 'application/octet-stream');
    fs.createReadStream(target).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => sessionStorage.setItem('giis_admin_session', JSON.stringify({ id: 'synthetic_admin' })));
    let created = 0;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/api/')) {
        let body = {};
        if (url.pathname === '/api/applications/capabilities') body = { applicationStripeCheckout: true };
        else if (url.pathname === '/api/applications') body = [app];
        else if (url.pathname.endsWith('/stripe-checkout')) {
          assert.equal(route.request().postDataJSON().planType, 'guided_monthly');
          created += 1;
          body = { url: 'https://checkout.stripe.com/synthetic-only' };
        }
        return route.fulfill({ json: body, headers: { 'X-GIIS-Admissions-Workflow': 'admissions-v5' } });
      }
      if (url.origin !== origin) return route.abort();
      return route.continue();
    });
    await page.goto(origin + '/admin/applications');
    await page.getByRole('button', { name: 'View', exact: true }).click();
    await page.getByRole('button', { name: 'Create Stripe Checkout', exact: true }).click();
    await page.getByRole('button', { name: 'Create secure payment link', exact: true }).click();
    await page.locator('textarea[readonly]').waitFor();
    assert.equal(await page.locator('textarea[readonly]').inputValue(), 'https://checkout.stripe.com/synthetic-only');
    assert.equal(created, 1);
    app.enrollmentState = { paidUnlinked: true, subscriptionStatus: 'active' };
    app.events = [{ id: 'receipt', actorEmail: 'stripe-webhook', createdAt: new Date().toISOString(), summary: 'Stripe payment received: USD 149.00 for guided_monthly. Reference: cs_synthetic.' }];
    await page.reload();
    await page.getByRole('button', { name: 'View', exact: true }).click();
    await page.getByText('Stripe payment received: USD 149.00', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Create Stripe Checkout', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: built Admin UI creates one synthetic Checkout link, displays the paid receipt after refresh, and hides repeat payment; no external requests.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err.message); process.exitCode = 1; });
