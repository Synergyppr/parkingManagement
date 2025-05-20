"use client";

import { motion } from "framer-motion";
import { FaCarSide, FaParking, FaClock, FaCheckCircle } from "react-icons/fa";
import { TabItem } from "@/app/types";

const tabs: TabItem[] = [
  { label: "Receive", icon: <FaCarSide />, key: "receive" },
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
    <div className="flex justify-around bg-white border-b p-2 shadow-sm relative">
      {tabs.map((tab) => {
        const isActive = selected === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className={`relative flex flex-col items-center text-xs md:text-sm px-2 py-1 rounded-md transition-all duration-300 ease-in-out ${
              isActive
                ? "text-blue-700 font-semibold"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            <motion.div
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={
                isActive
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0.5, scale: 0.95 }
              }
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-lg"
            >
              {tab.icon}
            </motion.div>
            <span>{tab.label}</span>

            {isActive && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 h-1 w-full bg-blue-600 rounded"
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 20,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
