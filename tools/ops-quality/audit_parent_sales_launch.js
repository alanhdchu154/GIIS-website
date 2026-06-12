#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const files = {
  app: read('src/App.js'),
  homeMain: read('src/components/pages/Homepage/HomepageMain.js'),
  homeHero: read('src/components/pages/Homepage/Homepage/HeroSection.js'),
  contact: read('src/components/pages/Homepage/Homepage/ContactForm.js'),
  apply: read('src/components/pages/Apply/ApplyForm.js'),
  navStrings: read('src/i18n/siteStrings.js'),
  pricing: read('src/components/pages/Pricing/PricingPage.js'),
  trust: read('src/components/pages/TrustCenter/TrustCenterPage.js'),
  admission: read('src/components/pages/Admission/AdmissionMain.js'),
  consultation: read('src/components/pages/Consultation/ConsultationPage.js'),
  graduates: read('src/components/pages/Graduates/GraduateStoriesPage.js'),
  parentDemo: read('src/components/pages/Parent/ParentDashboardDemo.js'),
  applicationsQueue: read('src/components/pages/Admin/ApplicationsQueue.js'),
  applicationsRoute: read('server/src/routes/applications.js'),
  publicIndex: read('public/index.html'),
  paymentRunbook: read('docs/production-payment-deploy-runbook.md'),
  stripeLivePriceSetup: read('docs/stripe-live-price-setup.md'),
  productionApiProxyRepair: read('docs/production-api-proxy-repair.md'),
  productionApiProxyAudit: read('tools/ops-quality/audit_production_api_proxy.js'),
  productionPaymentEnvAudit: read('tools/ops-quality/audit_production_payment_env.js'),
  paymentHandoff: read('docs/admissions-payment-handoff-runbook.md'),
  consultationSop: read('docs/admissions-consultation-response-sop.md'),
  outreachPacket: read('docs/parent-sales-outreach-packet.md'),
  dailyOperatorChecklist: read('docs/parent-sales-daily-operator-checklist.md'),
  dailyOperatorLogTemplate: read('docs/templates/parent-sales-daily-operator-log.md'),
  operatorLogGenerator: read('tools/ops-quality/generate_parent_sales_operator_log.js'),
  startDayGate: read('tools/ops-quality/start_parent_sales_day.js'),
  readyTodayGate: read('tools/ops-quality/audit_parent_sales_ready_today.js'),
  ownerDecisionGate: read('tools/ops-quality/audit_parent_sales_owner_decisions.js'),
  launchModeGate: read('tools/ops-quality/audit_parent_sales_launch_mode.js'),
  parentJourneyAcceptance: read('tools/ops-quality/audit_parent_journey_acceptance.js'),
  ownerDecisions: read('docs/parent-sales-owner-decisions.json'),
  packageJson: read('package.json'),
};

