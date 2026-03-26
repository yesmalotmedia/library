import { NextResponse } from 'next/server';
import { checkoutMultipleBooks } from '@/lib/services/checkout.service';

export async function POST(request) {
  try {
    const { serialNums, borrowerID } = await request.json();
    if (!serialNums?.length || !borrowerID) return NextResponse.json({ error: 'חסרים שדות' }, { status: 400 });
    const result = await checkoutMultipleBooks(serialNums, borrowerID);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
