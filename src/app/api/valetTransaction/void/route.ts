import { NextResponse } from "next/server";

// Evertec.void → POST /api/evertec/transaction/void
// Voids (cancels) a transaction within the current batch (same day, before settlement).
export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.propertyId || !body?.paymentTransactionId) {
    return NextResponse.json(
      {
        result: {
          status: "400",
          message:
            "Missing required fields: propertyId, paymentTransactionId.",
        },
      },
      { status: 400 }
    );
  }

  const endpoint = process.env.EVERTEC_VOID_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      {
        result: {
          status: "500",
          message: "EVERTEC_VOID_ENDPOINT is not configured.",
        },
      },
      { status: 500 }
    );
  }

  const payload = {
    property_id: body.propertyId,
    app_id: process.env.EVERTEC_APPLICATION_ID || "",
    terminal_id: body.terminalId ?? "",
    station_number: "",
    cashier_id: "",
    created_by: body.createdBy ?? "",
    payment_transaction_id: body.paymentTransactionId,
    target_reference: body.targetReference ?? "",
    trx_id: body.trxId ?? "",
    receipt_email: body.receiptEmail ?? "",
    receipt_output: body.receiptOutput ?? "both",
  };

  try {
    console.log("[Void] Endpoint:", endpoint);
    console.log("[Void] REQUEST:", JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[Void] HTTP Status:", response.status);
    console.log("[Void] RESPONSE:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        result: {
          status: String(response.status),
          message: "Non-JSON response from middleware",
          raw: responseText.substring(0, 500),
        },
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Void] Fetch error:", errMsg);
    return NextResponse.json({
      result: {
        status: "500",
        message: `Fetch failed: ${errMsg}`,
      },
    });
  }
}
