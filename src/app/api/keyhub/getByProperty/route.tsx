import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    propertyId: body.propertyId,
  };

  const result = await PostContentData("KeyHub Get By Property", payload);

  return NextResponse.json({ result });
}
