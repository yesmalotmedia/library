import { readCsv } from "../csv/csvReader.js";
import { writeCsv } from "../csv/csvWriter.js";
import { withLock } from "../csv/csvLock.js";
import { CSV_PATHS } from "../csv/csvPaths.js";
import Fuse from "fuse.js";

const HEADERS = [
  "serialNum",
  "copyCode",
  "bookName",
  "authorName",
  "authorRole",
  "authorAlias",
  "description",
  "notes",
  "category",
  "room",
  "InsideBook",
  "area",
  "tags",
  "loan_policy",
  "tempCopyCode",
  "isActive",
];

// ── Cache ─────────────────────────────────────────────────
let _booksCache = null;
let _fuseIndex = null;

export function invalidateBooksCache() {
  _booksCache = null;
  _fuseIndex = null;
}

export function getAllBooks() {
  if (!_booksCache) {
    _booksCache = readCsv(CSV_PATHS.books);
  }
  return _booksCache;
}

export function getActiveBooks() {
  return getAllBooks().filter((b) => b.isActive !== "FALSE");
}

function getFuseIndex() {
  if (!_fuseIndex) {
    _fuseIndex = new Fuse(getActiveBooks(), {
      keys: [
        { name: "bookName", weight: 0.5 },
        { name: "authorName", weight: 0.3 },
        { name: "tempCopyCode", weight: 0.1 },
        { name: "category", weight: 0.05 },
        { name: "tags", weight: 0.05 },
      ],
      threshold: 0.5, // 0 = exact, 1 = match anything
      distance: 200,
      minMatchCharLength: 2,
      includeScore: true,
      useExtendedSearch: false,
      ignoreLocation: true, // חשוב לעברית — מחפש בכל מקום בטקסט
    });
  }
  return _fuseIndex;
}

export function searchBooks(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const words = q.split(/\s+/);

  // אם מילה אחת — חיפוש fuzzy
  if (words.length === 1) {
    return getFuseIndex()
      .search(q)
      .map((r) => r.item);
  }

  // אם כמה מילים — נסה fuzzy על הביטוי המלא, ואם אין תוצאות — AND בין המילים
  const fuseResults = getFuseIndex()
    .search(q)
    .map((r) => r.item);
  if (fuseResults.length > 0) return fuseResults;

  // AND fallback: כל המילים חייבות להופיע (בכל שדה, בכל סדר)
  const ql = words.map((w) => w.toLowerCase());
  return getActiveBooks().filter((b) => {
    const haystack = [
      b.bookName,
      b.authorName,
      b.tempCopyCode,
      b.category,
      b.tags,
    ]
      .join(" ")
      .toLowerCase();
    return ql.every((w) => haystack.includes(w));
  });
}

export function searchBooksAdmin({
  q,
  status,
  policy,
  room,
  area,
  borrowedIDs = new Set(),
}) {
  let books = getAllBooks();

  if (q && q.trim()) {
    const words = q.trim().split(/\s+/);
    // חיפוש fuzzy על כל הספרים (כולל לא פעילים)
    const fuse = new Fuse(books, {
      keys: [
        { name: "bookName", weight: 0.5 },
        { name: "authorName", weight: 0.3 },
        { name: "tempCopyCode", weight: 0.1 },
        { name: "category", weight: 0.05 },
        { name: "tags", weight: 0.05 },
      ],
      threshold: 0.5,
      distance: 200,
      minMatchCharLength: 2,
      includeScore: true,
      ignoreLocation: true,
    });

    const fuseResults = fuse.search(q.trim()).map((r) => r.item);
    if (fuseResults.length > 0) {
      books = fuseResults;
    } else {
      // AND fallback
      const ql = words.map((w) => w.toLowerCase());
      books = books.filter((b) => {
        const haystack = [
          b.bookName,
          b.authorName,
          b.tempCopyCode,
          b.category,
          b.tags,
          b.area,
        ]
          .join(" ")
          .toLowerCase();
        return ql.every((w) => haystack.includes(w));
      });
    }
  }

  if (status === "available")
    books = books.filter(
      (b) => !borrowedIDs.has(b.tempCopyCode) && b.isActive !== "FALSE",
    );
  if (status === "borrowed")
    books = books.filter((b) => borrowedIDs.has(b.tempCopyCode));
  if (status === "inactive")
    books = books.filter((b) => b.isActive === "FALSE");

  if (policy && policy !== "all") {
    if (policy === "regular")
      books = books.filter(
        (b) => !b.loan_policy?.trim() || b.loan_policy?.trim() === "רגיל",
      );
    if (policy === "short")
      books = books.filter((b) => b.loan_policy?.trim() === "השאלה לטווח קצר");
    if (policy === "inplace")
      books = books.filter((b) => b.loan_policy?.trim() === "לעיון במקום בלבד");
  }

  if (room && room !== "all") books = books.filter((b) => b.room === room);
  if (area && area !== "all") books = books.filter((b) => b.area === area);

  return books;
}

export function getBookById(id) {
  return getAllBooks().find((b) => b.tempCopyCode === String(id)) ?? null;
}

export async function updateBook(tempCopyCode, updates) {
  return withLock("books", () => {
    const rows = readCsv(CSV_PATHS.books);
    let found = null;
    const updated = rows.map((b) => {
      if (b.tempCopyCode === String(tempCopyCode)) {
        found = { ...b, ...updates };
        return found;
      }
      return b;
    });
    if (!found) return null;
    writeCsv(CSV_PATHS.books, updated, HEADERS);
    invalidateBooksCache();
    return found;
  });
}

