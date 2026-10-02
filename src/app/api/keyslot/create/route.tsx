import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = body.slots.map(
    (slot: {
      keyHubId: string;
      slotLabel: string;
      rowOrder?: number;
      columnOrder?: number;
      rowName: string;
      isOccupied?: boolean;
    }) => ({
      keyHubId: slot.keyHubId,
      slotLabel: slot.slotLabel,
      rowOrder: slot.rowOrder ?? 0,
      columnOrder: slot.columnOrder ?? 0,
      rowName: slot.rowName,
      isOccupied: slot.isOccupied ?? false,
    })
  );

  const result = await PostContentData("KeySlot Create", payload);

  return NextResponse.json({ result });
}
