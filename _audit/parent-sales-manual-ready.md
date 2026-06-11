# Parent Sales Manual Readiness QA

Generated: 2026-06-11T13:53:25.598Z
Base URL: https://genesisideas.school
API URL: https://api.genesisideas.school

Verdict: manual_sales_ready_with_recorded_warnings
Summary: 8 pass / 2 warn / 0 fail (10 checks)

| Check | Status | Notes |
| --- | --- | --- |
| production-proof-path | pass | Production public proof path passes live smoke.<br><code>{"baseUrl":"https://genesisideas.school","summary":{"total":8,"pass":8,"fail":0}}</code> |
| static-sales-launch | pass | Static parent sales launch gate passes.<br><code>{"stdout":"Parent sales launch audit passed: 24/24 checks."}</code> |
| production-contact-form-markup | pass | Production homepage includes Netlify contact form markup.<br><code>{"url":"https://genesisideas.school/","status":200}</code> |
| production-consultation-form-markup | pass | Production consultation page includes Netlify consultation form markup.<br><code>{"url":"https://genesisideas.school/consultation","status":200}</code> |
| consultation-email-fallback | pass | Consultation page exposes admissions email fallback.<br><code>{"url":"https://genesisideas.school/consultation"}</code> |
| netlify-notification-unverified | warn | Netlify form email notifications cannot be verified from this repo; confirm notification or daily submissions owner before relying on inbound leads.<br><code>{"forms":["consultation","contact"],"inbox":"admissions@genesisideas.school"}</code> |
| manual-payment-handoff-doc | pass | Manual payment handoff runbook is present and conservative.<br><code>{}</code> |
| consultation-response-sop | pass | Consultation response SOP is present and conservative.<br><code>{}</code> |
| launch-checklist-boundary | pass | Launch checklist separates manual consultation sales from automated payment readiness.<br><code>{}</code> |
| payment-automation-boundary | warn | Automated payment is not ready; manual sales may proceed only through the admissions payment handoff.<br><code>{"summary":{"total":7,"pass":2,"warn":1,"fail":4},"failures":["guided_monthly-configured","premium_monthly-configured","direct-api-health","stripe-webhook-fail-closed"]}</code> |
