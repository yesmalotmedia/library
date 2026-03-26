import { NextResponse } from 'next/server';
import { getBookById } from '@/lib/repositories/books.repo';
import { getLoanById } from '@/lib/repositories/loans.repo';

export async function GET(request, { params }) {
  try {
    const { copyId } = await params; // copyId param = serialNum
    const book = getBookById(copyId);
    if (!book) return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });

    const isBorrowed = !!(book.active_loan_id?.trim());
    let activeLoan   = null;
    if (isBorrowed) {
      activeLoan = getLoanById(book.active_loan_id);
    }

    return NextResponse.json({ ...book, isBorrowed, activeLoan });
  } catch (err) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
