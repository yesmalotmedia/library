import { NextResponse } from 'next/server';
import { getBorrowerById } from '@/lib/repositories/borrowers.repo';
import { getActiveLoansByBorrower } from '@/lib/repositories/loans.repo';

export async function GET(request, { params }) {
  try {
    const borrower = getBorrowerById(params.borrowerID);
    if (!borrower) {
      return NextResponse.json({ error: 'שואל לא נמצא' }, { status: 404 });
    }
    const activeLoans = getActiveLoansByBorrower(params.borrowerID);
    return NextResponse.json({ ...borrower, activeLoans });
  } catch (err) {
    console.error('[GET /api/borrowers/:id]', err);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
