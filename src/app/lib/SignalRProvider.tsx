// app/lib/SignalRProvider.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as signalR from "@microsoft/signalr";
import { useProperty } from "../context/PropertyContext";

type ChatMessage = {
  ticketId: string;
  status: string;
  updatedAt: string;
};

interface SignalRContextType {
  messagesByStatus: Record<string, ChatMessage[]>;
  connection: signalR.HubConnection | null;
  registerNotificationHandler: (
    handler: (notification: Notification) => void
  ) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { propertyId } = useProperty();
  const [messagesByStatus] = useState<Record<string, ChatMessage[]>>({});
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const notificationHandlerRef =
    useRef<(notification: Notification) => void | null>(null);

  const registerNotificationHandler = (
    handler: (notification: Notification) => void
  ) => {
    notificationHandlerRef.current = handler;
  };

  const notificationSound =
    typeof Audio !== "undefined" ? new Audio("/notification.mp3") : null;

  useEffect(() => {
    const connectToSignalR = async () => {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(
          "https://synergymwprod-hdbrdrhpawachjbx.eastus-01.azurewebsites.net/notificationhub"
        )
        .withAutomaticReconnect()
        .build();

      globalConnection = connection;

      connection.on("UpdateNotification", (notification: Notification) => {
        // console.log("📨 Notification received SignalR:", notification);
        if (notificationSound) {
          console.log("🔔 Playing notification sound");
          setTimeout(() => {
            notificationSound.play().catch((err) => {
              console.warn("🔇 Unable to play sound:", err);
            });
          }, 1000);
        }
        notificationHandlerRef.current?.(notification);
      });

      try {
        await connection.start();
        // console.log("✅ Connected to SignalR hub");

        if (propertyId) {
          // console.log("Joining SignalR group with propertyId:", propertyId);
          await connection.invoke("JoinPropertyGroup", propertyId);
        } else {
          // console.warn("❗ No propertyId available, skipping group join.");
        }

        connectionRef.current = connection;
      } catch (err) {
        console.error("❌ SignalR connection error:", err);
      }
    };

    connectToSignalR();

    return () => {
      connectionRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    // console.log("📦 Property ID changed:", propertyId);
    if (propertyId && connectionRef.current?.state === "Connected") {
      connectionRef.current
        .invoke("JoinPropertyGroup", propertyId)
        .then(() => {
          // console.log("✅ Rejoined group:", propertyId);
        })
        .catch((err) => console.error("❌ Rejoin failed:", err));
    }
  }, [propertyId]);

  return (
    <SignalRContext.Provider
      value={{
        messagesByStatus,
        connection: connectionRef.current,
        registerNotificationHandler,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context)
    throw new Error("useSignalR must be used within SignalRProvider");
  return context;
};

// Exportable join and leave functions
let globalConnection: signalR.HubConnection | null = null;

export const joinGroup = async (groupId: string) => {
  try {
    if (globalConnection && globalConnection.state === "Connected") {
      await globalConnection.invoke("JoinPropertyGroup", groupId);
      // console.log("✅ Joined SignalR group:", groupId);
    }
  } catch (error) {
    console.error("❌ Failed to join group:", error);
  }
};

export const leaveGroup = async (groupId: string) => {
  try {
    if (globalConnection && globalConnection.state === "Connected") {
      await globalConnection.invoke("LeavePropertyGroup", groupId);
      // console.log("👋 Left SignalR group:", groupId);
    }
  } catch (error) {
    console.error("❌ Failed to leave group:", error);
  }
};
