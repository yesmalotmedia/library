import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = "G:\\האחסון שלי\\library-backup";

export const CSV_PATHS = {
  books: path.join(DATA_DIR, "books.csv"),
  borrowers: path.join(DATA_DIR, "borrowers.csv"),
  loans: path.join(DATA_DIR, "loans.csv"),
  waitlist: path.join(DATA_DIR, "waitlist.csv"),
};

export const BACKUP_PATH = BACKUP_DIR;
