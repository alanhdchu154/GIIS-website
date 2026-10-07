const SCHOOL_TIME_ZONE = 'America/Chicago';

function schoolDateOnly(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHOOL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function hasEffectiveGraduationDate(graduationDate, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(graduationDate || ''))) return false;
  const [year, month, day] = graduationDate.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return false;
  const today = schoolDateOnly(now);
  return Boolean(today && graduationDate <= today);
}

export { SCHOOL_TIME_ZONE };
