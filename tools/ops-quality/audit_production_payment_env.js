#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'production-payment-env.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'production-payment-env.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const HOST = argValue('--host', process.env.GIIS_LIGHTSAIL_HOST || '54.163.81.228');
const USER = argValue('--user', process.env.GIIS_LIGHTSAIL_USER || 'ubuntu');
const KEY = argValue('--key', process.env.GIIS_LIGHTSAIL_KEY || path.join(process.env.HOME || '', '.ssh', 'LightsailDefaultKey-us-east-1.pem'));
const REMOTE_REPO = argValue('--remote-repo', '/home/ubuntu/GIIS-website');
const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);

const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_SELF_PACED_MONTHLY',
  'STRIPE_PRICE_GUIDED_MONTHLY',
  'STRIPE_PRICE_PREMIUM_MONTHLY',
];
const OPTIONAL_PRICE = 'STRIPE_PRICE_SELF_PACED_ANNUAL';
const LEGACY_SELF_PACED = 'STRIPE_PRICE_FOUNDERS_MONTHLY';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

function shellSingleQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function pass(id, message, details = {}) {
  return { id, status: 'pass', message, details };
}

function fail(id, message, details = {}) {
  return { id, status: 'fail', message, details };
}

function warn(id, message, details = {}) {
  return { id, status: 'warn', message, details };
}

function sshReadOnly() {
  const inline = String.raw`
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = process.env.GIIS_REMOTE_REPO;
const serverDir = path.join(repo, 'server');
const envPath = path.join(serverDir, '.env');

function parseEnv(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function safeShape(key, value) {
  if (!value) return { present: false };
  const shape = { present: true };
  if (key === 'DATABASE_URL') {
    shape.kind = /^postgres(ql)?:\/\//i.test(value) ? 'postgres' : 'other';
    shape.includesLocalhost = /localhost|127\.0\.0\.1/.test(value);
    shape.hasSslMode = /sslmode=require/.test(value);
  } else if (key === 'JWT_SECRET') {
    shape.lengthOk = value.length >= 32;
  } else if (key === 'CORS_ORIGIN') {
    shape.exactGenesis = value.split(',').map((part) => part.trim()).includes('https://genesisideas.school');
    shape.hasWildcard = value.split(',').map((part) => part.trim()).includes('*');
  } else if (key === 'STRIPE_SECRET_KEY') {
    shape.kind = value.startsWith('sk_live_') ? 'live' : value.startsWith('sk_test_') ? 'test' : 'unknown';
  } else if (key === 'STRIPE_WEBHOOK_SECRET') {
    shape.kind = value.startsWith('whsec_') ? 'webhook_secret' : 'unknown';
  } else if (key.startsWith('STRIPE_PRICE_')) {
    shape.kind = value.startsWith('price_') ? 'price_id' : 'unknown';
  } else if (key === 'ALLOW_UNVERIFIED_STRIPE_WEBHOOK') {
    shape.enabled = value === '1' || /^true$/i.test(value);
  }
  return shape;
}

function sh(cmd, cwd) {
  const result = spawnSync('bash', ['-lc', cmd], { cwd, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  return {
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

let env = {};
let envFilePresent = false;
try {
  env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  envFilePresent = true;
} catch {}

const keys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'NODE_ENV',
  'TRUST_PROXY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_SELF_PACED_MONTHLY',
  'STRIPE_PRICE_SELF_PACED_ANNUAL',
  'STRIPE_PRICE_GUIDED_MONTHLY',
  'STRIPE_PRICE_PREMIUM_MONTHLY',
  'STRIPE_PRICE_FOUNDERS_MONTHLY',
  'ALLOW_UNVERIFIED_STRIPE_WEBHOOK',
];
const envSummary = {};
for (const key of keys) envSummary[key] = safeShape(key, env[key] || '');

let table = { checked: false };
  if (env.DATABASE_URL) {
    const cmd = 'set -a; source .env; set +a; psql "$DATABASE_URL" -tAc "select coalesce(to_regclass(' + "'\\\"ProcessedStripeEvent\\\"'" + ')::text, ' + "'missing'" + ')"';
    const tableResult = sh(cmd, serverDir);
    table = {
      checked: true,
      status: tableResult.status,
      value: tableResult.stdout.split(/\r?\n/).pop() || '',
      stderrPresent: tableResult.status !== 0 && Boolean(tableResult.stderr),
    };
  }

const payload = {
  host: require('os').hostname(),
  repo,
  serverDir,
  envFilePresent,
  envSummary,
  table,
  git: {
    head: sh('git rev-parse HEAD', repo).stdout,
    statusShort: sh('git status --short', repo).stdout.split(/\r?\n/).filter(Boolean).slice(0, 50),
  },
  pm2: {
    list: sh('pm2 jlist', repo).stdout,
  },
};
process.stdout.write(JSON.stringify(payload));
`;
  const remoteCommand = `GIIS_REMOTE_REPO=${shellSingleQuote(REMOTE_REPO)} node <<'__GIIS_PAYMENT_ENV_AUDIT__'\n${inline}\n__GIIS_PAYMENT_ENV_AUDIT__`;
  return run('ssh', [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=8',
    '-i', KEY,
    `${USER}@${HOST}`,
    remoteCommand,
  ]);
}

