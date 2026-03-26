import { NextResponse } from 'next/server';
import { returnBook } from '@/lib/services/returns.service';
import { getBorrowerById } from '@/lib/repositories/borrowers.repo';
import { sendSms, buildWaitlistNotifyMessage } from '@/lib/services/sms.service';

export async function POST(request) {
  try {
    const { serialNum } = await request.json();
    if (!serialNum) return NextResponse.json({ error: 'חסר מספר ספר' }, { status: 400 });

    const result = await returnBook(serialNum);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    const smsResults = [];
    for (const waiting of (result.waitlistNotified || [])) {
      const waitingBorrower = getBorrowerById(waiting.borrowerID);
      if (waitingBorrower?.phone) {
        const msg = buildWaitlistNotifyMessage(waitingBorrower.firstName, result.book?.bookName || serialNum);
        const smsResult = await sendSms(waitingBorrower.phone, msg);
        smsResults.push({ borrowerID: waiting.borrowerID, ...smsResult });
      }
    }

    return NextResponse.json({ ...result, smsResults, waitlistCount: result.waitlistNotified?.length || 0 });
  } catch (err) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
