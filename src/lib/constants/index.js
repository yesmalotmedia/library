export const LOAN_DAYS_REGULAR = 7; // השאלה רגילה
export const LOAN_DAYS_SHORT = 2; // השאלה קצרה
export const LOAN_DAYS = 7; // ברירת מחדל (תאימות לאחור)
export const MAX_LOANS_PER_BORROWER = 10;

export const LOAN_POLICY = {
  REGULAR: "", // ריק = ללא הגבלה מיוחדת
  IN_PLACE: "לעיון במקום בלבד",
  SHORT: "השאלה לטווח קצר",
};

// ── הגבלות קלט ───────────────────────────────────────────
export const MAX_BORROWER_ID = 9; // ת"ז
export const MAX_COPY_CODE = 10; // קוד ספר
export const MAX_NAME = 50; // שם פרטי/משפחה
export const MAX_PHONE = 15; // טלפון
export const MAX_EMAIL = 100; // אימייל
export const MAX_COMMENT = 200; // הערות
export const MAX_BOOK_NAME = 40; // שם ספר
export const MAX_AUTHOR_NAME = 80; // שם מחבר
export const MAX_CATEGORY = 20; // קטגוריה
export const MAX_TAGS = 200; // תגיות
export const MAX_DESCRIPTION = 500; // תיאור
export const MAX_PASSWORD = 50; // סיסמה
