#!/usr/bin/env bash
# manage-recipients.sh — add/remove/list alert email recipients for box-health-check.sh
# Usage:
#   ./manage-recipients.sh list
#   ./manage-recipients.sh add    someone@example.com
#   ./manage-recipients.sh remove someone@example.com
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE="${RECIPIENTS_FILE:-$SCRIPT_DIR/recipients.txt}"
touch "$FILE"
cmd="${1:-list}"; email="${2:-}"
case "$cmd" in
  list)
    echo "Alert recipients in $FILE:"; grep -vE '^\s*(#|$)' "$FILE" || echo "  (none)";;
  add)
    [ -z "$email" ] && { echo "usage: $0 add <email>"; exit 1; }
    if grep -qixF "$email" "$FILE"; then echo "already present: $email"; else echo "$email" >> "$FILE"; echo "added: $email"; fi;;
  remove)
    [ -z "$email" ] && { echo "usage: $0 remove <email>"; exit 1; }
    grep -vixF "$email" "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"; echo "removed (if present): $email";;
  *) echo "usage: $0 {list|add <email>|remove <email>}"; exit 1;;
esac
