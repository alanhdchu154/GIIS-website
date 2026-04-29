import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import logoUrl from '../../../img/logo_nobg.png';

function loadHtml2Pdf() {
  if (typeof window !== 'undefined' && window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-html2pdf]');
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', () => reject(new Error('html2pdf load failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = `${process.env.PUBLIC_URL}/html2pdf.bundle.min.js`;
    s.async = true;
    s.dataset.html2pdf = '1';
    s.onload = resolve;
    s.onerror = () => reject(new Error('html2pdf load failed'));
    document.body.appendChild(s);
  });
}

const SCHOOL = {
  name: 'Genesis of Ideas International School',
  short: 'GIIS',
  address: '7901 4th St N STE 300',
  city: 'St. Petersburg, FL 33702',
  phone: '+1 (813) 501-5756',
  website: 'https://genesisideas.school',
  email: 'admissions@genesisideas.school',
  flSchoolCode: '650',
  ceebCode: 'Pending',
  founded: '2022',
  registered: '2024',
  president: 'Shiyu Zhang, Ph.D.',
  type: 'Florida Registered Private School',
  enrollment: 'Approximately 4 students (2024–2025)',
  gradeRange: 'Grades 9–12',
};

const GRADING_SCALE = [
  { grade: 'A+', range: '97–100', gpa: '4.0' },
  { grade: 'A',  range: '93–96',  gpa: '4.0' },
  { grade: 'A−', range: '90–92',  gpa: '3.7' },
  { grade: 'B+', range: '87–89',  gpa: '3.3' },
  { grade: 'B',  range: '83–86',  gpa: '3.0' },
  { grade: 'B−', range: '80–82',  gpa: '2.7' },
  { grade: 'C+', range: '77–79',  gpa: '2.3' },
  { grade: 'C',  range: '73–76',  gpa: '2.0' },
  { grade: 'C−', range: '70–72',  gpa: '1.7' },
  { grade: 'D+', range: '67–69',  gpa: '1.3' },
  { grade: 'D',  range: '63–66',  gpa: '1.0' },
  { grade: 'D−', range: '60–62',  gpa: '0.7' },
  { grade: 'F',  range: '0–59',   gpa: '0.0' },
];

const DEPARTMENTS = [
  {
    name: 'English Language Arts',
    courses: ['English 9', 'English 10', 'English 11', 'English 12', 'Creative Writing', 'Literature & Composition'],
  },
  {
    name: 'Mathematics',
    courses: ['Algebra I', 'Geometry', 'Algebra II', 'Pre-Calculus', 'Calculus', 'Statistics'],
  },
  {
    name: 'Sciences',
    courses: ['Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Anatomy & Physiology'],
  },
  {
    name: 'Social Studies',
    courses: ['World History', 'U.S. History', 'Government & Politics', 'Economics', 'Psychology', 'Sociology'],
  },
  {
    name: 'World Languages',
    courses: ['Mandarin Chinese I–IV', 'Spanish I–IV'],
  },
  {
    name: 'Business & Technology',
    courses: ['Introduction to Business', 'Entrepreneurship', 'Computer Science', 'Digital Media'],
  },
  {
    name: 'Arts & Electives',
    courses: ['Visual Arts', 'Music Appreciation', 'Communications', 'Health & Physical Education'],
  },
];

const GRAD_REQS = [
  { subject: 'English Language Arts', credits: 4 },
  { subject: 'Mathematics', credits: 4 },
  { subject: 'Sciences', credits: 3 },
  { subject: 'Social Studies', credits: 3 },
  { subject: 'World Languages', credits: 2 },
  { subject: 'Arts or Electives', credits: 2 },
  { subject: 'Physical Education / Health', credits: 1 },
  { subject: 'Electives', credits: 5 },
];

const GOLD = '#b8962e';
const NAVY = '#1a2d5a';
const CREAM = '#faf6ed';

