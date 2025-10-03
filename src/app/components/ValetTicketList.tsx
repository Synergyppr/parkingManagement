"use client";
import React, { useState, useEffect } from "react";
import { Ticket } from "@/app/types";
import { FaCheck } from "react-icons/fa6";
import { MdOutlineCarCrash } from "react-icons/md";
import Modal from "./Modal";
import TransactionForm from "./TransactionForm";

interface ValetTicketListProps {
  vehicles: Ticket[];
  activeTab: string;
  unreadTicketIds: Ticket[];
  damagedParts?: { partName: string; description: string; carView: string }[];
  handleFetchTicketDetails: (id: string) => void;
  handleStatusChange: (
    id: string,
    status: "" | "received" | "parked" | "requested" | "ready" | null
  ) => void;
  markAsRead: (vehicle: Ticket, action: string) => void;
  showTransactionModal: boolean;
  setShowTransactionModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTicketId: string | null;
  fetchData?: () => Promise<void>;
  latitude?: number;
  longitude?: number;
  locationMode?: "live" | "manual";
  propertyId?: string | null;
  pageLoading?: boolean;
}

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string | undefined;
}

export default function ValetTicketList({
  vehicles,
  activeTab,
  unreadTicketIds,
  damagedParts,
  handleFetchTicketDetails,
  handleStatusChange,
  markAsRead,
  showTransactionModal,
  setShowTransactionModal,
  selectedTicketId,
  fetchData,
  latitude,
  longitude,
  locationMode,
  propertyId,
  pageLoading,
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

  const handleMarkAsRead = async (vehicle: Ticket, action: string) => {
    if (activeTab !== "requested") return;

    setClickLoader(true);
    try {
      await markAsRead(vehicle, action);
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
    <div className="space-y-3 mb-2 overflow-y-auto py-1 px-1">
      {activeTab !== "received" && filteredVehicles?.length > 0 && (
        <div className="mt-0 mb-0 flex justify-center w-full mx-auto bg-opacity-50">
          <div className="px-4 pb-2 text-blue-500 text-sm font-medium tracking-wider rounded-sm w-full text-center mx-1 bg-opacity-10">
            Total <span className="capitalize">{activeTab}</span> Vehicles:{" "}
            <span className="font-semibold">{filteredVehicles?.length}</span>
          </div>
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
                  } text-center text-xs text-blue-500 tracking-tight font-light`}
                >
                  <p className="mb-0 pb-0">Unread</p>
                  <hr className="border-t-[.5px] border-sky-700 opacity-50 mb-2 mt-[0.5px] mx-0" />
                </div>
              )}

              <div
                onClick={() => handleMarkAsRead(vehicle, "view")}
                className={`cursor-pointer p-4 relative overflow-hidden rounded-xl border-none shadow-lg transform transition-all duration-300 mx-1 hover:scale-[1.01]
              ${
                !vehicle?.isRead && vehicle?.status == "requested"
                  ? "bg-gradient-to-br from-blue-300 via-blue-200 to-blue-400 outline-1 outline-[#ef6c00] outline-offset-2 before:content-[''] before:absolute before:inset-0 before:rounded-xl before:bg-blue-400/40 before:blur-[20px] before:z-[-1]"
                  : "bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400/70 hover:from-slate-300 hover:via-slate-200 hover:to-slate-400/70 before:content-[''] before:absolute before:inset-0 before:rounded-xl before:bg-slate-400/40 before:blur-[20px] before:z-[-1] hover:outline-none"
              }`}
                style={{
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* Decorative Circles */}
                <div className="absolute top-[-6px] left-[-6px] w-4 h-4 bg-[#f4faff]/60 rounded-full backdrop-blur-sm shadow-sm" />
                <div className="absolute top-[-6px] right-[-6px] w-4 h-4 bg-[#f4faff]/60 rounded-full backdrop-blur-sm shadow-sm" />
                <div className="absolute bottom-[-6px] left-[-6px] w-4 h-4 bg-[#f4faff]/60 rounded-full backdrop-blur-sm shadow-sm" />
                <div className="absolute bottom-[-6px] right-[-6px] w-4 h-4 bg-[#f4faff]/60 rounded-full backdrop-blur-sm shadow-sm" />

                <div>
                  <h4 className="font-semibold text-[#ef6c00] text-shadow-gray-800">
                    {vehicle?.firstName} {vehicle?.lastName}
                  </h4>
                  <p
                    className="text-sm text-gray-800"
                    onClick={() =>
                      navigator.clipboard.writeText(vehicle?.ticketNumber)
                    }
                    title="Click to copy"
                  >
                    <span className="font-bold tracking-tight">ID:</span>{" "}
                    <span className="hover:text-blue-600 hover:underline cursor-pointer">
                      #{vehicle?.ticketNumber}
                    </span>
                  </p>
                </div>

                <div
                  className={`rounded-sm flex justify-between items-center mt-0 relative`}
                >
                  <div>
                    <div className="flex gap-4 text-sm text-gray-800">
                      <p>
                        <span className="font-bold tracking-tight">Type:</span>{" "}
                        {vehicle?.type}
                      </p>
                      <p className="capitalize">
                        <span className="font-bold tracking-tight">Color:</span>{" "}
                        {vehicle?.color}
                      </p>
                    </div>

                    <div className="text-[13px] text-slate-500 capitalize mt-[0.5px]">
                      <p>
                        <span className="font-bold tracking-tight">Time: </span>
                        {new Date(vehicle?.createdDateTime).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {damagedParts && (
                      <div
                        onClick={() => handleFetchTicketDetails(vehicle?.id)}
                      >
                        <p className="text-sm tracking-tight cursor-pointer text-blue-500 hover:text-blue-600 underline mt-0">
                          View ticket details
                        </p>
                      </div>
                    )}
                  </div>

                  {activeTab !== "ready" && (
                    <div className="flex flex-col gap-1 mt-auto">
                      <button
                        disabled={pageLoading}
                        type="button"
                        className="cursor-pointer my-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 transform transition-all 
                        duration-300 hover:scale-[1.01] text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded"
                        onClick={() =>
                          handleStatusChange(
                            vehicle?.id,
                            activeTab === "parked"
                              ? "requested"
                              : activeTab === "requested"
                              ? "ready"
                              : ""
                          )
                        }
                      >
                        {activeTab === "parked"
                          ? "Request"
                          : activeTab === "requested"
                          ? "Ready"
                          : ""}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {clickLoader && (
                <div
                  className="fixed z-[9999] pointer-events-none border-blue-300"
                  style={{
                    top: `${mousePos.y + 40}px`,
                    left: `${mousePos.x + 12}px`,
                  }}
                >
                  <div className="w-4 h-4 border-2 border-blue-700  border-t-transparent rounded-full animate-spin bg-none" />
                </div>
              )}
            </React.Fragment>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 border border-gray-200 transition">
          <MdOutlineCarCrash className="w-48 h-48 text-slate-300 mb-0" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center lg:text-left">
            No vehicles available
          </h3>
          <p className="text-gray-500 text-center mb-6 max-w-md font-sans font-light">
            There are currently no vehicles in this status. Once a vehicle is
            added or updated to this status, it will appear here.
          </p>

          <button
            disabled={pageLoading}
            onClick={() => setAcknowledged(true)}
            className={`relative flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-1000 ${
              acknowledged
                ? "text-white w-12 h-12 rounded-full bg-primary"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {acknowledged ? (
              <span>
                <FaCheck className="w-5 h-5 text-white z-10" />
              </span>
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
              fetchData={fetchData}
              latitude={latitude}
              longitude={longitude}
              locationMode={locationMode}
              propertyId={propertyId}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
