# G9 Catalog + Learn Alignment Pass

Date: 2026-05-26
Owner: Central Umi / giis-producer

## What Changed

- Active repo path is `/Users/alanhdchu/giis-website`.
- Learn Portal source of truth remains `server/prisma/courses/**/*.json`.
- Grade 9 audit warnings were addressed for:
  - `algebra-i`
  - `biology`
  - `english-i-writing-focus`
  - `intro-communication`
  - `world-history`
- Public catalog now reflects Grade 9 `Digital Literacy` and `Introduction to Communication` as real G9 foundation courses instead of treating communication only as a later elective.
- AP-adjacent public pathway/catalog language was softened toward exam preparation while AP Course Audit / school-code status remains pending.

## Repeatable Checklist For G10-G12

1. Run `npm run audit:pathways`.
2. List courses by grade from `server/prisma/courses/**/*.json`.
3. Fix fail/warn items in course JSON before improving marketing copy.
4. Reconcile public catalog rows against real course names, credits, departments, and grade levels.
5. Review pathway pages for AP wording, impossible courses, and stale static course names.
6. Run `npm run audit:pathways` again and record pass/warn/fail movement.

## AP Wording Rule

Until AP Course Audit and school-code status are confirmed, public pages should use cautious phrases such as:

- `AP exam preparation`
- `College Board-aligned resources`
- `final transcript wording follows approved school policy`

Avoid implying:

- approved AP course authorization
- finalized AP transcript label
- finalized CEEB code

## Video Pipeline Rule

The lesson video pipeline remains paused. Do not re-enable generation, build, upload, or auto-push until the missing AP CS A / AP Psychology references and post-hoc review cascade are complete.
