import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    id: body.id,
    slotLabel: body.slotLabel,
    rowOrder: body.rowOrder ?? 0,
    columnOrder: body.columnOrder ?? 0,
    rowName: body.rowName,
    isActive: body.isActive ?? true,
    isOccupied: body.isOccupied ?? false,
  };

  const result = await PostContentData("KeySlot Update", payload);

  return NextResponse.json({ result });
}
