#!/usr/bin/env bash
#
# box-health-check.sh — single-pane health check for the shared GIIS Lightsail box.
#
# Runs hourly from cron. Checks system resources + every project/service on the
# box (whether it's managed by PM2, systemd, or is a database) and:
#   - emails an alert (via Resend) to everyone in recipients.txt when something is red,
#   - regenerates a browsable status page at $STATUS_HTML,
#   - optionally auto-restarts failed *application* services (never databases).
#
# ADD A NEW PROJECT TO WATCH: append one line to HTTP_CHECKS or SYSTEMD_CHECKS below.
# ADD AN ALERT EMAIL:         add a line to recipients.txt (or run manage-recipients.sh).
#
# Secrets/config live in box-monitor.env next to this script (chmod 600), NOT in git.
#
set -uo pipefail

# cron has a minimal environment — make tools + pm2 reachable.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
export HOME="${HOME:-/home/ubuntu}"
export PM2_HOME="${PM2_HOME:-/home/ubuntu/.pm2}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${BOX_MONITOR_ENV:-$SCRIPT_DIR/box-monitor.env}"
# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }

# ---- config (override any of these in box-monitor.env) ----
RESEND_KEY="${RESEND_API_KEY:-${RESEND_EMAIL_API_KEY:-}}"
FROM_EMAIL="${MONITOR_FROM_EMAIL:-GIIS Server Monitor <monitor@genesisideas.school>}"
RECIPIENTS_FILE="${RECIPIENTS_FILE:-$SCRIPT_DIR/recipients.txt}"
FALLBACK_EMAIL="${FALLBACK_EMAIL:-alanhdchu@genesisideas.school}"
HEALTHCHECKS_URL="${HEALTHCHECKS_URL:-}"            # optional dead-man switch (Healthchecks.io)
AUTO_RESTART_APPS="${AUTO_RESTART_APPS:-1}"         # 1 = try to restart failed app services
REMIND_SECONDS="${REMIND_SECONDS:-21600}"          # re-send alert every 6h while still broken
STATE_FILE="${STATE_FILE:-$SCRIPT_DIR/.monitor-state}"
LOG_FILE="${LOG_FILE:-$SCRIPT_DIR/monitor.log}"
STATUS_HTML="${STATUS_HTML:-/var/www/status/index.html}"
STATUS_JSON="${STATUS_JSON:-/var/www/status/status.json}"

# thresholds
DISK_PCT_MAX="${DISK_PCT_MAX:-85}"
MEM_AVAIL_MIN_MB="${MEM_AVAIL_MIN_MB:-250}"
SWAP_TOTAL_MIN_MB="${SWAP_TOTAL_MIN_MB:-1}"
LOAD_PER_CORE_MAX="${LOAD_PER_CORE_MAX:-4}"

HOSTNAME_S="$(hostname)"
NOW_EPOCH="$(date +%s)"
NOW_HUMAN="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# ---- services to watch ----
# HTTP checks:    "Label|URL|restart_command_if_down"
HTTP_CHECKS=(
  "giis-api (Node :4000)|http://127.0.0.1:4000/health|pm2 restart giis-api"
  "duty-backend (FastAPI :8765)|http://127.0.0.1:8765/api/config|sudo systemctl restart duty-backend"
  "monitor-web (:8770)|http://127.0.0.1:8770/api/recipients|sudo systemctl restart monitor-web"
)
# systemd checks: "Label|unit|auto_restart(1/0)"   (DBs left at 0 — never auto-restart data)
SYSTEMD_CHECKS=(
  "PostgreSQL 12|postgresql@12-main|0"
  "MySQL (Moodle)|mysql|0"
  "nginx|nginx|0"
  "duty-backend (unit)|duty-backend|1"
)
# raw TCP reachability checks: "Label|host|port"
TCP_CHECKS=(
  "PostgreSQL port|127.0.0.1|5432"
  "MySQL port|127.0.0.1|3306"
)

RESULTS=()     # each: "OK|Label|detail" or "FAIL|Label|detail"
PROBLEMS=()    # failure summary lines
ACTIONS=()     # auto-restart actions taken
record() {
  RESULTS+=("$1|$2|$3")
  [ "$1" = "FAIL" ] && PROBLEMS+=("$2 — $3")
}
try_restart() {
  local cmd="$1"
  [ "$AUTO_RESTART_APPS" = "1" ] || return 0
  [ -n "$cmd" ] || return 0
  if eval "$cmd" >/dev/null 2>&1; then ACTIONS+=("restarted: $cmd"); else ACTIONS+=("restart FAILED: $cmd"); fi
}
tcp_up() { timeout 4 bash -c "exec 3<>/dev/tcp/$1/$2" 2>/dev/null; }

