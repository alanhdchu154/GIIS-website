#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'school-ops-daily.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'school-ops-daily.json');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'giis-school-ops-'));

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);

function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: options.timeoutMs || 120000,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const allowedFailure = result.status !== 0 && result.status !== null && Boolean(options.allowFailure);
  const ok = result.status === 0 || allowedFailure;
  return {
    label,
    command: [command, ...args].join(' '),
    status: result.status,
    ok,
    allowedFailure,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    output,
    error: result.error ? result.error.message : null,
  };
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function auditJson(label, script, allowFailure = false) {
  const jsonPath = path.join(TMP, `${label}.json`);
  const reportPath = path.join(TMP, `${label}.md`);
  const result = run(label, 'node', [script, '--report', reportPath, '--json-report', jsonPath], { allowFailure });
  return {
    result,
    data: readJson(jsonPath, {
      generatedAt: new Date().toISOString(),
      summary: { total: 0, pass: 0, warn: 0, fail: result.status === 0 ? 0 : 1 },
      results: [],
      error: result.output || result.error,
    }),
  };
}

function manifestAudit() {
  const result = run('lesson-manifest', 'node', ['tools/youtube-upload/audit_manifest_alignment.js', '--json']);
  return {
    result,
    data: readJsonFromStdout(result.stdout, {
      summary: { total_lessons: 0, warnings: 1 },
      issues: [],
    }),
  };
}

function readJsonFromStdout(stdout, fallback) {
  try {
    return JSON.parse(stdout);
  } catch {
    return fallback;
  }
}

function releaseGate() {
  const result = run('lesson-release-gate', 'python3', ['tools/lesson-video/lesson_release_gate.py', '--check']);
  const output = result.output;
  return {
    result,
    data: {
      evaluated: numberMatch(output, /evaluated:\s+(\d+)/),
      ready: numberMatch(output, /ready:\s+(\d+)/),
      needsRevision: numberMatch(output, /needs_revision:\s+(\d+)/),
      blocked: numberMatch(output, /blocked:\s+(\d+)/),
    },
  };
}

function videoDashboard() {
  const jsonPath = path.join(TMP, 'lesson-video-dashboard.json');
  const result = run('lesson-video-dashboard', 'python3', [
    'tools/lesson-video/video_dashboard.py',
    '--json',
    jsonPath,
    '--no-html',
  ]);
  return { result, data: readJson(jsonPath, {}) };
}

function videoInventory() {
  const result = run('lesson-video-inventory', 'node', ['tools/lesson-video/audit_video_quality_inventory.js']);
  const output = result.output;
  return {
    result,
    data: {
      folders: numberMatch(output, /Video quality inventory:\s+(\d+)\s+folders/),
      visible: numberMatch(output, /,\s+(\d+)\s+visible/),
      withMp4: numberMatch(output, /,\s+(\d+)\s+with MP4/),
      fullReviewerCascade: pairMatch(output, /Full reviewer cascade:\s+(\d+)\/(\d+)/),
      apMissingReferencePacket: numberMatch(output, /AP missing reference packet:\s+(\d+)/),
      visibleKeepCandidate: numberMatch(output, /visible_keep_candidate:\s+(\d+)/),
      pendingNeedsReview: numberMatch(output, /pending_needs_review:\s+(\d+)/),
      uploadCandidateAfterHumanApproval: numberMatch(output, /upload_candidate_after_human_approval:\s+(\d+)/),
    },
  };
}

function numberMatch(value, regex) {
  const match = String(value || '').match(regex);
  return match ? Number(match[1]) : 0;
}

function pairMatch(value, regex) {
  const match = String(value || '').match(regex);
  return match ? { done: Number(match[1]), total: Number(match[2]) } : { done: 0, total: 0 };
}

function summarizeAudit(data) {
  const summary = data?.summary || {};
  return {
    total: Number(summary.total || 0),
    pass: Number(summary.pass || 0),
    warn: Number(summary.warn || 0),
    fail: Number(summary.fail || 0),
  };
}

function resultStatus(summary) {
  if (summary.fail > 0) return 'fail';
  if (summary.warn > 0) return 'warn';
  return 'pass';
}

