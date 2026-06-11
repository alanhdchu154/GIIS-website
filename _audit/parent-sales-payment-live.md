# Parent Sales Payment Live QA

Generated: 2026-06-11T13:40:44.344Z
Base URL: https://genesisideas.school
API URL: https://api.genesisideas.school

Summary: 2 pass / 1 warn / 4 fail (7 checks)

| Check | Status | Notes |
| --- | --- | --- |
| proxy-checkout-tiers | pass | Public checkout tiers endpoint is reachable through the production site proxy.<br><code>{"url":"https://genesisideas.school/api/checkout/tiers","status":200}</code> |
| self_paced_monthly-configured | pass | Self-Paced $49/month has a production Stripe price configured.<br><code>{"key":"self_paced_monthly","tier":{"label":"Self-Paced Founders · $49/mo","mode":"subscription","maxStudents":1,"available":true,"public":true}}</code> |
| guided_monthly-configured | fail | Guided $149/month is visible in pricing but has no Stripe price configured in production.<br><code>{"key":"guided_monthly","tier":{"label":"Guided · $149/mo","mode":"subscription","maxStudents":1,"available":false,"public":true}}</code> |
| premium_monthly-configured | fail | Premium $299/month is visible in pricing but has no Stripe price configured in production.<br><code>{"key":"premium_monthly","tier":{"label":"Premium / College Pathway · $299/mo","mode":"subscription","maxStudents":1,"available":false,"public":true}}</code> |
| self-paced-annual-configured | warn | Self-Paced annual is listed but has no production Stripe price configured.<br><code>{"key":"self_paced_annual","tier":{"label":"Self-Paced Founders Annual · $499/yr","mode":"subscription","maxStudents":1,"available":false,"public":true}}</code> |
| direct-api-health | fail | Direct API health endpoint is not reachable over HTTPS.<br><code>{"url":"https://api.genesisideas.school/health","error":"fetch failed","cause":"connect ECONNREFUSED 54.163.81.228:443","code":"ECONNREFUSED"}</code> |
| stripe-webhook-fail-closed | fail | Stripe webhook endpoint is not reachable over HTTPS.<br><code>{"url":"https://api.genesisideas.school/api/webhooks/stripe","error":"fetch failed","cause":"connect ECONNREFUSED 54.163.81.228:443","code":"ECONNREFUSED"}</code> |
