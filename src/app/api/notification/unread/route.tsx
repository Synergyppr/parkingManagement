import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/UnreadNotification
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Unread Notification", data);
  return NextResponse.json(response);
}
