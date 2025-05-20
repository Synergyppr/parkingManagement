import { checkIn } from "../../../../lib/ContentApi";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sendForm } = await req.json();

  const response = await checkIn(sendForm);
  return NextResponse.json(response);
}
