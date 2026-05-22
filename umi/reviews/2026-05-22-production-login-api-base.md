# Review: Production Login API-Base Hardening

## Verdict

- Ship after normal git/deploy confirmation.

## Findings

- Major fixed: production frontend had no code-level fallback when `REACT_APP_API_URL` was absent, so login could silently call the frontend domain instead of the API domain.
- Minor fixed: student/admin and parent login now detect non-JSON responses, which catches Netlify HTML responses and reports a clearer portal/API issue.

## GIIS Lens

- Trust: login no longer fails in a way that looks like student/admin/parent account unreliability.
- Transparency: user-facing error distinguishes infrastructure response problems from bad credentials.
- Results: students and parents can only see progress if login reaches the real API.
- Operations: gives Alan a safer fallback even when Netlify env is misconfigured.

## Verification

- `npm run build` passed.
- Build emitted existing Browserslist outdated warnings only.

## Roadmap Status

- Updated in `ROADMAP.md` as Slot C33.

## Remaining Risk

- Live site still needs deploy/env verification. The fix is in code, but production will not change until the new bundle is served.
