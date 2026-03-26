import { readCsv } from '../csv/csvReader.js';
import { writeCsv } from '../csv/csvWriter.js';
import { withLock } from '../csv/csvLock.js';
import { CSV_PATHS } from '../csv/csvPaths.js';

const HEADERS = ['serialNum','borrowerID','firstName','lastName','type','year','phone','email','isBlocked','comments'];

export function getAllBorrowers() {
  return readCsv(CSV_PATHS.borrowers);
}

export function getBorrowerById(borrowerID) {
  return getAllBorrowers().find(b => b.borrowerID === String(borrowerID)) ?? null;
}

export function searchBorrowers(query) {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  return getAllBorrowers().filter(b =>
    (b.borrowerID || '').includes(q) ||
    (b.firstName  || '').toLowerCase().includes(q) ||
    (b.lastName   || '').toLowerCase().includes(q)
  );
}

export async function updateBorrower(borrowerID, updates) {
  return withLock('borrowers', () => {
    const rows = readCsv(CSV_PATHS.borrowers);
    let found = null;
    const updated = rows.map(b => {
      if (b.borrowerID === String(borrowerID)) {
        found = { ...b, ...updates };
        return found;
      }
      return b;
    });
    if (!found) return null;
    writeCsv(CSV_PATHS.borrowers, updated, HEADERS);
    return found;
  });
}

export async function addBorrower(borrowerData) {
  return withLock('borrowers', () => {
    const rows = readCsv(CSV_PATHS.borrowers);
    const exists = rows.find(b => b.borrowerID === String(borrowerData.borrowerID));
    if (exists) return { success: false, error: 'תלמיד עם ת"ז זו כבר קיים' };
    const maxSerial = rows.reduce((max, b) => Math.max(max, parseInt(b.serialNum || 0)), 0);
    const newBorrower = { serialNum: String(maxSerial + 1), isBlocked: 'FALSE', comments: '', ...borrowerData };
    rows.push(newBorrower);
    writeCsv(CSV_PATHS.borrowers, rows, HEADERS);
    return { success: true, borrower: newBorrower };
  });
}

export async function deleteBorrower(borrowerID) {
  return withLock('borrowers', () => {
    const rows = readCsv(CSV_PATHS.borrowers);
    const filtered = rows.filter(b => b.borrowerID !== String(borrowerID));
    if (filtered.length === rows.length) return false;
    writeCsv(CSV_PATHS.borrowers, filtered, HEADERS);
    return true;
  });
}
