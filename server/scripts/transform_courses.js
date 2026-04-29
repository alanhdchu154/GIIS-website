/**
 * transform_courses.js
 * - Fixes AP course types (type: 'AP')
 * - Assigns gradeLevel to core grade-specific courses
 * - Trims module counts: 0.5cr→8, 1cr elective→12, 1cr core→14
 * - Varies quiz questions per module (3–6) with MC, True/False, fill-in-blank
 * - Adds explanations to all questions
 * - Adds question variety to exams (T/F + fill-blank)
 */

const fs = require('fs');
const path = require('path');

// ── Grade level assignments for core courses ──────────────────────────────────
const GRADE_LEVEL = {
  // G9
  'english-i': 9, 'english-i-writing': 9, 'english-i-writing-focus': 9,
  'algebra-i': 9, 'biology': 9, 'world-history': 9,
  'digital-literacy': 9, 'intro-communication': 9, 'geometry': 9,
  'environmental-science': 9, 'geography': 9,
  // G10
  'english-ii': 10, 'english-ii-literature': 10,
  'algebra-ii': 10, 'chemistry': 10, 'us-history': 10,
  'pre-calculus': 10, 'physics-fundamentals': 10, 'global-economics-politics': 10,
  // G11
  'english-iii': 11, 'english-iii-literature': 11,
  'statistics': 11, 'research-methods-social-science': 11,
  'economics': 11, 'government': 11, 'sociology': 11,
  'world-politics': 11, 'intro-economics': 11,
  'human-development': 11, 'psychology-foundations': 11,
  // G12
  'english-iv-writing': 12, 'english-iv-advanced-composition': 12,
  'english-iv-analytical-writing': 12, 'english-iv-media-analytical-writing': 12,
  'english-iv-media-writing': 12,
  'calculus': 12, 'ap-statistics': 12, 'ap-biology': 12,
  'ap-psychology': 12, 'ap-human-geography': 12,
  'economics-advanced': 12, 'economics-seminar': 12,
  'business-research-methods': 12, 'statistics-for-social-sciences': 12,
};

// ── Target module counts ──────────────────────────────────────────────────────
function targetModules(course) {
  const cr = parseFloat(course.credits);
  const isAP = course.name.startsWith('AP ') || course.slug.startsWith('ap-');
  if (isAP) return 16;          // AP: more rigorous
  if (cr <= 0.5) return 8;      // Half-credit: 8 modules
  // 1 credit
  const heavyDepts = ['Mathematics', 'Science'];
  if (heavyDepts.includes(course.department)) return 14;
  if (course.type === 'Core') return 13;
  return 11;                    // 1-credit elective
}

// ── Question-count pattern per module index ───────────────────────────────────
// Returns {mc, tf, fib} counts summing to 3–6 questions
function moduleQPattern(modIdx, dept) {
  const isMath = ['Mathematics'].includes(dept);
  const isScience = ['Science'].includes(dept);
  const patterns = isMath
    ? [{mc:3,tf:1,fib:1},{mc:4,tf:1,fib:0},{mc:3,tf:2,fib:0},{mc:4,tf:0,fib:2},{mc:5,tf:1,fib:0},{mc:3,tf:1,fib:2}]
    : isScience
    ? [{mc:3,tf:1,fib:1},{mc:4,tf:1,fib:0},{mc:3,tf:2,fib:0},{mc:4,tf:1,fib:0},{mc:3,tf:1,fib:1},{mc:5,tf:0,fib:0}]
    : [{mc:2,tf:1,fib:1},{mc:3,tf:1,fib:0},{mc:3,tf:0,fib:1},{mc:4,tf:0,fib:0},{mc:2,tf:2,fib:0},{mc:3,tf:1,fib:1}];
  return patterns[modIdx % patterns.length];
}

// ── Statement builder for T/F questions ──────────────────────────────────────
function buildStatement(question, answer) {
  const q = question.trim().replace(/\?$/, '');
  if (/^what (is|are|was|were) /i.test(q)) {
    const subj = q.replace(/^what (is|are|was|were) /i, '').trim();
    return `${subj.charAt(0).toUpperCase() + subj.slice(1)} is "${answer}".`;
  }
  if (/^where did /i.test(q)) {
    return `${q.replace(/^where did /i, '').trim().charAt(0).toUpperCase() + q.replace(/^where did /i, '').trim().slice(1)} occurred in ${answer}.`;
  }
  if (/^who (was|is|invented|discovered|wrote|founded|led)/i.test(q)) {
    const rest = q.replace(/^who /i, '');
    return `${answer} ${rest}.`;
  }
  if (/^when did /i.test(q)) {
    const rest = q.replace(/^when did /i, '');
    return `${rest.charAt(0).toUpperCase() + rest.slice(1)} occurred in ${answer}.`;
  }
  return `The answer to "${q}" is: ${answer}.`;
}

