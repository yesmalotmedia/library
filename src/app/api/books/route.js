import { NextResponse } from 'next/server';
import { searchBooks, searchBooksAdvanced } from '@/lib/repositories/books.repo';
import { getActiveLoanForBook } from '@/lib/repositories/loans.repo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q      = searchParams.get('q') || '';
    const limit  = parseInt(searchParams.get('limit') || '80', 10);
    const fields = searchParams.get('fields')
      ? searchParams.get('fields').split(',')
      : ['bookName','authorName','tempCopyCode','category','tags','description','area'];

    // חיפוש מתקדם
    const advanced = searchParams.get('advanced') === 'true';
    const bookName   = searchParams.get('bookName')   || '';
    const authorName = searchParams.get('authorName') || '';
    const copyCode   = searchParams.get('copyCode')   || '';
    const category   = searchParams.get('category')   || '';
    const room       = searchParams.get('room')       || '';
    const area       = searchParams.get('area')       || '';
    const policy     = searchParams.get('policy')     || '';

    let books;
    if (advanced) {
      books = searchBooksAdvanced({ q, bookName, authorName, copyCode, category, room, area, policy });
    } else {
      books = q ? searchBooks(q, fields) : [];
    }

    const results = books.slice(0, limit).map(book => {
      const activeLoan = getActiveLoanForBook(book.tempCopyCode);
      return {
        ...book,
        isBorrowed: !!activeLoan,
        activeLoan: activeLoan ? { loanID: activeLoan.loanID, dueDate: activeLoan.dueDate } : null,
      };
    });

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error('[GET /api/books]', err);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
