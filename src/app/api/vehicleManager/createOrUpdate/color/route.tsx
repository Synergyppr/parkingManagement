import { PostContentData } from "../../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/CreateOrUpdateVehicleColor
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Create Or Update Vehicle Colors", res);
  }

  return NextResponse.json({ result });
}
