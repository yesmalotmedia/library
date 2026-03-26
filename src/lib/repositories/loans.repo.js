import { readCsv } from '../csv/csvReader.js';
import { writeCsv } from '../csv/csvWriter.js';
import { withLock } from '../csv/csvLock.js';
import { CSV_PATHS } from '../csv/csvPaths.js';

const HEADERS = ['loanID','borrowerID','bookID','loanDate','dueDate','ReturnAtDate','comments'];
// bookID = serialNum של הספר

export function getAllLoans() {
  return readCsv(CSV_PATHS.loans);
}

export function getActiveLoans() {
  return getAllLoans().filter(l => !l.ReturnAtDate || l.ReturnAtDate.trim() === '');
}

export function getLoanById(loanID) {
  return getAllLoans().find(l => l.loanID === String(loanID)) ?? null;
}

export function getActiveLoanForBook(serialNum) {
  return getActiveLoans().find(l => l.bookID === String(serialNum)) ?? null;
}

export function getActiveLoansByBorrower(borrowerID) {
  return getActiveLoans().filter(l => l.borrowerID === String(borrowerID));
}

export async function addLoan(loanData) {
  return withLock('loans', () => {
    const rows = readCsv(CSV_PATHS.loans);
    rows.push(loanData);
    writeCsv(CSV_PATHS.loans, rows, HEADERS);
    return loanData;
  });
}

export async function closeLoan(loanID, returnDate) {
  return withLock('loans', () => {
    const rows = readCsv(CSV_PATHS.loans);
    let found  = null;
    const updated = rows.map(l => {
      if (l.loanID === loanID) {
        found = { ...l, ReturnAtDate: returnDate };
        return found;
      }
      return l;
    });
    if (!found) return null;
    writeCsv(CSV_PATHS.loans, updated, HEADERS);
    return found;
  });
}

export function generateLoanId() {
  const loans = getAllLoans();
  const ids   = loans.map(l => parseInt((l.loanID || '').replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
  const max   = ids.length ? Math.max(...ids) : 0;
  return `L${max + 1}`;
}
