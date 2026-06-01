const PROFILES = [
  {
    key: 'data_lab',
    match: /\b(experiment|data|survey|interview|journal|track|record|measure|graph|calculate|audit)\b/i,
    label: { en: 'Data / Lab Evidence', zh: '数据 / 实验证据' },
    evidence: {
      en: 'Submit observations, calculations, data, or interview notes with a short interpretation.',
      zh: '提交观察记录、计算、数据或访谈笔记，并附上简短解释。',
    },
    rubricFocus: {
      en: 'Data quality, method clarity, accuracy, and evidence-based conclusion.',
      zh: '数据质量、方法清晰度、准确性，以及结论是否有证据支持。',
    },
  },
  {
    key: 'project_design',
    match: /\b(design|create|build|develop|plan|model|canvas|campaign|program|chart|infographic|map|outline|calendar)\b/i,
    label: { en: 'Project / Design Work', zh: '项目 / 设计作业' },
    evidence: {
      en: 'Submit an artifact, plan, chart, model, or project link plus a short rationale.',
      zh: '提交作品、计划、图表、模型或项目链接，并说明设计理由。',
    },
    rubricFocus: {
      en: 'Completeness, practical detail, prompt alignment, and design decisions.',
      zh: '完成度、细节、是否回应题目，以及设计决策质量。',
    },
  },
  {
    key: 'research_evidence',
    match: /\b(research|source|article|current news|report|citation|evidence|investigate|find|compare.*source)\b/i,
    label: { en: 'Research / Evidence Report', zh: '研究 / 证据报告' },
    evidence: {
      en: 'Submit sources, evidence notes, and a written explanation using course vocabulary.',
      zh: '提交资料来源、证据笔记，并用课程词汇写出说明。',
    },
    rubricFocus: {
      en: 'Source credibility, evidence use, reasoning, citations or links, and clarity.',
      zh: '资料可信度、证据使用、推理、引用/链接，以及表达清晰度。',
    },
  },
  {
    key: 'presentation_performance',
    match: /\b(deliver|speech|present|teach|lead|demonstrate|role-play|role play|record a|video)\b/i,
    label: { en: 'Presentation / Performance', zh: '展示 / 表现作业' },
    evidence: {
      en: 'Submit a script, outline, reflection, or recording link when available.',
      zh: '可提交讲稿、大纲、反思，或录影链接。',
    },
    rubricFocus: {
      en: 'Preparation, communication choices, reflection quality, and module criteria.',
      zh: '准备程度、表达选择、反思质量，以及是否符合模块要求。',
    },
  },
  {
    key: 'practice_problem',
    match: /\b(solve|complete|practice|set up|label|classify|draw and label|reference sheet)\b/i,
    label: { en: 'Practice / Problem Set', zh: '练习 / 题组作业' },
    evidence: {
      en: 'Submit worked steps, labeled diagrams, classifications, or completed practice artifacts.',
      zh: '提交解题步骤、标注图、分类结果或完成的练习作品。',
    },
    rubricFocus: {
      en: 'Accuracy, shown work, corrections, and explanation of process.',
      zh: '准确性、过程展示、订正，以及是否能解释步骤。',
    },
  },
  {
    key: 'writing_reflection',
    match: /\b(write|essay|paragraph|reflection|analysis|analyze|evaluate|explain|describe|compare|critique)\b/i,
    label: { en: 'Writing / Reflection', zh: '写作 / 反思作业' },
    evidence: {
      en: 'Submit a written response with examples, reasoning, and course vocabulary.',
      zh: '提交书面回答，包含具体例子、推理与课程词汇。',
    },
    rubricFocus: {
      en: 'Claim, organization, evidence, reasoning, and clarity of writing.',
      zh: '观点、结构、证据、推理，以及写作清晰度。',
    },
  },
];

const DEFAULT_PROFILE = {
  key: 'general_evidence',
  label: { en: 'Learning Evidence', zh: '学习证据' },
  evidence: {
    en: 'Submit written work, a document link, or a project link that answers the full prompt.',
    zh: '提交书面内容、文件链接或项目链接，完整回应题目。',
  },
  rubricFocus: {
    en: 'Completion, accuracy, reasoning or evidence, and clarity.',
    zh: '完成度、准确性、推理/证据，以及表达清晰度。',
  },
};

export function getAssignmentProfile(prompt = '') {
  const text = String(prompt || '');
  return PROFILES.find((profile) => profile.match.test(text)) || DEFAULT_PROFILE;
}
