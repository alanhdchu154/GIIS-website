#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${GIIS_PYTHON_VENV:-${HOME}/.cache/giis-video-pipeline-venv}"
REQ="${REPO_ROOT}/tools/requirements-giis-python.txt"

BASE_PYTHON="${GIIS_BOOTSTRAP_PYTHON:-}"
if [ -z "$BASE_PYTHON" ]; then
  if [ -x /opt/homebrew/bin/python3 ]; then
    BASE_PYTHON=/opt/homebrew/bin/python3
  else
    BASE_PYTHON="$(command -v python3 || true)"
  fi
fi

if [ -z "$BASE_PYTHON" ] || [ ! -x "$BASE_PYTHON" ]; then
  echo "ERROR: no usable python3 found. Install Homebrew Python or set GIIS_BOOTSTRAP_PYTHON." >&2
  exit 1
fi

if [ ! -x "${VENV}/bin/python" ]; then
  echo "[giis-python] creating venv: ${VENV}"
  "$BASE_PYTHON" -m venv "$VENV"
fi

PYTHON="${VENV}/bin/python"
echo "[giis-python] python: ${PYTHON}"
"$PYTHON" -m pip install --upgrade pip
"$PYTHON" -m pip install -r "$REQ"

"$PYTHON" - <<'PY'
import importlib.util
import sys

modules = [
    "PIL",
    "edge_tts",
    "imageio_ffmpeg",
    "googleapiclient",
    "google_auth_oauthlib",
    "google.auth.transport.requests",
]
missing = [mod for mod in modules if importlib.util.find_spec(mod) is None]
if missing:
    print("ERROR: missing modules after install:", ", ".join(missing), file=sys.stderr)
    raise SystemExit(1)
print("[giis-python] dependency smoke passed")
PY
