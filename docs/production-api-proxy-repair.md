# Production API Proxy Repair

Last updated: 2026-06-11

Use this when `npm run audit:sales-payment-live` reports that
`https://api.genesisideas.school` is unreachable or that the Stripe webhook
endpoint cannot be reached over HTTPS.

Start with the read-only audit:

```bash
npm run audit:production-api-proxy
```

This command checks DNS, external HTTPS reachability, local API health on
Lightsail, nginx listeners, nginx host routing, PM2 status, and stale upstream
ports. It does not edit production files.

## Current Evidence

Read-only production inspection on 2026-06-11 found:

- DNS: `api.genesisideas.school` points to `54.163.81.228`.
- PM2: `giis-api` is online.
- Node API: `node /home/ubuntu/GIIS-website/server/src/index.js`.
- API port: Node listens on `*:4000`.
- Local API health on the server: `http://127.0.0.1:4000/health` returns 200.
- Nginx runtime: listens on port 80, but not on port 443.
- Nginx config: contains Certbot-managed `listen 443 ssl` lines, but the active
  nginx listener is not currently bound to `443`.
- Nginx host health: `Host: api.genesisideas.school` over port 80 returns 502.
- Nginx config evidence: API server block proxies to `http://127.0.0.1:8080`,
  while the actual API listens on `4000`.

Conclusion: the repo API health route is not the blocker. Production nginx/SSL
routing must be repaired before automated checkout and Stripe webhooks are live.

## Safe Repair Window

Do this only during a backend deploy/repair window. Do not combine it with seed
data changes.

1. Confirm the API is locally healthy on Lightsail.

   ```bash
   curl -fsS http://127.0.0.1:4000/health
   pm2 describe giis-api
   sudo ss -ltnp | grep -E ':(80|443|4000)'
   ```

2. Back up nginx config before editing.

   ```bash
   sudo mkdir -p /etc/nginx/backups
   sudo cp /etc/nginx/sites-enabled/default \
     "/etc/nginx/backups/default.$(date +%Y%m%d-%H%M%S).bak"
   sudo nginx -T > "/tmp/nginx-before-$(date +%Y%m%d-%H%M%S).txt"
   ```

   Do not place `.bak` files under `sites-enabled/`; this nginx install includes
   every file in that directory, so a backup there can create duplicate server
   blocks and make `nginx -t` fail.

3. Change the API proxy upstream from port `8080` to port `4000`.

   Expected location block:

   ```nginx
   server_name api.genesisideas.school;

   location / {
     proxy_pass http://127.0.0.1:4000;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

4. Restore HTTPS for `api.genesisideas.school`.

   If Certbot already manages the domain, use the existing Certbot/nginx flow
   on the server. If no certificate exists, create one for:

   ```text
   api.genesisideas.school
   ```

   Nginx must listen on `443 ssl` for this host. Do not use a self-signed cert
   for parent payment or Stripe webhooks.

5. Validate and reload nginx.

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. Smoke from the server and from your local machine.

   ```bash
   curl -fsS http://127.0.0.1:4000/health
   curl -fsS https://api.genesisideas.school/health
   curl -i -X POST https://api.genesisideas.school/api/webhooks/stripe \
     -H 'content-type: application/json' \
     --data '{}'
   npm run audit:sales-payment-live
   ```

   Also rerun the focused proxy audit:

   ```bash
   npm run audit:production-api-proxy
   ```

Unsigned webhook requests should return a 4xx response. A 2xx unsigned webhook
response is unsafe and blocks automated payment launch.

## Stop Conditions

Stop and roll back the nginx config backup if:

- `sudo nginx -t` fails,
- `https://api.genesisideas.school/health` still fails after reload,
- the webhook endpoint returns 2xx for an unsigned request,
- parent/admin login behavior changes unexpectedly,
- Stripe signed test event does not return 200 after webhook secret is checked.