const checks = [
  {
    id: 'homepage-consultation-first',
    file: 'src/components/pages/Homepage/Homepage/HeroSection.js',
    ok: /to="\/consultation"/.test(files.homeHero) &&
      /Book a Free Consultation/.test(files.homeHero) &&
      /Talk to the school before you apply/.test(files.homeHero) &&
      /No payment is collected until the enrollment path is reviewed/.test(files.homeHero) &&
      /to="\/trust-center"/.test(files.homeHero),
    message: 'Homepage hero must route families to consultation/trust before payment pressure.',
  },
  {
    id: 'homepage-parent-decision-path',
    file: 'src/components/pages/Homepage/HomepageMain.js',
    ok: /Before You Pay/.test(files.homeMain) &&
      /to: '\/trust-center'/.test(files.homeMain) &&
      /to: '\/parent\/demo'/.test(files.homeMain) &&
      /to: '\/pricing'/.test(files.homeMain) &&
      /to="\/apply"/.test(files.homeMain),
    message: 'Homepage must expose the parent decision path: trust, parent visibility, pricing, then apply.',
  },
  {
    id: 'route-consultation',
    file: 'src/App.js',
    ok: /path="\/consultation"/.test(files.app) && /ConsultationPage/.test(files.app),
    message: 'Consultation page must be routable before frontend launch.',
  },
  {
    id: 'route-graduates',
    file: 'src/App.js',
    ok: /path="\/graduates"/.test(files.app) && /GraduateStoriesPage/.test(files.app),
    message: 'Graduate stories page must be routable before frontend launch.',
  },
  {
    id: 'route-apply',
    file: 'src/App.js',
    ok: /path="\/apply"/.test(files.app) && /ApplyForm/.test(files.app),
    message: 'Application path review must be routable before frontend launch.',
  },
  {
    id: 'nav-consultation',
    file: 'src/i18n/siteStrings.js',
    ok: /Book a Consultation/.test(files.navStrings) && /预约咨询/.test(files.navStrings) && /to: '\/consultation'/.test(files.navStrings),
    message: 'Admission navigation must expose consultation in both languages.',
  },
  {
    id: 'nav-graduates',
    file: 'src/i18n/siteStrings.js',
    ok: /Graduate Stories/.test(files.navStrings) && /毕业生足迹/.test(files.navStrings) && /to: '\/graduates'/.test(files.navStrings),
    message: 'Resources navigation must expose graduate stories in both languages.',
  },
  {
    id: 'pricing-apply-before-pay',
    file: 'src/components/pages/Pricing/PricingPage.js',
    ok: /Payment happens after the enrollment path is clear/.test(files.pricing) &&
      /Start with the path review, not checkout/.test(files.pricing) &&
      /to="\/apply"/.test(files.pricing) &&
      /to="\/consultation"/.test(files.pricing),
    message: 'Pricing must route families to application/consultation before checkout.',
  },
  {
    id: 'apply-path-review-before-pay',
    file: 'src/components/pages/Apply/ApplyForm.js',
    ok: /New student/.test(files.apply) &&
      /Transfer student/.test(files.apply) &&
      /No payment is collected here/.test(files.apply) &&
      /within one business day/.test(files.apply) &&
      /to="\/consultation"/.test(files.apply) &&
      /official transcripts or verifiable school records/.test(files.apply),
    message: 'Apply page must clearly separate new/transfer paths, consultation fallback, and no-payment-before-review.',
  },
  {
    id: 'apply-submit-failure-handling',
    file: 'src/components/pages/Apply/ApplyForm.js',
    ok: /\/api\/applications/.test(files.apply) &&
      /res\.json\(\)\.catch\(\(\) => \(\{\}\)\)/.test(files.apply) &&
      /setServerError/.test(files.apply) &&
      /!res\.ok/.test(files.apply) &&
      /setSubmitted\(true\)/.test(files.apply),
    message: 'Apply form must submit to applications API, parse errors safely, and only show success after an OK response.',
  },
  {
    id: 'pricing-no-public-checkout-call',
    file: 'src/components/pages/Pricing/PricingPage.js',
    ok: !/create-session|checkout\/create-session|window\.location|stripe/i.test(files.pricing),
    message: 'Public pricing page must not directly start Stripe checkout before path review.',
  },
  {
    id: 'consultation-netlify-form',
    file: 'src/components/pages/Consultation/ConsultationPage.js',
    ok: /name="consultation"/.test(files.consultation) &&
      /data-netlify="true"/.test(files.consultation) &&
      /name="form-name" value="consultation"/.test(files.consultation) &&
      /parentName/.test(files.consultation) &&
      /studentSituation/.test(files.consultation) &&
      /transcriptAvailable/.test(files.consultation) &&
      /desiredStart/.test(files.consultation) &&
      /preferredTime/.test(files.consultation),
    message: 'Consultation page must submit the Netlify consultation form fields.',
  },
  {
    id: 'consultation-submit-failure-handling',
    file: 'src/components/pages/Consultation/ConsultationPage.js',
    ok: /response\.ok/.test(files.consultation) &&
      /setSubmitError/.test(files.consultation) &&
      /disabled=\{isSubmitting\}/.test(files.consultation) &&
      /Submitting request/.test(files.consultation) &&
      !/catch\(\(\) => setSubmitted\(true\)\)/.test(files.consultation),
    message: 'Consultation form must only show success after a successful submit and must expose retry/error state.',
  },
  {
    id: 'consultation-hidden-form',
    file: 'public/index.html',
    ok: /<form name="consultation"[\s\S]*data-netlify="true"[\s\S]*form-name[\s\S]*bot-field[\s\S]*parentName[\s\S]*studentSituation[\s\S]*transcriptAvailable[\s\S]*desiredStart[\s\S]*preferredTime[\s\S]*<\/form>/.test(files.publicIndex),
    message: 'Netlify needs a hidden consultation form in public/index.html.',
  },
  {
    id: 'contact-netlify-form',
    file: 'src/components/pages/Homepage/Homepage/ContactForm.js',
    ok: /name="contact"/.test(files.contact) &&
      /data-netlify="true"/.test(files.contact) &&
      /name="form-name" value="contact"/.test(files.contact) &&
      /studentName/.test(files.contact) &&
      /parentWeChat/.test(files.contact) &&
      /name="pathway"/.test(files.contact) &&
      /name="grade"/.test(files.contact),
    message: 'Homepage contact form must submit the Netlify contact form fields.',
  },
  {
    id: 'contact-submit-failure-handling',
    file: 'src/components/pages/Homepage/Homepage/ContactForm.js',
    ok: /response\.ok/.test(files.contact) &&
      /setSubmitError/.test(files.contact) &&
      /disabled=\{isSubmitting\}/.test(files.contact) &&
      /Submitting inquiry/.test(files.contact) &&
      !/catch\(\(\) => setSubmitted\(true\)\)/.test(files.contact),
    message: 'Homepage contact form must only show success after a successful submit and must expose retry/error state.',
  },
  {
    id: 'contact-hidden-form',
    file: 'public/index.html',
    ok: /<form name="contact"[\s\S]*data-netlify="true"[\s\S]*form-name[\s\S]*bot-field[\s\S]*studentName[\s\S]*parentWeChat[\s\S]*email[\s\S]*pathway[\s\S]*grade[\s\S]*message[\s\S]*<\/form>/.test(files.publicIndex),
    message: 'Netlify needs a hidden contact form whose fields match the homepage contact form.',
  },
  {
    id: 'trust-links-consultation',
    file: 'src/components/pages/TrustCenter/TrustCenterPage.js',
    ok: /to="\/consultation"/.test(files.trust) && /Talk to the principal first/.test(files.trust),
    message: 'Trust Center must offer a human consultation path.',
  },
  {
    id: 'admission-links-consultation',
    file: 'src/components/pages/Admission/AdmissionMain.js',
    ok: /to="\/consultation"/.test(files.admission) && /Book a Free Consultation/.test(files.admission),
    message: 'Admission page must expose consultation alongside apply/transfer paths.',
  },
  {
    id: 'graduates-conservative',
    file: 'src/components/pages/Graduates/GraduateStoriesPage.js',
    ok: /reported university offers/i.test(files.graduates) &&
      /GIIS does not guarantee admission results/.test(files.graduates) &&
      /Y\. Yang/.test(files.graduates) &&
      /B\. Lu/.test(files.graduates),
    message: 'Graduate stories must use conservative reported-outcome wording and privacy-shortened names.',
  },
  {
    id: 'parent-demo-cta',
    file: 'src/components/pages/Parent/ParentDashboardDemo.js',
    ok: /Guided support is \$149\/month/.test(files.parentDemo) &&
      /to="\/pricing"/.test(files.parentDemo) &&
      /to="\/admission"/.test(files.parentDemo),
    message: 'Parent demo must connect transparency proof to admission/pricing.',
  },
  {
    id: 'payment-runbook',
    file: 'docs/production-payment-deploy-runbook.md',
    ok: /ProcessedStripeEvent/.test(files.paymentRunbook) &&
      /STRIPE_WEBHOOK_SECRET/.test(files.paymentRunbook) &&
      /docs\/stripe-live-price-setup\.md/.test(files.paymentRunbook) &&
      /docs\/production-api-proxy-repair\.md/.test(files.paymentRunbook) &&
      /Frontend-only Netlify deploy may happen/.test(files.paymentRunbook) &&
      /do not tell parents/i.test(files.paymentRunbook),
    message: 'Payment runbook must separate frontend launch from backend payment safety.',
  },
  {
    id: 'stripe-live-price-setup',
    file: 'docs/stripe-live-price-setup.md',
    ok: /STRIPE_PRICE_GUIDED_MONTHLY/.test(files.stripeLivePriceSetup) &&
      /STRIPE_PRICE_PREMIUM_MONTHLY/.test(files.stripeLivePriceSetup) &&
      /STRIPE_PRICE_SELF_PACED_MONTHLY/.test(files.stripeLivePriceSetup) &&
      /Do not commit `server\/\.env`/.test(files.stripeLivePriceSetup),
    message: 'Stripe live price setup doc must list required public plan price IDs and secret boundaries.',
  },
  {
    id: 'production-api-proxy-repair',
    file: 'docs/production-api-proxy-repair.md',
    ok: /api\.genesisideas\.school/.test(files.productionApiProxyRepair) &&
      /proxy_pass http:\/\/127\.0\.0\.1:4000/.test(files.productionApiProxyRepair) &&
      /sudo nginx -t/.test(files.productionApiProxyRepair) &&
      /Unsigned webhook requests should return a 4xx response/.test(files.productionApiProxyRepair),
    message: 'Production API proxy repair doc must explain the nginx/HTTPS blocker and webhook fail-closed smoke.',
  },
  {
    id: 'production-api-proxy-audit',
    file: 'tools/ops-quality/audit_production_api_proxy.js',
    ok: /GIIS_LIGHTSAIL_HOST/.test(files.productionApiProxyAudit) &&
      /external-webhook-fail-closed/.test(files.productionApiProxyAudit) &&
      /server-listens-443/.test(files.productionApiProxyAudit) &&
      /server-api-root-proxy-port/.test(files.productionApiProxyAudit) &&
      /audit:production-api-proxy/.test(files.packageJson),
    message: 'Production API proxy audit must provide a read-only repeatable check for API HTTPS/nginx repair.',
  },
  {
    id: 'production-payment-env-audit',
    file: 'tools/ops-quality/audit_production_payment_env.js',
    ok: /STRIPE_PRICE_GUIDED_MONTHLY/.test(files.productionPaymentEnvAudit) &&
      /ProcessedStripeEvent/.test(files.productionPaymentEnvAudit) &&
      /ALLOW_UNVERIFIED_STRIPE_WEBHOOK/.test(files.productionPaymentEnvAudit) &&
      /audit:production-payment-env/.test(files.packageJson) &&
      /secret values/.test(files.productionPaymentEnvAudit),
    message: 'Production payment env audit must provide a read-only check without printing secret values.',
  },
  {
    id: 'payment-handoff-runbook',
    file: 'docs/admissions-payment-handoff-runbook.md',
    ok: /Manual Review Sales Mode/.test(files.paymentHandoff) &&
      /Payment is requested only after the enrollment path is clear/.test(files.paymentHandoff) &&
      /Record Manual Payment/.test(files.paymentHandoff) &&
      /Do not send an automated Guided\/Premium checkout link/.test(files.paymentHandoff) &&
      /30-day refund policy applies/.test(files.paymentHandoff) &&
      /Alan Review Items/.test(files.paymentHandoff),
    message: 'Admissions must have a conservative manual payment handoff while automated Guided/Premium checkout is gated.',
  },
  {
    id: 'admin-manual-payment-flow',
    file: 'server/src/routes/applications.js + src/components/pages/Admin/ApplicationsQueue.js',
    ok: /\/:id\/manual-payment/.test(files.applicationsRoute) &&
      /Application must be approved after path review before payment can be recorded/.test(files.applicationsRoute) &&
      /manual:\$\{reference\}/.test(files.applicationsRoute) &&
      /status: 'active'/.test(files.applicationsRoute) &&
      /Manual Payment Verified/.test(files.applicationsRoute) &&
      /Record Manual Payment/.test(files.applicationsQueue) &&
      /paymentReference/.test(files.applicationsQueue) &&
      /Record payment before account activation/.test(files.applicationsQueue),
    message: 'Admin must be able to record reviewed manual payment before account activation without automated checkout.',
  },
  {
    id: 'consultation-response-sop',
    file: 'docs/admissions-consultation-response-sop.md',
    ok: /within one business day/i.test(files.consultationSop) &&
      /Guided.*\$149\/month/s.test(files.consultationSop) &&
      /Do not send a Stripe checkout link until the enrollment path is clear/.test(files.consultationSop) &&
      /Do not promise admission outcomes/.test(files.consultationSop) &&
      /After-Call Checklist/.test(files.consultationSop),
    message: 'Admissions must have a conservative response SOP before starting parent sales.',
  },
  {
    id: 'parent-sales-outreach-packet',
    file: 'docs/parent-sales-outreach-packet.md',
    ok: /npm run audit:sales-manual-ready/.test(files.outreachPacket) &&
      /Do not send automated Guided\/Premium checkout links until/.test(files.outreachPacket) &&
      /Payment only after path\s+review/.test(files.outreachPacket) &&
      /No guaranteed admission/.test(files.outreachPacket) &&
      /Florida-registered private school/.test(files.outreachPacket) &&
      /24-credit graduation framework/.test(files.outreachPacket) &&
      /Transfer Family/.test(files.outreachPacket) &&
      /Same-Day Stop Conditions/.test(files.outreachPacket) &&
      /parent-sales-owner-decisions\.json/.test(files.outreachPacket),
    message: 'Admissions must have a conservative outreach packet before starting active parent sales.',
  },
  {
    id: 'parent-sales-daily-operator-checklist',
    file: 'docs/parent-sales-daily-operator-checklist.md',
    ok: /npm run audit:sales-manual-ready/.test(files.dailyOperatorChecklist) &&
      /Same-Day Owner Coverage/.test(files.dailyOperatorChecklist) &&
      /lead-capture owner/.test(files.dailyOperatorChecklist) &&
      /first-response owner/.test(files.dailyOperatorChecklist) &&
      /WeChat follow-up owner/.test(files.dailyOperatorChecklist) &&
      /manual Stripe owner/.test(files.dailyOperatorChecklist) &&
      /Do not send automated Guided\/Premium checkout links until/.test(files.dailyOperatorChecklist) &&
      /End-Of-Day Closeout/.test(files.dailyOperatorChecklist) &&
      /Stop Conditions/.test(files.dailyOperatorChecklist),
    message: 'Admissions must have a same-day operator checklist before active outreach.',
  },
  {
    id: 'parent-sales-daily-operator-log-template',
    file: 'docs/templates/parent-sales-daily-operator-log.md',
    ok: /Same-Day Owners/.test(files.dailyOperatorLogTemplate) &&
      /Lead-capture owner/.test(files.dailyOperatorLogTemplate) &&
      /Manual Stripe owner/.test(files.dailyOperatorLogTemplate) &&
      /Manual Stripe authorized by Alan \(yes\/no\)/.test(files.dailyOperatorLogTemplate) &&
      /Inbox Checks/.test(files.dailyOperatorLogTemplate) &&
      /Do not store parent names/.test(files.dailyOperatorLogTemplate),
    message: 'Admissions must have a non-sensitive same-day operator log template.',
  },
  {
    id: 'parent-sales-operator-log-generator',
    file: 'tools/ops-quality/generate_parent_sales_operator_log.js',
    ok: /sales:operator-log/.test(files.packageJson) &&
      /Refusing to write an operator log inside the repo/.test(files.operatorLogGenerator) &&
      /Do not store parent names/.test(files.operatorLogGenerator) &&
      /sales:launch-mode -- --operator-log/.test(files.operatorLogGenerator),
    message: 'Admissions must have a safe command to generate same-day operator logs outside git.',
  },
  {
    id: 'parent-sales-start-day-command',
    file: 'tools/ops-quality/start_parent_sales_day.js',
    ok: /sales:start-day/.test(files.packageJson) &&
      /Refusing to start a sales day without explicit same-day owner coverage/.test(files.startDayGate) &&
      /--owner NAME/.test(files.startDayGate) &&
      /--checked yes/.test(files.startDayGate) &&
      /--manual-stripe-authorized yes/.test(files.startDayGate) &&
      /audit_parent_sales_launch_mode\.js/.test(files.startDayGate),
    message: 'Admissions must have a guarded one-command sales-day starter.',
  },
  {
    id: 'parent-sales-ready-today-gate',
    file: 'tools/ops-quality/audit_parent_sales_ready_today.js',
    ok: /operator-log-required/.test(files.readyTodayGate) &&
      /manual_sales_go_with_payment_boundary/.test(files.readyTodayGate) &&
      /full_sales_ready/.test(files.readyTodayGate) &&
      /audit_parent_sales_manual_ready\.js/.test(files.readyTodayGate) &&
      /audit_parent_sales_payment_live\.js/.test(files.readyTodayGate) &&
      /sales:ready-today/.test(files.packageJson),
    message: 'Admissions must have a one-command same-day sales go/no-go gate.',
  },
  {
    id: 'parent-sales-owner-decisions-gate',
    file: 'tools/ops-quality/audit_parent_sales_owner_decisions.js',
    ok: /alan_review_required_for_permanent_sales_owners/.test(files.ownerDecisionGate) &&
      /permanent_manual_sales_owners_ready/.test(files.ownerDecisionGate) &&
      /manual-payment-owner/.test(files.ownerDecisionGate) &&
      /lead-capture-owner/.test(files.ownerDecisionGate) &&
      /audit:sales-owner-decisions/.test(files.packageJson) &&
      /netlifyLeadCapture/.test(files.ownerDecisions),
    message: 'Admissions must have a repeatable Alan review gate for permanent sales-owner decisions.',
  },
  {
    id: 'parent-sales-launch-mode-gate',
    file: 'tools/ops-quality/audit_parent_sales_launch_mode.js',
    ok: /manual_sales_go_with_payment_boundary/.test(files.launchModeGate) &&
      /permanent_manual_sales_ready_with_payment_boundary/.test(files.launchModeGate) &&
      /full_sales_ready/.test(files.launchModeGate) &&
      /canAutomatedCheckout/.test(files.launchModeGate) &&
      /audit:sales-launch-mode/.test(files.packageJson) &&
      /sales:launch-mode/.test(files.packageJson),
    message: 'Admissions must have one command that reports the current allowed sales launch mode.',
  },
  {
    id: 'parent-journey-acceptance-gate',
    file: 'tools/ops-quality/audit_parent_journey_acceptance.js',
    ok: /Florida-registered private school/.test(files.parentJourneyAcceptance) &&
      /Transfer Family Default/.test(files.parentJourneyAcceptance) &&
      /Parents see advisor-approved summaries only/.test(files.parentJourneyAcceptance) &&
      /official transcripts or verifiable school records/.test(files.parentJourneyAcceptance) &&
      /audit:parent-journey/.test(files.packageJson),
    message: 'Admissions must have a browser gate for the parent pre-payment decision journey.',
  },
];

const failures = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.id} (${check.file})`);
  if (!check.ok) console.log(`  ${check.message}`);
}

if (failures.length) {
  console.error(`\nParent sales launch audit failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`\nParent sales launch audit passed: ${checks.length}/${checks.length} checks.`);
