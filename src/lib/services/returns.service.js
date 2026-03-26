import { getBookById, clearBookActiveLoan } from '../repositories/books.repo.js';
import { getBorrowerById } from '../repositories/borrowers.repo.js';
import { getLoanById, closeLoan } from '../repositories/loans.repo.js';
import { notifyWaitlist, getWaitlistForBook } from '../repositories/waitlist.repo.js';
import { today } from '../utils/dates.js';

export async function returnBook(serialNum) {
  const book = getBookById(serialNum);
  if (!book) return { success: false, error: `ספר עם מספר ${serialNum} לא נמצא` };

  const loanID = book.active_loan_id;
  if (!loanID || loanID.trim() === '') {
    return { success: false, error: `הספר "${book.bookName}" אינו מושאל כרגע` };
  }

  const activeLoan = getLoanById(loanID);
  if (!activeLoan) return { success: false, error: 'רשומת השאלה לא נמצאה' };

  const returnDate  = today();
  const updatedLoan = await closeLoan(loanID, returnDate);
  if (!updatedLoan) return { success: false, error: 'שגיאה בעדכון רשומת ההשאלה' };

  await clearBookActiveLoan(serialNum);

  const borrower = getBorrowerById(activeLoan.borrowerID);

  const waitingBorrowers = getWaitlistForBook(serialNum);
  let waitlistNotified = [];
  if (waitingBorrowers.length > 0) {
    waitlistNotified = await notifyWaitlist(serialNum);
  }

  return { success: true, loan: updatedLoan, book, borrower, waitlistNotified };
}
