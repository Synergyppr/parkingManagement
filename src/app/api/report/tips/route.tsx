import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetValetTipsReport
export async function POST(req: Request) {
  const res = await req.json();
  console.log("Tips Report REQUEST body:", JSON.stringify(res, null, 2));

  let result;

  if (res !== undefined) {
    result = await PostContentData("Get Tips Report", res);
  }

  console.log("Tips Report RESPONSE:", JSON.stringify(result, null, 2));

  return NextResponse.json({ result });
}
