# Parent Sales Manual Readiness QA

Generated: 2026-06-11T14:04:21.189Z
Base URL: https://genesisideas.school
API URL: https://api.genesisideas.school

Verdict: manual_sales_ready_with_recorded_warnings
Summary: 8 pass / 4 warn / 0 fail (12 checks)

| Check | Status | Notes |
| --- | --- | --- |
| production-proof-path | pass | Production public proof path passes live smoke.<br><code>{"baseUrl":"https://genesisideas.school","summary":{"total":8,"pass":8,"fail":0}}</code> |
| static-sales-launch | pass | Static parent sales launch gate passes.<br><code>{"stdout":"Parent sales launch audit passed: 24/24 checks."}</code> |
| production-contact-form-markup | pass | Production homepage includes Netlify contact form markup.<br><code>{"url":"https://genesisideas.school/","status":200}</code> |
| production-consultation-form-markup | pass | Production consultation page includes Netlify consultation form markup.<br><code>{"url":"https://genesisideas.school/consultation","status":200}</code> |
| consultation-email-fallback | pass | Consultation page exposes admissions email fallback.<br><code>{"url":"https://genesisideas.school/consultation"}</code> |
| lead-capture-owner | warn | Netlify form email notifications cannot be verified from this repo, and no daily submissions owner is recorded yet.<br><code>{"forms":["consultation","contact"],"inbox":"admissions@genesisideas.school","decisionFile":"docs/parent-sales-owner-decisions.json"}</code> |
| manual-payment-handoff-doc | pass | Manual payment handoff runbook is present and conservative.<br><code>{}</code> |
| consultation-response-sop | pass | Consultation response SOP is present and conservative.<br><code>{}</code> |
| launch-checklist-boundary | pass | Launch checklist separates manual consultation sales from automated payment readiness.<br><code>{}</code> |
| manual-stripe-owner | warn | Manual Stripe invoice/payment-link owner is not fully assigned yet.<br><code>{"stripeInvoiceOwner":"","authorizedByAlan":false,"decisionFile":"docs/parent-sales-owner-decisions.json"}</code> |
| response-owners | warn | First response or WeChat follow-up owner is not fully assigned yet.<br><code>{"firstResponseOwner":"","wechatFollowUpOwner":"","principalEscalationOwner":"Shiyu Zhang, Ph.D.","decisionFile":"docs/parent-sales-owner-decisions.json"}</code> |
| payment-automation-boundary | warn | Automated payment is not ready; manual sales may proceed only through the admissions payment handoff.<br><code>{"summary":{"total":7,"pass":2,"warn":1,"fail":4},"failures":["guided_monthly-configured","premium_monthly-configured","direct-api-health","stripe-webhook-fail-closed"]}</code> |
