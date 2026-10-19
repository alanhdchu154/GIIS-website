# Parent Sales Payment Live QA

Generated: 2026-10-19T03:07:24.705Z
Base URL: https://genesisideas.school
API URL: https://api.genesisideas.school

Summary: 6 pass / 0 warn / 0 fail (6 checks)

## Operator Next Actions

- No operator action is required by this gate.

| Check | Status | Notes |
| --- | --- | --- |
| proxy-checkout-tiers | pass | Public checkout tiers endpoint is reachable through the production site proxy.<br><code>{"url":"https://genesisideas.school/api/checkout/tiers","status":200}</code> |
| self_paced_monthly-configured | pass | Self-Paced $49/month has a production Stripe price configured.<br><code>{"key":"self_paced_monthly","tier":{"label":"Self-Paced Founders · $49/mo","mode":"subscription","maxStudents":1,"available":true,"public":true}}</code> |
| guided_monthly-configured | pass | Guided $149/month has a production Stripe price configured.<br><code>{"key":"guided_monthly","tier":{"label":"Guided · $149/mo","mode":"subscription","maxStudents":1,"available":true,"public":true}}</code> |
| premium_monthly-configured | pass | Premium $299/month has a production Stripe price configured.<br><code>{"key":"premium_monthly","tier":{"label":"Premium / College Pathway · $299/mo","mode":"subscription","maxStudents":1,"available":true,"public":true}}</code> |
| direct-api-health | pass | Direct API health endpoint is reachable over HTTPS.<br><code>{"url":"https://api.genesisideas.school/health","status":200,"body":{"ok":true,"service":"giis-transcript-api"}}</code> |
| stripe-webhook-fail-closed | pass | Stripe webhook endpoint is reachable and rejects unsigned requests.<br><code>{"url":"https://api.genesisideas.school/api/webhooks/stripe","status":400,"body":"Webhook signature missing."}</code> |
