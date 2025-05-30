import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/CreateValetTicket
export async function POST(req: Request) {
  const { sendForm } = await req.json();

  const response = await PostContentData("Create Valet Ticket", sendForm);
  return NextResponse.json(response);
}
