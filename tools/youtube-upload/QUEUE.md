# YouTube upload queue

> **Current rule**: lesson upload stays paused until the quality reset is complete.
> A rendered MP4 is not upload-ready. Upload now requires release-gate review
> plus an explicit human approval file.

---

## What this is

A queue manager that scans every folder under `teaching-videos/` and classifies each lesson as one of:

| Status | Meaning |
|---|---|
| ✓ uploaded | `script.json` already has `youtube.video_id` — done |
| ● pending  | rendered MP4 exists in the folder, but no YouTube id yet — **next in line** |
| ○ no MP4   | `script.json` exists but no MP4 was rendered. Run `make_lesson.py` to build it. |
| ✗ broken   | `script.json` won't parse |

Two commands:

| Command | What it does | Safe to call repeatedly? |
|---|---|---|
| `npm run yt:status` | Print the queue — what's done, what's next, what's stuck | ✅ read-only |
| `npm run yt:upload` | Upload up to 4 pending lessons (stays under YouTube API quota) | ⚠️ uses quota; do not run while paused |

---

## Daily flow

### Option A — scheduled upload

This is disabled during the quality reset. After Alan explicitly approves a
restart, the Mac can automatically:

1. **09:00 every day** — wake up
2. Print queue status to log
3. Upload up to 4 pending lessons that appear in
   `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`
4. Update each lesson's `script.json` with the new YouTube video id
5. Refresh the manifest the Learn Portal reads

Do not treat the schedule as "set and forget" until the approval gate has been
stable for at least two weeks.

### Option B — manual

Mornings:

```bash
npm run yt:status            # see what's pending
npm run audit:lesson-video-inventory
python3 tools/lesson-video/lesson_release_gate.py --pending --check
npm run yt:upload -- --gate-ready --dry-run
npm run yt:upload -- --gate-ready # only after Alan approves the approval file
npm run yt:upload -- --max 2 # upload only 2 (save quota for the day)
npm run yt:upload -- --dry-run     # just show what would happen
```

You can also set the privacy:

```bash
npm run yt:upload -- --privacy public
```

(Defaults to `unlisted` — what we use for lesson modules. The 80-second school-intro walkthrough uploads as `public` separately — see `RUN_AFTER_VERIFICATION.md`.)

---

## One-time install (the daily schedule)

```bash
# 1. Edit the plist if your repo lives anywhere other than /Users/alanhdchu/giis-website
#    (search for that path in the file)
nano tools/youtube-upload/com.giis.youtube-daily.plist

# 2. Copy the plist into the LaunchAgents folder
cp tools/youtube-upload/com.giis.youtube-daily.plist ~/Library/LaunchAgents/

# 3. Load it
launchctl load ~/Library/LaunchAgents/com.giis.youtube-daily.plist

# 4. Verify
launchctl list | grep giis            # should print one line

# 5. (Optional) Test it now without waiting for 9am
launchctl kickstart -k gui/$(id -u)/com.giis.youtube-daily

# 6. Watch the log
tail -f ~/Library/Logs/giis-youtube-daily.log
```

To stop the daily upload (e.g. you're on vacation and don't want random uploads):

```bash
launchctl unload ~/Library/LaunchAgents/com.giis.youtube-daily.plist
```

To re-enable: re-run the `load` line.

---

## Why 4 uploads per day

YouTube Data API v3 quota = **10,000 units/day per Google account**, resetting at midnight Pacific Time.

| Operation | Cost |
|---|---|
| Upload video | 1,600 units |
| Set thumbnail | 50 units |
| Insert captions | ~400 units |
| Add to playlist | 50 units |
| **Per lesson total** | **~2,100 units** |

`sync_channel.py` runs after the batch and burns another ~50 units. So:

- 4 lessons × 2,100 = 8,400 units
- + sync_channel reconciliation ≈ 50
- **≈ 8,450 units · 1,550 headroom**

