import { useRef, useState, useEffect, useCallback } from 'react';
import { courseApiToGradeRows, gradeRowsToApiCourses, TRANSCRIPT_SEMESTER_KEYS } from './transcriptMappers.js';
import { getApiBase } from '../../../config/apiBase';

const API_BASE = getApiBase();

function authHeaders(authToken) {
  if (authToken && authToken !== '__cookie__') {
    return { Authorization: `Bearer ${authToken}` };
  }
  return {};
}

export function useTranscriptData({ studentId, authToken, canEdit, canSave, loadUrl = null }) {
  const hasRemoteAccess = Boolean(studentId);

  const [profile, setProfile] = useState(null);
  const [semesterInitialRows, setSemesterInitialRows] = useState({});
  const [semesterGPAs, setSemesterGPAs] = useState({});
  const [cumulativeCredits, setCumulativeCredits] = useState(0);
  const [remoteLoadError, setRemoteLoadError] = useState(null);
  const [remoteSaving, setRemoteSaving] = useState(false);

  const semesterRowsRef = useRef({});

  useEffect(() => {
    if (!hasRemoteAccess) return;
    if (!API_BASE) {
      setRemoteLoadError('API URL not configured. Set REACT_APP_API_URL for production builds.');
      return;
    }
    let cancelled = false;
    (async () => {
      setRemoteLoadError(null);
      try {
        const r = await fetch(loadUrl || `${API_BASE}/api/students/${studentId}`, {
          credentials: 'include',
          headers: authHeaders(authToken),
        });
        if (r.status === 401) throw new Error('Session expired — log in again.');
        if (!r.ok) throw new Error((await r.text()) || 'Load failed');
        const data = await r.json();
        const s = data.student;
        if (cancelled) return;
        setProfile({
          name: s.name || '',
          studentCode: s.studentCode || '',
          currentGrade: s.currentGrade ?? null,
          birthDate: s.birthDate || '',
          gender: s.gender || 'Female',
          parentGuardian: s.parentGuardian || '',
          address: s.address || '',
          city: s.city || '',
          province: s.province || '',
          zipCode: s.zipCode || '',
          entryDate: s.entryDate || '',
          withdrawalDate: s.withdrawalDate || '',
          graduationDate: s.graduationDate || '',
          transcriptDate: s.transcriptDate || new Date().toISOString().split('T')[0],
        });
        const initials = {};
        (s.semesters || []).forEach((sem) => {
          initials[sem.key] = courseApiToGradeRows(sem.courseRows);
        });
        semesterRowsRef.current = initials;
        setSemesterInitialRows(initials);
      } catch (e) {
        if (!cancelled) setRemoteLoadError(e.message || 'Failed to load');
      }
    })();
    return () => { cancelled = true; };
  }, [hasRemoteAccess, studentId, authToken, loadUrl]);

  useEffect(() => {
    const total = Object.values(semesterGPAs).reduce(
      (sum, s) => sum + (parseFloat(s.totalCredits) || 0),
      0
    );
    setCumulativeCredits(total);
  }, [semesterGPAs]);

  const handleTotalsUpdate = useCallback((semesterName, gpaData) => {
    const { weightedGPA, unweightedGPA, totalCredits } = gpaData;
    setSemesterGPAs((prev) => ({
      ...prev,
      [semesterName]: {
        weightedGPA: parseFloat(weightedGPA) || 0,
        unweightedGPA: parseFloat(unweightedGPA) || 0,
        totalCredits: parseFloat(totalCredits) || 0,
      },
    }));
  }, []);

  const handleSemesterRowsChange = useCallback((semesterName, rows) => {
    semesterRowsRef.current[semesterName] = rows;
  }, []);

  const calculateCumulativeGPA = useCallback((type = 'weightedGPA') => {
    let totalGpaCredits = 0;
    let totalCredits = 0;
    for (const sem of Object.values(semesterGPAs)) {
      const gpa = sem[type];
      const cr = sem.totalCredits;
      if (gpa > 0 && cr > 0) {
        totalGpaCredits += gpa * cr;
        totalCredits += cr;
      }
    }
    if (totalCredits === 0) return '-';
    return (totalGpaCredits / totalCredits).toFixed(2);
  }, [semesterGPAs]);

  const saveRemoteTranscript = useCallback(async () => {
    if (!canSave || !API_BASE || !profile) return;
    setRemoteSaving(true);
    setRemoteLoadError(null);
    try {
      const patchBody = {
        name: profile.name,
        birthDate: profile.birthDate || null,
        gender: profile.gender || null,
        parentGuardian: profile.parentGuardian || null,
        address: profile.address || null,
        city: profile.city || null,
        province: profile.province || null,
        zipCode: profile.zipCode || null,
        entryDate: profile.entryDate || null,
        withdrawalDate: profile.withdrawalDate || null,
        graduationDate: profile.graduationDate || null,
        transcriptDate: profile.transcriptDate || null,
      };
      const pr = await fetch(`${API_BASE}/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(authToken) },
        credentials: 'include',
        body: JSON.stringify(patchBody),
      });
      if (!pr.ok) throw new Error(await pr.text());

      const semesters = TRANSCRIPT_SEMESTER_KEYS.map((key, sortOrder) => ({
        key,
        sortOrder,
        courseRows: gradeRowsToApiCourses(semesterRowsRef.current[key] || []),
      }));

      const tr = await fetch(`${API_BASE}/api/students/${studentId}/transcript`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(authToken) },
        credentials: 'include',
        body: JSON.stringify({ semesters }),
      });
      if (!tr.ok) throw new Error(await tr.text());
    } catch (e) {
      setRemoteLoadError(e.message || 'Save failed');
    } finally {
      setRemoteSaving(false);
    }
  }, [canSave, profile, studentId, authToken]);

  return {
    profile,
    setProfile,
    semesterInitialRows,
    semesterRowsRef,
    semesterGPAs,
    cumulativeCredits,
    remoteLoadError,
    remoteSaving,
    hasRemoteAccess,
    handleTotalsUpdate,
    handleSemesterRowsChange,
    calculateCumulativeGPA,
    saveRemoteTranscript,
  };
}
