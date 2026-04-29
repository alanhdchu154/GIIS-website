import React, { useState } from 'react';
import logoSlogan from '../../../img/logo_slogan.png';
import GradeTable from './GradeTable.js';
import TranscriptActions from './TranscriptActions.js';
import { useTranscriptData } from './useTranscriptData.js';
import { exportTranscriptToPDF } from './transcriptPdf.js';
import { TRANSCRIPT_SEMESTER_KEYS } from './transcriptMappers.js';
import { getAllSemesterStatuses, SEMESTER_STATUS } from './semesterStatus.js';
import TranscriptSkeleton from '../../TranscriptSkeleton.js';
import './transcript-print.css';

function TranscriptContent({
  language,
  studentId = null,
  authToken = null,
  viewerRole = 'student',
  mode = 'view',
}) {
  const isAdminViewer = viewerRole === 'admin';
  const canEdit = isAdminViewer && mode === 'edit';
  const canSave = canEdit;
  const canExport = isAdminViewer && mode === 'view';

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
  } = useTranscriptData({ studentId, authToken, canEdit, canSave });

  const handleExport = () =>
    exportTranscriptToPDF({
      profile,
      semesterRowsRef,
      semesterInitialRows,
      setIsStaticMode,
    });

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

  // For status computation: use transcriptDate for official view, today for live editing.
  const referenceDate =
    profile?.transcriptDate ? new Date(profile.transcriptDate) : today;
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
                <td style={styles.thTd}>Transcript Date: <input type="date" style={styles.input} readOnly={isStatic} {...(profile ? pf('transcriptDate') : {})} /></td>
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

          <div className="pdf-page-number" style={{ textAlign: 'center', fontFamily: 'Times New Roman, Times, serif', fontSize: '8pt', marginTop: '4px' }}>-- 1 of 1 --</div>
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

export default TranscriptContent;
