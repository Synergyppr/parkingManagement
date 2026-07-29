import { NextResponse } from "next/server";

// Valet Void → POST VALET_VOID_ENDPOINT
// Voids (cancels) a transaction.
export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.propertyId || !body?.transactionId) {
    return NextResponse.json(
      {
        result: {
          status: "400",
          message: "Missing required fields: propertyId, transactionId.",
        },
      },
      { status: 400 }
    );
  }

  const endpoint = process.env.VALET_VOID_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      {
        result: {
          status: "500",
          message: "VALET_VOID_ENDPOINT is not configured.",
        },
      },
      { status: 500 }
    );
  }

  const payload = {
    propertyId: body.propertyId,
    transactionId: body.transactionId,
    terminalId: body.terminalId ?? "",
    pin: body.pin ?? "",
    latitude: body.latitude ?? 0,
    longitude: body.longitude ?? 0,
    receiptEmail: body.receiptEmail ?? "yes",
    receiptOutput: body.receiptOutput ?? "both",
    notes: body.notes ?? "",
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
