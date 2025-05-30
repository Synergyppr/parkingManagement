// "use client";
// import { useEffect, useState, useRef } from "react";
// import * as signalR from "@microsoft/signalr";
// import { FaBell, FaDotCircle } from "react-icons/fa";
// import { useClickOutside } from "@/app/lib/clientUtils";

// type ChatMessage = {
//   message: string;
// };

// const RealTimeComponent: React.FC = () => {
//   const sectionRef = useRef(null);
//   const [openNotification, setOpenNotification] = useState(false);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [connection, setConnection] = useState<signalR.HubConnection | null>(
//     null
//   );

//   useEffect(() => {
//     // Create a connection to the SignalR hub
//     const newConnection = new signalR.HubConnectionBuilder()
//       .withUrl("http://104.46.113.1/notificationHub") // Replace with your SignalR hub URL
//       .configureLogging(signalR.LogLevel.Information)
//       .withAutomaticReconnect()
//       .build();

//     newConnection
//       .start()
//       .then(() => {
//         console.log("Connected to SignalR hub");

//         // Listen for messages from the hub
//         newConnection.on("RecievedNotification", (receivedMessage: string) => {
//           setMessages((prevMessages: any) => [
//             ...prevMessages,
//             receivedMessage,
//           ]);
//         });
//       })
//       .catch((err) => console.error("Error connecting to SignalR hub:", err));

//     setConnection(newConnection);

//     // Cleanup connection on component unmount
//     return () => {
//       if (newConnection) {
//         newConnection.stop();
//       }
//     };
//   }, []);

//   const handleNotification = () => {
//     setOpenNotification(!openNotification);
//   };

//   useClickOutside(sectionRef, handleNotification);

//   return (
//     <div className="absolute right-1 top-2 flex justify-center">
//       <FaBell onClick={handleNotification} className="w-5 h-5 cursor-pointer" />
//       {messages?.length > 0 && (
//         <div className="bg-red-600 rounded-full text-[.5rem] text-white px-1 m-auto relative right-2 bottom-2">
//           {messages?.length}
//         </div>
//       )}
//       {openNotification && (
//         <div
//           className="absolute right-0 top-4 bg-gray-100 shadow-lg rounded-lg p-2 z-50 min-w-[150px] min-h-[100px]"
//           ref={sectionRef}
//         >
//           {messages?.length > 0 ? (
//             <ul>
//               {messages?.map((msg: any, index) => (
//                 <>
//                   <li
//                     key={index}
//                     className="mt-2 py-1 leading-1 flex gap-2 justify-center font-light text-sm"
//                   >
//                     <FaDotCircle className="text-blue-600 realtive top-2 w-6 h-6" />{" "}
//                     {msg}
//                   </li>
//                   <hr className="border-[.3px] border-solid border-gray-200" />
//                 </>
//               ))}
//             </ul>
//           ) : (
//             <div className="flex justify-center p-2 font-light text-sm">
//               No notifications
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default RealTimeComponent;

const RealTimeComponent: React.FC = () => {
  return (
    <div className="absolute right-1 top-2 flex justify-center">
      <div className="bg-gray-100 shadow-lg rounded-lg p-2 z-50 min-w-[150px] min-h-[100px]">
        <div className="flex justify-center p-2 font-light text-sm">
          Real-time component is under development.
        </div>
      </div>
    </div>
  );
};

export default RealTimeComponent;
