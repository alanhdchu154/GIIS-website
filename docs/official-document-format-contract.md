# Official Document Format Contract

Last locked: 2026-05-21

This contract protects GIIS official transcripts and diplomas. These files are part of the school's trust surface, not ordinary UI decoration. Do not restyle them unless Alan explicitly asks for an official document format change.

## Scope

Protected surfaces:

- Admin/student transcript PDF export: `src/components/pages/Transcript/transcriptPdf.js`
- Admin diploma PDF/export view: `src/components/pages/Diploma/DiplomaPage.js`
- Graduation email attachment generator: `server/scripts/send-graduation-document-packages.js`
- Official seal asset: `src/img/transcript_seal_transparent.png`

## Transcript Contract

The current official transcript format is the Alan-approved 5/10 lineage with the 2026-05-20/21 cleanup:

- A4 portrait, one-page target.
- Top header uses the school crest on the left, centered school name, and a right-side blue `OFFICIAL TRANSCRIPT` badge.
- Colors are locked:
  - Navy: `#2b3d6d`
  - Header blue: `#dce6f1`
  - Alternate row blue: `#f5f8fc`
- `Transcript Date` and certifying signature date use the export/send date, not an old saved profile `transcriptDate`.
- Semester tables are two-column and compact. Do not split senior transcripts across multiple pages unless Alan explicitly approves.
- The seal must use `src/img/transcript_seal_transparent.png`, not the old white-background `transcript_seal.jpg`.
- Admin/student frontend export and the server email package generator must stay visually aligned.

## Diploma Contract

The current official diploma format is the Admin/download formal certificate style:

- Letter landscape.
- Navy/gold ornate frame with corner ornaments, left school seal, bottom signatures, QR verification, and centered `High School Diploma`.
- The central student name must be rendered without any visible background/highlight box.
- The central student name is intentionally rendered as inline SVG text to avoid Chromium PDF artifacts with script fonts.
- The bottom official seal must use the transparent seal asset and must not sit inside a visible square or pale image background.

## Required Guard

Run this before changing or sending official documents:

```bash
npm run audit:official-docs
```

For graduation email attachments, also run:

```bash
npm run audit:seniors
node scripts/send-graduation-document-packages.js
```

Only use `--send` after Alan explicitly confirms the email send.

## Change Policy

Allowed without changing this contract:

- Data changes: student name, grades, credits, dates, addresses, verification code.
- Bug fixes that preserve the visual format.
- Accessibility or print reliability fixes that do not alter the visible format.

Requires Alan approval and a contract update:

- Colors, fonts, seal placement, badge style, page size, page count, diploma border, student-name rendering approach.
- Switching seal assets.
- Changing transcript date behavior.
- Creating another transcript/diploma generator.

If the format must change, update this file first, update `npm run audit:official-docs`, regenerate preview PDFs, and record the change in `ROADMAP.md`.
