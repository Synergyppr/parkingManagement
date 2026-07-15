import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// GET /api/evertec/terminal-get-all
export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    property_id: body.id || body.property_id,
    application_id: process.env.EVERTEC_APPLICATION_ID || "",
  };

  const result = await PostContentData("Get All Terminals", payload);

  return NextResponse.json({ result });
}
