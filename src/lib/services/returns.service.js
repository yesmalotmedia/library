import { getBookById } from '../repositories/books.repo.js';
import { getBorrowerById } from '../repositories/borrowers.repo.js';
import { getActiveLoanForBook, closeLoan } from '../repositories/loans.repo.js';
import { notifyWaitlist, getWaitlistForBook } from '../repositories/waitlist.repo.js';
import { today } from '../utils/dates.js';

export async function returnBook(serialNum) {
  const book = getBookById(serialNum);
  if (!book) return { success: false, error: `ספר עם מספר ${serialNum} לא נמצא` };

  const activeLoan = getActiveLoanForBook(serialNum);
  if (!activeLoan) {
    return { success: false, error: `הספר "${book.bookName}" אינו מושאל כרגע` };
  }

  const returnDate  = today();
  const updatedLoan = await closeLoan(activeLoan.loanID, returnDate);
  if (!updatedLoan) return { success: false, error: 'שגיאה בעדכון רשומת ההשאלה' };

  const borrower = getBorrowerById(activeLoan.borrowerID);

  const waitingBorrowers = getWaitlistForBook(serialNum);
  let waitlistNotified = [];
  if (waitingBorrowers.length > 0) {
    waitlistNotified = await notifyWaitlist(serialNum);
  }

  return { success: true, loan: updatedLoan, book, borrower, waitlistNotified };
}
