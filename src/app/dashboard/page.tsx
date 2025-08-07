"use client";
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  Ticket,
  TicketResponseData,
  TicketDetails,
  CarBrand,
  DropdownOption,
} from "@/app/types";
import useAuthRedirect from "../hooks/loginHook";
import usePropertyListener from "../hooks/usePropertyListener";
import { useProperty } from "../context/PropertyContext";
import { useSignalR } from "../lib/SignalRProvider";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import TabNavigation from "@/app/components/TabNavigation";
import ReceiveForm from "@/app/components/ReceiveForm";
import TicketDetailsModal from "../components/TicketDetailsModal";
import PinConfirmationModal from "../components/PinConfirmationModal";
import ValetTicketList from "../components/ValetTicketList";
import PageLoader from "../components/elements/PageLoader";

// ** DASHBOARD PAGE **
export default function HomePage() {
  const { registerNotificationHandler } = useSignalR();
  const { propertyId, latitude, longitude, locationMode, requestLocation } =
    useProperty();
  const saveClickedRef = useRef(false);
  const shouldBypassUnloadPromptRef = useRef(false);
  const [form, setForm] = useState<Partial<Ticket>>({}); // Create Valet Ticket Form
  const [initialForm, setInitialForm] = useState<Partial<Ticket>>({});
  const [vehicles, setVehicles] = useState<Ticket[]>([]); // Valet Tickets in status "parked" and "requested"
  const [readyVehicles, setReadyVehicles] = useState<Ticket[]>([]); // Valet Tickets in status "ready"
  const [activeTab, setActiveTab] = useState<string>("received"); // Received, Parked, Requested, Ready
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<DropdownOption[]>([]);
  const [vehicleColors, setVehicleColors] = useState<DropdownOption[]>([]);
  const [nextStatus, setNextStatus] = useState<
    "" | "received" | "parked" | "requested" | "ready" | null
  >(null);
  const [noIncident, setNoIncident] = useState(false);
  const [incidentParts, setIncidentParts] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<
    { partName: string; description: string; carView: string }[]
  >([]);
  const [pin, setPin] = useState<string>(""); // PIN to change status
  const [showPin, setShowPin] = useState<boolean>(false);
  const [showPinConfirmationModal, setShowPinConfirmationModal] =
    useState<boolean>(false); // Show/Hide PIN Confirmation Modal
  const [showTransactionModal, setShowTransactionModal] =
    useState<boolean>(false); // Show/Hide Transaction Modal
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailsActiveTab, setDetailsActiveTab] = useState<string>("Details"); // Ticket Modal Tabs - Details, Damages, Log
  const [showTicketDetailsModal, setShowTicketDetailsModal] =
    useState<boolean>(false);
  const [viewAllDamagedParts, setViewAllDamagedParts] =
    useState<boolean>(false); // Show/Hide text descriptions of damaged parts
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(
    null
  );
  const [, setHasUnsavedChanges] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [transitionState, setTransitionState] = useState<string>("fade-in");
  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

  // Get unread ticketIds for current tab
  const unreadTicketIds =
    vehicles?.filter((msg) => activeTab === msg?.status && !msg?.isRead) || [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const unreadRequestedTickets =
    vehicles?.filter((msg) => msg?.status === "requested" && !msg?.isRead) ||
    [];

  const formLicensePlate = ticketDetails?.vehicle?.licensePlate || "";

  useAuthRedirect(); // will redirect if not logged in
  usePropertyListener(); // listen for property changes based on user's location

  const fetchData = async () => {
    // GetValetTicketsByPropertyId
    if (!propertyId) {
      setVehicles([]);
      setReadyVehicles([]);
      return;
    }
    try {
      const res = await fetch("/api/getTicket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
        }),
      });

      const data = await res.json();
      const result: TicketResponseData = data?.data;

      setVehicles(result?.tickets);
      setReadyVehicles(result?.readyTickets || []);
      setCarBrands(result?.carBrands);
      setVehicleTypes(result?.vehicleTypes);
      setVehicleColors(result?.vehicleColors);
      setLoading(false);
    } catch (error) {
      console.log("Failed to fetch valet tickets", error);
      Swal.fire({
        title: "Error",
        text: (error as string) || "Failed to fetch valet tickets",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  useEffect(() => {
    // Register the SignalR notification handler
    registerNotificationHandler(() => {
      fetchData(); // Refetch tickets when a notification is received
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerNotificationHandler]);

  useEffect(() => {
    // Update page title when unread count changes
    const count = unreadRequestedTickets?.length;
    document.title =
      count > 0
        ? `Valet Parking App (${count > 9 ? "9+" : count})`
        : "Valet Parking App";
  }, [unreadRequestedTickets]);

  useEffect(() => {
    if (locationMode === "live") {
      // setVehicles([]);
      // setReadyVehicles([]);
      requestLocation(); // Request user's location
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, locationMode]);

  // Utility function to remove ticketNumber from an object
  const omitTicketNumber = (formObj: typeof form) => {
    const newForm = { ...formObj };
    delete newForm.ticketNumber;
    return newForm;
  };

  const isFormChanged = () => {
    return (
      JSON.stringify(omitTicketNumber(form)) !==
      JSON.stringify(omitTicketNumber(initialForm))
    );
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (saveClickedRef.current || shouldBypassUnloadPromptRef.current) {
      saveClickedRef.current = false;
      shouldBypassUnloadPromptRef.current = false;
      return;
    }

    if (isFormChanged()) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setTimeout(() => {
      if (activeTab === "requested") {
        setShowTransactionModal(true);
        return;
      } else setShowPinConfirmationModal(true);
    }, 500);
  };

  const closePinModal = () => {
    setShowPinConfirmationModal(false);
    setPin("");
  };

  const handleFetchTicketDetails = async (id: string) => {
    if (!id) return;

    try {
      const res = await fetch("/api/getTicketDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      // console.log("Ticket details fetched:", data);

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
              // console.warn(`Unknown carView: ${carView}`);
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
        setShowTicketDetailsModal(true);
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

  const handlePinSubmit = async () => {
    if (!selectedTicketId || !nextStatus || !pin) return;

    setButtonLoader(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: userLat, longitude: userLng } = position.coords;

      const sendForm = {
        ticketId: selectedTicketId,
        status: nextStatus,
        isUserUpdate: false,
        pin: pin,
        propertyId: propertyId,
        latitude: locationMode === "manual" ? latitude : userLat,
        longitude: locationMode === "manual" ? longitude : userLng,
      };

      // console.log("Sending status change request:", sendForm);

      try {
        const res = await fetch("/api/vehicleStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });

        const data = await res.json();

        // console.log("Status change response:", data);

        if (data?.result?.status === "200") {
          setVehicles([
            ...vehicles.map((vehicle) => {
              if (vehicle?.id === selectedTicketId) {
                return {
                  ...vehicle,
                  status: nextStatus,
                  isRead: false, // Reset read status when status changes
                };
              }
              return vehicle;
            }),
          ]);

          await fetchData(); // refresh the data from the API

          markAsRead(
            vehicles?.find(
              (vehicle) => vehicle?.id === selectedTicketId
            ) as Ticket,
            "changeStatus"
          );

          setTimeout(() => {
            Swal.fire({
              title: "Success",
              // text: data?.result?.message,
              text: `Ticket status updated to ${nextStatus}.`,
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

        closePinModal();
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
        setShowPinConfirmationModal(false);
        setSelectedTicketId(null);
        setNextStatus(null);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (error: unknown) => {
        console.error("Geolocation error:", error);
        Swal.fire({
          icon: "error",
          title: "Location Error",
          text: "Unable to retrieve your location. Please allow location access and try again.",
        });
        setButtonLoader(false);
      };
    });
  };

  const handleCloseTicketDetails = () => {
    setShowTicketDetailsModal(false);
    setTicketDetails(null);
    setViewAllDamagedParts(false);
    setIncidentParts([]);
    setDescriptions({});
    setNoIncident(false);
    setDetailsActiveTab("Details");
  };

  const markAsRead = async (vehicle: Ticket, action: string) => {
    setSelectedTicketId(vehicle?.id);

    const ticket = {
      ticketNumber: vehicle.ticketNumber,
      notificationId: vehicle.notificationId,
      isRead: vehicle.isRead,
    };

    if (action !== "view" && action !== "changeStatus") {
      console.warn(`Unsupported action: ${action}`);
      return;
    }

    if (!ticket?.ticketNumber) return;

    try {
      const sendForm = {
        id: ticket?.notificationId,
      };

      if (action === "view") {
        const res = await fetch("/api/notification/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });

        const data = await res.json();

        if (data?.status === "200") {
          fetchData(); // Refresh the data from the API
        } else {
          Swal.fire({
            title: "Error",
            text: data?.message || "Failed to mark ticket as read",
            icon: "error",
            confirmButtonText: "OK",
          });
          console.error("Error marking ticket as read:", data);
          return;
        }
        return;
      } else if (action === "changeStatus") {
        const res = await fetch("/api/notification/unread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });

        const data = await res.json();

        if (data?.status === "200") {
          fetchData();
        } else {
          Swal.fire({
            title: "Error",
            text: data?.message || "Failed to mark ticket as unread",
            icon: "error",
            confirmButtonText: "OK",
          });
          return;
        }
      }

      // Update the unread status of the ticket
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle?.ticketNumber === ticket?.ticketNumber
            ? { ...vehicle, isRead: true }
            : vehicle
        )
      );
    } catch (error) {
      console.error("Error marking ticket as read:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to mark ticket as read",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
  };

  return (
    <section
      className="overflow-y-auto overflow-x-hidden min-h-[calc(100vh-86px)] relative z-0"
      style={{
        background:
          "radial-gradient(circle at center, #ffffff 10%, #e0f2ff 90%)",
      }}
    >
      <TabNavigation
        selected={activeTab}
        onSelect={handleTabChange}
        fetchData={fetchData}
        unreadTicketIds={unreadRequestedTickets}
      />

      <div className="w-full max-w-screen-xl mx-auto mt-2">
        <div className="px-2 md:px-4">
          {/* Received Tab */}
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
              isFormChanged={isFormChanged}
              shouldBypassUnloadPromptRef={shouldBypassUnloadPromptRef}
            />
          )}
          {/* Parked, Requested and Ready Tabs */}
          {loading && activeTab !== "received" ? (
            <div className="flex items-center justify-center h-full">
              <PageLoader />
            </div>
          ) : (
            activeTab !== "received" && (
              <ValetTicketList
                vehicles={activeTab === "ready" ? readyVehicles : vehicles}
                activeTab={activeTab}
                unreadTicketIds={unreadTicketIds}
                damagedParts={damagedParts}
                handleFetchTicketDetails={handleFetchTicketDetails}
                handleStatusChange={handleStatusChange}
                markAsRead={markAsRead}
                showTransactionModal={showTransactionModal}
                setShowTransactionModal={setShowTransactionModal}
                selectedTicketId={selectedTicketId}
                fetchData={fetchData}
                latitude={latitude as number}
                longitude={longitude as number}
                locationMode={locationMode}
                propertyId={propertyId}
              />
            )
          )}
        </div>
      </div>

      {/* Modal for pin confirmation/authentication */}
      <PinConfirmationModal
        isOpen={showPinConfirmationModal}
        onClose={() => setShowPinConfirmationModal(false)}
        pin={pin}
        setPin={setPin}
        showPin={showPin}
        setShowPin={setShowPin}
        buttonLoader={buttonLoader}
        onSubmit={handlePinSubmit}
        propertyId={propertyId}
      />

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showTicketDetailsModal}
        onClose={handleCloseTicketDetails}
        ticketDetails={ticketDetails}
        detailsActiveTab={detailsActiveTab}
        setDetailsActiveTab={setDetailsActiveTab}
        transitionState={transitionState}
        setTransitionState={setTransitionState}
        noIncident={noIncident}
        setNoIncident={setNoIncident}
        incidentParts={incidentParts}
        setIncidentParts={setIncidentParts}
        descriptions={descriptions}
        setDescriptions={setDescriptions}
        damagedParts={damagedParts}
        viewAllDamagedParts={viewAllDamagedParts}
        setViewAllDamagedParts={setViewAllDamagedParts}
        formLicensePlate={formLicensePlate}
        findLinkedGroup={findLinkedGroup}
        frontViewLabelsMap={frontViewLabelsMap}
        rearViewLabelsMap={rearViewLabelsMap}
        passengerViewLabelsMap={passengerViewLabelsMap}
        driverViewLabelsMap={driverViewLabelsMap}
        setHasUnsavedChanges={setHasUnsavedChanges}
        saveClickedRef={saveClickedRef}
      />
    </section>
  );
}
