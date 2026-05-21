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
import { MdClose, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { MdCameraAlt } from "react-icons/md";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos = ticketDetails?.vehicle?.photos || [];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const nextPhoto = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

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
    <>
    <Modal isOpen={isOpen} onClose={handleCloseTicketDetails} size="lg">
      <div>
        {/* Header with tabs */}
        <div className="border-b border-gray-100">
          <div className="px-5 pt-5 pb-0">
            <Tabs
              isSmallScreen={false}
              tabs={["Details", "Damages", "Log"]}
              activeTab={displayedTab}
              setActiveTab={setDetailsActiveTab}
              setTransitionState={setTransitionState}
            />
          </div>
        </div>

        <div
          className={`transition-all duration-500 ${
            transitionState === "fade-out"
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
          }`}
        >
          {displayedTab === "Details" && (
            <div className="p-5 space-y-4">
              {/* Guest & Destination cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Guest</p>
                  {ticketDetails?.patron && (
                    <>
                      <p className="font-medium text-gray-900 text-sm">
                        {`${ticketDetails?.patron?.firstName ?? ""} ${ticketDetails?.patron?.lastName ?? ""}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPhoneNumber(ticketDetails?.patron?.phoneNumber as string)}
                      </p>
                    </>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Destination</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {ticketDetails?.destination || "—"}
                  </p>
                </div>

                {/* Vehicle Info */}
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Vehicle</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {ticketDetails?.vehicle?.color} {ticketDetails?.vehicle?.brand} {ticketDetails?.vehicle?.model}
                  </p>
                  <p className="text-xs text-gray-500">{ticketDetails?.vehicle?.type}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">License Plate</p>
                  <p className="font-medium text-gray-900 text-sm font-mono">
                    {ticketDetails?.vehicle?.licensePlate || "Not provided"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Created {formatDate(ticketDetails?.createdDateTime || "")}
              </p>

              {/* Vehicle Photos */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MdCameraAlt className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Photos ({photos.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="cursor-pointer relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                        aria-label={`View photo ${index + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Vehicle photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {displayedTab === "Damages" && (
            <div className="p-5">
              <div className="relative mb-4">
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
                  <div className="absolute inset-0 bg-white/95 z-20 p-4 rounded-xl shadow-lg flex flex-col h-[115%]">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 text-center">
                      Incident Report
                    </h4>
                    <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                      {damagedParts?.map((part, index) => (
                        <div
                          key={index}
                          className="bg-slate-50 rounded-xl p-3"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {part?.partName
                              ?.replace(/([A-Z])/g, " $1")
                              .trim()}
                          </p>
                          <p className="text-xs text-accent mt-0.5">
                            {part?.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setViewAllDamagedParts(false)}
                        className="cursor-pointer h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {damagedParts?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewAllDamagedParts(!viewAllDamagedParts)}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  {viewAllDamagedParts
                    ? "Hide Description"
                    : "View Full Description"}
                </button>
              )}
            </div>
          )}

          {displayedTab === "Log" && (
            <div className="p-5">
              <Log logs={ticketDetails?.ticketLogs || []} />
            </div>
          )}
        </div>
      </div>

    </Modal>

      {/* Fullscreen Lightbox — rendered outside Modal to escape its stacking context */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-10000 bg-black/95 flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white text-sm font-medium">
              {lightboxIndex + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              className="cursor-pointer flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
              aria-label="Exit fullscreen"
            >
              <MdClose className="text-lg" />
              Exit
            </button>
          </div>

          {/* Main image */}
          <div
            className="flex items-center justify-center w-full h-full px-12 md:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex].url}
              alt={`Vehicle photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Prev / Next buttons */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="cursor-pointer absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white transition-colors"
                aria-label="Previous photo"
              >
                <MdChevronLeft className="text-3xl" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="cursor-pointer absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white transition-colors"
                aria-label="Next photo"
              >
                <MdChevronRight className="text-3xl" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div
              className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((photo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className={`cursor-pointer shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    index === lightboxIndex
                      ? "border-white scale-110"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Go to photo ${index + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
