"use client";

import React, { useEffect, useMemo, useState, type Dispatch } from "react";
import { CarPart, Ticket, TicketDetails } from "@/app/types";
import { FaCheck } from "react-icons/fa6";
import { MdOutlineCarCrash, MdPrint, MdClose } from "react-icons/md";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { LuCar } from "react-icons/lu";
import { HiDocumentText, HiCreditCard } from "react-icons/hi2";
import Swal from "sweetalert2";
import Modal from "./Modal";
import TransactionForm from "./TransactionForm";
import {
  handleFetchTicketDetails,
  markAsRead,
} from "../helpers/dashboardHelpers";

interface ValetTicketListProps {
  vehicles: Ticket[];
  setVehicles: Dispatch<React.SetStateAction<Ticket[]>>;
  activeTab: string;
  unreadTicketIds: Ticket[];
  handleStatusChange: (
    id: string,
    status: "" | "received" | "parked" | "requested" | "ready" | null
  ) => void;
  showTransactionModal: boolean;
  setShowTransactionModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTicketId: string | null;
  setSelectedTicketId: React.Dispatch<React.SetStateAction<string | null>>;
  latitude?: number;
  longitude?: number;
  locationMode?: "live" | "manual";
  propertyId?: string | null;
  pageLoading?: boolean;
  setReloadPageData: Dispatch<React.SetStateAction<boolean>>;
  setTicketDetails: Dispatch<React.SetStateAction<TicketDetails>>;
  setIncidentParts: Dispatch<React.SetStateAction<CarPart[]>>;
  setDescriptions: Dispatch<React.SetStateAction<Record<string, string>>>;
  setDamagedParts: Dispatch<React.SetStateAction<CarPart[]>>;
  setShowTicketDetailsModal: Dispatch<React.SetStateAction<boolean>>;
}

interface TransactionFormState {
  amount: number;
  paymentMethod: string;
  transactionTypeId: number;
  notes?: string;
  pin?: string;
  value?: number;
}

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

const RECORD_OPTIONS = [6, 12, 24, 48];

const getStatusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Received";

const createPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
};