function summarizePm2(raw) {
  try {
    const rows = JSON.parse(raw || '[]');
    const api = rows.find((row) => row.name === 'giis-api' || /giis/i.test(row.name || ''));
    if (!api) return { found: false };
    return {
      found: true,
      name: api.name,
      status: api.pm2_env?.status || '',
      cwd: api.pm2_env?.pm_cwd || '',
      script: api.pm2_env?.pm_exec_path || '',
      restarts: api.pm2_env?.restart_time,
      nodeVersion: api.pm2_env?.node_version || '',
    };
  } catch {
    return { found: false, parseError: true };
  }
}

function checkEnv(payload) {
  const results = [];
  if (!payload.envFilePresent) {
    return [fail('production-env-file', 'Production server/.env could not be read.', { remoteRepo: REMOTE_REPO })];
  }
  results.push(pass('production-env-file', 'Production server/.env exists and was parsed without printing secret values.', { remoteRepo: REMOTE_REPO }));

  const env = payload.envSummary || {};
  for (const key of REQUIRED) {
    const item = env[key] || {};
    if (item.present) {
      results.push(pass(`env-${key}`, `${key} is present in production server/.env.`, { shape: item }));
    } else if (key === 'STRIPE_PRICE_SELF_PACED_MONTHLY' && env[LEGACY_SELF_PACED]?.present) {
      results.push(warn(`env-${key}`, `${key} is missing, but legacy ${LEGACY_SELF_PACED} is present.`, { legacyFallbackPresent: true }));
    } else {
      results.push(fail(`env-${key}`, `${key} is missing from production server/.env.`));
    }
  }

  const db = env.DATABASE_URL || {};
  if (db.present && db.kind === 'postgres') {
    results.push(pass('env-DATABASE_URL-shape', 'DATABASE_URL uses PostgreSQL.', {
      kind: db.kind,
      includesLocalhost: db.includesLocalhost,
      hasSslMode: db.hasSslMode,
    }));
    if (db.includesLocalhost) {
      results.push(warn('env-DATABASE_URL-localhost', 'DATABASE_URL points to localhost; acceptable only if production Postgres runs on the Lightsail instance.', {
        includesLocalhost: true,
      }));
    }
  } else if (db.present) {
    results.push(fail('env-DATABASE_URL-shape', 'DATABASE_URL must use PostgreSQL.', { kind: db.kind }));
  }

  const jwt = env.JWT_SECRET || {};
  if (jwt.present && jwt.lengthOk) {
    results.push(pass('env-JWT_SECRET-shape', 'JWT_SECRET length looks acceptable.', { lengthOk: true }));
  } else if (jwt.present) {
    results.push(fail('env-JWT_SECRET-shape', 'JWT_SECRET is present but too short for production.', { lengthOk: false }));
  }

  if (env.NODE_ENV?.present) {
    results.push(env.NODE_ENV.kind
      ? pass('env-NODE_ENV', 'NODE_ENV is present.', { shape: env.NODE_ENV })
      : pass('env-NODE_ENV', 'NODE_ENV is present.', { present: true }));
  } else {
    results.push(warn('env-NODE_ENV', 'NODE_ENV is not set in production server/.env; PM2 may still set it externally.'));
  }

  if (env[OPTIONAL_PRICE]?.present) {
    results.push(pass(`env-${OPTIONAL_PRICE}`, `${OPTIONAL_PRICE} is present in production server/.env.`, { shape: env[OPTIONAL_PRICE] }));
  } else {
    results.push(warn(`env-${OPTIONAL_PRICE}`, `${OPTIONAL_PRICE} is missing; annual checkout should not be promoted yet.`));
  }

  const allowUnverified = env.ALLOW_UNVERIFIED_STRIPE_WEBHOOK || {};
  if (!allowUnverified.present || !allowUnverified.enabled) {
    results.push(pass('env-ALLOW_UNVERIFIED_STRIPE_WEBHOOK', 'ALLOW_UNVERIFIED_STRIPE_WEBHOOK is not enabled in production.'));
  } else {
    results.push(fail('env-ALLOW_UNVERIFIED_STRIPE_WEBHOOK', 'ALLOW_UNVERIFIED_STRIPE_WEBHOOK is enabled in production; webhook launch is unsafe.'));
  }

  const cors = env.CORS_ORIGIN || {};
  if (cors.present && cors.exactGenesis && !cors.hasWildcard) {
    results.push(pass('env-CORS_ORIGIN-shape', 'CORS_ORIGIN includes https://genesisideas.school and does not include wildcard.', { shape: cors }));
  } else {
    results.push(fail('env-CORS_ORIGIN-shape', 'CORS_ORIGIN must include https://genesisideas.school and must not include wildcard.', { shape: cors }));
  }

  const stripeSecret = env.STRIPE_SECRET_KEY || {};
  if (stripeSecret.present && stripeSecret.kind !== 'live') {
    results.push(fail('env-STRIPE_SECRET_KEY-live', 'STRIPE_SECRET_KEY is present but does not look like a live key.', { shape: stripeSecret }));
  } else if (stripeSecret.present) {
    results.push(pass('env-STRIPE_SECRET_KEY-live', 'STRIPE_SECRET_KEY looks like a live key.', { shape: stripeSecret }));
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET || {};
  if (webhookSecret.present && webhookSecret.kind === 'webhook_secret') {
    results.push(pass('env-STRIPE_WEBHOOK_SECRET-shape', 'STRIPE_WEBHOOK_SECRET looks like a Stripe webhook signing secret.', { shape: webhookSecret }));
  } else if (webhookSecret.present) {
    results.push(fail('env-STRIPE_WEBHOOK_SECRET-shape', 'STRIPE_WEBHOOK_SECRET is present but does not look like a Stripe webhook signing secret.', { shape: webhookSecret }));
  }

  for (const key of ['STRIPE_PRICE_SELF_PACED_MONTHLY', 'STRIPE_PRICE_GUIDED_MONTHLY', 'STRIPE_PRICE_PREMIUM_MONTHLY']) {
    const item = env[key] || {};
    if (item.present && item.kind !== 'price_id') {
      results.push(fail(`env-${key}-shape`, `${key} is present but does not look like a Stripe price ID.`, { shape: item }));
    } else if (item.present) {
      results.push(pass(`env-${key}-shape`, `${key} looks like a Stripe price ID.`, { shape: item }));
    }
  }
  return results;
}

function checkDb(payload) {
  const table = payload.table || {};
  if (!table.checked) return [warn('db-processed-stripe-event', 'ProcessedStripeEvent table was not checked because DATABASE_URL is missing.')];
  if (table.status !== 0) {
    return [fail('db-processed-stripe-event', 'ProcessedStripeEvent table check failed.', { stderrPresent: table.stderrPresent })];
  }
  if (table.value === 'ProcessedStripeEvent' || table.value === '"ProcessedStripeEvent"') {
    return [pass('db-processed-stripe-event', 'ProcessedStripeEvent table exists in production database.')];
  }
  return [fail('db-processed-stripe-event', 'ProcessedStripeEvent table is missing in production database.', { value: table.value })];
}

function checkRuntime(payload) {
  const results = [];
  const pm2 = summarizePm2(payload.pm2?.list);
  if (pm2.found && pm2.status === 'online') {
    results.push(pass('runtime-pm2-api-online', 'PM2 reports the GIIS API process online.', pm2));
  } else {
    results.push(fail('runtime-pm2-api-online', 'PM2 does not report the GIIS API process online.', pm2));
  }
  if (payload.git?.head) {
    results.push(pass('runtime-git-head', 'Production repo git HEAD was read.', { head: payload.git.head }));
  } else {
    results.push(warn('runtime-git-head', 'Production repo git HEAD could not be read.'));
  }
  if (payload.git?.statusShort?.length) {
    results.push(warn('runtime-git-dirty', 'Production repo has local dirty files.', {
      count: payload.git.statusShort.length,
      sample: payload.git.statusShort.slice(0, 10),
    }));
  } else {
    results.push(pass('runtime-git-dirty', 'Production repo has no reported local dirty files.'));
  }
  return results;
}

function buildNextActions(results) {
  const failed = new Set(results.filter((item) => item.status === 'fail').map((item) => item.id));
  const warned = new Set(results.filter((item) => item.status === 'warn').map((item) => item.id));
  const actions = [];
  if ([...failed].some((id) => id.includes('STRIPE_PRICE'))) {
    actions.push({
      id: 'add-live-stripe-price-env',
      kind: 'add_live_stripe_price_env',
      message: 'Add the missing live Stripe Price IDs to production server/.env before automated checkout.',
      evidence: [...failed].filter((id) => id.includes('STRIPE_PRICE')),
      runbook: 'docs/stripe-live-price-setup.md',
    });
  }
  if (warned.has(`env-${OPTIONAL_PRICE}`)) {
    actions.push({
      id: 'add-optional-annual-price-env',
      kind: 'add_optional_annual_price_env',
      message: 'Add the Self-Paced annual Stripe Price ID before promoting annual checkout.',
      evidence: [`env-${OPTIONAL_PRICE}`],
      runbook: 'docs/stripe-live-price-setup.md',
    });
  }
  if (failed.has('db-processed-stripe-event')) {
    actions.push({
      id: 'apply-production-db-push',
      kind: 'apply_production_db_push',
      message: 'Back up production DB, run server npm run db:push, then verify ProcessedStripeEvent.',
      evidence: ['db-processed-stripe-event'],
      runbook: 'docs/production-payment-deploy-runbook.md',
    });
  }
  if (failed.has('env-ALLOW_UNVERIFIED_STRIPE_WEBHOOK')) {
    actions.push({
      id: 'disable-unverified-webhook',
      kind: 'disable_unverified_webhook',
      message: 'Remove ALLOW_UNVERIFIED_STRIPE_WEBHOOK from production before accepting live Stripe webhooks.',
      evidence: ['env-ALLOW_UNVERIFIED_STRIPE_WEBHOOK'],
      runbook: 'docs/production-payment-deploy-runbook.md',
    });
  }
  return actions;
}

function writeReports(payload) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Production Payment Env QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Host: ${payload.host}`,
    `Remote repo: ${payload.remoteRepo}`,
    '',
    `Summary: ${payload.summary.pass} pass / ${payload.summary.warn} warn / ${payload.summary.fail} fail (${payload.summary.total} checks)`,
    '',
    '## Next Actions',
    '',
  ];
  if (payload.nextActions.length) {
    for (const action of payload.nextActions) {
      lines.push(`- **${action.kind}**: ${action.message}`);
      lines.push(`  - Evidence: ${action.evidence.join(', ')}`);
      lines.push(`  - Runbook: ${action.runbook}`);
    }
  } else {
    lines.push('- No production env repair action is required by this gate.');
  }
  lines.push('', '| Check | Status | Notes |', '| --- | --- | --- |');
  for (const item of payload.results) {
    const details = item.details ? JSON.stringify(item.details).replace(/\|/g, '/') : '';
    lines.push(`| ${item.id} | ${item.status} | ${item.message}${details ? `<br><code>${details}</code>` : ''} |`);
  }
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
}

function main() {
  const ssh = sshReadOnly();
  let results = [];
  let remotePayload = null;
  if (ssh.status !== 0) {
    results.push(fail('ssh-production-env-read', 'Read-only SSH payment env check failed.', {
      status: ssh.status,
      stderr: ssh.stderr.trim().slice(0, 1000),
      stdout: ssh.stdout.trim().slice(0, 1000),
    }));
  } else {
    try {
      remotePayload = JSON.parse(ssh.stdout);
      results.push(pass('ssh-production-env-read', 'Read-only SSH payment env check completed.', { host: HOST, user: USER }));
      results.push(...checkEnv(remotePayload));
      results.push(...checkDb(remotePayload));
      results.push(...checkRuntime(remotePayload));
    } catch (error) {
      results.push(fail('ssh-production-env-parse', 'Could not parse read-only SSH payment env payload.', {
        error: error.message,
        stdout: ssh.stdout.trim().slice(0, 1000),
      }));
    }
  }

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === 'pass').length,
    warn: results.filter((item) => item.status === 'warn').length,
    fail: results.filter((item) => item.status === 'fail').length,
  };
  const payload = {
    generatedAt: new Date().toISOString(),
    host: HOST,
    user: USER,
    remoteRepo: REMOTE_REPO,
    summary,
    results,
    nextActions: buildNextActions(results),
  };
  writeReports(payload);

  console.log(`Production payment env QA: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const item of results.filter((entry) => entry.status === 'fail')) {
    console.log(`\n[FAIL] ${item.id}`);
    console.log(`  ${item.message}`);
  }
  if (summary.fail) process.exit(1);
}

main();
