import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    id: body.id,
    name: body.name,
    displayOrder: body.displayOrder ?? 0,
    isActive: body.isActive ?? true,
  };

  const result = await PostContentData("KeyHub Update", payload);

  return NextResponse.json({ result });
}
