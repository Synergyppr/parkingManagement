import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/ValetTransaction
// The middleware handles POS terminal interaction internally.
// We pass: ticketId, propertyId, pin, lat/lng, paymentMethod,
// transactionTypeId, amount, terminalId, tip, receiptOutput, receiptEmail, notes
export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.ticketId || !body?.propertyId || !body?.pin) {
    return NextResponse.json(
      {
        result: {
          status: "400",
          message: "Missing required fields: ticketId, propertyId, pin.",
        },
      },
      { status: 400 }
    );
  }

  const payload = {
    ticketId: body.ticketId,
    propertyId: body.propertyId,
    pin: body.pin,
    latitude: body.latitude ?? 0,
    longitude: body.longitude ?? 0,
    paymentMethod: body.paymentMethod,
    transactionTypeId: body.transactionTypeId,
    // amount: body.amount ?? 0,
    terminalId: body.terminalId ?? "",
    applicationId: process.env.EVERTEC_APPLICATION_ID || "",
    ...(body.tip !== undefined && { tip: body.tip }),
    receiptOutput: body.receiptOutput ?? "both",
    receiptEmail: body.receiptEmail ?? "no",
    notes: body.notes ?? "",
  };

  console.log("[ValetTransaction] REQUEST:", { payload, hasTip: "tip" in payload, bodyTip: body.tip });

  const result = await PostContentData("Valet Transaction", payload);

  console.log("[ValetTransaction] RESPONSE:", { result });

  return NextResponse.json({ result });
}
