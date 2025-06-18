import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/ReadNotification
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Read Notification", data);
  return NextResponse.json(response);
}
