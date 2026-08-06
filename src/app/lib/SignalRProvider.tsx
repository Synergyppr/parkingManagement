// app/lib/SignalRProvider.tsx
"use client";
import React, {
  createContext,
  useCallback,
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
  // Tracks which group we're currently joined to (for leave/rejoin logic)
  const currentGroupRef = useRef<string | null>(null);

  const notificationSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio("/notification.mp3") : null
  );

  // Memoize so consumer effects don't re-run on every render
  const registerNotificationHandler = useCallback(
    (handler: (notification: NotificationHandler) => void) => {
      notificationHandlerRef.current = handler;
    },
    []
  );

  // Helper: join a group safely and track it
  const joinGroupSafe = async (
    conn: signalR.HubConnection,
    groupId: string
  ) => {
    if (conn.state === signalR.HubConnectionState.Connected && groupId) {
      await conn.invoke("JoinPropertyGroup", groupId);
      currentGroupRef.current = groupId;
      console.log("[SignalR] Joined group:", groupId);
    }
  };

  // Helper: leave a group safely and clear tracking
  const leaveGroupSafe = async (
    conn: signalR.HubConnection,
    groupId: string
  ) => {
    if (conn.state === signalR.HubConnectionState.Connected && groupId) {
      await conn.invoke("LeavePropertyGroup", groupId);
      if (currentGroupRef.current === groupId) {
        currentGroupRef.current = null;
      }
      console.log("[SignalR] Left group:", groupId);
    }
  };

  // Establish SignalR connection once (no propertyId dependency)
  useEffect(() => {
    const hubUrl = process.env.NEXT_PUBLIC_NOTIFICATION_HUB_ENDPOINT;

    if (!hubUrl) {
      console.error(
        "NEXT_PUBLIC_NOTIFICATION_HUB_ENDPOINT is not defined in environment variables"
      );
      return;
    }

    let isCancelled = false;

    const connectToSignalR = async () => {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      // Register message handler
      connection.on(
        "UpdateNotification",
        (notification: NotificationHandler) => {
          console.log("[SignalR] Notification received:", notification?.ticketId, notification?.status);

          if (notificationSoundRef.current) {
            setTimeout(() => {
              notificationSoundRef.current?.play().catch((err) => {
                console.warn("Unable to play sound:", err);
              });
            }, 1000);
          }

          notificationHandlerRef.current?.(notification);
        }
      );

      // Re-join group after automatic reconnection (groups are lost on disconnect)
      connection.onreconnected(async () => {
        console.log("[SignalR] Reconnected — re-joining group");
        const groupToRejoin = currentGroupRef.current;
        if (groupToRejoin) {
          try {
            // currentGroupRef was cleared by disconnect, re-join it
            await connection.invoke("JoinPropertyGroup", groupToRejoin);
            console.log("[SignalR] Re-joined group:", groupToRejoin);
          } catch (err) {
            console.log("[SignalR] Failed to re-join group after reconnect:", err);
          }
        }
      });

      connection.onreconnecting(() => {
        console.log("[SignalR] Connection lost, attempting to reconnect...");
      });

      connection.onclose(() => {
        console.log("[SignalR] Connection closed");
      });

      try {
        await connection.start();
        if (isCancelled) {
          connection.stop();
          return;
        }

        console.log("[SignalR] Connected to hub");

        connectionRef.current = connection;
        globalConnection = connection;

        // Join initial group if propertyId is already available at connection time
        if (propertyId) {
          await joinGroupSafe(connection, propertyId);
        }
      } catch (err) {
        console.log("[SignalR] Connection error:", err);
      }
    };

    connectToSignalR();

    return () => {
      isCancelled = true;
      const connection = connectionRef.current;

      if (connection) {
        const groupId = currentGroupRef.current;
        if (groupId) {
          leaveGroupSafe(connection, groupId).catch(() => {});
        }
        connection.stop();
        connectionRef.current = null;
        globalConnection = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle group changes when propertyId changes (connection may or may not be ready)
  useEffect(() => {
    if (!propertyId) return;

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    const updateGroup = async (attempt = 0) => {
      const connection = connectionRef.current;

      // If connection isn't ready yet, retry (up to ~10 seconds)
      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        if (attempt < 10 && !isCancelled) {
          retryTimeout = setTimeout(() => updateGroup(attempt + 1), 1000);
        }
        return;
      }

      const prevGroupId = currentGroupRef.current;

      try {
        // Leave previous group if different
        if (prevGroupId && prevGroupId !== propertyId) {
          await leaveGroupSafe(connection, prevGroupId);
        }

        // Join new group
        if (!isCancelled) {
          await joinGroupSafe(connection, propertyId);
        }
      } catch (err) {
        console.log("[SignalR] Failed to update group:", err);
      }
    };

    updateGroup();

    return () => {
      isCancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
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
    if (globalConnection && globalConnection.state === signalR.HubConnectionState.Connected) {
      await globalConnection.invoke("JoinPropertyGroup", groupId);
    }
  } catch (error) {
    console.log("[SignalR] Failed to join group:", error);
  }
};

export const leaveGroup = async (groupId: string) => {
  if (!groupId) return;
  try {
    if (globalConnection && globalConnection.state === signalR.HubConnectionState.Connected) {
      await globalConnection.invoke("LeavePropertyGroup", groupId);
    }
  } catch (error) {
    console.log("[SignalR] Failed to leave group:", error);
  }
};
