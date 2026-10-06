import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.ANPR_API_KEY;
  const baseUrl = process.env.ANPR_API_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: "ANPR API not configured" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  try {
    const anprForm = new FormData();
    anprForm.append("file", file);

    const response = await fetch(`${baseUrl}/v1/car`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: anprForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANPR] API error:", response.status, errorText);
      return NextResponse.json(
        { error: "ANPR analysis failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ANPR] Request failed:", error);
    return NextResponse.json(
      { error: "ANPR request failed" },
      { status: 500 }
    );
  }
}
