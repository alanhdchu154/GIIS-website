#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'production-api-proxy.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'production-api-proxy.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const DOMAIN = argValue('--domain', 'api.genesisideas.school');
const HOST = argValue('--host', process.env.GIIS_LIGHTSAIL_HOST || '54.163.81.228');
const USER = argValue('--user', process.env.GIIS_LIGHTSAIL_USER || 'ubuntu');
const KEY = argValue('--key', process.env.GIIS_LIGHTSAIL_KEY || path.join(process.env.HOME || '', '.ssh', 'LightsailDefaultKey-us-east-1.pem'));
const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);

function result(id, status, message, details = {}) {
  return { id, status, message, details };
}

function pass(id, message, details = {}) {
  return result(id, 'pass', message, details);
}

function fail(id, message, details = {}) {
  return result(id, 'fail', message, details);
}

function warn(id, message, details = {}) {
  return result(id, 'warn', message, details);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

async function fetchStatus(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 8000));
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status, body: (await response.text()).slice(0, 500) };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      cause: error.cause?.message,
      code: error.cause?.code,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function section(text, name) {
  const pattern = new RegExp(`__GIIS_${name}_START__\\n([\\s\\S]*?)\\n__GIIS_${name}_END__`);
  const match = text.match(pattern);
  return match ? match[1] : '';
}

function sshReadOnly() {
  const script = `
set +e
printf "__GIIS_LOCAL_HEALTH_START__\\n"
curl -sS -i --max-time 5 http://127.0.0.1:4000/health
printf "\\n__GIIS_LOCAL_HEALTH_END__\\n"
printf "__GIIS_HOST80_HEALTH_START__\\n"
curl -sS -i --max-time 5 -H "Host: ${DOMAIN}" http://127.0.0.1/health
printf "\\n__GIIS_HOST80_HEALTH_END__\\n"
printf "__GIIS_LISTENERS_START__\\n"
sudo ss -ltnp | grep -E ":(80|443|4000)" || true
printf "\\n__GIIS_LISTENERS_END__\\n"
printf "__GIIS_NGINX_TEST_START__\\n"
sudo nginx -t 2>&1
printf "\\n__GIIS_NGINX_TEST_END__\\n"
printf "__GIIS_NGINX_CONFIG_START__\\n"
sudo nginx -T 2>/dev/null | grep -A10 -B4 -E "server_name ${DOMAIN}|proxy_pass http://127\\\\.0\\\\.0\\\\.1|listen 443"
printf "\\n__GIIS_NGINX_CONFIG_END__\\n"
printf "__GIIS_PM2_START__\\n"
pm2 list
printf "\\n__GIIS_PM2_END__\\n"
printf "__GIIS_SYSTEM_START__\\n"
hostname
systemctl is-active nginx || true
printf "\\n__GIIS_SYSTEM_END__\\n"
`;
  return run('ssh', [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=8',
    '-i', KEY,
    `${USER}@${HOST}`,
    script,
  ]);
}

