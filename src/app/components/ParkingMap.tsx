import { useState } from "react";
import Swal from "sweetalert2";
import { FaChevronDown, FaChevronUp, FaCar } from "react-icons/fa6";

type ParkingSlot = {
  id: string;
  status: "available" | "busy" | "blocked" | "blockedBusy";
  blockedBy?: string[];
  ticket?: {
    licensePlate?: string;
    color?: string;
    make?: string;
    model?: string;
    type?: string;
  };
};

const sections = ["Section A", "Section B", "Floor 2"];

const sampleSlots: Record<string, ParkingSlot[]> = {
  "Section A": [
    { id: "A1", status: "available" },
    {
      id: "A2",
      status: "busy",
      ticket: {
        licensePlate: "XYZ-123",
        color: "Blue",
        make: "Toyota",
        model: "Corolla",
        type: "Sedan",
      },
    },
    { id: "A3", status: "blocked", blockedBy: ["A1", "A2"] },
    { id: "A4", status: "available" },
    { id: "A5", status: "available" },
    {
      id: "A6",
      status: "blockedBusy",
      blockedBy: ["A4"],
      ticket: {
        licensePlate: "DEF-456",
        color: "Red",
        make: "Honda",
        model: "Civic",
        type: "Coupe",
      },
    },
  ],
  "Section B": [
    { id: "B1", status: "available" },
    { id: "B2", status: "available" },
    { id: "B3", status: "blocked", blockedBy: ["B1"] },
    {
      id: "B4",
      status: "busy",
      ticket: {
        licensePlate: "JKL-456",
        color: "Black",
        make: "Ford",
        model: "Escape",
        type: "SUV",
      },
    },
    { id: "B5", status: "available" },
    {
      id: "B6",
      status: "blockedBusy",
      blockedBy: ["B4", "B5"],
      ticket: {
        licensePlate: "GHI-789",
        color: "Silver",
        make: "BMW",
        model: "X3",
        type: "SUV",
      },
    },
  ],
  "Floor 2": [
    { id: "F2-1", status: "available" },
    {
      id: "F2-2",
      status: "busy",
      ticket: {
        licensePlate: "MNO-222",
        color: "White",
        make: "Tesla",
        model: "Model 3",
        type: "EV",
      },
    },
    { id: "F2-3", status: "blocked", blockedBy: ["F2-2"] },
    { id: "F2-4", status: "available" },
    {
      id: "F2-5",
      status: "blockedBusy",
      blockedBy: ["F2-2", "F2-4"],
      ticket: {
        licensePlate: "ZZZ-999",
        color: "Silver",
        make: "BMW",
        model: "X5",
        type: "SUV",
      },
    },
    { id: "F2-6", status: "available" },
  ],
};

