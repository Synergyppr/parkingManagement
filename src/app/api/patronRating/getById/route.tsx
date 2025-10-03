import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetPatronRatingById
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Get Patron Rating By ID", data);
  return NextResponse.json(response);
}
