#!/usr/bin/env bash
#
# Daily YouTube upload runner. Called by launchd (see com.giis.youtube-daily.plist)
# at 09:00 Pacific each day — after YouTube Data API quota resets at midnight PT.
#
# Logs to ~/Library/Logs/giis-youtube-daily.log so you can `tail` it and see what
# ran. Exits non-zero on upload failure (launchd will surface this in Console.app).
#
# Manual invocation:
#   bash tools/youtube-upload/daily.sh
#
set -euo pipefail

# Run from the repo root so relative paths work regardless of cwd.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PAUSE_FILE="$REPO_ROOT/tools/lesson-video/PIPELINE_PAUSED.md"
if [ -f "$PAUSE_FILE" ]; then
  echo "GIIS YouTube upload pipeline is paused by Alan. See $PAUSE_FILE"
  exit 0
fi

LOG="${HOME}/Library/Logs/giis-youtube-daily.log"
mkdir -p "$(dirname "$LOG")"

# IMPORTANT: launchd's PATH is minimal — bare `python3` resolves to
# /usr/bin/python3 (system Python) which DOES NOT have google-auth /
# googleapiclient / requests installed. We need the user's Anaconda Python
# (where `pip install ...` actually put those packages). Fall back to
# whatever python3 is on PATH (works if called from a terminal).
PYTHON_CANDIDATES=(
  "/Users/alanhdchu/anaconda3/bin/python3"
  "$(command -v python3 || true)"
)
PYTHON=""
for p in "${PYTHON_CANDIDATES[@]}"; do
  if [ -n "$p" ] && [ -x "$p" ]; then PYTHON="$p"; break; fi
done
if [ -z "$PYTHON" ]; then
  echo "ERROR: no python3 found" | tee -a "$LOG"
  exit 1
fi
export PATH="$(dirname "$PYTHON"):$PATH"   # so any `python3` calls inside also resolve right

{
  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "GIIS YouTube daily run — $(date -Iseconds)"
  echo "════════════════════════════════════════════════════════════════════"
  echo "  python: $PYTHON"
  echo
  "$PYTHON" tools/youtube-upload/yt_queue.py status

  echo
  echo "─── lesson release gate (quality check before upload) ───"
  "$PYTHON" tools/lesson-video/lesson_release_gate.py --pending \
    || echo "  release gate reported issues; see teaching-videos/_audit/release-gate/latest-release-gate.json"

  echo
  "$PYTHON" tools/youtube-upload/yt_queue.py upload --max 4 --privacy unlisted --gate-ready

  # After upload, retry cleanup on any lesson that was uploaded earlier but
  # whose cleanup got blocked (most commonly: YouTube was still "processing"
  # at the moment upload_lesson.py tried to call cleanup_lesson.py). By now
  # those videos should be fully processed and the local artifacts can go.
  #
  # Looks for: has script.json.youtube.video_id AND no .cleaned breadcrumb.
  # Each cleanup call has its own 3-layer safety net; if YouTube still says
  # 'processing' for whatever reason, the run just no-ops and we retry tomorrow.
  echo
  echo "─── retry cleanup on uploaded-but-not-yet-cleaned lessons ───"
  for slug in "$REPO_ROOT/teaching-videos/"*/; do
    [ -f "$slug/script.json" ] || continue
    [ -f "$slug/.cleaned" ] && continue
    has_yt=$("$PYTHON" -c "import json,sys;
try:
  d=json.load(open('$slug/script.json'))
  print('y' if (d.get('youtube') or {}).get('video_id') else 'n')
except Exception: print('n')" 2>/dev/null)
    if [ "$has_yt" = "y" ]; then
      echo "  retrying cleanup for $(basename $slug)"
      "$PYTHON" "$REPO_ROOT/tools/youtube-upload/cleanup_lesson.py" "$slug" \
        || echo "    (still not ready; will retry tomorrow)"
    fi
  done

  # After upload finishes, push any newly-written youtube.video_id blocks and
  # the updated lessons-manifest.json so Netlify sees them. Cowork's daily
  # scheduled task may also have written brand-new script.json / build_slides.py
  # files — sweep those up in the same commit.
  #
  # We use `git status --porcelain` not `git diff HEAD` because diff only
  # detects MODIFICATIONS to tracked files; it misses untracked new files
  # (which is exactly what Cowork produces — fresh lesson folders).
  echo
  echo "─── auto-push if anything changed ───"

  # Defend against stale git lock files from a crashed previous run.
  # If the lock file exists AND no live `git` process holds it AND the
  # file is older than 5 minutes, it's safe to remove. Skipping this
  # check used to make daily.sh fail with exit 128 every morning.
  SKIP_PUSH=""
  for LOCK in "$REPO_ROOT/.git/index.lock" "$REPO_ROOT/.git/HEAD.lock"; do
  if [ -f "$LOCK" ]; then
    if pgrep -x git >/dev/null 2>&1; then
      echo "  another git process is running — skipping auto-push this run"
      SKIP_PUSH="y"
    else
      lock_age_sec=$(( $(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || echo 0) ))
      if [ "$lock_age_sec" -gt 300 ]; then
        echo "  removing stale ${LOCK#$REPO_ROOT/} (age ${lock_age_sec}s, no git process running)"
        rm -f "$LOCK" || SKIP_PUSH="y"
      else
        echo "  ${LOCK#$REPO_ROOT/} is fresh (${lock_age_sec}s); skipping auto-push this run"
        SKIP_PUSH="y"
      fi
    fi
  fi
  done

  if [ "$SKIP_PUSH" = "y" ]; then
    echo "  (lock issue — see above; will retry on next run)"
    exit 0
  fi

  CHANGES="$(git -C "$REPO_ROOT" status --porcelain -- public/data/lessons-manifest.json teaching-videos/ 2>/dev/null || true)"
  if [ -z "$CHANGES" ]; then
    echo "  nothing to push (working tree clean for lesson-related files)"
  else
    echo "  detected changes:"
    echo "$CHANGES" | sed 's/^/    /'
    git -C "$REPO_ROOT" add public/data/lessons-manifest.json \
                            'teaching-videos/*/script.json' \
                            'teaching-videos/*/build_slides.py' \
                            'teaching-videos/*/.cleaned' \
                            'teaching-videos/*/transcript.txt' \
                            2>/dev/null || true
    if ! git -C "$REPO_ROOT" diff --cached --quiet 2>/dev/null; then
      LESSON_COUNT=$(grep -c '"video_id"' "$REPO_ROOT/public/data/lessons-manifest.json" 2>/dev/null || echo '?')
      git -C "$REPO_ROOT" commit -m "auto: lesson pipeline run $(date -I)

Manifest now has $LESSON_COUNT canonical lessons.
Generated by tools/youtube-upload/daily.sh launchd job."
      if git -C "$REPO_ROOT" push 2>&1; then
        echo "  pushed to origin"
      else
        echo "  push failed — leave commit locally, investigate later"
      fi
    else
      echo "  staged changes were already empty after filtering"
    fi
  fi
} 2>&1 | tee -a "$LOG"
