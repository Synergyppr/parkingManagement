import { PostContentData } from "../../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/DeleteVehicleType
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Delete Vehicle Types", res);
  }

  return NextResponse.json({ result });
}
