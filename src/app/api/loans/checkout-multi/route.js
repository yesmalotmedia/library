import { NextResponse } from "next/server";
import { checkoutMultipleBooks } from "@/lib/services/checkout.service";

export async function POST(request) {
  try {
    const { serialNums, borrowerID } = await request.json();
    console.log("checkout-multi:", { serialNums, borrowerID });
    if (!serialNums?.length || !borrowerID)
      return NextResponse.json({ error: "חסרים שדות" }, { status: 400 });
    const result = await checkoutMultipleBooks(serialNums, borrowerID);
    console.log("result:", result.success, result.error);
    if (!result.success)
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("checkout-multi error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
