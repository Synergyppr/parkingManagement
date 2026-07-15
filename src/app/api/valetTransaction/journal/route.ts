import { NextResponse } from "next/server";

// Evertec.journal → POST /api/evertec/reports/journal
// Retrieves ECR transaction details from the current batch (reference numbers, amounts, etc.)
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

  const endpoint = process.env.EVERTEC_JOURNAL_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      {
        result: {
          status: "500",
          message: "EVERTEC_JOURNAL_ENDPOINT is not configured.",
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
    target_reference: body.targetReference ?? "",
  };

  try {
    console.log("[Journal] Endpoint:", endpoint);
    console.log("[Journal] REQUEST:", JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[Journal] HTTP Status:", response.status);
    console.log("[Journal] RESPONSE:", responseText);

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
    console.error("[Journal] Fetch error:", errMsg);
    return NextResponse.json({
      result: {
        status: "500",
        message: `Fetch failed: ${errMsg}`,
      },
    });
  }
}
