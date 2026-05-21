import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/CreateValetTicket
export async function POST(req: Request) {
  const { sendForm } = await req.json();

  const response = await PostContentData("Create Valet Ticket", sendForm);
  console.log("Create Valet sendForm:", sendForm);
  console.log("Create Valet Ticket Response:", response);
  return NextResponse.json(response);
}