# ================= SYSTEM =================
NCORES="$(nproc)"
LOAD1="$(awk '{print $1}' /proc/loadavg)"
if awk -v l="$LOAD1" -v c="$NCORES" -v m="$LOAD_PER_CORE_MAX" 'BEGIN{exit !((l/c)>m)}'; then
  record FAIL "System load" "load1=$LOAD1 across $NCORES cores (> ${LOAD_PER_CORE_MAX}/core)"
else
  record OK "System load" "load1=$LOAD1 across $NCORES cores"
fi

MEM_AVAIL_MB="$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)"
MEM_TOTAL_MB="$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)"
if [ "${MEM_AVAIL_MB:-0}" -lt "$MEM_AVAIL_MIN_MB" ]; then
  record FAIL "Memory" "${MEM_AVAIL_MB}MB available of ${MEM_TOTAL_MB}MB (< ${MEM_AVAIL_MIN_MB}MB)"
else
  record OK "Memory" "${MEM_AVAIL_MB}MB available of ${MEM_TOTAL_MB}MB"
fi

SWAP_TOTAL_MB="$(awk '/SwapTotal/{print int($2/1024)}' /proc/meminfo)"
if [ "${SWAP_TOTAL_MB:-0}" -lt "$SWAP_TOTAL_MIN_MB" ]; then
  record FAIL "Swap" "no swap configured (SwapTotal=${SWAP_TOTAL_MB}MB)"
else
  record OK "Swap" "${SWAP_TOTAL_MB}MB configured"
fi

DISK_PCT="$(df --output=pcent / 2>/dev/null | tail -1 | tr -dc '0-9')"
DISK_AVAIL="$(df -h --output=avail / 2>/dev/null | tail -1 | tr -d ' ')"
if [ "${DISK_PCT:-0}" -ge "$DISK_PCT_MAX" ]; then
  record FAIL "Disk /" "${DISK_PCT}% used (>= ${DISK_PCT_MAX}%), ${DISK_AVAIL} free"
else
  record OK "Disk /" "${DISK_PCT}% used, ${DISK_AVAIL} free"
fi

# ================= HTTP SERVICES =================
for entry in "${HTTP_CHECKS[@]}"; do
  IFS='|' read -r label url restart <<< "$entry"
  code="$(curl -s -m 6 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)"
  if [ "$code" = "200" ]; then
    record OK "$label" "HTTP 200"
  else
    record FAIL "$label" "HTTP ${code:-no-response} from $url"
    try_restart "$restart"
  fi
done

# ================= SYSTEMD UNITS =================
for entry in "${SYSTEMD_CHECKS[@]}"; do
  IFS='|' read -r label unit dorestart <<< "$entry"
  if systemctl is-active --quiet "$unit"; then
    record OK "$label" "active"
  else
    record FAIL "$label" "systemd unit '$unit' is $(systemctl is-active "$unit" 2>/dev/null)"
    [ "$dorestart" = "1" ] && try_restart "sudo systemctl restart $unit"
  fi
done

# ================= TCP REACHABILITY =================
for entry in "${TCP_CHECKS[@]}"; do
  IFS='|' read -r label host port <<< "$entry"
  if tcp_up "$host" "$port"; then
    record OK "$label" "reachable ${host}:${port}"
  else
    record FAIL "$label" "cannot connect ${host}:${port}"
  fi
done

# ================= PM2 PROCESS SANITY =================
if command -v pm2 >/dev/null 2>&1; then
  PM2_STATUS="$(pm2 jlist 2>/dev/null | python3 -c '
import sys,json
try: d=json.load(sys.stdin)
except Exception: print("unknown"); sys.exit(0)
for p in d:
    if p.get("name")=="giis-api":
        print(p.get("pm2_env",{}).get("status","unknown")); break
else: print("missing")' 2>/dev/null)"
  case "$PM2_STATUS" in
    online|unknown|"") record OK "pm2 giis-api process" "status=${PM2_STATUS:-online}" ;;
    *) record FAIL "pm2 giis-api process" "status=$PM2_STATUS" ;;
  esac
fi

