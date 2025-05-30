"use client";

import { TabItem } from "@/app/types";
import { motion } from "framer-motion";
import { FaCarSide, FaParking, FaClock, FaCheckCircle } from "react-icons/fa";

const tabs: TabItem[] = [
  { label: "Received", icon: <FaCarSide />, key: "received" },
  { label: "Parked", icon: <FaParking />, key: "parked" },
  { label: "Requested", icon: <FaClock />, key: "requested" },
  { label: "Ready", icon: <FaCheckCircle />, key: "ready" },
];

export default function TabNavigation({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="bg-slate-900 py-2 text-white">
      <div className="flex justify-around border-b-[0.5px] py-2 shadow-sm relative">
        {tabs?.map((tab) => {
          const isActive = selected === tab?.key;

          return (
            <button
              key={tab?.key}
              onClick={() => {
                onSelect(tab?.key);
              }}
              className={`relative flex flex-col gap-1.5 items-center text-xs px-4 py-2 rounded-md transition-all duration-300 ${
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 hover:text-blue-400"
              }`}
            >
              <div className="text-lg">{tab?.icon}</div>
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
