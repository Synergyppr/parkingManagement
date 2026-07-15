import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// POST /api/evertec/terminal-delete
export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    id: body.id,
    updated_by: body.updated_by || "system",
  };

  const result = await PostContentData("Delete Terminal", payload);

  return NextResponse.json({ result });
}
