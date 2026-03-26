import { readCsv } from '../csv/csvReader.js';
import { writeCsv } from '../csv/csvWriter.js';
import { withLock } from '../csv/csvLock.js';
import { CSV_PATHS } from '../csv/csvPaths.js';

const HEADERS = ['waitlistID','serialNum','borrowerID','requestedAt','notifiedAt','status'];

function getAll() {
  try { return readCsv(CSV_PATHS.waitlist); } catch { return []; }
}

export function getWaitlistForBook(serialNum) {
  return getAll().filter(w => w.serialNum === String(serialNum) && w.status === 'waiting');
}

export function getBorrowerWaitlist(borrowerID) {
  return getAll().filter(w => w.borrowerID === String(borrowerID) && w.status === 'waiting');
}

export async function addToWaitlist(serialNum, borrowerID) {
  return withLock('waitlist', () => {
    const rows = getAll();
    // בדיקה שלא קיים כבר
    const exists = rows.find(w => w.serialNum === String(serialNum) && w.borrowerID === String(borrowerID) && w.status === 'waiting');
    if (exists) return { success: false, error: 'כבר רשום לרשימת ההמתנה לספר זה' };

    const newEntry = {
      waitlistID:  `W${Date.now()}`,
      serialNum:      String(serialNum),
      borrowerID:  String(borrowerID),
      requestedAt: new Date().toLocaleDateString('he-IL'),
      notifiedAt:  '',
      status:      'waiting',
    };
    rows.push(newEntry);
    writeCsv(CSV_PATHS.waitlist, rows, HEADERS);
    return { success: true, entry: newEntry };
  });
}

export async function notifyWaitlist(serialNum) {
  return withLock('waitlist', () => {
    const rows = getAll();
    const waiting = rows.filter(w => w.serialNum === String(serialNum) && w.status === 'waiting');
    if (waiting.length === 0) return [];

    const now = new Date().toLocaleDateString('he-IL');
    const notified = [];
    const updated = rows.map(w => {
      if (w.serialNum === String(serialNum) && w.status === 'waiting') {
        notified.push(w);
        return { ...w, status: 'notified', notifiedAt: now };
      }
      return w;
    });
    writeCsv(CSV_PATHS.waitlist, updated, HEADERS);
    return notified;
  });
}

export async function removeFromWaitlist(serialNum, borrowerID) {
  return withLock('waitlist', () => {
    const rows = getAll();
    const updated = rows.map(w =>
      (w.serialNum === String(serialNum) && w.borrowerID === String(borrowerID) && w.status === 'waiting')
        ? { ...w, status: 'cancelled' }
        : w
    );
    writeCsv(CSV_PATHS.waitlist, updated, HEADERS);
  });
}
