"use client";
import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { useSearchParams } from "next/navigation";
import { CircleParking, MessageCircleCheck, UserKey } from "lucide-react";

import {
  Ticket,
  TicketDetails,
  CarBrand,
  DropdownOption,
  CarPart,
} from "@/app/types";
import { DashboardProps } from "../types/pagesProps";
import {
  fetchTicketsData,
  handleFetchTicketDetails,
} from "../helpers/dashboardHelpers";
import useAuthRedirect from "../hooks/loginHook";
import usePropertyListener from "../hooks/usePropertyListener";
import { useProperty } from "../context/PropertyContext";
import { useSignalR } from "../lib/SignalRProvider";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";

import TabNavigation from "../components/TabNavigation";
import ReceiveForm from "../components/ReceiveForm";
import TicketDetailsModal from "../components/TicketDetailsModal";
import PinConfirmationModal from "../components/PinConfirmationModal";
import ValetTicketList from "../components/ValetTicketList";
import PageLoader from "../components/elements/PageLoader";

const DEFAULT_PRIMARY_COLOR = "#d97706";
const DEFAULT_SECONDARY_COLOR = "#fbbf24";

const isValidThemeColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  const color = value.trim();

  return (
    /^#[0-9a-fA-F]{3}$/.test(color) ||
    /^#[0-9a-fA-F]{6}$/.test(color) ||
    /^rgb(a)?\(/i.test(color) ||
    /^hsl(a)?\(/i.test(color)
  );
};

const applyThemeColors = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  const primary = isValidThemeColor(primaryColor)
    ? primaryColor.trim()
    : DEFAULT_PRIMARY_COLOR;

  const secondary = isValidThemeColor(secondaryColor)
    ? secondaryColor.trim()
    : DEFAULT_SECONDARY_COLOR;

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);

  root.style.setProperty(
    "--primary-light",
    `color-mix(in srgb, ${primary} 35%, white)`
  );

  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${primary} 10%, white)`
  );

  root.style.setProperty(
    "--secondary-light",
    `color-mix(in srgb, ${secondary} 35%, white)`
  );

  root.style.setProperty(
    "--secondary-soft",
    `color-mix(in srgb, ${secondary} 10%, white)`
  );

  localStorage.setItem("primaryColor", primary);
  localStorage.setItem("secondaryColor", secondary);
};

export default function DashboardClient({
  initialStatus = null,
}: DashboardProps) {
  const { registerNotificationHandler } = useSignalR();
  const {
    propertyId,
    latitude,
    longitude,
    locationMode,
    requestLocation,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
  } = useProperty();
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const ticketIdFromUrl = searchParams.get("ticketId");

  const validStatuses = ["received", "parked", "requested", "ready"];
  const saveClickedRef = useRef(false);
  const shouldBypassUnloadPromptRef = useRef(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
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
  const [incidentParts, setIncidentParts] = useState<CarPart[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<CarPart[]>([]);
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
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>(
    {} as TicketDetails
  );
  const [reloadPageData, setReloadPageData] = useState<boolean>(false);
  const [, setHasUnsavedChanges] = useState<boolean>(true);
  const [transitionState, setTransitionState] = useState<string>("fade-in");

  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

  // Get unread ticketIds for current tab
  const unreadTicketIds =
    vehicles?.filter((msg) => activeTab === msg?.status && !msg?.isRead) || [];

  const unreadRequestedTickets =
    vehicles?.filter((msg) => msg?.status === "requested" && !msg?.isRead) ||
    [];

  const formLicensePlate = ticketDetails?.vehicle?.licensePlate || "";

  useAuthRedirect(); // will redirect if not logged in
  usePropertyListener(); // listen for property changes based on user's location

  useEffect(() => {
    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    if (initialStatus && validStatuses?.includes(initialStatus)) {
      setActiveTab(initialStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);

  useEffect(() => {
    if (statusFromUrl) {
      if (validStatuses.includes(statusFromUrl)) {
        setActiveTab(statusFromUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, statusFromUrl]);

  useEffect(() => {
    if (ticketIdFromUrl) {
      const ticketExists = vehicles?.some(
        (ticket) => ticket?.id === ticketIdFromUrl
      );
      if (ticketExists) {
        setSelectedTicketId(ticketIdFromUrl);
        handleFetchTicketDetails({
          id: ticketIdFromUrl,
          setTicketDetails,
          setIncidentParts,
          setDescriptions,
          setDamagedParts,
          setShowTicketDetailsModal,
        });
      }
    }
  }, [searchParams, ticketIdFromUrl, vehicles]);

  useEffect(() => {
    // Register the SignalR notification handler
    registerNotificationHandler(() => {
      setReloadPageData(true);
    });
  }, [registerNotificationHandler]);

  useEffect(() => {
    const pageTitle = activeTab === "received" ? "Check In " : `Tickets `;

    // Update page title when unread count changes
    const count = unreadRequestedTickets?.length;
    document.title =
      count > 0
        ? `${pageTitle} - Parkey Valet App (${count > 9 ? "9+" : count})`
        : `${pageTitle} - Parkey Valet App`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadRequestedTickets]);

  useEffect(() => {
    if (locationMode === "live") {
      requestLocation();
    }

    const fetchingAllTickets = async () => {
      const result = await fetchTicketsData({
        propertyId,
        setLoading,
      });

      console.log("Fetched tickets data:", result);

      const endpointPrimaryColor = isValidThemeColor(result?.primaryColor)
        ? result.primaryColor.trim()
        : DEFAULT_PRIMARY_COLOR;

      const endpointSecondaryColor = isValidThemeColor(result?.secondaryColor)
        ? result.secondaryColor.trim()
        : DEFAULT_SECONDARY_COLOR;

      /*
       * Store the endpoint colors in PropertyContext.
       * This makes the colors available to every component using useProperty().
       */
      setPrimaryColor(endpointPrimaryColor);
      setSecondaryColor(endpointSecondaryColor);

      /*
       * Apply the colors immediately to prevent waiting for the
       * PropertyContext state update and avoid a theme flash.
       */
      applyThemeColors({
        primaryColor: endpointPrimaryColor,
        secondaryColor: endpointSecondaryColor,
      });

      setVehicles(result?.tickets || []);
      setReadyVehicles(result?.readyTickets || []);
      setCarBrands(result?.carBrands || []);
      setVehicleTypes(result?.vehicleTypes || []);
      setVehicleColors(result?.vehicleColors || []);
    };

    fetchingAllTickets();

    return () => {
      setReloadPageData(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, locationMode, reloadPageData]);
  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility function to remove ticketNumber from an object (to ignore it in comparison)
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

  // Handle tab change (Received, Parked, Requested, Ready) to view tickets
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

  // Change selected ticket status
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

  return (
    <>
      {loading === true && propertyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-70">
          <div className="flex h-auto flex-col">
            <PageLoader />
            <p className="relative bottom-20 mt-1 text-sm font-light text-white md:bottom-37.5 lg:bottom-43.75">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}

      <section
        className="
          relative z-0
          min-h-[calc(100vh-140px)]
          overflow-x-hidden overflow-y-auto
          bg-[radial-gradient(circle_at_center,#ffffff_10%,var(--primary-soft)_90%)]
          transition-colors duration-300
        "
      >
        <TabNavigation
          selected={activeTab}
          onSelect={handleTabChange}
          unreadTicketIds={unreadRequestedTickets}
          setReloadPageData={setReloadPageData}
        />

        <div className="mx-auto mt-2 w-full max-w-7xl">
          <div className="px-2 md:px-4">
            {/* Received Tab */}
            {activeTab === "received" && (
              <div>
                <ReceiveForm
                  carBrands={carBrands}
                  vehicleTypes={vehicleTypes}
                  vehicleColors={vehicleColors}
                  form={form}
                  setForm={setForm}
                  initialForm={initialForm}
                  setInitialForm={setInitialForm}
                  isFormChanged={isFormChanged}
                  shouldBypassUnloadPromptRef={shouldBypassUnloadPromptRef}
                  patronId={form?.patronId as string}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  setReloadPageData={setReloadPageData}
                  parkedTickets={vehicles}
                />

                {/* Add 3 aesthetic cards with react icons and marketing messages */}
                <div className="mx-auto mb-6 mt-10 grid max-w-248 grid-cols-1 gap-6 md:grid-cols-3 md:gap-4">
                  {/* Rapid Logging */}
                  <div
                    className="
                      group mx-4 flex min-h-32.5 items-center gap-5
                      rounded-4xl border border-slate-200
                      bg-white p-6 shadow-sm
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:border-(--primary-light)
                      hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]
                      md:mx-0
                    "
                  >
                    <div
                      className="
                        flex h-14 w-14 shrink-0
                        items-center justify-center
                        rounded-2xl
                        bg-(--primary-soft)
                        text-primary
                        transition-all duration-300
                        group-hover:bg-primary
                        group-hover:text-white
                      "
                    >
                      {/* <FaCarSide className="text-2xl" /> */}
                      <UserKey className="text-2xl" />
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-950">
                        Rapid Logging
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        Average check-in takes less than 45 seconds.
                      </p>
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div
                    className="
                      group mx-4 flex min-h-32.5 items-center gap-5
                      rounded-4xl border border-slate-200
                      bg-white p-6 shadow-sm
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:border-(--primary-light)
                      hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]
                      md:mx-0
                    "
                  >
                    <div
                      className="
                        flex h-14 w-14 shrink-0
                        items-center justify-center
                        rounded-2xl
                        bg-(--primary-soft)
                        text-primary
                        transition-all duration-300
                        group-hover:bg-primary
                        group-hover:text-white
                      "
                    >
                      {/* <FaClock className="text-2xl" /> */}
                      <MessageCircleCheck className="text-2xl" />
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-950">
                        SMS Notifications
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        Guests receive a digital ticket instantly via SMS.
                      </p>
                    </div>
                  </div>

                  {/* Paperless Valet */}
                  <div
                    className="
                      group mx-4 flex min-h-32.5 items-center gap-5
                      rounded-4xl border border-slate-200
                      bg-white p-6 shadow-sm
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:border-(--primary-light)
                      hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]
                      md:mx-0
                    "
                  >
                    <div
                      className="
                        flex h-14 w-14 shrink-0
                        items-center justify-center
                        rounded-2xl
                        bg-(--primary-soft)
                        text-primary
                        transition-all duration-300
                        group-hover:bg-primary
                        group-hover:text-white
                      "
                    >
                      {/* <FaParking className="text-2xl" /> */}
                      <CircleParking className="text-2xl" />
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-950">
                        Paperless Valet
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        Eco-friendly digital receipts and retrieval requests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parked, Requested and Ready Tabs */}
            {loading && activeTab !== "received" ? (
              <div className="flex h-full items-center justify-center">
                <PageLoader />
              </div>
            ) : (
              activeTab !== "received" && (
                <ValetTicketList
                  vehicles={activeTab === "ready" ? readyVehicles : vehicles}
                  setVehicles={
                    activeTab === "ready" ? setReadyVehicles : setVehicles
                  }
                  activeTab={activeTab}
                  unreadTicketIds={unreadTicketIds}
                  // damagedParts={damagedParts}
                  handleStatusChange={handleStatusChange}
                  showTransactionModal={showTransactionModal}
                  setShowTransactionModal={setShowTransactionModal}
                  selectedTicketId={selectedTicketId}
                  setSelectedTicketId={setSelectedTicketId}
                  latitude={latitude as number}
                  longitude={longitude as number}
                  locationMode={locationMode}
                  propertyId={propertyId}
                  pageLoading={loading}
                  setReloadPageData={setReloadPageData}
                  setTicketDetails={setTicketDetails}
                  setIncidentParts={setIncidentParts}
                  setDescriptions={setDescriptions}
                  setDamagedParts={setDamagedParts}
                  setShowTicketDetailsModal={setShowTicketDetailsModal}
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
          selectedTicketId={selectedTicketId}
          setSelectedTicketId={setSelectedTicketId}
          nextStatus={nextStatus}
          setNextStatus={setNextStatus}
          vehicles={vehicles}
          setVehicles={setVehicles}
          setShowPinConfirmationModal={setShowPinConfirmationModal}
          setButtonLoader={setButtonLoader}
          setReloadPageData={setReloadPageData}
        />

        {/* Ticket Details Modal */}
        <TicketDetailsModal
          isOpen={showTicketDetailsModal}
          setIsOpen={setShowTicketDetailsModal}
          ticketDetails={ticketDetails}
          setTicketDetails={setTicketDetails}
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
    </>
  );
}
