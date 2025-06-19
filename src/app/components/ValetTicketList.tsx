"use client";

import React from "react";
import { Ticket } from "@/app/types";

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
}

export default function ValetTicketList({
  vehicles,
  activeTab,
  unreadTicketIds,
  damagedParts,
  handleFetchTicketDetails,
  handleStatusChange,
  markAsRead,
}: ValetTicketListProps) {
  //   const [clickLoader, setClickLoader] = React.useState<boolean>(false);

  const filteredVehicles = (
    activeTab === "ready"
      ? vehicles
      : vehicles?.filter((vehicle: Ticket) => {
          if (activeTab === "received")
            return vehicle.status === "" || vehicle.status === "received";
          return vehicle.status === activeTab;
        })
  )?.sort((a, b) => {
    return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1;
  });

  return (
    <div className="space-y-3 mb-2 overflow-y-auto py-1 px-1">
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
                onClick={() => markAsRead(vehicle, "view")}
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

                <div className="rounded-sm flex justify-between items-center">
                  <div>
                    <div className="flex gap-4 text-sm text-gray-800">
                      <p>
                        <span className="font-bold tracking-tight">Type:</span>{" "}
                        {vehicle?.type}
                      </p>
                      <p>
                        <span className="font-bold tracking-tight">Color:</span>{" "}
                        {vehicle?.color}
                      </p>
                    </div>

                    <div className="text-sm text-slate-500 capitalize">
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
                        <p className="text-sm tracking-tight cursor-pointer text-blue-500 hover:text-blue-600 underline mt-1">
                          View ticket details
                        </p>
                      </div>
                    )}
                  </div>

                  {activeTab !== "ready" && (
                    <div className="mt-auto">
                      <button
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
            </React.Fragment>
          );
        })
      ) : (
        <p className="text-center text-gray-500 tracking-tight italic font-light">
          No vehicles in this status.
        </p>
      )}
    </div>
  );
}
