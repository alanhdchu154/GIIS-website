const PROFILES = [
  {
    key: 'data_lab',
    match: /\b(experiment|data|survey|interview|journal|track|record|measure|graph|calculate|audit)\b/i,
    label: 'Data / Lab Evidence',
    evidence: 'Student should submit observations, calculations, data, or interview notes with a short interpretation.',
    rubricFocus: 'Check data quality, method clarity, calculation accuracy, and whether the conclusion follows from evidence.',
  },
  {
    key: 'project_design',
    match: /\b(design|create|build|develop|plan|model|canvas|campaign|program|chart|infographic|map|outline|calendar)\b/i,
    label: 'Project / Design Work',
    evidence: 'Student should submit a concrete artifact, plan, chart, model, or project link plus a short rationale.',
    rubricFocus: 'Check completeness, practical detail, alignment to the prompt, and quality of the design decisions.',
  },
  {
    key: 'research_evidence',
    match: /\b(research|source|article|current news|report|citation|evidence|investigate|find|compare.*source)\b/i,
    label: 'Research / Evidence Report',
    evidence: 'Student should submit sources, evidence notes, and a written explanation using course vocabulary.',
    rubricFocus: 'Check source credibility, evidence use, reasoning, citations or links, and clarity of explanation.',
  },
  {
    key: 'presentation_performance',
    match: /\b(deliver|speech|present|teach|lead|demonstrate|role-play|role play|record a|video)\b/i,
    label: 'Presentation / Performance',
    evidence: 'Student should submit a script, outline, reflection, or link to a recording when available.',
    rubricFocus: 'Check preparation, communication choices, reflection quality, and connection to the module criteria.',
  },
  {
    key: 'practice_problem',
    match: /\b(solve|complete|practice|set up|label|classify|draw and label|reference sheet)\b/i,
    label: 'Practice / Problem Set',
    evidence: 'Student should submit worked steps, labeled diagrams, classifications, or completed practice artifacts.',
    rubricFocus: 'Check accuracy, shown work, corrections, and whether the student can explain the process.',
  },
  {
    key: 'writing_reflection',
    match: /\b(write|essay|paragraph|reflection|analysis|analyze|evaluate|explain|describe|compare|critique)\b/i,
    label: 'Writing / Reflection',
    evidence: 'Student should submit a written response with specific examples, reasoning, and course vocabulary.',
    rubricFocus: 'Check thesis or claim, organization, evidence, reasoning, and clarity of writing.',
  },
];

const DEFAULT_PROFILE = {
  key: 'general_evidence',
  label: 'Learning Evidence',
  evidence: 'Student should submit written work, a document link, or a project link that answers the full prompt.',
  rubricFocus: 'Check completion, accuracy, reasoning or evidence, and clarity.',
};

function profileAssignment(prompt = '') {
  const text = String(prompt || '');
  return PROFILES.find((profile) => profile.match.test(text)) || DEFAULT_PROFILE;
}

module.exports = { profileAssignment };
