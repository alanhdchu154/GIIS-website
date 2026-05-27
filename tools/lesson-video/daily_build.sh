#!/usr/bin/env bash
#
# Daily lesson-build runner. Called by launchd (see com.giis.lesson-build.plist)
# at 08:00 local time, before the 09:00 YouTube upload run.
#
# What it does
# ------------
# Scans teaching-videos/ for lesson folders that look "ready to build":
#   - has script.json
#   - has at least one PNG in slides/
#   - does NOT yet have a rendered MP4
#   - does NOT have a .cleaned breadcrumb (those are uploaded + cleaned up)
#
# Runs make_lesson.py (TTS via edge-tts + merge via ffmpeg) on each, up to
# MAX_BUILDS per day. Bounded so a backlog of 30 lessons doesn't lock the
# Mac for an hour every morning.
#
# Logs to ~/Library/Logs/giis-lesson-build.log so you can `tail` it.
#
# Manual invocation:
#   bash tools/lesson-video/daily_build.sh
#
set -euo pipefail

MAX_BUILDS="${MAX_BUILDS:-4}"          # override with env: MAX_BUILDS=8 bash daily_build.sh
LOG="${HOME}/Library/Logs/giis-lesson-build.log"
mkdir -p "$(dirname "$LOG")"

# Resolve repo root regardless of cwd.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PAUSE_FILE="$REPO_ROOT/tools/lesson-video/PIPELINE_PAUSED.md"
if [ -f "$PAUSE_FILE" ]; then
  echo "GIIS lesson-build pipeline is paused by Alan. See $PAUSE_FILE"
  exit 0
fi

# Pick the Python that has edge-tts + imageio-ffmpeg installed. Anaconda
# default is /Users/alanhdchu/anaconda3/bin/python3, fall back to whatever
# is on PATH.
PYTHON_CANDIDATES=(
  "/Users/alanhdchu/anaconda3/bin/python3"
  "$(command -v python3 || true)"
)
PYTHON=""
for p in "${PYTHON_CANDIDATES[@]}"; do
  if [ -n "$p" ] && [ -x "$p" ]; then
    PYTHON="$p"; break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "ERROR: no python3 found" | tee -a "$LOG"
  exit 1
fi

{
  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "GIIS lesson-build daily run — $(date -Iseconds)"
  echo "════════════════════════════════════════════════════════════════════"
  echo "  python:     $PYTHON"
  echo "  max builds: $MAX_BUILDS"
  echo

  # Find candidates: script.json + slides/*.png + no MP4 + no .cleaned
  candidates=()
  for d in teaching-videos/*/; do
    [ -d "$d" ] || continue
    [ -f "$d/script.json" ] || continue
    [ -f "$d/.cleaned" ] && continue
    # has slides?
    if ! compgen -G "$d/slides/*.png" >/dev/null; then
      continue
    fi
    # already has a real MP4?
    if compgen -G "$d/*.mp4" >/dev/null; then
      continue
    fi
    candidates+=("$d")
  done

  total=${#candidates[@]}
  if [ "$total" -eq 0 ]; then
    echo "Nothing to build. All lessons with slides already have MP4s."
    exit 0
  fi

  # Cap to MAX_BUILDS. Sorted by folder name → oldest course first (stable).
  printf '%s\n' "${candidates[@]}" | sort > /tmp/giis-build-queue.txt
  echo "Queue ($total candidates):"
  while IFS= read -r d; do echo "  $d"; done < /tmp/giis-build-queue.txt
  echo

  built=0
  failed=0
  while IFS= read -r d; do
    if [ "$built" -ge "$MAX_BUILDS" ]; then
      remaining=$((total - built - failed))
      echo "Reached MAX_BUILDS=$MAX_BUILDS. $remaining still pending; will pick up tomorrow."
      break
    fi
    echo
    echo "─── building: $(basename "$d") ───"
    # CRITICAL: redirect stdin to /dev/null. Otherwise ffmpeg (invoked deep
    # inside make_lesson → merge_lesson) inherits the shell's stdin and
    # CONSUMES the queue file. After 1 lesson the while-loop sees EOF and
    # exits early — symptom was "1 built, N left for tomorrow" forever.
    if "$PYTHON" tools/lesson-video/make_lesson.py "$d" < /dev/null; then
      built=$((built + 1))
    else
      failed=$((failed + 1))
      echo "  ↑ failed (continuing with next; check log above)"
    fi
  done < /tmp/giis-build-queue.txt

  rm -f /tmp/giis-build-queue.txt
  echo
  echo "Run summary: $built built, $failed failed, $((total - built - failed)) left for tomorrow"
} 2>&1 | tee -a "$LOG"
