import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetValetTicketsByPropertyId
export async function POST(req: Request) {
  const dataApi = await req.json();
  const body = { id: dataApi?.propertyId };

  let response = {};
  if (dataApi !== undefined) {
    response = await PostContentData("Get Valet Ticket By", body);
  }

  return NextResponse.json(response);
}
