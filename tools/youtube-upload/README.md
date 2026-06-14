# tools/youtube-upload — gated upload quickstart

Upload a reviewed, human-approved lesson MP4 to the GIIS YouTube channel.

```bash
npm run yt:upload -- --gate-ready --dry-run
npm run yt:upload -- --gate-ready --max 1
```

**First time using this?** Read `setup.md` — there's a one-time Google Cloud setup (~15 min).

Rendered MP4 files are not enough. Lesson upload requires both:

1. `lesson_release_gate.py` classifies the lesson as ready.
2. A human adds the lesson to `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`.

Manual `upload_lesson.py` calls are still available for the queue runner, but normal operators should not bypass the approval file.

## What's in here

| File | Purpose |
|---|---|
| `setup.md` | One-time setup walkthrough: YouTube channel + Google Cloud + OAuth |
| `SKILL.md` | What Claude reads to know when/how to use this tool |
| `yt_queue.py` | Gated upload queue. Use `upload --gate-ready` so only human-approved lessons upload. |
| `upload_lesson.py` | Low-level whole-lesson uploader used by `yt_queue.py`. It also refuses unapproved lessons unless an emergency override is explicitly used. |
| `upload_video.py` | Low-level: upload any MP4 with explicit title/description flags. Used by `upload_lesson.py` under the hood. |
| `playlist.py` | Manage playlists — list / show / create / add / remove / reorder / delete. |
| `client_secret.json` | Your Google OAuth credentials. **Never commit.** Already in `.gitignore`. |
| `token.json` | Saved auth token after first interactive login. **Never commit.** |

## Common commands

### Uploading

```bash
# Read-only queue status
npm run yt:status

# Show what human-approved lessons would upload
npm run yt:upload -- --gate-ready --dry-run

# Upload at most one approved lesson
npm run yt:upload -- --gate-ready --max 1 --privacy unlisted
```

Do not use `upload_lesson.py --force-without-approval` except for an explicit emergency rollback/recovery decision by Alan / Central Umi.

### Playlist management

```bash
# List all playlists on the channel
bash tools/giis_python.sh tools/youtube-upload/playlist.py list

# List the videos in one playlist (by name OR ID)
bash tools/giis_python.sh tools/youtube-upload/playlist.py show "Algebra I"

# Create a playlist explicitly (uploads auto-create too)
bash tools/giis_python.sh tools/youtube-upload/playlist.py create "Algebra I — Full Course" \
    --description "Lecture videos for the 14-module Algebra I curriculum." \
    --privacy public

# Add specific videos by ID
bash tools/giis_python.sh tools/youtube-upload/playlist.py add "Algebra I" O7VGTGNhBGA dQw4w9WgXcQ

# Reorder a playlist alphabetically by video title
bash tools/giis_python.sh tools/youtube-upload/playlist.py reorder "Algebra I"

# Delete a playlist (asks for confirmation)
bash tools/giis_python.sh tools/youtube-upload/playlist.py delete "Test Playlist"
```

## Quota

YouTube Data API gives 10,000 units/day free. Each lesson upload ≈ 2,050 units → ~4-5 lessons/day. For batch days, request a quota increase in Google Cloud Console.

## Privacy strategy (recommended)

1. Upload everything as `unlisted` first.
2. Watch the YouTube version once to verify chapters, captions, and thumbnail render correctly.
3. Flip the privacy to `public` in YouTube Studio when you're confident.
