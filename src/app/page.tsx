"use client";

import { useEffect, useState } from "react";
import TabNavigation from "@/app/components/TabNavigation";
import ReceiveForm from "@/app/components/ReceiveForm";
import {
  Vehicle,
  VehicleApiResponse,
  CarBrand,
  DropdownOption,
} from "@/app/types";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from "./components/Modal";
import Swal from "sweetalert2";
import ButtonLoader from "./components/elements/ButtonLoader";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("received");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<DropdownOption[]>([]);
  const [vehicleColors, setVehicleColors] = useState<DropdownOption[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<
    "" | "received" | "parked" | "requested" | "ready" | null
  >(null);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);

  const fetchData = async () => {
    const res = await fetch("/api/getTicket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "be93637a-fc6e-4477-79f6-08dd93acf26b",
      }),
    });
    const data = await res.json();
    const result: VehicleApiResponse = data?.data;
    setVehicles(result?.tickets);
    setCarBrands(result?.carBrands);
    setVehicleTypes(result?.vehicleTypes);
    setVehicleColors(result?.vehicleColors);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = (
    id: string,
    status: "" | "received" | "parked" | "requested" | "ready" | null
  ) => {
    setSelectedTicketId(id);
    setNextStatus(status);
    setOpenModal(true);
  };

  const filteredVehicles = vehicles?.filter((vehicle: Vehicle) => {
    if (activeTab === "received")
      return vehicle.status === "" || vehicle.status === "received";
    return vehicle.status === activeTab;
  });

  const closeModal = () => {
    setOpenModal(false);
    setPin("");
  };

  const submitPinAndChangeStatus = async () => {
    if (!selectedTicketId || !nextStatus || !pin) return;

    setButtonLoader(true);

    const sendForm = {
      ticketId: selectedTicketId,
      status: nextStatus,
      isUserUpdate: false,
      pin: pin,
    };

    try {
      const res = await fetch("/api/vehicleStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const data = await res.json();

      if (data?.result?.status === "200") {
        await fetchData(); // refresh the data from the API

        setTimeout(() => {
          Swal.fire({
            theme: "dark",
            title: "Success",
            text: data.result.message,
            icon: "success",
            confirmButtonText: "OK",
          });
        }, 700);
      } else {
        setTimeout(() => {
          Swal.fire({
            theme: "dark",
            title: "Error",
            text: data?.result?.message || "Failed to update status",
            icon: "error",
            confirmButtonText: "OK",
          });
        }, 700);
      }

      closeModal();
    } catch (error) {
      console.error("Failed to update status", error);
      Swal.fire({
        theme: "dark",
        title: "Error",
        text: (error as string) || "Failed to update status",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setButtonLoader(false);
      setPin("");
      setOpenModal(false);
      setSelectedTicketId(null);
      setNextStatus(null);
    }
  };

  return (
    <section className="w-full overflow-y-auto min-h-[88vh]">
      <TabNavigation selected={activeTab} onSelect={setActiveTab} />

      <div className="w-full max-w-screen-xl mx-auto mt-4 px-2 sm:px-4">
        <div className="mt-4">
          {activeTab === "received" && (
            <ReceiveForm
              carBrands={carBrands}
              vehicleTypes={vehicleTypes}
              vehicleColors={vehicleColors}
              fetchData={fetchData}
            />
          )}

          {activeTab !== "received" && (
            <div className="space-y-3 mb-2 overflow-y-auto">
              {filteredVehicles?.length > 0 ? (
                filteredVehicles?.map((vehicle) => (
                  <div
                    key={vehicle.ticketNumber}
                    className="bg-slate-800  p-4 relative overflow-hidden"
                  >
                    <div>
                      <h4 className="font-semibold text-blue-500">
                        {vehicle.firstName} {vehicle.lastName}
                      </h4>
                      <p
                        className="text-sm text-gray-500"
                        onClick={() =>
                          navigator.clipboard.writeText(vehicle.ticketNumber)
                        }
                        title="Click to copy"
                      >
                        <span className="font-bold tracking-tight">ID:</span>{" "}
                        <span className="hover:text-blue-600 hover:underline cursor-pointer">
                          {vehicle.ticketNumber}
                        </span>
                      </p>
                    </div>
                    <div className=" rounded-sm flex justify-between items-center">
                      <div>
                        {/* Decorative Circles */}
                        <div className="absolute top-[-6px] left-[-6px]  w-4 h-4 bg-black rounded-full" />
                        <div className="absolute top-[-6px] right-[-6px] w-4 h-4 bg-black rounded-full" />
                        <div className="absolute bottom-[-6px] left-[-6px] w-4 h-4 bg-black rounded-full" />
                        <div className="absolute bottom-[-6px] right-[-6px] w-4 h-4 bg-black rounded-full" />
                        <div>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <p>
                              <span className="font-bold tracking-tight">
                                Type:
                              </span>{" "}
                              {vehicle.type}
                            </p>{" "}
                            <p>
                              <span className="font-bold tracking-tight">
                                Color:
                              </span>{" "}
                              {vehicle.color}
                            </p>
                          </div>
                          <div className=" text-sm text-gray-400 capitalize">
                            <p>
                              <span className="font-bold tracking-tight">
                                Time:{" "}
                              </span>
                              {new Date(vehicle.createdDateTime).toLocaleString(
                                [],
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>{" "}
                      </div>
                      {activeTab != "ready" && (
                        <div className="mt-auto">
                          <button
                            className="my-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-xs md:text-sm transition-colors duration-200"
                            onClick={() =>
                              handleStatusChange(
                                vehicle?.id,
                                activeTab === "parked"
                                  ? "requested"
                                  : activeTab === "requested"
                                  ? "ready"
                                  : ""
                              )
                            }
                          >
                            {activeTab === "parked"
                              ? "Request"
                              : activeTab === "requested"
                              ? "Ready"
                              : ""}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 tracking-tight italic font-light">
                  No vehicles in this status.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={openModal} onClose={closeModal}>
        <div className="space-y-4 text-gray-200">
          <h4 className="tracking-tight">
            Please enter your PIN to confirm the status change:
          </h4>

          <div className="relative w-full">
            <input
              type={showPin ? "text" : "password"}
              name="pin"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,4}$/.test(val)) {
                  setPin(val);
                }
              }}
              className="border-b border-gray-500 px-2 py-2 pr-10 text-sm placeholder-gray-700 tracking-tight w-full"
              maxLength={4}
              inputMode="numeric"
              pattern="\d*"
              required
            />

            <button
              type="button"
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
            >
              {showPin ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="flex">
            <button
              disabled={buttonLoader || !pin}
              onClick={submitPinAndChangeStatus}
              className={` ${
                !pin ? "bg-blue-500/20" : "bg-blue-500"
              } w-full text-white px-4 py-2 rounded hover:bg-blue-600 text-sm transition-colors duration-200`}
            >
              {buttonLoader ? <ButtonLoader /> : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
