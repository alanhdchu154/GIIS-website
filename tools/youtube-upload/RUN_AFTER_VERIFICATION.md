# Run-list — after YouTube channel phone verification

> Hand-rolled commands you can copy-paste. Order matters: do them top-to-bottom.

---

## 0. Pre-flight check

```bash
cd /Users/alanhdchu/giis-website

# Confirm verification was actually accepted
# Open https://www.youtube.com/account_advanced — should now say
# "Eligible for monetization" or at minimum "Account verified"
```

If your YouTube channel still shows unverified, the rest of this fails the same way as before. Don't continue until verification confirms.

---

## 1. Refresh OAuth token (need new scope for captions)

I bumped the scope list in `upload_video.py` to include `youtube.force-ssl`,
which the captions API requires. Your existing `token.json` was issued under
the older scope, so it has to be re-issued.

```bash
rm tools/youtube-upload/token.json
```

(The next upload will re-open the browser once for you to re-consent.
After that the new token covers everything.)

---

## 2. Recover Module 4 (the one already on YouTube without thumbnail/captions)

Module 4's video was uploaded successfully (`O7VGTGNhBGA`), but its first run
hit two soft failures: thumbnail (channel wasn't verified) and captions
(scope was too narrow). Now both are fixed; we just need to push the missing
pieces and add it to the playlist.

```bash
# Add Module 4 to the "Algebra I" playlist (creates the playlist on first call)
python3 tools/youtube-upload/playlist.py add "Algebra I" O7VGTGNhBGA

# Push the captions retroactively
python3 -c "
import sys
sys.path.insert(0, 'tools/youtube-upload')
from upload_video import upload_captions
from pathlib import Path
upload_captions('O7VGTGNhBGA',
                Path('teaching-videos/algebra-i-module-4-sample/subtitles.srt'))
"

# Push the thumbnail retroactively
python3 -c "
import sys
sys.path.insert(0, 'tools/youtube-upload')
from upload_video import upload_thumbnail
from pathlib import Path
upload_thumbnail('O7VGTGNhBGA',
                 Path('teaching-videos/algebra-i-module-4-sample/slides/01_title.png'))
"
```

(The first python invocation re-runs OAuth one time — that's the moment
you re-consent with the new scope. After that the second one is silent.)

---

## 3. Upload Module 9 (Slope) and English I Module 1

These get the full pipeline first try — captions, thumbnail, auto-add to
their respective playlists ("Algebra I" and "English I").

```bash
python3 tools/youtube-upload/upload_lesson.py teaching-videos/algebra-i-module-9-slope/
python3 tools/youtube-upload/upload_lesson.py teaching-videos/english-i-module-1-reading/
```

Each takes ~1 minute. The script prints `URL=https://youtu.be/...` at the end of each.

After both are done, the channel should have:
- **Algebra I** playlist  →  Module 4 + Module 9
- **English I** playlist  →  Module 1 (Reading Comprehension)

Verify:

```bash
python3 tools/youtube-upload/playlist.py list
python3 tools/youtube-upload/playlist.py show "Algebra I"
python3 tools/youtube-upload/playlist.py show "English I"
```

---

## 4. Upload the 80-second school intro

This one is marketing, not a lesson — so it uses `upload_video.py` directly
with hard-coded metadata, and goes up as **public** (the rest are unlisted).

```bash
python3 tools/youtube-upload/upload_video.py \
    public/demo/giis-demo.mp4 \
    --title "Welcome to Genesis of Ideas International — a Florida-registered US high school" \
    --description-file tools/youtube-upload/_descriptions/school-intro.txt \
    --tags "GIIS,Genesis of Ideas International,online high school,Florida high school,US diploma,private school,Khan Academy,homeschool,distance learning,AP,SAT" \
    --privacy public \
    --thumbnail public/demo/giis-demo-poster.jpg
```

After upload the URL printed (`https://youtu.be/...`) is your **public-facing
school intro** — paste it into the website hero, send to prospective parents,
share on social, etc.

Optional — pin it as the channel trailer:
1. https://studio.youtube.com  →  Customization  →  Layout
2. Featured video for non-subscribers → paste the URL.

---

## 5. After all four uploads — final check

```bash
python3 tools/youtube-upload/playlist.py list
```

Expected output:
```
PLxxxxxxxxx  [  public]   2 videos   Algebra I
PLxxxxxxxxx  [  public]   1 videos   English I
```

(The school intro doesn't go in any playlist by default — that's correct, it lives as the channel trailer.)

If anything looks off, paste the terminal output and I'll diagnose.

---

## Quota budget for this whole sequence

| Action | Units |
|---|---|
| Module 4 add-to-playlist + thumbnail + captions | ~500 |
| Module 9 full upload | 2,050 |
| English I Module 1 full upload | 2,050 |
| School intro full upload | 2,050 |
| **Total** | **~6,650** |

You've already used ~3,500 today (failed first attempt + Module 4 success
+ scope refresh). 10,000 daily limit means after this sequence you'll have
roughly **−150 units** — basically scraping the limit. If anything fails
late and tries to retry, you may hit `quotaExceeded`. If that happens:
**wait until midnight Pacific Time** (today's quota resets) and retry
just the failed step. It'll work.

For batching the remaining 11 Algebra I modules later, do it across 3
calendar days OR request a quota increase first.
