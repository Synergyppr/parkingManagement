import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetVehicleByPatronPhone
// Backend expects the full international number: e.g. "+17874849124"
export async function POST(req: Request) {
  const body = await req.json();

  const rawPhone = (body?.phoneNumber || "").trim();

  // Must start with "+" and contain at least 10 digits after the country code
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length < 10) {
    return NextResponse.json({ result: null });
  }

  // Preserve the leading "+" if present, otherwise prefix with "+"
  const fullPhone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

  const result = await PostContentData("Get Vehicle By Patron Phone", {
    phoneNumber: fullPhone,
  });

  return NextResponse.json({ result });
}
