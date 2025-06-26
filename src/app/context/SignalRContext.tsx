// app/context/SignalRContext.tsx
import { createContext } from "react";

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

export const SignalRContext = createContext<SignalRContextType | undefined>(
  undefined
);
