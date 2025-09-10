import { PostContentData } from "../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/BulkVehicles
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Bulk Vehicles", res);
  }

  return NextResponse.json({ result });
}
