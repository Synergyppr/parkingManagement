import { PostContentData } from "../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/UpdateValetTicketStatus
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Update Valet Ticket Status", res);
  }

  return NextResponse.json({ result });
}
