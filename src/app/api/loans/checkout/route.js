import { NextResponse } from 'next/server';
import { checkoutBook } from '@/lib/services/checkout.service';

export async function POST(request) {
  try {
    const { serialNum, borrowerID } = await request.json();
    if (!serialNum || !borrowerID) return NextResponse.json({ error: 'חסרים שדות' }, { status: 400 });
    const result = await checkoutBook(serialNum, borrowerID);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
