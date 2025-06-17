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
import useAuthRedirect from "../lib/loginHook";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from "../components/Modal";
import Swal from "sweetalert2";
import ButtonLoader from "../components/elements/ButtonLoader";
import CarVector from "../components/CarVector";
import Tabs from "../components/elements/Tabs";

// ** DASHBOARD PAGE **

export default function HomePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("received");
  const [detailsActiveTab, setDetailsActiveTab] = useState<string>("Details");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [readyVehicles, setReadyVehicles] = useState<Vehicle[]>([]);
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
  const [transitionState, setTransitionState] = useState<string>("fade-in");
  const [form, setForm] = useState<Partial<Vehicle>>({});
  const [initialForm, setInitialForm] = useState<Partial<Vehicle>>({});
  const [messagesByStatus] = useState<
    Record<string, { ticketId: string; message: string }[]>
  >({}); // TODO: Finish implementing SignalR messages highlighting
  const [damagedParts, setDamagedParts] = useState<
    { partName: string; description: string; carView: string }[]
  >([]);
  const [ticketDetails, setTicketDetails] = useState<{
    patron?: {
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    };
    destination?: string;
    vehicle?: {
      brand?: string;
      model?: string;
      type?: string;
      color?: string;
      licensePlate?: string;
    };
    damagedParts?: { partName: string; description: string; carView: string }[];
  } | null>(null);
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState<boolean>(false);
  const [viewAllDamagedParts, setViewAllDamagedParts] =
    useState<boolean>(false);

  const [noIncident, setNoIncident] = useState(false);
  const [incidentParts, setIncidentParts] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

  // Get unread ticketIds for current tab
  const unreadTicketIds =
    messagesByStatus[activeTab]?.map((msg) => msg.ticketId) || [];

  useAuthRedirect(); // will redirect if not logged in

  const fetchData = async () => {
    // GetValetTicketsByPropertyId
    const res = await fetch("/api/getTicket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "A7E348D3-8DFB-4F71-8BC5-042BA75D53C7",
      }),
    });
    const data = await res.json();
    const result: VehicleApiResponse = data?.data;

    // console.log("Fetched data:", result);
    setVehicles(result?.tickets);
    setReadyVehicles(result?.readyTickets || []);
    setCarBrands(result?.carBrands);
    setVehicleTypes(result?.vehicleTypes);
    setVehicleColors(result?.vehicleColors);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFetchTicketDetails = async (id: string) => {
    if (!id) return;

    try {
      const res = await fetch("/api/getTicketDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data?.status === "200") {
        setTicketDetails(data?.data);
        const damaged = data?.data?.damagedParts || [];

        const viewMap: Record<string, Record<string, string>> = {
          FrontView: carParts.frontViewCar,
          RearView: carParts.rearViewCar,
          PassengerView: carParts.passengerViewCar,
          DriverView: carParts.driverViewCar,
        };

        const newIncidentParts: string[] = [];
        const newDescriptions: Record<string, string> = {};

        damaged.forEach(
          (item: {
            partName: string;
            description: string;
            carView: string;
          }) => {
            const { partName, description, carView } = item;

            // Convert "RightHeadlight" → "Right Headlight"
            const formattedLabel = partName.replace(/([A-Z])/g, " $1").trim();
            const viewParts = viewMap[carView];

            if (!viewParts) {
              console.warn(`Unknown carView: ${carView}`);
              return;
            }

            // Filter the label map for the current view only
            const viewLabelToIdsMap = generateLabelsMap(viewParts);
            const matchedPartIds = viewLabelToIdsMap[formattedLabel];

            if (matchedPartIds?.length) {
              matchedPartIds.forEach((id) => {
                const group = findLinkedGroup(id);
                newIncidentParts.push(...group);
              });

              if (description) {
                newDescriptions[formattedLabel] = description;
              }
            } else {
              console.warn(
                `No matching label found for: ${formattedLabel} in ${carView}`
              );
            }
          }
        );

        const uniqueParts = Array.from(new Set(newIncidentParts));
        setIncidentParts(uniqueParts);
        setDescriptions(newDescriptions);
        setDamagedParts(damaged);
        setTicketDetailsOpen(true);
      } else {
        Swal.fire({
          title: "Error",
          text: data?.result?.message || "Failed to fetch ticket details",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Failed to fetch ticket details", error);
      Swal.fire({
        title: "Error",
        text: (error as string) || "Failed to fetch ticket details",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // TODO: Highlight new tickets
  // useEffect(() => {
  //   // Simulate receiving a new ticket (you'll replace this with your SignalR logic)
  //   const timer = setTimeout(() => {
  //     const newMessage = {
  //       ticketId: "abc123", // match an actual vehicle ID in your data
  //       message: "New vehicle received",
  //     };

  //     setMessagesByStatus((prev) => {
  //       const prevMessages = prev["parked"] || []; // example: assume the tab is "parked"
  //       return {
  //         ...prev,
  //         parked: [...prevMessages, newMessage],
  //       };
  //     });
  //   }, 3000); // after 3s

  //   return () => clearTimeout(timer);
  // }, []);

  // useEffect(() => {
  //   console.log("messagesByStatus:", messagesByStatus);
  //   console.log("unreadTicketIds:", unreadTicketIds);
  // }, [messagesByStatus]);

  const isFormChanged = () => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormChanged()) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initialForm]);

  const handleTabChange = (newTab: string) => {
    if (!isFormChanged()) {
      setActiveTab(newTab);
      return;
    }

    Swal.fire({
      title: "Discard Changes?",
      text: "You have unsaved changes. Are you sure you want to switch tabs and lose them?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, discard",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setForm(initialForm); // reset the form
        setActiveTab(newTab);
      }
    });
  };

  const handleStatusChange = (
    id: string,
    status: "" | "received" | "parked" | "requested" | "ready" | null
  ) => {
    setSelectedTicketId(id);
    setNextStatus(status);
    setOpenModal(true);
  };

  const filteredVehicles =
    activeTab === "ready"
      ? readyVehicles
      : vehicles?.filter((vehicle: Vehicle) => {
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
            title: "Success",
            text: data.result.message,
            icon: "success",
            confirmButtonText: "OK",
          });
        }, 700);
      } else {
        setTimeout(() => {
          Swal.fire({
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

  const handleCloseTicketDetails = () => {
    setTicketDetailsOpen(false);
    setTicketDetails(null);
    setViewAllDamagedParts(false);
    setIncidentParts([]);
    setDescriptions({});
    setNoIncident(false);
    setDetailsActiveTab("Details");
  };

  return (
    <section
      className="w-full overflow-y-auto min-h-[calc(100vh-86px)] relative z-0"
      style={{
        background:
          "radial-gradient(circle at center, #ffffff 10%, #e0f2ff 90%)",
      }}
    >
      <TabNavigation
        selected={activeTab}
        onSelect={handleTabChange}
        fetchData={fetchData}
      />

      <div className="w-full max-w-screen-xl mx-auto mt-4 px-2 sm:px-4">
        <div className="mt-4">
          {activeTab === "received" && (
            <ReceiveForm
              carBrands={carBrands}
              vehicleTypes={vehicleTypes}
              vehicleColors={vehicleColors}
              fetchData={fetchData}
              form={form}
              setForm={setForm}
              initialForm={initialForm}
              setInitialForm={setInitialForm}
            />
          )}
          {loading && activeTab !== "received" ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 font-semibold">Loading...</p>
            </div>
          ) : (
            activeTab !== "received" && (
              <div className="space-y-3 mb-2 overflow-y-auto">
                {filteredVehicles?.length > 0 ? (
                  filteredVehicles?.map((vehicle) => {
                    const isUnread = unreadTicketIds.includes(vehicle.id);

                    return (
                      <div
                        key={vehicle?.ticketNumber}
                        className={`p-4 relative overflow-hidden transition-all duration-500 border rounded ${
                          isUnread
                            ? "bg-yellow-100 border-yellow-300"
                            : "bg-slate-300"
                        }`}
                      >
                        <div>
                          <h4 className="font-semibold text-[#ef6c00] text-shadow-gray-800">
                            {vehicle?.firstName} {vehicle?.lastName}
                          </h4>
                          <p
                            className="text-sm text-gray-800"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                vehicle?.ticketNumber
                              )
                            }
                            title="Click to copy"
                          >
                            <span className="font-bold tracking-tight">
                              ID:
                            </span>{" "}
                            <span className="hover:text-blue-600 hover:underline cursor-pointer">
                              #{vehicle?.ticketNumber}
                            </span>
                          </p>
                        </div>
                        <div className=" rounded-sm flex justify-between items-center">
                          <div>
                            {/* Decorative Circles */}
                            <div className="absolute top-[-6px] left-[-6px]  w-4 h-4 bg-white/70 rounded-full" />
                            <div className="absolute top-[-6px] right-[-6px] w-4 h-4 bg-white/70 rounded-full" />
                            <div className="absolute bottom-[-6px] left-[-6px] w-4 h-4 bg-white/70 rounded-full" />
                            <div className="absolute bottom-[-6px] right-[-6px] w-4 h-4 bg-white/70 rounded-full" />
                            <div>
                              <div className="flex gap-4 text-sm text-gray-800">
                                <p>
                                  <span className="font-bold tracking-tight">
                                    Type:
                                  </span>{" "}
                                  {vehicle?.type}
                                </p>
                                <p>
                                  <span className="font-bold tracking-tight">
                                    Color:
                                  </span>{" "}
                                  {vehicle?.color}
                                </p>
                              </div>
                              <div className="text-sm text-slate-500 capitalize">
                                <p>
                                  <span className="font-bold tracking-tight">
                                    Time:{" "}
                                  </span>
                                  {new Date(
                                    vehicle?.createdDateTime
                                  ).toLocaleString([], {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              {damagedParts && (
                                <div
                                  onClick={() =>
                                    handleFetchTicketDetails(vehicle?.id)
                                  }
                                >
                                  <p className="text-sm tracking-tight cursor-pointer text-blue-500 underline mt-1">
                                    View ticket details
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {activeTab != "ready" && (
                            <div className="mt-auto">
                              <button
                                className="cursor-pointer my-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded"
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
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 tracking-tight italic font-light">
                    No vehicles in this status.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <Modal isOpen={openModal} onClose={closeModal}>
        <div className="space-y-4 text-gray-800">
          <h4 className="tracking-tight leading-5">
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
              className="border-b border-gray-500 px-2 py-2 pr-10 text-sm placeholder-gray-400 tracking-tight w-full"
              maxLength={4}
              inputMode="numeric"
              pattern="\d*"
              required
            />

            <button
              type="button"
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:bg-opacity-50 focus:outline-none cursor-pointer"
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
      <Modal isOpen={ticketDetailsOpen} onClose={handleCloseTicketDetails}>
        <div>
          <div className="absolute top-6 left-6 text-lg font-semibold text-gray-800 mb-4 min-w-[272px] md:min-w-[87.5%]">
            <Tabs
              isSmallScreen={false}
              tabs={["Details", "Damages"]}
              activeTab={detailsActiveTab}
              setActiveTab={setDetailsActiveTab}
              setTransitionState={setTransitionState}
            />
          </div>
          <div
            className={`transition-opacity duration-300 ${
              transitionState === "fade-out" ? "opacity-0" : "opacity-100"
            }  border-b-1 border-x-1 border-solid border-gray-300`}
          >
            {detailsActiveTab === "Details" && (
              <div className="space-y-3 text-sm md:text-base pt-10 p-4 text-gray-800">
                <h4 className="text-lg font-semibold text-blue-500 tracking-tight mb-2">
                  Guest Information
                </h4>
                <p className="mb-2">
                  <strong>Name:</strong>{" "}
                  {ticketDetails?.patron?.firstName +
                    " " +
                    ticketDetails?.patron?.lastName}
                </p>
                {ticketDetails?.destination && (
                  <p className="mb-2">
                    <strong>Destination:</strong> {ticketDetails?.destination}
                  </p>
                )}
                <p className="mb-2">
                  <strong>Phone Number:</strong>{" "}
                  {ticketDetails?.patron?.phoneNumber || ""}
                </p>
                <h4 className="text-lg font-semibold text-blue-500 tracking-tight mb-2">
                  Vehicle Information
                </h4>
                <p className="mb-2">
                  <strong className="tracking-tight">Brand:</strong>{" "}
                  {ticketDetails?.vehicle?.brand || ""}
                </p>
                <p className="mb-2">
                  <strong className="tracking-tight">Model:</strong>{" "}
                  {ticketDetails?.vehicle?.model || ""}
                </p>
                <p className="mb-2">
                  <strong className="tracking-tight">Type:</strong>{" "}
                  {ticketDetails?.vehicle?.type || ""}
                </p>
                <p className="mb-2">
                  <strong className="tracking-tight">Color:</strong>{" "}
                  {ticketDetails?.vehicle?.color || ""}
                </p>
                {ticketDetails?.vehicle?.licensePlate && (
                  <p className="mb-2">
                    <strong className="tracking-tight">License Plate:</strong>{" "}
                    {ticketDetails?.vehicle?.licensePlate}
                  </p>
                )}
              </div>
            )}

            {detailsActiveTab === "Damages" && (
              <div>
                <CarVector
                  noIncident={noIncident}
                  setNoIncident={setNoIncident}
                  incidentParts={incidentParts}
                  setIncidentParts={setIncidentParts}
                  descriptions={descriptions}
                  setDescriptions={setDescriptions}
                  licensePlate={form.licensePlate ?? ""}
                  findLinkedGroup={findLinkedGroup}
                  frontViewLabelsMap={frontViewLabelsMap}
                  rearViewLabelsMap={rearViewLabelsMap}
                  passengerViewLabelsMap={passengerViewLabelsMap}
                  driverViewLabelsMap={driverViewLabelsMap}
                  hideLabels={true}
                />
                <div>
                  {damagedParts?.length > 0 && (
                    <div className="text-center">
                      <button
                        className="text-blue-500 underline mb-0 text-sm cursor-pointer py-1"
                        onClick={() => {
                          setDetailsActiveTab("Damages");
                          setViewAllDamagedParts(!viewAllDamagedParts);
                        }}
                      >
                        {viewAllDamagedParts
                          ? "Hide Damaged Parts"
                          : "View Damaged Parts"}
                      </button>
                    </div>
                  )}

                  {viewAllDamagedParts ? (
                    damagedParts?.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 text-gray-700 pb-2">
                        {damagedParts.map((part, index) => (
                          <li key={index} className="text-sm">
                            {part.partName}{" "}
                            {part.description && (
                              <span className="text-gray-600 italic">
                                ({part.description})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 italic">
                        No damages reported.
                      </p>
                    )
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </section>
  );
}
