import fs from "fs";
import path from "path";
import { CSV_PATHS } from "./csv/csvPaths.js";

const BACKUP_DIR = "G:\\האחסון שלי\\library-backup";
const MAX_BACKUPS = 30;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function timestamp() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${d}-${m}-${y}_${h}-${min}`;
}

export function backupFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    ensureBackupDir();
    const name = path.basename(filePath, ".csv");
    const dest = path.join(BACKUP_DIR, `${name}_${timestamp()}.csv`);
    fs.copyFileSync(filePath, dest);
    cleanOldBackups(name);
  } catch (err) {
    console.error("[Backup] שגיאה:", err);
  }
}

export function backupAll() {
  try {
    ensureBackupDir();
    const ts = timestamp();
    const backed = [];
    for (const [name, filePath] of Object.entries(CSV_PATHS)) {
      if (!fs.existsSync(filePath)) continue;
      const dest = path.join(BACKUP_DIR, `${name}_${ts}.csv`);
      fs.copyFileSync(filePath, dest);
      backed.push(name);
      cleanOldBackups(name);
    }
    return { success: true, timestamp: ts, files: backed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function listBackups() {
  try {
    ensureBackupDir();
    return fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".csv"))
      .map((f) => ({
        name: f,
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
        created: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      }))
      .sort((a, b) => b.created - a.created);
  } catch {
    return [];
  }
}

function cleanOldBackups(name) {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith(`${name}_`) && f.endsWith(".csv"))
      .sort()
      .reverse();
    files
      .slice(MAX_BACKUPS)
      .forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
  } catch {}
}
