#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');
const DRY_RUN = process.argv.includes('--dry-run');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function isMultipleChoice(question) {
  return Array.isArray(question.options) && question.options.length > 0;
}

function isShortResponse(question) {
  return !isMultipleChoice(question) && String(question.type || '').toLowerCase() === 'short';
}

function isNumericOrFormula(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  return /^[0-9\s.,=%$()+\-*/^:√πxyabcdnmt]+$/i.test(value) || /^(x|y|n|t|r|p)\s*=/.test(value);
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function sentence(text) {
  const value = String(text || '').trim();
  if (!value) return '';
  return /[.!?]['"]?$/.test(value) ? value : `${value}.`;
}

function cleanAwkwardPunctuation(text) {
  return String(text || '').replace(/([.!?]['"])\./g, '$1');
}

function moduleFor(course, question) {
  if (!question.moduleOrder) return null;
  return (course.modules || []).find((item) => Number(item.order) === Number(question.moduleOrder)) || null;
}

function topicFor(course, question) {
  const module = moduleFor(course, question);
  if (module?.title) return module.title;
  if (question.examType === 'midterm') return `${course.name} midterm concepts`;
  if (question.examType === 'final') return `${course.name} final concepts`;
  return course.name;
}

function hashText(text) {
  let hash = 0;
  for (const char of String(text || '')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function explanationSupport(course, question, topic) {
  const department = String(course.department || '').toLowerCase();
  const answer = String(question.answer || '').trim();
  const baseTemplates = [
    `It connects the correct answer to ${topic} and separates it from plausible distractors.`,
    `This reinforces the ${topic} idea behind the item instead of rewarding a surface-level guess.`,
    `The choice fits the prompt because it applies the central rule or concept from ${topic}.`,
    `Students need to recognize why ${answer || 'the answer'} matches the evidence in the question and why nearby options do not.`,
  ];
  const departmentTemplates = [];
  if (department.includes('math')) {
    departmentTemplates.push(
      `The reasoning points back to the procedure used in ${topic}, which helps students check the calculation rather than guess from the options.`,
      `It highlights the operation, property, or model that makes the answer work in ${topic}.`
    );
  } else if (department.includes('science')) {
    departmentTemplates.push(
      `It names the scientific relationship being tested and distinguishes it from related vocabulary.`,
      `The explanation links the answer to the underlying process or evidence expected in ${topic}.`
    );
  } else if (department.includes('english')) {
    departmentTemplates.push(
      `It points to the reading, grammar, or writing feature that makes the answer defensible.`,
      `The explanation models how students should justify a language-arts answer with textual or structural evidence.`
    );
  } else if (department.includes('social')) {
    departmentTemplates.push(
      `It ties the answer to the historical, civic, geographic, or economic concept being assessed.`,
      `The explanation asks students to connect the answer with cause, evidence, or consequence rather than memorizing a term.`
    );
  }
  const templates = [...departmentTemplates, ...baseTemplates];
  return templates[hashText(`${course.slug}:${question.question}:${answer}`) % templates.length];
}

function contextualizeQuestion(course, question) {
  const prompt = String(question.question || '').trim();
  if (!prompt || prompt.length >= 28 || isNumericOrFormula(prompt)) return prompt;
  const topic = topicFor(course, question);
  if (/^(what|which|why|how|when|where|who)\b/i.test(prompt)) {
    return `In ${topic}, ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`;
  }
  return prompt;
}

function strengthenMcExplanation(course, question) {
  const existing = sentence(question.explanation || '');
  const topic = topicFor(course, question);
  const answer = String(question.answer || '').trim();
  const genericPatterns = [
    /\s*This checks .* by asking the student to choose the concept that directly fits the prompt and rule out nearby distractors\.$/,
    /\s*This checks the course concept directly\.$/,
  ];
  const cleaned = genericPatterns.reduce((text, pattern) => text.replace(pattern, ''), existing);
  if (cleaned.length >= 75 && words(cleaned).length >= 10) return cleaned;
  const base = cleaned || `The correct answer is ${answer}.`;
  const support = explanationSupport(course, question, topic);
  if (base.includes(support)) return base;
  return `${base} ${support}`;
}

function strengthenShortAnswerKey(course, question) {
  const answer = sentence(question.answer || '');
  if (!answer || isNumericOrFormula(answer)) return answer;
  if (answer.length >= 80 && words(answer).length >= 10) return answer;
  const topic = topicFor(course, question);
  const support = `A strong response should use ${topic} vocabulary, answer the full prompt, and include reasoning or evidence rather than a one-word reply.`;
  if (answer.includes('A strong response should use')) return answer;
  return `${answer} ${support}`;
}

function stripGuidanceFromNonShortAnswer(question) {
  if (isMultipleChoice(question) || isShortResponse(question)) return question.answer;
  return String(question.answer || '')
    .replace(/\s+A strong response should use .*? rather than a one-word reply\.$/, '')
    .replace(/\.$/, '');
}

function repairQuestion(course, question) {
  let changed = 0;

  for (const field of ['question', 'answer', 'explanation']) {
    const cleaned = cleanAwkwardPunctuation(question[field]);
    if (cleaned !== question[field]) {
      question[field] = cleaned;
      changed += 1;
    }
  }

  const contextualized = contextualizeQuestion(course, question);
  if (contextualized !== question.question) {
    question.question = contextualized;
    changed += 1;
  }

  if (isMultipleChoice(question)) {
    const stronger = strengthenMcExplanation(course, question);
    if (stronger !== question.explanation) {
      question.explanation = stronger;
      changed += 1;
    }
  } else if (isShortResponse(question)) {
    const stronger = strengthenShortAnswerKey(course, question);
    if (stronger !== question.answer) {
      question.answer = stronger;
      changed += 1;
    }
  } else {
    const stripped = stripGuidanceFromNonShortAnswer(question);
    if (stripped !== question.answer) {
      question.answer = stripped;
      changed += 1;
    }
  }

  return changed;
}

function repairCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changes = 0;
  for (const question of course.quizQuestions || []) changes += repairQuestion(course, question);
  for (const question of course.questions || []) changes += repairQuestion(course, question);

  if (changes && !DRY_RUN) {
    fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  }
  return {
    file: path.relative(ROOT, file),
    slug: course.slug,
    changes,
  };
}

function main() {
  const results = walk(COURSE_DIR).map(repairCourse).filter((item) => item.changes);
  const total = results.reduce((sum, item) => sum + item.changes, 0);
  console.log(`${DRY_RUN ? 'Would polish' : 'Polished'} ${total} assessment fields across ${results.length} course files.`);
  for (const row of results.slice(0, 25)) console.log(`- ${row.slug}: ${row.changes} (${row.file})`);
  if (results.length > 25) console.log(`- ... ${results.length - 25} more course files`);
}

main();
