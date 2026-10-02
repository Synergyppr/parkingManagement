import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    id: body.id,
  };

  const result = await PostContentData("KeyHub Delete", payload);

  return NextResponse.json({ result });
}
