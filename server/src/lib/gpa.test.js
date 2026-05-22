const { computeRowGpa, computeSemesterTotals } = require('./gpa');

describe('computeRowGpa', () => {
  test('returns null for empty/invalid grade', () => {
    expect(computeRowGpa({ letterGrade: '' })).toEqual({ weightedGpa: null, unweightedGpa: null });
    expect(computeRowGpa({ letterGrade: 'Z' })).toEqual({ weightedGpa: null, unweightedGpa: null });
    expect(computeRowGpa({})).toEqual({ weightedGpa: null, unweightedGpa: null });
  });

  test('A and A+ both map to 4.0 unweighted', () => {
    expect(computeRowGpa({ letterGrade: 'A' }).unweightedGpa).toBe(4.0);
    expect(computeRowGpa({ letterGrade: 'A+' }).unweightedGpa).toBe(4.0);
  });

  test('F maps to 0.0', () => {
    const r = computeRowGpa({ letterGrade: 'F' });
    expect(r.weightedGpa).toBe(0.0);
    expect(r.unweightedGpa).toBe(0.0);
  });

  test('AP boost: weighted = unweighted + 1 when BOTH type and name contain AP', () => {
    const r = computeRowGpa({ letterGrade: 'A', courseType: 'Core (AP)', courseName: 'AP Calculus' });
    expect(r.unweightedGpa).toBe(4.0);
    expect(r.weightedGpa).toBe(5.0);
  });

  test('AP boost does NOT apply when only type has AP', () => {
    const r = computeRowGpa({ letterGrade: 'A', courseType: 'Core (AP)', courseName: 'Calculus' });
    expect(r.weightedGpa).toBe(4.0);
  });

  test('AP boost does NOT apply when only name has AP', () => {
    const r = computeRowGpa({ letterGrade: 'A', courseType: 'Core', courseName: 'AP Calculus' });
    expect(r.weightedGpa).toBe(4.0);
  });

  test('grade lookup is case-insensitive', () => {
    expect(computeRowGpa({ letterGrade: 'b+' }).unweightedGpa).toBe(3.3);
  });

  const grades = [
    ['A+', 4.0], ['A', 4.0], ['A-', 3.7],
    ['B+', 3.3], ['B', 3.0], ['B-', 2.7],
    ['C+', 2.3], ['C', 2.0], ['C-', 1.7],
    ['D+', 1.3], ['D', 1.0], ['F', 0.0],
  ];
  test.each(grades)('%s → %f unweighted', (grade, expected) => {
    expect(computeRowGpa({ letterGrade: grade }).unweightedGpa).toBe(expected);
  });
});

describe('computeSemesterTotals', () => {
  test('empty rows returns dashes', () => {
    const r = computeSemesterTotals([]);
    expect(r.weightedGPA).toBe('-');
    expect(r.unweightedGPA).toBe('-');
    expect(r.totalCredits).toBe(0);
  });

  test('rows with no courseName are skipped', () => {
    const r = computeSemesterTotals([
      { courseName: '', credits: 1.0, weightedGpa: 4.0, unweightedGpa: 4.0 },
    ]);
    expect(r.totalCredits).toBe(0);
  });

  test('rows with zero/missing credits are skipped', () => {
    const r = computeSemesterTotals([
      { courseName: 'Math', credits: 0, weightedGpa: 4.0, unweightedGpa: 4.0 },
      { courseName: 'Science', credits: null, weightedGpa: 4.0, unweightedGpa: 4.0 },
    ]);
    expect(r.totalCredits).toBe(0);
  });

  test('credit-weighted GPA calculation', () => {
    const rows = [
      { courseName: 'Math', credits: 1.0, weightedGpa: 4.0, unweightedGpa: 4.0 },
      { courseName: 'English', credits: 1.0, weightedGpa: 3.0, unweightedGpa: 3.0 },
    ];
    const r = computeSemesterTotals(rows);
    expect(r.totalCredits).toBe(2.0);
    expect(r.weightedGPA).toBe('3.50');
    expect(r.unweightedGPA).toBe('3.50');
  });

  test('unequal credits weight the GPA correctly', () => {
    const rows = [
      { courseName: 'Math', credits: 1.0, weightedGpa: 4.0, unweightedGpa: 4.0 },
      { courseName: 'PE', credits: 0.5, weightedGpa: 2.0, unweightedGpa: 2.0 },
    ];
    const r = computeSemesterTotals(rows);
    // (4.0 * 1.0 + 2.0 * 0.5) / 1.5 = 5.0 / 1.5 = 3.33
    expect(r.totalCredits).toBe(1.5);
    expect(r.weightedGPA).toBe('3.33');
  });

  test('rows with null GPA are excluded from average', () => {
    const rows = [
      { courseName: 'Math', credits: 1.0, weightedGpa: 4.0, unweightedGpa: 4.0 },
      { courseName: 'Pass/Fail', credits: 0.5, weightedGpa: null, unweightedGpa: null },
    ];
    const r = computeSemesterTotals(rows);
    // Only Math row counts
    expect(r.totalCredits).toBe(1.0);
    expect(r.weightedGPA).toBe('4.00');
  });

  test('Prisma Decimal-like GPA values are counted', () => {
    const rows = [
      {
        courseName: 'Biology',
        credits: { toString: () => '1.0' },
        weightedGpa: { toString: () => '4.0' },
        unweightedGpa: { toString: () => '4.0' },
      },
      {
        courseName: 'English',
        credits: { toString: () => '1.0' },
        weightedGpa: { toString: () => '3.7' },
        unweightedGpa: { toString: () => '3.7' },
      },
    ];
    const r = computeSemesterTotals(rows);
    expect(r.totalCredits).toBe(2.0);
    expect(r.weightedGPA).toBe('3.85');
    expect(r.unweightedGPA).toBe('3.85');
  });
});
