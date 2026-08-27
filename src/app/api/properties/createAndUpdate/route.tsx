import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

const applicationId = process.env.APPLICATION_ID || "";

// /api/ValetParking/CreateAndUpdateProperty
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Create And Update Property", {
      ...res,
      applicationId,
    });
  }

  return NextResponse.json({ result });
}
