import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import logoSlogan from '../../../img/logo_slogan.png';
import GradeTable from './GradeTable.js';
import TranscriptActions from './TranscriptActions.js';
import { useTranscriptData } from './useTranscriptData.js';
import { exportTranscriptToPDF } from './transcriptPdf.js';
import { TRANSCRIPT_SEMESTER_KEYS } from './transcriptMappers.js';
import { getAllSemesterStatuses, SEMESTER_STATUS } from './semesterStatus.js';
import TranscriptSkeleton from '../../TranscriptSkeleton.js';
import './transcript-print.css';

const GRADE_TO_GPA = {
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

function withComputedGpa(row) {
  const gpa = GRADE_TO_GPA[row.grade?.toUpperCase()] || { weighted: '-', unweighted: '-' };
  const typeHasAP = row.type?.includes('AP') || false;
  const nameHasAP = row.name?.includes('AP') || false;
  const weightedGPA =
    typeHasAP && nameHasAP && gpa.unweighted !== '-'
      ? gpa.unweighted + 1
      : gpa.unweighted;
  return { ...row, unweightedGPA: gpa.unweighted, weightedGPA };
}

function TranscriptContent({
  language,
  studentId = null,
  authToken = null,
  viewerRole = 'student',
  mode = 'view',
  loadUrl = null,
  adminWorkspace = false,
}) {
  const isAdminViewer = viewerRole === 'admin';
  const canEdit = isAdminViewer && mode === 'edit';
  const canSave = canEdit;
  const canExport = (isAdminViewer && mode === 'view') || viewerRole === 'student' || viewerRole === 'parent';

  const [isStaticMode, setIsStaticMode] = useState(false);
  const isStatic = isStaticMode || !canEdit;

  const {
    profile,
    setProfile,
    semesterInitialRows,
    semesterRowsRef,
    cumulativeCredits,
    remoteLoadError,
    remoteSaving,
    hasRemoteAccess,
    handleTotalsUpdate,
    handleSemesterRowsChange,
    calculateCumulativeGPA,
    saveRemoteTranscript,
  } = useTranscriptData({ studentId, authToken, canEdit, canSave, loadUrl });

  const [adminRows, setAdminRows] = useState({});

  useEffect(() => {
    setAdminRows(semesterInitialRows || {});
  }, [semesterInitialRows]);

  const handleExport = () =>
    exportTranscriptToPDF({
      profile,
      semesterRowsRef,
      semesterInitialRows,
      setIsStaticMode,
    });

  const adminSummary = useMemo(() => {
    const allRows = Object.values(adminRows || {})
      .flat()
      .filter((row) => row?.name && row.name !== 'Semester Totals');
    const gradedRows = allRows.filter((row) => row.grade && String(row.grade).trim());
    const credits = gradedRows.reduce((sum, row) => sum + (parseFloat(row.credits) || 0), 0);
    return { courses: allRows.length, graded: gradedRows.length, credits };
  }, [adminRows]);

  function updateAdminRow(semesterName, rowIndex, patch) {
    setAdminRows((prev) => {
      const currentRows = [...(prev[semesterName] || [])];
      const merged = { ...(currentRows[rowIndex] || {}), ...patch };
      currentRows[rowIndex] = ('grade' in patch || 'credits' in patch || 'type' in patch || 'name' in patch)
        ? withComputedGpa(merged)
        : merged;
      const next = { ...prev, [semesterName]: currentRows };
      handleSemesterRowsChange(semesterName, currentRows);
      return next;
    });
  }

  function addAdminRow(semesterName) {
    setAdminRows((prev) => {
      const baseRows = (prev[semesterName] || []).filter((row) => row?.name !== 'Semester Totals');
      const nextRows = [
        ...baseRows,
        { name: '', type: '', credits: '', grade: '', weightedGPA: '-', unweightedGPA: '-' },
      ];
      const next = { ...prev, [semesterName]: nextRows };
      handleSemesterRowsChange(semesterName, nextRows);
      return next;
    });
  }

  const pf = (key) =>
    profile
      ? {
          value: profile[key] ?? '',
          ...(canEdit
            ? { onChange: (e) => setProfile((p) => ({ ...p, [key]: e.target.value })) }
            : {}),
        }
      : {};

  const today = new Date();
  const usDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: 'America/Chicago',
  }).format(today);

  const referenceDate = today;
  const todayIso = today.toISOString().slice(0, 10);
  const graduationYear =
    profile?.graduationDate ? new Date(profile.graduationDate).getFullYear() : null;
  const semesterStatuses = getAllSemesterStatuses(
    TRANSCRIPT_SEMESTER_KEYS,
    graduationYear,
    referenceDate,
  );
  // In edit mode show all semesters; in view/PDF mode hide upcoming ones.
  const visibleKeys = canEdit
    ? TRANSCRIPT_SEMESTER_KEYS
    : TRANSCRIPT_SEMESTER_KEYS.filter(
        (k) => semesterStatuses[k] !== SEMESTER_STATUS.UPCOMING,
      );

  if (hasRemoteAccess && !profile) {
    if (remoteLoadError) {
      return (
        <div style={styles.container}>
          <div style={{ color: '#b00020', marginTop: 8 }} role="alert">{remoteLoadError}</div>
        </div>
      );
    }
    return (
      <div style={styles.container}>
        <TranscriptSkeleton />
      </div>
    );
  }

  if (isAdminViewer && adminWorkspace) {
    return (
      <div style={adminStyles.shell}>
        {remoteLoadError && (
          <div className="alert alert-warning py-2" role="alert">
            {remoteLoadError}
          </div>
        )}

        <div style={adminStyles.toolbar}>
          <div>
            <p style={adminStyles.kicker}>Official Records</p>
            <h2 style={adminStyles.title}>Transcript Data</h2>
            <p style={adminStyles.subtitle}>
              Edit the records source here. Export still uses the locked official PDF renderer.
            </p>
          </div>
          <TranscriptActions
            canSave={canSave}
            canExport={canExport}
            remoteSaving={remoteSaving}
            profile={profile}
            language={language}
            onSave={saveRemoteTranscript}
            onExport={handleExport}
          />
        </div>

        <div style={adminStyles.metricGrid}>
          <div style={adminStyles.metric}>
            <span style={adminStyles.metricLabel}>Courses</span>
            <strong style={adminStyles.metricValue}>{adminSummary.courses}</strong>
          </div>
          <div style={adminStyles.metric}>
            <span style={adminStyles.metricLabel}>Graded rows</span>
            <strong style={adminStyles.metricValue}>{adminSummary.graded}</strong>
          </div>
          <div style={adminStyles.metric}>
            <span style={adminStyles.metricLabel}>Credits</span>
            <strong style={adminStyles.metricValue}>{adminSummary.credits.toFixed(1)}</strong>
          </div>
          <div style={adminStyles.metric}>
            <span style={adminStyles.metricLabel}>Issue date</span>
            <strong style={adminStyles.metricValueSmall}>{usDate}</strong>
          </div>
        </div>

        <div style={adminStyles.profileCard}>
          <div style={adminStyles.sectionHeader}>
            <h3 style={adminStyles.sectionTitle}>Student Profile</h3>
            <span style={adminStyles.sectionHint}>{canEdit ? 'Editable in Edit mode' : 'Switch to Edit to change'}</span>
          </div>
          <div style={adminStyles.profileGrid}>
            <AdminField label="Name" type="text" readOnly={isStatic} inputProps={pf('name')} />
            <AdminField label="Student ID" type="text" readOnly inputProps={{ value: profile?.studentCode || '' }} />
            <AdminField label="Birth Date" type="date" readOnly={isStatic} inputProps={pf('birthDate')} />
            <AdminField label="Gender" type="select" readOnly={isStatic} inputProps={profile ? {
              value: profile.gender || 'Female',
              onChange: (e) => { if (!isStatic) setProfile((p) => ({ ...p, gender: e.target.value })); },
            } : { value: 'Female' }} />
            <AdminField label="Parent/Guardian" type="text" readOnly={isStatic} inputProps={pf('parentGuardian')} />
            <AdminField label="Entry Date" type="date" readOnly={isStatic} inputProps={pf('entryDate')} />
            <AdminField label="Graduation Date" type="date" readOnly={isStatic} inputProps={pf('graduationDate')} />
            <AdminField label="Transcript Date" type="text" readOnly inputProps={{ value: usDate }} />
            <AdminField label="Address" type="text" readOnly={isStatic} inputProps={pf('address')} wide />
            <AdminField label="City" type="text" readOnly={isStatic} inputProps={pf('city')} />
            <AdminField label="Province" type="text" readOnly={isStatic} inputProps={pf('province')} />
            <AdminField label="Zip Code" type="text" readOnly={isStatic} inputProps={pf('zipCode')} />
          </div>
        </div>

        <div style={adminStyles.recordsGrid}>
          {TRANSCRIPT_SEMESTER_KEYS.map((key) => {
            const rows = (adminRows[key] || []).filter((row) => row?.name !== 'Semester Totals');
            const visibleRows = canEdit ? rows : rows.filter((row) => row.name || row.grade);
            return (
              <section key={key} style={adminStyles.semesterCard}>
                <div style={adminStyles.semesterHeader}>
                  <div>
                    <h3 style={adminStyles.semesterTitle}>{key}</h3>
                    <p style={adminStyles.semesterMeta}>
                      {visibleRows.filter((row) => row.name).length} courses
                    </p>
                  </div>
                  {canEdit && (
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addAdminRow(key)}>
                      Add row
                    </button>
                  )}
                </div>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0" style={adminStyles.recordsTable}>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th style={{ width: 105 }}>Type</th>
                        <th style={{ width: 80 }}>Credits</th>
                        <th style={{ width: 85 }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-muted text-center py-3">No rows yet.</td>
                        </tr>
                      ) : visibleRows.map((row, index) => (
                        <tr key={`${key}-${index}`}>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={row.name || ''}
                              readOnly={!canEdit}
                              onChange={(e) => updateAdminRow(key, index, { name: e.target.value })}
                              placeholder="Course name"
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={row.type || ''}
                              readOnly={!canEdit}
                              onChange={(e) => updateAdminRow(key, index, { type: e.target.value })}
                              placeholder="Core"
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={row.credits || ''}
                              readOnly={!canEdit}
                              onChange={(e) => updateAdminRow(key, index, { credits: e.target.value })}
                              placeholder="1.0"
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={row.grade || ''}
                              readOnly={!canEdit}
                              onChange={(e) => updateAdminRow(key, index, { grade: e.target.value })}
                              placeholder="A"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {isAdminViewer && remoteLoadError && (
        <div style={{ color: '#b00020', marginTop: 8, marginBottom: 8 }} role="alert">
          {remoteLoadError}
        </div>
      )}

      <TranscriptActions
        canSave={canSave}
        canExport={canExport}
        remoteSaving={remoteSaving}
        profile={profile}
        language={language}
        onSave={saveRemoteTranscript}
        onExport={handleExport}
      />

      <div id="transcript-content" style={{ textAlign: 'left', maxWidth: '100%', position: 'relative' }}>
        {/* Watermark */}
        <div
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}
          aria-hidden="true"
        >
          <img src={logoSlogan} alt="" style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain', opacity: 0.14 }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={styles.mainTitle} className="pdf-header-title">
            <p style={{ marginBottom: '0' }}>Academic Transcript</p>
          </div>
          <div style={styles.title} className="pdf-header-school">
            <p style={{ marginBottom: '0' }}>Genesis of Ideas International School</p>
          </div>
          <div style={styles.columns} className="pdf-header-columns">
            <div style={styles.column1}>
              7901 4th St N STE 300,<br />St. Petersburg, FL 33702<br />
            </div>
            <div style={styles.column2}>
              Phone: +1 (813) 501-5756<br />
              <a href="https://genesisideas.school/">https://genesisideas.school/</a><br />
            </div>
            <div style={styles.column3}>
              FL School Code: 650<br />President: Shiyu Zhang, Ph.D.<br />
              admissions@genesisideas.school
            </div>
          </div>

          {/* Student info table */}
          <table style={styles.table} className="pdf-info-table">
            <colgroup><col /><col /><col /><col /></colgroup>
            <tbody>
              <tr>
                <td style={styles.thTd}>
                  <div style={styles.labelInputWrapper}>
                    Name:<input type="text" style={styles.input} placeholder="Enter Name" readOnly={isStatic} {...(profile ? pf('name') : {})} />
                  </div>
                  {profile?.studentCode && !isStaticMode && (
                    <div style={{ fontSize: '8pt', fontFamily: 'Times New Roman, Times, serif', marginTop: '2px', color: '#444' }}>
                      Student ID: <strong>{profile.studentCode}</strong>
                      {profile.currentGrade && <span style={{ marginLeft: '8px' }}>Grade: <strong>{profile.currentGrade}</strong></span>}
                    </div>
                  )}
                </td>
                <td style={styles.thTd}>
                  Birth Date: <input type="date" style={styles.input} readOnly={isStatic} {...(profile ? pf('birthDate') : {})} />
                </td>
                <td style={styles.thTd}>
                  Gender:
                  <select
                    style={styles.input}
                    {...(profile
                      ? { value: profile.gender || 'Female', onChange: (e) => { if (!isStatic) setProfile((p) => ({ ...p, gender: e.target.value })); } }
                      : { defaultValue: 'Female' })}
                    disabled={isStatic}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </td>
                <td style={styles.thTd}>
                  Parent/Guardian: <input type="text" style={styles.input} placeholder="Enter Name" readOnly={isStatic} {...(profile ? pf('parentGuardian') : {})} />
                </td>
              </tr>
              <tr>
                <td style={styles.thTd}>Address: <input type="text" style={styles.input} placeholder="Enter Address" readOnly={isStatic} {...(profile ? pf('address') : {})} /></td>
                <td style={styles.thTd}><div style={styles.labelInputWrapper}>City:<input type="text" style={styles.input} placeholder="Enter City" readOnly={isStatic} {...(profile ? pf('city') : {})} /></div></td>
                <td style={styles.thTd}>Province: <input type="text" style={styles.input} placeholder="Province" readOnly={isStatic} {...(profile ? pf('province') : {})} /></td>
                <td style={styles.thTd}>Zip Code: <input type="text" style={styles.input} placeholder="Enter Zip Code" readOnly={isStatic} {...(profile ? pf('zipCode') : {})} /></td>
              </tr>
              <tr>
                <td style={styles.thTd}>Entry Date: <input type="date" style={styles.input} readOnly={isStatic} {...(profile ? pf('entryDate') : {})} /></td>
                <td style={styles.thTd}>Withdrawal Date: <input type="date" style={styles.input} readOnly={isStatic} {...(profile ? pf('withdrawalDate') : {})} /></td>
                <td style={styles.thTd}>Graduation Date: <input type="date" style={styles.input} readOnly={isStatic} {...(profile ? pf('graduationDate') : {})} /></td>
                <td style={styles.thTd}>Transcript Date: <input type="date" style={styles.input} readOnly value={todayIso} /></td>
              </tr>
            </tbody>
          </table>

          {/* Grade tables */}
          <div id="grade-tables-container" style={{ marginTop: '4px', width: '100%', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {visibleKeys.slice(0, 4).map((key) => (
                <div key={key} className="pdf-semester">
                  <GradeTable
                    semesterName={key}
                    semesterStatus={semesterStatuses[key]}
                    isStatic={isStatic}
                    onTotalsUpdate={handleTotalsUpdate}
                    initialRows={semesterInitialRows[key]}
                    onRowsChange={handleSemesterRowsChange}
                  />
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {visibleKeys.slice(4).map((key) => (
                <div key={key} className="pdf-semester">
                  <GradeTable
                    semesterName={key}
                    semesterStatus={semesterStatuses[key]}
                    isStatic={isStatic}
                    onTotalsUpdate={handleTotalsUpdate}
                    initialRows={semesterInitialRows[key]}
                    onRowsChange={handleSemesterRowsChange}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative GPA */}
          <table style={styles.table} className="pdf-cumulative">
            <tbody>
              <tr>
                <td style={styles.thTdNarrow}>Weighted</td>
                <td style={styles.thTdWide}><strong>Cumulative GPA:</strong>  {calculateCumulativeGPA()}</td>
                <td style={styles.thTdWide}><strong>Cumulative Credits:</strong>  {cumulativeCredits.toFixed(1)}</td>
              </tr>
              <tr>
                <td style={styles.thTdNarrow}>Unweighted</td>
                <td style={styles.thTdWide}><strong>Cumulative GPA:</strong>  {calculateCumulativeGPA('unweightedGPA')}</td>
                <td style={styles.thTdWide}><strong>Cumulative Credits:</strong>  {cumulativeCredits.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>

          {/* Signature */}
          <div style={{ marginTop: '1%', textAlign: 'right' }} className="pdf-signature">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', padding: '4px 0', fontFamily: 'Times New Roman, Times, serif', fontSize: '10pt' }}>
                    <span style={{ whiteSpace: 'nowrap' }}>Official(s) Certifying Transcript:</span>
                    <span style={{ display: 'inline-block', height: '1px', width: '50%', backgroundColor: 'black', marginLeft: '12px', verticalAlign: '-6px' }} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', padding: '0', fontFamily: 'Times New Roman, Times, serif', fontSize: '10pt' }}>Signature</td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', padding: '8px 0', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '13% 13% 13%', columnGap: '24px', alignItems: 'center', justifyContent: 'end', fontSize: '10pt', fontFamily: 'Times New Roman, Times, serif' }}>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Shiyu Zhang, Ph.D.</span>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>President</span>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>{usDate}</span>
                    </div>
                    <div style={{ position: 'absolute', borderBottom: '2px solid black', width: '50%', right: 0, marginTop: '0.25%' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '13% 13% 13%', columnGap: '24px', alignItems: 'center', justifyContent: 'end', marginTop: '0.5%', fontSize: '10pt', fontFamily: 'Times New Roman, Times, serif' }}>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Printed Name</span>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Title</span>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Date</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px' }}>
            <div className="pdf-page-number" style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '8pt', flex: 1 }}>-- 1 of 1 --</div>
            {profile?.studentCode && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '6pt', color: '#555', margin: '0 0 2px', fontFamily: 'Times New Roman, Times, serif' }}>Scan to verify authenticity</p>
                  <QRCodeSVG
                    value={`https://genesisideas.school/verify/${profile.studentCode}`}
                    size={48}
                    bgColor="transparent"
                    fgColor="#000"
                    level="M"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const fontBase = { fontFamily: 'Times New Roman, Times, serif' };

const styles = {
  container: { border: 'none', padding: '4px', textAlign: 'left', width: '100%', backgroundColor: 'white', outline: 'none', boxShadow: 'none' },
  title: { marginBottom: '2px', ...fontBase, fontSize: '16pt', fontWeight: 'bold', textAlign: 'center' },
  mainTitle: { marginBottom: '2px', ...fontBase, fontSize: '10pt', fontWeight: 'normal', textAlign: 'center' },
  columns: { width: '100%', display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,1)', margin: '0 auto' },
  column1: { flex: '1', textAlign: 'left', padding: '4px', boxSizing: 'border-box', fontSize: '10pt', ...fontBase, lineHeight: '1.1' },
  column2: { flex: '1', textAlign: 'center', padding: '4px', boxSizing: 'border-box', fontSize: '10pt', ...fontBase, lineHeight: '1.1' },
  column3: { flex: '1', textAlign: 'right', padding: '4px', boxSizing: 'border-box', fontSize: '10pt', ...fontBase, lineHeight: '1.1' },
  thTd: { padding: '1px 3px', border: '1px solid black', textAlign: 'left', fontSize: '8pt', width: '25%', wordWrap: 'break-word', ...fontBase, lineHeight: '1.1' },
  thTdNarrow: { padding: '1px 3px', border: '1px solid black', textAlign: 'left', fontSize: '8pt', width: '12%', wordWrap: 'break-word', ...fontBase, lineHeight: '1.1' },
  thTdWide: { padding: '1px 3px', border: '1px solid black', textAlign: 'left', fontSize: '8pt', width: '44%', wordWrap: 'break-word', ...fontBase, lineHeight: '1.1' },
  table: { width: '100%', borderCollapse: 'collapse', ...fontBase, margin: '4px 0', tableLayout: 'fixed', fontSize: '8pt' },
  labelInputWrapper: { display: 'flex', alignItems: 'center' },
  input: { width: '50%', fontSize: '8pt', boxSizing: 'border-box', border: 'none', borderBottom: '2px solid black', background: 'none', outline: 'none', overflowWrap: 'break-word', whiteSpace: 'normal', wordWrap: 'break-word', ...fontBase, lineHeight: '1' },
};

const adminStyles = {
  shell: {
    background: 'transparent',
    border: 'none',
    width: '100%',
  },
  toolbar: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    boxShadow: '0 10px 28px rgba(26, 45, 90, 0.06)',
  },
  kicker: {
    margin: '0 0 4px',
    color: '#2b3d6d',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: '#1a1d24',
    fontSize: 22,
    fontWeight: 800,
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 13,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: 14,
  },
  metric: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '12px 14px',
    boxShadow: '0 8px 22px rgba(26, 45, 90, 0.045)',
  },
  metricLabel: {
    display: 'block',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    display: 'block',
    color: '#1a2d5a',
    fontSize: 24,
    lineHeight: 1.2,
    marginTop: 4,
  },
  metricValueSmall: {
    display: 'block',
    color: '#1a2d5a',
    fontSize: 18,
    lineHeight: 1.35,
    marginTop: 6,
  },
  profileCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    boxShadow: '0 10px 28px rgba(26, 45, 90, 0.06)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    color: '#1a1d24',
    fontSize: 16,
    fontWeight: 800,
  },
  sectionHint: {
    color: '#64748b',
    fontSize: 12,
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 10,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 700,
  },
  recordsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))',
    gap: 14,
  },
  semesterCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 14,
    boxShadow: '0 8px 22px rgba(26, 45, 90, 0.045)',
  },
  semesterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  semesterTitle: {
    margin: 0,
    color: '#1a2d5a',
    fontSize: 14,
    fontWeight: 800,
  },
  semesterMeta: {
    margin: '2px 0 0',
    color: '#64748b',
    fontSize: 12,
  },
  recordsTable: {
    fontSize: 12,
  },
};

function AdminField({ label, type, readOnly, inputProps, wide = false }) {
  return (
    <label style={{ ...adminStyles.field, ...(wide ? { gridColumn: 'span 2' } : {}) }}>
      <span style={adminStyles.fieldLabel}>{label}</span>
      {type === 'select' ? (
        <select className="form-select form-select-sm" disabled={readOnly} {...inputProps}>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      ) : (
        <input className="form-control form-control-sm" type={type} readOnly={readOnly} {...inputProps} />
      )}
    </label>
  );
}

export default TranscriptContent;
