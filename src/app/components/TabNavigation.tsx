"use client";

import { TabItem } from "@/app/types";
import { motion } from "framer-motion";
import {
  FaCarSide,
  FaParking,
  FaClock,
  FaCheckCircle,
  FaDotCircle,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useClickOutside } from "@/app/lib/clientUtils";

const tabs: TabItem[] = [
  { label: "Received", icon: <FaCarSide />, key: "received" },
  { label: "Parked", icon: <FaParking />, key: "parked" },
  { label: "Requested", icon: <FaClock />, key: "requested" },
  { label: "Ready", icon: <FaCheckCircle />, key: "ready" },
];

type ChatMessage = {
  ticketId: string;
  status: string;
  updatedAt: string;
};

export default function TabNavigation({
  selected,
  onSelect,
  fetchData,
}: {
  selected: string;
  onSelect: (key: string) => void;
  fetchData: () => void;
}) {
  const [messagesByStatus, setMessagesByStatus] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [openNotification, setOpenNotification] = useState(false); // Add the state for the notification popup
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://104.46.113.1:8080/notificationHub")
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log("Connected to SignalR hub");
        connection.on("ReceivedStatusUpdate", (message: ChatMessage) => {
          // If the message is already an object, skip parsing
          const parsed =
            typeof message === "string" ? JSON.parse(message) : message;

          // Update messages grouped by status
          setMessagesByStatus((prev) => ({
            ...prev,
            [parsed.status]: [...(prev[parsed.status] || []), parsed],
          }));

          fetchData(); // Fetch data after receiving a new message
        });
      })
      .catch((err) => console.error("Error connecting to SignalR hub:", err));

    return () => {
      (async () => {
        try {
          await connection.stop();
        } catch (err) {
          console.error("Error stopping SignalR connection:", err);
        }
      })();
    };
  }, []);

  const handleSelect = (key: string) => {
    onSelect(key);
    setMessagesByStatus((prev) => {
      const newMessages = { ...prev };
      delete newMessages[key]; // Clear messages for selected status
      return newMessages;
    });
  };

  useClickOutside(sectionRef as React.RefObject<HTMLDivElement>, () =>
    setOpenNotification(false)
  );

  return (
    <div className="bg-slate-900 py-2 text-white relative">
      <div className="flex justify-around border-b-[0.5px] py-2 shadow-sm relative">
        {tabs.map((tab) => {
          const isActive = selected === tab.key;
          const hasNewMessages = !!messagesByStatus[tab.key]?.length;

          return (
            <button
              key={tab.key}
              onClick={() => handleSelect(tab.key)}
              className={`cursor-pointer relative flex flex-col gap-1.5 items-center text-xs px-4 py-2 rounded-md transition-all duration-300 ${
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 hover:text-blue-400"
              }`}
            >
              <div className="text-lg relative">
                {tab.icon}
                {hasNewMessages && (
                  <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 border-2 border-slate-900" />
                )}
              </div>

              <span>{tab.label}</span>

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

      {/* Notification Popup */}
      {openNotification && (
        <div
          ref={sectionRef}
          className="absolute right-0 top-12 bg-white shadow-lg rounded-lg p-2 z-50 min-w-[180px]"
        >
          {Object.keys(messagesByStatus).length === 0 ? (
            <div className="p-2 text-sm text-gray-600">No notifications</div>
          ) : (
            Object.entries(messagesByStatus).map(([status, messages]) => (
              <div key={status}>
                <h4 className="font-semibold text-sm text-gray-800">
                  {status}
                </h4>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className="py-1 text-sm text-gray-700 flex items-start gap-2"
                  >
                    <FaDotCircle className="text-blue-600 mt-1" />
                    {msg.ticketId} - {new Date(msg.updatedAt).toLocaleString()}
                  </div>
                ))}
                <hr className="my-1 border-gray-200" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
