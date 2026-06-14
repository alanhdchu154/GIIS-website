#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const COURSE_DIR = path.join(ROOT, 'server', 'prisma', 'courses');

const ACTION_VERBS = /\b(analyze|apply|argue|calculate|classify|compare|construct|create|define|demonstrate|describe|design|determine|differentiate|draft|evaluate|explain|identify|interpret|justify|model|predict|research|revise|solve|summarize|support|trace|write)\b/gi;
const RESOURCE_NOTE_GENERIC_RE = /^(reading|video|practice|lesson|article|exercise|worksheet|resource|tutorial)$/i;

const TITLE_REPLACEMENTS = {
  'ap-psychology|7': { title: 'Memory Systems & Retrieval', titleZh: '记忆系统与提取' },
  'calculus|1': { title: 'Limits & Continuity Foundations', titleZh: '极限与连续性基础' },
  'geometry|9': { title: 'Circles, Arcs & Angles', titleZh: '圆、弧与角' },
  'geometry|10': { title: 'Area, Composite Figures & Applications', titleZh: '面积、组合图形与应用' },
  'intro-psychology|7': { title: 'Memory Systems & Retrieval', titleZh: '记忆系统与提取' },
  'pre-calculus|9': { title: 'Vectors & Directional Quantities', titleZh: '向量与方向量' },
  'psychology|6': { title: 'Memory Systems & Retrieval', titleZh: '记忆系统与提取' },
  'sociology|3': { title: 'Culture, Norms & Social Meaning', titleZh: '文化、规范与社会意义' },
  'trigonometry|12': { title: 'Vectors & Trigonometric Applications', titleZh: '向量与三角应用' },
};

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out.sort();
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function actionVerbCount(text) {
  const matches = String(text || '').match(ACTION_VERBS) || [];
  return new Set(matches.map((item) => item.toLowerCase())).size;
}

function departmentFamily(course) {
  const text = `${course.department || ''} ${course.type || ''} ${course.name || ''}`.toLowerCase();
  if (/math|calculus|algebra|geometry|statistics|trigonometry/.test(text)) return 'math';
  if (/science|biology|chemistry|physics|environmental/.test(text)) return 'science';
  if (/english|writing|literature|composition|communication/.test(text)) return 'english';
  if (/social|history|government|geography|psychology|sociology/.test(text)) return 'social';
  if (/business|marketing|finance|economics|law|entrepreneur/.test(text)) return 'business';
  if (/technology|computer|digital|media/.test(text)) return 'technology';
  if (/physical|health|fitness|sport|athletic/.test(text)) return 'health';
  return 'general';
}

function objectiveExtension(course) {
  switch (departmentFamily(course)) {
    case 'math':
      return 'Students will show step-by-step reasoning, check solutions for accuracy, and apply the method to the module assignment or a real problem.';
    case 'science':
      return 'Students will use vocabulary, models, and evidence to interpret examples, support scientific explanations, and connect the concept to the module assignment.';
    case 'english':
      return 'Students will analyze model texts, draft or revise written responses, and support claims with textual evidence in the module assignment.';
    case 'social':
      return 'Students will interpret sources or examples, explain cause-and-effect relationships, and support claims with evidence in the module assignment.';
    case 'business':
      return 'Students will evaluate realistic scenarios, apply concepts to decisions, and justify recommendations with evidence in the module assignment.';
    case 'technology':
      return 'Students will apply the tool or concept in a practical task, explain design choices, and produce evidence of working skill in the module assignment.';
    case 'health':
      return 'Students will connect concepts to safe practice, explain risks or benefits, and document evidence of understanding in the module assignment.';
    default:
      return 'Students will apply the concept in a concrete task, explain reasoning clearly, and produce evidence that connects to the module assignment.';
  }
}

function shouldStrengthenObjective(text) {
  const value = String(text || '').trim();
  return !value || value.length < 130 || words(value).length < 18 || actionVerbCount(value) < 2;
}

function strengthenObjective(course, text) {
  const value = String(text || '').trim();
  const extension = objectiveExtension(course);
  if (!value) return extension;
  if (/module assignment|evidence/i.test(value) && value.length >= 130 && words(value).length >= 18 && actionVerbCount(value) >= 2) return value;
  return `${value.replace(/\.$/, '')}. ${extension}`;
}

function resourceExtension(field, mod) {
  const title = mod.title || `Module ${mod.order}`;
  if (field === 'readingNote') return `for background reading on ${title} before the quiz and assignment`;
  if (field === 'videoNote' || field === 'video2Note') return `for a visual explanation of ${title} before guided practice`;
  if (field === 'practiceNote') return `for independent practice on ${title} before submitting the assignment`;
  return `for ${title} study support`;
}

function shouldStrengthenNote(note) {
  const value = String(note || '').trim();
  return Boolean(value) && (value.length < 35 || RESOURCE_NOTE_GENERIC_RE.test(value));
}

function strengthenNote(note, field, mod) {
  const value = String(note || '').trim();
  if (!shouldStrengthenNote(value)) return value;
  const suffix = resourceExtension(field, mod);
  if (/before the quiz|before guided practice|before submitting/i.test(value)) return value;
  return `${value} — ${suffix}`;
}

function repairCourse(file) {
  const course = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  const stats = {
    objectives: 0,
    resourceNotes: 0,
    titles: 0,
    hours: 0,
  };

  for (const mod of course.modules || []) {
    const titleReplacement = TITLE_REPLACEMENTS[`${course.slug}|${mod.order}`];
    if (titleReplacement) {
      if (mod.title !== titleReplacement.title) {
        mod.title = titleReplacement.title;
        changed = true;
        stats.titles += 1;
      }
      if (mod.titleZh !== titleReplacement.titleZh) {
        mod.titleZh = titleReplacement.titleZh;
        changed = true;
      }
    }

    if (shouldStrengthenObjective(mod.objectives)) {
      const next = strengthenObjective(course, mod.objectives);
      if (next !== mod.objectives) {
        mod.objectives = next;
        changed = true;
        stats.objectives += 1;
      }
    }

    for (const field of ['readingNote', 'videoNote', 'video2Note', 'practiceNote']) {
      if (!String(mod[field] || '').trim()) continue;
      const next = strengthenNote(mod[field], field, mod);
      if (next !== mod[field]) {
        mod[field] = next;
        changed = true;
        stats.resourceNotes += 1;
      }
    }
  }

  if (course.slug === 'geography') {
    for (const mod of course.modules || []) {
      const current = Number(mod.estimatedHrs || 0);
      if (current < 2.25) {
        mod.estimatedHrs = 2.25;
        changed = true;
        stats.hours += 1;
      }
    }
  }

  if (changed) fs.writeFileSync(file, `${JSON.stringify(course, null, 2)}\n`);
  return { changed, stats, slug: course.slug };
}

function main() {
  const totals = { files: 0, objectives: 0, resourceNotes: 0, titles: 0, hours: 0 };
  for (const file of walk(COURSE_DIR)) {
    const result = repairCourse(file);
    if (!result.changed) continue;
    totals.files += 1;
    for (const key of ['objectives', 'resourceNotes', 'titles', 'hours']) totals[key] += result.stats[key];
  }
  console.log(`Repaired module syllabus fields in ${totals.files} course files.`);
  console.log(`Objectives strengthened: ${totals.objectives}`);
  console.log(`Resource notes strengthened: ${totals.resourceNotes}`);
  console.log(`Module titles clarified: ${totals.titles}`);
  console.log(`Estimated-hour entries adjusted: ${totals.hours}`);
}

main();
