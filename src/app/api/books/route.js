import { NextResponse } from "next/server";
import { searchBooks, getAllBooks } from "@/lib/repositories/books.repo";
import { getActiveLoanForBook } from "@/lib/repositories/loans.repo";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "80", 10);

    const books = q ? searchBooks(q) : [];

    const results = books.slice(0, limit).map((book) => {
      const activeLoan = book.active_loan_id?.trim()
        ? { loanID: book.active_loan_id }
        : null;
      return {
        ...book,
        isBorrowed: !!book.active_loan_id?.trim(),
        activeLoan,
      };
    });

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error("[GET /api/books]", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
