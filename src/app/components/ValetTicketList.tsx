"use client";
import React, { useState, useEffect, Dispatch } from "react";
import { CarPart, Ticket, TicketDetails } from "@/app/types";
import { FaCheck } from "react-icons/fa6";
import { MdOutlineCarCrash } from "react-icons/md";
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
  referenceNumber: string;
  notes?: string | undefined;
}

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
  const [acknowledged, setAcknowledged] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    amount: 0,
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
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
    ?.slice()
    .sort((a, b) => {
      if (activeTab !== "requested") return 0;
      return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1;
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      {activeTab !== "received" && filteredVehicles?.length > 0 && (
        <div className="text-center text-sm text-muted-foreground font-medium pb-1">
          <span className="capitalize">{activeTab}</span>:{" "}
          <span className="font-semibold text-foreground">{filteredVehicles?.length}</span> vehicles
        </div>
      )}
      {filteredVehicles?.length > 0 ? (
        filteredVehicles.map((vehicle, index) => {
          const isFirstRead =
            vehicle.isRead &&
            (index === 0 || !filteredVehicles[index - 1].isRead);

          return (
            <React.Fragment key={vehicle?.ticketNumber}>
              {vehicle?.status == "requested" && isFirstRead && (
                <div
                  className={`${
                    unreadTicketIds?.length > 0 ? "block" : "hidden"
                  } text-center text-xs text-muted-foreground`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span>Previously read</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </div>
              )}

              <div
                onClick={() => handleMarkAsRead(vehicle, "view")}
                className={`cursor-pointer bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4 hover:shadow-md transition-all ${
                  !vehicle?.isRead && vehicle?.status == "requested"
                    ? "border-l-2 border-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    vehicle?.status === "parked" ? "bg-blue-500" :
                    vehicle?.status === "requested" ? "bg-orange-500" :
                    vehicle?.status === "ready" ? "bg-emerald-500" : "bg-gray-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {vehicle?.firstName} {vehicle?.lastName}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(vehicle?.createdDateTime).toLocaleString([], {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-accent font-medium mt-0.5">
                      {vehicle?.color} {vehicle?.make} {vehicle?.model}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs text-gray-400 font-mono tracking-wider cursor-pointer hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(vehicle?.ticketNumber);
                        }}
                        title="Click to copy"
                      >
                        #{vehicle?.ticketNumber}
                      </span>
                      {!vehicle?.isRead && vehicle?.status === "requested" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>

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
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1 cursor-pointer"
                      >
                        View details
                      </button>
                    )}
                  </div>

                  {activeTab !== "ready" && (
                    <button
                      disabled={pageLoading}
                      type="button"
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        activeTab === "requested"
                          ? "bg-accent hover:bg-orange-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
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
                      <FaCheck className="w-4 h-4" />
                    </button>
                  )}
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
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </React.Fragment>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <MdOutlineCarCrash className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">No vehicles to show</p>
          <p className="text-sm text-gray-400 mt-1">
            Vehicles in this status will appear here.
          </p>

          <button
            disabled={pageLoading}
            onClick={() => setAcknowledged(true)}
            className={`mt-4 h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all ${
              acknowledged ? "w-11 px-0" : ""
            }`}
          >
            {acknowledged ? (
              <FaCheck className="w-4 h-4 text-white mx-auto" />
            ) : (
              "Got it!"
            )}
          </button>
        </div>
      )}

      {selectedTicketId && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        >
          <div className="px-4 py-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-tighter text-center">
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
