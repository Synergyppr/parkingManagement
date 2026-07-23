"use client";

import React, { useEffect, useMemo, useState, type Dispatch } from "react";
import { CarPart, Ticket, TicketDetails } from "@/app/types";
import { FaCheck } from "react-icons/fa6";
import { MdOutlineCarCrash } from "react-icons/md";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { LuCar } from "react-icons/lu";
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
        if (activeTab !== "requested") return 0;

        if (firstVehicle.isRead === secondVehicle.isRead) {
          return 0;
        }

        return firstVehicle.isRead ? 1 : -1;
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
      <div className="mb-8 grid gap-3 lg:grid-cols-2">
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

      {/* Meta row */}
      <div className="mb-7 flex flex-col gap-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2">
            <FiCalendar className="h-4 w-4" />
            Today, {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

              const createdDate = vehicle?.createdDateTime
                ? new Date(vehicle.createdDateTime)
                : null;

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
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />

                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-slate-900">
                            {vehicle?.color} {vehicle?.make} {vehicle?.model}
                          </h3>

                          <button
                            type="button"
                            className="mt-1 font-mono text-sm font-bold tracking-wide text-slate-500 transition"
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
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="flex cursor-default items-center justify-end gap-1 text-sm font-extrabold text-slate-700">
                          <FiClock className="h-4 w-4 text-slate-400" />

                          {createdDate
                            ? createdDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {createdDate
                            ? createdDate.toLocaleDateString([], {
                                month: "2-digit",
                                day: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 h-px bg-slate-100" />

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex cursor-default items-center gap-2 truncate text-sm font-bold capitalize text-slate-700">
                          <FiUser className="h-4 w-4 shrink-0 text-slate-400" />
                          {vehicle?.firstName} {vehicle?.lastName}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {activeTab !== "ready" && (
                          <button
                            disabled={pageLoading}
                            type="button"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-(--primary-soft) text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={(event) => {
                              event.stopPropagation();

                              handleStatusChange(
                                vehicle?.id,
                                activeTab === "parked"
                                  ? "requested"
                                  : activeTab === "requested"
                                  ? "ready"
                                  : ""
                              );
                            }}
                            aria-label="Move ticket to next status"
                          >
                            <FaCheck className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <div className="flex cursor-pointer items-center justify-between gap-1 rounded-full bg-(--primary-soft) px-4 py-2.5 text-primary transition duration-500 hover:bg-secondary hover:text-white">
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
                            className="cursor-pointer text-xs font-extrabold"
                          >
                            View details{" "}
                            <LuCar className="relative bottom-px inline h-4 w-4" />
                          </button>
                        </div>
                      </div>
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
    </div>
  );
}
