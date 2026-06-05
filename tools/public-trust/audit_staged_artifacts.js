const { execFileSync } = require('child_process');

const BLOCKED_PATTERNS = [
  /^teaching-videos\//,
  /^umi\/handoffs\/.*foundation-video/i,
];

let staged = '';
try {
  staged = execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { encoding: 'utf8' });
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}

const files = staged.split('\0').filter(Boolean);
const blocked = files.filter((file) => BLOCKED_PATTERNS.some((pattern) => pattern.test(file)));

if (blocked.length > 0) {
  console.error('Staged artifact audit failed: do not commit lesson-video artifacts or foundation-video handoffs.');
  for (const file of blocked) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`Staged artifact audit passed: ${files.length} staged file(s) checked.`);