async function main() {
  const results = [];

  let addresses = [];
  try {
    addresses = await dns.resolve4(DOMAIN);
    results.push(addresses.includes(HOST)
      ? pass('dns-points-to-host', `${DOMAIN} resolves to the expected Lightsail host.`, { domain: DOMAIN, host: HOST, addresses })
      : warn('dns-points-to-host', `${DOMAIN} does not resolve to the expected host.`, { domain: DOMAIN, host: HOST, addresses }));
  } catch (error) {
    results.push(fail('dns-resolves', `${DOMAIN} did not resolve.`, { domain: DOMAIN, error: error.message }));
  }

  const httpsHealth = await fetchStatus(`https://${DOMAIN}/health`);
  results.push(httpsHealth.ok
    ? pass('external-https-health', `https://${DOMAIN}/health returns healthy.`, httpsHealth)
    : fail('external-https-health', `https://${DOMAIN}/health is not reachable or not healthy.`, httpsHealth));

  const unsignedWebhook = await fetchStatus(`https://${DOMAIN}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  if (unsignedWebhook.status >= 400 && unsignedWebhook.status < 500) {
    results.push(pass('external-webhook-fail-closed', 'Unsigned webhook requests are rejected over HTTPS.', unsignedWebhook));
  } else if (unsignedWebhook.status === 0) {
    results.push(fail('external-webhook-fail-closed', 'Webhook endpoint is not reachable over HTTPS.', unsignedWebhook));
  } else {
    results.push(fail('external-webhook-fail-closed', 'Webhook endpoint did not fail closed for an unsigned request.', unsignedWebhook));
  }

  const ssh = sshReadOnly();
  if (ssh.status !== 0) {
    results.push(fail('ssh-readonly-check', 'Read-only SSH production check failed.', {
      status: ssh.status,
      stderr: ssh.stderr.trim().slice(0, 1000),
      stdout: ssh.stdout.trim().slice(0, 1000),
    }));
  } else {
    results.push(pass('ssh-readonly-check', 'Read-only SSH production check completed.', { host: HOST, user: USER }));
    const stdout = ssh.stdout;
    const localHealth = section(stdout, 'LOCAL_HEALTH');
    const host80Health = section(stdout, 'HOST80_HEALTH');
    const listeners = section(stdout, 'LISTENERS');
    const nginxTest = section(stdout, 'NGINX_TEST');
    const nginxConfig = section(stdout, 'NGINX_CONFIG');
    const pm2 = section(stdout, 'PM2');
    const system = section(stdout, 'SYSTEM');

    results.push(/HTTP\/1\.1 200/.test(localHealth)
      ? pass('server-local-api-health', 'Node API is healthy locally on port 4000.', { excerpt: localHealth.slice(0, 300) })
      : fail('server-local-api-health', 'Node API is not healthy locally on port 4000.', { excerpt: localHealth.slice(0, 500) }));

    results.push(/active/.test(system)
      ? pass('server-nginx-active', 'nginx service is active.', { excerpt: system.trim() })
      : fail('server-nginx-active', 'nginx service is not active.', { excerpt: system.trim() }));

    results.push(/giis-api[\s\S]*online/.test(pm2)
      ? pass('server-pm2-api-online', 'PM2 reports giis-api online.', { excerpt: pm2.replace(/\x1b\[[0-9;]*m/g, '').slice(0, 800) })
      : fail('server-pm2-api-online', 'PM2 does not report giis-api online.', { excerpt: pm2.replace(/\x1b\[[0-9;]*m/g, '').slice(0, 800) }));

    results.push(/:4000\b/.test(listeners)
      ? pass('server-listens-4000', 'Node API has an active 4000 listener.', { listeners })
      : fail('server-listens-4000', 'No active 4000 listener was found.', { listeners }));

    results.push(/:443\b/.test(listeners)
      ? pass('server-listens-443', 'nginx has an active 443 listener.', { listeners })
      : fail('server-listens-443', 'No active 443 listener was found.', { listeners }));

    results.push(/HTTP\/1\.1 200/.test(host80Health)
      ? pass('server-host80-health', 'nginx routes Host api.genesisideas.school /health successfully over port 80.', { excerpt: host80Health.slice(0, 300) })
      : fail('server-host80-health', 'nginx does not route Host api.genesisideas.school /health successfully over port 80.', { excerpt: host80Health.slice(0, 500) }));

    results.push(/nginx: configuration file .* test is successful/.test(nginxTest)
      ? pass('server-nginx-config-valid', 'nginx configuration test passes.', { excerpt: nginxTest.trim() })
      : fail('server-nginx-config-valid', 'nginx configuration test does not pass.', { excerpt: nginxTest.trim() }));

    results.push(/proxy_pass http:\/\/127\.0\.0\.1:8080/.test(nginxConfig)
      ? fail('server-api-root-proxy-port', 'nginx config still contains a root API proxy to 127.0.0.1:8080.', { excerpt: nginxConfig.slice(0, 1200) })
      : pass('server-api-root-proxy-port', 'No root API proxy to 127.0.0.1:8080 was found in the inspected nginx config.', { excerpt: nginxConfig.slice(0, 1200) }));
  }

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === 'pass').length,
    warn: results.filter((item) => item.status === 'warn').length,
    fail: results.filter((item) => item.status === 'fail').length,
  };
  const payload = {
    generatedAt: new Date().toISOString(),
    domain: DOMAIN,
    host: HOST,
    user: USER,
    summary,
    results,
    nextActions: buildNextActions(results),
  };

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Production API Proxy QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Domain: ${DOMAIN}`,
    `Host: ${HOST}`,
    '',
    `Summary: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`,
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
    lines.push('- No proxy repair action is required by this gate.');
  }
  lines.push('', '| Check | Status | Notes |', '| --- | --- | --- |');
  for (const item of results) {
    const details = item.details ? JSON.stringify(item.details).replace(/\|/g, '/') : '';
    lines.push(`| ${item.id} | ${item.status} | ${item.message}${details ? `<br><code>${details}</code>` : ''} |`);
  }
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);

  console.log(`Production API proxy QA: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const item of results.filter((entry) => entry.status === 'fail')) {
    console.log(`\n[FAIL] ${item.id}`);
    console.log(`  ${item.message}`);
  }
  if (summary.fail) process.exit(1);
}

function buildNextActions(results) {
  const failed = new Set(results.filter((item) => item.status === 'fail').map((item) => item.id));
  const actions = [];
  if (failed.has('external-https-health') || failed.has('external-webhook-fail-closed') || failed.has('server-listens-443')) {
    actions.push({
      id: 'restore-api-https',
      kind: 'restore_api_https',
      message: 'Repair nginx/Certbot so api.genesisideas.school has an active HTTPS listener and serves /health over 443.',
      evidence: ['external-https-health', 'external-webhook-fail-closed', 'server-listens-443'].filter((id) => failed.has(id)),
      runbook: 'docs/production-api-proxy-repair.md',
    });
  }
  if (failed.has('server-host80-health') || failed.has('server-api-root-proxy-port')) {
    actions.push({
      id: 'repair-api-proxy-upstream',
      kind: 'repair_api_proxy_upstream',
      message: 'Repair nginx routing so the API host /health route proxies to the Node API on port 4000, not stale port 8080.',
      evidence: ['server-host80-health', 'server-api-root-proxy-port'].filter((id) => failed.has(id)),
      runbook: 'docs/production-api-proxy-repair.md',
    });
  }
  return actions;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