const s = {
  page: {
    width: '8.5in',
    minHeight: '11in',
    background: CREAM,
    boxSizing: 'border-box',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '10px',
    color: '#222',
    padding: '0.55in 0.65in',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    marginBottom: '14px',
    paddingBottom: '12px',
    borderBottom: `3px double ${NAVY}`,
  },
  logo: { width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 },
  schoolName: { fontSize: '15px', fontWeight: 700, color: NAVY, letterSpacing: '0.5px', fontFamily: "'Georgia', serif", lineHeight: 1.25 },
  schoolMeta: { fontSize: '8.5px', color: '#555', marginTop: '3px', lineHeight: 1.6 },
  section: { marginBottom: '12px' },
  sectionTitle: {
    fontSize: '9px',
    fontWeight: 700,
    color: GOLD,
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${GOLD}`,
    paddingBottom: '3px',
    marginBottom: '7px',
  },
  body: { fontSize: '9.5px', lineHeight: 1.7, color: '#333' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  threeCol: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '9px' },
  th: { background: NAVY, color: '#fff', padding: '4px 8px', textAlign: 'left', fontWeight: 600, letterSpacing: '0.5px' },
  td: { padding: '3px 8px', borderBottom: '1px solid #e8e0d0', color: '#333' },
  tdAlt: { padding: '3px 8px', borderBottom: '1px solid #e8e0d0', color: '#333', background: '#f5f0e8' },
  deptName: { fontSize: '9px', fontWeight: 700, color: NAVY, marginBottom: '3px' },
  deptList: { fontSize: '8.5px', color: '#444', lineHeight: 1.65, paddingLeft: '10px' },
  footer: {
    marginTop: '16px',
    paddingTop: '10px',
    borderTop: `1px solid ${GOLD}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    fontSize: '8px',
    color: '#888',
  },
  sigLine: {
    width: '2in',
    borderBottom: `1px solid ${NAVY}`,
    marginBottom: '4px',
    height: '24px',
  },
  sigLabel: { fontSize: '8px', color: '#555' },
};

