# Review: YouTube Upload Pipeline

## Verdict

- Revise before the next unattended upload run.

## Findings

- Major: release gate is advisory only. The pending set is 15 lessons, and all 15 are `needs_revision`, but `daily.sh` still proceeds to upload from `yt_queue.py`.
- Major: local script state and channel-derived manifest disagree. Local queue reports 52 uploaded, while recent channel sync reported 50 canonical lessons plus the non-lesson school intro.
- Major: `public/data/lessons-manifest.json` is missing AP CS A Module 6 even though its local `script.json` has `xQW0hpadLO4`. Likely YouTube API eventual consistency after upload; needs delayed/retry sync.
- Minor: cleanup retries show stale metadata for AP Biology old Module 10 and AP Biology M2/M6 missing youtube fields.
- Minor: auto-push failed once on stale `.git/HEAD.lock`; `daily.sh` only has explicit stale-lock handling for `.git/index.lock`.

## GIIS Lens

- Trust: publishing lessons that the gate says need revision weakens the school-quality signal.
- Transparency: missing manifest entries mean students/parents may not see videos that were actually uploaded.
- Results: AP CS A and AP Psychology pending lessons should not keep flowing to Learn Portal before reviewer/contact-sheet/transcript checks.
- Operations: queue counts are currently misleading because local stale `youtube` blocks inflate uploaded totals.

## Verification

- `npm run yt:status`: 52 uploaded, 15 pending, 3 no MP4.
- `python3 tools/lesson-video/lesson_release_gate.py --pending`: 0 ready, 15 needs_revision, 0 blocked.
- `tail ~/Library/Logs/giis-youtube-daily.log`: 2026-05-21 run uploaded four lessons successfully, then auto-push hit `.git/HEAD.lock`.
- Direct `sync_channel.py` in this shell could not run because this Python environment lacks `google-auth-oauthlib`; daily runner uses Anaconda Python and did run channel sync in the log.

## Roadmap Status

- Recorded as Slot C42.

## Recommended Next Patch

- Make daily upload consume release gate `ready_to_upload` or stop when ready count is 0.
- Add delayed/retry channel sync after each upload batch.
- Teach stale-lock cleanup to handle `.git/HEAD.lock` as well as `.git/index.lock`.
- Add a channel/local reconciliation command that removes stale local youtube blocks or excludes them from `yt_queue.py`.
