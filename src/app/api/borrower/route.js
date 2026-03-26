import { NextResponse } from 'next/server';
import { getBorrowerById } from '@/lib/repositories/borrowers.repo';
import { getActiveLoansByBorrower, getAllLoans } from '@/lib/repositories/loans.repo';
import { getBookById } from '@/lib/repositories/books.repo';
import { getBorrowerWaitlist } from '@/lib/repositories/waitlist.repo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const borrowerID = searchParams.get('borrowerID');
    if (!borrowerID) return NextResponse.json({ error: 'חסר מספר ת"ז' }, { status: 400 });

    const borrower = getBorrowerById(borrowerID);
    if (!borrower) return NextResponse.json({ error: 'תלמיד לא נמצא במערכת' }, { status: 404 });

    // השאלות פעילות עם פרטי ספר
    const activeLoans = getActiveLoansByBorrower(borrowerID).map(loan => {
      const book = getBookById(loan.bookID);
      const now  = new Date();
      const due  = loan.dueDate ? new Date(loan.dueDate.split('/').reverse().join('-')) : null;
      const isOverdue = due && due < now;
      const daysLeft  = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;
      return { ...loan, book, isOverdue, daysLeft };
    });

    // היסטוריית השאלות (סגורות)
    const history = getAllLoans()
      .filter(l => l.borrowerID === String(borrowerID) && l.ReturnAtDate?.trim())
      .slice(-20)
      .map(loan => ({ ...loan, book: getBookById(loan.bookID) }));

    // רשימת המתנה
    const waitlist = getBorrowerWaitlist(borrowerID).map(w => ({
      ...w,
      book: getBookById(w.serialNum),
    }));

    return NextResponse.json({ borrower, activeLoans, history, waitlist });
  } catch (err) {
    console.error('[GET /api/borrower]', err);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
