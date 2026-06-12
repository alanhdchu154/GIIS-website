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
  "${HOME}/.cache/giis-video-pipeline-venv/bin/python"
  "/opt/homebrew/bin/python3"
  "$(command -v python3 || true)"
)
PYTHON=""
for p in "${PYTHON_CANDIDATES[@]}"; do
  if [ -n "$p" ] && [ -x "$p" ]; then
    PYTHON="$p"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "ERROR: no python3 found" | tee -a "$LOG"
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
    --max-modules "${FOUNDATION_MAX_MODULES:-11}" \
    --upload-max "${FOUNDATION_UPLOAD_MAX:-11}" \
    --privacy "${FOUNDATION_UPLOAD_PRIVACY:-unlisted}" \
    --budget-usd "${FOUNDATION_CC_BUDGET_USD:-10}" \
    --cc-timeout-seconds "${FOUNDATION_CC_TIMEOUT_SECONDS:-1800}" \
    --ignore-upload-quota-estimate \
    --auto-commit \
    "$@"
} 2>&1 | tee -a "$LOG"