function paymentActions(paymentData) {
  return (paymentData?.nextActions || paymentData?.action_items || paymentData?.actionItems || []).map((item) => ({
    id: item.id,
    type: item.type || item.kind,
    message: item.message || item.action || item.title,
    doc: item.doc || item.reference || item.runbook,
  }));
}

function findResult(data, id) {
  return (data?.results || []).find((item) => item.id === id) || null;
}

function ownerSummary(ownerData) {
  const leadCapture = findResult(ownerData, 'lead-capture-owner');
  const backendPayment = findResult(ownerData, 'backend-payment-launch-window');
  return {
    verdict: ownerData?.verdict || 'unknown',
    manualRequiredFail: Number(ownerData?.summary?.manualRequiredFail || 0),
    notificationConfirmed: Boolean(leadCapture?.details?.notificationConfirmed),
    notificationInbox: leadCapture?.details?.notificationInbox || '',
    dailySubmissionsOwner: leadCapture?.details?.dailySubmissionsOwner || '',
    dailyCheckCadence: leadCapture?.details?.dailyCheckCadence || '',
    backendPaymentStatus: backendPayment?.status || '',
    backendPaymentMissing: backendPayment?.details?.missing || [],
  };
}

function buildReport() {
  const productionApi = auditJson('production-api-proxy', 'tools/ops-quality/audit_production_api_proxy.js');
  const salesLive = auditJson('sales-live', 'tools/ops-quality/audit_parent_sales_live.js');
  const frontendDeploy = auditJson('frontend-deploy-freshness', 'tools/ops-quality/audit_frontend_deploy_freshness.js');
  const parentJourney = auditJson('parent-journey', 'tools/ops-quality/audit_parent_journey_acceptance.js');
  const ownerDecisions = auditJson('sales-owner-decisions', 'tools/ops-quality/audit_parent_sales_owner_decisions.js');
  const manualReady = auditJson('sales-manual-ready', 'tools/ops-quality/audit_parent_sales_manual_ready.js');
  const paymentLive = auditJson('sales-payment-live', 'tools/ops-quality/audit_parent_sales_payment_live.js', true);
  const manifest = manifestAudit();
  const gate = releaseGate();
  const dashboard = videoDashboard();
  const inventory = videoInventory();

  const salesSignals = {
    productionApi: summarizeAudit(productionApi.data),
    salesLive: summarizeAudit(salesLive.data),
    frontendDeploy: summarizeAudit(frontendDeploy.data),
    frontendDeployVerdict: frontendDeploy.data?.verdict || 'unknown',
    frontendDeployDetails: findResult(frontendDeploy.data, 'frontend-deploy-freshness'),
    parentJourney: summarizeAudit(parentJourney.data),
    ownerDecisions: summarizeAudit(ownerDecisions.data),
    ownerSummary: ownerSummary(ownerDecisions.data),
    manualReady: summarizeAudit(manualReady.data),
    paymentLive: summarizeAudit(paymentLive.data),
    ownerVerdict: ownerDecisions.data?.verdict || 'unknown',
    manualReadyVerdict: manualReady.data?.verdict || 'unknown',
    paymentActionItems: paymentActions(paymentLive.data),
  };

  const manifestSummary = manifest.data?.summary || {};
  const dashboardSummary = dashboard.data?.summary || {};
  const dashboardPlan = dashboard.data?.plan || {};
  const releaseSummary = gate.data;
  const inventorySummary = inventory.data;

  const hardFailures = [
    salesSignals.productionApi.fail,
    salesSignals.salesLive.fail,
    salesSignals.parentJourney.fail,
    Math.max(salesSignals.ownerDecisions.fail, salesSignals.ownerSummary.manualRequiredFail),
    salesSignals.manualReady.fail,
    Number(manifestSummary.warnings || 0),
    releaseSummary.blocked,
  ].reduce((sum, count) => sum + Number(count || 0), 0);

  let verdict = 'manual_sales_go_with_payment_boundary';
  if (hardFailures > 0) verdict = 'not_ready';
  else if (salesSignals.paymentLive.fail === 0) verdict = 'automated_payment_ready';

  const generatedAt = new Date().toISOString();
  const report = {
    generatedAt,
    timezone: 'America/Chicago',
    verdict,
    salesSignals,
    lessonSignals: {
      manifest: {
        totalLessons: Number(manifestSummary.total_lessons || 0),
        warnings: Number(manifestSummary.warnings || 0),
      },
      releaseGate: releaseSummary,
      dashboard: {
        totalLessons: dashboardSummary.total_lessons || 0,
        withMp4: dashboardSummary.with_mp4 || 0,
        passedQuality: dashboardSummary.passed_quality || 0,
        approved: dashboardSummary.approved || 0,
        uploaded: dashboardSummary.uploaded || 0,
        pendingUpload: dashboardSummary.pending_upload || 0,
        plannedVideos: dashboardPlan.totals?.planned_videos || 0,
        remainingVideos: dashboardPlan.totals?.remaining || 0,
        nonApRemainingVideos: dashboardPlan.planned_at?.remaining_non_ap_videos || 0,
        targetUploadsPerDay: dashboardPlan.planned_at?.target_uploads_per_day || 0,
      },
      inventory: inventorySummary,
    },
    commandResults: [
      productionApi.result,
      salesLive.result,
      frontendDeploy.result,
      parentJourney.result,
      ownerDecisions.result,
      manualReady.result,
      paymentLive.result,
      manifest.result,
      gate.result,
      dashboard.result,
      inventory.result,
    ].map((item) => ({
      label: item.label,
      command: item.command,
      status: item.status,
      ok: item.ok,
      allowedFailure: item.allowedFailure,
      error: item.error,
    })),
    nextActions: buildNextActions(verdict, salesSignals, releaseSummary, dashboardSummary, inventorySummary),
  };
  return report;
}

