/**
 * Shared rate-editor logic used by every "Update / Edit Rate" UI
 * (QR Scan page + Ticket Details modal) so both behave identically.
 *
 * Special (non-catalog) selections:
 * - COURTESY    → price 0, transactionTypeId 0 → checkout detects it as a
 *                 pre-authorized courtesy and logs who/when authorized it.
 * - ROOM_CHARGE → price 0, placeToVisit "Room Charge #<room>" → checkout
 *                 routes through the no-charge flow.
 * - OTHER       → custom amount, transactionTypeId 0.
 */

import { RateUpdateFields } from "../types";

export const RATE_OPTION = {
  COURTESY: "courtesy",
  ROOM_CHARGE: "roomCharge",
  OTHER: "other",
} as const;

export const ROOM_CHARGE_LABEL = "Room Charge";
const NO_CHARGE_AMOUNT = "0.00";

interface RateOptionSource {
  id: number | string;
  value: number;
}

export const isNoChargeRateOption = (selection: string): boolean =>
  selection === RATE_OPTION.COURTESY || selection === RATE_OPTION.ROOM_CHARGE;

export const isSpecialRateOption = (selection: string): boolean =>
  isNoChargeRateOption(selection) || selection === RATE_OPTION.OTHER;

/** Amount to pre-fill when the rate type selection changes. `null` = leave unchanged. */
export const getRateAmountForSelection = (
  selection: string,
  rates: RateOptionSource[],
): string | null => {
  if (isNoChargeRateOption(selection)) return NO_CHARGE_AMOUNT;
  if (selection === RATE_OPTION.OTHER) return "";
  const selected = rates.find((r) => String(r.id) === selection);
  return selected ? String(selected.value) : null;
};

/** Ticket fields to send to /api/vehicleStatus for a rate change. */
export const buildRateUpdateFields = (params: {
  selection: string;
  amount: string;
  pin: string;
  roomNumber?: string;
}): RateUpdateFields => {
  const { selection, amount, pin, roomNumber } = params;
  const fields: RateUpdateFields = {
    transactionTypeId: isSpecialRateOption(selection) ? 0 : parseInt(selection),
    price: parseFloat(amount),
    pin,
  };
  // Room Charge: set placeToVisit so checkout + report filters pick it up
  if (selection === RATE_OPTION.ROOM_CHARGE) {
    fields.placeToVisit = `${ROOM_CHARGE_LABEL} #${(roomNumber || "").trim()}`;
  }
  return fields;
};

/** Validation shared by the Save button `disabled` state. */
export const canSaveRate = (params: {
  selection: string;
  amount: string;
  pin: string;
  roomNumber?: string;
}): boolean => {
  const { selection, amount, pin, roomNumber } = params;
  if (!selection || !amount || pin.length !== 4) return false;
  if (selection === RATE_OPTION.ROOM_CHARGE && !(roomNumber || "").trim()) return false;
  return true;
};
