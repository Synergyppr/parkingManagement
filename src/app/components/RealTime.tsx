"use client";
import { useEffect, useState, useRef, RefObject } from "react";
import * as signalR from "@microsoft/signalr";
import { FaDotCircle } from "react-icons/fa";
import { useClickOutside } from "@/app/lib/clientUtils";

type ChatMessage = {
  message: {
    status: string;
  };
};

type RealTimeComponentProps = {
  updatedStatus: "parked" | "requested" | "ready" | string;
};

const RealTimeComponent: React.FC<RealTimeComponentProps> = ({
  updatedStatus,
}) => {
  const sectionRef = useRef<RefObject<HTMLDivElement> | HTMLElement | null>(
    null
  );
  const [openNotification, setOpenNotification] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setConnection] = useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://104.46.113.1:8080/notificationHub")
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => {
        newConnection.on("UpdateNotification", (receivedMessage: string) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            { message: { status: receivedMessage } },
          ]);
        });
      })
      .catch((err) => console.error("Error connecting to SignalR hub:", err));

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  const handleNotification = () => {
    setOpenNotification(!openNotification);
  };

  useClickOutside(sectionRef as RefObject<HTMLDivElement>, handleNotification);

  return (
    <div
      className={`${
        updatedStatus === "parked"
          ? "left-4"
          : updatedStatus === "requested"
          ? "left-16"
          : updatedStatus === "ready"
          ? "right-10"
          : ""
      } absolute flex justify-center`}
    >
      {messages?.length > 0 && (
        <div className="bg-red-600 rounded-full text-[.5rem] text-white px-1 m-auto relative right-2 bottom-2">
          {messages?.length}
        </div>
      )}
      {openNotification && (
        <div
          className="absolute right-0 top-4 bg-gray-100 shadow-lg rounded-lg p-2 z-50 min-w-[150px] min-h-[100px]"
          ref={sectionRef as RefObject<HTMLDivElement> | null}
        >
          {messages?.length > 0 ? (
            <ul>
              {messages?.map((msg, index) => (
                <div key={index}>
                  <li className="mt-2 py-1 leading-1 flex gap-2 justify-center font-light text-sm">
                    <FaDotCircle className="text-blue-600 realtive top-2 w-6 h-6" />{" "}
                    {msg?.message?.status}
                  </li>
                  <hr className="border-[.3px] border-solid border-gray-200" />
                </div>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center p-2 font-light text-sm">
              No notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeComponent;
