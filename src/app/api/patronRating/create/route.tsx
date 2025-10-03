import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/CreatePatronRating
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Create Patron Rating", data);
  return NextResponse.json(response);
}
