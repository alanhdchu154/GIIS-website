#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function coursePath(relativePath) {
  return path.join(ROOT, 'server', 'prisma', 'courses', relativePath);
}

function readCourse(relativePath) {
  return JSON.parse(fs.readFileSync(coursePath(relativePath), 'utf8'));
}

function writeCourse(relativePath, course) {
  fs.writeFileSync(coursePath(relativePath), `${JSON.stringify(course, null, 2)}\n`);
}

function setQuizAnswer(course, moduleOrder, order, answer) {
  const question = course.quizQuestions.find((q) => q.moduleOrder === moduleOrder && q.order === order);
  if (!question) throw new Error(`${course.slug} missing quiz ${moduleOrder}.${order}`);
  question.answer = answer;
}

function setExamAnswer(course, examType, order, answer) {
  const question = course.questions.find((q) => q.examType === examType && q.order === order);
  if (!question) throw new Error(`${course.slug} missing ${examType} exam ${order}`);
  question.answer = answer;
}

function addQuizQuestions(course, moduleOrder, questions) {
  const existing = new Set(course.quizQuestions.map((q) => `${q.moduleOrder}:${q.question}`));
  let nextOrder = course.quizQuestions
    .filter((q) => q.moduleOrder === moduleOrder)
    .reduce((max, q) => Math.max(max, Number(q.order || 0)), 0) + 1;

  for (const item of questions) {
    const key = `${moduleOrder}:${item.question}`;
    if (existing.has(key)) continue;
    course.quizQuestions.push({
      moduleOrder,
      order: nextOrder++,
      points: 1,
      ...item,
    });
  }
}

function q(question, options, answer, explanation) {
  return { question, options, answer, explanation };
}

function repairExactAnswerKeys() {
  const repairs = [
    {
      file: 'electives/business-ethics-critical-thinking.json',
      quiz: [[4, 3, 'Managers are agents of shareholders who entrusted them with capital, so profit maximization is their fiduciary duty']],
    },
    {
      file: 'psychology/counseling-mental-health.json',
      quiz: [[9, 2, 'Assume clients have experienced trauma and design services to avoid re-traumatization']],
    },
    {
      file: 'psychology/human-development.json',
      quiz: [[3, 2, 'Turning toward a touch on the cheek and beginning to suck']],
    },
    {
      file: 'psychology/psychology.json',
      exam: [['midterm', 15, "Children cannot take another person's perspective"]],
    },
  ];

  for (const repair of repairs) {
    const course = readCourse(repair.file);
    for (const [moduleOrder, order, answer] of repair.quiz || []) setQuizAnswer(course, moduleOrder, order, answer);
    for (const [examType, order, answer] of repair.exam || []) setExamAnswer(course, examType, order, answer);
    writeCourse(repair.file, course);
    console.log(`Repaired answer keys: ${course.slug}`);
  }
}

function repairBusinessResearchMethods() {
  const file = 'social-studies/business-research-methods.json';
  const course = readCourse(file);
  setExamAnswer(course, 'midterm', 13, 'A research question asks what the study seeks to learn; a hypothesis predicts an expected relationship. Example: RQ: How does response time affect customer retention? Hypothesis: Faster response time increases repeat purchase rate.');
  setExamAnswer(course, 'midterm', 14, 'Surveys can reach many respondents efficiently and produce comparable quantitative data, but they may suffer from low response quality or self-report bias.');
  setExamAnswer(course, 'midterm', 15, 'Source credibility means a source is trustworthy, relevant, current, and authoritative. It matters because weak sources lead to weak conclusions; evaluate author expertise, publication venue, evidence quality, date, and bias.');
  setExamAnswer(course, 'final', 18, 'A complete business research report usually includes executive summary, research question, background/literature review, method, findings, analysis, recommendations, limitations, and references.');
  setExamAnswer(course, 'final', 19, 'Quantitative methods measure patterns with numbers and are useful for surveys or experiments; qualitative methods explore meaning and context through interviews or observation. Use quantitative work for market-size estimates and qualitative work to understand customer motivation.');
  setExamAnswer(course, 'final', 20, 'Market research reduces uncertainty in decisions. SWOT summarizes internal strengths/weaknesses and external opportunities/threats, while PESTLE scans political, economic, social, technological, legal, and environmental forces.');
  writeCourse(file, course);
  console.log(`Repaired short-answer exam keys: ${course.slug}`);
}

