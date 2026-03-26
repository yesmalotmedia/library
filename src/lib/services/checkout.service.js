import { getBookById, setBookActiveLoan } from '../repositories/books.repo.js';
import { getBorrowerById } from '../repositories/borrowers.repo.js';
import { addLoan, generateLoanId, getActiveLoansByBorrower } from '../repositories/loans.repo.js';
import { today, addDays } from '../utils/dates.js';
import { LOAN_DAYS_REGULAR, LOAN_DAYS_SHORT, MAX_LOANS_PER_BORROWER, LOAN_POLICY } from '../constants/index.js';

export async function checkoutBook(serialNum, borrowerID) {
  const book = getBookById(serialNum);
  if (!book) return { success: false, error: `ספר עם מספר ${serialNum} לא נמצא` };

  const borrower = getBorrowerById(borrowerID);
  if (!borrower) return { success: false, error: `תלמיד עם ת"ז ${borrowerID} לא נמצא` };

  if (borrower.isBlocked === 'TRUE' || borrower.isBlocked === 'true') {
    return { success: false, error: `תלמיד ${borrower.firstName} ${borrower.lastName} חסום במערכת` };
  }

  const policy = (book.loan_policy || '').trim();
  if (policy === LOAN_POLICY.IN_PLACE) {
    return { success: false, error: `הספר "${book.bookName}" מיועד לעיון במקום בלבד` };
  }

  if (book.active_loan_id && book.active_loan_id.trim() !== '') {
    return { success: false, error: `הספר "${book.bookName}" כבר מושאל כרגע` };
  }

  const activeLoans = getActiveLoansByBorrower(borrowerID);
  if (activeLoans.length >= MAX_LOANS_PER_BORROWER) {
    return { success: false, error: `לתלמיד ${borrower.firstName} יש כבר ${activeLoans.length} ספרים מושאלים (מקסימום ${MAX_LOANS_PER_BORROWER})` };
  }

  const loanDays = policy === LOAN_POLICY.SHORT ? LOAN_DAYS_SHORT : LOAN_DAYS_REGULAR;
  const loanDate = today();
  const dueDate  = addDays(loanDate, loanDays);
  const loanID   = generateLoanId();

  const loan = {
    loanID,
    borrowerID: String(borrowerID),
    bookID:     String(serialNum),
    loanDate,
    dueDate,
    ReturnAtDate: '',
    comments: '',
  };

  await addLoan(loan);
  await setBookActiveLoan(serialNum, loanID);

  return { success: true, loan, book, borrower };
}

export async function checkoutMultipleBooks(serialNums, borrowerID) {
  const borrower = getBorrowerById(borrowerID);
  if (!borrower) return { success: false, error: `תלמיד עם ת"ז ${borrowerID} לא נמצא` };

  if (borrower.isBlocked === 'TRUE' || borrower.isBlocked === 'true') {
    return { success: false, error: `תלמיד ${borrower.firstName} ${borrower.lastName} חסום במערכת` };
  }

  const activeLoans = getActiveLoansByBorrower(borrowerID);
  if (activeLoans.length + serialNums.length > MAX_LOANS_PER_BORROWER) {
    return { success: false, error: `לא ניתן להשאיל ${serialNums.length} ספרים — יחרוג מהמקסימום של ${MAX_LOANS_PER_BORROWER}` };
  }

  const results = [];
  const errors  = [];

  for (const serialNum of serialNums) {
    const result = await checkoutBook(serialNum, borrowerID);
    if (result.success) results.push(result);
    else errors.push({ serialNum, error: result.error });
  }

  return { success: true, results, errors, borrower };
}
