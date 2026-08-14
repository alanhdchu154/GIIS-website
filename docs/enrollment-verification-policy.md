# GIIS Enrollment Verification Policy

Last reviewed: 2026-08-12

## Purpose

GIIS may issue a signed Enrollment Verification certificate to confirm that a
student is currently enrolled on the document issue date. It is an enrollment
record, not a transcript, attendance report, identity document, age
certificate, work permit, or graduation decision.

## Issuance Gate

The portal fails closed unless every item below is verified from the current
school record:

- the requester is the authenticated student or an authenticated administrator;
- legal student name and school-issued Student ID are present;
- the student account is active and not restricted;
- the official entry date is present and has arrived;
- no withdrawal or graduation date has taken effect;
- manual paid-through coverage is current, or a linked active/trialing Stripe
  subscription has a known current-period end date that has not lapsed.

Self-registration, an application, an account alone, or an unlinked payment is
not proof of active enrollment.

## Certificate Content

The one-page Letter-size PDF may contain:

- legal student name;
- GIIS Student ID;
- current grade when it can be computed defensibly;
- official entry date;
- current enrollment status and online instructional mode;
- issue date, valid-through date, document ID, school contact information,
  principal name/title, and verification QR code.

The certificate must not contain birth date, address, parent contact, payment
details, GPA, grades, earned credits, or private admissions notes.

## Validity And Verification

- Validity ends at the earlier of 90 calendar days after issuance or the end of
  current verified payment coverage.
- The QR token contains no student name, Student ID, birth date, address, or
  payment data. It contains document-routing fields, the printed grade/entry
  date, and a signed identity-record hash so the public result can be compared
  against every substantive field printed on the certificate.
- The public verifier rechecks current enrollment. It returns `valid`,
  `expired`, or `no-longer-current` without exposing the internal reason for a
  restriction or status change.
- Each issuance writes an immutable `AuditLog` action containing the document
  ID. Previewing does not issue a document and does not write an audit event.

## Claim Boundary

Use only `Florida-registered private school` and `Florida Statute 1002.42`.
Never describe the certificate as proof of accreditation, government approval,
identity, age, employment eligibility, attendance, good standing, earned
credit, or graduation eligibility.

## Operator Procedure

1. Open the student record and resolve every eligibility warning.
2. Review the preview, including legal name, Student ID, grade, and entry date.
3. Choose English or English plus Simplified Chinese.
4. Select **Issue official certificate** once.
5. Download the PDF and scan its QR code before providing it externally.
6. If a family needs attendance, grades, age, employment, or graduation proof,
   use the appropriate separate record instead of editing this certificate.

Individual-document revocation is not part of the first release. A signed
certificate automatically becomes non-current when the student record is no
longer eligible, and it expires no later than its printed valid-through date.
