import { NextResponse } from "next/server";
import { getAllBooks, searchBooksAdmin } from "@/lib/repositories/books.repo";
import { calcShiur } from "@/lib/constants/settings";
import {
  getAllBorrowers,
  getBorrowerById,
} from "@/lib/repositories/borrowers.repo";
import { getAllLoans } from "@/lib/repositories/loans.repo";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "stats";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const q = (searchParams.get("q") || "").trim();
    const sortBy = searchParams.get("sortBy") || "";
    const sortDir = searchParams.get("sortDir") || "asc";
    const status = searchParams.get("status") || "all";
    const policy = searchParams.get("policy") || "all";
    const room = searchParams.get("room") || "all";
    const area = searchParams.get("area") || "all";

    if (view === "stats") {
      const books = getAllBooks();
      const borrowers = getAllBorrowers();
      const allLoans = getAllLoans();
      const activeLoans = allLoans.filter(
        (l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "",
      );
      const activeBooks = books.filter((b) => b.isActive !== "FALSE");
      const allLoansForStats = getAllLoans();
      const borrowedBookIDs = new Set(
        allLoansForStats
          .filter((l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "")
          .map((l) => l.bookID),
      );
      const borrowedCount = borrowedBookIDs.size;
      return NextResponse.json({
        totalBooks: activeBooks.length,
        totalBorrowers: borrowers.length,
        activeLoans: activeLoans.length,
        totalLoans: allLoans.length,
        borrowedBooks: borrowedCount,
        availableBooks: activeBooks.length - borrowedCount,
      });
    }

    if (view === "loans") {
      const allLoans = getAllLoans();
      const booksMap = Object.fromEntries(
        getAllBooks().map((b) => [b.tempCopyCode, b]),
      );
      let loans = allLoans
        .filter((l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "")
        .map((loan) => ({
          ...loan,
          borrower: getBorrowerById(loan.borrowerID) ?? null,
          bookName: booksMap[loan.bookID]?.bookName || null,
        }));
      if (q)
        loans = loans.filter(
          (l) =>
            (l.bookID || "").toLowerCase().includes(q.toLowerCase()) ||
            (l.bookName || "").toLowerCase().includes(q.toLowerCase()) ||
            (l.borrowerID || "").includes(q) ||
            (l.borrower?.firstName || "")
              .toLowerCase()
              .includes(q.toLowerCase()) ||
            (l.borrower?.lastName || "")
              .toLowerCase()
              .includes(q.toLowerCase()),
        );
      loans = sortRows(loans, sortBy, sortDir);
      return NextResponse.json({
        loans: paginate(loans, page, limit),
        total: loans.length,
      });
    }

    if (view === "books") {
      const allLoans = getAllLoans();
      const borrowedIDs = new Set(
        allLoans
          .filter((l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "")
          .map((l) => l.bookID),
      );
      let books = searchBooksAdmin({
        q,
        status,
        policy,
        room,
        area,
        borrowedIDs,
      });
      books = books.map((b) => ({
        ...b,
        isBorrowed: borrowedIDs.has(String(b.tempCopyCode)),
      }));
      books = sortRows(books, sortBy, sortDir);
      return NextResponse.json({
        books: paginate(books, page, limit),
        total: books.length,
      });
    }

    if (view === "borrowers") {
      const allLoans = getAllLoans();
      const activeLoanMap = {};
      allLoans
        .filter((l) => !l.ReturnAtDate || l.ReturnAtDate.trim() === "")
        .forEach((l) => {
          activeLoanMap[l.borrowerID] = (activeLoanMap[l.borrowerID] || 0) + 1;
        });
      let borrowers = getAllBorrowers().map((b) => ({
        ...b,
        activeLoansCount: activeLoanMap[b.borrowerID] || 0,
        shiur: calcShiur(b.type, b.year),
      }));
      if (q)
        borrowers = borrowers.filter(
          (b) =>
            (b.borrowerID || "").includes(q) ||
            (b.firstName || "").toLowerCase().includes(q.toLowerCase()) ||
            (b.lastName || "").toLowerCase().includes(q.toLowerCase()) ||
            (b.shiur || "").toLowerCase().includes(q.toLowerCase()),
        );
      const type = searchParams.get("type");
      if (type && type !== "all")
        borrowers = borrowers.filter((b) => b.type === type);
      borrowers = sortRows(borrowers, sortBy, sortDir);
      return NextResponse.json({
        borrowers: paginate(borrowers, page, limit),
        total: borrowers.length,
      });
    }

    return NextResponse.json({ error: "view לא מוכר" }, { status: 400 });
  } catch (err) {
    console.error("[GET /api/admin]", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

function sortRows(rows, sortBy, sortDir) {
  if (!sortBy) return rows;
  return [...rows].sort((a, b) => {
    const av = (a[sortBy] || "").toString();
    const bv = (b[sortBy] || "").toString();

    // מיון תאריך DD/MM/YYYY
    const dateRe = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const am = av.match(dateRe);
    const bm = bv.match(dateRe);
    if (am && bm) {
      const ad = new Date(`${am[3]}-${am[2]}-${am[1]}`);
      const bd = new Date(`${bm[3]}-${bm[2]}-${bm[1]}`);
      return sortDir === "desc" ? bd - ad : ad - bd;
    }

    // מיון מספרי
    const an = parseFloat(av);
    const bn = parseFloat(bv);
    if (!isNaN(an) && !isNaN(bn)) {
      return sortDir === "desc" ? bn - an : an - bn;
    }

    // מיון טקסטואלי
    return sortDir === "desc"
      ? bv.localeCompare(av, "he")
      : av.localeCompare(bv, "he");
  });
}

function paginate(rows, page, limit) {
  return rows.slice((page - 1) * limit, page * limit);
}
