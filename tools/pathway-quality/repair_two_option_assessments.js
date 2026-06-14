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
  return out.sort();
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function clean(text) {
  return String(text || '')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '');
}

function cleanCorrectAnswer(text) {
  return clean(text)
    .replace(/\.\s+This reinforces .+$/i, '')
    .replace(/\.\s+Students need .+$/i, '')
    .replace(/\.\s+It connects .+$/i, '')
    .replace(/\.\s+The reasoning points .+$/i, '')
    .replace(/\.\s+The choice fits .+$/i, '')
    .trim();
}

function isTwoOption(question) {
  const options = Array.isArray(question.options) ? question.options.map(normalize) : [];
  return options.length === 2 && options.includes('true') && options.includes('false');
}

function parseTrueFalse(question) {
  const prompt = clean(question.question);
  const match = prompt.match(/^True or False:\s*(.+?)\s+is\s+"(.+)"$/i);
  const answer = normalize(question.answer);
  const explanation = clean(question.explanation);
  if (!match) {
    const plain = prompt.match(/^True or False:\s*(.+)$/i);
    if (!plain || answer !== 'true') return null;
    const statement = clean(plain[1]);
    return { statement, claimed: statement, correct: statement, plain: true };
  }
  const statement = clean(match[1]);
  const claimed = clean(match[2]);
  let correct = claimed;
  if (answer === 'false') {
    const correctMatch = explanation.match(/correct answer is:\s*(.+)$/i);
    if (!correctMatch) return null;
    correct = cleanCorrectAnswer(correctMatch[1]);
  }
  if (!correct || normalize(correct) === 'true' || normalize(correct) === 'false') return null;
  return { statement, claimed, correct };
}

function answerPool(course) {
  const values = [];
  for (const question of [...(course.quizQuestions || []), ...(course.questions || [])]) {
    if (Array.isArray(question.options)) {
      for (const option of question.options) values.push(clean(option));
    }
    values.push(clean(question.answer));
  }
  return values.filter((value) => {
    const low = normalize(value);
    return value && low !== 'true' && low !== 'false' && value.length <= 110;
  });
}

function poolDistractors(pool, correct, claimed) {
  const blocked = new Set([normalize(correct), normalize(claimed), 'true', 'false']);
  const out = [];
  if (claimed && normalize(claimed) !== normalize(correct)) out.push(claimed);
  for (const value of pool) {
    const low = normalize(value);
    if (!value || blocked.has(low) || out.some((item) => normalize(item) === low)) continue;
    out.push(value);
    if (out.length >= 3) break;
  }
  return out.slice(0, 3);
}

function genericDistractors(course, correct) {
  const department = String(course.department || '').toLowerCase();
  const lowCorrect = normalize(correct);
  const candidates = [];
  if (/^-?\d+(\.\d+)?$/.test(correct)) {
    const n = Number(correct);
    candidates.push(String(n + 1), String(n - 1), String(-n));
  }
  if (department.includes('math')) {
    candidates.push('The reciprocal of the correct value', 'The opposite sign of the correct value', 'The value before simplifying');
  } else if (department.includes('english')) {
    candidates.push('A supporting detail rather than the main concept', 'A related term with a different purpose', 'A sentence-level feature rather than the full idea');
  } else if (department.includes('science')) {
    candidates.push('A related vocabulary term with a different process', 'An observation that does not explain the cause', 'A result that ignores the stated conditions');
  } else {
    candidates.push('A related concept that does not fit the prompt', 'A narrower example rather than the full definition', 'An opposite or incomplete interpretation');
  }
  return candidates.filter((item) => normalize(item) !== lowCorrect).slice(0, 3);
}

function buildQuestion(statement) {
  const valueMatch = statement.match(/^The value of (.+)$/i);
  if (valueMatch) return `What is the value of ${valueMatch[1]}?`;
  const yIntercept = statement.match(/^The y-intercept of (.+)$/i);
  if (yIntercept) return `What is the y-intercept of ${yIntercept[1]}?`;
  const slope = statement.match(/^The slope of (.+)$/i);
  if (slope) return `What is the slope of ${slope[1]}?`;
  const period = statement.match(/^The period of (.+)$/i);
  if (period) return `What is the period of ${period[1]}?`;
  const magnitude = statement.match(/^The magnitude of (.+)$/i);
  if (magnitude) return `What is the magnitude of ${magnitude[1]}?`;
  const antiderivative = statement.match(/^The antiderivative of (.+)$/i);
  if (antiderivative) return `What is the antiderivative of ${antiderivative[1]}?`;
  const purpose = statement.match(/^The purpose of (.+)$/i);
  if (purpose) return `Which option best describes the purpose of ${purpose[1]}?`;
  const primary = statement.match(/^The primary (?:goal|benefit|function|purpose) of (.+)$/i);
  if (primary) return `Which option best describes the primary idea behind ${primary[1]}?`;
  const difference = statement.match(/^The difference between (.+)$/i);
  if (difference) return `Which option best explains the difference between ${difference[1]}?`;
  const mainIdea = statement.match(/^The main idea of (.+)$/i);
  if (mainIdea) return `Which option best states the main idea of ${mainIdea[1]}?`;
  return `Which option best completes this statement: ${statement} is...`;
}

function buildPlainQuestion(statement) {
  const about = statement.match(/^(.+?)\s+(?:is|was|are|were)\b/i);
  if (about) return `Which statement about ${clean(about[1])} is most accurate?`;
  return 'Which statement is most accurate?';
}

function shuffleDeterministic(values, seed) {
  const out = [...values];
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  for (let i = out.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function repairCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pool = answerPool(course);
  let changed = 0;
  let skipped = 0;
  for (const question of [...(course.quizQuestions || []), ...(course.questions || [])]) {
    if (!isTwoOption(question)) continue;
    const parsed = parseTrueFalse(question);
    if (!parsed) {
      skipped += 1;
      continue;
    }
    const distractors = [
      ...poolDistractors(pool, parsed.correct, parsed.claimed),
      ...genericDistractors(course, parsed.correct),
    ].filter((value, index, arr) => arr.findIndex((item) => normalize(item) === normalize(value)) === index);
    if (distractors.length < 3) {
      skipped += 1;
      continue;
    }
    const options = shuffleDeterministic([parsed.correct, ...distractors.slice(0, 3)], `${course.slug}:${question.question}`);
    question.type = 'mc';
    question.question = parsed.plain ? buildPlainQuestion(parsed.statement) : buildQuestion(parsed.statement);
    question.options = options;
    question.answer = parsed.correct;
    question.explanation = `The best answer is ${parsed.correct}. It directly fits the prompt, while the other choices reflect different course ideas, incomplete definitions, or common mistakes.`;
    changed += 1;
  }
  if (changed && !DRY_RUN) fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  return { file: path.relative(ROOT, file), slug: course.slug, changed, skipped };
}

function main() {
  const rows = walk(COURSE_DIR).map(repairCourse).filter((row) => row.changed || row.skipped);
  const totals = rows.reduce((acc, row) => {
    acc.changed += row.changed;
    acc.skipped += row.skipped;
    return acc;
  }, { changed: 0, skipped: 0 });
  console.log(`${DRY_RUN ? 'Would rewrite' : 'Rewrote'} ${totals.changed} two-option items across ${rows.length} course files; skipped=${totals.skipped}.`);
  for (const row of rows.slice(0, 25)) console.log(`- ${row.slug}: changed=${row.changed}, skipped=${row.skipped} (${row.file})`);
  if (rows.length > 25) console.log(`- ... ${rows.length - 25} more course files`);
}

main();