export default function ValetTicketList({
  vehicles,
  setVehicles,
  activeTab,
  unreadTicketIds,
  handleStatusChange,
  showTransactionModal,
  setShowTransactionModal,
  selectedTicketId,
  setSelectedTicketId,
  latitude,
  longitude,
  locationMode,
  propertyId,
  pageLoading,
  setReloadPageData,
  setTicketDetails,
  setIncidentParts,
  setDescriptions,
  setDamagedParts,
  setShowTicketDetailsModal,
}: ValetTicketListProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(12);

  const [transactionForm, setTransactionForm] = useState<TransactionFormState>({
    amount: 0,
    paymentMethod: "",
    transactionTypeId: 0,
    notes: "",
    pin: "",
    value: 0,
  });

  const [clickLoader, setClickLoader] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [reportLoading, setReportLoading] = useState<"journal" | "settlement" | null>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [reportType, setReportType] = useState<"journal" | "settlement" | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({
        x: event.clientX,
        y: event.clientY,
      });
    };

    if (clickLoader) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [clickLoader]);

  const handleMarkAsRead = async (
    vehicle: Ticket,
    action: "view" | "changeStatus"
  ) => {
    if (activeTab !== "requested") return;

    setClickLoader(true);

    try {
      await markAsRead({
        vehicle,
        action,
        setSelectedTicketId,
        setReloadPageData,
        setVehicles,
      });
    } finally {
      setClickLoader(false);
    }
  };

  const fetchDefaultTerminal = async (): Promise<Record<string, unknown> | null> => {
    try {
      const res = await fetch("/api/terminals/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId }),
      });
      const data = await res.json();
      const terminalList = data?.result?.data || [];
      return (
        terminalList.find((t: Record<string, unknown>) => t.is_default) ||
        terminalList[0] ||
        null
      );
    } catch {
      return null;
    }
  };

  const handleReport = async (type: "journal" | "settlement") => {
    if (!propertyId) return;

    const label = type === "journal" ? "Journal" : "Settlement";

    // Prompt for cashier PIN
    const pinPrompt = await Swal.fire({
      title: `${label}`,
      html: `
        <p class="text-sm text-slate-600 mb-4">Enter your cashier PIN to run the ${label.toLowerCase()}.</p>
        <input id="swal-cashier-pin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN"
          class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      `,
      showCancelButton: true,
      confirmButtonText: `Run ${label}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d6a800",
      cancelButtonColor: "#64748b",
      preConfirm: () => {
        const pin = (document.getElementById("swal-cashier-pin") as HTMLInputElement)?.value?.trim();
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          Swal.showValidationMessage("Please enter a valid 4-digit PIN.");
          return false;
        }
        return pin;
      },
    });

    if (!pinPrompt.isConfirmed || !pinPrompt.value) return;

    const cashierPin = pinPrompt.value as string;
    setReportLoading(type);

    try {
      const terminal = await fetchDefaultTerminal();
      if (!terminal?.id) {
        Swal.fire({
          title: "No Terminal Found",
          text: "No payment terminal is configured for this property. Please add one in Settings.",
          icon: "error",
        });
        setReportLoading(null);
        return;
      }

      const terminalId = terminal.id as string;
      const stationNumber = (terminal.station_number ?? terminal.stationNumber ?? "") as string;

      const endpoint =
        type === "journal"
          ? "/api/valetTransaction/journal"
          : "/api/valetTransaction/settlement";

      const body =
        type === "journal"
          ? { propertyId, terminalId, stationNumber, cashierId: cashierPin, targetReference: "all" }
          : { propertyId, terminalId, stationNumber, cashierId: cashierPin, receiptOutput: "both" };

      console.log(`[${type}] ENDPOINT:`, endpoint);
      console.log(`[${type}] REQUEST:`, JSON.stringify(body, null, 2));

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log(`[${type}] RESPONSE:`, JSON.stringify(data, null, 2));

      setReportData(data?.result ?? data);
      setReportType(type);
    } catch (error) {
      console.error(`[${type}] error:`, error);
      Swal.fire({
        title: "Error",
        text: `An unexpected error occurred while fetching the ${type}.`,
        icon: "error",
      });
    } finally {
      setReportLoading(null);
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const title = reportType === "journal" ? "Journal Report" : "Settlement Report";
    const content = document.getElementById("report-content")?.innerHTML || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1e293b; font-size: 12px; }
          h2 { font-size: 18px; margin-bottom: 2px; }
          .subtitle { color: #94a3b8; font-size: 11px; margin-bottom: 16px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
          .summary-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
          .summary-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
          .summary-value { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
          th { background: #f1f5f9; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; padding: 6px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; }
          td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; }
          .type-sale { color: #16a34a; font-weight: 700; }
          .type-refund { color: #dc2626; font-weight: 700; }
          .type-void { color: #d97706; font-weight: 700; }
          .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
          .total-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
          .total-box.sale { border-color: #bbf7d0; background: #f0fdf4; }
          .total-box.refund { border-color: #fecaca; background: #fef2f2; }
          .total-box.void { border-color: #fed7aa; background: #fffbeb; }
          .total-box.net { border-color: #bfdbfe; background: #eff6ff; }
          .total-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .total-value { font-size: 16px; font-weight: 800; margin-top: 4px; }
          .host-header { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-top: 16px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
          .ivu { font-size: 9px; color: #94a3b8; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
        ${content}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredVehicles = useMemo(() => {
    const statusFilteredVehicles =
      activeTab === "ready"
        ? vehicles
        : vehicles.filter((vehicle: Ticket) => {
            if (activeTab === "received") {
              return vehicle.status === "" || vehicle.status === "received";
            }

            return vehicle.status === activeTab;
          });

    const query = search.trim().toLowerCase();

    return statusFilteredVehicles
      .filter((vehicle) => {
        if (!query) return true;

        return [
          vehicle?.ticketNumber,
          vehicle?.firstName,
          vehicle?.lastName,
          vehicle?.licensePlate,
          vehicle?.vehicles?.licensePlate,
          vehicle?.color,
          vehicle?.make,
          vehicle?.model,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice()
      .sort((firstVehicle, secondVehicle) => {
        if (activeTab === "requested") {
          if (firstVehicle.isRead !== secondVehicle.isRead) {
            return firstVehicle.isRead ? 1 : -1;
          }
        }

        const dateA = new Date(firstVehicle.lastUpdated || firstVehicle.createdDateTime).getTime();
        const dateB = new Date(secondVehicle.lastUpdated || secondVehicle.createdDateTime).getTime();
        return dateB - dateA;
      });
  }, [activeTab, search, vehicles]);

  const totalRecords = filteredVehicles.length;

  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);

  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  const paginationItems = createPaginationItems(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, recordsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const changePage = (page: number) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);

    setCurrentPage(safePage);

    window.requestAnimationFrame(() => {
      document.getElementById("active-ticket-list")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleRecordsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRecordsPerPage(Number(event.target.value));
  };

  return (
    <div
      id="active-ticket-list"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-8"
    >
      {/* Header */}
      <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Active Tickets
            </h1>

            {activeTab !== "received" && totalRecords > 0 && (
              <span className="rounded-full border border-secondary bg-(--primary-soft) px-3 py-1 text-xs font-extrabold text-primary">
                {totalRecords} {getStatusLabel(activeTab)}
              </span>
            )}
          </div>

          <p className="max-w-xl text-sm leading-5 text-slate-500">
            Managing current high-value vehicle assets securely. Monitor arrival
            times and status updates in real-time.
          </p>
        </div>
      </div>

      {/* Search / Actions */}
      <div className="mb-8 grid gap-3 lg:grid-cols-[70%_30%]">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            autoFocus={false}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Ticket ID, Guest Name, or License Plate..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-(--primary-light) focus:ring-4 focus:ring-(--primary-soft)"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/check-in?status=received";
          }}
          className="h-12 cursor-pointer rounded-2xl bg-primary px-7 text-sm font-extrabold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition hover:bg-secondary"
        >
          New Check-in
        </button>

        <div className="flex w-full justify-center gap-2 lg:justify-end"></div>
      </div>

      {/* Journal / Settlement — Ready tab only */}
      {activeTab === "ready" && (
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={reportLoading !== null}
            onClick={() => handleReport("journal")}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reportLoading === "journal" ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <HiDocumentText className="h-4 w-4" />
            )}
            {reportLoading === "journal" ? "Loading..." : "Journal"}
          </button>

          <button
            type="button"
            disabled={reportLoading !== null}
            onClick={() => handleReport("settlement")}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reportLoading === "settlement" ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <HiCreditCard className="h-4 w-4" />
            )}
            {reportLoading === "settlement" ? "Processing..." : "Settlement"}
          </button>
        </div>
      )}

      {/* Meta row */}
      <div className="mb-7 flex flex-col gap-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center justify-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-center md:text-left">
          <span className="flex items-center gap-2">
            <FiCalendar className="h-4 w-4" />
            Today, {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-center md:text-left">
          {totalRecords > 0 && (
            <span>
              Showing {startIndex + 1}–{endIndex} of {totalRecords}
            </span>
          )}

          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-400">
              Per page
            </span>

            <select
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-(--primary-light) focus:ring-4 focus:ring-(--primary-soft)"
              aria-label="Records shown per page"
            >
              {RECORD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Cards */}
      {totalRecords > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedVehicles.map((vehicle, pageIndex) => {
              /*
               * Use the original filtered-list index so the "Previously read"
               * divider remains correct across pagination boundaries.
               */
              const globalIndex = startIndex + pageIndex;

              const isFirstRead =
                vehicle.isRead &&
                (globalIndex === 0 ||
                  !filteredVehicles[globalIndex - 1]?.isRead);

              const rawDate = vehicle?.lastUpdated ?? vehicle?.createdDateTime;
              const displayDate = rawDate ? new Date(rawDate) : null;
              console.log(`[TICKET-DEBUG] ${vehicle?.ticketNumber}:`, {
                lastUpdated: vehicle?.lastUpdated,
                createdDateTime: vehicle?.createdDateTime,
                using: rawDate,
              });

              return (
                <React.Fragment key={vehicle?.id || vehicle?.ticketNumber}>
                  {vehicle?.status === "requested" && isFirstRead && (
                    <div
                      className={`${
                        unreadTicketIds?.length > 0 ? "block" : "hidden"
                      } col-span-full text-center text-xs text-slate-400`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />

                        <span>Previously read</span>

                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => handleMarkAsRead(vehicle, "view")}
                    className={`group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${
                      !vehicle?.isRead && vehicle?.status === "requested"
                        ? "border-l-4 border-l-primary"
                        : "border-slate-200"
                    }`}
                  >
                    {/* Guest name + time */}
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-2 truncate text-base font-extrabold capitalize text-slate-900">
                          <FiUser className="h-4 w-4 shrink-0 text-primary" />
                          {vehicle?.firstName} {vehicle?.lastName}
                        </h3>

                        <button
                          type="button"
                          className="mt-0.5 ml-6 font-mono text-xs font-bold tracking-wide text-slate-400 transition hover:text-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigator.clipboard.writeText(
                              vehicle?.ticketNumber
                            );
                          }}
                          title="Click to copy"
                        >
                          # {vehicle?.ticketNumber}
                        </button>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="flex cursor-default items-center justify-end gap-1 text-sm font-extrabold text-slate-700">
                          <FiClock className="h-3.5 w-3.5 text-slate-400" />
                          {displayDate
                            ? displayDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>

                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                          {displayDate
                            ? displayDate.toLocaleDateString([], {
                                month: "2-digit",
                                day: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Vehicle info */}
                    <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />

                      <p className="truncate text-sm font-bold text-slate-600">
                        {vehicle?.color} {vehicle?.make} {vehicle?.model}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {activeTab !== "ready" && (
                        <button
                          disabled={pageLoading}
                          type="button"
                          className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStatusChange(
                              vehicle?.id,
                              activeTab === "received"
                                ? "parked"
                                : activeTab === "parked"
                                ? "requested"
                                : activeTab === "requested"
                                ? "ready"
                                : ""
                            );
                          }}
                        >
                          <FaCheck className="h-3 w-3" />
                          {activeTab === "received"
                            ? "Mark Parked"
                            : activeTab === "parked"
                            ? "Mark Requested"
                            : "Mark Ready"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleFetchTicketDetails({
                            id: vehicle?.id,
                            setTicketDetails,
                            setIncidentParts,
                            setDescriptions,
                            setDamagedParts,
                            setShowTicketDetailsModal,
                          });
                        }}
                        className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 transition hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary ${
                          activeTab === "ready" ? "flex-1" : "px-4"
                        }`}
                      >
                        Details
                        <LuCar className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-center text-sm font-semibold text-slate-500 sm:text-left">
                Showing{" "}
                <span className="font-extrabold text-slate-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-extrabold text-slate-900">
                  {endIndex}
                </span>{" "}
                of{" "}
                <span className="font-extrabold text-slate-900">
                  {totalRecords}
                </span>{" "}
                tickets
              </div>

              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                  aria-label="Previous page"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {paginationItems.map((item) => {
                    if (item === "start-ellipsis" || item === "end-ellipsis") {
                      return (
                        <span
                          key={item}
                          className="flex h-10 min-w-8 items-center justify-center px-1 text-sm font-bold text-slate-400"
                        >
                          ...
                        </span>
                      );
                    }

                    const isActive = item === currentPage;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => changePage(item)}
                        className={`flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-extrabold transition ${
                          isActive
                            ? "bg-primary text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary"
                        }`}
                        aria-label={`Go to page ${item}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                  aria-label="Next page"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>

              <label className="flex items-center justify-center gap-2 sm:justify-end">
                <span className="whitespace-nowrap text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Rows
                </span>

                <select
                  value={recordsPerPage}
                  onChange={handleRecordsPerPageChange}
                  className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-sm font-extrabold text-slate-700 outline-none transition focus:border-(--primary-light) focus:bg-white focus:ring-4 focus:ring-(--primary-soft)"
                  aria-label="Records per page"
                >
                  {RECORD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-24 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--primary-soft)">
            <MdOutlineCarCrash className="h-8 w-8 text-primary" />
          </div>

          <p className="text-lg font-extrabold text-slate-700">
            No vehicles to show
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {search.trim()
              ? "No tickets match your current search."
              : "Vehicles in this status will appear here."}
          </p>
        </div>
      )}

      {totalRecords > 0 && (
        <div className="mt-12 border-t border-slate-200 pt-10 text-center">
          <p className="mx-auto max-w-md text-sm font-medium leading-6 text-slate-500">
            Use the pagination controls to browse all active{" "}
            {getStatusLabel(activeTab).toLowerCase()} vehicles, or use the
            report to find historical records and requested returns.
          </p>
        </div>
      )}

      {clickLoader && (
        <div
          className="pointer-events-none fixed z-9999"
          style={{
            top: `${mousePos.y + 40}px`,
            left: `${mousePos.x + 12}px`,
          }}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {selectedTicketId && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        >
          <div className="px-4 pb-2 pt-6">
            <h3 className="mb-2 text-center text-xl font-base uppercase tracking-widest text-slate-400">
              Transaction Details
            </h3>

            <TransactionForm
              form={transactionForm}
              setForm={setTransactionForm}
              ticketId={selectedTicketId || ""}
              setOpen={setShowTransactionModal}
              latitude={latitude}
              longitude={longitude}
              locationMode={locationMode}
              propertyId={propertyId}
              setReloadPageData={setReloadPageData}
            />
          </div>
        </Modal>
      )}

      {/* Report Results Modal (Journal / Settlement) */}
      <Modal
        isOpen={reportData !== null}
        onClose={() => {
          setReportData(null);
          setReportType(null);
        }}
        size="lg"
      >
        <div className="px-5 pb-5 pt-6">
          {/* Modal Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--primary-soft)">
                {reportType === "journal" ? (
                  <HiDocumentText className="h-5 w-5 text-primary" />
                ) : (
                  <HiCreditCard className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {reportType === "journal" ? "Journal Report" : "Settlement Report"}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintReport}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary"
              >
                <MdPrint className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportData(null);
                  setReportType(null);
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div
            id="report-content"
            className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60"
          >
            <ReportTable data={reportData} type={reportType} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Helpers ─── */
interface JournalTransaction {
  transaction_date?: string;
  transaction_time?: string;
  transaction_type?: string;
  pan_card_number?: string;
  card_bin_type?: string;
  amounts?: {
    total?: string;
    base_state_tax?: string;
    tip?: string;
    state_tax?: string;
    city_tax?: string;
    reduced_tax?: string;
    base_reduced_tax?: string;
  };
  authorization_code?: string;
  trace_number?: string;
  reference?: string;
  invoice?: string;
  entry_type?: string;
  ivu?: { control_line1?: string; control_line2?: string };
  approval_code?: string;
  special_account?: string;
  payment_host?: string;
}

interface HostBatch {
  batch_number?: string;
  merchant_id?: string;
  terminal_id?: string;
  trans?: JournalTransaction[];
}

const formatTrxDate = (raw?: string) => {
  if (!raw || raw.length !== 8) return raw || "—";
  return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
};

const formatTrxTime = (raw?: string) => {
  if (!raw || raw.length !== 6) return raw || "—";
  return `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4)}`;
};

const typeClass = (type?: string) => {
  switch (type?.toUpperCase()) {
    case "SALE": return "text-emerald-600";
    case "REFUND": return "text-red-500";
    case "VOID": return "text-amber-500";
    default: return "text-slate-700";
  }
};

/* ─── Report Table renderer ─── */
function ReportTable({
  data,
  type,
}: {
  data: Record<string, unknown> | null;
  type: "journal" | "settlement" | null;
}) {
  if (!data) return null;

  // Handle "NO TRANSACTIONS" specifically
  const errorMessage = (data?.error_message as string) || "";
  const isNoTransactions = errorMessage.toUpperCase().includes("NO TRANSACTIONS");

  if (isNoTransactions) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <HiDocumentText className="h-7 w-7 text-amber-400" />
        </div>
        <p className="text-base font-extrabold text-slate-700">
          No Transactions in Current Batch
        </p>
        <p className="mt-2 max-w-xs text-sm leading-5 text-slate-400">
          There are no unsettled transactions to display. This batch is empty — transactions will appear here after new sales are processed.
        </p>
      </div>
    );
  }

  // Handle other error responses
  const isError =
    (data?.success === false && !isNoTransactions) ||
    data?.status === "400" ||
    data?.status === "500";

  if (isError) {
    const message =
      (data?.message as string) ||
      errorMessage ||
      "An error occurred.";
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-bold text-red-500">Error</p>
        <p className="mt-1 text-sm text-slate-600">{String(message)}</p>
      </div>
    );
  }

  // Extract operation result (journal/settlement response structure)
  const operationResult = data?.operation_result as Record<string, unknown> | undefined;
  const providerResponse = operationResult?.provider_response as Record<string, unknown> | undefined;
  const referenceValue = providerResponse?.reference_value as Record<string, HostBatch> | undefined;

  // ── Settlement-specific rendering ──
  if (type === "settlement") {
    const finalStatus = data?.final_status as string || "—";
    const isSuccess = data?.success === true;
    const operationSucceeded = data?.operation_succeeded === true;
    const logoffMsg = data?.logoff_error_message as string | null;

    // Extract settlement_data from final_status_result
    const finalStatusResult = data?.final_status_result as Record<string, unknown> | undefined;
    const finalProvider = finalStatusResult?.provider_response as Record<string, unknown> | undefined;
    const settlementData = finalProvider?.settlement_data as Record<string, Record<string, Record<string, string>>> | undefined;

    // Extract receipt HTML
    const settlementReceipt = data?.settlement_receipt as Record<string, unknown> | undefined;
    const receiptHtml = settlementReceipt?.receipt_html as string | undefined;

    const summaryFields = [
      { label: "Status", value: finalStatus, highlight: true },
      { label: "Result", value: operationSucceeded ? "Approved" : "Failed" },
      { label: "Transaction ID", value: (data?.trx_id as string) || "—" },
      { label: "Session", value: (data?.session_id as string) || "—" },
      { label: "Terminal", value: (finalProvider?.terminal_id as string) || (providerResponse?.terminal_id as string) || "—" },
      { label: "Merchant", value: (finalProvider?.merchant_id as string) || (providerResponse?.merchant_id as string) || "—" },
    ];

    return (
      <div className="divide-y divide-slate-100">
        {/* Status banner */}
        <div className={`px-5 py-4 text-center ${isSuccess ? "bg-emerald-50" : "bg-red-50"}`}>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
            isSuccess
              ? "border border-emerald-200 bg-white text-emerald-600"
              : "border border-red-200 bg-white text-red-600"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
            {finalStatus}
          </div>
          {logoffMsg && logoffMsg !== "APPROVED." && (
            <p className="mt-2 text-xs font-semibold text-amber-600">
              Logoff: {logoffMsg}
            </p>
          )}
        </div>

        {/* Settlement details */}
        <div className="p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Settlement Details
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summaryFields.map((field) => (
              <div
                key={field.label}
                className={`rounded-xl px-3 py-2.5 ${
                  field.highlight ? "col-span-2 bg-white sm:col-span-3" : "bg-white"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {field.label}
                </p>
                <p className="mt-0.5 break-all text-sm font-extrabold text-slate-800">
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement Totals by Type */}
        {settlementData && (
          <div className="p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Batch Totals
            </p>
            <div className="space-y-3">
              {Object.entries(settlementData).map(([hostName, hostData]) => {
                const credit = hostData?.Credit;
                const debit = hostData?.Debit;
                const cash = hostData?.Cash;
                const batchMsg = (hostData?.response_message as unknown as string || "").replace(/"/g, "").trim();

                const categories = [
                  ...(credit ? [{ label: "Credit", sales: credit.credSalesAmt, salesCount: credit.credSalesCount, refunds: credit.credRefundsAmt, refundsCount: credit.credRefundsCount }] : []),
                  ...(debit ? [{ label: "Debit", sales: debit.debSalesAmt, salesCount: debit.debSalesCount, refunds: debit.debRefundsAmt, refundsCount: debit.debRefundsCount }] : []),
                  ...(cash ? [{ label: "Cash", sales: cash.cashSalesAmt, salesCount: cash.cashSalesCount, refunds: cash.cashRefundsAmt, refundsCount: cash.cashRefundsCount }] : []),
                ];

                return (
                  <div key={hostName} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                      <p className="text-xs font-extrabold text-slate-700">Host: {hostName}</p>
                      {batchMsg && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">
                          {batchMsg}
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <div key={cat.label} className="grid grid-cols-3 gap-2 px-4 py-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{cat.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold uppercase text-slate-400">Sales ({cat.salesCount})</p>
                            <p className="text-sm font-extrabold text-slate-800">${cat.sales}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold uppercase text-slate-400">Refunds ({cat.refundsCount})</p>
                            <p className="text-sm font-extrabold text-slate-800">${cat.refunds}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Receipt HTML */}
        {receiptHtml && (
          <div className="p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Settlement Receipt
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 overflow-auto">
              <div
                className="receipt-container"
                dangerouslySetInnerHTML={{ __html: receiptHtml }}
              />
            </div>
          </div>
        )}

        {/* Operation timeline */}
        <div className="p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Operation Log
          </p>
          <div className="space-y-2">
            {[
              { step: "Logon", success: data?.logon_succeeded as boolean, msg: (data?.logon_result as Record<string, unknown>)?.message as string },
              { step: "Settlement", success: data?.operation_succeeded as boolean, msg: (operationResult?.message as string) },
              { step: "Status Polling", success: data?.status_polling_succeeded as boolean, msg: (finalStatusResult?.message as string) },
              { step: "Logoff", success: data?.logoff_succeeded as boolean, msg: logoffMsg || (data?.logoff_result as Record<string, unknown>)?.message as string },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${
                  item.success ? "bg-emerald-500" : "bg-red-400"
                }`}>
                  {item.success ? "✓" : "✗"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-700">{item.step}</p>
                  <p className="truncate text-[10px] text-slate-400">{item.msg || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no structured data, fallback to raw JSON
  if (!providerResponse && !referenceValue) {
    const flatKeys = Object.keys(data).filter(
      (k) => typeof data[k] !== "object" || data[k] === null
    );

    if (flatKeys.length > 0) {
      return (
        <div className="p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Summary
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {flatKeys.map((key) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                <span className="font-semibold capitalize text-slate-500">{key.replace(/_/g, " ")}</span>
                <span className="font-bold text-slate-800">{String(data[key] ?? "—")}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <pre className="max-h-80 overflow-auto rounded-xl bg-white p-4 text-xs text-slate-600">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  // ── Journal-specific rendering ──
  // Collect all transactions from all hosts
  const allTransactions: JournalTransaction[] = [];
  const hostEntries = referenceValue ? Object.entries(referenceValue) : [];

  hostEntries.forEach(([, hostData]) => {
    if (hostData?.trans) {
      allTransactions.push(...hostData.trans);
    }
  });

  // Calculate totals
  const totals = allTransactions.reduce(
    (acc, trx) => {
      const amount = parseFloat(trx.amounts?.total || "0");
      const trxType = (trx.transaction_type || "").toUpperCase();
      if (trxType === "SALE") { acc.sales += amount; acc.salesCount++; }
      else if (trxType === "REFUND") { acc.refunds += amount; acc.refundsCount++; }
      else if (trxType === "VOID") { acc.voids += amount; acc.voidsCount++; }
      return acc;
    },
    { sales: 0, refunds: 0, voids: 0, salesCount: 0, refundsCount: 0, voidsCount: 0 }
  );

  const net = totals.sales - totals.refunds - totals.voids;

  return (
    <div className="divide-y divide-slate-100">
      {/* ── Summary ── */}
      <div className="p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          {type === "journal" ? "Batch Summary" : "Settlement Summary"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: "Status", value: (data?.final_status as string) || (providerResponse?.response_message as string) || "—" },
            { label: "Session", value: (data?.session_id as string) || "—" },
            { label: "Terminal", value: (providerResponse?.terminal_id as string) || "—" },
            { label: "Merchant", value: (providerResponse?.merchant_id as string) || "—" },
            { label: "Total Trx", value: (providerResponse?.total_transactions as string) || String(allTransactions.length) },
            ...(hostEntries.length > 0
              ? [{ label: "Batch #", value: hostEntries[0]?.[1]?.batch_number || "—" }]
              : []),
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-800 break-all">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Totals ── */}
      {allTransactions.length > 0 && (
        <div className="p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Totals
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500">
                Sales ({totals.salesCount})
              </p>
              <p className="mt-1 text-lg font-extrabold text-emerald-700">
                ${totals.sales.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-red-400">
                Refunds ({totals.refundsCount})
              </p>
              <p className="mt-1 text-lg font-extrabold text-red-600">
                ${totals.refunds.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-500">
                Voids ({totals.voidsCount})
              </p>
              <p className="mt-1 text-lg font-extrabold text-amber-600">
                ${totals.voids.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-400">
                Net
              </p>
              <p className="mt-1 text-lg font-extrabold text-blue-700">
                ${net.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Transactions by host ── */}
      {hostEntries.map(([hostName, hostData]) => (
        <div key={hostName} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {hostName} — Batch #{hostData.batch_number || "—"}
            </p>
            <p className="text-xs font-bold text-slate-400">
              {hostData.trans?.length || 0} transaction(s)
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">#</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Date / Time</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Type</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Card</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Total</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Base</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Tax</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Tip</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Auth</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Trace</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Invoice</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Entry</th>
                  <th className="whitespace-nowrap px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-400">IVU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(hostData.trans || []).map((trx, i) => {
                  const stateTax = parseFloat(trx.amounts?.state_tax || "0");
                  const cityTax = parseFloat(trx.amounts?.city_tax || "0");
                  const totalTax = stateTax + cityTax;
                  const ivuControl = trx.ivu?.control_line1?.replace("CONTROL: ", "") || "—";

                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-slate-400">
                        {i + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        <span className="font-bold">{formatTrxDate(trx.transaction_date)}</span>
                        <br />
                        <span className="text-[10px] text-slate-400">{formatTrxTime(trx.transaction_time)}</span>
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2 text-xs font-extrabold ${typeClass(trx.transaction_type)}`}>
                        {trx.transaction_type || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        <span className="font-bold">****{trx.pan_card_number || "—"}</span>
                        <br />
                        <span className="text-[10px] text-slate-400">{trx.card_bin_type?.replace(/_/g, " ") || ""}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-extrabold text-slate-800">
                        ${trx.amounts?.total || "0.00"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        ${trx.amounts?.base_state_tax || "0.00"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        ${totalTax.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        ${trx.amounts?.tip || "0.00"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-mono font-bold text-slate-700">
                        {trx.authorization_code || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-mono text-slate-500">
                        {trx.trace_number || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-mono text-slate-500">
                        {trx.invoice || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                        {trx.entry_type || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-mono text-slate-400">
                        {ivuControl}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

    </div>
  );
}
