import { GetContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// /api/ValetParking/GetVehicleDropdownData
export async function GET() {
  try {
    const result = await GetContentData("Get Vehicle Dropdown Data");
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching tenant data:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant data." },
      { status: 500 }
    );
  }
}
