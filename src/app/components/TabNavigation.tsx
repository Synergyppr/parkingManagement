"use client";
import { useEffect, useRef, useState } from "react";
import { TabItem } from "@/app/types";
import { motion } from "framer-motion";
import * as signalR from "@microsoft/signalr";
import {
  FaCarSide,
  FaParking,
  FaClock,
  FaCheckCircle,
  FaDotCircle,
} from "react-icons/fa";
import { useClickOutside } from "@/app/lib/clientUtils";
import { Ticket } from "@/app/types";

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
  unreadTicketIds,
}: {
  selected: string;
  onSelect: (key: string) => void;
  fetchData: () => void;
  unreadTicketIds: Ticket[]; // Optional prop for unread ticket IDs
}) {
  const [messagesByStatus, setMessagesByStatus] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [openNotification, setOpenNotification] = useState(false); // Add the state for the notification popup
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const propertyId = "A7E348D3-8DFB-4F71-8BC5-042BA75D53C7";

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/notification/hub")
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection
      .start()
      .then(() => {
        console.log("Connected to SignalR hub");

        // Join the property group after connection is established
        return connection.invoke("JoinPropertyGroup", propertyId);
      })
      .then(() => {
        // console.log("Joined property group:", propertyId);
      })
      .catch((err) => console.error("Error connecting to SignalR hub:", err));

    // ReceivedStatusUpdate
    connection.on("UpdateNotification", (message: ChatMessage) => {
      // console.log("UpdateNotification received:", message);
      const parsed =
        typeof message === "string" ? JSON.parse(message) : message;

      setMessagesByStatus((prev) => ({
        ...prev,
        [parsed.status]: [...(prev[parsed.status] || []), parsed],
      }));

      fetchData();
    });

    return () => {
      (async () => {
        try {
          await connection.stop();
          console.log("SignalR connection stopped");
        } catch (err) {
          console.error("Error stopping SignalR connection:", err);
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

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
        {tabs?.map((tab) => {
          const isActive = selected === tab?.key;
          // const hasNewMessages = !!messagesByStatus[tab.key]?.length;

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
                    {unreadTicketIds.length > 9 ? "9+" : unreadTicketIds.length}
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
