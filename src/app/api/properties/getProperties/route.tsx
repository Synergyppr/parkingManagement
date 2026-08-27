import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

const applicationId = process.env.APPLICATION_ID || "";

// /api/ValetParking/GetPropertiesByTenant
export async function POST(req: Request) {
  const res = await req.json();

  let result;

  if (res !== undefined) {
    result = await PostContentData("Get Properties By Tenant", {
      tenantId: res.id || res.tenantId,
      applicationId,
    });
  }

  return NextResponse.json({ result });
}
