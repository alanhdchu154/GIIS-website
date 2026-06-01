#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DRY_RUN = process.argv.includes('--dry-run');

const TRUE_FALSE_RE = /^True or False: The answer to "([\s\S]+?)" is: ([\s\S]+)$/;
const FILL_RE = /^Fill in the blank: Complete: In the context of the topic, ___ refers to "([\s\S]+?)"\.?$/;
const CLAIM_RE = /^Evaluate this answer claim: For the prompt "([\s\S]+?)", the correct response is "([\s\S]+?)"\.$/;
const RESPONSE_CHECK_RE = /^Review this response for accuracy\. Prompt: "([\s\S]+?)" Student response: "([\s\S]+?)"\.$/;
const CORRECT_RESPONSE_RE = /The correct response is "([A-D])"\./;
const LETTER_ONLY_EXPLANATION_RE = /A correct response is "([A-D])"\./i;

const MANUAL_ANSWER_OVERRIDES = new Map(Object.entries({
  'which thesis statement is the most specific and debatable': 'A focused thesis that takes a clear position and can be supported with evidence',
  'patchwriting is a form of plagiarism because it': 'It keeps the source structure or ideas while changing only some words without proper attribution',
  'the quotation sandwich method requires that every quotation be': 'Introduced, quoted, and then explained or analyzed in the writer\'s own words',
  'proxemics is the study of how people use': 'Space and physical distance in communication',
  'which type of communication behavior would be classified as an informal channel in organizational communication': 'Grapevine communication, rumors, or unofficial peer-to-peer information sharing',
  'cultivation theory developed by george gerbner proposes that': 'Long-term media exposure gradually shapes how audiences perceive reality',
  'your digital footprint refers to': 'The record or trail of data created by a person\'s online activity',
  'net neutrality requires that internet service providers': 'Treat legal internet traffic equally without blocking, throttling, or paid prioritization',
  'rural communities most significant digital divide challenge is': 'Limited access to reliable high-speed broadband infrastructure',
  'aristotles concept of eudaimonia refers to': 'Human flourishing or living well through virtue',
  'post hoc ergo propter hoc is the fallacy of assuming': 'That one event caused another simply because it happened first',
  'peter singers utilitarian argument for animal rights rests on the claim that': 'The capacity to suffer gives an animal moral consideration',
  'denotative meaning refers to a words': 'Literal or dictionary definition',
  'impression management as described by erving goffman involves': 'Presenting oneself strategically to influence how others perceive the interaction',
  'social exchange theory suggests that people remain in relationships when': 'Perceived rewards outweigh costs and alternatives seem less attractive',
  'cultivation theorys mean world syndrome predicts that heavy tv viewers will': 'Perceive the world as more dangerous or violent than it really is',
  'the hypodermic needle model of media effects proposed that media messages': 'Directly and powerfully affect passive audiences',
  'the whitewashing problem in hollywood refers to': 'Casting white actors in roles or stories associated with people of color',
  'cultivation theory proposes that televisions most significant long-term effect on audiences is': 'Gradually shaping viewers\' perceptions of social reality',
  'the first amendment protects press freedom primarily by': 'Limiting government censorship and prior restraint of the press',
  'defamation requires a plaintiff to prove which of the following elements': 'A false statement of fact, publication to another party, fault, and harm',
  'an editorial in a newspaper represents the views of': 'The editorial board or publication leadership',
  'a cover letter for a volunteer opportunity should': 'Connect the applicant\'s skills and motivation to the organization\'s needs',
  'writing for the ear in broadcast journalism requires': 'Short, conversational sentences that are easy to understand when heard once',
  'trans fats are especially harmful because they': 'Raise LDL cholesterol, lower HDL cholesterol, and increase heart disease risk',
  'which food contains a complete protein': 'A food with all essential amino acids, such as eggs, dairy, meat, fish, soy, or quinoa',
  'the dash diet was designed to reduce': 'High blood pressure',
  'the fight-or-flight stress response involves release of': 'Adrenaline and cortisol',
  'consent in sexual health requires that agreement be': 'Freely given, informed, specific, reversible, and enthusiastic',
  'a wellness plan is most effective when it': 'Uses realistic goals, clear action steps, and progress checks across multiple wellness dimensions',
  'which goal type focuses on controllable behaviors during performance': 'Process goals',
  'broad-external attentional focus is most useful for': 'Scanning the environment and monitoring multiple cues at once',
  'the flow state is most likely to occur when': 'Skill level and challenge are balanced, with clear goals and immediate feedback',
  'in the demographic transition model stage 4 is characterized by': 'Low birth rates, low death rates, and slow or stable population growth',
  'the human development index hdi is a better measure than gdp per capita because it': 'Includes health and education indicators along with income',
  'the green revolution of the 1960s 70s primarily increased food production through': 'High-yield crop varieties, irrigation, fertilizers, pesticides, and mechanization',
  'a research hypothesis must be': 'A specific, testable prediction about the relationship between variables',
  'which measure of central tendency is most appropriate when a dataset has extreme outliers': 'The median',
  'snowball sampling is most useful for studying': 'Hard-to-reach or hidden populations',
  'realism in ir assumes that the international system is characterized by': 'Anarchy, state self-help, and competition for power or security',
  'the security dilemma in international relations refers to': 'One state\'s defensive actions making other states feel less secure, which can trigger escalation',
  'the paris agreements nationally determined contributions ndcs are': 'Each country\'s self-defined climate action targets and commitments',
}));

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function cleanText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:?!])/g, '$1')
    .trim();
}

