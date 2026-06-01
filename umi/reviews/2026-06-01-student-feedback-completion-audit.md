# Student Feedback Completion Audit

Source reviewed: Google Doc `1I482O8jlvwzUg2erUCYPWMYOayZeb1TzXEYHB_t9fAA`.

Date: 2026-06-01

## Result

All issues from the student feedback doc have been digested and addressed in the
current local worktree. The only intentional product boundary is that external
reading/video links are not automatically counted as proof of learning unless
the portal has an actual activity signal.

## Student View

- Module switching stability: fixed in `src/components/pages/Learn/ModulePage.js`.
  Route changes reset quiz, assignment, progress, loading, and error state; old
  responses are ignored through abort/request guards; the loading state names
  the target module and says quiz, assignment, and resources are refreshing
  together.
- Paid or blocked English I resources: fixed for the reported course. English I
  no longer has CommonLit-only or "Removed after audit" placeholders in required
  module resources. Public-domain Project Gutenberg readings were added for
  short story, drama, and character/theme modules.
- Student Home recommendations: fixed in `src/components/pages/Learn/LearnDashboard.js`.
  Primary recommendations stay at the student's grade/open level instead of
  pushing English II as the main next course for a Grade 9 English I student.
- Module learning motivation: fixed in `ModulePage.js` with a short "Why it
  matters" line below learning objectives.
- Manual mark-complete buttons: removed from the student resource cards. The UI
  no longer lets students create new fake read/watched/done signals for
  external links.
- Quiz correction guidance: fixed in `ModulePage.js`; failed quiz attempts now
  prompt students to review the module objectives/resources and restate missed
  ideas before the next quiz or exam.

## Parent View

- Pacing and urgency: fixed in `server/src/routes/parent-data.js` and
  `src/components/pages/Parent/ParentDashboard.js`. Parent enrollments now
  include pacing status, expected modules, and module delta; the dashboard shows
  On Track / Behind / Ahead chips and turns behind progress bars orange.
- Upcoming timeline contradiction: fixed in
  `src/components/pages/Parent/ParentDashboardDemo.js`. Completed AP Calculus
  is no longer shown as an upcoming event.
- Date card format: fixed in the demo upcoming cards with concise `MAY` / `JUN`
  labels.
- "Is my child learning?" evidence: fixed with Weekly Insights on both
  `/parent/dashboard` and `/parent/demo`. Live dashboards show active days,
  estimated study hours, completed modules, video activity signals, quiz
  attempts, and assignment submissions. The demo shows sample study time and
  video minutes while clearly labeling the data as sample preview data.
- Demo-data clarity: fixed in `/parent/demo`; the banner now states this is demo
  data only and that live parent dashboards use the linked student's actual
  enrollments, activity, and teacher feedback.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('server/prisma/courses/english/english-i.json','utf8')); console.log('english-i json ok')"`
- `node --check server/src/routes/parent-data.js`
- `rg -n "Removed after|CommonLit|commonlit|Mark read|Mark watched|Mark done" server/prisma/courses/english/english-i.json src/components/pages/Learn/ModulePage.js src/components/pages/Parent/ParentDashboard.js src/components/pages/Parent/ParentDashboardDemo.js`
- `npm test -- --watchAll=false src/components/pages/Learn/ModulePage.test.js`
- `npm run audit:pathways`
- `npm run build`
- `node tools/course-audit/audit_external_resources.js`
- Browser smoke:
  - `/learn/english-i/module/1` to `/learn/english-i/module/3`: old quiz and
    old assignment do not reappear after delayed old responses.
  - `/parent/demo`: sample preview banner, Weekly Insights, `MAY` / `JUN`
    upcoming cards, no old AP Calculus upcoming contradiction.
  - `/parent/dashboard` with mocked API: Weekly Insights, behind pacing chip,
    and orange behind progress state render.
