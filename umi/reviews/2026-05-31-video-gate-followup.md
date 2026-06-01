# Foundation Video Gate Follow-Up

Generated: 2026-05-31

## Initial gate result

`python3 tools/lesson-video/lesson_release_gate.py --check`

- Evaluated: 10
- Ready: 3
- Needs revision: 7
- Blocked: 0

## Root cause

The needs-revision result was a gate binding bug, not a teaching-content failure.
Reviewer JSON was bound to the pedagogical `script.json` content before YouTube
upload. After upload, `script.json.youtube` was added, changing the raw file hash
even though the lesson content had not changed.

The audit gate now hashes the review script after removing upload metadata, and
informational notes no longer reduce a clean score below 100.

## Current gate result

After the gate fix:

- Evaluated: 10
- Ready: 10
- Needs revision: 0
- Blocked: 0

Dashboard summary after the fix:

- Total lessons: 10
- Passed quality: 10
- Uploaded: 7
- Pending upload: 3

## Remaining operational note

The remaining pending-upload lessons are ready, but upload should still go
through the gated YouTube queue so quota/privacy/manifest sync are controlled.
