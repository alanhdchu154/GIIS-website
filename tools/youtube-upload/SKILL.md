# YouTube upload skill

> Upload a finished, human-approved lesson MP4 to the GIIS YouTube channel via the YouTube Data API v3. Auto-builds title / description / chapters / captions / thumbnail from the lesson folder.

## When to use

Trigger on:
- "upload to YouTube", "upload the lesson to YouTube", "publish the video"
- "send Module 4 to YouTube"
- After Claude finishes building+merging a lesson, the release gate passes, and Alan explicitly wants it published

## Prerequisite (one-time)

Before this skill works, the user must complete `setup.md` in this folder:
1. Create the GIIS YouTube channel (Brand Account)
2. Create a Google Cloud project + enable YouTube Data API v3
3. Configure OAuth consent screen + add user as a test user
4. Download `client_secret.json` to this folder
5. Run any upload once interactively to seed `token.json`

If `client_secret.json` is missing, the script tells the user to run setup first.

## How to invoke

For a single lesson:
```bash
npm run audit:lesson-video-inventory
python3 tools/lesson-video/lesson_release_gate.py --pending --check
npm run yt:upload -- --gate-ready --dry-run
```

Actual upload should use `--gate-ready` after the lesson appears in:

```text
teaching-videos/_audit/release-gate/approved_ready_to_upload.json
```

Direct `upload_lesson.py` calls also refuse unapproved lessons by default. The
`--force-without-approval` flag is an emergency-only override and should not be
used for normal production lessons.

The uploader:
1. Reads `script.json` for course + module name → builds the title.
2. Builds a description with: course summary, "this is overview" disclaimer, learning-path reminder, school links, and **per-section chapter timestamps** (computed from audio durations).
3. Picks `<folder>/<folder-with-underscores>.mp4` as the video.
4. Attaches `subtitles.srt` as English captions.
5. Sets `slides/01_title.png` as the thumbnail.
6. Defaults privacy to `unlisted` (link-only). Keep lessons unlisted unless Alan explicitly approves public discovery.

## Privacy defaults

- `unlisted` (default) — anyone with the link can watch; doesn't appear in search or your channel page. Good for sharing previews.
- `private` — only invited Google accounts can watch.
- `public` — searchable + appears on the channel.

When publishing for real, upload as `unlisted`, watch the video on YouTube to confirm rendering / chapters / captions, then decide separately whether anything should become public.

## Quota awareness

Each `upload_lesson.py` run consumes:
- 1,600 units (video upload)
- 50 units (thumbnail)
- 400 units (captions)
- = ~2,050 units total

Default daily quota = 10,000 units → ~4 lessons/day max. For batch operations of 5+ lessons in one day, the user must request a quota increase via Google Cloud Console (`Quotas` → `Edit Quota`).

## Failure modes

- `quotaExceeded` → wait until midnight Pacific OR request quota increase.
- Missing `client_secret.json` → user must complete `setup.md`.
- Token expired → script auto-refreshes silently. If refresh token is also dead (rare), user re-runs the OAuth flow once.
- "redirect_uri_mismatch" → wrong OAuth client type. Re-create as `Desktop app` per setup.md.

## Auto-playlist behaviour

`upload_lesson.py` adds each uploaded video to a playlist named after the
lesson's `course` field in `script.json` ("Algebra I", "English I", etc.),
creating the playlist on first use. So all Algebra I module videos
automatically end up in the "Algebra I" playlist on the channel.

Override with `--playlist "Custom Name"` or skip with `--no-playlist`.

## Playlist management (separately)

`playlist.py` handles everything else: list, show, create, add, remove,
reorder, delete. See SKILL trigger phrases below.

Trigger `playlist.py` on:
- "create a playlist for X"
- "add this video to the playlist"
- "reorder the playlist"
- "show what's in the Algebra I playlist"
- "list my playlists"

## Source-of-truth model

**Course JSON is the lesson-planning source of truth. YouTube is only the live-video state.**

`server/prisma/courses/**/*.json` controls course/module titles and sequencing.
`sync_channel.py` queries the channel via API, parses every video title, and
reconciles into:
  • `public/data/lessons-manifest.json` — what Learn Portal reads
  • each lesson's `script.json` `youtube` block — local hint, kept in sync

This handles every drift case: re-uploads creating duplicates, manual deletes
in YouTube Studio, manual uploads, failed uploads where local state never
got updated. Run `sync_channel.py --apply` any time to re-converge.

`upload_lesson.py` calls `sync_channel.py --apply` automatically at the end
of every upload, but upload itself should remain gated by the human approval
file during the quality reset.

For a scheduled cleanup (e.g. nightly), add to `crontab -e`:
```
# 02:00 daily — reconcile YouTube channel state
0 2 * * * cd /Users/alanhdchu/giis-website && /usr/bin/python3 tools/youtube-upload/sync_channel.py --apply >> /tmp/giis-yt-sync.log 2>&1
```

## Trigger phrases

Trigger `sync_channel.py` on:
- "sync the channel", "reconcile YouTube"
- "are there duplicates on the channel?"
- "rebuild the lessons manifest"
- "what videos are on the channel?"

Trigger `playlist.py` on:
- "create a playlist for X" / "add this video to the playlist"
- "reorder the playlist" / "list my playlists"
- "what's in the Algebra I playlist"

## Files

- `upload_video.py` — low-level uploader, takes any .mp4 + metadata flags
- `upload_lesson.py` — high-level wrapper; auto-syncs after every upload
- `sync_channel.py` — pulls channel state, dedupes by title, writes manifest, reconciles script.json
- `build_manifest.py` — legacy: builds manifest from local script.json only (offline fallback if no API access)
- `playlist.py` — playlist CRUD + add/remove/reorder
- `client_secret.json` — Google OAuth credential (gitignored)
- `token.json` — saved auth token (gitignored)
- `setup.md` — full one-time setup walkthrough for the user
