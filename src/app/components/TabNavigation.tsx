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
    <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 rounded-full border border-(--primary-light) bg-(--primary-soft) p-1 
      shadow-inner transition-colors duration-300"
      >
        {tabs?.map((tab) => {
          const isActive = selected === tab?.key;

          return (
            <button
              key={tab?.key}
              onClick={() => handleSelect(tab?.key)}
              className={`group relative flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold transition-all 
                duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light) md:flex-none md:px-5 ${
                  isActive
                    ? "text-white"
                    : "text-slate-500 hover:bg-white hover:text-primary"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                />
              )}

              <span className="relative flex items-center gap-2">
                <span
                  className={`relative text-sm transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-105"
                  }`}
                >
                  {tab?.icon}

                  {unreadTicketIds?.length > 0 &&
                    tab?.label === "Requested" && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-white">
                        {unreadTicketIds?.length > 9
                          ? "9+"
                          : unreadTicketIds?.length}
                      </span>
                    )}
                </span>

                <span className="hidden sm:inline">{tab?.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
