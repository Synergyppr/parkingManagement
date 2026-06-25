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
import { fetchTicketsData, handleFetchTicketDetails } from "../helpers/dashboardHelpers";
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

export default function DashboardClient({
  initialStatus = null,
}: DashboardProps) {
  const { registerNotificationHandler } = useSignalR();
  const { propertyId, latitude, longitude, locationMode, requestLocation } =
    useProperty();
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
    const pageTitle = activeTab  === "received" ? "Check In " : `Tickets `;

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
      requestLocation(); // Request user's location
    }

    const fetchingAllTickets = async () => {
      const result = await fetchTicketsData({
        propertyId,
        setLoading,
      });

      console.log("Fetched tickets data:", result);

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
        <div className="fixed inset-0 bg-black/70 bg-opacity-70 z-50 flex items-center justify-center">
          <div className="flex flex-col h-auto">
            <PageLoader />
            <p className="text-white text-sm font-light mt-1 relative bottom-20 md:bottom-37.5 lg:bottom-43.75">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}
      <section
        className="overflow-y-auto overflow-x-hidden min-h-[calc(100vh-140px)] relative z-0"
        style={{
          background:
            "radial-gradient(circle at center, #ffffff 10%, #e0f2ff 90%)",
        }}
      >
        <TabNavigation
          selected={activeTab}
          onSelect={handleTabChange}
          unreadTicketIds={unreadRequestedTickets}
          setReloadPageData={setReloadPageData}
        />

        <div className="w-full max-w-7xl mx-auto mt-2">
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
                <div className="mx-auto mt-10 grid max-w-248 grid-cols-1 gap-6 md:gap-4 md:grid-cols-3 mb-6">
                  {/* Rapid Logging */}
                  <div className="group flex min-h-32.5 items-center gap-5 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition-all 
                  duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] mx-4 md:mx-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white">
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
                  <div className="group flex min-h-32.5 items-center gap-5 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition-all 
                  duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] mx-4 md:mx-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white">
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
                  <div className="group flex min-h-32.5 items-center gap-5 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition-all 
                  duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] mx-4 md:mx-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white">
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
              <div className="flex items-center justify-center h-full">
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
                  damagedParts={damagedParts}
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
