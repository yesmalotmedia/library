import { readCsv } from '../csv/csvReader.js';
import { writeCsv } from '../csv/csvWriter.js';
import { withLock } from '../csv/csvLock.js';
import { CSV_PATHS } from '../csv/csvPaths.js';

const HEADERS = [
  'serialNum','copyCode','bookName','authorName','authorRole','authorAlias',
  'description','notes','category','room','InsideBook','area','tags','loan_policy',
  'tempCopyCode','active_loan_id','isActive'
];

export function getAllBooks() {
  return readCsv(CSV_PATHS.books);
}

export function getActiveBooks() {
  return getAllBooks().filter(b => b.isActive !== 'FALSE');
}

export function searchBooks(query) {
  if (!query || query.trim() === '') return [];
  const q = query.trim().toLowerCase();
  return getActiveBooks().filter(b =>
    (b.bookName     || '').toLowerCase().includes(q) ||
    (b.authorName   || '').toLowerCase().includes(q) ||
    (b.tempCopyCode || '').toLowerCase().includes(q)
  );
}

export function searchBooksAdmin({ q, status, policy, room, area }) {
  let books = getAllBooks();

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    books = books.filter(b =>
      (b.bookName     || '').toLowerCase().includes(query) ||
      (b.authorName   || '').toLowerCase().includes(query) ||
      (b.tempCopyCode || '').toLowerCase().includes(query) ||
      (b.category     || '').toLowerCase().includes(query) ||
      (b.tags         || '').toLowerCase().includes(query) ||
      (b.description  || '').toLowerCase().includes(query) ||
      (b.area         || '').toLowerCase().includes(query)
    );
  }

  if (status === 'available') books = books.filter(b => !b.active_loan_id?.trim() && b.isActive !== 'FALSE');
  if (status === 'borrowed')  books = books.filter(b => !!b.active_loan_id?.trim());
  if (status === 'inactive')  books = books.filter(b => b.isActive === 'FALSE');

  if (policy && policy !== 'all') {
    if (policy === 'regular') books = books.filter(b => !b.loan_policy?.trim() || b.loan_policy?.trim() === 'רגיל');
    if (policy === 'short')   books = books.filter(b => b.loan_policy?.trim() === 'השאלה לטווח קצר');
    if (policy === 'inplace') books = books.filter(b => b.loan_policy?.trim() === 'לעיון במקום בלבד');
  }

  if (room && room !== 'all') books = books.filter(b => b.room === room);
  if (area && area !== 'all') books = books.filter(b => b.area === area);

  return books;
}

export function getBookById(id) {
  return getAllBooks().find(b => b.tempCopyCode === String(id)) ?? null;
}

export async function setBookActiveLoan(id, loanID) {
  return withLock('books', () => {
    const rows    = readCsv(CSV_PATHS.books);
    const updated = rows.map(b =>
      b.tempCopyCode === String(id) ? { ...b, active_loan_id: loanID } : b
    );
    writeCsv(CSV_PATHS.books, updated, HEADERS);
  });
}

export async function clearBookActiveLoan(id) {
  return withLock('books', () => {
    const rows    = readCsv(CSV_PATHS.books);
    const updated = rows.map(b =>
      b.tempCopyCode === String(id) ? { ...b, active_loan_id: '' } : b
    );
    writeCsv(CSV_PATHS.books, updated, HEADERS);
  });
}

export async function updateBook(tempCopyCode, updates) {
  return withLock('books', () => {
    const rows = readCsv(CSV_PATHS.books);
    let found  = null;
    const updated = rows.map(b => {
      if (b.tempCopyCode === String(tempCopyCode)) {
        found = { ...b, ...updates };
        return found;
      }
      return b;
    });
    if (!found) return null;
    writeCsv(CSV_PATHS.books, updated, HEADERS);
    return found;
  });
}

export async function addBook(bookData) {
  return withLock('books', () => {
    const rows = readCsv(CSV_PATHS.books);
    const exists = rows.find(b => b.tempCopyCode === String(bookData.tempCopyCode));
    if (exists) return { success: false, error: 'קוד ספר זה כבר קיים' };
    const maxSerial = rows.reduce((max, b) => Math.max(max, parseInt(b.serialNum || 0)), 0);
    const newBook = {
      serialNum: String(maxSerial + 1),
      copyCode: bookData.tempCopyCode || '',
      isActive: 'TRUE',
      active_loan_id: '',
      ...bookData,
    };
    rows.push(newBook);
    writeCsv(CSV_PATHS.books, rows, HEADERS);
    return { success: true, book: newBook };
  });
}

export async function setBookInactive(tempCopyCode) {
  return updateBook(tempCopyCode, { isActive: 'FALSE' });
}

export async function setBookActive(tempCopyCode) {
  return updateBook(tempCopyCode, { isActive: 'TRUE' });
}

export async function deleteBook(tempCopyCode) {
  return withLock('books', () => {
    const rows = readCsv(CSV_PATHS.books);
    const book = rows.find(b => b.tempCopyCode === String(tempCopyCode));
    if (!book) return { success: false, error: 'ספר לא נמצא' };
    if (book.isActive !== 'FALSE') return { success: false, error: 'ניתן למחוק רק ספר שמסומן כלא פעיל' };
    if (book.active_loan_id?.trim()) return { success: false, error: 'לא ניתן למחוק ספר מושאל' };
    const filtered = rows.filter(b => b.tempCopyCode !== String(tempCopyCode));
    writeCsv(CSV_PATHS.books, filtered, HEADERS);
    return { success: true };
  });
}

export async function updateBookCode(oldCode, newCode) {
  return withLock('books', () => {
    const books = readCsv(CSV_PATHS.books);
    const exists = books.find(b => b.tempCopyCode === String(newCode));
    if (exists) return { success: false, error: 'קוד ספר זה כבר קיים' };

    // עדכן books
    const updatedBooks = books.map(b =>
      b.tempCopyCode === String(oldCode)
        ? { ...b, tempCopyCode: String(newCode), copyCode: String(newCode) }
        : b
    );
    writeCsv(CSV_PATHS.books, updatedBooks, HEADERS);

    // עדכן loans
    const loans = readCsv(CSV_PATHS.loans);
    const updatedLoans = loans.map(l =>
      l.bookID === String(oldCode) ? { ...l, bookID: String(newCode) } : l
    );
    writeCsv(CSV_PATHS.loans, updatedLoans, ['loanID','borrowerID','bookID','loanDate','dueDate','ReturnAtDate','comments']);

    // עדכן waitlist
    const waitlist = readCsv(CSV_PATHS.waitlist);
    const updatedWaitlist = waitlist.map(w =>
      w.serialNum === String(oldCode) ? { ...w, serialNum: String(newCode) } : w
    );
    writeCsv(CSV_PATHS.waitlist, updatedWaitlist, ['waitlistID','serialNum','borrowerID','requestedAt','notifiedAt','status']);

    return { success: true };
  });
}
