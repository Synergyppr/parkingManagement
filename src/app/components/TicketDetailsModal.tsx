"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Tabs from "./elements/Tabs";
import CarVector from "./CarVector";
import Log from "./Log";
// import Surveys from "./Surveys";
import { formatDate, formatPhoneNumber } from "@/app/lib/clientUtils";
import { TicketDetailsModalProps } from "../types/pagesProps";
import { TicketDetails } from "../types";

export default function TicketDetailsModal({
  isOpen,
  setIsOpen,
  ticketDetails,
  setTicketDetails,
  detailsActiveTab,
  setDetailsActiveTab,
  transitionState,
  setTransitionState,
  noIncident,
  setNoIncident,
  incidentParts,
  setIncidentParts,
  descriptions,
  setDescriptions,
  damagedParts,
  viewAllDamagedParts,
  setViewAllDamagedParts,
  formLicensePlate,
  findLinkedGroup,
  frontViewLabelsMap,
  rearViewLabelsMap,
  passengerViewLabelsMap,
  driverViewLabelsMap,
  setHasUnsavedChanges,
  saveClickedRef,
}: TicketDetailsModalProps) {
  const [displayedTab, setDisplayedTab] = useState(detailsActiveTab);

  useEffect(() => {
    if (transitionState === "fade-in") {
      setDisplayedTab(detailsActiveTab);
    }
  }, [transitionState, detailsActiveTab]);

  const handleCloseTicketDetails = () => {
    setIsOpen(false);
    setTicketDetails({} as TicketDetails);
    setViewAllDamagedParts(false);
    setIncidentParts([]);
    setDescriptions({});
    setNoIncident(false);
    setDetailsActiveTab("Details");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseTicketDetails}>
      <div>
        <Tabs
          isSmallScreen={false}
          tabs={["Details", "Damages", "Log"]}
          activeTab={displayedTab}
          setActiveTab={setDetailsActiveTab}
          setTransitionState={setTransitionState}
        />

        <div
          className={`transition-all duration-1000 ${
            transitionState === "fade-out"
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
          } border-b-1 border-x-1 border-solid border-gray-30 bg-gradient-to-b to-amber-50/50 via-white`}
        >
          {displayedTab === "Details" && (
            <div className="space-y-4 text-sm md:text-base pt-4 px-4 pb-4 text-gray-800 bg-gradient-to-b to-slate-200 via-slate-100/50">
              {/* Guest Info */}
              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-orange-500 tracking-tight mb-1 italic ml-[-2px]">
                  Guest Information
                </h4>

                {ticketDetails?.patron && (
                  <>
                    {ticketDetails?.patron?.firstName?.length +
                      ticketDetails?.patron?.lastName?.length >
                      0 && (
                      <p>
                        <strong className="tracking-tighter">Name:</strong>{" "}
                        {`${ticketDetails?.patron?.firstName ?? ""} ${
                          ticketDetails?.patron?.lastName ?? ""
                        }`}
                      </p>
                    )}
                    <p>
                      <strong className="tracking-tighter">
                        Phone Number:
                      </strong>{" "}
                      <span>
                        {formatPhoneNumber(
                          ticketDetails?.patron?.phoneNumber as string
                        )}
                      </span>
                    </p>
                  </>
                )}
                {ticketDetails?.destination && (
                  <p>
                    <strong className="tracking-tighter">Destination:</strong>{" "}
                    <span>{ticketDetails?.destination}</span>
                  </p>
                )}
                <p className="mb-0">
                  <strong className="tracking-tighter">Created On:</strong>{" "}
                  {formatDate(ticketDetails?.createdDateTime || "")}
                </p>

                {/* TODO: Finish */}
                {/* <p className="text-blue-600 underline hover:text-purple-600 trasnsition duration-700 cursor-pointer text-sm tracking-tight mt-2">
                  View Guest Feedback
                </p> */}
              </div>

              {/* Vehicle Info */}
              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-orange-500 tracking-tight mb-1 italic ml-[-2px]">
                  Vehicle Information
                </h4>

                <p>
                  <strong className="tracking-tighter">Brand:</strong>{" "}
                  {ticketDetails?.vehicle?.brand}
                </p>
                <p>
                  <strong className="tracking-tighter">Model:</strong>{" "}
                  {ticketDetails?.vehicle?.model}
                </p>
                <p>
                  <strong className="tracking-tighter">Type:</strong>{" "}
                  {ticketDetails?.vehicle?.type}
                </p>
                <p className="capitalize">
                  <strong className="tracking-tighter">Color:</strong>{" "}
                  {ticketDetails?.vehicle?.color}
                </p>
                {ticketDetails?.vehicle?.licensePlate && (
                  <p>
                    <strong className="tracking-tighter">License Plate:</strong>{" "}
                    {ticketDetails?.vehicle?.licensePlate}
                  </p>
                )}
              </div>
            </div>
          )}

          {displayedTab === "Damages" && (
            <div>
              <div className="relative mb-6">
                <CarVector
                  noIncident={noIncident}
                  setNoIncident={setNoIncident}
                  incidentParts={incidentParts}
                  setIncidentParts={setIncidentParts}
                  descriptions={descriptions}
                  setDescriptions={setDescriptions}
                  licensePlate={formLicensePlate}
                  findLinkedGroup={findLinkedGroup}
                  frontViewLabelsMap={frontViewLabelsMap}
                  rearViewLabelsMap={rearViewLabelsMap}
                  passengerViewLabelsMap={passengerViewLabelsMap}
                  driverViewLabelsMap={driverViewLabelsMap}
                  hideLabels={true}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  saveClickedRef={saveClickedRef}
                />

                {viewAllDamagedParts && (
                  <div className="absolute inset-0 bg-white/90 z-20 p-3 rounded-md shadow-lg flex flex-col h-[115%]">
                    <h4 className="text-lg font-semibold text-blue-600 mb-1 text-center tracking-tighter">
                      Incident Report
                    </h4>
                    <div className="overflow-y-auto flex-1 pr-2 space-y-2 text-gray-800">
                      {damagedParts?.map((part, index) => (
                        <div
                          key={index}
                          className="border border-gray-300 rounded p-2 bg-white"
                        >
                          <p className="text-sm font-semibold">
                            {/* {part?.carView?.replace(/View$/, "")}{" "} */}
                            <span className="font-normal">
                              {part?.partName
                                ?.replace(/([A-Z])/g, " $1")
                                .trim()}
                            </span>
                          </p>
                          <p className="text-sm text-orange-500">
                            {part?.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setViewAllDamagedParts(false)}
                        className="cursor-pointer text-white bg-blue-500 px-4 py-1 rounded hover:bg-blue-600 text-sm transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {damagedParts?.length > 0 && (
                <div
                  onClick={() => setViewAllDamagedParts(!viewAllDamagedParts)}
                  className="text-center bg-blue-500 text-xs py-1 tracking-tight hover:bg-blue-600 cursor-pointer mt-4"
                >
                  <button
                    type="button"
                    className="text-white text-sm cursor-pointer"
                  >
                    {viewAllDamagedParts
                      ? "Hide Description"
                      : "View Full Description"}
                  </button>
                </div>
              )}
            </div>
          )}

          {displayedTab === "Log" && (
            <Log logs={ticketDetails?.ticketLogs || []} />
          )}

          {/* {displayedTab === "Feedback" && <Surveys />} */}
        </div>
      </div>
    </Modal>
  );
}
