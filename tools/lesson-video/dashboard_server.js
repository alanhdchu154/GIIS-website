#!/usr/bin/env node
/* Local live dashboard for GIIS lesson-video production.
 *
 * This intentionally stays outside the public React app. It exposes internal
 * production/audit metadata from the local repo, so it should run on localhost.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_PORT = Number(process.env.LESSON_DASHBOARD_PORT || 4178);
const HOST = process.env.LESSON_DASHBOARD_HOST || '127.0.0.1';
const DASHBOARD_JSON = path.join(ROOT, 'teaching-videos', '_audit', 'dashboard', 'lesson-video-dashboard.json');
const VIDEO_DASHBOARD = path.join(ROOT, 'tools', 'lesson-video', 'video_dashboard.py');
const REACT_UMD = path.join(ROOT, 'node_modules', 'react', 'umd', 'react.development.js');
const REACT_DOM_UMD = path.join(ROOT, 'node_modules', 'react-dom', 'umd', 'react-dom.development.js');

let refreshPromise = null;

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2), {
    'Content-Type': 'application/json; charset=utf-8',
  });
}

function runDashboardRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = new Promise((resolve, reject) => {
    const child = spawn('python3', [VIDEO_DASHBOARD, '--json', DASHBOARD_JSON, '--no-html'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(stderr || stdout || `video_dashboard.py exited with ${code}`);
        error.code = code;
        reject(error);
      }
    });
  }).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function readDashboardPayload() {
  await runDashboardRefresh();
  return JSON.parse(fs.readFileSync(DASHBOARD_JSON, 'utf8'));
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (error, body) => {
    if (error) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    send(res, 200, body, { 'Content-Type': contentType });
  });
}

function html() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GIIS Lesson Video Live Monitor</title>
  <style>
    :root {
      --bg: #f6f8fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #667187;
      --border: #d9e1ec;
      --green: #157f57;
      --amber: #a76611;
      --red: #bf4342;
      --blue: #2f6fed;
      --soft: #eef3f7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
      line-height: 1.45;
    }
    .shell { max-width: 1280px; margin: 0 auto; padding: 24px 18px 42px; }
    .topbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
    .subtle { color: var(--muted); font-size: 13px; }
    .statusline { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      padding: 0 9px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: #fff;
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }
    .badge.live { color: #0b5c3c; border-color: #b8decf; background: #e8f7f0; }
    button, select, input {
      height: 36px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fff;
      color: var(--text);
      font: inherit;
    }
    button { display: inline-flex; align-items: center; gap: 6px; padding: 0 11px; cursor: pointer; }
    button:hover { border-color: #aeb9ca; }
    select, input { padding: 0 10px; }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 12px 0 16px; }
    .filters input { min-width: 280px; flex: 1; }
    .kpis { display: grid; grid-template-columns: repeat(6, minmax(125px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .kpi, .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(18, 30, 50, 0.04);
    }
    .kpi { padding: 13px; min-height: 82px; }
    .kpi .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .kpi .value { margin-top: 4px; font-size: 25px; font-weight: 760; }
    .grid { display: grid; grid-template-columns: 0.9fr 1.5fr; gap: 12px; align-items: start; }
    .panel { padding: 16px; overflow: hidden; }
    .panel h2 { margin: 0 0 12px; font-size: 16px; }
    .day-list { display: grid; gap: 10px; }
    .day-row { border-top: 1px solid var(--border); padding-top: 10px; }
    .day-row:first-child { border-top: 0; padding-top: 0; }
    .day-head { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }
    .bar { height: 10px; display: flex; overflow: hidden; border-radius: 999px; background: var(--soft); margin: 8px 0 6px; }
    .bar span { display: block; min-width: 2px; }
    .bar .uploaded { background: var(--green); }
    .bar .pending { background: var(--amber); }
    .bar .review { background: var(--red); }
    .legend { display: flex; gap: 12px; flex-wrap: wrap; color: var(--muted); font-size: 12px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 999px; margin-right: 5px; }
    .dot.uploaded { background: var(--green); }
    .dot.pending { background: var(--amber); }
    .dot.review { background: var(--red); }
    .table-wrap { max-height: 620px; overflow: auto; border: 1px solid var(--border); border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    th { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; background: #fbfcfe; position: sticky; top: 0; }
    .pill { display: inline-flex; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 999px; font-size: 12px; font-weight: 650; white-space: nowrap; }
    .pill.uploaded { color: #0b5c3c; background: #dff3ea; }
    .pill.approved_pending_upload { color: #764900; background: #fff0cf; }
    .pill.passed_not_approved, .pill.needs_review, .pill.in_progress, .pill.draft_no_mp4 { color: #8a2f2e; background: #ffe4e1; }
    .muted { color: var(--muted); }
    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .error { border-color: #efb1af; background: #fff2f1; color: #8a2f2e; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
    .empty { padding: 20px; text-align: center; color: var(--muted); }
    @media (max-width: 960px) {
      .topbar { align-items: stretch; flex-direction: column; }
      .statusline { justify-content: flex-start; }
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid { grid-template-columns: 1fr; }
      .filters input { min-width: 100%; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="/vendor/react.development.js"></script>
  <script src="/vendor/react-dom.development.js"></script>
  <script>
    const h = React.createElement;
    const STATUS_LABEL = {
      uploaded: 'Uploaded',
      approved_pending_upload: 'Approved, not uploaded',
      passed_not_approved: 'Passed, not approved',
      needs_review: 'Needs review',
      draft_no_mp4: 'Draft, no MP4',
      in_progress: 'In progress'
    };
    const POLL_MS = 30000;

    function fmtTime(value) {
      if (!value) return 'unknown';
      try {
        return new Intl.DateTimeFormat(undefined, {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'
        }).format(new Date(value));
      } catch {
        return value;
      }
    }

    function fetchDashboard(setState) {
      setState(prev => ({ ...prev, loading: true, error: null }));
      fetch('/api/dashboard?ts=' + Date.now(), { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error('Dashboard API returned ' + res.status);
          return res.json();
        })
        .then(payload => {
          setState(prev => ({ ...prev, payload, loading: false, error: null, lastSeen: new Date().toISOString() }));
        })
        .catch(error => {
          setState(prev => ({ ...prev, loading: false, error: error.message || String(error) }));
        });
    }

    function useDashboard() {
      const [state, setState] = React.useState({ payload: null, loading: true, error: null, lastSeen: null });
      React.useEffect(() => {
        fetchDashboard(setState);
        const id = setInterval(() => fetchDashboard(setState), POLL_MS);
        return () => clearInterval(id);
      }, []);
      return [state, () => fetchDashboard(setState)];
    }

    function applyFilters(lessons, filters) {
      const needle = filters.search.trim().toLowerCase();
      return lessons.filter(row => {
        if (filters.date !== 'all' && row.production_date !== filters.date) return false;
        if (filters.status !== 'all' && row.status !== filters.status) return false;
        if (needle && ![row.course, row.module, row.slug].join(' ').toLowerCase().includes(needle)) return false;
        return true;
      });
    }

    function Kpis({ rows }) {
      const count = fn => rows.filter(fn).length;
      const cards = [
        ['Lessons', rows.length],
        ['MP4 Ready', count(r => r.has_mp4)],
        ['Quality Pass', count(r => r.verdict === 'pass')],
        ['Approved', count(r => r.approved)],
        ['Uploaded', count(r => r.youtube_uploaded)],
        ['Pending', count(r => r.status === 'approved_pending_upload')]
      ];
      return h('section', { className: 'kpis' }, cards.map(([label, value]) =>
        h('div', { className: 'kpi', key: label },
          h('div', { className: 'label' }, label),
          h('div', { className: 'value' }, value)
        )
      ));
    }

    function DailyProduction({ rows }) {
      const byDay = new Map();
      rows.forEach(row => {
        const bucket = byDay.get(row.production_date) || { total: 0, uploaded: 0, pending: 0, review: 0 };
        bucket.total += 1;
        if (row.youtube_uploaded) bucket.uploaded += 1;
        else if (row.status === 'approved_pending_upload') bucket.pending += 1;
        else bucket.review += 1;
        byDay.set(row.production_date, bucket);
      });
      const items = Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]));
      return h('div', { className: 'panel' },
        h('h2', null, 'Daily Production'),
        h('div', { className: 'day-list' }, items.length ? items.map(([day, bucket]) => {
          const pct = key => bucket.total ? Math.max((bucket[key] / bucket.total) * 100, bucket[key] ? 4 : 0) : 0;
          return h('div', { className: 'day-row', key: day },
            h('div', { className: 'day-head' }, h('span', null, day), h('span', null, bucket.total + ' lessons')),
            h('div', { className: 'bar' },
              h('span', { className: 'uploaded', style: { width: pct('uploaded') + '%' } }),
              h('span', { className: 'pending', style: { width: pct('pending') + '%' } }),
              h('span', { className: 'review', style: { width: pct('review') + '%' } })
            ),
            h('div', { className: 'legend' },
              h('span', null, h('i', { className: 'dot uploaded' }), bucket.uploaded + ' uploaded'),
              h('span', null, h('i', { className: 'dot pending' }), bucket.pending + ' approved pending'),
              h('span', null, h('i', { className: 'dot review' }), bucket.review + ' review/in progress')
            )
          );
        }) : h('div', { className: 'empty' }, 'No matching lessons.'))
      );
    }

    function LessonRows({ rows }) {
      const sorted = [...rows].sort((a, b) =>
        (b.production_date + ' ' + b.course + ' ' + (b.module_number || 999))
          .localeCompare(a.production_date + ' ' + a.course + ' ' + (a.module_number || 999))
      );
      return h('div', { className: 'panel' },
        h('h2', null, 'Lesson Detail'),
        h('div', { className: 'table-wrap' },
          h('table', null,
            h('thead', null, h('tr', null,
              ['Created', 'Lesson', 'Status', 'Quality', 'Uploaded', 'YouTube'].map(label => h('th', { key: label }, label))
            )),
            h('tbody', null, sorted.map(row => {
              const issue = row.quality_issues && row.quality_issues[0] && row.quality_issues[0].message;
              return h('tr', { key: row.slug },
                h('td', null, row.production_date),
                h('td', null,
                  h('strong', null, row.course),
                  h('br'),
                  h('span', { className: 'muted' }, row.module),
                  h('br'),
                  h('span', { className: 'muted' }, row.slug)
                ),
                h('td', null, h('span', { className: 'pill ' + row.status }, STATUS_LABEL[row.status] || row.status)),
                h('td', null,
                  row.quality_score == null
                    ? h('span', { className: 'muted' }, 'No audit')
                    : h(React.Fragment, null,
                        (row.verdict || '') + ' · ' + row.quality_score,
                        row.quality_source === 'live' ? h('div', { className: 'muted' }, 'Live audit fallback') : null,
                        issue ? h('div', { className: 'muted' }, issue) : null
                      )
                ),
                h('td', null, row.upload_date || h('span', { className: 'muted' }, 'Pending')),
                h('td', null,
                  row.youtube_uploaded
                    ? h('a', { href: row.youtube_url, target: '_blank', rel: 'noreferrer' }, row.youtube_video_id || 'YouTube')
                    : h('span', { className: 'muted' }, 'Not uploaded')
                )
              );
            }))
          )
        )
      );
    }

    function App() {
      const [state, refresh] = useDashboard();
      const [filters, setFilters] = React.useState({ date: 'all', status: 'all', search: '' });
      const payload = state.payload;
      const lessons = payload ? payload.lessons : [];
      const dates = Array.from(new Set(lessons.map(row => row.production_date))).sort().reverse();
      const statuses = Array.from(new Set(lessons.map(row => row.status))).sort();
      const rows = applyFilters(lessons, filters);
      return h('div', { className: 'shell' },
        h('div', { className: 'topbar' },
          h('div', null,
            h('h1', null, 'GIIS Lesson Video Live Monitor'),
            h('div', { className: 'subtle' },
              payload
                ? 'Data generated ' + fmtTime(payload.generated_at_local || payload.generated_at) + ' · ' + payload.timezone
                : 'Loading local dashboard data...'
            )
          ),
          h('div', { className: 'statusline' },
            h('span', { className: 'badge live' }, 'Auto refresh · 30s'),
            h('span', { className: 'badge' }, 'Last checked ' + fmtTime(state.lastSeen)),
            h('button', { type: 'button', onClick: refresh, disabled: state.loading }, state.loading ? 'Refreshing...' : 'Refresh now')
          )
        ),
        state.error ? h('div', { className: 'error' }, state.error) : null,
        h('div', { className: 'filters' },
          h('select', {
            value: filters.date,
            onChange: event => setFilters({ ...filters, date: event.target.value })
          }, h('option', { value: 'all' }, 'All dates'), dates.map(date => h('option', { key: date, value: date }, date))),
          h('select', {
            value: filters.status,
            onChange: event => setFilters({ ...filters, status: event.target.value })
          }, h('option', { value: 'all' }, 'All statuses'), statuses.map(status => h('option', { key: status, value: status }, STATUS_LABEL[status] || status))),
          h('input', {
            type: 'search',
            placeholder: 'Search course, module, or slug',
            value: filters.search,
            onChange: event => setFilters({ ...filters, search: event.target.value })
          })
        ),
        h(Kpis, { rows }),
        h('section', { className: 'grid' },
          h(DailyProduction, { rows }),
          h(LessonRows, { rows })
        )
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(h(App));
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}`);
  try {
    if (url.pathname === '/' || url.pathname === '/dashboard') {
      send(res, 200, html(), { 'Content-Type': 'text/html; charset=utf-8' });
      return;
    }
    if (url.pathname === '/api/dashboard') {
      sendJson(res, 200, await readDashboardPayload());
      return;
    }
    if (url.pathname === '/vendor/react.development.js') {
      serveFile(res, REACT_UMD, 'application/javascript; charset=utf-8');
      return;
    }
    if (url.pathname === '/vendor/react-dom.development.js') {
      serveFile(res, REACT_DOM_UMD, 'application/javascript; charset=utf-8');
      return;
    }
    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (error) {
    sendJson(res, 500, { error: error.message || String(error) });
  }
});

function listen(port) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < DEFAULT_PORT + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, HOST, () => {
    const address = server.address();
    console.log(`[lesson-dashboard] http://${HOST}:${address.port}`);
    console.log('[lesson-dashboard] polling source: tools/lesson-video/video_dashboard.py');
  });
}

listen(DEFAULT_PORT);
