import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

function useCourses() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => setError('Failed to load courses'));
  }, []);
  return { courses, error };
}

function useEnrollments() {
  const [enrollments, setEnrollments] = useState(null);
  const [error, setError] = useState('');
  const reload = () => {
    fetch(`${API}/api/enrollments`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEnrollments(d || []))
      .catch(() => setEnrollments([]));
  };
  useEffect(reload, []);
  return { enrollments, error, reload };
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ background: '#e8ecf5', borderRadius: '4px', height: '6px', marginTop: '8px' }}>
      <div style={{ width: `${pct}%`, background: '#2b3d6d', borderRadius: '4px', height: '100%', transition: 'width 0.3s' }} />
    </div>
  );
}

export default function LearnDashboard({ language }) {
  const isEn = language !== 'zh';
  const navigate = useNavigate();
  const session = getStudentSession();
  const { courses } = useCourses();
  const { enrollments, reload } = useEnrollments();
  const [enrolling, setEnrolling] = useState(null);
  const [enrollErr, setEnrollErr] = useState('');

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  const enrolledSlugs = new Set((enrollments || []).map((e) => e.course.slug));

  async function enroll(slug) {
    setEnrolling(slug);
    setEnrollErr('');
    try {
      const r = await fetch(`${API}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setEnrollErr(d.error || 'Enrollment failed');
      } else {
        reload();
      }
    } catch {
      setEnrollErr('Network error');
    } finally {
      setEnrolling(null);
    }
  }

  if (!session) return null;

  const myEnrollments = enrollments || [];
  const allCourses = courses || [];

  const DEPT_COLORS = {
    Mathematics: '#2b3d6d',
    'English Language Arts': '#C84B0A',
    Science: '#1B6B3A',
    'Social Studies': '#5b2c6f',
    'Physical Education': '#1565C0',
  };

  return (
    <>
      <Helmet>
        <title>{isEn ? 'My Courses' : '我的课程'} | GIIS</title>
      </Helmet>
      <div className="row">
        <Nav language={language} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 5% 80px', fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#2b3d6d', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>
            {isEn ? 'Student Portal' : '学生平台'}
          </p>
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>
            {isEn ? `Welcome back, ${session.student.name || 'Student'}` : `欢迎回来，${session.student.name || '同学'}`}
          </h1>
          <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
            {isEn ? 'Continue your courses or enroll in something new.' : '继续学习或报名新课程。'}
          </p>
        </div>

        {/* My Courses */}
        {myEnrollments.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', marginBottom: '20px' }}>
              {isEn ? 'My Courses' : '我的课程'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {myEnrollments.map((enr) => {
                const total = enr.course._count?.modules || 0;
                const completed = enr.completedModules?.length || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const color = DEPT_COLORS[enr.course.department] || '#2b3d6d';
                return (
                  <Link key={enr.id} to={`/learn/${enr.course.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#fff', border: '1px solid #e0e6f0', borderTop: `4px solid ${color}`,
                      borderRadius: '10px', padding: '24px', transition: 'box-shadow 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {enr.course.department}
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', margin: '8px 0 4px' }}>
                        {isEn ? enr.course.name : (enr.course.nameZh || enr.course.name)}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 12px' }}>
                        {enr.course.credits} {isEn ? 'credit' : '学分'} · {total} {isEn ? 'modules' : '模块'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#444', fontWeight: 600 }}>{pct}% {isEn ? 'complete' : '已完成'}</span>
                        {enr.creditEarned && (
                          <span style={{ fontSize: '11px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                            ✓ {isEn ? 'Credit earned' : '已获学分'}
                          </span>
                        )}
                      </div>
                      <ProgressBar completed={completed} total={total} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Course Catalog */}
        <section>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>
            {isEn ? 'Course Catalog' : '课程目录'}
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            {isEn ? 'Enroll in any course below — you can take multiple courses simultaneously.' : '可同时报名多门课程，自主安排学习进度。'}
          </p>
          {enrollErr && <p style={{ color: '#c62828', marginBottom: '16px', fontSize: '14px' }}>{enrollErr}</p>}
          {allCourses.length === 0 ? (
            <p style={{ color: '#888', fontSize: '15px' }}>{isEn ? 'No courses available yet.' : '暂无可用课程。'}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {allCourses.map((c) => {
                const enrolled = enrolledSlugs.has(c.slug);
                const color = DEPT_COLORS[c.department] || '#2b3d6d';
                return (
                  <div key={c.slug} style={{
                    background: '#fff', border: '1px solid #e0e6f0', borderTop: `4px solid ${color}`,
                    borderRadius: '10px', padding: '24px',
                    opacity: enrolled ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {c.department}
                      </span>
                      <span style={{ fontSize: '11px', background: '#f0f2f8', color: '#2b3d6d', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                        {c.type}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
                      {isEn ? c.name : (c.nameZh || c.name)}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, margin: '0 0 16px', minHeight: '40px' }}>
                      {c.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        {c.credits} {isEn ? 'credit' : '学分'} · {c._count?.modules || 0} {isEn ? 'modules' : '模块'}
                      </span>
                      {enrolled ? (
                        <Link to={`/learn/${c.slug}`} style={{
                          fontSize: '13px', fontWeight: 700, color: '#2b3d6d', textDecoration: 'none',
                          padding: '6px 14px', border: '2px solid #2b3d6d', borderRadius: '6px',
                        }}>
                          {isEn ? 'Continue →' : '继续学习 →'}
                        </Link>
                      ) : (
                        <button
                          onClick={() => enroll(c.slug)}
                          disabled={enrolling === c.slug}
                          style={{
                            fontSize: '13px', fontWeight: 700, color: '#fff',
                            background: enrolling === c.slug ? '#aaa' : color,
                            border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer',
                          }}
                        >
                          {enrolling === c.slug ? (isEn ? 'Enrolling…' : '报名中…') : (isEn ? '+ Enroll' : '+ 报名')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
