require('../lib/resolveDatabaseUrl');
const express = require('express');
const cors = require('cors');

const dbUrl = (process.env.DATABASE_URL || '').trim();
if (!dbUrl) {
  console.error('[fatal] DATABASE_URL is not set. Copy server/.env.example to server/.env');
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
  console.error('[fatal] DATABASE_URL must use postgresql:// (Prisma schema is PostgreSQL).');
  console.error('      Fix server/.env — see server/.env.example');
  process.exit(1);
}

const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const meRoutes = require('./routes/me');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn('[warn] Set a strong JWT_SECRET in .env (16+ chars) before production.');
}

const app = express();
// Behind Lightsail load balancer / nginx with HTTPS: set TRUST_PROXY=1 so req.ip / secure cookies work if you add them later.
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
const port = Number(process.env.PORT) || 4000;

const corsOrigin = process.env.CORS_ORIGIN || '';
if (!corsOrigin || corsOrigin === '*') {
  console.warn('[warn] CORS_ORIGIN is not set or is "*". Set it to your frontend URL in production (e.g. https://genesisideas.school).');
}
app.use(
  cors({
    origin: !corsOrigin || corsOrigin === '*'
      ? true
      : corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GIIS Transcript API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
    h1 { font-size: 1.25rem; }
    code { background: #f0f0f0; padding: 0.1em 0.35em; border-radius: 4px; }
    a { color: #2b3d6d; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Genesis of Ideas — Transcript API</h1>
  <p>This server exposes JSON APIs for transcripts and admin login. There is no web app on this URL.</p>
  <ul>
    <li><a href="/health"><code>GET /health</code></a> — liveness check</li>
    <li><code>POST /api/auth/login</code> — body: <code>{ "email", "password" }</code></li>
    <li><code>GET /api/students</code> — requires <code>Authorization: Bearer &lt;token&gt;</code></li>
  </ul>
  <p>See <code>server/DESIGN.md</code> in the repo for full API details.</p>
</body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'giis-transcript-api' });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/me', meRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const message = err.message || 'Server error';
  const status = err.status || 500;
  res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`Transcript API listening on http://localhost:${port}`);
});
