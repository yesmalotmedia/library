import { NextResponse } from 'next/server';
import { addToWaitlist, removeFromWaitlist, getBorrowerWaitlist } from '@/lib/repositories/waitlist.repo';
import { getBorrowerById } from '@/lib/repositories/borrowers.repo';
import { getBookById } from '@/lib/repositories/books.repo';

export async function POST(request) {
  try {
    const { serialNum, borrowerID } = await request.json();
    if (!serialNum || !borrowerID) return NextResponse.json({ error: 'חסרים שדות' }, { status: 400 });

    const book     = getBookById(serialNum);
    const borrower = getBorrowerById(borrowerID);
    if (!book)     return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });
    if (!borrower) return NextResponse.json({ error: 'תלמיד לא נמצא' }, { status: 404 });

    const result = await addToWaitlist(serialNum, borrowerID);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 });

    return NextResponse.json({ success: true, entry: result.entry });
  } catch (err) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { serialNum, borrowerID } = await request.json();
    await removeFromWaitlist(serialNum, borrowerID);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const borrowerID = searchParams.get('borrowerID');
    if (!borrowerID) return NextResponse.json({ error: 'חסר borrowerID' }, { status: 400 });
    const list = getBorrowerWaitlist(borrowerID);
    return NextResponse.json({ waitlist: list });
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