const ParkingLot = () => {
  const [showParking, setShowParking] = useState(true);
  const [activeSection, setActiveSection] = useState("Section A");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const slots = sampleSlots[activeSection] || [];

  const getSlotColor = (status: ParkingSlot["status"]) => {
    switch (status) {
      case "available":
        return "bg-white border-gray-300 text-gray-700";
      case "busy":
        return "bg-[#ef6c00] text-white";
      case "blocked":
        return "bg-gray-400 text-white cursor-not-allowed opacity-70";
      case "blockedBusy":
        return "bg-[#d66000] text-white";
      default:
        return "bg-white";
    }
  };

  const handleSlotClick = (slot: ParkingSlot) => {
    if (slot.status === "busy" || slot.status === "blockedBusy") return; // do nothing
    if (slot.status === "blocked") {
      const blockers = slot.blockedBy?.join(", ") || "unknown slots";
      Swal.fire({
        title: "Blocked Slot",
        html: `Slot <b>${slot.id}</b> is blocked.<br/> Bring the key(s) for the car(s) in: <b>${blockers}</b>.`,
        icon: "warning",
        confirmButtonText: "Got it",
      });
      return;
    }

    // if (slot.status === "blockedBusy") {
    //   const blockers = slot.blockedBy?.join(", ") || "unknown slots";
    //   Swal.fire({
    //     title: "Blocked & Occupied Slot",
    //     html: `Slot <b>${slot.id}</b> is occupied and blocked.<br/> Bring the key(s) for the car(s) in: <b>${blockers}</b>.`,
    //     icon: "warning",
    //     confirmButtonText: "Got it",
    //   });
    //   return;
    // }

    // Multi-selection for available slots
    setSelectedSlots((prev) => {
      if (prev.includes(slot.id)) {
        return prev.filter((s) => s !== slot.id);
      } else {
        return [...prev, slot.id];
      }
    });
  };

  return (
    <>
      <div
        className={`${
          !showParking ? "border-[.8px]" : "border-[.3px]"
        } overflow-hidden bg-white text-gray-800 relative border-solid border-blue-700 mb-0`}
      >
        {/* Card Header */}
        <div
          className={`${
            !showParking ? "border-none" : "border-b-[0.3px] border-solid"
          } flex items-center justify-between px-4 py-3 text-blue-600 border-blue-700`}
        >
          <h3 className="text-lg font-bold tracking-tight">
            Parking Lot / Garage
          </h3>
          <button
            type="button"
            onClick={() => setShowParking(!showParking)}
            className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
            title="Toggle View"
          >
            {showParking ? (
              <FaChevronUp className="w-5 h-5" />
            ) : (
              <FaChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Pills for Sections */}
        {showParking && (
          <div className="flex gap-2 p-3 border-b bg-gray-50">
            {sections.map((section) => (
              <button
                type="button"
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-1 rounded-lg text-sm font-medium border cursor-pointer ${
                  activeSection === section
                    ? "bg-[#ef6c00] text-white border-[#ef6c00]"
                    : "bg-white text-[#ef6c00] border-[#ef6c00] hover:bg-orange-50"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        )}

        {/* Card Body with Parking Grid */}
        <div
          id="parkingBody"
          className={`${
            showParking
              ? "max-h-[1000px] opacity-100 p-4"
              : "max-h-0 opacity-0 p-0"
          } transition-all duration-700 bg-gradient-to-br from-blue-100 to-slate-100 min-h-full`}
        >
          <div className="grid grid-cols-3 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className={`${
                  slot.status === "busy" || slot.status === "blockedBusy"
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                } h-20 rounded-lg border shadow-sm flex items-center justify-center font-semibold transition hover:scale-105 relative group overflow-hidden 
                ${getSlotColor(slot.status)}
                ${
                  selectedSlots.includes(slot.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {/* Default Slot ID */}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    (slot.status === "busy" || slot.status === "blockedBusy") &&
                    "group-hover:opacity-0"
                  }`}
                >
                  {slot.status !== "available" && slot.status !== "blocked" && (
                    <FaCar className="text-white mr-2" />
                  )}
                  {slot?.id}
                </span>

                {/* Vehicle Details (busy / blockedBusy) */}
                {(slot.status === "busy" || slot.status === "blockedBusy") &&
                  slot.ticket && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 text-center">
                      <p className="font-bold">{slot.ticket.licensePlate}</p>
                      <p className="capitalize">
                        {slot.ticket.color} {slot.ticket.make}{" "}
                        {slot.ticket.model}
                      </p>
                      <p className="italic">{slot.ticket.type}</p>
                      <FaCar className="mt-1 text-white" />
                    </div>
                  )}
              </div>
            ))}
          </div>
          {/* Here */}
        </div>
      </div>
      {/* Legend */}
      <div className="mt-0 flex flex-wrap gap-4 items-center mb-6 border-t-none border-x-[.3px] border-b-[.3px] border-blue-700 border-solid py-2 px-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-gray-300 bg-white" />
          <span className="text-sm text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-[#ef6c00] bg-[#ef6c00]" />
          <span className="text-sm text-gray-700">Busy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-gray-400 bg-gray-400" />
          <span className="text-sm text-gray-700">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-[#d66000] bg-[#d66000]" />
          <span className="text-sm text-gray-700">Blocked & Busy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-blue-500 bg-white ring-2 ring-blue-500" />
          <span className="text-sm text-gray-700">Selected</span>
        </div>
      </div>
    </>
  );
};

export default ParkingLot;
