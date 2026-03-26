import { NextResponse } from 'next/server';
import { addBorrower, updateBorrower, deleteBorrower, getBorrowerById } from '@/lib/repositories/borrowers.repo';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.borrowerID || !body.firstName || !body.lastName) return NextResponse.json({ error: 'שדות חובה: ת"ז, שם פרטי, שם משפחה' }, { status: 400 });
    const result = await addBorrower(body);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json(result.borrower);
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}

export async function PUT(request) {
  try {
    const { borrowerID, ...updates } = await request.json();
    if (!borrowerID) return NextResponse.json({ error: 'חסר borrowerID' }, { status: 400 });
    const result = await updateBorrower(borrowerID, updates);
    if (!result) return NextResponse.json({ error: 'תלמיד לא נמצא' }, { status: 404 });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const { borrowerID } = await request.json();
    if (!borrowerID) return NextResponse.json({ error: 'חסר borrowerID' }, { status: 400 });
    const ok = await deleteBorrower(borrowerID);
    if (!ok) return NextResponse.json({ error: 'תלמיד לא נמצא' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}
