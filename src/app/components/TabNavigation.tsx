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
  unreadTicketIds,
  setReloadPageData,
}: {
  selected: string;
  onSelect: (key: string) => void;
  unreadTicketIds: Ticket[];
  setReloadPageData: (value: boolean) => void;
}) {
  const { registerNotificationHandler } = useSignalR();

  useEffect(() => {
    registerNotificationHandler(() => {
      setReloadPageData(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (key: string) => {
    onSelect(key);
  };

  return (
    <div className="bg-header-bg h-12 text-white relative flex">
      {tabs?.map((tab) => {
        const isActive = selected === tab?.key;

        return (
          <button
            key={tab?.key}
            onClick={() => handleSelect(tab?.key)}
            className={`cursor-pointer relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className="relative text-base">
              {tab?.icon}
              {unreadTicketIds?.length > 0 && tab?.label === "Requested" && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadTicketIds?.length > 9
                    ? "9+"
                    : unreadTicketIds?.length}
                </span>
              )}
            </div>

            <span className="text-xs font-medium">{tab?.label}</span>

            {isActive && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
