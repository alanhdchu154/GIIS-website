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
  publicIndex: read('public/index.html'),
  paymentRunbook: read('docs/production-payment-deploy-runbook.md'),
  consultationSop: read('docs/admissions-consultation-response-sop.md'),
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
      /Frontend-only Netlify deploy may happen/.test(files.paymentRunbook) &&
      /do not tell parents/i.test(files.paymentRunbook),
    message: 'Payment runbook must separate frontend launch from backend payment safety.',
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
