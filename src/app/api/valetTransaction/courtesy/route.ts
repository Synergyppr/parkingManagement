import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// Records a courtesy (free pass) transaction for a valet ticket.
// Submits as a $0 payment with method "Courtesy" and stores:
//   reason, givenBy (employee), givenAt (ISO datetime), propertyId, ticketId
export async function POST(req: Request) {
  const body = await req.json();

  const { ticketId, reason, givenBy, givenAt, propertyId, pin, latitude, longitude } = body;

  if (!ticketId || !reason || !givenBy || !pin) {
    return NextResponse.json(
      { result: { status: "400", message: "Missing required fields: ticketId, reason, givenBy, pin." } },
      { status: 400 }
    );
  }

  const payload = {
    ticketId,
    pin,
    amount: 0,
    paymentMethod: "Courtesy",
    referenceNumber: `CRTS-${Date.now()}`,
    notes: `COURTESY | Reason: ${reason} | Given by: ${givenBy} | Date: ${givenAt}`,
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
    propertyId,
  };

  const result = await PostContentData("Valet Transaction", payload);

  return NextResponse.json({ result });
}
