/** Maps API course rows ↔ grade table row shape (matches GradeTable*.js). */

export const TRANSCRIPT_SEMESTER_KEYS = [
  'Grade 9 - Fall Semester',
  'Grade 9 - Spring Semester',
  'Grade 10 - Fall Semester',
  'Grade 10 - Spring Semester',
  'Grade 11 - Fall Semester',
  'Grade 11 - Spring Semester',
  'Grade 12 - Fall Semester',
  'Grade 12 - Spring Semester',
];

function calculateTotalsLikeTable(updatedRows) {
  let totalWeightedGPA = 0;
  let totalUnweightedGPA = 0;
  let totalCredits = 0;

  updatedRows.forEach((row) => {
    if (row.name === 'Semester Totals') return;
    const credits = parseFloat(row.credits) || 0;
    const w = row.weightedGPA;
    const u = row.unweightedGPA;
    if (w !== '-' && u !== '-' && w !== '' && u !== '') {
      const wf = typeof w === 'number' ? w : parseFloat(w);
      const uf = typeof u === 'number' ? u : parseFloat(u);
      if (Number.isFinite(wf) && Number.isFinite(uf)) {
        totalCredits += credits;
        totalWeightedGPA += wf * credits;
        totalUnweightedGPA += uf * credits;
      }
    }
  });

  const weightedGPA = totalCredits > 0 ? (totalWeightedGPA / totalCredits).toFixed(2) : '-';
  const unweightedGPA = totalCredits > 0 ? (totalUnweightedGPA / totalCredits).toFixed(2) : '-';
  return { weightedGPA, unweightedGPA, totalCredits };
}

function normalizeGpaCell(v) {
  if (v == null || v === '' || v === '-') return '-';
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : '-';
}

/**
 * Build grade-table rows (including Semester Totals) from API course rows.
 */
export function courseApiToGradeRows(courseRowsFromApi) {
  const dataRows = (courseRowsFromApi || []).map((c) => ({
    name: c.courseName || '',
    type: c.courseType || '',
    credits: (c.credits != null && String(c.credits).trim() !== '')
      ? String(c.credits)
      : (c.courseType === 'Core' || c.courseType === 'Core (AP)') ? '1.0' : '',
    grade: c.letterGrade || '',
    weightedGPA: normalizeGpaCell(c.weightedGpa),
    unweightedGPA: normalizeGpaCell(c.unweightedGpa),
  }));

  const padded = [...dataRows];
  while (padded.length < 4) {
    padded.push({
      name: '',
      type: '',
      credits: '',
      grade: '',
      weightedGPA: '-',
      unweightedGPA: '-',
    });
  }

  const totals = calculateTotalsLikeTable(padded);
  padded.push({
    name: 'Semester Totals',
    type: '',
    credits: '',
    grade: '',
    weightedGPA: totals.weightedGPA,
    unweightedGPA: totals.unweightedGPA,
    totalCredits:
      totals.totalCredits > 0 ? totals.totalCredits.toFixed(1) : '',
  });
  return padded;
}

/** Strip totals row; payload for PUT /transcript (server recomputes GPAs). */
export function gradeRowsToApiCourses(rows) {
  return rows
    .filter((r) => r.name && r.name !== 'Semester Totals')
    .map((r) => ({
      courseName: r.name,
      courseType: r.type || '',
      credits: r.credits,
      letterGrade: r.grade || '',
    }));
}