function buildNextActions(verdict, salesSignals, releaseGate, dashboardSummary, inventory) {
  const actions = [];
  if (verdict === 'manual_sales_go_with_payment_boundary') {
    actions.push({
      owner: 'Umi / admissions operator',
      priority: 'today',
      action: 'Run manual sales day only through reviewed application or consultation handoff; do not send automated checkout links.',
    });
  }
  if (salesSignals.paymentLive.fail > 0) {
    actions.push({
      owner: 'Alan / payment operator',
      priority: 'payment',
      action: 'Create or locate missing live Stripe Price IDs for Guided and Premium before treating automated checkout as live.',
      reference: 'docs/stripe-live-price-setup.md',
    });
  }
  if (salesSignals.frontendDeploy.warn > 0 || salesSignals.frontendDeploy.fail > 0) {
    const message = salesSignals.frontendDeployDetails?.message || 'Production frontend assets do not match the local production build.';
    const autoDeployAction = message.includes('GitHub main push should auto-trigger Netlify production')
      ? ' Confirm the Netlify production branch is main and review deploy status before claiming the latest pushed frontend changes are live.'
      : ' GitHub main push should auto-trigger Netlify production; inspect the Netlify GitHub integration, production branch, build trigger, and deploy status before claiming the latest pushed frontend changes are live.';
    actions.push({
      owner: 'Umi / Netlify operator',
      priority: 'frontend-deploy',
      action: `${message}${autoDeployAction}`,
      reference: 'docs/netlify-frontend-deploy-repair.md',
    });
  }
  if (salesSignals.ownerSummary.manualRequiredFail > 0) {
    actions.push({
      owner: 'Admissions operator',
      priority: 'owner-coverage',
      action: 'Manual-sales owner coverage is incomplete; assign lead capture, first response, WeChat follow-up, and manual Stripe ownership before outreach.',
      reference: 'docs/parent-sales-owner-decisions.json',
    });
  }
  if (!salesSignals.ownerSummary.notificationConfirmed) {
    actions.push({
      owner: 'Admissions operator',
      priority: 'lead-capture',
      action: 'Netlify consultation/contact notifications are not confirmed; the recorded daily submissions owner must manually check Netlify submissions and admissions inbox before relying on inbound leads. Use `npm run lead-capture:test` for a dry-run verifier before any confirmed test submission.',
      reference: 'docs/parent-sales-daily-operator-checklist.md',
    });
  }
  if (Number(dashboardSummary.pending_upload || 0) > 0 || Number(inventory.uploadCandidateAfterHumanApproval || 0) > 0) {
    actions.push({
      owner: 'Foundation video automation',
      priority: 'video',
      action: 'Let the gated uploader handle approved pending lessons; do not use force upload.',
    });
  }
  if (Number(releaseGate.needsRevision || 0) > 0) {
    actions.push({
      owner: 'Umi / cc',
      priority: 'quality-debt',
      action: `Keep older lesson-video quality debt visible: ${releaseGate.needsRevision} lessons need revision under the current gate.`,
    });
  }
  return actions;
}

