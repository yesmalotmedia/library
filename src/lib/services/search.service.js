import { searchBooks, getBookById } from '../repositories/books.repo.js';
import { getLoanById } from '../repositories/loans.repo.js';
import { getBorrowerById } from '../repositories/borrowers.repo.js';

/**
 * Search books — status comes directly from books.csv (active_loan_id field).
 * No full scan of loans.csv needed.
 */
export function searchBooksWithStatus(query, limit = 50) {
  const books = searchBooks(query).slice(0, limit);
  return books.map(enrichBook);
}

export function getBookWithStatus(serialNum) {
  const book = getBookById(serialNum);
  if (!book) return null;
  return enrichBook(book);
}

function enrichBook(book) {
  const loanID = book.active_loan_id?.trim();
  const isBorrowed = !!loanID;

  let activeLoan = null;
  let currentBorrower = null;

  if (isBorrowed) {
    activeLoan = getLoanById(loanID);
    if (activeLoan) {
      currentBorrower = getBorrowerById(activeLoan.borrowerID);
    }
  }

  return { ...book, isBorrowed, activeLoan, currentBorrower };
}
