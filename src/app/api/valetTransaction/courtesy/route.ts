import { PostContentData } from "../../../lib/apiFunctions";
import { NextResponse } from "next/server";

// Records a no-charge transaction for a valet ticket (courtesy, room charge,
// or a property-defined $0.00 rate). Submits as a $0 payment with method
// "Courtesy" through ValetTransaction, which bypasses the POS terminal.
export async function POST(req: Request) {
  const body = await req.json();

  const { ticketId, reason, givenBy, authorizedBy, givenAt, propertyId, pin, latitude, longitude, rateName } = body;

  if (!ticketId || !(reason || authorizedBy || rateName) || !givenBy || !pin) {
    return NextResponse.json(
      { result: { status: "400", message: "Missing required fields: ticketId, reason, authorizedBy or rateName, givenBy, pin." } },
      { status: 400 }
    );
  }

  // $0.00 rate: not a courtesy/price adjustment — record the rate itself.
  // Pre-authorized courtesy (rate set to $0 beforehand) records who authorized it;
  // otherwise record who gave it at checkout. givenAt arrives already formatted
  // in the employee's local time.
  const notes = rateName
    ? ["NO CHARGE RATE", `Rate: ${rateName}`, `Processed by: ${givenBy}`, `Date: ${givenAt}`, reason && `Notes: ${reason}`]
        .filter(Boolean)
        .join(" | ")
    : authorizedBy
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
