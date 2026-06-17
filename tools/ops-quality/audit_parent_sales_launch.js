#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const files = {
  app: read('src/App.js'),
  headerCss: read('src/components/Header/Header.module.css'),
  homeMain: read('src/components/pages/Homepage/HomepageMain.js'),
  homeHero: read('src/components/pages/Homepage/Homepage/HeroSection.js'),
  homeIntro: read('src/components/pages/Homepage/Homepage/Introduction.js'),
  academicsIntro: read('src/components/pages/Academics/Academics/Academicsintroduction.js'),
  contact: read('src/components/pages/Homepage/Homepage/ContactForm.js'),
  apply: read('src/components/pages/Apply/ApplyForm.js'),
  admissionsReceipt: read('src/components/main/AdmissionsHandoffReceipt.js'),
  navStrings: read('src/i18n/siteStrings.js'),
  pricing: read('src/components/pages/Pricing/PricingPage.js'),
  trust: read('src/components/pages/TrustCenter/TrustCenterPage.js'),
  admission: read('src/components/pages/Admission/AdmissionMain.js'),
  discovery: read('src/components/pages/Discovery/Discovery/DiscoveryIntroduction2.js'),
  consultation: read('src/components/pages/Consultation/ConsultationPage.js'),
  graduates: read('src/components/pages/Graduates/GraduateStoriesPage.js'),
  support: read('src/components/pages/Support/SupportMain.js'),
  parentDemo: read('src/components/pages/Parent/ParentDashboardDemo.js'),
  applicationsQueue: read('src/components/pages/Admin/ApplicationsQueue.js'),
  applicationsRoute: read('server/src/routes/applications.js'),
  publicIndex: read('public/index.html'),
  paymentRunbook: read('docs/production-payment-deploy-runbook.md'),
  netlifyFrontendRepair: read('docs/netlify-frontend-deploy-repair.md'),
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
  leadCaptureVerifier: read('tools/ops-quality/verify_netlify_lead_capture.js'),
  schoolOpsReport: read('tools/ops-quality/generate_school_ops_report.js'),
  ownerDecisions: read('docs/parent-sales-owner-decisions.json'),
  refundPolicy: read('src/components/pages/RefundPolicy/RefundPolicyPage.js'),
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
    id: 'homepage-family-reported-outcomes',
    file: 'src/components/pages/Homepage/Homepage/HeroSection.js',
    ok: /Family-reported outcomes/.test(files.homeHero) &&
      /Reported offers include/.test(files.homeHero) &&
      !/Class of 2026'/.test(files.homeHero),
    message: 'Homepage hero outcome proof must use conservative family-reported wording instead of ambiguous direct placement claims.',
  },
  {
    id: 'global-masthead-compact',
    file: 'src/components/Header/Header.module.css',
    ok: /max-height:\s*132px/.test(files.headerCss) &&
      /max-height:\s*48px/.test(files.headerCss) &&
      /object-fit:\s*contain/.test(files.headerCss),
    message: 'Global masthead must constrain the large logo asset so first-viewport trust proof and CTAs remain visible.',
  },
  {
    id: 'public-ai-human-review-boundary',
    file: 'src/components/pages/Homepage/Homepage/Introduction.js + src/components/pages/Academics/Academics/Academicsintroduction.js',
    ok: /Human-Reviewed Learning Tools/.test(files.homeIntro) &&
      /human-reviewed learning tools/.test(files.homeIntro) &&
      /Teachers or advisors still review student work, records, and family-facing summaries/.test(files.homeIntro) &&
      /Technology-Supported, Human-Reviewed/.test(files.academicsIntro) &&
      /grades, credits, records, and family-facing summaries stay human-reviewed/.test(files.academicsIntro) &&
      !/adaptive learning experiences|optimal pace|AI-powered learning tools|AI tools are integrated throughout/i.test(`${files.homeIntro}\n${files.academicsIntro}`),
    message: 'Homepage and Academics AI/technology copy must match the human-reviewed Trust Center boundary.',
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
    id: 'route-refund-policy',
    file: 'src/App.js',
    ok: /path="\/refund-policy"/.test(files.app) && /RefundPolicyPage/.test(files.app),
    message: 'Refund policy must be routable before parent payment conversations.',
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
      /to="\/consultation"/.test(files.pricing) &&
      /to="\/refund-policy"/.test(files.pricing),
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
    id: 'admissions-handoff-receipt',
    file: 'src/components/main/AdmissionsHandoffReceipt.js + src/components/pages/Apply/ApplyForm.js + src/components/pages/Consultation/ConsultationPage.js',
    ok: /Admissions Handoff Receipt/.test(files.admissionsReceipt) &&
      /Received/.test(files.admissionsReceipt) &&
      /Admissions review/.test(files.admissionsReceipt) &&
      /Records request/.test(files.admissionsReceipt) &&
      /Plan recommendation/.test(files.admissionsReceipt) &&
      /Payment after review/.test(files.admissionsReceipt) &&
      /Records preparation/.test(files.admissionsReceipt) &&
      /within one business day/.test(files.admissionsReceipt) &&
      /No payment before review/.test(files.admissionsReceipt) &&
      /Open Trust Center/.test(files.admissionsReceipt) &&
      /Preview Parent Dashboard/.test(files.admissionsReceipt) &&
      /Review Pricing/.test(files.admissionsReceipt) &&
      /Email Admissions/.test(files.admissionsReceipt) &&
      /AdmissionsHandoffReceipt/.test(files.apply) &&
      /kind=\{isTransferApplicant \? 'transfer' : 'new'\}/.test(files.apply) &&
      /AdmissionsHandoffReceipt/.test(files.consultation) &&
      /kind="consultation"/.test(files.consultation),
    message: 'Apply and consultation success states must show a formal admissions handoff receipt with records preparation, Trust Center fallback, and no-payment-before-review boundary.',
  },
  {
    id: 'pricing-no-public-checkout-call',
    file: 'src/components/pages/Pricing/PricingPage.js',
    ok: !/create-session|checkout\/create-session|window\.location|stripe/i.test(files.pricing),
    message: 'Public pricing page must not directly start Stripe checkout before path review.',
  },
  {
    id: 'pricing-self-paced-human-access',
    file: 'src/components/pages/Pricing/PricingPage.js',
    ok: /Email admissions access/.test(files.pricing) &&
      !/Email support/.test(files.pricing),
    message: 'Self-Paced pricing comparison should describe concrete admissions access instead of vague low-trust support wording.',
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
    ok: /to="\/consultation"/.test(files.trust) &&
      /Talk to the principal first/.test(files.trust) &&
      /to: '\/refund-policy'/.test(files.trust),
    message: 'Trust Center must offer a human consultation path.',
  },
  {
    id: 'trust-ai-software-boundary',
    file: 'src/components/pages/TrustCenter/TrustCenterPage.js',
    ok: /AI \/ Software Boundary/.test(files.trust) &&
      /AI\/software-assisted/.test(files.trust) &&
      /does not automatically change grades, credits, official records, payment status/.test(files.trust) &&
      /human-reviewed/.test(files.trust),
    message: 'Trust Center must explain the AI/software-assisted vs human-reviewed decision boundary.',
  },
  {
    id: 'refund-policy-public-proof',
    file: 'src/components/pages/RefundPolicy/RefundPolicyPage.js + docs/admissions-payment-handoff-runbook.md',
    ok: /30-day refund policy/.test(files.refundPolicy) &&
      /admissions@genesisideas\.school/.test(files.refundPolicy) &&
      /Payment happens after review/.test(files.refundPolicy) &&
      /does not promise transfer-credit approval/.test(files.refundPolicy) &&
      /https:\/\/genesisideas\.school\/refund-policy/.test(files.paymentHandoff),
    message: 'Refund policy must be public, conservative, and linked from manual payment handoff.',
  },
  {
    id: 'admission-links-consultation',
    file: 'src/components/pages/Admission/AdmissionMain.js',
    ok: /to="\/consultation"/.test(files.admission) && /Book a Free Consultation/.test(files.admission),
    message: 'Admission page must expose consultation alongside apply/transfer paths.',
  },
  {
    id: 'admission-support-tier-boundary',
    file: 'src/components/pages/Admission/AdmissionMain.js',
    ok: /All reviewed enrollments receive course access, records, assignment feedback, and parent-visible progress/.test(files.admission) &&
      /Guided adds monthly advisor planning, transfer-credit review, and parent progress interpretation/.test(files.admission) &&
      /Premium adds higher-touch pathway, writing, portfolio, and college-readiness planning/.test(files.admission) &&
      !/Every student receives personalized guidance/.test(files.admission),
    message: 'Admission FAQ must describe support by plan instead of implying all students receive full advisor planning.',
  },
  {
    id: 'discovery-support-tier-boundary',
    file: 'src/components/pages/Discovery/Discovery/DiscoveryIntroduction2.js',
    ok: /pathway-aware course sequence/.test(files.discovery) &&
      /Guided and Premium families add recurring advisor review/.test(files.discovery) &&
      /advisor support matched to the family's chosen plan/.test(files.discovery) &&
      !/Personalized advisor support every semester/.test(files.discovery) &&
      !/Advisors track progress each semester/.test(files.discovery),
    message: 'Discovery page must not imply every plan includes recurring advisor support.',
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
      /to="\/admission"/.test(files.parentDemo) &&
      !/\b(May|MAY|June|JUN)\b|days ago|Last sent|5 月|天前/.test(files.parentDemo),
    message: 'Parent demo must connect transparency proof to admission/pricing without stale sample dates.',
  },
  {
    id: 'support-tier-boundary',
    file: 'src/components/pages/Support/SupportMain.js',
    ok: /Support by plan/.test(files.support) &&
      /All reviewed enrollments/.test(files.support) &&
      /Guided · \$149\/month/.test(files.support) &&
      /Premium · \$299\/month/.test(files.support) &&
      /Advisor planning is added through Guided and Premium/.test(files.support) &&
      !/Included with every plan/.test(files.support),
    message: 'Support page must not imply every plan includes full advisor/college-pathway support.',
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
    id: 'netlify-frontend-deploy-repair',
    file: 'docs/netlify-frontend-deploy-repair.md',
    ok: /audit:frontend-deploy/.test(files.netlifyFrontendRepair) &&
      /giis\.netlify\.app/.test(files.netlifyFrontendRepair) &&
      /production_asset_mismatch/.test(files.netlifyFrontendRepair) &&
      /git push origin main -> Netlify production deploy/.test(files.netlifyFrontendRepair) &&
      /GitHub integration/.test(files.netlifyFrontendRepair) &&
      /webhook\/app install/.test(files.netlifyFrontendRepair) &&
      /Do not deploy an unreviewed\s+local folder/.test(files.netlifyFrontendRepair) &&
      /Do not send automated checkout links/.test(files.netlifyFrontendRepair),
    message: 'Netlify frontend repair runbook must define auto-deploy contract, stale-deploy diagnosis, dashboard checks, and payment boundaries.',
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
      /Manual Payment Receipt/.test(files.paymentHandoff) &&
      /GIIS-branded receipt copy/.test(files.paymentHandoff) &&
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
      /manualPaymentReceiptText/.test(files.applicationsQueue) &&
      /GIIS payment receipt/.test(files.applicationsQueue) &&
      /Refund policy: https:\/\/genesisideas\.school\/refund-policy/.test(files.applicationsQueue) &&
      /does not promise credit transfer/.test(files.applicationsQueue) &&
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
    ok: /npm run school:ops-report/.test(files.dailyOperatorChecklist) &&
      /school ops verdict/.test(files.dailyOperatorChecklist) &&
      /manual_sales_go_with_payment_boundary/.test(files.dailyOperatorChecklist) &&
      /npm run audit:sales-manual-ready/.test(files.dailyOperatorChecklist) &&
      /Same-Day Owner Coverage/.test(files.dailyOperatorChecklist) &&
      /lead-capture owner/.test(files.dailyOperatorChecklist) &&
      /first-response owner/.test(files.dailyOperatorChecklist) &&
      /WeChat follow-up owner/.test(files.dailyOperatorChecklist) &&
      /manual Stripe owner/.test(files.dailyOperatorChecklist) &&
      /school ops snapshot already runs the dry-run lead-capture verifier/.test(files.dailyOperatorChecklist) &&
      /Do not send automated Guided\/Premium checkout links until/.test(files.dailyOperatorChecklist) &&
      /End-Of-Day Closeout/.test(files.dailyOperatorChecklist) &&
      /Stop Conditions/.test(files.dailyOperatorChecklist),
    message: 'Admissions must start daily outreach from the school ops snapshot and keep same-day owner coverage explicit.',
  },
  {
    id: 'parent-sales-daily-operator-log-template',
    file: 'docs/templates/parent-sales-daily-operator-log.md',
    ok: /npm run school:ops-report/.test(files.dailyOperatorLogTemplate) &&
      /npm run lead-capture:test/.test(files.dailyOperatorLogTemplate) &&
      /Same-Day Owners/.test(files.dailyOperatorLogTemplate) &&
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
    id: 'school-ops-lead-capture-dry-run',
    file: 'tools/ops-quality/generate_school_ops_report.js + tools/ops-quality/verify_netlify_lead_capture.js',
    ok: /netlify-lead-capture/.test(files.schoolOpsReport) &&
      /verify_netlify_lead_capture\.js/.test(files.schoolOpsReport) &&
      /leadCaptureDryRun/.test(files.schoolOpsReport) &&
      /Lead capture dry-run/.test(files.schoolOpsReport) &&
      /dry_run_ready_for_test_submission/.test(files.leadCaptureVerifier) &&
      /--confirm-submit/.test(files.leadCaptureVerifier),
    message: 'School ops report must verify lead-capture dry-run health while keeping real test submissions explicit.',
  },
  {
    id: 'school-ops-parent-journey-retry',
    file: 'tools/ops-quality/generate_school_ops_report.js',
    ok: /auditJsonWithRetry\('parent-journey'/.test(files.schoolOpsReport) &&
      /retrySuperseded/.test(files.schoolOpsReport) &&
      /RETRIED_FAIL/.test(files.schoolOpsReport),
    message: 'School ops report should retry a single transient parent-journey fetch failure while preserving the failed attempt in the report.',
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