# ================= RECIPIENTS =================
RECIPIENTS=()
if [ -f "$RECIPIENTS_FILE" ]; then
  while IFS= read -r line; do
    line="$(echo "$line" | tr -d '[:space:]')"
    [ -z "$line" ] && continue
    case "$line" in \#*) continue;; esac
    RECIPIENTS+=("$line")
  done < "$RECIPIENTS_FILE"
fi
[ ${#RECIPIENTS[@]} -eq 0 ] && RECIPIENTS=("$FALLBACK_EMAIL")

# ================= EMAIL / HEALTHCHECKS =================
send_email() {
  local subject="$1" body="$2"
  if [ -z "$RESEND_KEY" ]; then
    echo "$(date -u +%FT%TZ) [warn] no RESEND key set — email skipped: $subject" >> "$LOG_FILE"
    return 1
  fi
  local payload
  payload="$(FROM="$FROM_EMAIL" SUBJ="$subject" BODY="$body" TO="$(printf '%s\n' "${RECIPIENTS[@]}")" python3 -c '
import json,os
tos=[x for x in os.environ["TO"].splitlines() if x.strip()]
print(json.dumps({"from":os.environ["FROM"],"to":tos,"subject":os.environ["SUBJ"],"text":os.environ["BODY"]}))')"
  if curl -fsS -m 15 -X POST https://api.resend.com/emails \
      -H "Authorization: Bearer $RESEND_KEY" -H "Content-Type: application/json" \
      -d "$payload" >/dev/null 2>&1; then
    echo "$(date -u +%FT%TZ) [mail] sent '$subject' to ${RECIPIENTS[*]}" >> "$LOG_FILE"; return 0
  else
    echo "$(date -u +%FT%TZ) [error] Resend send failed: $subject" >> "$LOG_FILE"; return 1
  fi
}
ping_hc() { [ -n "$HEALTHCHECKS_URL" ] && curl -fsS -m 10 "${HEALTHCHECKS_URL}${1:-}" >/dev/null 2>&1; return 0; }

# ================= STATUS PAGE =================
write_status_page() {
  local overall="$1" rows="" cls
  for r in "${RESULTS[@]}"; do
    IFS='|' read -r st label detail <<< "$r"
    if [ "$st" = "OK" ]; then cls="ok"; else cls="bad"; fi
    rows+="<tr class=\"$cls\"><td><span class=\"dot\"></span>${st}</td><td>${label}</td><td>${detail}</td></tr>"
  done
  local rlist=""
  for e in "${RECIPIENTS[@]}"; do rlist+="<li>${e}</li>"; done
  local banner_cls banner_txt
  if [ "$overall" = "OK" ]; then banner_cls="ok"; banner_txt="All systems operational"; else banner_cls="bad"; banner_txt="${#PROBLEMS[@]} problem(s) detected"; fi
  mkdir -p "$(dirname "$STATUS_HTML")" 2>/dev/null
  cat > "$STATUS_HTML" <<HTML
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="300">
<title>GIIS Server Status</title>
<style>
 body{font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}
 .wrap{max-width:820px;margin:0 auto;padding:28px 18px}
 h1{font-size:20px;margin:0 0 4px} .sub{color:#94a3b8;font-size:13px;margin:0 0 20px}
 .banner{padding:14px 18px;border-radius:10px;font-weight:600;margin:0 0 22px}
 .banner.ok{background:#064e3b;color:#6ee7b7} .banner.bad{background:#7f1d1d;color:#fecaca}
 table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden}
 td{padding:11px 14px;border-top:1px solid #334155;font-size:14px;vertical-align:top}
 tr:first-child td{border-top:none}
 td:first-child{white-space:nowrap;font-weight:600;width:74px}
 .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:middle}
 tr.ok .dot{background:#22c55e} tr.bad .dot{background:#ef4444} tr.bad td{color:#fca5a5}
 .card{background:#1e293b;border-radius:10px;padding:16px 18px;margin-top:22px}
 .card h2{font-size:14px;margin:0 0 8px;color:#cbd5e1} ul{margin:6px 0 0;padding-left:18px}
 code{background:#0f172a;padding:2px 6px;border-radius:5px;font-size:12px}
 .foot{color:#64748b;font-size:12px;margin-top:22px}
</style></head><body><div class="wrap">
 <h1>GIIS Server Status</h1>
 <p class="sub">${HOSTNAME_S} · checked ${NOW_HUMAN} · auto-refreshes every 5 min · check runs hourly</p>
 <div class="banner ${banner_cls}">${banner_txt}</div>
 <table>${rows}</table>
 <div class="card">
   <h2>Alert recipients (emailed when something turns red)</h2>
   <ul>${rlist}</ul>
   <p class="sub" style="margin-top:10px">To add or remove an address, edit <code>recipients.txt</code> on the server
   (or run <code>manage-recipients.sh add you@example.com</code>). Takes effect next hourly check.</p>
 </div>
 <p class="foot">Generated by ops/box-health-check.sh — one check covers every project on this box.</p>
</div></body></html>
HTML
  # machine-readable status for the monitor-web UI
  mkdir -p "$(dirname "$STATUS_JSON")" 2>/dev/null
  OVERALL="$overall" HOST="$HOSTNAME_S" CHECKED="$NOW_HUMAN" STATUS_JSON="$STATUS_JSON" \
  RESULTS_RAW="$(printf '%s\n' "${RESULTS[@]}")" python3 -c '
import json,os
rows=[]
for ln in os.environ["RESULTS_RAW"].splitlines():
    if not ln.strip(): continue
    st,label,detail=(ln.split("|",2)+["","",""])[:3]
    rows.append({"status":st,"label":label,"detail":detail})
out={"overall":os.environ["OVERALL"],"host":os.environ["HOST"],
     "checked":os.environ["CHECKED"],"results":rows}
open(os.environ.get("STATUS_JSON","/var/www/status/status.json"),"w").write(json.dumps(out))
' 2>/dev/null
}

# ================= DECIDE / ALERT =================
STATUS=OK; LAST_ALERT=0
[ -f "$STATE_FILE" ] && . "$STATE_FILE"
PREV_STATUS="$STATUS"; PREV_ALERT="$LAST_ALERT"

if [ "${#PROBLEMS[@]}" -eq 0 ]; then
  write_status_page OK
  ping_hc ""
  echo "$(date -u +%FT%TZ) [ok] all ${#RESULTS[@]} checks passed" >> "$LOG_FILE"
  if [ "$PREV_STATUS" = "FAIL" ]; then
    send_email "GIIS box RECOVERED — all services healthy" \
      "$(printf 'Good news: all monitored services on %s are healthy again as of %s.\n' "$HOSTNAME_S" "$NOW_HUMAN")"
  fi
  printf 'STATUS=OK\nLAST_ALERT=0\n' > "$STATE_FILE"
else
  write_status_page FAIL
  ping_hc "/fail"
  body="$(printf 'The hourly health check on %s found %s problem(s) at %s:\n\n' "$HOSTNAME_S" "${#PROBLEMS[@]}" "$NOW_HUMAN")"
  for p in "${PROBLEMS[@]}"; do body+="  [X] $p"$'\n'; done
  if [ "${#ACTIONS[@]}" -gt 0 ]; then
    body+=$'\nAuto-recovery attempted:\n'
    for a in "${ACTIONS[@]}"; do body+="  - $a"$'\n'; done
  fi
  body+=$'\n'"$(printf 'Snapshot: load1=%s/%sc, mem %sMB free, swap %sMB, disk %s%% used.\n' "$LOAD1" "$NCORES" "${MEM_AVAIL_MB:-?}" "${SWAP_TOTAL_MB:-?}" "${DISK_PCT:-?}")"
  echo "$(date -u +%FT%TZ) [fail] ${PROBLEMS[*]}" >> "$LOG_FILE"
  if [ "$PREV_STATUS" = "OK" ] || [ "$((NOW_EPOCH - PREV_ALERT))" -ge "$REMIND_SECONDS" ]; then
    send_email "GIIS box ALERT — ${#PROBLEMS[@]} problem(s) on $HOSTNAME_S" "$body"
    printf 'STATUS=FAIL\nLAST_ALERT=%s\n' "$NOW_EPOCH" > "$STATE_FILE"
  else
    printf 'STATUS=FAIL\nLAST_ALERT=%s\n' "$PREV_ALERT" > "$STATE_FILE"
  fi
fi

# --test sends a one-off mail so you can confirm delivery works.
if [ "${1:-}" = "--test" ]; then
  send_email "GIIS monitor installed — test alert" \
    "$(printf 'Test from box-health-check.sh on %s at %s.\nIf you received this, Resend alerting works.\nCurrent recipients: %s\n' "$HOSTNAME_S" "$NOW_HUMAN" "${RECIPIENTS[*]}")" \
    && echo "test email sent to: ${RECIPIENTS[*]}" || echo "test email FAILED (see $LOG_FILE)"
fi

exit 0