function generateTF(mc, useTrue) {
  const answer = useTrue ? mc.answer : mc.options.find(o => o !== mc.answer);
  const stmt = buildStatement(mc.question, answer);
  return {
    moduleOrder: mc.moduleOrder,
    order: mc.order,
    question: `True or False: ${stmt}`,
    options: ['True', 'False'],
    answer: useTrue ? 'True' : 'False',
    explanation: useTrue
      ? `True. ${mc.answer} is correct.`
      : `False. The correct answer is: ${mc.answer}.`,
    points: 1,
  };
}

// ── Fill-in-blank generator ───────────────────────────────────────────────────
function generateFIB(mc) {
  const ans = mc.answer.trim();
  if (ans.split(/\s+/).length > 3) return null;

  let stmt;
  const q = mc.question.trim().replace(/\?$/, '');
  if (/^what (is|are|was|were) /i.test(q)) {
    const subj = q.replace(/^what (is|are|was|were) /i, '').trim();
    stmt = `___ is ${subj.toLowerCase()}.`;
  } else if (/^where did /i.test(q)) {
    const rest = q.replace(/^where did /i, '');
    stmt = `${rest.charAt(0).toUpperCase() + rest.slice(1)} in ___.`;
  } else if (/^who /i.test(q)) {
    const rest = q.replace(/^who /i, '');
    stmt = `___ ${rest.toLowerCase()}.`;
  } else {
    // Generic: blank the answer in context
    stmt = `Complete: In the context of the topic, ___ refers to "${q.toLowerCase()}."`;
  }
  return {
    moduleOrder: mc.moduleOrder,
    order: mc.order,
    question: `Fill in the blank: ${stmt}`,
    options: null,
    answer: ans,
    explanation: `The correct answer is: ${ans}.`,
    points: 1,
  };
}

// ── Exam question variety ─────────────────────────────────────────────────────
function transformExamQ(q, idx) {
  const total = idx;
  // Every 4th question → T/F; every 7th → fill-blank (if short answer)
  if (total % 7 === 6) {
    const ans = q.answer.trim();
    if (ans.split(/\s+/).length <= 3) {
      return { ...q, type: 'fill', options: null,
        explanation: `The correct answer is: ${ans}.` };
    }
  }
  if (total % 4 === 3) {
    const useTrue = total % 8 < 4;
    const answer = useTrue ? q.answer : (q.options || []).find(o => o !== q.answer) || q.answer;
    const stmt = buildStatement(q.question, answer);
    return { ...q, type: 'tf', options: ['True', 'False'],
      question: `True or False: ${stmt}`,
      answer: useTrue ? 'True' : 'False',
      explanation: useTrue ? `True. ${q.answer} is correct.` : `False. The correct answer is: ${q.answer}.`,
    };
  }
  // Keep as MC, ensure explanation
  return { ...q, explanation: q.explanation || `The correct answer is: ${q.answer}.` };
}

// ── Generate extra modules for AP (pad from 14→16) ────────────────────────────
function padAPModules(modules) {
  if (modules.length >= 16) return modules;
  const last = modules[modules.length - 1];
  const extensions = [
    { suffix: ' — Advanced Applications', note: 'In-depth case studies and real-world applications.' },
    { suffix: ' — Synthesis & Review', note: 'Comprehensive review and AP exam preparation strategies.' },
  ];
  const padded = [...modules];
  for (let i = 0; i < 16 - modules.length; i++) {
    const ext = extensions[i % extensions.length];
    padded.push({
      ...last,
      order: modules.length + i + 1,
      title: last.title + ext.suffix,
      titleZh: last.titleZh + ext.suffix,
      objectives: ext.note,
      readingUrl: last.readingUrl,
      readingNote: last.readingNote + ' (Advanced)',
      videoUrl: last.videoUrl,
      videoNote: last.videoNote + ' (Review)',
      video2Url: '',
      video2Note: '',
      practiceUrl: last.practiceUrl,
      practiceNote: last.practiceNote + ' (AP Prep)',
      assignment: 'Complete an in-depth analysis or practice AP-style free response questions on this topic.',
      estimatedHrs: 4,
    });
  }
  return padded;
}

