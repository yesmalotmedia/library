// שנת המחזור הנוכחית — לעדכן בתחילת כל שנה
export const CURRENT_YEAR = 51;

const SHIUR_MAP = { 1:'א', 2:'ב', 3:'ג', 4:'ד', 5:'ה', 6:'ו', 7:'ז', 8:'ח' };

export function calcShiur(type, year) {
  if (!type || type === 'רב') return 'רב';
  if (type !== 'תלמיד') return type; // מבקשי פניך, בני מנשה, צוות, אורח
  if (!year || year === '') return 'בוגר';
  const diff = CURRENT_YEAR - parseInt(year) + 1;
  return SHIUR_MAP[diff] || 'בוגר';
}
