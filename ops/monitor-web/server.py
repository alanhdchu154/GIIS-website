#!/usr/bin/env python3
"""
monitor-web — tiny status dashboard + recipient manager for the GIIS box monitor.

- Binds to 127.0.0.1 only; the internet reaches it solely through nginx, which
  enforces HTTP basic auth on /status. So there is no separate login here.
- Reads the latest check results from STATUS_JSON (written hourly by
  box-health-check.sh) and renders them.
- Reads/writes RECIPIENTS_FILE so alert emails can be added/removed from the UI.

No third-party dependencies (Python stdlib only).
"""
import json
import os
import re
import html
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

PORT = int(os.environ.get("MONITOR_WEB_PORT", "8770"))
STATUS_JSON = os.environ.get("STATUS_JSON", "/var/www/status/status.json")
RECIPIENTS_FILE = os.environ.get("RECIPIENTS_FILE", "/home/ubuntu/ops/recipients.txt")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def read_recipients():
    out = []
    try:
        with open(RECIPIENTS_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    out.append(line)
    except FileNotFoundError:
        pass
    return out


def write_recipients(emails):
    # de-dupe (case-insensitive) preserving order, keep a header comment
    seen, kept = set(), []
    for e in emails:
        k = e.lower()
        if k not in seen:
            seen.add(k)
            kept.append(e)
    with open(RECIPIENTS_FILE, "w") as f:
        f.write("# one alert email per line — managed via /status UI\n")
        for e in kept:
            f.write(e + "\n")


def read_status():
    try:
        with open(STATUS_JSON) as f:
            return json.load(f)
    except Exception:
        return None


def render_page(msg=""):
    st = read_status()
    recips = read_recipients()
    if st:
        overall = st.get("overall", "UNKNOWN")
        checked = st.get("checked", "?")
        host = st.get("host", "?")
        results = st.get("results", [])
        nproblems = sum(1 for r in results if r.get("status") == "FAIL")
    else:
        overall, checked, host, results, nproblems = "UNKNOWN", "never", "?", [], 0

    if overall == "OK":
        banner_cls, banner_txt = "ok", "All systems operational"
    elif overall == "UNKNOWN":
        banner_cls, banner_txt = "warn", "No check has run yet"
    else:
        banner_cls, banner_txt = "bad", f"{nproblems} problem(s) detected"

    rows = ""
    for r in results:
        ok = r.get("status") == "OK"
        rows += (
            f'<tr class="{"ok" if ok else "bad"}">'
            f'<td><span class="dot"></span>{html.escape(r.get("status",""))}</td>'
            f'<td>{html.escape(r.get("label",""))}</td>'
            f'<td>{html.escape(r.get("detail",""))}</td></tr>'
        )

    rlist = ""
    for e in recips:
        ee = html.escape(e)
        rlist += (
            f'<li><span>{ee}</span>'
            f'<form method="post" action="remove" onsubmit="return confirm(\'Remove {ee}?\')">'
            f'<input type="hidden" name="email" value="{ee}">'
            f'<button class="rm">remove</button></form></li>'
        )
    if not rlist:
        rlist = "<li><em>(none — add one below)</em></li>"

    note = f'<div class="msg">{html.escape(msg)}</div>' if msg else ""

    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GIIS Server Status</title>
<style>
 body{{font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}}
 .wrap{{max-width:820px;margin:0 auto;padding:28px 18px}}
 h1{{font-size:20px;margin:0 0 4px}} .sub{{color:#94a3b8;font-size:13px;margin:0 0 18px}}
 .banner{{padding:14px 18px;border-radius:10px;font-weight:600;margin:0 0 18px}}
 .banner.ok{{background:#064e3b;color:#6ee7b7}} .banner.bad{{background:#7f1d1d;color:#fecaca}}
 .banner.warn{{background:#78350f;color:#fcd34d}}
 .msg{{background:#1e3a8a;color:#bfdbfe;padding:10px 14px;border-radius:8px;margin:0 0 16px;font-size:14px}}
 table{{width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden}}
 td{{padding:11px 14px;border-top:1px solid #334155;font-size:14px}}
 tr:first-child td{{border-top:none}} td:first-child{{white-space:nowrap;font-weight:600;width:74px}}
 .dot{{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:middle}}
 tr.ok .dot{{background:#22c55e}} tr.bad .dot{{background:#ef4444}} tr.bad td{{color:#fca5a5}}
 .card{{background:#1e293b;border-radius:10px;padding:16px 18px;margin-top:22px}}
 .card h2{{font-size:14px;margin:0 0 10px;color:#cbd5e1}}
 ul{{list-style:none;margin:0;padding:0}} li{{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-top:1px solid #334155}}
 li:first-child{{border-top:none}} li form{{margin:0}}
 .rm{{background:#7f1d1d;color:#fecaca;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px}}
 .add{{display:flex;gap:8px;margin-top:14px}}
 .add input[type=email]{{flex:1;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;padding:9px 12px;font-size:14px}}
 .add button{{background:#1d4ed8;color:#fff;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;font-weight:600}}
 .foot{{color:#64748b;font-size:12px;margin-top:22px}}
</style></head><body><div class="wrap">
 <h1>GIIS Server Status</h1>
 <p class="sub">{html.escape(host)} · last check {html.escape(str(checked))} · checks run hourly</p>
 {note}
 <div class="banner {banner_cls}">{banner_txt}</div>
 <table>{rows or '<tr><td colspan=3>no data</td></tr>'}</table>
 <div class="card">
   <h2>Alert recipients (emailed when something turns red)</h2>
   <ul>{rlist}</ul>
   <form class="add" method="post" action="add">
     <input type="email" name="email" placeholder="add an email…" required>
     <button>Add</button>
   </form>
 </div>
 <p class="foot">Reachable at https://api.genesisideas.school/status · binds localhost, behind nginx basic auth.</p>
</div></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="text/html; charset=utf-8"):
        b = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _redirect(self, msg=""):
        # 303 back to the dashboard root; carry a short message via querystring
        self.send_response(303)
        loc = "./" + (("?m=" + msg.replace(" ", "+")) if msg else "")
        self.send_header("Location", loc)
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/") or "/"
        if path in ("/", "/index.html"):
            qs = parse_qs(self.path.split("?", 1)[1]) if "?" in self.path else {}
            self._send(200, render_page(qs.get("m", [""])[0]))
        elif path == "/api/recipients":
            self._send(200, json.dumps(read_recipients()), "application/json")
        else:
            self._send(404, "not found", "text/plain")

    def do_POST(self):
        path = self.path.split("?")[0].rstrip("/")
        length = int(self.headers.get("Content-Length", 0))
        data = parse_qs(self.rfile.read(length).decode("utf-8")) if length else {}
        email = (data.get("email", [""])[0]).strip()
        recips = read_recipients()
        if path.endswith("/add"):
            if not EMAIL_RE.match(email):
                return self._redirect("invalid email")
            if email.lower() in (r.lower() for r in recips):
                return self._redirect("already present")
            recips.append(email)
            write_recipients(recips)
            return self._redirect("added " + email)
        if path.endswith("/remove"):
            recips = [r for r in recips if r.lower() != email.lower()]
            write_recipients(recips)
            return self._redirect("removed " + email)
        self._send(404, "not found", "text/plain")

    def log_message(self, *a):
        pass  # quiet


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