function stripTrailingSentencePunctuation(text) {
  return cleanText(text).replace(/[.?!]+$/g, '').trim();
}

function normalizePrompt(text) {
  return stripTrailingSentencePunctuation(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(text) {
  const value = cleanText(text);
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanQuotedPrompt(text) {
  let prompt = cleanText(text)
    .replace(/:\.$/, ':')
    .replace(/\s+\.$/, '.')
    .replace(/\s+:/g, ':');

  if (prompt.endsWith(':')) prompt = prompt.slice(0, -1).trim();
  return stripTrailingSentencePunctuation(prompt);
}

function questionify(prompt) {
  const cleaned = cleanQuotedPrompt(prompt);
  const lower = cleaned.toLowerCase();

  if (/^(who|what|when|where|why|how|which)\b/.test(lower)) {
    return `${capitalize(cleaned)}?`;
  }

  if (/\b(is|are|was|were|does|do|did|can|could|should|would)\b/.test(lower) && /^(a|an|the|in|according|when|if)\b/.test(lower)) {
    return `Complete this statement: ${capitalize(cleaned)}...`;
  }

  return `Define or explain: ${capitalize(cleaned)}.`;
}

function repairTrueFalseQuestion(question) {
  const match = cleanText(question.question).match(TRUE_FALSE_RE);
  if (!match) return false;

  const sourcePrompt = stripTrailingSentencePunctuation(match[1]);
  const claimedAnswer = stripTrailingSentencePunctuation(match[2]);
  const correctAnswer = String(question.answer || '').trim().toLowerCase() === 'true';
  const falseExplanation = cleanText(question.explanation).match(/^False\. The correct answer is: ([\s\S]+)$/i);

  question.question = `Review this response for accuracy. Prompt: "${sourcePrompt}" Student response: "${claimedAnswer}".`;

  if (correctAnswer) {
    question.explanation = `This response is accurate. "${claimedAnswer}" correctly answers the prompt.`;
  } else if (falseExplanation) {
    question.explanation = `This response is not accurate. A correct response is "${stripTrailingSentencePunctuation(falseExplanation[1])}".`;
  } else {
    question.explanation = 'This response is not accurate. Review the module explanation for the correct response.';
  }

  return true;
}

function repairFillQuestion(question) {
  const match = cleanText(question.question).match(FILL_RE);
  if (!match) return false;

  question.question = `Short response: ${questionify(match[1])}`;

  const genericAnswer = /^A complete response should answer this prompt directly:/i.test(cleanText(question.answer));
  if (genericAnswer) {
    question.explanation = 'A strong response states the concept clearly, uses course vocabulary, and connects the idea to the module context.';
  } else if (/^The correct answer is:/i.test(cleanText(question.explanation))) {
    question.explanation = `A correct response identifies "${stripTrailingSentencePunctuation(question.answer)}" and connects it to the module context.`;
  }

  return true;
}

function repairQuestion(question) {
  if (!question || typeof question !== 'object') return null;
  if (repairTrueFalseQuestion(question)) return 'trueFalse';
  if (repairFillQuestion(question)) return 'fill';
  if (repairAnswerClaimLanguage(question)) return 'answerClaimLanguage';
  return null;
}

function repairAnswerClaimLanguage(question) {
  const claim = cleanText(question.question).match(CLAIM_RE);
  if (!claim) return false;

  const sourcePrompt = stripTrailingSentencePunctuation(claim[1]);
  const response = stripTrailingSentencePunctuation(claim[2]);
  question.question = `Review this response for accuracy. Prompt: "${sourcePrompt}" Student response: "${response}".`;

  if (/^This answer claim is true\./i.test(cleanText(question.explanation))) {
    question.explanation = `This response is accurate. "${response}" correctly answers the prompt.`;
  } else if (/^This answer claim is false\./i.test(cleanText(question.explanation))) {
    const correct = cleanText(question.explanation).match(/The correct response is "([\s\S]+?)"\./i);
    question.explanation = correct
      ? `This response is not accurate. A correct response is "${stripTrailingSentencePunctuation(correct[1])}".`
      : 'This response is not accurate. Review the module explanation for the correct response.';
  }

  return true;
}

function buildAnswerLookup(course) {
  const lookup = new Map(MANUAL_ANSWER_OVERRIDES);
  for (const question of [...(course.quizQuestions || []), ...(course.questions || [])]) {
    const answer = cleanText(question.answer);
    if (!answer || /^(true|false|[A-D])$/i.test(answer) || /^A complete response should/i.test(answer)) continue;
    lookup.set(normalizePrompt(question.question), stripTrailingSentencePunctuation(answer));
  }
  return lookup;
}

function resolveLetterClaims(course) {
  const lookup = buildAnswerLookup(course);
  let resolved = 0;

  for (const question of [...(course.quizQuestions || []), ...(course.questions || [])]) {
    const claim = cleanText(question.question).match(CLAIM_RE) || cleanText(question.question).match(RESPONSE_CHECK_RE);
    if (claim && /^[A-D]$/i.test(claim[2])) {
      const answer = lookup.get(normalizePrompt(claim[1]));
      if (answer) {
        question.question = `Review this response for accuracy. Prompt: "${stripTrailingSentencePunctuation(claim[1])}" Student response: "${answer}".`;
        if (String(question.answer || '').trim().toLowerCase() === 'true') {
          question.explanation = `This response is accurate. "${answer}" correctly answers the prompt.`;
        }
        resolved += 1;
      }
    }

    const correctResponse = cleanText(question.explanation).match(CORRECT_RESPONSE_RE);
    if (claim && correctResponse) {
      const answer = lookup.get(normalizePrompt(claim[1]));
      if (answer) {
        question.explanation = `This response is not accurate. A correct response is "${answer}".`;
        resolved += 1;
      }
    }
  }

  return resolved;
}

function repairLetterOnlyExplanations(course) {
  let repaired = 0;
  for (const question of [...(course.quizQuestions || []), ...(course.questions || [])]) {
    const explanation = cleanText(question.explanation);
    if (LETTER_ONLY_EXPLANATION_RE.test(explanation)) {
      question.explanation = explanation.replace(LETTER_ONLY_EXPLANATION_RE, 'Review the module explanation for the correct response.');
      repaired += 1;
    }
  }
  return repaired;
}

function repairCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const counts = { trueFalse: 0, fill: 0, answerClaimLanguage: 0, letterClaims: 0, letterExplanations: 0 };

  for (const collection of [course.quizQuestions || [], course.questions || []]) {
    for (const question of collection) {
      const repaired = repairQuestion(question);
      if (repaired) counts[repaired] += 1;
    }
  }

  counts.letterClaims = resolveLetterClaims(course);
  counts.letterExplanations = repairLetterOnlyExplanations(course);

  const changed = counts.trueFalse + counts.fill + counts.answerClaimLanguage + counts.letterClaims + counts.letterExplanations;
  if (changed && !DRY_RUN) {
    fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  }

  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    changed,
    ...counts,
  };
}

function main() {
  const rows = walk(COURSE_DIR).map(repairCourse).filter((row) => row.changed > 0);
  const totals = rows.reduce(
    (acc, row) => {
      acc.files += 1;
      acc.questions += row.changed;
      acc.trueFalse += row.trueFalse;
      acc.fill += row.fill;
      acc.answerClaimLanguage += row.answerClaimLanguage;
      acc.letterClaims += row.letterClaims;
      acc.letterExplanations += row.letterExplanations;
      return acc;
    },
    { files: 0, questions: 0, trueFalse: 0, fill: 0, answerClaimLanguage: 0, letterClaims: 0, letterExplanations: 0 },
  );

  console.log(`${DRY_RUN ? 'Would repair' : 'Repaired'} ${totals.questions} generated assessment prompts in ${totals.files} course files.`);
  console.log(`- true/false answer-claim prompts: ${totals.trueFalse}`);
  console.log(`- short-response fill prompts: ${totals.fill}`);
  console.log(`- answer-claim language softened: ${totals.answerClaimLanguage}`);
  console.log(`- letter-only answer claims resolved: ${totals.letterClaims}`);
  console.log(`- letter-only explanations repaired: ${totals.letterExplanations}`);

  for (const row of rows) {
    console.log(`  ${row.file}: ${row.changed} (${row.trueFalse} true/false, ${row.fill} short-response, ${row.answerClaimLanguage} language, ${row.letterClaims} letter claims, ${row.letterExplanations} explanations)`);
  }
}

main();
