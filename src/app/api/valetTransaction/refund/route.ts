import { NextResponse } from "next/server";

// Evertec refund — routes to start-refund or start-ath-movil-refund based on paymentMethod
export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.propertyId || !body?.amount) {
    return NextResponse.json(
      {
        result: {
          status: "400",
          message: "Missing required fields: propertyId, amount.",
        },
      },
      { status: 400 }
    );
  }

  const isAthMovil =
    body.paymentMethod?.toLowerCase() === "athm" ||
    body.paymentMethod?.toLowerCase() === "ath movil" ||
    body.paymentMethod?.toLowerCase() === "ath_movil";

  const endpoint = isAthMovil
    ? process.env.EVERTEC_ATH_MOVIL_REFUND_ENDPOINT
    : process.env.EVERTEC_REFUND_ENDPOINT;

  if (!endpoint) {
    return NextResponse.json(
      {
        result: {
          status: "500",
          message: `${isAthMovil ? "EVERTEC_ATH_MOVIL_REFUND_ENDPOINT" : "EVERTEC_REFUND_ENDPOINT"} is not configured.`,
        },
      },
      { status: 500 }
    );
  }

  const payload: Record<string, unknown> = {
    property_id: body.propertyId,
    app_id: process.env.EVERTEC_APPLICATION_ID || "",
    terminal_id: body.terminalId ?? "",
    station_number: "",
    cashier_id: "",
    created_by: body.createdBy ?? "",
    trx_id: body.trxId ?? "",
    original_trx_id: body.originalTrxId ?? "",
    receipt_email: body.receiptEmail ?? "",
    receipt_output: body.receiptOutput ?? "both",
    amounts: {
      total: String(body.amount),
      base_state_tax: "0",
      base_reduced_tax: "0",
      tip: "0",
      state_tax: "0",
      reduced_tax: "0",
      city_tax: "0",
      cashback: "0",
    },
  };

  // ATH Movil refund requires phone number fields
  if (isAthMovil) {
    payload.phone_number = body.phoneNumber ?? "";
    payload.sms_phone = body.phoneNumber ?? "";
  }

  try {
    console.log(`[Refund${isAthMovil ? " ATH Movil" : ""}] Endpoint:`, endpoint);
    console.log(`[Refund] REQUEST:`, JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[Refund] HTTP Status:", response.status);
    console.log("[Refund] RESPONSE:", responseText);

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
    console.error("[Refund] Fetch error:", errMsg);
    return NextResponse.json({
      result: {
        status: "500",
        message: `Fetch failed: ${errMsg}`,
      },
    });
  }
}
