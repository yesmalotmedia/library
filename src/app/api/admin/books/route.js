import { NextResponse } from 'next/server';
import { addBook, updateBook, updateBookCode, setBookInactive, setBookActive, deleteBook } from '@/lib/repositories/books.repo';

export async function POST(request) {
  try {
    const body = await request.json();

    // פעולה מרובה
    if (body.bulk) {
      const { action, ids, updates } = body;
      const results = [];
      for (const id of ids) {
        try {
          if (action === 'deactivate')    await setBookInactive(id);
          else if (action === 'activate') await setBookActive(id);
          else if (action === 'delete')   await deleteBook(id);
          else if (action === 'update')   await updateBook(id, updates);
          results.push({ id, success: true });
        } catch (e) {
          results.push({ id, success: false, error: e.message });
        }
      }
      return NextResponse.json({ results });
    }

    // הוספת ספר בודד
    if (!body.tempCopyCode || !body.bookName)
      return NextResponse.json({ error: 'שדות חובה: קוד ספר ושם ספר' }, { status: 400 });
    const result = await addBook(body);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json(result.book);
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { tempCopyCode, _originalCode, ...updates } = body;
    if (!tempCopyCode) return NextResponse.json({ error: 'חסר קוד ספר' }, { status: 400 });

    // אם הקוד השתנה — עדכן גם loans ו-waitlist
    if (_originalCode && _originalCode !== tempCopyCode) {
      const codeResult = await updateBookCode(_originalCode, tempCopyCode);
      if (!codeResult.success) return NextResponse.json({ error: codeResult.error }, { status: 409 });
      // עדכן שאר הפרטים
      const result = await updateBook(tempCopyCode, updates);
      if (!result) return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });
      return NextResponse.json(result);
    }

    // קוד לא השתנה — עדכון רגיל
    const result = await updateBook(tempCopyCode, updates);
    if (!result) return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const { tempCopyCode } = await request.json();
    if (!tempCopyCode) return NextResponse.json({ error: 'חסר קוד ספר' }, { status: 400 });
    const result = await deleteBook(tempCopyCode);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}

export async function PATCH(request) {
  try {
    const { tempCopyCode, action } = await request.json();
    if (!tempCopyCode) return NextResponse.json({ error: 'חסר קוד ספר' }, { status: 400 });
    if (action === 'deactivate') {
      const result = await setBookInactive(tempCopyCode);
      if (!result) return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });
      return NextResponse.json(result);
    }
    if (action === 'activate') {
      const result = await setBookActive(tempCopyCode);
      if (!result) return NextResponse.json({ error: 'ספר לא נמצא' }, { status: 404 });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 }); }
}
