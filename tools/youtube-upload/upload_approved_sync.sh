#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PYTHON_CANDIDATES=(
  "${HOME}/.cache/giis-video-pipeline-venv/bin/python"
  "/Users/alanhdchu/anaconda3/bin/python3"
  "$(command -v python3 || true)"
)

PYTHON=""
for candidate in "${PYTHON_CANDIDATES[@]}"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    if "$candidate" - <<'PY' >/dev/null 2>&1
import googleapiclient.discovery
import google_auth_oauthlib.flow
import google.auth.transport.requests
PY
    then
      PYTHON="$candidate"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  echo "ERROR: no Python environment has the YouTube API packages." >&2
  echo "Expected: google-api-python-client google-auth-oauthlib google-auth" >&2
  exit 1
fi

echo "[upload-approved] python: $PYTHON"

if [ "${1:-}" = "--quota" ]; then
  "$PYTHON" tools/youtube-upload/yt_queue.py quota
  exit 0
fi

SYNC_AFTER=1
DRY_RUN=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --no-sync)
      SYNC_AFTER=0
      ;;
    --dry-run)
      DRY_RUN=1
      ARGS+=("$arg")
      ;;
    *)
      ARGS+=("$arg")
      ;;
  esac
done

UPLOAD_CMD=("$PYTHON" tools/youtube-upload/yt_queue.py upload --gate-ready --max "${YT_UPLOAD_MAX:-4}" --privacy "${YT_UPLOAD_PRIVACY:-unlisted}")
if [ "${#ARGS[@]}" -gt 0 ]; then
  UPLOAD_CMD+=("${ARGS[@]}")
fi
"${UPLOAD_CMD[@]}"

case "$DRY_RUN" in
  1)
    echo "[upload-approved] dry-run: skipping channel sync/dashboard refresh"
    ;;
  0)
    if [ "$SYNC_AFTER" -eq 1 ]; then
      "$PYTHON" tools/youtube-upload/sync_channel.py --apply
      python3 tools/lesson-video/video_dashboard.py
    else
      echo "[upload-approved] --no-sync: skipping channel sync/dashboard refresh"
    fi
    ;;
esac
