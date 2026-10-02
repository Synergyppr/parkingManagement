import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = body.ids.map((id: string) => ({ id }));

  const result = await PostContentData("KeySlot Delete", payload);

  return NextResponse.json({ result });
}
