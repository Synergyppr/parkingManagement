import { PostContentData } from "../../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/CreateOrUpdateTransactionTypes
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Create Or Update Transaction Types", res);
  }

  return NextResponse.json({ result });
}
