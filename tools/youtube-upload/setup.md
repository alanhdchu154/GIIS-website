# YouTube upload — one-time setup (~15 min)

You only do this once. After that, uploading any new lesson is a single command.

---

## 0. What you're going to end up with

```
tools/youtube-upload/
├── client_secret.json   ← Google OAuth credential (you'll download this)
├── token.json           ← saved login token (auto-created on first upload)
├── upload_video.py      ← low-level: upload one MP4 (already in repo)
├── upload_lesson.py     ← high-level: upload a whole lesson folder
├── setup.md             ← THIS FILE
└── SKILL.md             ← what Claude reads to know how to use this
```

After setup, uploading the Module 4 sample becomes:
```bash
bash tools/giis_python.sh tools/youtube-upload/upload_lesson.py teaching-videos/algebra-i-module-4-sample/
```

---

## 1. Create the YouTube channel (one-time)

If you already have a "Genesis of Ideas International" branded YouTube channel, skip to step 2.

1. Sign in to https://youtube.com using `alanhdchu@genesisideas.school`.
2. Top-right avatar → **Switch account** → **All your channels** → **Create a channel**.
3. Pick **Use a business or other name** (= Brand Account, not your personal channel).
4. Channel name: **Genesis of Ideas International**
5. Handle: try `@giis-academy`. If taken: `@genesisofideas`, `@giis-lessons`, etc.
6. Customize → Branding → upload `src/img/logo_nobg.png` as profile picture.
7. Basic info → Description:
   > Genesis of Ideas International — a Florida-registered private high school (F.S. 1002.42). Real classroom lectures from our 24-credit US diploma curriculum. New module videos every week.

(Banner image and trailer can come later.)

---

## 2. Create the Google Cloud project

1. Go to https://console.cloud.google.com (sign in with the same school email).
2. Top bar → **Select a project** → **NEW PROJECT**.
3. Project name: `giis-youtube-uploader` → CREATE.
4. Wait ~30 seconds, then make sure the new project is selected (top bar dropdown).

## 3. Enable the YouTube Data API v3

1. ☰ menu → **APIs & Services** → **Library**.
2. Search `YouTube Data API v3` → click → **ENABLE**.

## 4. Configure the OAuth consent screen

This is the screen the user (you) sees when first authorizing the script.

1. ☰ → **APIs & Services** → **OAuth consent screen**.
2. User Type: **External** → CREATE.
3. **App information**:
   - App name: `GIIS YouTube Uploader`
   - User support email: your school email
   - Developer contact email: your school email
4. **Scopes** page: just click **SAVE AND CONTINUE** (the script requests scopes itself at runtime).
5. **Test users**: click **ADD USERS** → add `alanhdchu@genesisideas.school`. **Important** — without this you'll be blocked at the OAuth screen.
6. Finish and go back to dashboard. You don't need to "publish" the app for personal use.

## 5. Create the OAuth client ID

This is what authorizes the script.

1. ☰ → **APIs & Services** → **Credentials**.
2. **+ CREATE CREDENTIALS** → **OAuth client ID**.
3. Application type: **Desktop app**.
4. Name: `giis-uploader-cli`.
5. **CREATE** → in the popup, click **DOWNLOAD JSON**.
6. Move the downloaded file:
   ```bash
   mv ~/Downloads/client_secret_*.json \
      /Users/alanhdchu/giis-website/tools/youtube-upload/client_secret.json
   ```

## 6. Install Python dependencies

```bash
npm run tools:python:bootstrap
```

## 7. First upload (interactive — only the first time)

```bash
cd /Users/alanhdchu/giis-website
bash tools/giis_python.sh tools/youtube-upload/upload_lesson.py teaching-videos/algebra-i-module-4-sample/
```

What happens:
1. A browser tab opens.
2. Google asks you to choose an account → pick `alanhdchu@genesisideas.school`.
3. You'll see a "Google hasn't verified this app" warning (because the OAuth app is in Testing mode). Click **Advanced** → **Go to GIIS YouTube Uploader (unsafe)**. This is fine — YOU are the developer.
4. Approve the YouTube scopes.
5. Browser shows "The authentication flow has completed", and the script starts uploading.
6. `token.json` gets written next to `client_secret.json`. You won't be prompted again until the token expires (months).

---

## 8. Daily-use cheatsheet

Upload one lesson (default privacy = `unlisted` so the link is shareable but the video doesn't show in search):
```bash
bash tools/giis_python.sh tools/youtube-upload/upload_lesson.py teaching-videos/algebra-i-module-1-variables/
```

Upload all three sample lessons in order:
```bash
for d in teaching-videos/algebra-i-module-{1-variables,7-functions,14-quadratics}/; do
  bash tools/giis_python.sh tools/youtube-upload/upload_lesson.py "$d"
done
```

Make a video public:
```bash
bash tools/giis_python.sh tools/youtube-upload/upload_lesson.py teaching-videos/algebra-i-module-4-sample/ --privacy public
```

---

## 9. ⚠ Quota notes

YouTube Data API has **10,000 quota units / project / day** by default.

| Action | Cost |
|---|---|
| Upload one video | 1,600 units |
| Set thumbnail | 50 units |
| Upload captions | 400 units |
| Total per lesson | ~2,050 units |

So you can upload **~4-5 full lessons per day** before hitting quota. If you need to do all 14 Algebra I modules in one session:

1. **APIs & Services** → **Quotas & system limits**.
2. Find `Queries per day` for YouTube Data API v3.
3. Click **EDIT QUOTA** → request 50,000.
4. Google reviews — usually 1-3 business days, longer for big increases.

For a private school's normal cadence (1-2 lessons per week), default quota is plenty.

---

## 10. Security — what NOT to commit

`client_secret.json` and `token.json` are in `.gitignore` already. Never commit them. If you ever accidentally do, immediately:
1. Revoke the OAuth client in Cloud Console
2. Create a new one
3. `git filter-branch` or BFG to scrub the leak

---

## Troubleshooting

**"This app isn't verified" + can't proceed**
You probably forgot step 4.5 (add yourself as a test user). Go back to OAuth consent screen → Test users → ADD USERS.

**"redirect_uri_mismatch"**
Your `client_secret.json` is for the wrong client type. Re-download making sure you picked **Desktop app** in step 5.

**"quotaExceeded"**
You've used your 10,000 daily units. Wait until midnight Pacific Time, or request a quota increase.

**"The user does not have a YouTube channel"**
You skipped step 1. Go create the channel first.

**Token keeps expiring quickly**
Make sure your OAuth app stays in **Testing** mode and you stay listed as a test user. If you publish without verification, tokens expire after 7 days.
