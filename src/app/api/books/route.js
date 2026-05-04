import { NextResponse } from "next/server";
import {
  searchBooks,
  searchBooksAdvanced,
} from "@/lib/repositories/books.repo";
import { getActiveLoanForBook } from "@/lib/repositories/loans.repo";

const PAGE_SIZE = 100;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10),
      PAGE_SIZE,
    );
    const fields = searchParams.get("fields")
      ? searchParams.get("fields").split(",")
      : [
          "bookName",
          "authorName",
          "tempCopyCode",
          "category",
          "tags",
          "description",
          "area",
        ];

    const advanced = searchParams.get("advanced") === "true";
    const bookName = searchParams.get("bookName") || "";
    const authorName = searchParams.get("authorName") || "";
    const copyCode = searchParams.get("copyCode") || "";
    const category = searchParams.get("category") || "";
    const room = searchParams.get("room") || "";
    const area = searchParams.get("area") || "";
    const policy = searchParams.get("policy") || "";

    // מינימום 2 תווים לחיפוש חופשי
    if (!advanced && q.trim().length < 2 && !q.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    }

    let books;
    if (advanced) {
      books = searchBooksAdvanced({
        q,
        bookName,
        authorName,
        copyCode,
        category,
        room,
        area,
        policy,
      });
    } else {
      books = q ? searchBooks(q, fields) : [];
    }

    const total = books.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = books.slice(offset, offset + limit);

    const results = paginated.map((book) => {
      const activeLoan = getActiveLoanForBook(book.tempCopyCode);
      return {
        ...book,
        isBorrowed: !!activeLoan,
        activeLoan: activeLoan
          ? { loanID: activeLoan.loanID, dueDate: activeLoan.dueDate }
          : null,
      };
    });

    return NextResponse.json({ results, total, page, totalPages });
  } catch (err) {
    console.error("[GET /api/books]", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
