import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// POST /api/evertec/terminal-create  OR  /api/evertec/terminal-update
export async function POST(req: Request) {
  const body = await req.json();

  const isUpdate = !!body.id;

  const applicationId = process.env.EVERTEC_APPLICATION_ID || "";

  let result;

  if (isUpdate) {
    const payload = {
      id: body.id,
      property_id: body.property_id,
      application_id: applicationId,
      name: body.name,
      terminal_url: body.terminal_url,
      terminal_id: body.terminal_id,
      is_default: body.is_default ?? false,
      is_active: body.is_active ?? true,
      updated_by: body.updated_by || "system",
    };

    result = await PostContentData("Update Terminal", payload);
  } else {
    const payload = {
      property_id: body.property_id,
      application_id: applicationId,
      name: body.name,
      terminal_url: body.terminal_url,
      terminal_id: body.terminal_id,
      is_default: body.is_default ?? false,
      created_by: body.created_by || "system",
    };

    result = await PostContentData("Create Terminal", payload);
  }

  return NextResponse.json({ result });
}
