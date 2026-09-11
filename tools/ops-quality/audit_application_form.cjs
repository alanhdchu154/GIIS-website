#!/usr/bin/env node
// Offline production-/apply audit. Usage: node tools/ops-quality/audit_application_form.cjs BUILD_DIR REPORT_DIR
// Starts a loopback static server that rejects all writes. Playwright fulfills every API call in memory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const build = path.resolve(process.argv[2] || 'build');
const out = path.resolve(process.argv[3] || 'umi/reports/application-form');
const html = fs.readFileSync(path.join(build, 'index.html'), 'utf8')
  .replace(/<link\b[^>]*\bhref=["']https?:\/\/[^>]*>/gi, '')
  .replace(/<form\b[^>]*data-netlify[^>]*>[\s\S]*?<\/form>/gi, '');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'");
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end('Offline audit: writes rejected'); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/apply') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : html); return;
  }
  const file = path.resolve(build, `.${pathname}`);
  if (pathname.startsWith('/api/') || !file.startsWith(`${build}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.realpathSync(file).startsWith(`${fs.realpathSync(build)}${path.sep}`)) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
});
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const scenarios = [];
  try {
    const guards = [];
    for (const [method, route, expected] of [['POST', '/api/applications', 405], ['POST', '/api/checkout', 405], ['GET', '/api/checkout/tiers', 404], ['GET', '/apply/test', 404]]) {
      const response = await fetch(`${base}${route}`, { method });
      assert.equal(response.status, expected);
      guards.push({ method, route, status: response.status });
    }
    browser = await chromium.launch({ headless: true });
    for (const language of ['en', 'zh']) for (const width of [1365, 390]) for (const type of ['new', 'transfer']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      const page = await context.newPage();
      const posts = [], unexpectedRequests = [], errors = [], checkpoints = [];
      const T = (en, zh) => language === 'en' ? en : zh;
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== base) { unexpectedRequests.push({ url: request.url(), method: request.method() }); await route.abort(); return; }
        if (url.pathname === '/api/checkout/tiers' && request.method() === 'HEAD') {
          await route.fulfill({ status: 200, headers: { 'X-GIIS-Admissions-Workflow': 'admissions-v5' }, body: '' }); return;
        }
        if (url.pathname === '/api/applications' && request.method() === 'POST') {
          posts.push(request.postDataJSON());
          // Keep the response pending long enough to exercise repeated submission.
          await new Promise(resolve => setTimeout(resolve, 250));
          const fail = type === 'transfer' && posts.length === 1;
          await route.fulfill({ status: fail ? 500 : 200, contentType: 'application/json', body: JSON.stringify(fail ? { error: 'Synthetic submission failure; retry.' } : { confirmationRequired: true, duplicate: language === 'zh' && type === 'new' }) }); return;
        }
        if (url.pathname.startsWith('/api/') || request.method() !== 'GET') {
          unexpectedRequests.push({ url: request.url(), method: request.method() }); await route.abort(); return;
        }
        await route.continue();
      });
      await page.addInitScript(lang => localStorage.setItem('giis-language', lang), language);
      const label = (en, zh) => page.getByLabel(T(en, zh), { exact: false });
      const next = () => page.getByRole('button', { name: T('Continue', '下一步'), exact: true }).click();
      const back = () => page.getByRole('button', { name: T('Back', '上一步'), exact: true }).click();
      const checkpoint = async name => {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${language}/${width}/${type}/${name}: overflow`);
        checkpoints.push(name);
      };
      await page.goto(`${base}/apply`, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
      await next();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.getByRole('alert').evaluate(el => el === document.activeElement), true);
      await label('Student Full Name', '学生姓名').fill('Taylor Example');
      await label('Date of Birth', '出生日期').fill('2010-05-12');
      await label('Grade Level', '年级').selectOption('Grade 11');
      await label('When would the student like to start', '学生希望何时开始').selectOption('exploring');
      await label('Why is your family considering GIIS', '您的家庭为什么考虑 GIIS').fill(T('A fictional family is exploring a flexible high-school plan with clear progress updates and guidance on choosing appropriate courses.', '这是虚构的测试家庭，希望了解高中课程安排、家长如何查看学习进展，以及学校如何协助整理学习记录。我们目前仍在比较学校，希望先讨论学生的学习需要，再了解适合的就读方案和后续步骤。这些内容只用于本地浏览器验收。'));
      await checkpoint('student');
      await label('Student Full Name', '学生姓名').press('Enter');
      await page.getByRole('heading', { name: T('Application Path', '申请路径'), exact: true }).waitFor();
      await page.getByRole('radio', { name: type === 'new' ? T('New student', '一般新生') : T('Transfer student', '转学生'), exact: true }).check();
      if (type === 'transfer') {
        await label('Current enrollment status', '目前就读状态').selectOption('currently-enrolled');
        await label('School name', '学校名称').fill('Fictional School');
        await label('Attendance period', '就读期间').fill('2024–2026');
        await label('What records are available', '目前有哪些学校记录').selectOption('no-official-transcript');
        await label('Records request situation', '取得记录的情况').selectOption('need-giis-help');
        await label('Expected records timing', '预计取得记录时间').selectOption('uncertain');
        await label('Graduation planning preference', '毕业规划偏好').selectOption('target-date');
        await label('Family target date', '家庭目标日期').fill('2028-06-01');
        await label('Completed high-school course summary', '已完成的高中课程摘要').fill('Fictional English I, Algebra I and Biology; records need review.');
        await label('Previous credits estimate', '已修学分估计').selectOption('6-11');
        await page.getByRole('button', { name: T('+ Add school', '+ 添加学校'), exact: true }).click();
        await label('School name', '学校名称').nth(1).fill('Second Fictional School');
        await label('Attendance period', '就读期间').nth(1).fill('2023–2024');
      } else await label('Current or most recent school', '目前或最近就读学校').fill('Fictional School');
      await label('Main family concern', '家庭最担心的问题').selectOption(type === 'transfer' ? 'credits' : 'grade9-path');
      await checkpoint('path');
      if (type === 'transfer') {
        await page.screenshot({ path: path.join(out, `${language}-${width}-transfer-path.png`), fullPage: true });
        await label('Graduation planning preference', '毕业规划偏好').selectOption('normal-pace');
      }
      await back();
      assert.equal(await label('Student Full Name', '学生姓名').inputValue(), 'Taylor Example');
      await next(); await next();
      await label('Parent Full Name', '家长姓名').fill('Jordan Example');
      await label('Parent Email', '家长邮箱').fill('invalid-email');
      if (type === 'transfer') {
        await label('Relationship to student', '与学生的关系').selectOption('parent');
        await label('Preferred contact method', '偏好联络方式').selectOption('phone');
        await page.getByRole('textbox', { name: T('Phone', '电话'), exact: true }).fill('555-0100');
      }
      await next();
      await page.getByText(T('Invalid email', '邮箱格式错误'), { exact: true }).waitFor();
      await label('Parent Email', '家长邮箱').fill('parent@example.test');
      await checkpoint('parent');
      await next();
      await page.getByText('Jordan Example', { exact: true }).waitFor();
      assert.equal(await page.getByText(/2028-06-01/).count(), 0);
      const boxes = page.getByRole('checkbox');
      for (let i = 0; i < await boxes.count(); i++) assert.equal(await boxes.nth(i).isChecked(), false);
      const submit = page.getByRole('button', { name: T('Submit application', '提交申请'), exact: true });
      await submit.click();
      await page.getByRole('alert').waitFor();
      assert.equal(posts.length, 0);
      for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check();
      await checkpoint('review');
      await page.screenshot({ path: path.join(out, `${language}-${width}-${type}-review.png`), fullPage: true });
      // Direct form events also exercise the lock, beyond the disabled submit button.
      await page.locator('#application-form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
      if (type === 'transfer') {
        await page.getByText('Synthetic submission failure; retry.', { exact: true }).waitFor();
        assert.equal(posts.length, 1);
        await submit.click();
      }
      await page.getByText(T('Please open the confirmation email sent to', '请打开已发送至'), { exact: false }).waitFor();
      assert.equal(await page.getByRole('status').evaluate(el => el === document.activeElement), true);
      await page.getByRole('heading', { name: T('Confirm parent email', '确认家长邮箱'), exact: true }).waitFor();
      await checkpoint('mock-confirmation-receipt');
      await page.screenshot({ path: path.join(out, `${language}-${width}-${type}-receipt.png`), fullPage: true });
      assert.equal(posts.length, type === 'transfer' ? 2 : 1);
      const payload = posts.at(-1);
      assert.equal(payload.parentEmail, 'parent@example.test');
      assert.equal(payload.applicantType, type);
      assert.equal(payload.graduationTargetDate, '');
      assert.equal(payload.intakeVersion, 'serious-v1');
      assert.equal(payload.transferRecordsAcknowledged, type === 'transfer');
      assert.equal(payload.tuitionAware && payload.noGuaranteeAcknowledged && payload.responseCommitmentAcknowledged, true);
      if (type === 'transfer') assert.equal(payload.priorSchools.length, 2);
      if (language === 'zh' && type === 'new') await page.getByText('我们已经收到这名学生的待审核申请。系统保留原案件并记录您再次提交，没有建立重复案件。', { exact: true }).waitFor();
      assert.deepEqual(unexpectedRequests, []);
      // A fulfilled synthetic HTTP 500 intentionally produces a console resource error.
      assert.deepEqual(errors.filter(error => !(type === 'transfer' && /Failed to load resource.*500/.test(error))), []);
      const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
      assert.deepEqual(storage, { local: { 'giis-language': language }, session: {} });
      scenarios.push({ language, width, type, checkpoints, mockPosts: posts.length, realApiRequests: 0, unexpectedRequests, personalDataStored: false });
      console.log(`PASS ${language} ${width}px ${type}`);
      await context.close();
    }
    fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify({ checkedAt: new Date().toISOString(), build, mode: 'offline mocked transport; no backend, delivery, payment or credit approval tested', guards, scenarios }, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
