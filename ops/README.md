# ops/ — shared Lightsail box monitoring

One hourly health check for the **whole** production box (not just giis-api). The
box hosts several projects (giis-api on PM2, duty-backend on systemd, Moodle on
MySQL, Postgres, nginx). This watches all of them from one place.

## What it does (every hour, via cron)

1. Checks system: load, memory, **swap**, disk.
2. Checks each service: `giis-api` (`:4000/health`), `duty-backend`
   (`:8765/api/config`), Postgres, MySQL, nginx — by HTTP, systemd state, and TCP.
3. If anything is red → emails everyone in `recipients.txt` via Resend, and
   (optionally) restarts failed **app** services. Databases are never auto-restarted.
4. Regenerates a browsable status page served at `https://api.genesisideas.school/status`.

## Files

| File | Purpose |
|---|---|
| `box-health-check.sh` | the check itself (run hourly by cron) |
| `box-monitor.env` | secrets/config (Resend key etc.) — **server only, git-ignored, chmod 600** |
| `recipients.txt` | alert email list, one per line — **server only, git-ignored** |
| `manage-recipients.sh` | `add` / `remove` / `list` alert recipients |

## Add a project to watch
Edit `box-health-check.sh`, add one line to `HTTP_CHECKS` or `SYSTEMD_CHECKS`.

## Add an alert email
Easiest: open the status page and use the **Add** form (or per-row **remove**).
Or on the box: `cd ~/ops && ./manage-recipients.sh add someone@example.com`.

## Status page (with recipient UI)
`https://api.genesisideas.school/status` (HTTP basic auth, user `giis`). Shows
every service green/red, the system snapshot, and an editable recipient list.

Served by `ops/monitor-web/server.py` — a tiny stdlib-only HTTP service bound to
`127.0.0.1:8770`, run by the `monitor-web` systemd unit, fronted by nginx (which
enforces basic auth). It reads `status.json` (written hourly by the check) and
reads/writes `recipients.txt`. No third-party deps.

## Server layout
```
~/ops/box-health-check.sh      # script
~/ops/box-monitor.env          # secrets (chmod 600)
~/ops/recipients.txt           # alert list
~/ops/monitor.log              # rolling log
/var/www/status/index.html     # generated status page (nginx serves it)
/etc/nginx/snippets/status.conf# nginx location for /status
cron: hourly @ :07
```
