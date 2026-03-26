import { NextResponse } from 'next/server';
import { getAllBooks } from '@/lib/repositories/books.repo';
import { getAllBorrowers } from '@/lib/repositories/borrowers.repo';
import { getActiveLoans } from '@/lib/repositories/loans.repo';

export async function GET() {
  try {
    const books = getAllBooks();
    const borrowers = getAllBorrowers();
    const activeLoans = getActiveLoans();
    return NextResponse.json({
      status: 'ok',
      counts: {
        books: books.length,
        borrowers: borrowers.length,
        activeLoans: activeLoans.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