That headroom matters because if Alan triggers any manual upload, playlist edit, or `sync_channel.py` separately on the same day, we don't want to hit `quotaExceeded` mid-batch.

If you want to push more per day:
- `npm run yt:upload -- --max 5` — 10,550 units, **likely fails the 5th** (no headroom for retries)
- Request a quota increase from Google Cloud Console (Project: `giis-youtube-uploader`)

---

## What gets uploaded — exact contract

For each lesson the runner picks, all of this must be true first:

1. `lesson_release_gate.py` classifies it as ready.
2. A human adds it to
   `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`.
3. `yt_queue.py upload --gate-ready` is used.

Then the upload runner:

1. Calls `upload_lesson.py <folder>` which:
   - reads `script.json` for title, module, course
   - finds the rendered MP4 (`<folder-name-with-underscores>.mp4` or any single `*.mp4` in the folder)
   - generates description with chapter timestamps from `audio/*.wav` durations
   - calls `upload_video.py` to actually upload
   - attaches `subtitles.srt` as captions
   - sets `slides/01_title.png` as thumbnail
   - adds the video to a playlist matching the `course` field (creates if missing — e.g. "AP Psychology")
2. Writes the `youtube.video_id` block back into `script.json` so the lesson is now classified as uploaded
3. Runs `sync_channel.py --apply` to refresh the manifest the Learn Portal `<LessonVideoEmbed>` component reads

`upload_lesson.py` also checks the same approval file directly. That prevents
manual one-off uploads from bypassing the quality gate.

Example approval file:

```json
{
  "approved_by": "Alan / Central Umi",
  "approved_at": "YYYY-MM-DDTHH:MM:SSZ",
  "policy": "Human-visible ready_to_upload gate; no unattended upload from latest-release-gate.json",
  "approved_ready_to_upload": [
    {
      "slug": "example-lesson-folder",
      "classification": "keep",
      "evidence": "release gate ready + reviewer cascade + contact sheet + learning check"
    }
  ]
}
```

If any step fails (quota, OAuth expired, network), the runner aborts the rest of the day's batch rather than burning more quota on the same error. You'll see the failure in the log and can re-run manually after fixing.

---

## Failure modes & recovery

| Symptom | Likely cause | Fix |
|---|---|---|
| `quotaExceeded` | Already burned today's quota elsewhere | Wait until tomorrow (midnight PT) |
| `invalid_grant` | OAuth token expired (after ~6 mo) | `rm tools/youtube-upload/token.json && npm run yt:upload` — re-opens browser for re-consent |
| `Forbidden` on `captions.insert` | OAuth scope drift | Same as above — delete `token.json`, re-auth |
| Same lesson keeps being picked | Either MP4 missing or `youtube.video_id` didn't write back | `npm run yt:status` — should show why. If `pending` despite an obvious YouTube URL, check `script.json` for the `youtube` block; manually add if missing. |
| Daily runner didn't fire | Mac asleep at 09:00 OR plist points to wrong path | `launchctl list | grep giis` shows `?`/Exit non-zero → check `~/Library/Logs/giis-youtube-daily.err.log` |

---

## Files

```
tools/youtube-upload/
├── yt_queue.py                           ← the queue manager (status + upload)
│                                            (named yt_queue, NOT queue, to avoid
│                                             shadowing Python stdlib `queue`)
├── daily.sh                              ← wrapper called by launchd
├── com.giis.youtube-daily.plist          ← schedule (copy to ~/Library/LaunchAgents/)
├── upload_lesson.py                      ← what yt_queue.py calls per lesson
├── upload_video.py                       ← single-file YouTube upload
├── sync_channel.py                       ← reconcile local state with channel
├── build_manifest.py                     ← aggregate uploaded lessons for Learn Portal
├── playlist.py                           ← per-playlist manipulation
├── client_secret.json                    ← OAuth client (gitignored)
└── token.json                            ← OAuth token (gitignored, auto-refreshes)
```
