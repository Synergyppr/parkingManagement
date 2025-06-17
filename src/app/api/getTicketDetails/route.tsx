import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetTicketDetailByTicketId
export async function POST(req: Request) {
  const dataApi = await req.json();
  const body = { id: dataApi?.id };

  let response = {};
  if (dataApi !== undefined) {
    response = await PostContentData("Get Ticket Details By Ticket ID", body);
  }

  return NextResponse.json(response);
}