// ── Main transformation ───────────────────────────────────────────────────────
function transformCourse(data) {
  const isAP = data.name.startsWith('AP ') || data.slug.startsWith('ap-');
  const newType = isAP ? 'AP' : data.type;
  const newGradeLevel = GRADE_LEVEL[data.slug] ?? null;

  // Trim or pad modules
  let mods = data.modules.slice().sort((a, b) => a.order - b.order);
  const target = targetModules(data);

  if (isAP && mods.length < 16) {
    mods = padAPModules(mods);
  } else {
    mods = mods.slice(0, target);
  }
  // Re-number module orders 1..N
  mods = mods.map((m, i) => ({ ...m, order: i + 1 }));
  const keptOrders = new Set(mods.map(m => m.order));

  // Keep quiz questions only for kept modules; re-map order after renumbering
  // Original order vs new order: module at position i has new order i+1
  const origToNew = {};
  data.modules.slice().sort((a, b) => a.order - b.order).forEach((m, i) => {
    origToNew[m.order] = i + 1;
  });

  // Group existing quiz questions by original moduleOrder
  const qByMod = {};
  for (const q of (data.quizQuestions || [])) {
    if (!qByMod[q.moduleOrder]) qByMod[q.moduleOrder] = [];
    qByMod[q.moduleOrder].push(q);
  }

  // Build new quiz questions with variety
  const newQuizQuestions = [];
  for (const mod of mods) {
    // Find original module order that maps to this new order
    const origOrder = Object.entries(origToNew).find(([, v]) => v === mod.order)?.[0];
    const origQs = origOrder ? (qByMod[origOrder] || []) : [];
    const pat = moduleQPattern(mod.order - 1, data.department);

    let qOrder = 1;

    // MC questions
    const mcPool = origQs.filter(q => !q.options || q.options.length > 2);
    for (let i = 0; i < Math.min(pat.mc, mcPool.length); i++) {
      const q = mcPool[i];
      newQuizQuestions.push({
        moduleOrder: mod.order, order: qOrder++,
        question: q.question, options: q.options, answer: q.answer,
        explanation: q.explanation || `The correct answer is: ${q.answer}.`,
        points: 1,
      });
    }
    // Fill remaining MC if pool is short
    for (let i = mcPool.length; i < pat.mc && i < mcPool.length; i++) {
      // Already covered above
    }

    // T/F questions
    for (let i = 0; i < pat.tf; i++) {
      const base = mcPool[i] || mcPool[0];
      if (!base) continue;
      const tf = generateTF({ ...base, moduleOrder: mod.order, order: qOrder }, i % 2 === 0);
      if (tf) newQuizQuestions.push({ ...tf, order: qOrder++ });
    }

    // Fill-in-blank questions
    for (let i = 0; i < pat.fib; i++) {
      const base = mcPool[mcPool.length - 1 - i] || mcPool[0];
      if (!base) continue;
      const fib = generateFIB({ ...base, moduleOrder: mod.order, order: qOrder });
      if (fib) newQuizQuestions.push({ ...fib, order: qOrder++ });
    }
  }

  // Transform exam questions
  const newQuestions = (data.questions || []).map((q, idx) => transformExamQ(q, idx));

  return {
    ...data,
    type: newType,
    gradeLevel: newGradeLevel,
    modules: mods,
    quizQuestions: newQuizQuestions,
    questions: newQuestions,
  };
}

// ── File walker ───────────────────────────────────────────────────────────────
function collectFiles(dir) {
  const results = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...collectFiles(full));
    else if (e.name.endsWith('.json')) results.push(full);
  }
  return results;
}

const coursesDir = path.join(__dirname, '../prisma/courses');
const files = collectFiles(coursesDir);
let changed = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = transformCourse(data);
  fs.writeFileSync(file, JSON.stringify(updated, null, 2));
  const modChange = data.modules.length !== updated.modules.length
    ? ` (${data.modules.length}→${updated.modules.length} mods)` : '';
  const typeChange = data.type !== updated.type ? ` type:${data.type}→${updated.type}` : '';
  console.log(`✓ ${updated.name}${modChange}${typeChange}`);
  changed++;
}

console.log(`\nDone. Transformed ${changed} courses.`);
