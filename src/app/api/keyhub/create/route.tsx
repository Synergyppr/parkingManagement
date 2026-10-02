import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    propertyId: body.propertyId,
    name: body.name,
    displayOrder: body.displayOrder ?? 0,
    slots: body.slots || [],
  };

  const result = await PostContentData("KeyHub Create", payload);

  return NextResponse.json({ result });
}