export async function addBook(bookData) {
  return withLock("books", () => {
    const rows = readCsv(CSV_PATHS.books);
    const exists = rows.find(
      (b) => b.tempCopyCode === String(bookData.tempCopyCode),
    );
    if (exists) return { success: false, error: "קוד ספר זה כבר קיים" };
    const maxSerial = rows.reduce(
      (max, b) => Math.max(max, parseInt(b.serialNum || 0)),
      0,
    );
    const newBook = {
      serialNum: String(maxSerial + 1),
      copyCode: bookData.tempCopyCode || "",
      isActive: "TRUE",
      active_loan_id: "",
      ...bookData,
    };
    rows.push(newBook);
    writeCsv(CSV_PATHS.books, rows, HEADERS);
    invalidateBooksCache();
    return { success: true, book: newBook };
  });
}

export async function setBookInactive(tempCopyCode) {
  return updateBook(tempCopyCode, { isActive: "FALSE" });
}

export async function setBookActive(tempCopyCode) {
  return updateBook(tempCopyCode, { isActive: "TRUE" });
}

export async function deleteBook(tempCopyCode) {
  return withLock("books", () => {
    const rows = readCsv(CSV_PATHS.books);
    const book = rows.find((b) => b.tempCopyCode === String(tempCopyCode));
    if (!book) return { success: false, error: "ספר לא נמצא" };
    if (book.isActive !== "FALSE")
      return { success: false, error: "ניתן למחוק רק ספר שמסומן כלא פעיל" };
    if (book.active_loan_id?.trim())
      return { success: false, error: "לא ניתן למחוק ספר מושאל" };
    const filtered = rows.filter(
      (b) => b.tempCopyCode !== String(tempCopyCode),
    );
    writeCsv(CSV_PATHS.books, filtered, HEADERS);
    invalidateBooksCache();
    return { success: true };
  });
}

export async function updateBookCode(oldCode, newCode) {
  return withLock("books", () => {
    const books = readCsv(CSV_PATHS.books);
    const exists = books.find((b) => b.tempCopyCode === String(newCode));
    if (exists) return { success: false, error: "קוד ספר זה כבר קיים" };

    const updatedBooks = books.map((b) =>
      b.tempCopyCode === String(oldCode)
        ? { ...b, tempCopyCode: String(newCode), copyCode: String(newCode) }
        : b,
    );
    writeCsv(CSV_PATHS.books, updatedBooks, HEADERS);
    invalidateBooksCache();

    const loans = readCsv(CSV_PATHS.loans);
    const updatedLoans = loans.map((l) =>
      l.bookID === String(oldCode) ? { ...l, bookID: String(newCode) } : l,
    );
    writeCsv(CSV_PATHS.loans, updatedLoans, [
      "loanID",
      "borrowerID",
      "bookID",
      "loanDate",
      "dueDate",
      "ReturnAtDate",
      "comments",
    ]);

    const waitlist = readCsv(CSV_PATHS.waitlist);
    const updatedWaitlist = waitlist.map((w) =>
      w.serialNum === String(oldCode)
        ? { ...w, serialNum: String(newCode) }
        : w,
    );
    writeCsv(CSV_PATHS.waitlist, updatedWaitlist, [
      "waitlistID",
      "serialNum",
      "borrowerID",
      "requestedAt",
      "notifiedAt",
      "status",
    ]);

    return { success: true };
  });
}

export function searchBooksAdvanced({
  q,
  bookName,
  authorName,
  copyCode,
  category,
  room,
  area,
  policy,
}) {
  // אם יש רק חיפוש חופשי — השתמש ב-Fuse
  const hasSpecificFields =
    bookName || authorName || copyCode || category || room || area || policy;

  let books;
  if (q && q.trim() && !hasSpecificFields) {
    books = searchBooks(q);
  } else {
    books = getActiveBooks();

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      books = books.filter(
        (b) =>
          (b.bookName || "").toLowerCase().includes(query) ||
          (b.authorName || "").toLowerCase().includes(query) ||
          (b.tempCopyCode || "").toLowerCase().includes(query) ||
          (b.category || "").toLowerCase().includes(query) ||
          (b.tags || "").toLowerCase().includes(query) ||
          (b.description || "").toLowerCase().includes(query),
      );
    }
  }

  if (bookName && bookName.trim())
    books = books.filter((b) =>
      (b.bookName || "").toLowerCase().includes(bookName.trim().toLowerCase()),
    );
  if (authorName && authorName.trim())
    books = books.filter((b) =>
      (b.authorName || "")
        .toLowerCase()
        .includes(authorName.trim().toLowerCase()),
    );
  if (copyCode && copyCode.trim())
    books = books.filter((b) =>
      (b.tempCopyCode || "")
        .toLowerCase()
        .includes(copyCode.trim().toLowerCase()),
    );
  if (category && category.trim()) {
    const cat = category.trim().toLowerCase();
    books = books.filter(
      (b) =>
        (b.category || "").toLowerCase().includes(cat) ||
        (b.bookName || "").toLowerCase().includes(cat) ||
        (b.tags || "").toLowerCase().includes(cat) ||
        (b.description || "").toLowerCase().includes(cat),
    );
  }
  if (room && room !== "all") books = books.filter((b) => b.room === room);
  if (area && area !== "all") books = books.filter((b) => b.area === area);
  if (policy && policy !== "all") {
    if (policy === "regular")
      books = books.filter(
        (b) => !b.loan_policy?.trim() || b.loan_policy?.trim() === "רגיל",
      );
    if (policy === "short")
      books = books.filter((b) => b.loan_policy?.trim() === "השאלה לטווח קצר");
    if (policy === "inplace")
      books = books.filter((b) => b.loan_policy?.trim() === "לעיון במקום בלבד");
  }

  return books;
}
