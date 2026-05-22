/**
 * Mirrors client-side logic in GradeTableG*.js for consistent stored values.
 */
const gradeToGpa = {
  'A+': { weighted: 4.0, unweighted: 4.0 },
  A: { weighted: 4.0, unweighted: 4.0 },
  'A-': { weighted: 3.7, unweighted: 3.7 },
  'B+': { weighted: 3.3, unweighted: 3.3 },
  B: { weighted: 3.0, unweighted: 3.0 },
  'B-': { weighted: 2.7, unweighted: 2.7 },
  'C+': { weighted: 2.3, unweighted: 2.3 },
  C: { weighted: 2.0, unweighted: 2.0 },
  'C-': { weighted: 1.7, unweighted: 1.7 },
  'D+': { weighted: 1.3, unweighted: 1.3 },
  D: { weighted: 1.0, unweighted: 1.0 },
  F: { weighted: 0.0, unweighted: 0.0 },
};

/**
 * @param {{ courseName?: string, courseType?: string, letterGrade?: string }} row
 * @returns {{ weightedGpa: number|null, unweightedGpa: number|null }}
 */
function computeRowGpa(row) {
  const grade = (row.letterGrade || '').trim().toUpperCase();
  const g = gradeToGpa[grade];

  if (!g) {
    return { weightedGpa: null, unweightedGpa: null };
  }

  const typeHasAP = (row.courseType || '').includes('AP');
  const nameHasAP = (row.courseName || '').includes('AP');

  let weighted;
  const unweighted = g.unweighted;

  if (typeHasAP && nameHasAP) {
    weighted = g.unweighted + 1;
  } else {
    weighted = g.unweighted;
  }

  return {
    weightedGpa: weighted,
    unweightedGpa: unweighted,
  };
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Semester totals from course rows (excluding empty course names).
 * @param {Array<{ courseName: string, credits: string|number, weightedGpa: number|null, unweightedGpa: number|null }>} rows
 */
function computeSemesterTotals(rows) {
  let totalWeighted = 0;
  let totalUnweighted = 0;
  let totalCredits = 0;

  for (const row of rows) {
    if (!row.courseName || !String(row.courseName).trim()) continue;
    const credits = parseFloat(String(row.credits ?? '')) || 0;
    if (credits <= 0) continue;

    const w = finiteNumber(row.weightedGpa);
    const u = finiteNumber(row.unweightedGpa);
    if (w !== null && u !== null) {
      totalWeighted += w * credits;
      totalUnweighted += u * credits;
      totalCredits += credits;
    }
  }

  if (totalCredits <= 0) {
    return { weightedGPA: '-', unweightedGPA: '-', totalCredits: 0 };
  }

  return {
    weightedGPA: (totalWeighted / totalCredits).toFixed(2),
    unweightedGPA: (totalUnweighted / totalCredits).toFixed(2),
    totalCredits,
  };
}

module.exports = { computeRowGpa, computeSemesterTotals };
