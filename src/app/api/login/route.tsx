import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/Login
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Login", data);

  return NextResponse.json(response);
}
