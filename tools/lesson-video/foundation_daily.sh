#!/usr/bin/env bash
#
# Daily foundation-video orchestrator.
#
# This is the Umi/Codex -> Claude Code -> Codex gate -> gated YouTube pipeline
# for new non-AP foundation videos.
#
# Manual dry-run:
#   bash tools/lesson-video/foundation_daily.sh --dry-run --no-cc --no-upload
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

LOG="${HOME}/Library/Logs/giis-foundation-video-daily.log"
mkdir -p "$(dirname "$LOG")"

PYTHON_CANDIDATES=(
  "${GIIS_PYTHON:-}"
  "${HOME}/.cache/giis-video-pipeline-venv/bin/python"
  "/opt/homebrew/bin/python3"
  "$(command -v python3 || true)"
)
PYTHON=""
for p in "${PYTHON_CANDIDATES[@]}"; do
  if [ -n "$p" ] && [ -x "$p" ] && "$p" - <<'PY' >/dev/null 2>&1
import importlib.util
mods = ["PIL", "edge_tts", "imageio_ffmpeg", "googleapiclient", "google_auth_oauthlib", "google.auth.transport.requests"]
raise SystemExit(0 if all(importlib.util.find_spec(m) for m in mods) else 1)
PY
  then
    PYTHON="$p"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "ERROR: no GIIS Python environment found with required modules" | tee -a "$LOG"
  echo "Run once: bash tools/bootstrap_python_tools.sh" | tee -a "$LOG"
  exit 1
fi

{
  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "GIIS foundation video daily run — $(date -Iseconds)"
  echo "════════════════════════════════════════════════════════════════════"
  echo "  repo:   $REPO_ROOT"
  echo "  python: $PYTHON"
  echo
  "$PYTHON" tools/lesson-video/foundation_daily_orchestrator.py \
    --target-grade "${FOUNDATION_TARGET_GRADE:-9}" \
    --max-modules "${FOUNDATION_MAX_MODULES:-7}" \
    --upload-max "${FOUNDATION_UPLOAD_MAX:-7}" \
    --privacy "${FOUNDATION_UPLOAD_PRIVACY:-unlisted}" \
    --budget-usd "${FOUNDATION_CC_BUDGET_USD:-10}" \
    --cc-timeout-seconds "${FOUNDATION_CC_TIMEOUT_SECONDS:-1800}" \
    --review-budget-usd "${FOUNDATION_REVIEW_BUDGET_USD:-2}" \
    --review-timeout-seconds "${FOUNDATION_REVIEW_TIMEOUT_SECONDS:-420}" \
    --ignore-upload-quota-estimate \
    --auto-commit \
    "$@"
} 2>&1 | tee -a "$LOG"
