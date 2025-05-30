import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetVehicleByPatronTicketId
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Get Vehicle By Patron Ticket ID", res);
  }

  return NextResponse.json({ result });
}
