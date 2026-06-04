import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Nav from '../../main/Nav.js';

function QuestionSample({ label, sample }) {
  if (!sample) return null;
  return (
    <div style={{ border: '1px solid #e2e7f0', borderRadius: 8, padding: '14px 15px', background: '#fff' }}>
      <p style={{ margin: '0 0 7px', color: '#2b3d6d', fontSize: 11, fontWeight: 850, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '0 0 9px', color: '#1a1a2e', fontSize: 13, lineHeight: 1.55, fontWeight: 750 }}>
        {sample.question}
      </p>
      {sample.options?.length > 0 && (
        <p style={{ margin: '0 0 9px', color: '#667085', fontSize: 12, lineHeight: 1.5 }}>
          {sample.options.join(' / ')}
        </p>
      )}
      <p style={{ margin: 0, color: '#1B6B3A', fontSize: 12, lineHeight: 1.55, fontWeight: 750 }}>
        Answer: {sample.answer}
      </p>
    </div>
  );
}

function CourseProofCard({ course, isEn }) {
  const sample = course.moduleSample || {};
  return (
    <article style={{
      border: '1px solid #dfe5ef',
      borderRadius: 8,
      background: '#fff',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 22px', borderTop: '4px solid #2b3d6d', borderBottom: '1px solid #e8ecf5' }}>
        <p style={{ margin: '0 0 7px', color: '#667085', fontSize: 12, fontWeight: 750 }}>
          {course.department} · {course.credits} credit · {course.courseEvidence.modules} modules
        </p>
        <h2 style={{ margin: '0 0 9px', color: '#1a1a2e', fontSize: 24, lineHeight: 1.15, fontWeight: 850 }}>
          {course.name}
        </h2>
        <p style={{ margin: 0, color: '#4f5868', fontSize: 13, lineHeight: 1.65 }}>
          {sample.parentValue}
        </p>
      </div>

      <div style={{ padding: '18px 22px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 9, marginBottom: 18 }}>
          {[
            { label: isEn ? 'Assignments' : '作业', value: course.courseEvidence.assignments },
            { label: isEn ? 'Quiz items' : '测验题', value: course.courseEvidence.quizQuestions },
            { label: isEn ? 'Midterm' : '期中', value: course.courseEvidence.midtermQuestions },
            { label: isEn ? 'Final' : '期末', value: course.courseEvidence.finalQuestions },
          ].map((item) => (
            <div key={item.label} style={{ background: '#f8f9fd', border: '1px solid #e8ecf5', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 3px', color: '#2b3d6d', fontSize: 19, fontWeight: 850 }}>{item.value}</p>
              <p style={{ margin: 0, color: '#667085', fontSize: 11 }}>{item.label}</p>
            </div>
          ))}
        </div>

        <p style={{ margin: '0 0 7px', color: '#8a6a14', fontSize: 11, fontWeight: 850, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {isEn ? 'Reviewable Assignment Sample' : '可审阅作业示例'}
        </p>
        <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 17, lineHeight: 1.25, fontWeight: 850 }}>
          Module {sample.order}: {sample.title}
        </h3>
        <p style={{ margin: '0 0 12px', color: '#4f5868', fontSize: 13, lineHeight: 1.65 }}>
          {sample.assignment}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginBottom: 18 }}>
          <div style={{ background: '#fffbef', border: '1px solid #ead7a7', borderRadius: 8, padding: '12px 13px' }}>
            <p style={{ margin: '0 0 4px', color: '#8a6a14', fontSize: 11, fontWeight: 850 }}>{isEn ? 'Expected evidence' : '应提交证据'}</p>
            <p style={{ margin: 0, color: '#4f5868', fontSize: 12, lineHeight: 1.55 }}>{sample.expectedEvidence}</p>
          </div>
          <div style={{ background: '#f4faf6', border: '1px solid #cde8d1', borderRadius: 8, padding: '12px 13px' }}>
            <p style={{ margin: '0 0 4px', color: '#1B6B3A', fontSize: 11, fontWeight: 850 }}>{isEn ? 'Rubric focus' : '评分重点'}</p>
            <p style={{ margin: 0, color: '#4f5868', fontSize: 12, lineHeight: 1.55 }}>{sample.rubricFocus}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <QuestionSample label={isEn ? 'Quiz Sample' : '测验示例'} sample={course.assessmentSamples.quiz} />
          <QuestionSample label={isEn ? 'Midterm Sample' : '期中示例'} sample={course.assessmentSamples.midterm} />
          <QuestionSample label={isEn ? 'Final Sample' : '期末示例'} sample={course.assessmentSamples.final} />
        </div>
      </div>
    </article>
  );
}

export default function AssessmentProofPage({ language, toggleLanguage }) {
  const isEn = language !== 'zh';
  const [packet, setPacket] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/parent-assessment-proof.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setPacket(data);
      })
      .catch(() => {
        if (!cancelled) setPacket(null);
      });
    return () => { cancelled = true; };
  }, []);

  const courses = packet?.courses || [];
  const summary = useMemo(() => packet?.summary || { pass: 0, fail: 0, total: 0 }, [packet]);

  return (
    <>
      <Helmet>
        <title>{isEn ? 'Assessment Proof' : '评量证据'} | Genesis of Ideas International School</title>
        <meta
          name="description"
          content={isEn
            ? 'Preview concrete GIIS course assessment evidence: assignments, quiz samples, midterm samples, final samples, and review rubric focus.'
            : '预览 GIIS 课程评量证据：作业、测验示例、期中示例、期末示例与评分重点。'}
        />
      </Helmet>

      <div className="row"><Nav language={language} toggleLanguage={toggleLanguage} /></div>

      <section style={{ background: '#10182a', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '72px 0 62px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 6%' }}>
          <p style={{ margin: '0 0 12px', color: '#d5a836', fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase' }}>
            {isEn ? 'Visible Learning Evidence' : '看得见的学习证据'}
          </p>
          <h1 style={{ margin: '0 0 16px', maxWidth: 820, color: '#fff', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.05, fontWeight: 850 }}>
            {isEn ? 'Parents should see what students actually submit.' : '家长应该看得见学生到底交什么。'}
          </h1>
          <p style={{ margin: '0 0 26px', maxWidth: 760, color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 1.75 }}>
            {isEn
              ? 'This preview shows concrete assessment evidence from GIIS proof-point courses: one reviewable assignment sample, quiz sample, midterm sample, final sample, and rubric focus per course.'
              : '这一页展示 GIIS 代表课程中的具体评量证据：每门课包含一个可审阅作业示例、测验示例、期中示例、期末示例与评分重点。'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/apply" style={{ background: '#d5a836', color: '#10182a', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 850, textDecoration: 'none' }}>
              {isEn ? 'Request path review' : '申请路径评估'}
            </Link>
            <Link to="/parent/demo" style={{ border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
              {isEn ? 'Preview parent dashboard' : '预览家长面板'}
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', fontFamily: 'Inter, sans-serif', padding: '54px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 6%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: isEn ? 'Proof-point courses' : '代表课程', value: summary.total || courses.length },
              { label: isEn ? 'Passed evidence gate' : '证据 gate 通过', value: summary.pass || courses.length },
              { label: isEn ? 'Transcript formula' : '成绩单公式', value: '40/30/30' },
              { label: isEn ? 'Feedback standard' : '反馈标准', value: 'S/C/N' },
            ].map((item) => (
              <div key={item.label} style={{ border: '1px solid #e0e6f0', borderRadius: 8, background: '#f8f9fd', padding: '16px 18px' }}>
                <p style={{ margin: '0 0 4px', color: '#2b3d6d', fontSize: 24, fontWeight: 850 }}>{item.value}</p>
                <p style={{ margin: 0, color: '#667085', fontSize: 12, lineHeight: 1.45 }}>{item.label}</p>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #e2e7f0', borderLeft: '5px solid #2b3d6d', borderRadius: 8, padding: '18px 20px', background: '#f8faff', marginBottom: 30 }}>
            <h2 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 24, fontWeight: 850 }}>
              {isEn ? 'How GIIS records learning' : 'GIIS 如何记录学习'}
            </h2>
            <p style={{ margin: 0, color: '#4f5868', fontSize: 14, lineHeight: 1.7 }}>
              {isEn
                ? 'Transcript grades use module quizzes 40%, midterm 30%, and final exam 30%. Assignments are reviewed separately as required learning evidence before the final exam unlocks. Teacher feedback should name one strength, one correction, and one next action.'
                : '成绩单成绩由章节测验 40%、期中 30%、期末 30% 构成。作业作为必要学习证据单独审阅，并在期末考试解锁前完成。教师反馈应指出一个优点、一个需要修正处，以及一个下一步行动。'}
            </p>
          </div>

          {courses.length === 0 ? (
            <div style={{ border: '1px solid #ead7a7', borderRadius: 8, background: '#fffbef', padding: '18px 20px', color: '#8a6a14', fontSize: 14 }}>
              {isEn ? 'Assessment proof data is not available yet.' : '评量证据资料暂时不可用。'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              {courses.map((course) => <CourseProofCard key={course.slug} course={course} isEn={isEn} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
