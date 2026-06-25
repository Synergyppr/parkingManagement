import Swal from "sweetalert2";
import {
  CarPart,
  MarkAsReadProps,
  Ticket,
  TicketDetails,
  TicketResponseData,
} from "../types";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";

export const fetchTicketsData = async ({
  propertyId,
  // setVehicles,
  // setReadyVehicles,
  // setCarBrands,
  // setVehicleTypes,
  // setVehicleColors,
  setLoading,
}: {
  propertyId: string | null;
  // setVehicles: React.Dispatch<React.SetStateAction<Ticket[]>>;
  // setReadyVehicles: React.Dispatch<React.SetStateAction<Ticket[]>>;
  // setCarBrands: React.Dispatch<React.SetStateAction<CarBrand[]>>;
  // setVehicleTypes: React.Dispatch<React.SetStateAction<VehicleType[]>>;
  // setVehicleColors: React.Dispatch<React.SetStateAction<VehicleColor[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // GetValetTicketsByPropertyId
  // if (!propertyId) {
  //   setVehicles([]);
  //   setReadyVehicles([]);
  //   return;
  // }
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

    // setVehicles(result?.tickets);
    // setReadyVehicles(result?.readyTickets || []);
    // setCarBrands(result?.carBrands);
    // setVehicleTypes(result?.vehicleTypes);
    // setVehicleColors(result?.vehicleColors);
    setLoading(false);
    return result;
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

export const handleFetchTicketDetails = async ({
  id,
  setTicketDetails,
  setIncidentParts,
  setDescriptions,
  setDamagedParts,
  setShowTicketDetailsModal,
}: {
  id: string | null;
  setTicketDetails: React.Dispatch<React.SetStateAction<TicketDetails>>;
  setIncidentParts: React.Dispatch<React.SetStateAction<CarPart[]>>;
  setDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDamagedParts: React.Dispatch<React.SetStateAction<CarPart[]>>;
  setShowTicketDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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

      const damaged = (data?.data?.damagedParts as CarPart[]) || [];

      const viewMap: Record<string, Record<string, string>> = {
        FrontView: carParts.frontViewCar,
        RearView: carParts.rearViewCar,
        PassengerView: carParts.passengerViewCar,
        DriverView: carParts.driverViewCar,
      };

      const newIncidentParts: CarPart[] = [];
      const newDescriptions: Record<string, string> = {};
      damaged?.forEach((item: CarPart) => {
        const { partName, description, carView } = item;

        // Convert "RightHeadlight" → "Right Headlight"
        const formattedLabel = partName?.replace(/([A-Z])/g, " $1").trim();
        const viewParts = viewMap[carView];

        if (!viewParts) {
          return;
        }

        // Filter the label map for the current view only
        const viewLabelToIdsMap = generateLabelsMap(viewParts);
        const matchedPartIds = viewLabelToIdsMap[formattedLabel];

        if (matchedPartIds?.length) {
          matchedPartIds?.forEach((id) => {
            const group = findLinkedGroup(id);
            newIncidentParts?.push(...(group as unknown as CarPart[]));
          });

          if (description) {
            newDescriptions[formattedLabel] = description;
          }
        } else {
          console.warn(
            `No matching label found for: ${formattedLabel} in ${carView}`
          );
        }
      });
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

const closePinModal = ({
  setShowPinConfirmationModal,
  setPin,
}: {
  setShowPinConfirmationModal: React.Dispatch<React.SetStateAction<boolean>>;
  setPin: React.Dispatch<React.SetStateAction<string>>;
}) => {
  setShowPinConfirmationModal(false);
  setPin("");
};

export const handlePinSubmit = async ({
  propertyId,
  locationMode, // "live" | "manual"
  latitude,
  longitude,
  pin,
  setPin,
  selectedTicketId,
  setSelectedTicketId,
  nextStatus,
  setNextStatus,
  vehicles,
  setVehicles,
  markAsRead,
  setShowPinConfirmationModal,
  setButtonLoader,
  setReloadPageData,
}: {
  propertyId: string | null;
  locationMode: "live" | "manual";
  latitude: number | null;
  longitude: number | null;
  pin: string;
  setPin: React.Dispatch<React.SetStateAction<string>>;
  selectedTicketId: string | null;
  setSelectedTicketId: React.Dispatch<React.SetStateAction<string | null>>;
  nextStatus: "" | "received" | "parked" | "requested" | "ready" | null;
  setNextStatus: React.Dispatch<
    React.SetStateAction<
      "" | "received" | "parked" | "requested" | "ready" | null
    >
  >;
  vehicles: Ticket[];
  setVehicles: React.Dispatch<React.SetStateAction<Ticket[]>>;
  markAsRead: (value: MarkAsReadProps) => Promise<void>;
  setShowPinConfirmationModal: React.Dispatch<React.SetStateAction<boolean>>;
  setButtonLoader: React.Dispatch<React.SetStateAction<boolean>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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

    try {
      const res = await fetch("/api/vehicleStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const data = await res.json();

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

        setReloadPageData(true);

        markAsRead({
          vehicle: vehicles?.find(
            (vehicle) => vehicle?.id === selectedTicketId
          ) as Ticket,
          action: "changeStatus",
          setSelectedTicketId,
          setReloadPageData,
          setVehicles,
        });

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

      closePinModal({ setShowPinConfirmationModal, setPin });
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

export const markAsRead = async ({
  vehicle,
  action,
  setSelectedTicketId,
  setReloadPageData,
  setVehicles,
}: {
  vehicle: Ticket;
  action: "view" | "changeStatus";
  setSelectedTicketId: React.Dispatch<React.SetStateAction<string | null>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  setVehicles: React.Dispatch<React.SetStateAction<Ticket[]>>;
}) => {
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
        setReloadPageData(true); // Refresh the data from the API
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
        setReloadPageData(true);
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
    console.error("Error marking ticket as read", error);
    Swal.fire({
      title: "Error",
      text: "Failed to mark ticket as read",
      icon: "error",
      confirmButtonText: "OK",
    });
    return;
  }
};
