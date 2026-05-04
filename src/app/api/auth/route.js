import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = "134679";
const SESSION_COOKIE = "admin_session";
const SESSION_VALUE = "authenticated";

export async function POST(request) {
  const { password } = await request.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
