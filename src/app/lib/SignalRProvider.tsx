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
import { NotificationHandler } from "../types";

type ChatMessage = {
  ticketId: string;
  status: string;
  updatedAt: string;
};

interface SignalRContextType {
  messagesByStatus: Record<string, ChatMessage[]>;
  connection: signalR.HubConnection | null;
  registerNotificationHandler: (
    handler: (notification: NotificationHandler) => void
  ) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

// TODO: Re-add console.errors

export const SignalRProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { propertyId } = useProperty();
  const [messagesByStatus] = useState<Record<string, ChatMessage[]>>({});
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const notificationHandlerRef =
    useRef<(notification: NotificationHandler) => void | null>(null);
  const previousPropertyIdRef = useRef<string | null>(null);

  const notificationSound =
    typeof Audio !== "undefined" ? new Audio("/notification.mp3") : null;

  const registerNotificationHandler = (
    handler: (notification: NotificationHandler) => void
  ) => {
    notificationHandlerRef.current = handler;
  };

  // Establish SignalR connection once
  useEffect(() => {
    const connectToSignalR = async () => {
      const hubUrl = process.env.NEXT_PUBLIC_NOTIFICATION_HUB_ENDPOINT;

      if (!hubUrl) {
        console.error(
          "NEXT_PUBLIC_NOTIFICATION_HUB_ENDPOINT is not defined in environment variables"
        );
        return;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

      globalConnection = connection;

      connection.on("UpdateNotification", (notification: NotificationHandler) => {
        if (notificationSound) {
          console.log("Playing notification sound!");
          setTimeout(() => {
            notificationSound.play().catch((err) => {
              console.warn("Unable to play sound:", err);
            });
          }, 1000);
        }

        notificationHandlerRef.current?.(notification);
      });

      try {
        if (!propertyId) return;
        
        await connection.start();
        console.log("Connected to SignalR hub");

        // Join initial group if propertyId exists
        if (propertyId) {
          await connection.invoke("JoinPropertyGroup", propertyId);
          previousPropertyIdRef.current = propertyId;
          console.log("Joined group:", propertyId);
        }

        connectionRef.current = connection;
      } catch (err) {
        console.log("SignalR connection error:", err);
        // console.error("SignalR connection error:", err);
      }
    };

    connectToSignalR();

    return () => {
      const connection = connectionRef.current;
      const prevId = previousPropertyIdRef.current;

      if (connection && connection.state === "Connected" && prevId) {
        connection.invoke("LeavePropertyGroup", prevId).catch((err) => {
          console.log("Failed to leave group on unmount:", err);
          // console.error("Failed to leave group on unmount:", err);
        });
      }

      connection?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  // Handle group change when propertyId changes
  useEffect(() => {
    const updateGroup = async () => {
      const connection = connectionRef.current;
      const prevId = previousPropertyIdRef.current;

      if (!connection || connection.state !== "Connected") return;

      try {
        if (prevId && prevId !== propertyId) {
          await connection.invoke("LeavePropertyGroup", prevId);
          // console.log("Left previous group:", prevId);
        }

        if (propertyId && propertyId !== prevId) {
          await connection.invoke("JoinPropertyGroup", propertyId);
          // console.log("Joined new group:", propertyId);
        }

        previousPropertyIdRef.current = propertyId;
      } catch (err) {
        console.log("Failed to update SignalR group:", err);
        // console.error("Failed to update SignalR group:", err);
      }
    };

    updateGroup();
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
  if (!context) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
};

// Exportable join and leave group utilities
let globalConnection: signalR.HubConnection | null = null;

export const joinGroup = async (groupId: string) => {
  try {
    if (globalConnection && globalConnection.state === "Connected") {
      await globalConnection.invoke("JoinPropertyGroup", groupId);
      // console.log("Manually joined SignalR group:", groupId);
    }
  } catch (error) {
    console.log("Failed to join group:", error);
    // console.error("Failed to join group:", error);
  }
};

export const leaveGroup = async (groupId: string) => {
  if (!groupId) return;
  try {
    if (globalConnection && globalConnection.state === "Connected") {
      await globalConnection.invoke("LeavePropertyGroup", groupId);
      // console.log("Manually left SignalR group:", groupId);
    }
  } catch (error) {
    console.log("Failed to leave group:", error);
    // console.error("Failed to leave group:", error);
  }
};
