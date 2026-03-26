import { NextResponse } from "next/server";
import { backupAll, listBackups } from "@/lib/backup";

export async function POST() {
  try {
    const result = backupAll();
    if (!result.success)
      return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const backups = listBackups();
    return NextResponse.json({ backups });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
