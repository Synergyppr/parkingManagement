import { GetContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetTenants
export async function GET() {
  try {
    const result = await GetContentData("Get Tenants");
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching tenant data:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant data." },
      { status: 500 }
    );
  }
}
