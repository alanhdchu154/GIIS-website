import React from 'react';
import { Link } from 'react-router-dom';

/**
 * IsGiisForYou — honest fit-check section on the homepage.
 *
 * The entry self-paced plan can still trigger a "too cheap to be real" reaction
 * in cautious Chinese parents. This section disarms that suspicion by
 * volunteering who GIIS is NOT for. Saying "not the right fit if…" out loud
 * is one of the highest trust-building moves available; cheaper to add than
 * any other P0 item.
 *
 * Tone notes:
 *   - The ✗ column is grey, not red. We are not warning parents away,
 *     we are helping them self-select.
 *   - The closing line offers a path for the uncertain — email admissions.
 */

const FITS = [
  {
    en: 'Motivated self-learners who can manage their own time',
    zh: '能自主管理时间的学习者',
  },
  {
    en: 'Parents willing to spend 15 min a week reviewing the weekly digest',
    zh: '愿意每周花 15 分钟看进度邮件的家长',
  },
  {
    en: 'Students with reliable internet and a quiet place to study',
    zh: '有稳定网络与安静学习空间的学生',
  },
  {
    en: 'Families targeting US universities — pathway-driven applicants',
    zh: '以美国大学为目标、希望按专业方向选课的家庭',
  },
];

const NOT_FITS = [
  {
    en: "Students who need an in-person classroom for accountability",
    zh: '需要实体课堂监督才能学习的学生',
  },
  {
    en: 'Families looking for boarding, sports teams, or in-school social life',
    zh: '希望获得寄宿、校队、校园社交体验的家庭',
  },
  {
    en: "Students who haven't yet built basic time-management habits",
    zh: '尚未培养基本时间管理习惯的学生',
  },
  {
    en: 'Parents who cannot read English at all (advisor communication is English)',
    zh: '完全无法阅读英文的家长（与顾问沟通以英文为主）',
  },
];

export default function IsGiisForYou({ language }) {
  const isEn = language !== 'zh';

  return (
    <section style={{
      background: '#fff',
      padding: '80px 0',
      fontFamily: 'Inter, sans-serif',
      borderTop: '1px solid #eef0f6',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 6%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <p style={{
            color: '#2b3d6d',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            margin: '0 0 12px',
          }}>
            {isEn ? 'Is GIIS for you?' : '适合你吗？'}
          </p>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontWeight: 800,
            color: '#1a1a2e',
            lineHeight: 1.1,
            margin: '0 0 14px',
            letterSpacing: '-0.01em',
          }}>
            {isEn ? 'An honest fit check' : '诚实地告诉你适不适合'}
          </h2>
          <p style={{
            fontSize: 'clamp(14px, 1.4vw, 16px)',
            color: '#5c6578',
            maxWidth: '620px',
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            {isEn
              ? 'GIIS works extremely well for some families and is genuinely the wrong choice for others. Here\'s how to tell which one you are.'
              : 'GIIS 对某些家庭非常合适，对另一些家庭则确实不是好选择。下面这两栏帮你判断自己属于哪一种。'}
          </p>
        </div>

        {/* Two-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '36px',
        }}>

          {/* ✓ Best fit */}
          <div style={{
            background: '#f4faf6',
            border: '1px solid #d3e8db',
            borderTop: '4px solid #1B6B3A',
            borderRadius: '14px',
            padding: '28px 28px 32px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#1B6B3A',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 800,
              }}>✓</span>
              <p style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                color: '#1B6B3A',
                letterSpacing: '0.3px',
              }}>
                {isEn ? 'Best fit if…' : '适合你的情况'}
              </p>
            </div>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              {FITS.map((f, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#1a3024',
                  lineHeight: 1.6,
                }}>
                  <span style={{
                    color: '#1B6B3A',
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>✓</span>
                  <span>{isEn ? f.en : f.zh}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ✗ Not the right fit */}
          <div style={{
            background: '#f7f8fa',
            border: '1px solid #dfe3ec',
            borderTop: '4px solid #7a8294',
            borderRadius: '14px',
            padding: '28px 28px 32px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#7a8294',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 800,
              }}>✗</span>
              <p style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                color: '#5c6578',
                letterSpacing: '0.3px',
              }}>
                {isEn ? 'Probably not for you if…' : '可能不适合你的情况'}
              </p>
            </div>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              {NOT_FITS.map((f, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#3a4250',
                  lineHeight: 1.6,
                }}>
                  <span style={{
                    color: '#7a8294',
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>✗</span>
                  <span>{isEn ? f.en : f.zh}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Closing line — graceful exit for the uncertain */}
        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#5c6578',
          margin: 0,
          lineHeight: 1.7,
          maxWidth: '620px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {isEn ? (
            <>
              Still not sure?{' '}
              <a
                href="mailto:admissions@genesisideas.school?subject=Fit%20question%20about%20GIIS"
                style={{ color: '#2b3d6d', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Email us at admissions@genesisideas.school
              </a>{' '}
              with your child's situation and we'll tell you straight if GIIS is the right call — including saying no.
            </>
          ) : (
            <>
              还在犹豫？写信到{' '}
              <a
                href="mailto:admissions@genesisideas.school?subject=Fit%20question%20about%20GIIS"
                style={{ color: '#2b3d6d', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                admissions@genesisideas.school
              </a>{' '}
              告诉我们孩子的情况，我们会诚实告诉你 GIIS 是不是合适的选择——包括「不合适」这个答案。
            </>
          )}
        </p>

        {/* Student-facing bridge — let the teenager picture their own week */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            to="/student-life"
            style={{
              display: 'inline-block',
              padding: '12px 26px',
              borderRadius: '8px',
              border: '2px solid #2b3d6d',
              color: '#2b3d6d',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            {isEn ? "See a real student's week →" : '看看学生真实的一周 →'}
          </Link>
        </div>
      </div>
    </section>
  );
}
