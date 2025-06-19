import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// Notification Hub
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Notification Hub", data);
  return NextResponse.json(response);
}
