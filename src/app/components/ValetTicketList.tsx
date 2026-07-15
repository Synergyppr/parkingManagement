"use client";
import React, { useState, useEffect, Dispatch } from "react";
import { CarPart, Ticket, TicketDetails } from "@/app/types";
import { FaCheck } from "react-icons/fa6";
import { MdOutlineCarCrash } from "react-icons/md";
import { FiSearch, FiCalendar, FiClock, FiUser } from "react-icons/fi";
import { LuArrowUpDown, LuCar } from "react-icons/lu";
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
  damagedParts?: CarPart[];
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

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  transactionTypeId: number;
  notes?: string;
  pin?: string;
  value?: number;
}

// const statusTabs = ["received", "parked", "requested", "ready"];

const getStatusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Received";

export default function ValetTicketList({
  vehicles,
  setVehicles,
  activeTab,
  unreadTicketIds,
  damagedParts,
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
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    amount: 0,
    paymentMethod: "",
    transactionTypeId: 0,
    notes: "",
    pin: "",
    value: 0,
  });
  const [clickLoader, setClickLoader] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (clickLoader) {
      window.addEventListener("mousemove", handleMouseMove);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
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

  const filteredVehicles = (
    activeTab === "ready"
      ? vehicles
      : vehicles?.filter((vehicle: Ticket) => {
          if (activeTab === "received") {
            return vehicle.status === "" || vehicle.status === "received";
          }
          return vehicle.status === activeTab;
        })
  )
    ?.filter((vehicle) => {
      const query = search.trim().toLowerCase();
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
    ?.slice()
    .sort((a, b) => {
      if (activeTab !== "requested") return 0;
      return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1;
    });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Active Tickets
            </h1>

            {activeTab !== "received" && filteredVehicles?.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">
                {filteredVehicles.length} {getStatusLabel(activeTab)}
              </span>
            )}
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Managing current high-value vehicle assets securely. Monitor arrival
            times and status updates in real-time.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* <div className="grid grid-cols-4 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {statusTabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    window.location.href = `/dashboard?status=${tab}`;
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    isActive
                      ? "border border-amber-300 bg-white text-amber-700 shadow-sm"
                      : "text-slate-500 hover:text-amber-700"
                  }`}
                >
                  {getStatusLabel(tab)}
                </button>
              );
            })}
          </div> */}

          {/* <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 
            shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <FiFilter className="h-4 w-4" />
            Filter
          </button> */}
        </div>
      </div>

      {/* Search / Actions */}
      <div className="mb-8 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket ID, Guest Name, or License Plate..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-sm font-bold text-slate-700 transition 
          hover:bg-slate-200 cursor-pointer"
        >
          <LuArrowUpDown className="h-4 w-4" />
          Sort: Recent
        </button>

        <button
          type="button"
          onClick={() => (window.location.href = "/check-in?status=received")}
          className="h-12 rounded-2xl bg-amber-500 px-7 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(217,174,38,0.28)] transition 
          hover:bg-amber-600 cursor-pointer"
        >
          New Check-in
        </button>
      </div>

      {/* Meta row */}
      <div className="mb-7 flex flex-col gap-3 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2">
            <FiCalendar className="h-4 w-4" />
            Today, {new Date().toLocaleDateString()}
          </span>

          <span className="hidden h-4 w-px bg-slate-200 sm:block" />

          <span>Shift: Current Operations</span>
        </div>

        {filteredVehicles?.length > 0 && (
          <span>
            Showing {filteredVehicles.length} vehicles currently{" "}
            {getStatusLabel(activeTab).toLowerCase()}
          </span>
        )}
      </div>

      {/* Cards */}
      {filteredVehicles?.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle, index) => {
            const isFirstRead =
              vehicle.isRead &&
              (index === 0 || !filteredVehicles[index - 1].isRead);

            const createdDate = vehicle?.createdDateTime
              ? new Date(vehicle.createdDateTime)
              : null;

            return (
              <React.Fragment key={vehicle?.ticketNumber}>
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
                  className={`group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 
                    hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${
                    !vehicle?.isRead && vehicle?.status === "requested"
                      ? "border-l-4 border-l-amber-500"
                      : "border-slate-200"
                  }`}
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-slate-900">
                          {vehicle?.color} {vehicle?.make} {vehicle?.model}
                        </h3>

                        <button
                          type="button"
                          className="mt-1 font-mono text-sm font-bold tracking-wide text-slate-500 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(vehicle?.ticketNumber);
                          }}
                          title="Click to copy"
                        >
                          # {vehicle?.ticketNumber}
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1 text-sm font-extrabold text-slate-700 cursor-default">
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
                      <p className="flex items-center gap-2 truncate text-sm font-bold text-slate-700 cursor-default">
                        <FiUser className="h-4 w-4 shrink-0 text-slate-400" />
                        {vehicle?.firstName} {vehicle?.lastName}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {damagedParts && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFetchTicketDetails({
                              id: vehicle?.id,
                              setTicketDetails,
                              setIncidentParts,
                              setDescriptions,
                              setDamagedParts,
                              setShowTicketDetailsModal,
                            });
                          }}
                          className="text-sm font-extrabold text-amber-600 transition hover:text-amber-700 cursor-pointer"
                        >
                          View details
                        </button>
                      )}

                      {activeTab !== "ready" && (
                        <button
                          disabled={pageLoading}
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-500 
                          hover:text-white disabled:opacity-60 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(
                              vehicle?.id,
                              activeTab === "parked"
                                ? "requested"
                                : activeTab === "requested"
                                ? "ready"
                                : ""
                            );
                          }}
                        >
                          <FaCheck className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 cursor-default">
                        <LuCar className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {clickLoader && (
                  <div
                    className="fixed z-9999 pointer-events-none"
                    style={{
                      top: `${mousePos.y + 40}px`,
                      left: `${mousePos.x + 12}px`,
                    }}
                  >
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-24 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <MdOutlineCarCrash className="h-8 w-8 text-amber-500" />
          </div>

          <p className="text-lg font-extrabold text-slate-700">
            No vehicles to show
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Vehicles in this status will appear here.
          </p>

          {/* <button
            disabled={pageLoading}
            className={`mt-5 h-11 rounded-xl bg-amber-500 px-6 text-sm font-bold text-white transition`}
          >
            Got it!
          </button> */}
        </div>
      )}

      {filteredVehicles?.length > 0 && (
        <div className="mt-12 border-t border-slate-200 pt-10 text-center">
          <p className="mx-auto max-w-md text-sm font-medium leading-6 text-slate-500">
            All active {getStatusLabel(activeTab).toLowerCase()} vehicles are
            displayed. Use the report to find historical records or requested
            returns.
          </p>

          {/* <button
            type="button"
            className="mt-5 text-sm font-extrabold text-amber-600 transition hover:text-amber-700"
          >
            Load archived tickets
          </button> */}
        </div>
      )}

      {selectedTicketId && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        >
          <div className="px-4 pt-6 pb-2">
            <h3 className="mb-2 text-center text-xl font-base text-slate-400 tracking-widest uppercase">
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