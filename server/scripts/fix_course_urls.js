/**
 * Fixes broken OpenStax URLs in all course JSON files:
 * 1. Converts section-specific page paths (/pages/N-M-title) → /pages/N-introduction
 * 2. Replaces non-existent book slugs with working alternatives
 */

const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'financial-management':    'principles-management',
  'principles-marketing':    'introduction-business',
  'introduction-communication': '', // No good OpenStax equivalent — clear URL
};

function fixOpenStaxUrl(url) {
  if (!url || !url.includes('openstax.org/books/')) return url;

  let fixed = url;

  // Replace broken book slugs
  for (const [bad, good] of Object.entries(SLUG_MAP)) {
    if (fixed.includes(`/books/${bad}/`)) {
      if (!good) return ''; // clear URL
      fixed = fixed.replace(`/books/${bad}/`, `/books/${good}/`);
    }
  }

  // Convert section-specific page paths to chapter intro:
  // /pages/N-M-any-title → /pages/N-introduction
  // e.g. /pages/1-1-the-nature-of-writing → /pages/1-introduction
  // e.g. /pages/12-4-documentation → /pages/12-introduction
  fixed = fixed.replace(/\/pages\/(\d+)-\d+-[^?#\s]*/g, '/pages/$1-introduction');

  // Also handle /pages/N-0-introduction → /pages/N-introduction
  fixed = fixed.replace(/\/pages\/(\d+)-0-introduction/g, '/pages/$1-introduction');

  return fixed;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  let changed = false;

  for (const mod of (data.modules || [])) {
    for (const field of ['readingUrl', 'videoUrl', 'video2Url', 'practiceUrl']) {
      if (mod[field] && mod[field].includes('openstax.org')) {
        const fixed = fixOpenStaxUrl(mod[field]);
        if (fixed !== mod[field]) {
          mod[field] = fixed;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  }
  return false;
}

function collectFiles(dir) {
  let results = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...collectFiles(full));
    else if (e.name.endsWith('.json')) results.push(full);
  }
  return results;
}

const coursesDir = path.join(__dirname, '../prisma/courses');
const files = collectFiles(coursesDir);
let fixed = 0, unchanged = 0;

for (const f of files) {
  if (processFile(f)) {
    console.log('FIXED:', path.relative(coursesDir, f));
    fixed++;
  } else {
    unchanged++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Unchanged: ${unchanged}`);
