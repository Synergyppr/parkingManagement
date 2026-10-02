import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    keyHubId: body.keyHubId,
  };

  const result = await PostContentData("KeySlot Get By KeyHub", payload);

  return NextResponse.json({ result });
}
