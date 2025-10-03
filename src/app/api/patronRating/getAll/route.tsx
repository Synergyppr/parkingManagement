import { PostContentData } from "@/app/lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetSurveyReportByProperty
export async function POST(req: Request) {
  const data = await req.json();

  const response = await PostContentData("Get Survey Report", data);
  return NextResponse.json(response);
}
