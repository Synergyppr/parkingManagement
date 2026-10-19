import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetAllAppUsersByPropertyId
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Get All App Users By Property", res);
  }

  return NextResponse.json({ result });
}
