# Review: Umi-Led Lesson Pipeline Safety

## Verdict

- Ship as a safety improvement. Next step is the AP CS A Module 7 V2 pilot.

## Findings

- Major fixed: unattended daily upload no longer uploads any rendered pending lesson unless release gate marks it `ready_to_upload`.
- Major fixed: Claude Code's role is now explicitly production mechanics, with Umi owning teaching design and final review.
- Major fixed: AP CS A Module 7 has a concrete handoff, so CC does not need to invent teaching scope from scratch.
- Minor fixed: daily auto-push stale lock cleanup now handles `.git/HEAD.lock` in addition to `.git/index.lock`.

## GIIS Lens

- Trust: prevents unreviewed AP/lesson content from being published as GIIS instruction.
- Transparency: keeps Learn Portal videos aligned with actual review status.
- Results: AP CS A M7 pilot focuses on a real conceptual trap: ArrayList shifting/removal, not vocabulary-only instruction.
- Operations: lets Alan talk to Umi while CC runs bounded production tasks.

## Verification

- `python3 -m py_compile tools/youtube-upload/yt_queue.py tools/lesson-video/lesson_release_gate.py`
- `bash -n tools/youtube-upload/daily.sh`
- `python3 tools/youtube-upload/yt_queue.py upload --max 4 --privacy unlisted --gate-ready --dry-run`

The dry run showed 15 pending lessons filtered to 0 allowed by release gate, with no upload attempted.

## Roadmap Status

- Recorded as Slot C43.

## Remaining Risk

- The upload runner now prevents unsafe unattended upload, but it does not yet automatically retry channel sync after fresh uploads. Manifest drift still needs a separate patch.
