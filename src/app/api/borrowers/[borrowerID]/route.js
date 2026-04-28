import { NextResponse } from "next/server";
import { getBorrowerById } from "@/lib/repositories/borrowers.repo";
import { getAllLoans } from "@/lib/repositories/loans.repo";
import { getBookById } from "@/lib/repositories/books.repo";
import { calcShiur } from "@/lib/constants/settings";

export async function GET(request, { params }) {
  try {
    const borrower = getBorrowerById(params.borrowerID);
    if (!borrower)
      return NextResponse.json({ error: "שואל לא נמצא" }, { status: 404 });

    const allLoans = getAllLoans().filter(
      (l) => l.borrowerID === String(params.borrowerID),
    );
    const activeLoans = allLoans.filter(
      (l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "",
    );
    const history = allLoans.filter(
      (l) => l.ReturnAtDate && l.ReturnAtDate.trim() !== "",
    );

    // הוסף שם ספר לכל השאלה פעילה
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
