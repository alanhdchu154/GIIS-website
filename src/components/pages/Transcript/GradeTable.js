import React, { useState, useEffect } from 'react';
import './GradeTable.css';

const GRADE_TO_GPA = {
  'A+': { weighted: 4.0, unweighted: 4.0 },
  'A':  { weighted: 4.0, unweighted: 4.0 },
  'A-': { weighted: 3.7, unweighted: 3.7 },
  'B+': { weighted: 3.3, unweighted: 3.3 },
  'B':  { weighted: 3.0, unweighted: 3.0 },
  'B-': { weighted: 2.7, unweighted: 2.7 },
  'C+': { weighted: 2.3, unweighted: 2.3 },
  'C':  { weighted: 2.0, unweighted: 2.0 },
  'C-': { weighted: 1.7, unweighted: 1.7 },
  'D+': { weighted: 1.3, unweighted: 1.3 },
  'D':  { weighted: 1.0, unweighted: 1.0 },
  'F':  { weighted: 0.0, unweighted: 0.0 },
};

const EMPTY_ROW = { name: '', type: '', credits: '', grade: '', weightedGPA: '-', unweightedGPA: '-' };
const TOTALS_ROW = { ...EMPTY_ROW, name: 'Semester Totals' };

const DEFAULT_ROWS = [
  { ...EMPTY_ROW },
  { ...EMPTY_ROW },
  { ...EMPTY_ROW },
  { ...EMPTY_ROW },
  { ...TOTALS_ROW },
];

function calculateTotals(rows) {
  let totalWeighted = 0;
  let totalUnweighted = 0;
  let totalCredits = 0;

  rows.forEach((row) => {
    if (row.name === 'Semester Totals') return;
    const credits = parseFloat(row.credits) || 0;
    if (row.weightedGPA !== '-' && row.unweightedGPA !== '-') {
      const w = typeof row.weightedGPA === 'number' ? row.weightedGPA : parseFloat(row.weightedGPA);
      const u = typeof row.unweightedGPA === 'number' ? row.unweightedGPA : parseFloat(row.unweightedGPA);
      if (Number.isFinite(w) && Number.isFinite(u)) {
        totalCredits += credits;
        totalWeighted += w * credits;
        totalUnweighted += u * credits;
      }
    }
  });

  return {
    weightedGPA: totalCredits > 0 ? (totalWeighted / totalCredits).toFixed(2) : '-',
    unweightedGPA: totalCredits > 0 ? (totalUnweighted / totalCredits).toFixed(2) : '-',
    totalCredits,
  };
}

function applyTotalsRow(rows, totals) {
  const newRows = rows.map((r) => ({ ...r }));
  const totalsIdx = newRows.findIndex((r) => r.name === 'Semester Totals');
  if (totalsIdx !== -1) {
    const hasContent = newRows.some((r) => r.name !== 'Semester Totals' && r.name.trim() !== '');
    newRows[totalsIdx].weightedGPA = hasContent ? totals.weightedGPA : '-';
    newRows[totalsIdx].unweightedGPA = hasContent ? totals.unweightedGPA : '-';
    newRows[totalsIdx].totalCredits = hasContent ? totals.totalCredits.toFixed(1) : '';
  }
  return newRows;
}

