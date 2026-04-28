import { NextResponse } from 'next/server';
import { getBookById } from '@/lib/repositories/books.repo';
import { getActiveLoanForBook } from '@/lib/repositories/loans.repo';
import { getBorrowerById } from '@/lib/repositories/borrowers.repo';

export async function GET(request, { params }) {
  try {
    const { copyId } = await params;
    const book = getBookById(copyId);
    if (!book) return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });

    const activeLoan = getActiveLoanForBook(copyId);
    const isBorrowed = !!activeLoan;

    let borrower = null;
    if (activeLoan?.borrowerID) {
      const b = getBorrowerById(activeLoan.borrowerID);
      if (b) borrower = { firstName: b.firstName, lastName: b.lastName, phone: b.phone, borrowerID: b.borrowerID };
    }

    return NextResponse.json({
      ...book,
      isBorrowed,
      activeLoan: activeLoan ? { ...activeLoan, borrower } : null,
    });
  } catch (err) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
