const HEB_MONTHS = {
  'ינו': 0, 'פבר': 1, 'מרץ': 2, 'אפר': 3, 'מאי': 4, 'יוני': 5,
  'יולי': 6, 'אוג': 7, 'ספט': 8, 'אוק': 9, 'נוב': 10, 'דצמ': 11,
};

/**
 * Parse date strings like "4-ספט׳-19" or "2024-01-15".
 * Returns a Date or null.
 */
export function parseDate(str) {
  if (!str || str.trim() === '') return null;
  str = str.trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str);

  // Hebrew format: "4-ספט׳-19" or "4-ספט-19"
  const match = str.match(/^(\d{1,2})-([א-ת]+)[׳']?-(\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].slice(0, 3);
    const yearShort = parseInt(match[3], 10);
    const month = HEB_MONTHS[monthStr];
    if (month === undefined) return null;
    const year = yearShort < 100 ? 2000 + yearShort : yearShort;
    return new Date(year, month, day);
  }

  return null;
}

/**
 * Format a Date to ISO string YYYY-MM-DD.
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Today as YYYY-MM-DD string.
 */
export function today() {
  return formatDate(new Date());
}

/**
 * Add N days to a date, return ISO string.
 */
export function addDays(dateStr, days) {
  const d = parseDate(dateStr) || new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}