function GradeTable({ semesterName, semesterStatus, onTotalsUpdate, isStatic = false, initialRows = null, onRowsChange = null }) {
  const [rows, setRows] = useState(DEFAULT_ROWS.map((r) => ({ ...r })));

  useEffect(() => {
    if (initialRows && Array.isArray(initialRows)) {
      setRows(initialRows);
    }
  }, [initialRows]);

  // Fire both onRowsChange and onTotalsUpdate whenever rows change (including initial load)
  useEffect(() => {
    if (onRowsChange) onRowsChange(semesterName, rows);
    if (onTotalsUpdate) {
      const totals = calculateTotals(rows);
      const hasContent = rows.some((r) => r.name !== 'Semester Totals' && r.name.trim() !== '');
      onTotalsUpdate(semesterName, {
        weightedGPA: hasContent && totals.weightedGPA !== '-' ? parseFloat(totals.weightedGPA) : 0,
        unweightedGPA: hasContent && totals.unweightedGPA !== '-' ? parseFloat(totals.unweightedGPA) : 0,
        totalCredits: hasContent ? totals.totalCredits : 0,
      });
    }
  }, [rows, semesterName, onRowsChange, onTotalsUpdate]);

  const handleChange = (index, field, value) => {
    setRows((prevRows) => {
      let newRows = prevRows.map((r) => ({ ...r }));

      if (field === 'name' && value.trim() === '') {
        newRows[index] = { ...EMPTY_ROW };
      } else {
        newRows[index][field] = value;

        // Auto-fill credits to 1.0 for Core courses when credits not yet set
        if (field === 'type' && !newRows[index].credits) {
          if (value === 'Core' || value === 'Core (AP)') {
            newRows[index].credits = '1.0';
          }
        }

        if (field === 'grade' || field === 'credits' || field === 'type') {
          const gpa = GRADE_TO_GPA[newRows[index].grade?.toUpperCase()] || { weighted: '-', unweighted: '-' };
          const typeHasAP = newRows[index].type?.includes('AP') || false;
          const nameHasAP = newRows[index].name?.includes('AP') || false;

          newRows[index].unweightedGPA = gpa.unweighted;
          newRows[index].weightedGPA =
            typeHasAP && nameHasAP && gpa.unweighted !== '-'
              ? gpa.unweighted + 1
              : gpa.unweighted;
        }
      }

      const totals = calculateTotals(newRows);
      newRows = applyTotalsRow(newRows, totals);
      return newRows;
    });
  };

  const addRow = () => {
    setRows((prevRows) => {
      const totalsIdx = prevRows.findIndex((r) => r.name === 'Semester Totals');
      const before = prevRows.slice(0, totalsIdx);
      const after = prevRows.slice(totalsIdx);
      return [...before, { ...EMPTY_ROW }, ...after];
    });
  };

  const deleteRow = (index) => {
    setRows((prevRows) => {
      const newRows = prevRows.filter((_, i) => i !== index);
      const totals = calculateTotals(newRows);
      return applyTotalsRow(newRows, totals);
    });
  };

  const inputStyle = (extraStyle = {}) => ({
    width: '100%',
    border: isStatic ? '1px solid black' : 'none',
    borderRadius: isStatic ? '4px' : '0',
    background: 'none',
    outline: 'none',
    ...extraStyle,
  });

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
        <thead>
          <tr>
            <td
              colSpan={isStatic ? 6 : 7}
              className="gt-sem-title"
            >
              {semesterName}
              {semesterStatus === 'in_progress' && ' (In Progress)'}
            </td>
          </tr>
          <tr>
            {['Course Name', 'Type', 'Credits', 'Grade', 'Weighted GPA', 'Unweighted GPA'].map((h) => (
              <th key={h} className="gt-th">{h}</th>
            ))}
            {!isStatic && <th className="gt-th" style={{ width: '28px' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="gt-cell" style={{ width: '30%' }}>
                {row.name === 'Semester Totals' ? (
                  <span>Semester Totals</span>
                ) : (
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    className="gt-input"
                    style={inputStyle()}
                  />
                )}
              </td>

              <td className="gt-cell" style={{ width: '15%' }}>
                {row.name === 'Semester Totals' ? '' : (
                  <select
                    value={row.type}
                    onChange={(e) => handleChange(index, 'type', e.target.value)}
                    className="gt-input"
                    style={inputStyle()}
                  >
                    <option value="">-</option>
                    <option value="Core">Core</option>
                    <option value="Core (AP)">Core (AP)</option>
                    <option value="Elective">Elective</option>
                  </select>
                )}
              </td>

              <td className="gt-cell" style={{ width: '10%' }}>
                {row.name === 'Semester Totals' ? row.totalCredits : (
                  <select
                    value={row.credits}
                    onChange={(e) => handleChange(index, 'credits', e.target.value)}
                    className="gt-input"
                    style={inputStyle()}
                  >
                    <option value="">-</option>
                    <option value="0.5">0.5</option>
                    <option value="1.0">1.0</option>
                  </select>
                )}
              </td>

              <td className="gt-cell" style={{ width: '10%' }}>
                {row.name === 'Semester Totals' ? '' : (
                  <select
                    value={row.grade}
                    onChange={(e) => handleChange(index, 'grade', e.target.value)}
                    className="gt-input"
                    style={inputStyle()}
                  >
                    <option value="">-</option>
                    {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                )}
              </td>

              <td className="gt-cell" style={{ width: '10%' }}>{row.weightedGPA}</td>
              <td className="gt-cell" style={{ width: '10%' }}>{row.unweightedGPA}</td>

              {!isStatic && (
                <td className="gt-cell" style={{ width: '28px', padding: '0', textAlign: 'center' }}>
                  {row.name !== 'Semester Totals' && (
                    <button
                      onClick={() => deleteRow(index)}
                      className="gt-del-btn"
                      title="Remove row"
                    >×</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!isStatic && (
        <button className="gt-add-btn" onClick={addRow} title="Add row">+</button>
      )}
    </>
  );
}

export default GradeTable;
