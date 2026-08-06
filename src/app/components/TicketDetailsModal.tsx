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
  MdOpenInNew,
} from "react-icons/md";
import { FaReceipt, FaUser } from "react-icons/fa";

const getThemePrimaryColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

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
  const { propertyId, latitude, longitude } = useProperty();

  const [displayedTab, setDisplayedTab] = useState(detailsActiveTab);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [ticketTitleClickCount, setTicketTitleClickCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLabel, setActionLabel] = useState<"Void" | "Refund">("Void");

  const photos = ticketDetails?.photos || ticketDetails?.vehicle?.photos || [];
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
    // console.log("TICKET DETAILS", ticketDetails);
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

  const openCustomerReceipt = (
    receiptHtml?: string,
    receiptNumber?: number
  ) => {
    if (!receiptHtml?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Receipt unavailable",
        text: "This transaction does not contain a valid customer receipt.",
        confirmButtonColor: getThemePrimaryColor(),
      });

      return;
    }

    const popupWidth = window.screen.availWidth || window.innerWidth;
    const popupHeight = window.screen.availHeight || window.innerHeight;

    const receiptWindow = window.open(
      "",
      `customer-receipt-${Date.now()}`,
      [
        "popup=yes",
        "resizable=yes",
        "scrollbars=yes",
        "toolbar=no",
        "menubar=no",
        "location=no",
        "status=no",
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        "left=0",
        "top=0",
      ].join(",")
    );

    if (!receiptWindow) {
      Swal.fire({
        icon: "warning",
        title: "Popup blocked",
        text: "Please allow popups for this website to open the customer receipt.",
        confirmButtonColor: getThemePrimaryColor(),
      });

      return;
    }

    /*
     * The receipt contains relative assets such as:
     * <img src="ath_logo.png" />
     *
     * Adding a base element allows those assets to resolve from your app's
     * public directory.
     */
    const baseElement = `<base href="${window.location.origin}/" />`;

    const receiptStyles = `
      <style>
        html {
          min-height: 100%;
          background: #f1f5f9;
        }
  
        body {
          box-sizing: border-box;
          width: 100% !important;
          max-width: 620px;
          min-height: 100%;
          margin: 0 auto !important;
          padding: 32px 24px 80px !important;
          background: #ffffff;
          color: #0f172a;
          font-family: Arial, Helvetica, sans-serif;
        }
  
        table {
          max-width: 100%;
        }
  
        img {
          max-width: 100%;
          height: auto;
        }
  
        @media (max-width: 640px) {
          body {
            padding: 20px 14px 60px !important;
          }
        }
  
        @media print {
          html,
          body {
            background: #ffffff !important;
          }
  
          body {
            width: 100% !important;
            max-width: none;
            min-height: auto;
            margin: 0 !important;
            padding: 0 !important;
          }
  
          @page {
            margin: 10mm;
          }
        }
      </style>
    `;

    const enhancedReceiptHtml = /<head[^>]*>/i.test(receiptHtml)
      ? receiptHtml.replace(
          /<head([^>]*)>/i,
          `<head$1>${baseElement}${receiptStyles}`
        )
      : `
          <!DOCTYPE html>
          <html>
            <head>
              ${baseElement}
              ${receiptStyles}
            </head>
  
            <body>
              ${receiptHtml}
            </body>
          </html>
        `;

    receiptWindow.document.open();

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
  
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
  
          <title>
            Customer Receipt${receiptNumber ? ` ${receiptNumber}` : ""}
          </title>
  
          <style>
            * {
              box-sizing: border-box;
            }
  
            html,
            body {
              width: 100%;
              height: 100%;
              margin: 0;
              overflow: hidden;
              background: #e2e8f0;
              font-family: Arial, Helvetica, sans-serif;
            }
  
            .receipt-window {
              display: flex;
              width: 100%;
              height: 100%;
              flex-direction: column;
            }
  
            .receipt-toolbar {
              position: relative;
              z-index: 10;
              display: flex;
              min-height: 68px;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              border-bottom: 1px solid #e2e8f0;
              background: rgba(255, 255, 255, 0.97);
              padding: 12px 20px;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
            }
  
            .receipt-heading {
              min-width: 0;
            }
  
            .receipt-eyebrow {
              margin: 0 0 3px;
              color: #64748b;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }
  
            .receipt-title {
              overflow: hidden;
              margin: 0;
              color: #0f172a;
              font-size: 18px;
              font-weight: 800;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
  
            .receipt-actions {
              display: flex;
              flex-shrink: 0;
              align-items: center;
              gap: 10px;
            }
  
            .receipt-button {
              display: inline-flex;
              min-height: 42px;
              cursor: pointer;
              align-items: center;
              justify-content: center;
              border: 0;
              border-radius: 12px;
              padding: 0 18px;
              font-size: 13px;
              font-weight: 800;
              transition:
                transform 150ms ease,
                opacity 150ms ease;
            }
  
            .receipt-button:hover {
              transform: translateY(-1px);
            }
  
            .receipt-button:active {
              transform: translateY(0);
            }
  
            .receipt-button-print {
              background: ${getThemePrimaryColor()};
              color: #ffffff;
            }
  
            .receipt-button-close {
              background: #e2e8f0;
              color: #334155;
            }
  
            .receipt-frame {
              display: block;
              width: 100%;
              flex: 1;
              border: 0;
              background: #f1f5f9;
            }
  
            @media (max-width: 640px) {
              .receipt-toolbar {
                min-height: 62px;
                padding: 10px 12px;
              }
  
              .receipt-title {
                font-size: 15px;
              }
  
              .receipt-button {
                min-height: 40px;
                padding: 0 13px;
              }
  
              .button-label {
                display: none;
              }
            }
  
            @media print {
              .receipt-toolbar {
                display: none !important;
              }
            }
          </style>
        </head>
  
        <body>
          <div class="receipt-window">
            <header class="receipt-toolbar">
              <div class="receipt-heading">
                <p class="receipt-eyebrow">Payment Transaction</p>
  
                <h1 class="receipt-title">
                  Customer Receipt${receiptNumber ? ` #${receiptNumber}` : ""}
                </h1>
              </div>
  
              <div class="receipt-actions">
                <button
                  id="print-receipt"
                  class="receipt-button receipt-button-print"
                  type="button"
                >
                  <span class="button-label-mobile">Print</span>
                </button>
  
                <button
                  id="close-receipt"
                  class="receipt-button receipt-button-close"
                  type="button"
                >
                  Close
                </button>
              </div>
            </header>
  
            <iframe
              id="receipt-frame"
              class="receipt-frame"
              title="Customer receipt"
            ></iframe>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();

    const receiptFrame = receiptWindow.document.getElementById(
      "receipt-frame"
    ) as HTMLIFrameElement | null;

    const printButton = receiptWindow.document.getElementById("print-receipt");
    const closeButton = receiptWindow.document.getElementById("close-receipt");

    if (receiptFrame) {
      receiptFrame.srcdoc = enhancedReceiptHtml;
    }

    printButton?.addEventListener("click", () => {
      const frameWindow = receiptFrame?.contentWindow;

      if (!frameWindow) return;

      frameWindow.focus();
      frameWindow.print();
    });

    closeButton?.addEventListener("click", () => {
      receiptWindow.close();
    });

    try {
      receiptWindow.moveTo(0, 0);
      receiptWindow.resizeTo(popupWidth, popupHeight);
    } catch {
      // Some browsers restrict resizing popup windows.
    }

    receiptWindow.focus();
  };

  const confirmAction = async (
    action: "void" | "refund",
    trx: TicketTransaction,
    method?: string
  ) => {
    const isATHM = (method || trx.payment_method || "").toUpperCase() === "ATHM";
    const detail = trx.paymentdetail;
    const label = action === "void" ? "Void" : "Refund";
    const description =
      action === "void"
        ? "This will cancel the transaction. Only works if the batch has not been settled."
        : isATHM
          ? "This will refund the full amount back to the customer's ATH Móvil account."
          : "This will refund the full amount back to the customer's card.";

    const defaultAmount = trx.amount?.toFixed(2) ?? "0.00";
    const defaultTip = detail?.tipAmount?.toFixed(2) ?? "0.00";
    const isRefund = action === "refund";

    const inputStyle =
      "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
    const labelStyle = "block text-xs font-bold text-slate-500 mb-1";

    const confirm = await Swal.fire({
      title: `${label} Transaction`,
      html: `
        <p class="text-sm text-slate-600">${description}</p>
        <div class="mt-3 rounded-xl bg-slate-50 p-3 text-left text-sm">
          <p><strong>Method:</strong> ${trx.payment_method || "—"}</p>
          <p><strong>Type:</strong> ${trx.transaction_type || "—"}</p>
        </div>

        ${isRefund ? `
          <div class="mt-4 text-left">
            <label class="${labelStyle}">Amount</label>
            <input id="swal-amount" type="number" step="0.01" min="0" value="${defaultAmount}" placeholder="0.00"
              class="${inputStyle}" />
          </div>
          <div class="mt-3 text-left">
            <label class="${labelStyle}">Tip</label>
            <input id="swal-tip" type="number" step="0.01" min="0" value="${defaultTip}" placeholder="0.00"
              class="${inputStyle}" />
          </div>
          <div class="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span class="text-sm font-semibold text-slate-700">Taxable</span>
            <label class="relative inline-flex cursor-pointer items-center">
              <input id="swal-taxable" type="checkbox" class="peer sr-only" checked />
              <div class="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        ` : ""}

        <div class="mt-3 text-left">
          <label class="${labelStyle}">Notes</label>
          <textarea id="swal-notes" rows="2" placeholder="Reason for ${action}..."
            class="${inputStyle} resize-none"></textarea>
        </div>

        <div class="mt-3 text-left">
          <label class="${labelStyle}">Security PIN</label>
          <input id="swal-pin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN"
            class="${inputStyle}" />
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor:
        action === "void" ? "#ef4444" : getThemePrimaryColor(),
      cancelButtonColor: "#64748b",
      confirmButtonText: `Yes, ${label}`,
      cancelButtonText: "Cancel",
      backdrop: "rgba(15,23,42,0.55)",
      preConfirm: () => {
        const pin = (document.getElementById("swal-pin") as HTMLInputElement)?.value?.trim();
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          Swal.showValidationMessage("Please enter a valid 4-digit PIN.");
          return false;
        }

        const notes = (document.getElementById("swal-notes") as HTMLTextAreaElement)?.value?.trim() || "";

        if (!notes) {
          Swal.showValidationMessage("Please enter a reason for this action.");
          return false;
        }

        if (isRefund) {
          const amount = parseFloat((document.getElementById("swal-amount") as HTMLInputElement)?.value) || 0;
          const tip = parseFloat((document.getElementById("swal-tip") as HTMLInputElement)?.value) || 0;
          const taxable = (document.getElementById("swal-taxable") as HTMLInputElement)?.checked ?? false;

          if (amount <= 0) {
            Swal.showValidationMessage("Please enter a valid amount.");
            return false;
          }

          return { pin, notes, amount, tip, taxable };
        }

        return { pin, notes };
      },
    });

    if (!confirm.isConfirmed || !confirm.value) return;

    const { pin, notes } = confirm.value as { pin: string; notes: string; amount?: number; tip?: number; taxable?: boolean };

    setActionLabel(label as "Void" | "Refund");
    setActionLoading(true);

    try {
      const terminalId = await fetchDefaultTerminalId();
      if (!terminalId) {
        Swal.fire({
          title: "No Terminal Found",
          text: "No payment terminal is configured for this property. Please add one in Settings.",
          icon: "error",
          confirmButtonColor: getThemePrimaryColor(),
        });
        setActionLoading(false);
        return;
      }

      console.log(`[${label}] trx object:`, JSON.stringify(trx, null, 2));

      const transactionId =
        trx.id || detail?.paymentTransactionId || detail?.trxId || trx.reference_number || "";

      const endpoint =
        action === "void"
          ? "/api/valetTransaction/void"
          : "/api/valetTransaction/refund";

      const body =
        action === "void"
          ? {
              propertyId,
              transactionId,
              terminalId,
              pin,
              latitude: latitude ?? 0,
              longitude: longitude ?? 0,
              receiptEmail: "yes",
              receiptOutput: "both",
              notes,
            }
          : {
              propertyId,
              ticketId: ticketDetails?.ticketId ?? "",
              paymentMethod: isATHM ? "ATHM" : "ECR",
              amount: (confirm.value as { amount: number }).amount,
              tip: (confirm.value as { tip: number }).tip ?? 0,
              taxable: (confirm.value as { taxable: boolean }).taxable ?? false,
              terminalId,
              pin,
              latitude: latitude ?? 0,
              longitude: longitude ?? 0,
              receiptEmail: "yes",
              receiptOutput: "both",
              notes,
            };

      console.log(`[${label}] REQUEST:`, JSON.stringify(body, null, 2));

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log(`[${label}] RESPONSE:`, JSON.stringify(data, null, 2));

      const status =
        data?.result?.status ||
        data?.result?.data?.status ||
        data?.result?.result?.status;
      const isSuccess = status === "200" || status === 200;

      // Extract Evertec response_message from all possible locations
      const r = data?.result as Record<string, unknown> | undefined;
      const rData = r?.data as Record<string, unknown> | undefined;
      const rNested = r?.result as Record<string, unknown> | undefined;

      const responseMessage = (
        (rData?.response_message as string) ||
        (r?.response_message as string) ||
        (rNested?.response_message as string) ||
        (rData?.final_status as string) ||
        (r?.final_status as string) ||
        ""
      ).replace(/"/g, "").trim();

      const approvalCode =
        (rData?.approval_code as string) ||
        (r?.approval_code as string) ||
        (rNested?.approval_code as string) ||
        "";

      if (isSuccess) {
        await Swal.fire({
          title: `${label} Successful`,
          html: `
            <p class="text-sm text-gray-600">The transaction has been ${
              action === "void" ? "voided" : "refunded"
            } successfully.</p>
            ${responseMessage ? `<p class="mt-2 text-xs font-semibold text-emerald-600">${responseMessage}</p>` : ""}
          `,
          icon: "success",
          confirmButtonColor: getThemePrimaryColor(),
        });
        handleCloseTicketDetails();
      } else {
        const errorMsg =
          r?.message ||
          rData?.message ||
          rNested?.message ||
          rData?.error ||
          `Failed to ${action} transaction.`;

        const responseStatus =
          rData?.response_code ||
          r?.response_code ||
          status ||
          "Unknown";

        const showResponseSeparately = responseMessage && responseMessage !== String(errorMsg);

        Swal.fire({
          title: `${label} Failed`,
          html: `
            <p>${errorMsg}</p>
            ${showResponseSeparately ? `<p class="mt-2 text-xs font-bold text-red-500">${responseMessage}</p>` : ""}
            <p class="mt-2 text-xs text-slate-400">Status: ${responseStatus}${approvalCode && approvalCode !== "00" ? ` | Code: ${approvalCode}` : ""}</p>
            <details class="mt-2 text-left">
              <summary class="cursor-pointer text-xs text-slate-400">Full response</summary>
              <pre class="mt-1 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-600">${JSON.stringify(
                data,
                null,
                2
              )}</pre>
            </details>
          `,
          icon: "error",
          confirmButtonColor: getThemePrimaryColor(),
        });
      }
    } catch (error) {
      console.error(`${label} error:`, error);
      Swal.fire({
        title: "Error",
        text: `An unexpected error occurred while processing the ${action}.`,
        icon: "error",
        confirmButtonColor: getThemePrimaryColor(),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const allReceipts = transactions?.flatMap((transaction, transactionIndex) =>
    (transaction?.receipts || [])
      .filter((receipt) => Boolean(receipt?.receiptHtml?.trim()))
      .map((receipt, receiptIndex) => ({
        ...receipt,
        transaction,
        transactionIndex,
        receiptIndex,
      }))
  );

  const openAllReceipts = () => {
    if (allReceipts?.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Receipts unavailable",
        text: "There are no valid receipts available for this ticket.",
        confirmButtonColor: getThemePrimaryColor(),
      });

      return;
    }

    const popupWidth = window.screen.availWidth || window.innerWidth;
    const popupHeight = window.screen.availHeight || window.innerHeight;
    const primaryColor = getThemePrimaryColor();

    const receiptsWindow = window.open(
      "",
      `all-ticket-receipts-${Date.now()}`,
      [
        "popup=yes",
        "resizable=yes",
        "scrollbars=yes",
        "toolbar=no",
        "menubar=no",
        "location=no",
        "status=no",
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        "left=0",
        "top=0",
      ].join(",")
    );

    if (!receiptsWindow) {
      Swal.fire({
        icon: "warning",
        title: "Popup blocked",
        text: "Please allow popups for this website to view all receipts.",
        confirmButtonColor: primaryColor,
      });

      return;
    }

    const escapeHtml = (value?: string | number | null) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const customerName = [
      ticketDetails?.patron?.firstName,
      ticketDetails?.patron?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const vehicleName = [
      ticketDetails?.vehicle?.color,
      ticketDetails?.vehicle?.brand,
      ticketDetails?.vehicle?.model,
    ]
      .filter(Boolean)
      .join(" ");

    const receiptDocuments = allReceipts
      .map((receipt, index) => {
        const transaction = receipt.transaction;

        const receiptType =
          receipt?.receiptType === "CUSTOMER"
            ? "Customer Copy"
            : receipt?.receiptType === "MERCHANT"
            ? "Merchant Copy"
            : receipt?.receiptType || "Receipt";

        const receiptHtml = String(receipt?.receiptHtml || "");

        /*
         * Removes the original outer html/head/body elements because every
         * receipt will be placed inside the same combined document.
         */
        const cleanedReceiptHtml = receiptHtml
          .replace(/<!doctype[^>]*>/gi, "")
          .replace(/<html[^>]*>/gi, "")
          .replace(/<\/html>/gi, "")
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
          .replace(/<body[^>]*>/gi, "")
          .replace(/<\/body>/gi, "");

        const transactionDate = transaction?.transaction_date_time
          ? formatDate(transaction.transaction_date_time)
          : "—";

        return `
          <section class="receipt-section">
            <div class="receipt-card-header">
              <div class="receipt-number">
                <span class="receipt-number-label">Receipt</span>
                <strong>#${index + 1}</strong>
              </div>
  
              <div class="receipt-metadata">
                <span class="receipt-type">
                  ${escapeHtml(receiptType)}
                </span>
  
                <span>
                  Transaction ${receipt.transactionIndex + 1} of ${
          transactions.length
        }
                </span>
              </div>
            </div>
  
            <div class="transaction-summary">
              <div class="summary-item">
                <span>Reference</span>
                <strong>
                  ${escapeHtml(transaction?.reference_number || "—")}
                </strong>
              </div>
  
              <div class="summary-item">
                <span>Date</span>
                <strong>${escapeHtml(transactionDate)}</strong>
              </div>
  
              <div class="summary-item">
                <span>Payment</span>
                <strong>
                  ${escapeHtml(transaction?.payment_method || "—")}
                </strong>
              </div>
  
              <div class="summary-item">
                <span>Amount</span>
                <strong>
                  $${Number(transaction?.amount || 0).toFixed(2)}
                </strong>
              </div>
            </div>
  
            <div class="receipt-paper">
              ${cleanedReceiptHtml}
            </div>
          </section>
        `;
      })
      .join("");

    receiptsWindow.document.open();

    receiptsWindow.document.write(`
      <!DOCTYPE html>
  
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
  
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
  
          <base href="${window.location.origin}/" />
  
          <title>All Ticket Receipts</title>
  
          <style>
            * {
              box-sizing: border-box;
            }
  
            :root {
              --primary: ${primaryColor};
            }
  
            html,
            body {
              width: 100%;
              min-height: 100%;
              margin: 0;
              background: #e2e8f0;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }
  
            body {
              padding-top: 76px;
            }
  
            .receipts-toolbar {
              position: fixed;
              top: 0;
              right: 0;
              left: 0;
              z-index: 100;
              display: flex;
              min-height: 76px;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              border-bottom: 1px solid #e2e8f0;
              background: rgba(255, 255, 255, 0.97);
              padding: 12px 24px;
              box-shadow: 0 8px 28px rgba(15, 23, 42, 0.1);
              backdrop-filter: blur(16px);
            }
  
            .toolbar-heading {
              min-width: 0;
            }
  
            .toolbar-eyebrow {
              margin: 0 0 4px;
              color: var(--primary);
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }
  
            .toolbar-title {
              overflow: hidden;
              margin: 0;
              color: #0f172a;
              font-size: 19px;
              font-weight: 900;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
  
            .toolbar-subtitle {
              overflow: hidden;
              margin: 3px 0 0;
              color: #64748b;
              font-size: 11px;
              font-weight: 600;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
  
            .toolbar-actions {
              display: flex;
              flex-shrink: 0;
              align-items: center;
              gap: 10px;
            }
  
            .toolbar-button {
              display: inline-flex;
              min-height: 42px;
              cursor: pointer;
              align-items: center;
              justify-content: center;
              border: 0;
              border-radius: 12px;
              padding: 0 18px;
              font-size: 13px;
              font-weight: 900;
              transition:
                transform 150ms ease,
                opacity 150ms ease;
            }
  
            .toolbar-button:hover {
              transform: translateY(-1px);
            }
  
            .toolbar-button:active {
              transform: translateY(0);
            }
  
            .print-button {
              background: var(--primary);
              color: #ffffff;
              box-shadow: 0 8px 20px
                color-mix(in srgb, var(--primary) 25%, transparent);
            }
  
            .close-button {
              background: #e2e8f0;
              color: #334155;
            }
  
            .receipts-content {
              width: 100%;
              max-width: 940px;
              margin: 0 auto;
              padding: 32px 20px 80px;
            }
  
            .ticket-summary {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 24px;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              background: #ffffff;
              padding: 16px;
              box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
            }
  
            .ticket-summary-item {
              min-width: 0;
              border-radius: 14px;
              background: #f8fafc;
              padding: 13px;
            }
  
            .ticket-summary-item span {
              display: block;
              margin-bottom: 5px;
              color: #94a3b8;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }
  
            .ticket-summary-item strong {
              display: block;
              overflow: hidden;
              color: #0f172a;
              font-size: 13px;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
  
            .receipt-section {
              break-inside: avoid;
              overflow: hidden;
              margin-bottom: 28px;
              border: 1px solid #cbd5e1;
              border-radius: 24px;
              background: #ffffff;
              box-shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
            }
  
            .receipt-card-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              border-bottom: 1px solid #e2e8f0;
              background: linear-gradient(
                135deg,
                color-mix(in srgb, var(--primary) 13%, white),
                #ffffff
              );
              padding: 16px 20px;
            }
  
            .receipt-number {
              display: flex;
              align-items: center;
              gap: 9px;
            }
  
            .receipt-number-label {
              color: #64748b;
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }
  
            .receipt-number strong {
              color: #0f172a;
              font-size: 17px;
            }
  
            .receipt-metadata {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 8px;
              color: #64748b;
              font-size: 10px;
              font-weight: 800;
            }
  
            .receipt-type {
              border: 1px solid
                color-mix(in srgb, var(--primary) 30%, white);
              border-radius: 999px;
              background: color-mix(
                in srgb,
                var(--primary) 11%,
                white
              );
              padding: 6px 10px;
              color: var(--primary);
              text-transform: uppercase;
            }
  
            .transaction-summary {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 1px;
              border-bottom: 1px solid #e2e8f0;
              background: #e2e8f0;
            }
  
            .summary-item {
              min-width: 0;
              background: #f8fafc;
              padding: 12px 16px;
            }
  
            .summary-item span {
              display: block;
              margin-bottom: 4px;
              color: #94a3b8;
              font-size: 8px;
              font-weight: 900;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }
  
            .summary-item strong {
              display: block;
              overflow: hidden;
              color: #334155;
              font-size: 11px;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
  
            .receipt-paper {
              width: 100%;
              max-width: 640px;
              min-height: 300px;
              margin: 0 auto;
              padding: 34px 24px 56px;
              background: #ffffff;
              color: #000000;
            }
  
            .receipt-paper table {
              max-width: 100%;
            }
  
            .receipt-paper img {
              max-width: 100%;
              height: auto;
            }
  
            .empty-receipt {
              padding: 50px 20px;
              text-align: center;
              color: #64748b;
            }
  
            @media (max-width: 720px) {
              body {
                padding-top: 70px;
              }
  
              .receipts-toolbar {
                min-height: 70px;
                padding: 10px 12px;
              }
  
              .toolbar-title {
                font-size: 15px;
              }
  
              .toolbar-subtitle {
                display: none;
              }
  
              .toolbar-button {
                min-height: 40px;
                padding: 0 13px;
              }
  
              .desktop-button-text {
                display: none;
              }
  
              .receipts-content {
                padding: 18px 10px 50px;
              }
  
              .ticket-summary {
                grid-template-columns: 1fr;
                gap: 8px;
                padding: 10px;
              }
  
              .transaction-summary {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
  
              .receipt-card-header {
                align-items: flex-start;
                padding: 13px;
              }
  
              .receipt-metadata {
                flex-direction: column;
                align-items: flex-end;
              }
  
              .receipt-paper {
                overflow-x: auto;
                padding: 22px 12px 40px;
              }
            }
  
            @media print {
              @page {
                margin: 10mm;
              }
  
              html,
              body {
                background: #ffffff !important;
              }
  
              body {
                padding: 0;
              }
  
              .receipts-toolbar,
              .ticket-summary,
              .receipt-card-header,
              .transaction-summary {
                display: none !important;
              }
  
              .receipts-content {
                width: 100%;
                max-width: none;
                margin: 0;
                padding: 0;
              }
  
              .receipt-section {
                overflow: visible;
                margin: 0;
                border: 0;
                border-radius: 0;
                box-shadow: none;
                break-after: page;
                page-break-after: always;
              }
  
              .receipt-section:last-child {
                break-after: auto;
                page-break-after: auto;
              }
  
              .receipt-paper {
                width: 100%;
                max-width: none;
                min-height: auto;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
  
        <body>
          <header class="receipts-toolbar">
            <div class="toolbar-heading">
              <p class="toolbar-eyebrow">Ticket Receipts</p>
  
              <h1 class="toolbar-title">
                All Receipts (${allReceipts?.length})
              </h1>
  
              <p class="toolbar-subtitle">
                ${escapeHtml(customerName || "Unknown customer")}
                ${vehicleName ? ` • ${escapeHtml(vehicleName)}` : ""}
              </p>
            </div>
  
            <div class="toolbar-actions">
              <button
                id="print-all-receipts"
                class="toolbar-button print-button"
                type="button"
              >
  
                <span>Print</span>
              </button>
  
              <button
                id="close-all-receipts"
                class="toolbar-button close-button"
                type="button"
              >
                Close
              </button>
            </div>
          </header>
  
          <main class="receipts-content">
            <section class="ticket-summary">
              <div class="ticket-summary-item">
                <span>Customer</span>
  
                <strong>
                  ${escapeHtml(customerName || "Unknown customer")}
                </strong>
              </div>
  
              <div class="ticket-summary-item">
                <span>Vehicle</span>
  
                <strong>
                  ${escapeHtml(vehicleName || "Unknown vehicle")}
                </strong>
              </div>
  
              <div class="ticket-summary-item">
                <span>License Plate</span>
  
                <strong>
                  ${escapeHtml(
                    ticketDetails?.vehicle?.licensePlate || "Not provided"
                  )}
                </strong>
              </div>
            </section>
  
            ${receiptDocuments}
          </main>
        </body>
      </html>
    `);

    receiptsWindow.document.close();

    const printButton =
      receiptsWindow.document.getElementById("print-all-receipts");

    const closeButton =
      receiptsWindow.document.getElementById("close-all-receipts");

    printButton?.addEventListener("click", () => {
      receiptsWindow.focus();
      receiptsWindow.print();
    });

    closeButton?.addEventListener("click", () => {
      receiptsWindow.close();
    });

    try {
      receiptsWindow.moveTo(0, 0);
      receiptsWindow.resizeTo(popupWidth, popupHeight);
    } catch {
      // Some browsers restrict programmatic resizing.
    }

    receiptsWindow.focus();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseTicketDetails} size="lg">
        <div className="overflow-hidden bg-white">
          <div className="border-b border-slate-200 bg-linear-to-br from-white via-(--primary-soft) to-white px-5 pt-5">
            <div className="mb-4 text-center">
              <span
                onClick={handleTicketDetailsClick}
                className="inline-flex cursor-pointer rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-bold uppercase 
                tracking-[0.18em] text-primary shadow-sm transition-all"
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

                  {ticketDetails?.destination && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Destination
                      </p>
                      <p className="text-sm font-extrabold text-slate-900">
                        {ticketDetails.destination}
                      </p>
                    </div>
                  )}

                  {(ticketDetails?.vehicle?.color || ticketDetails?.vehicle?.brand || ticketDetails?.vehicle?.model) && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Vehicle
                      </p>
                      <p className="text-sm font-extrabold text-slate-900">
                        {[ticketDetails?.vehicle?.color, ticketDetails?.vehicle?.brand, ticketDetails?.vehicle?.model].filter(Boolean).join(" ")}
                      </p>
                      {ticketDetails?.vehicle?.type && (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {ticketDetails.vehicle.type}
                        </p>
                      )}
                    </div>
                  )}

                  {ticketDetails?.vehicle?.licensePlate && (
                    <div className="rounded-2xl border border-(--primary-light) bg-(--primary-soft) p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                        License Plate
                      </p>
                      <p className="font-mono text-sm font-extrabold tracking-widest text-slate-950">
                        {ticketDetails.vehicle.licensePlate}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs font-medium text-slate-400">
                  Created {formatDate(ticketDetails?.createdDateTime || "")}
                </p>

                {photos.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--primary-soft) text-primary">
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
                          className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all 
                          duration-200 hover:scale-[1.03] hover:border-primary focus:outline-none focus:ring-4 focus:ring-(--primary-soft)"
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
              <div className="relative space-y-4 p-5">
                {actionLoading && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/80 backdrop-blur-sm">
                    <svg
                      aria-hidden="true"
                      className="h-12 w-12 animate-spin fill-primary text-(--primary-soft)"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">
                        Processing {actionLabel}...
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Please wait, do not close this window.
                      </p>
                    </div>
                  </div>
                )}
                {transactions.map((trx, idx) => {
                  const detail = trx.paymentdetail;
                  const customerReceipts = trx?.receipts || [];

                  return (
                    <div
                      key={trx.id || idx}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Transaction header */}
                      <div className="border-b border-slate-100 bg-linear-to-r from-(--primary-soft) to-white px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary-soft)]0 text-white">
                            <MdReceipt className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                              Transaction
                              {transactions.length > 1 ? ` #${idx + 1}` : ""}
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-primary">
                              <FaUser className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-[10px] font-black capitalize tracking-[0.18em] text-slate-400">
                              Customer
                            </p>
                          </div>
                          <p className="text-sm font-extrabold capitalize text-slate-950">
                            <span className="capitalize">{`${
                              ticketDetails?.patron?.firstName || "Unknown"
                            }`}</span>{" "}
                            <span className="capitalize">
                              {`${
                                ticketDetails?.patron?.lastName || ""
                              }`.trim()}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-primary">
                              <FaReceipt className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Reference #
                            </p>
                          </div>
                          <p
                            onClick={async () => {
                              if (!trx?.reference_number) return;

                              try {
                                await navigator.clipboard.writeText(
                                  trx.reference_number
                                );

                                Swal.fire({
                                  toast: true,
                                  position: "top-end",
                                  icon: "success",
                                  title: "Reference number copied",
                                  showConfirmButton: false,
                                  timer: 1500,
                                  timerProgressBar: true,
                                });
                              } catch {
                                Swal.fire({
                                  toast: true,
                                  position: "top-end",
                                  icon: "error",
                                  title: "Failed to copy",
                                  showConfirmButton: false,
                                  timer: 1500,
                                });
                              }
                            }}
                            className="font-mono truncate text-xs font-extrabold tracking-wider text-slate-950 cursor-pointer transition hover:text-primary"
                            title="Click to copy"
                          >
                            {trx?.reference_number || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-primary">
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

                        <div className="rounded-2xl border border-(--primary-light) bg-(--primary-soft)/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary-soft)]0 text-white">
                              <MdPayments className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
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
                      {customerReceipts.length > 0 && (
                        <div className="border-t border-slate-100 px-5 py-4">
                          <div className="mb-4 overflow-hidden rounded-2xl border border-(--primary-light) bg-linear-to-br from-(--primary-soft) via-white to-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_24%,transparent)]">
                                  <FaReceipt className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                                    Customer Receipts
                                  </p>

                                  <p className="mt-1 text-xs font-medium text-slate-500">
                                    View or print individual receipts, or open
                                    every receipt in one full-screen window.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={openAllReceipts}
                                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_24%,transparent)] transition hover:-translate-y-0.5 hover:bg-secondary"
                              >
                                <MdOpenInNew className="h-4 w-4" />
                                View All Receipts
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {customerReceipts.map(
                              (customerReceipt, receiptIndex) => (
                                <div
                                  key={
                                    customerReceipt?.createdAtUtc ||
                                    `${
                                      trx.id || idx
                                    }-customer-receipt-${receiptIndex}`
                                  }
                                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                                        <MdReceipt className="h-4 w-4" />
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-xs font-extrabold text-slate-900">
                                          Customer Receipt
                                          {customerReceipts.length > 1
                                            ? ` #${receiptIndex + 1}`
                                            : ""}
                                        </p>

                                        {customerReceipt?.createdAtUtc && (
                                          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                                            {formatDate(
                                              customerReceipt.createdAtUtc
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openCustomerReceipt(
                                          customerReceipt?.receiptHtml,
                                          customerReceipts.length > 1
                                            ? receiptIndex + 1
                                            : undefined
                                        )
                                      }
                                      className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_22%,transparent)] transition hover:bg-secondary"
                                    >
                                      <MdOpenInNew className="h-4 w-4" />

                                      <span className="hidden sm:inline">
                                        Open Full Size
                                      </span>

                                      <span className="sm:hidden">Open</span>
                                    </button>
                                  </div>

                                  <div className="relative max-h-72 overflow-hidden bg-slate-100 p-3">
                                    <div
                                      className="receipt-container mx-auto max-w-md overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 text-slate-600 shadow-sm"
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          customerReceipt?.receiptHtml || "",
                                      }}
                                    />

                                    <div className="pointer-events-none absolute inset-x-3 bottom-3 h-16 rounded-b-xl bg-linear-to-t from-white via-white/80 to-transparent" />
                                  </div>

                                  <div className="border-t border-slate-100 bg-white p-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openCustomerReceipt(
                                          customerReceipt?.receiptHtml,
                                          customerReceipts.length > 1
                                            ? receiptIndex + 1
                                            : undefined
                                        )
                                      }
                                      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--primary-light) bg-(--primary-soft) text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white"
                                    >
                                      <MdOpenInNew className="h-4 w-4" />
                                      View Complete Customer Receipt
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Void / Refund Actions — hide if any transaction is a void or refund */}
                      {trx.payment_method === "ECR" &&
                        !transactions.some((t) => {
                          const type = (t.transaction_type || "").toLowerCase();
                          return type.includes("void") || type.includes("refund");
                        }) && (
                          <div className="border-t border-slate-100 px-5 py-4">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Actions
                            </p>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => confirmAction("void", trx)}
                                className="flex-1 cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 
                                transition hover:bg-red-100 disabled:opacity-50"
                              >
                                Void
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => confirmAction("refund", trx)}
                                className="flex-1 cursor-pointer rounded-2xl border border-(--primary-light) bg-(--primary-soft) px-4 py-3 text-sm font-bold 
                                text-secondary transition hover:bg-(--primary-soft) disabled:opacity-50"
                              >
                                Refund
                              </button>
                            </div>
                          </div>
                        )}

                      {/* ATHM Refund Action — only for ATHM transactions without existing void/refund */}
                      {(trx.payment_method || "").toUpperCase() === "ATHM" &&
                        !transactions.some((t) => {
                          const type = (t.transaction_type || "").toLowerCase();
                          return type.includes("void") || type.includes("refund");
                        }) && (
                          <div className="border-t border-slate-100 px-5 py-4">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Actions
                            </p>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => confirmAction("refund", trx, "ATHM")}
                                className="flex-1 cursor-pointer rounded-2xl border border-(--primary-light) bg-(--primary-soft) px-4 py-3 text-sm font-bold
                                text-secondary transition hover:bg-(--primary-soft) disabled:opacity-50"
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
                    <div
                      className="absolute inset-0 z-20 flex h-[115%] flex-col rounded-2xl border border-(--primary-light) bg-white/95 p-4 
                    shadow-[0_25px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                    >
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
                            <p className="mt-1 text-xs font-medium text-primary">
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
                    className="h-11 w-full cursor-pointer rounded-2xl bg-[var(--primary-soft)]0 text-sm font-bold text-white 
                    shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition bg-secondary"
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
            className="fixed inset-0 z-999999 flex flex-col items-center justify-center bg-black/95"
            onClick={closeLightbox}
          >
            {/* Close button — top-right, safe from nav */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--primary-soft)]0"
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white transition hover:bg-[var(--primary-soft)]0 md:left-4"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white transition hover:bg-[var(--primary-soft)]0 md:right-4"
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
                        ? "scale-110 border-primary"
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
