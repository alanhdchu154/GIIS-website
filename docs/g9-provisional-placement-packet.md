# GIIS Grade 9 Readiness Screen - Operating Packet

## Purpose

This is a short admissions screen for students whose prior records are missing,
incomplete, or difficult to compare. It answers one practical question: does the
student show enough core English, mathematics, science reasoning, and independent
work readiness to begin a conditional Grade 9 plan?

It does not automatically admit a student, award transfer credit, set a final
grade level, create a transcript entry, or replace the Principal's written
decision.

## Family materials

- Generator: `tools/placement/generate_g9_readiness_assessment.py`
- Student PDF: `public/admissions-materials/giis-grade-9-readiness-assessment.pdf`
- Unlisted route: `/placement/g9-readiness`
- Intended production URL:
  `https://genesisideas.school/placement/g9-readiness`

The route is absent from navigation and the sitemap and receives `noindex`. The
PDF also receives an `X-Robots-Tag` noindex header. This is **unlisted, not
access-controlled**: anyone with the URL may open it. Never put student data,
answers, reviewer notes, or case decisions on the route.

The current staff key is local-only outside the public GitHub repository:

`/Users/alanhdchu/.codex/private/giis/placement/g9-readiness-assessment-staff-key.md`

## Short blueprint

| Section | Time | Points | Focus |
| --- | ---: | ---: | --- |
| English | 35 min | 30 | One substantive passage, evidence/data use, 150-220 word argument |
| Mathematics | 35 min | 36 | Number sense, percent/proportion, radical estimate, equation, slope, function, geometry, applied equations, error reasoning |
| Science reasoning | 20 min | 24 | Data interpretation, fair comparison, evidence, criteria and tradeoffs |
| Independent learning check | untimed | not scored | Directions, sustained work, file handling, help-seeking, schedule habits |

Total academic time is approximately **90 minutes**. The family may use one
sitting or two shorter sessions. History is not an admission gate in this short
screen; World History readiness is checked through the first assigned work if
the student begins conditionally.

## Family workflow

1. Admissions sends the unlisted URL.
2. The family downloads and prints the booklet at 100% scale.
3. The student writes answers by hand and follows the tool rules.
4. The family scans the complete booklet or takes clear, flat photographs.
5. The family includes two recent independent work samples and Khan Academy/IXL
   evidence if available.
6. The family emails everything to `admissions@genesisideas.school` with subject
   `Grade 9 Readiness Assessment - [Student Full Name]`.
7. Admissions records receipt, assigns a reviewer, and stores the submission in
   the approved private case location. Never commit family submissions to git.
8. The reviewer scores by strand and conducts a short oral walkthrough when the
   result is close, inconsistent, or may include outside help.
9. The Principal gives a written result: Ready, Ready with Bridge, Not Yet, or
   Pending Clarification when evidence is incomplete.

## Administration rules

- English: no dictionary, translator, AI, or internet.
- Math Questions 1-6: no calculator.
- Math Questions 7-12 and Science: basic calculator allowed.
- A parent may explain procedural directions but may not translate the passage,
  suggest methods, check answers, or edit work.
- The student writes by hand and shows work. Extra paper must have the student
  name and question number.
- Record interruptions, accommodations, translation, and any assistance.
- If English access may hide math/science knowledge, use an oral walkthrough or
  alternate evidence and record the support. Do not silently lower standards.

## Decision framework

Do not use one total percentage as an automatic Grade 9 cut score. Use the
local-only staff scoring guide, supporting work, learning history, and oral
walkthrough when needed.

### Ready for a conditional Grade 9 start

- English reading and writing both show usable Grade 9 entry evidence.
- Core mathematics evidence supports beginning Algebra I.
- Science responses show the student can interpret data and explain evidence.
- The work appears independent and supporting evidence is consistent.

### Ready with a named bridge

- The student can begin Grade 9, but one or two specific skills need concurrent
  remediation.
- Record the skill, responsible reviewer, weekly check, and 4-6 week recheck.

### Not Yet

- Multiple essential English/math strands remain below readiness;
- the student cannot explain selected submitted work;
- or evidence supports substantial foundational gaps.

### Pending Clarification

- Age, identity, learning history, assistance, or required evidence needs
  clarification before an academic result can be issued.
- This is an administrative/evidence state, not a finding that the student lacks
  Grade 9 readiness.

No score creates prior credit, GPA, graduation timing, or a transcript row.

## Conditional first-week evidence

If approved, begin with a small sample from Algebra I, English I, Biology, and
World History. A human reviewer checks the first submitted work before expanding
the schedule. The first World History task supplies the history/source-reading
evidence intentionally omitted from this short admission screen.

## Regeneration and verification

```bash
/Users/alanhdchu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  tools/placement/generate_g9_readiness_assessment.py

pdfinfo public/admissions-materials/giis-grade-9-readiness-assessment.pdf
pdftotext public/admissions-materials/giis-grade-9-readiness-assessment.pdf -
```

Render every page and inspect answer space, tables, page breaks, footers, and
page numbers. Then run route tests, public-trust audit, and a production build.