function ProfileDocument() {
  const currentYear = new Date().getFullYear();

  return (
    <div style={s.page}>
      {/* Top border accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: NAVY }} />
      <div style={{ position: 'absolute', top: '6px', left: 0, right: 0, height: '2px', background: GOLD }} />

      {/* Header */}
      <div style={s.header}>
        <img src={logoUrl} alt="GIIS Logo" style={s.logo} />
        <div style={{ flex: 1 }}>
          <div style={s.schoolName}>{SCHOOL.name}</div>
          <div style={s.schoolMeta}>
            {SCHOOL.address} · {SCHOOL.city} · {SCHOOL.phone} · {SCHOOL.website}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#555', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: '10px' }}>SCHOOL PROFILE</div>
          <div>Academic Year {currentYear - 1}–{currentYear}</div>
          <div>CEEB Code: {SCHOOL.ceebCode}</div>
          <div style={{ marginTop: '3px', fontSize: '7.5px', color: '#aaa' }}>
            Issued: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* About */}
      <div style={s.section}>
        <div style={s.sectionTitle}>About the School</div>
        <div style={s.twoCol}>
          <div style={s.body}>
            Genesis of Ideas International School (GIIS) is an independent private school
            registered with the Florida Department of Education, offering a rigorous,
            personalized high school curriculum for students in Grades 9–12. Founded in 2022,
            GIIS emphasizes critical thinking, interdisciplinary learning, and global
            citizenship. The school completed formal registration with the Florida Department
            of Education in 2024. Our small enrollment ensures that every student receives
            individualized academic attention and mentorship.
            <br /><br />
            <em>Accreditation:</em> GIIS is currently an independent private school registered
            with the Florida DOE (Statute 1002.42). The school is in the process of pursuing
            regional accreditation. A CEEB code application has been submitted to College Board.
            Transcripts are issued and certified by the school president.
          </div>
          <table style={{ ...s.table, alignSelf: 'start' }}>
            <tbody>
              {[
                ['Type', SCHOOL.type],
                ['Founded', SCHOOL.founded],
                ['FL DOE Registered', SCHOOL.registered],
                ['FL School Code', SCHOOL.flSchoolCode],
                ['CEEB Code', SCHOOL.ceebCode],
                ['Grades', SCHOOL.gradeRange],
                ['Enrollment', SCHOOL.enrollment],
                ['President', SCHOOL.president],
              ].map(([k, v], i) => (
                <tr key={k}>
                  <td style={{ ...(i % 2 === 0 ? s.td : s.tdAlt), fontWeight: 600, color: NAVY, width: '38%' }}>{k}</td>
                  <td style={i % 2 === 0 ? s.td : s.tdAlt}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Curriculum */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Curriculum & Course Offerings</div>
        <div style={{ ...s.body, marginBottom: '8px' }}>
          GIIS offers a comprehensive college-preparatory curriculum across seven departments.
          Courses are semester-based; each semester course earns <strong>0.5 credit</strong>{' '}
          and each full-year course earns <strong>1.0 credit</strong>.
          Students complete online coursework with module-based assessments, midterm examinations,
          and final examinations. All courses are taught and evaluated in English.
        </div>
        <div style={s.threeCol}>
          {DEPARTMENTS.map((dept) => (
            <div key={dept.name}>
              <div style={s.deptName}>{dept.name}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {dept.courses.map((c) => (
                  <li key={c} style={{ ...s.deptList, paddingLeft: 0 }}>· {c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: grading + graduation */}
      <div style={s.twoCol}>
        {/* Grading scale */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Grading Scale & GPA</div>
          <div style={{ ...s.body, marginBottom: '6px' }}>
            GPA is computed on a 4.0 scale, weighted by course credits.
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Grade</th>
                <th style={s.th}>Range (%)</th>
                <th style={s.th}>GPA Points</th>
              </tr>
            </thead>
            <tbody>
              {GRADING_SCALE.map((row, i) => (
                <tr key={row.grade}>
                  <td style={{ ...(i % 2 === 0 ? s.td : s.tdAlt), fontWeight: 600 }}>{row.grade}</td>
                  <td style={i % 2 === 0 ? s.td : s.tdAlt}>{row.range}</td>
                  <td style={i % 2 === 0 ? s.td : s.tdAlt}>{row.gpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Graduation requirements */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Graduation Requirements</div>
          <div style={{ ...s.body, marginBottom: '6px' }}>
            Students must earn a minimum of <strong>24 credits</strong> to qualify for a
            High School Diploma. The following distribution is required:
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Subject Area</th>
                <th style={{ ...s.th, textAlign: 'center' }}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {GRAD_REQS.map((row, i) => (
                <tr key={row.subject}>
                  <td style={i % 2 === 0 ? s.td : s.tdAlt}>{row.subject}</td>
                  <td style={{ ...(i % 2 === 0 ? s.td : s.tdAlt), textAlign: 'center', fontWeight: 600 }}>
                    {row.credits}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ ...s.td, fontWeight: 700, color: NAVY, borderTop: `2px solid ${NAVY}` }}>Total Required</td>
                <td style={{ ...s.td, fontWeight: 700, color: NAVY, textAlign: 'center', borderTop: `2px solid ${NAVY}` }}>24</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '10px' }}>
            <div style={s.sectionTitle}>Assessment Structure</div>
            <div style={s.body}>
              Each course consists of <strong>14 learning modules</strong> with embedded
              quizzes, a <strong>midterm examination</strong> (15 questions), and a{' '}
              <strong>final examination</strong> (20 questions). Credit is awarded upon
              satisfactory completion of all assessments with a passing score of 60% or above.
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Signature */}
      <div style={s.footer}>
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={s.sigLine} />
            <div style={s.sigLabel}>
              <strong>{SCHOOL.president}</strong> · President<br />
              {SCHOOL.phone} · {SCHOOL.email}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '8px', color: '#aaa' }}>
          <div>{SCHOOL.name}</div>
          <div>{SCHOOL.address}, {SCHOOL.city}</div>
          <div>Profile updated {currentYear} · {SCHOOL.website}</div>
        </div>
      </div>

      {/* Bottom border accent */}
      <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, height: '2px', background: GOLD }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: NAVY }} />
    </div>
  );
}

export default function SchoolProfilePage() {
  const ref = useRef(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!ref.current) return;
    setDownloading(true);
    try {
      await loadHtml2Pdf();
      await window.html2pdf()
        .set({
          margin: 0,
          filename: 'GIIS_School_Profile.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .from(ref.current)
        .save();
    } catch (e) {
      alert('PDF generation failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>School Profile | Genesis of Ideas International School</title>
      </Helmet>

      {/* Toolbar */}
      <div style={{
        background: NAVY, color: '#fff', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Inter, sans-serif', gap: '16px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>School Profile — GIIS</span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            background: GOLD, color: '#fff', border: 'none', borderRadius: '6px',
            padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            opacity: downloading ? 0.7 : 1,
          }}
        >
          {downloading ? 'Generating PDF…' : '⬇ Download PDF'}
        </button>
      </div>

      {/* Preview */}
      <div style={{ background: '#2a2a2a', minHeight: '100vh', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div ref={ref} style={{ boxShadow: '0 12px 60px rgba(0,0,0,0.55)' }}>
          <ProfileDocument />
        </div>
      </div>
    </>
  );
}
