"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import { useProperty } from "../context/PropertyContext";
import { parseLocationName } from "../lib/clientUtils";
import { VehicleData } from "../types";

import PageLoader from "./elements/PageLoader";
import FormInput from "./elements/FormInput";
import { FaTicketAlt } from "react-icons/fa";
import { KeySquare } from "lucide-react";

interface ScanTransactionType {
  id: string;
  name: string;
  value: number;
}

const ScanTicket = () => {
  const { propertyId, setPropertyId, latitude, longitude } = useProperty();
  const searchParams = useSearchParams();

  const [ticketId, setTicketId] = useState("");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<
    ScanTransactionType[]
  >([]);

  // Rate editor state
  const [rateTransactionTypeId, setRateTransactionTypeId] = useState("");
  const [rateAmount, setRateAmount] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [ratePin, setRatePin] = useState("");
  const [showRatePin, setShowRatePin] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  const [showRateEditor, setShowRateEditor] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCourtesy = rateTransactionTypeId === "courtesy";
  const isRoomCharge = rateTransactionTypeId === "roomCharge";

  const handleTripleTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setShowRateEditor((prev) => !prev);
    }
  };

  const idFromUrl = searchParams.get("ticket");

  useEffect(() => {
    if (idFromUrl) {
      setTicketId(idFromUrl);
      fetchVehicleByTicket(idFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, idFromUrl]);

  useEffect(() => {
    if (vehicleData?.propertyId) {
      fetchTransactionTypes(vehicleData.propertyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData?.propertyId]);

  const fetchVehicleByTicket = async (id: string) => {
    try {
      const res = await fetch("/api/getVehicle/byTicketId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data?.result?.status === "200") {
        const vehicleResult = data?.result?.data;
        const validStatuses = ["received", "parked", "requested", "ready"];
        const rawStatus = (vehicleResult?.status || "").toLowerCase().trim();
        if (!validStatuses.includes(rawStatus)) {
          vehicleResult.status = "parked";
        }
        setVehicleData(vehicleResult);
        setVehicleNotFound(false);
        setPropertyId(vehicleResult?.propertyId);
      } else {
        setVehicleNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      setVehicleNotFound(true);
    }
  };

  const fetchTransactionTypes = async (propId: string) => {
    try {
      const res = await fetch("/api/valetTransaction/types/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propId }),
      });
      const data = await res.json();
      if (data?.result?.status === "200") {
        setTransactionTypes(data?.result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching transaction types:", error);
    }
  };

  const handleSaveRate = async () => {
    if (!ratePin || ratePin.length !== 4) {
      Swal.fire({
        icon: "warning",
        title: "PIN Required",
        text: "Please enter a valid 4-digit employee PIN.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    if (isRoomCharge && !roomNumber.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Room Number Required",
        text: "Please enter the room number for the Room Charge.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    setSavingRate(true);
    const isCustom = rateTransactionTypeId === "other";

    const payload: Record<string, unknown> = {
      ticketId,
      propertyId: vehicleData?.propertyId || propertyId || "",
      latitude: latitude || 0,
      longitude: longitude || 0,
      status: vehicleData?.status || "parked",
      isUserUpdate: false,
      transactionTypeId:
        isCourtesy || isRoomCharge || isCustom
          ? 0
          : parseInt(rateTransactionTypeId),
      price: parseFloat(rateAmount),
      pin: ratePin,
    };

    // Room Charge: set placeToVisit so report filters pick it up correctly
    if (isRoomCharge) {
      payload.placeToVisit = `Room Charge #${roomNumber.trim()}`;
    }

    try {
      const res = await fetch("/api/vehicleStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data?.result?.status === "200") {
        setShowRateEditor(false);
        setRateSaved(true);
        setRatePin("");
        // Try to close the tab — works if opened via window.open or QR
        setTimeout(() => window.close(), 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data?.result?.message || "Failed to update rate. Check your PIN.",
          confirmButtonColor: "var(--primary)",
        });
      }
    } catch (error) {
      console.error("Rate update error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setSavingRate(false);
    }
  };

  const handleManualSearch = () => {
    if (ticketId.trim() === "") {
      Swal.fire({
        title: "Input Required",
        text: "Please enter a valid Ticket ID.",
        icon: "warning",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("ticket", ticketId.trim());
    window.history.replaceState({}, "", newUrl.toString());
    fetchVehicleByTicket(ticketId.trim());
  };

  const currentRate = vehicleData?.placeToVisit
    ? parseLocationName(vehicleData.placeToVisit)
    : null;

  return (
    <div className="min-h-screen overflow-hidden bg-[color-mix(in_srgb,var(--primary-soft)_55%,white)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.10),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-(--primary-light) to-primary text-white shadow-[0_18px_45px_color-mix(in_srgb,var(--primary)_35%,transparent)]">
            <KeySquare className="h-6 w-6" />
          </div>

          <h1 className="mt-4 font-serif text-4xl font-bold text-slate-950">
            Parkey Valet
          </h1>

          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
            Ticket Rate Manager
          </p>
        </div>

        {!idFromUrl ? (
          <section className="rounded-4xl border border-(--primary-light) bg-white/90 p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <span className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Employee Access
            </span>

            <h2 className="mt-4 font-serif text-3xl font-bold text-slate-950">
              Scan or Enter Ticket
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter the ticket ID manually or scan the guest&apos;s QR code to
              view and update the ticket rate.
            </p>

            <div className="mt-6 flex gap-2">
              <FormInput
                name="ticketId"
                placeholder="Ticket ID"
                icon={<FaTicketAlt />}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                onClear={() => setTicketId("")}
              />

              <button
                className="h-11 rounded-2xl bg-secondary px-5 text-sm font-extrabold text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition cursor-pointer"
                onClick={handleManualSearch}
                type="button"
              >
                Find
              </button>
            </div>
          </section>
        ) : vehicleNotFound ? (
          <section className="rounded-4xl border border-red-100 bg-white/90 p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="font-serif text-3xl font-bold text-slate-950">
              Ticket Not Found
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              We couldn&apos;t find a ticket with this ID. Please verify the QR
              code or enter the ticket number manually.
            </p>
          </section>
        ) : ticketId && !vehicleData ? (
          <div className="py-20 text-center">
            <PageLoader />
          </div>
        ) : ticketId ? (
          <div className="space-y-5">
            {/* Ticket Info Card */}
            <section className="relative overflow-hidden rounded-4xl border border-(--primary-light) bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.13)]">
              <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-(--primary-soft)" />

              <span
                onClick={handleTripleTap}
                className="relative inline-flex cursor-default select-none rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary"
              >
                Ticket Found
              </span>

              <div className="relative mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
                    #{vehicleData?.ticketNumber}
                  </p>

                  <h3 className="mt-2 text-xl font-extrabold capitalize text-slate-950">
                    {vehicleData?.color} {vehicleData?.make}{" "}
                    {vehicleData?.model}
                  </h3>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {vehicleData?.type} &bull; Received{" "}
                    {new Date(
                      vehicleData?.createdDateTime as string
                    ).toLocaleString([], {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Guest info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Guest
                    </p>
                    <p className="mt-1 font-semibold capitalize text-slate-700">
                      {vehicleData?.firstName || vehicleData?.lastName
                        ? `${vehicleData?.firstName || ""} ${vehicleData?.lastName || ""}`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 font-semibold capitalize text-primary">
                      {vehicleData?.status}
                    </p>
                  </div>
                </div>

                {currentRate && (
                  <div className="rounded-2xl bg-(--primary-soft) p-3 ring-1 ring-(--primary-light)">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Current Rate
                    </p>
                    <p className="mt-1 font-bold text-primary">{currentRate}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Rate Editor — hidden until triple-tap on "Ticket Found" */}
            {showRateEditor && (
            <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-5">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Rate Management
                </p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                  Update Rate
                </h3>
              </div>

              <div className="space-y-3">
                {/* Rate type selector */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rate Type
                  </label>
                  <select
                    value={rateTransactionTypeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRateTransactionTypeId(val);
                      setRoomNumber("");

                      if (val === "courtesy" || val === "roomCharge") {
                        setRateAmount("0.00");
                      } else if (val === "other") {
                        setRateAmount("");
                      } else {
                        const selected = transactionTypes.find(
                          (t) => String(t.id) === val
                        );
                        if (selected) setRateAmount(String(selected.value));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">Select rate type...</option>
                    {transactionTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} - ${Number(t.value).toFixed(2)}
                      </option>
                    ))}
                    <option value="courtesy">Courtesy - $0.00</option>
                    <option value="roomCharge">Room Charge - $0.00</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                </div>

                {/* Room Number (only for Room Charge) */}
                {isRoomCharge && (
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Room Number
                      <span className="ml-1 normal-case tracking-normal text-red-400">
                        (required)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 303"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rateAmount}
                      onChange={(e) => setRateAmount(e.target.value)}
                      placeholder="0.00"
                      readOnly={isCourtesy || isRoomCharge}
                      className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${
                        isCourtesy || isRoomCharge ? "opacity-60" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* PIN */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Employee PIN
                    <span className="ml-1 normal-case tracking-normal text-red-400">
                      (required)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRatePin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={4}
                      value={ratePin}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,4}$/.test(val)) setRatePin(val);
                      }}
                      placeholder="4-digit PIN"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRatePin(!showRatePin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-primary"
                    >
                      {showRatePin ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  savingRate ||
                  !ratePin ||
                  ratePin.length !== 4 ||
                  !rateTransactionTypeId ||
                  !rateAmount ||
                  (isRoomCharge && !roomNumber.trim())
                }
                onClick={handleSaveRate}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-black text-white shadow-[0_16px_36px_color-mix(in_srgb,var(--primary)_32%,transparent)] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingRate ? "Saving..." : "Save Rate Change"}
              </button>
            </section>
            )}

            {/* Success state after rate saved */}
            {rateSaved && (
              <section className="rounded-4xl border border-emerald-200 bg-emerald-50 p-7 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200">
                  <svg
                    className="h-8 w-8 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-950">
                  Rate Updated
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  The ticket rate has been saved. You can close this tab.
                </p>
              </section>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <PageLoader />
          </div>
        )}

        <p className="mt-8 text-center text-xs font-semibold text-slate-500">
          Powered by <span className="text-primary">Parkey Valet</span>
        </p>
      </div>
    </div>
  );
};

export default ScanTicket;
