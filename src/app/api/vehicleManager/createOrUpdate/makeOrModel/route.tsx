import { PostContentData } from "../../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/CreateOrUpdateCarBrandsAndModels
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Create Or Update Brands And Models", res);
  }

  return NextResponse.json({ result });
}