function repairApTailModules() {
  const apRepairs = [
    {
      file: 'science/ap-biology.json',
      modules: {
        15: [
          q('In a lake food web case study, what does a trophic cascade describe?', ['A change at one trophic level that indirectly affects other trophic levels', 'The random mixing of all species in an ecosystem', 'A cycle that moves only carbon through abiotic reservoirs', 'The replacement of energy pyramids with biomass pyramids'], 'A change at one trophic level that indirectly affects other trophic levels', 'A trophic cascade occurs when a change in predators, herbivores, or producers ripples through other levels of the food web.'),
          q('Which evidence best supports a claim that eutrophication is occurring?', ['Higher dissolved oxygen and fewer algae', 'Nutrient runoff followed by algal blooms and lower dissolved oxygen', 'A stable nitrogen cycle with no biomass change', 'A decrease in primary productivity after fertilizer enters the water'], 'Nutrient runoff followed by algal blooms and lower dissolved oxygen', 'Excess nitrogen or phosphorus can cause algal blooms; decomposition then consumes oxygen and stresses aquatic life.'),
          q('When evaluating a conservation plan, why should students compare both biodiversity and ecosystem-service data?', ['Biodiversity alone always predicts economic value', 'Ecosystem services replace the need for species counts', 'The two data types connect ecological stability with human impacts and tradeoffs', 'Neither data type is useful for policy decisions'], 'The two data types connect ecological stability with human impacts and tradeoffs', 'AP-style ecological arguments should connect biological evidence with consequences for ecosystem function and human decision-making.'),
        ],
        16: [
          q('On the AP Biology exam, which response best earns credit for an ecological claim?', ['A claim with no evidence because ecology is descriptive', 'A claim supported by specific data and a biological mechanism', 'A broad opinion about protecting nature', 'A definition copied without applying it to the scenario'], 'A claim supported by specific data and a biological mechanism', 'AP free-response scoring rewards claims that use data and explain the underlying biological process.'),
          q('Which topic pair is most important for reviewing ecosystem energy flow?', ['Cell cycle checkpoints and mitosis', 'Trophic efficiency and food-web interactions', 'Transcription factors and RNA processing', 'Hardy-Weinberg equilibrium and genetic drift'], 'Trophic efficiency and food-web interactions', 'Energy flow questions often require students to reason through trophic levels, energy transfer, and food-web effects.'),
          q('Why is matter described as cycling while energy flows through ecosystems?', ['Matter is converted into sunlight, while energy becomes atoms', 'Matter is recycled through biogeochemical cycles, while energy enters as light and leaves as heat', 'Both matter and energy disappear after decomposition', 'Energy cycles only through the nitrogen cycle'], 'Matter is recycled through biogeochemical cycles, while energy enters as light and leaves as heat', 'Carbon, nitrogen, and water cycle through reservoirs; energy is transferred and eventually dissipated as heat.'),
        ],
      },
    },
    {
      file: 'social-studies/ap-human-geography.json',
      modules: {
        15: [
          q('A city adopting bus rapid transit, mixed-use zoning, and walkable districts is primarily addressing which contemporary issue?', ['Agricultural hearth diffusion', 'Sustainable urban development', 'Centripetal nationalism', 'Primary-sector employment'], 'Sustainable urban development', 'These policies reduce car dependence and support denser, more sustainable urban patterns.'),
          q('Which evidence best supports an analysis of climate migration?', ['Only a political boundary map', 'Temperature, sea-level, livelihood, and migration-flow data considered together', 'A list of capital cities', 'A single cultural landscape photograph'], 'Temperature, sea-level, livelihood, and migration-flow data considered together', 'Climate migration is multicausal and should be analyzed with environmental, economic, and population data.'),
          q('Indigenous land-rights conflicts often require geographic analysis because they involve:', ['Only language-family classification', 'Territory, resource control, cultural landscapes, and political power', 'Random migration unrelated to place', 'The elimination of scale from policy decisions'], 'Territory, resource control, cultural landscapes, and political power', 'Human geography connects land, identity, governance, and resource-use conflicts across scales.'),
        ],
        16: [
          q('Which AP Human Geography skill is most important when comparing two maps of the same region?', ['Ignoring scale to simplify the answer', 'Identifying spatial patterns and explaining what may cause them', 'Listing every place name on both maps', 'Choosing the map with brighter colors'], 'Identifying spatial patterns and explaining what may cause them', 'AP map questions ask students to identify, compare, and explain spatial patterns using geographic reasoning.'),
          q('A strong AP free-response answer about food security should include:', ['A definition only', 'A claim, geographic evidence, and an explanation of economic or environmental causes', 'A personal opinion without data', 'A list of countries with no reasoning'], 'A claim, geographic evidence, and an explanation of economic or environmental causes', 'Scorable responses connect concepts to evidence and explain the process behind the pattern.'),
          q('Which review strategy best prepares students for AP Human Geography synthesis questions?', ['Memorizing terms without examples', 'Practicing links among population, culture, political, agriculture, urban, and development units', 'Studying only physical geography', 'Skipping map interpretation'], 'Practicing links among population, culture, political, agriculture, urban, and development units', 'Synthesis questions often combine multiple units and require students to transfer concepts across contexts.'),
        ],
      },
    },
    {
      file: 'psychology/ap-psychology.json',
      modules: {
        15: [
          q('A case study of exposure therapy for a specific phobia most directly applies which learning principle?', ['Classical conditioning and extinction', 'Identity diffusion', 'Random sampling', 'Split-brain lateralization'], 'Classical conditioning and extinction', 'Exposure therapy reduces conditioned fear by repeatedly presenting the feared stimulus without the expected harm.'),
          q('Why would a clinician use both symptom data and functional-impairment data when evaluating treatment progress?', ['Only symptoms matter in clinical psychology', 'Functioning shows whether symptom change translates into daily-life improvement', 'Functional impairment is unrelated to diagnosis', 'Treatment progress cannot be measured'], 'Functioning shows whether symptom change translates into daily-life improvement', 'Clinical evaluation should consider symptom reduction and whether the client can function better in school, work, relationships, and daily routines.'),
          q('A biomedical treatment plan for depression most directly targets:', ['Social loafing', 'Neurochemical processes associated with mood regulation', 'Depth perception', 'Language acquisition'], 'Neurochemical processes associated with mood regulation', 'Biomedical approaches such as antidepressant medication are designed to affect biological mechanisms involved in symptoms.'),
        ],
        16: [
          q('Which response best compares CBT and psychoanalysis for an AP Psychology FRQ?', ['CBT focuses on changing thoughts and behaviors, while psychoanalysis emphasizes unconscious conflicts and early experiences', 'Both approaches rely only on medication', 'Psychoanalysis is a type of classical conditioning, while CBT ignores cognition', 'Neither approach can be described scientifically'], 'CBT focuses on changing thoughts and behaviors, while psychoanalysis emphasizes unconscious conflicts and early experiences', 'A strong comparison identifies the central mechanism of each therapy.'),
          q('Which AP Psychology exam skill is used when applying a disorder definition to a scenario?', ['Concept application', 'Random assignment', 'Standard deviation calculation only', 'Naturalistic observation'], 'Concept application', 'Students must connect a psychological concept to evidence in the prompt rather than merely define the term.'),
          q('Why should students avoid saying a therapy is always effective?', ['AP Psychology does not study therapy', 'Treatment outcomes depend on disorder, client factors, method quality, and evidence base', 'All therapies have identical outcomes', 'Only biomedical therapies can be evaluated'], 'Treatment outcomes depend on disorder, client factors, method quality, and evidence base', 'Evidence-based evaluation requires context and avoids absolute claims unsupported by data.'),
        ],
      },
    },
    {
      file: 'math/ap-statistics.json',
      modules: {
        15: [
          q('In a regression-inference case study, which condition checks whether a linear model is appropriate?', ['The scatterplot and residual plot show no strong curvature', 'The sample mean equals the sample median', 'The explanatory variable is measured in percentages', 'The response variable has exactly two categories'], 'The scatterplot and residual plot show no strong curvature', 'Regression inference for slope assumes the linear model is a reasonable description of the relationship.'),
          q('What does a confidence interval for the slope estimate?', ['The predicted y-value for every individual', 'A plausible range for the population regression slope', 'The correlation in the sample only', 'The intercept of the least-squares line'], 'A plausible range for the population regression slope', 'The interval estimates the population slope beta, not just the sample slope b.'),
          q('If a residual plot shows increasing spread as x increases, which condition is most directly threatened?', ['Independence', 'Normality of x', 'Constant standard deviation of residuals', 'Random assignment'], 'Constant standard deviation of residuals', 'Regression inference assumes roughly equal variability of residuals across x-values.'),
        ],
        16: [
          q('For AP Statistics, the correct conclusion to a significance test should include:', ['Only the p-value', 'A decision in context about the population parameter', 'A statement that the null hypothesis is proven true', 'Only a graph'], 'A decision in context about the population parameter', 'AP scoring expects students to connect the test result back to the parameter and real context.'),
          q('Which phrase correctly interprets a p-value?', ['The probability that the null hypothesis is true', 'The probability, assuming the null is true, of getting a result as extreme or more extreme than the observed result', 'The probability that the alternative is false', 'The probability that the sample was random'], 'The probability, assuming the null is true, of getting a result as extreme or more extreme than the observed result', 'A p-value is conditional on the null hypothesis and measures extremeness of the observed statistic.'),
          q('Which review task best prepares students for mixed AP Statistics free-response questions?', ['Memorizing calculator buttons only', 'Practicing parameter identification, condition checks, calculation, and contextual conclusion together', 'Ignoring assumptions to save time', 'Using the same test for every scenario'], 'Practicing parameter identification, condition checks, calculation, and contextual conclusion together', 'Free-response success depends on choosing the correct procedure and communicating assumptions, work, and conclusion.'),
        ],
      },
    },
  ];

  for (const repair of apRepairs) {
    const course = readCourse(repair.file);
    for (const [moduleOrder, questions] of Object.entries(repair.modules)) {
      addQuizQuestions(course, Number(moduleOrder), questions);
    }
    course.quizQuestions.sort((a, b) => a.moduleOrder - b.moduleOrder || a.order - b.order);
    writeCourse(repair.file, course);
    console.log(`Repaired AP tail-module quizzes: ${course.slug}`);
  }
}

repairExactAnswerKeys();
repairBusinessResearchMethods();
repairApTailModules();
