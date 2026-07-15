"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import Modal from "./Modal";
import Tabs from "./elements/Tabs";
import CarVector from "./CarVector";
import Log from "./Log";
import { formatDate, formatPhoneNumber } from "@/app/lib/clientUtils";
import { useProperty } from "../context/PropertyContext";
import { TicketDetailsModalProps } from "../types/pagesProps";
import { TicketDetails, TicketTransaction } from "../types";
import {
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdCameraAlt,
  MdPayments,
  MdAccessTime,
  MdReceipt,
} from "react-icons/md";
import { FaReceipt, FaUser } from "react-icons/fa";

export default function TicketDetailsModal({
  isOpen,
  setIsOpen,
  ticketDetails,
  setTicketDetails,
  detailsActiveTab,
  setDetailsActiveTab,
  transitionState,
  setTransitionState,
  noIncident,
  setNoIncident,
  incidentParts,
  setIncidentParts,
  descriptions,
  setDescriptions,
  damagedParts,
  viewAllDamagedParts,
  setViewAllDamagedParts,
  formLicensePlate,
  findLinkedGroup,
  frontViewLabelsMap,
  rearViewLabelsMap,
  passengerViewLabelsMap,
  driverViewLabelsMap,
  setHasUnsavedChanges,
  saveClickedRef,
}: TicketDetailsModalProps) {
  const { propertyId, accountUser } = useProperty();

  const [displayedTab, setDisplayedTab] = useState(detailsActiveTab);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [ticketTitleClickCount, setTicketTitleClickCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const photos = ticketDetails?.vehicle?.photos || [];
  const transactions = ticketDetails?.transactions || [];
  const hasTransactions = transactions.length > 0;

  const tabs = hasTransactions
    ? ["Details", "Receipt", "Damages", "Log"]
    : ["Details", "Damages", "Log"];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () =>
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + photos.length) % photos.length : null
    );
  const nextPhoto = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

  useEffect(() => {
    if (transitionState === "fade-in") {
      setDisplayedTab(detailsActiveTab);
    }
  }, [transitionState, detailsActiveTab]);

  const handleCloseTicketDetails = () => {
    setIsOpen(false);
    setTicketDetails({} as TicketDetails);
    setViewAllDamagedParts(false);
    setIncidentParts([]);
    setDescriptions({});
    setNoIncident(false);
    setDetailsActiveTab("Details");
  };

  // When clicking on the Ticket Details label 5 times, copy the ticket ID to the clipboard -- FOR TESTING PURPOSES --
  const handleTicketDetailsClick = async () => {
    const nextCount = ticketTitleClickCount + 1;

    if (nextCount >= 5) {
      try {
        await navigator.clipboard.writeText(
          String(ticketDetails?.ticketId || "")
        );

        setTicketTitleClickCount(0);

        // Optional visual feedback
        alert(`Ticket ID copied:\n${ticketDetails?.ticketId}`);
      } catch (error) {
        console.error("Failed to copy ticket ID", error);
      }

      return;
    }

    setTicketTitleClickCount(nextCount);

    setTimeout(() => {
      setTicketTitleClickCount((current) =>
        current === nextCount ? 0 : current
      );
    }, 3000);
  };

  const fetchDefaultTerminalId = async (): Promise<string> => {
    try {
      const res = await fetch("/api/terminals/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId }),
      });
      const data = await res.json();
      const terminalList = data?.result?.data || [];
      const defaultTerminal =
        terminalList.find((t: Record<string, unknown>) => t.is_default) ||
        terminalList[0];
      return defaultTerminal?.id || "";
    } catch {
      return "";
    }
  };

  const confirmAction = async (
    action: "void" | "refund",
    trx: TicketTransaction
  ) => {
    const detail = trx.paymentdetail;
    const label = action === "void" ? "Void" : "Refund";
    const description =
      action === "void"
        ? "This will cancel the transaction. Only works if the batch has not been settled."
        : "This will refund the full amount back to the customer's card.";

    const confirm = await Swal.fire({
      title: `${label} Transaction`,
      html: `
        <p class="text-sm text-slate-600">${description}</p>
        <div class="mt-3 rounded-xl bg-slate-50 p-3 text-left text-sm">
          <p><strong>Amount:</strong> $${trx.amount?.toFixed(2) ?? "0.00"}</p>
          <p><strong>Method:</strong> ${trx.payment_method || "—"}</p>
          <p><strong>Type:</strong> ${trx.transaction_type || "—"}</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: action === "void" ? "#ef4444" : "#f59e0b",
      cancelButtonColor: "#64748b",
      confirmButtonText: `Yes, ${label}`,
      cancelButtonText: "Cancel",
      backdrop: "rgba(15,23,42,0.55)",
    });

    if (!confirm.isConfirmed) return;

    setActionLoading(true);

    try {
      // Step 1: Get the terminal ID for Evertec communication
      const terminalId = await fetchDefaultTerminalId();
      if (!terminalId) {
        Swal.fire({
          title: "No Terminal Found",
          text: "No payment terminal is configured for this property. Please add one in Settings.",
          icon: "error",
          confirmButtonColor: "#d6a800",
        });
        setActionLoading(false);
        return;
      }

      // Step 2: Call journal to get ECR transaction references
      const journalRes = await fetch("/api/valetTransaction/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          terminalId,
          createdBy: accountUser || "",
          targetReference: detail?.trxId ?? "",
        }),
      });

      const journalData = await journalRes.json();
      const journalResult = journalData?.result;

      // Extract journal transactions
      const journalTrxList =
        journalResult?.data?.transactions ||
        journalResult?.transactions ||
        [];

      // Find the matching transaction
      const matchedJournalTrx =
        journalTrxList.find(
          (jt: Record<string, unknown>) =>
            jt.trx_id === detail?.trxId ||
            jt.payment_transaction_id === detail?.paymentTransactionId
        ) || journalTrxList[0];

      const targetReference =
        matchedJournalTrx?.reference ??
        matchedJournalTrx?.target_reference ??
        detail?.trxId ??
        "";

      // Step 3: Execute void or refund with terminal + journal data
      const endpoint =
        action === "void"
          ? "/api/valetTransaction/void"
          : "/api/valetTransaction/refund";

      const body =
        action === "void"
          ? {
              propertyId,
              terminalId,
              paymentTransactionId: detail?.paymentTransactionId,
              targetReference,
              trxId: detail?.trxId,
              createdBy: accountUser || "",
            }
          : {
              propertyId,
              terminalId,
              paymentMethod: trx.payment_method,
              amount: trx.amount,
              trxId: detail?.trxId,
              originalTrxId: detail?.trxId,
              phoneNumber: ticketDetails?.patron?.phoneNumber ?? "",
              createdBy: accountUser || "",
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      const status =
        data?.result?.status ||
        data?.result?.data?.status ||
        data?.result?.result?.status;
      const isSuccess = status === "200" || status === 200;

      if (isSuccess) {
        await Swal.fire({
          title: `${label} Successful`,
          text: `The transaction has been ${action === "void" ? "voided" : "refunded"} successfully.`,
          icon: "success",
          confirmButtonColor: "#d6a800",
        });
        handleCloseTicketDetails();
      } else {
        const errorMsg =
          data?.result?.message ||
          data?.result?.data?.message ||
          data?.result?.result?.message ||
          data?.result?.data?.error ||
          `Failed to ${action} transaction.`;

        const responseStatus =
          data?.result?.data?.response_code ||
          data?.result?.response_code ||
          status ||
          "Unknown";

        Swal.fire({
          title: `${label} Failed`,
          html: `
            <p>${errorMsg}</p>
            <p class="mt-2 text-xs text-slate-400">Status: ${responseStatus}</p>
            <details class="mt-2 text-left">
              <summary class="cursor-pointer text-xs text-slate-400">Full response</summary>
              <pre class="mt-1 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-600">${JSON.stringify(data, null, 2)}</pre>
            </details>
          `,
          icon: "error",
          confirmButtonColor: "#d6a800",
        });
      }
    } catch (error) {
      console.error(`${label} error:`, error);
      Swal.fire({
        title: "Error",
        text: `An unexpected error occurred while processing the ${action}.`,
        icon: "error",
        confirmButtonColor: "#d6a800",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseTicketDetails} size="lg">
        <div className="overflow-hidden rounded-4xl bg-white">
          <div className="border-b border-slate-200 bg-linear-to-br from-white via-amber-50/40 to-white px-5 pt-5">
            <div className="mb-4 text-center">
              <span
                onClick={handleTicketDetailsClick}
                className="inline-flex cursor-pointer rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 shadow-sm transition-all"
              >
                Ticket Details
              </span>

              <h3 className="mt-3 font-serif text-2xl font-bold text-slate-950">
                {ticketDetails?.vehicle?.color} {ticketDetails?.vehicle?.brand}{" "}
                {ticketDetails?.vehicle?.model}
              </h3>

              <p className="mt-1 font-mono text-xs font-bold tracking-widest text-slate-400">
                {ticketDetails?.vehicle?.licensePlate || "NO PLATE"}
              </p>
            </div>

            <Tabs
              isSmallScreen={false}
              tabs={tabs}
              activeTab={displayedTab}
              setActiveTab={setDetailsActiveTab}
              setTransitionState={setTransitionState}
            />
          </div>

          <div
            className={`transition-all duration-500 ${
              transitionState === "fade-out"
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            {displayedTab === "Details" && (
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Guest
                    </p>

                    {ticketDetails?.patron ? (
                      <>
                        <p className="text-sm font-extrabold text-slate-900">
                          {`${ticketDetails?.patron?.firstName ?? ""} ${
                            ticketDetails?.patron?.lastName ?? ""
                          }`}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatPhoneNumber(
                            ticketDetails?.patron?.phoneNumber as string
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-slate-400">—</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Destination
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {ticketDetails?.destination || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Vehicle
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {ticketDetails?.vehicle?.color}{" "}
                      {ticketDetails?.vehicle?.brand}{" "}
                      {ticketDetails?.vehicle?.model}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {ticketDetails?.vehicle?.type}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">
                      License Plate
                    </p>
                    <p className="font-mono text-sm font-extrabold tracking-widest text-slate-950">
                      {ticketDetails?.vehicle?.licensePlate || "Not provided"}
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs font-medium text-slate-400">
                  Created {formatDate(ticketDetails?.createdDateTime || "")}
                </p>

                {photos.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <MdCameraAlt className="h-4 w-4" />
                      </div>

                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        Photos ({photos.length})
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {photos.map((photo, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => openLightbox(index)}
                          className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all duration-200 hover:scale-[1.03] hover:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                          aria-label={`View photo ${index + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={`Vehicle photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {displayedTab === "Receipt" && hasTransactions && (
              <div className="space-y-4 p-5">
                {transactions.map((trx, idx) => {
                  const detail = trx.paymentdetail;
                  const customerReceipt = detail?.receipts?.find(
                    (r) => r.receiptType === "CUSTOMER"
                  );

                  return (
                    <div
                      key={trx.id || idx}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Transaction header */}
                      <div className="border-b border-slate-100 bg-linear-to-r from-amber-50/60 to-white px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                            <MdReceipt className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                              Transaction{transactions.length > 1 ? ` #${idx + 1}` : ""}
                            </p>
                            {trx.transaction_type && (
                              <p className="text-xs font-semibold text-slate-500">
                                {trx.transaction_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction details grid */}
                      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-amber-600">
                              <FaUser className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Customer
                            </p>
                          </div>
                          <p className="text-sm font-extrabold capitalize text-slate-950">
                            {`${ticketDetails?.patron?.firstName || "Unknown"} ${ticketDetails?.patron?.lastName || ""}`.trim()}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-amber-600">
                              <FaReceipt className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Reference #
                            </p>
                          </div>
                          <p className="font-mono text-sm font-extrabold tracking-wider text-slate-950">
                            {detail?.trxId || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-amber-600">
                              <MdAccessTime className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Date
                            </p>
                          </div>
                          <p className="text-sm font-extrabold text-slate-950">
                            {trx.transaction_date_time
                              ? formatDate(trx.transaction_date_time)
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                              <MdPayments className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                              {trx.payment_method || "Payment"}
                            </p>
                          </div>
                          <p className="text-sm font-extrabold text-slate-950">
                            ${trx.amount?.toFixed(2) ?? "0.00"}
                            {detail?.tipAmount ? (
                              <span className="ml-2 text-xs font-semibold text-slate-500">
                                + ${detail.tipAmount.toFixed(2)} tip
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      {/* Customer Receipt HTML */}
                      {customerReceipt?.receiptHtml && (
                        <div className="border-t border-slate-100 px-5 py-4">
                          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Customer Receipt
                          </p>
                          <div
                            className="receipt-container overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4"
                            dangerouslySetInnerHTML={{
                              __html: customerReceipt.receiptHtml,
                            }}
                          />
                        </div>
                      )}

                      {/* Void / Refund Actions */}
                      {trx.payment_method === "ECR" && detail?.paymentTransactionId && (
                        <div className="border-t border-slate-100 px-5 py-4">
                          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Actions
                          </p>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => confirmAction("void", trx)}
                              className="flex-1 cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              Void
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => confirmAction("refund", trx)}
                              className="flex-1 cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                            >
                              Refund
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {displayedTab === "Damages" && (
              <div className="p-1">
                <div className="h-full relative mb-4 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2">
                  <div className="scale-97">
                    <CarVector
                      noIncident={noIncident}
                      setNoIncident={setNoIncident}
                      incidentParts={incidentParts}
                      setIncidentParts={setIncidentParts}
                      descriptions={descriptions}
                      setDescriptions={setDescriptions}
                      licensePlate={formLicensePlate}
                      findLinkedGroup={findLinkedGroup}
                      frontViewLabelsMap={frontViewLabelsMap}
                      rearViewLabelsMap={rearViewLabelsMap}
                      passengerViewLabelsMap={passengerViewLabelsMap}
                      driverViewLabelsMap={driverViewLabelsMap}
                      hideLabels={true}
                      setHasUnsavedChanges={setHasUnsavedChanges}
                      saveClickedRef={saveClickedRef}
                    />
                  </div>

                  {viewAllDamagedParts && (
                    <div className="absolute inset-0 z-20 flex h-[115%] flex-col rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-[0_25px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                      <h4 className="mb-3 text-center font-serif text-lg font-bold text-slate-950">
                        Incident Report
                      </h4>

                      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                        {damagedParts?.map((part, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="text-sm font-extrabold text-slate-900">
                              {part?.partName
                                ?.replace(/([A-Z])/g, " $1")
                                .trim()}
                            </p>
                            <p className="mt-1 text-xs font-medium text-amber-600">
                              {part?.description}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => setViewAllDamagedParts(false)}
                          className="h-10 cursor-pointer rounded-xl bg-slate-100 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {damagedParts?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewAllDamagedParts(!viewAllDamagedParts)}
                    className="h-11 w-full cursor-pointer rounded-2xl bg-amber-500 text-sm font-bold text-white shadow-[0_12px_28px_rgba(217,174,38,0.28)] transition hover:bg-amber-600"
                  >
                    {viewAllDamagedParts
                      ? "Hide Description"
                      : "View Full Description"}
                  </button>
                )}
              </div>
            )}

            {displayedTab === "Log" && (
              <div className="p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <Log logs={ticketDetails?.ticketLogs || []} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {lightboxIndex !== null &&
        photos.length > 0 &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/95"
            onClick={closeLightbox}
          >
            {/* Close button — top-right, safe from nav */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-500"
              aria-label="Exit fullscreen"
            >
              <MdClose className="text-lg" />
              Exit
            </button>

            {/* Photo counter — top-left */}
            <span className="absolute left-3 top-3 z-10 rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-white">
              {lightboxIndex + 1} / {photos.length}
            </span>

            {/* Photo — click on it does nothing, click outside closes */}
            <div
              className="flex h-full w-full items-center justify-center p-12 md:p-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[lightboxIndex].url}
                alt={`Vehicle photo ${lightboxIndex + 1}`}
                className="max-h-[80vh] max-w-full cursor-default rounded-2xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white transition hover:bg-amber-500 md:left-4"
                  aria-label="Previous photo"
                >
                  <MdChevronLeft className="text-3xl" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white transition hover:bg-amber-500 md:right-4"
                  aria-label="Next photo"
                >
                  <MdChevronRight className="text-3xl" />
                </button>
              </>
            )}

            {photos.length > 1 && (
              <div
                className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className={`h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      index === lightboxIndex
                        ? "scale-110 border-amber-400"
                        : "border-white/30 opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Go to photo ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
