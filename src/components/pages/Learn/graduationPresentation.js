/**
 * Phase 0A claim-safety helper. See docs/campus-quest-implementation-plan.md.
 *
 * Produces the review-safe banner shown when a student's total recorded
 * credits reach the 24-credit threshold. Copy must state that subject-area
 * requirements and staff graduation approval are still pending; it must
 * never claim the diploma has been earned or graduation has been approved.
 */

export const TOTAL_CREDIT_THRESHOLD = 24;

const COPY = {
  en: {
    heading: 'Total-credit threshold reached',
    summary:
      'Recorded credits have reached the 24-credit total-credit threshold. Subject-area requirements and staff graduation approval still need review before any diploma can be issued.',
    subjectRequirementsNote:
      'Subject-area requirements (English, Math, Science, Social Studies, and Pathway/Electives) are reviewed separately.',
    staffApprovalNote:
      'Staff graduation approval is required before diploma issuance.',
  },
  'zh-CN': {
    heading: '已达到学分总数门槛',
    summary:
      '已记录的学分达到 24 学分总数门槛。仍需审核各学科要求以及学校的毕业审批，之后才能颁发任何毕业证书。',
    subjectRequirementsNote:
      '各学科要求（英语、数学、科学、社会研究以及方向/选修）会单独进行审核。',
    staffApprovalNote:
      '颁发毕业证书前，仍需学校完成毕业审批。',
  },
};

function normalizeCreditsInput(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n;
}

function resolveLanguage(language) {
  return language === 'zh' || language === 'zh-CN' ? 'zh-CN' : 'en';
}

/**
 * @param {{
 *   totalCredits: number|string|null|undefined,
 *   language?: 'en'|'zh'|'zh-CN',
 * }} params
 */
export function getGraduationPresentation({ totalCredits, language } = {}) {
  const lang = resolveLanguage(language);
  const normalized = normalizeCreditsInput(totalCredits);
  const meetsTotalCreditThreshold =
    normalized !== null && normalized >= TOTAL_CREDIT_THRESHOLD;

  if (!meetsTotalCreditThreshold) {
    return {
      language: lang,
      graduationCreditThreshold: TOTAL_CREDIT_THRESHOLD,
      meetsTotalCreditThreshold: false,
      showReviewBanner: false,
      banner: null,
    };
  }

  const copy = COPY[lang];
  return {
    language: lang,
    graduationCreditThreshold: TOTAL_CREDIT_THRESHOLD,
    meetsTotalCreditThreshold: true,
    showReviewBanner: true,
    banner: {
      heading: copy.heading,
      summary: copy.summary,
      subjectRequirementsNote: copy.subjectRequirementsNote,
      staffApprovalNote: copy.staffApprovalNote,
    },
  };
}