function renderMarkdown(report) {
  const s = report.salesSignals;
  const l = report.lessonSignals;
  const lines = [
    '# GIIS School Operations Daily Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Verdict: ${report.verdict}`,
    '',
    '## Sales And Parent Trust',
    '',
    table([
      ['Area', 'Pass', 'Warn', 'Fail', 'Status'],
      ['Production API proxy', s.productionApi.pass, s.productionApi.warn, s.productionApi.fail, resultStatus(s.productionApi)],
      ['Sales live smoke', s.salesLive.pass, s.salesLive.warn, s.salesLive.fail, resultStatus(s.salesLive)],
      ['Frontend deploy freshness', s.frontendDeploy.pass, s.frontendDeploy.warn, s.frontendDeploy.fail, s.frontendDeployVerdict],
      ['Parent journey', s.parentJourney.pass, s.parentJourney.warn, s.parentJourney.fail, resultStatus(s.parentJourney)],
      ['Owner decisions', s.ownerDecisions.pass, s.ownerDecisions.warn, s.ownerDecisions.fail, s.ownerVerdict],
      ['Manual sales ready', s.manualReady.pass, s.manualReady.warn, s.manualReady.fail, s.manualReadyVerdict],
      ['Payment live', s.paymentLive.pass, s.paymentLive.warn, s.paymentLive.fail, resultStatus(s.paymentLive)],
      ['Lead notifications', s.ownerSummary.notificationConfirmed ? 'confirmed' : 'manual check', '', '', s.ownerSummary.notificationInbox || 'not recorded'],
    ]),
    '',
    '## Learning And Lesson Video',
    '',
    table([
      ['Area', 'Value'],
      ['Manifest lessons', l.manifest.totalLessons],
      ['Manifest warnings', l.manifest.warnings],
      ['Release gate ready', l.releaseGate.ready],
      ['Release gate needs revision', l.releaseGate.needsRevision],
      ['Release gate blocked', l.releaseGate.blocked],
      ['Dashboard lessons', l.dashboard.totalLessons],
      ['Dashboard uploaded', l.dashboard.uploaded],
      ['Dashboard pending upload', l.dashboard.pendingUpload],
      ['Planned videos', l.dashboard.plannedVideos],
      ['Remaining videos', l.dashboard.remainingVideos],
      ['Non-AP remaining videos', l.dashboard.nonApRemainingVideos],
      ['Target uploads/day', l.dashboard.targetUploadsPerDay],
      ['Inventory folders', l.inventory.folders],
      ['Inventory visible', l.inventory.visible],
      ['Inventory MP4', l.inventory.withMp4],
      ['Upload candidates after approval', l.inventory.uploadCandidateAfterHumanApproval],
    ]),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((item) => `- ${item.priority}: ${item.action}${item.reference ? ` (${item.reference})` : ''}`),
    '',
    '## Command Results',
    '',
    ...report.commandResults.map((item) => `- ${commandOutcome(item)} ${item.label}: \`${item.command}\` (exit ${item.status})`),
    '',
  ];
  return lines.join('\n');
}

function commandOutcome(item) {
  if (item.allowedFailure) return 'EXPECTED_FAIL';
  return item.ok ? 'PASS' : 'FAIL';
}

function table(rows) {
  const escape = (value) => String(value ?? '').replace(/\|/g, '\\|');
  const [head, ...body] = rows;
  return [
    `| ${head.map(escape).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function main() {
  const report = buildReport();
  writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
  writeFile(REPORT, `${renderMarkdown(report)}\n`);
  console.log(`School ops daily report: ${report.verdict}`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const action of report.nextActions) {
    console.log(`- ${action.priority}: ${action.action}`);
  }
  if (report.verdict === 'not_ready') process.exit(1);
}

main();
