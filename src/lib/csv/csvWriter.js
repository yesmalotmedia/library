import fs from "fs";
import { backupFile } from "../backup.js";

function escapeField(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function writeCsv(filePath, rows, headers) {
  backupFile(filePath);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeField(row[h] ?? "")).join(","),
    ),
  ];
  const content = lines.join("\n") + "\n";
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, filePath);
}
