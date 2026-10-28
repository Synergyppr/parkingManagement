import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// Records a courtesy (free pass) transaction for a valet ticket.
// Submits as a $0 payment with method "Courtesy" through ValetTransaction.
export async function POST(req: Request) {
  const body = await req.json();

  const { ticketId, reason, givenBy, authorizedBy, givenAt, propertyId, pin, latitude, longitude } = body;

  if (!ticketId || !(reason || authorizedBy) || !givenBy || !pin) {
    return NextResponse.json(
      { result: { status: "400", message: "Missing required fields: ticketId, reason or authorizedBy, givenBy, pin." } },
      { status: 400 }
    );
  }

  // Pre-authorized courtesy (rate set to $0 beforehand) records who authorized it;
  // otherwise record who gave it at checkout. givenAt arrives already formatted
  // in the employee's local time.
  const notes = authorizedBy
    ? ["COURTESY", `Authorized by: ${authorizedBy}`, reason && `Reason: ${reason}`, `Date: ${givenAt}`]
        .filter(Boolean)
        .join(" | ")
    : `COURTESY | Reason: ${reason} | Given by: ${givenBy} | Date: ${givenAt}`;

  const payload = {
    ticketId,
    propertyId,
    pin,
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
    paymentMethod: "Courtesy",
    transactionTypeId: 0,
    amount: 0,
    tip: 0,
    notes,
  };

  const result = await PostContentData("Valet Transaction", payload);

  return NextResponse.json({ result });
}
