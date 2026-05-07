import { NextResponse } from "next/server";
import { getBorrowerById } from "@/lib/repositories/borrowers.repo";
import { getAllLoans } from "@/lib/repositories/loans.repo";
import { getBookById } from "@/lib/repositories/books.repo";
import { calcShiur } from "@/lib/constants/settings";

function normalizeTZ(id) {
  const s = String(id).trim();
  // נסה גם עם וגם בלי 0 מוביל
  return [s, s.replace(/^0+/, ""), s.padStart(9, "0")];
}

export async function GET(request, { params }) {
  try {
    const candidates = normalizeTZ(params.borrowerID);
    let borrower = null;
    let usedID = params.borrowerID;
    for (const id of candidates) {
      borrower = getBorrowerById(id);
      if (borrower) {
        usedID = id;
        break;
      }
    }

    if (!borrower)
      return NextResponse.json({ error: "שואל לא נמצא" }, { status: 404 });

    const allLoans = getAllLoans().filter(
      (l) => l.borrowerID === String(usedID),
    );
    const activeLoans = allLoans.filter(
      (l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "",
    );
    const history = allLoans.filter(
      (l) => l.ReturnAtDate && l.ReturnAtDate.trim() !== "",
    );

    const activeLoansWithBooks = activeLoans.map((l) => {
      const book = getBookById(l.bookID);
      return { ...l, bookName: book?.bookName || null };
    });

    return NextResponse.json({
      ...borrower,
      shiur: calcShiur(borrower.type, borrower.year),
      activeLoans: activeLoansWithBooks,
      totalLoans: allLoans.length,
      historyCount: history.length,
    });
  } catch (err) {
    console.error("Error fetching borrower data:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
