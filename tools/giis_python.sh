#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${GIIS_PYTHON_VENV:-${HOME}/.cache/giis-video-pipeline-venv}"

if [ "$#" -lt 1 ]; then
  echo "usage: bash tools/giis_python.sh <script.py> [args...]" >&2
  exit 2
fi

PYTHON_CANDIDATES=(
  "${GIIS_PYTHON:-}"
  "${VENV}/bin/python"
  "/opt/homebrew/bin/python3"
  "$(command -v python3 || true)"
)

PYTHON=""
for candidate in "${PYTHON_CANDIDATES[@]}"; do
  if [ -z "$candidate" ] || [ ! -x "$candidate" ]; then
    continue
  fi
  if "$candidate" - <<'PY' >/dev/null 2>&1
import importlib.util

modules = [
    "PIL",
    "edge_tts",
    "imageio_ffmpeg",
    "googleapiclient",
    "google_auth_oauthlib",
    "google.auth.transport.requests",
]
raise SystemExit(0 if all(importlib.util.find_spec(m) for m in modules) else 1)
PY
  then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "ERROR: no GIIS Python environment has the required local tooling modules." >&2
  echo "Run once:" >&2
  echo "  bash tools/bootstrap_python_tools.sh" >&2
  exit 1
fi

cd "$REPO_ROOT"
exec "$PYTHON" "$@"
