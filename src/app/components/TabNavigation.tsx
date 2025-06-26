"use client";
import { useEffect } from "react";
import { TabItem } from "@/app/types";
import { useSignalR } from "@/app/lib/SignalRProvider";
import { motion } from "framer-motion";
import { FaCarSide, FaParking, FaClock, FaCheckCircle } from "react-icons/fa";
import { Ticket } from "@/app/types";

const tabs: TabItem[] = [
  { label: "Received", icon: <FaCarSide />, key: "received" },
  { label: "Parked", icon: <FaParking />, key: "parked" },
  { label: "Requested", icon: <FaClock />, key: "requested" },
  { label: "Ready", icon: <FaCheckCircle />, key: "ready" },
];
export default function TabNavigation({
  selected,
  onSelect,
  fetchData,
  unreadTicketIds,
}: {
  selected: string;
  onSelect: (key: string) => void;
  fetchData: () => void;
  unreadTicketIds: Ticket[];
}) {
  const { registerNotificationHandler } = useSignalR();

  useEffect(() => {
    fetchData(); // Initial data
    registerNotificationHandler(() => {
      // console.log("🔄 Refetching due to new notification");
      fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (key: string) => {
    onSelect(key);
  };

  return (
    <div className="bg-slate-900 py-2 text-white relative">
      <div className="flex justify-around border-b-[0.5px] py-2 shadow-sm relative">
        {tabs?.map((tab) => {
          const isActive = selected === tab?.key;

          return (
            <button
              key={tab?.key}
              onClick={() => handleSelect(tab?.key)}
              className={`cursor-pointer relative flex flex-col gap-1.5 items-center text-xs px-4 py-2 rounded-md transition-all duration-300 ${
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 hover:text-blue-400"
              }`}
            >
              <div className="text-lg relative">
                {tab?.icon}
                {unreadTicketIds?.length > 0 && tab?.label === "Requested" && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900">
                    {unreadTicketIds?.length > 9
                      ? "9+"
                      : unreadTicketIds?.length}
                  </span>
                )}
              </div>

              <span>{tab?.label}</span>

              {isActive && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 h-[1px] w-full bg-blue-600"
                  transition={{ type: "spring", stiffness: 180, damping: 20 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
