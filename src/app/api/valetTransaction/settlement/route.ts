import { NextResponse } from "next/server";

// Evertec.settlement → POST /api/evertec/settlement/start-settle
// Triggers end-of-day settlement (batch clearing with the payment host).
export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.propertyId) {
    return NextResponse.json(
      {
        result: {
          status: "400",
          message: "Missing required field: propertyId.",
        },
      },
      { status: 400 }
    );
  }

  const endpoint = process.env.EVERTEC_SETTLEMENT_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      {
        result: {
          status: "500",
          message: "EVERTEC_SETTLEMENT_ENDPOINT is not configured.",
        },
      },
      { status: 500 }
    );
  }

  const payload = {
    property_id: body.propertyId,
    app_id: process.env.EVERTEC_APPLICATION_ID || "",
    terminal_id: body.terminalId ?? "",
    station_number: body.stationNumber || process.env.EVERTEC_ECR_STATION_NUMBER || "",
    cashier_id: body.cashierId ?? "",
    created_by: body.createdBy || body.cashierId || "",
    receipt_output: body.receiptOutput ?? "both",
  };

  try {
    console.log("[Settlement] Endpoint:", endpoint);
    console.log("[Settlement] REQUEST:", JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[Settlement] HTTP Status:", response.status);
    console.log("[Settlement] RESPONSE:", responseText);

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
    console.error("[Settlement] Fetch error:", errMsg);
    return NextResponse.json({
      result: {
        status: "500",
        message: `Fetch failed: ${errMsg}`,
      },
    });
  }
}
