import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { getStudentSession } from '../../../api/authStorage';
import { getApiBase } from '../../../config/apiBase';
import Nav from '../../main/Nav.js';

const API = getApiBase();

function ResourceLink({ url, note }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '12px', color: '#2b3d6d', textDecoration: 'none',
      background: '#f0f4ff', border: '1px solid #d0d9f0',
      padding: '3px 10px', borderRadius: '12px', fontWeight: 600,
    }}>
      {note || url}
    </a>
  );
}

export default function SyllabusPage({ language }) {
  const isEn = language !== 'zh';
  const { slug } = useParams();
  const session = getStudentSession();

  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/courses/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setCourse)
      .catch(() => setError('Course not found'));
  }, [slug]);

  if (error) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#c62828' }}>{error}</div>;
  if (!course) return <div style={{ padding: '80px 10%', fontFamily: 'Inter', color: '#888' }}>{isEn ? 'Loading…' : '加载中…'}</div>;

  const totalHrs = course.modules.reduce((s, m) => s + Number(m.estimatedHrs || 3), 0);

  return (
    <>
      <Helmet>
        <title>{isEn ? `Syllabus: ${course.name}` : `课程大纲：${course.nameZh || course.name}`} | GIIS Learn</title>
      </Helmet>
      <div className="row"><Nav language={language} /></div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 5% 100px', fontFamily: 'Inter, sans-serif' }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
          {session && (
            <>
              <Link to="/learn" style={{ color: '#2b3d6d', textDecoration: 'none' }}>{isEn ? 'My Courses' : '我的课程'}</Link>
              {' → '}
              <Link to={`/learn/${slug}`} style={{ color: '#2b3d6d', textDecoration: 'none' }}>{isEn ? course.name : (course.nameZh || course.name)}</Link>
              {' → '}
            </>
          )}
          <span style={{ color: '#444' }}>{isEn ? 'Syllabus' : '课程大纲'}</span>
        </p>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2b3d6d', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {course.department} · {course.type} · {Number(course.credits)} {isEn ? 'Credit(s)' : '学分'}
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e', margin: '8px 0 12px' }}>
            {isEn ? course.name : (course.nameZh || course.name)}
          </h1>
          <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.75, maxWidth: '700px', margin: 0 }}>
            {course.description}
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '48px' }}>
          {[
            { label: isEn ? 'Modules' : '章节', value: course.modules.length },
            { label: isEn ? 'Est. Hours' : '预计时长', value: `~${totalHrs}h` },
            { label: isEn ? 'Credits' : '学分', value: Number(course.credits) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8f9fd', border: '1px solid #e0e6f0', borderRadius: '10px', padding: '18px 20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#1a1a2e' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Grading */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px' }}>
            {isEn ? 'Grading' : '成绩构成'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: isEn ? 'Module Quizzes (14 total)' : '章节测验（共 14 次）', weight: '40%', color: '#2b3d6d', note: isEn ? 'One quiz per module, submitted once' : '每章一次，提交后不可重做' },
              { label: isEn ? 'Midterm Exam' : '期中考试', weight: '30%', color: '#C84B0A', note: isEn ? 'Covers modules 1–7 · unlocked after all module 1–7 quizzes' : '涵盖模块 1–7 · 完成前7章测验后解锁' },
              { label: isEn ? 'Final Exam' : '期末考试', weight: '30%', color: '#1B6B3A', note: isEn ? 'Covers all modules · unlocked after midterm' : '涵盖全部模块 · 通过期中考试后解锁' },
            ].map(({ label, weight, color, note }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', border: '1px solid #e0e6f0', borderLeft: `4px solid ${color}`, borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1a1a2e' }}>{label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>{note}</p>
                </div>
                <span style={{ fontSize: '22px', fontWeight: 800, color }}>{weight}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>
            {isEn ? 'Passing threshold: 70%. Exam retakes allowed after 24-hour cooldown.' : '及格线：70%。考试可在 24 小时后重考。'}
          </p>
        </section>

        {/* Module list */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', marginBottom: '14px' }}>
            {isEn ? 'Course Outline' : '课程章节'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {course.modules.map((mod) => (
              <div key={mod.order} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Module header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: '#f8f9fd', borderBottom: '1px solid #e0e6f0' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#2b3d6d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {mod.order}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                      {isEn ? mod.title : (mod.titleZh || mod.title)}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>~{mod.estimatedHrs}h</span>
                </div>

                {/* Module body */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Objectives */}
                  {mod.objectives && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isEn ? 'Learning Objectives' : '学习目标'}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: 1.65 }}>{mod.objectives}</p>
                    </div>
                  )}

                  {/* Resources */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isEn ? 'Resources' : '学习资源'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {mod.readingUrl && <ResourceLink url={mod.readingUrl} note={mod.readingNote || (isEn ? 'Reading' : '阅读')} />}
                      {mod.videoUrl && <ResourceLink url={mod.videoUrl} note={mod.videoNote || (isEn ? 'Video' : '视频')} />}
                      {mod.video2Url && <ResourceLink url={mod.video2Url} note={mod.video2Note || (isEn ? 'Video 2' : '视频 2')} />}
                      {mod.practiceUrl && <ResourceLink url={mod.practiceUrl} note={mod.practiceNote || (isEn ? 'Practice' : '练习')} />}
                    </div>
                  </div>

                  {/* Assignment */}
                  {mod.assignment && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isEn ? 'Assignment' : '作业'}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: 1.65 }}>{mod.assignment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
