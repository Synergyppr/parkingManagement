"use client";
import React, { useState, useRef, useEffect } from "react";

import { useProperty } from "../context/PropertyContext";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { CarPart, TicketDetails } from "../types";
import { handleFetchTicketDetails } from "../helpers/dashboardHelpers";

import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { PiUserCircleFill } from "react-icons/pi";

import TicketDetailsModal from "./TicketDetailsModal";
import PageLoader from "./elements/PageLoader";

interface Survey {
  id: string;
  fullName: string;
  comments?: string;
  ticketId: string;
  rating: number;
}

// Render stars with half-star support
const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // Full star
      stars.push(<FaStar key={i} className="w-5 h-5 text-yellow-400" />);
    } else if (rating >= i - 0.5) {
      // Half star
      stars.push(<FaStarHalfAlt key={i} className="w-5 h-5 text-yellow-400" />);
    } else {
      // Empty star
      stars.push(<FaRegStar key={i} className="w-5 h-5 text-gray-300" />);
    }
  }
  return stars;
};

const Surveys = () => {
  const { propertyId } = useProperty();
  const saveClickedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Survey[]>([]);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>(
    {} as TicketDetails
  );
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [detailsActiveTab, setDetailsActiveTab] = useState("Details");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [noIncident, setNoIncident] = useState(false);
  const [viewAllDamagedParts, setViewAllDamagedParts] = useState(false);
  const [, setHasUnsavedChanges] = useState(false);

  const [incidentParts, setIncidentParts] = useState<CarPart[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<CarPart[]>([]);

  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

  useEffect(() => {
    const fetchSurveys = async () => {
      if (!propertyId) return;
      setLoading(true);
      try {
        const res = await fetch("/api/patronRating/getAll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: propertyId }),
        });

        const data = await res.json();

        if (data?.status === "200") {
          setLoading(false);
          setReport(data?.data || []);
        } else {
          setLoading(false);
          console.log("Failed to fetch surveys", data?.message);
          return;
        }
      } catch (error) {
        setLoading(false);
        console.error("Failed to fetch surveys", error);
        return;
      }
    };

    fetchSurveys();
  }, [propertyId]);

  // Calculate average rating
  const calculateAverageRating = () => {
    if (report.length === 0) return 0;
    const total = report.reduce((sum, survey) => sum + survey.rating, 0);
    return total / report.length;
  };
  const averageRating = calculateAverageRating();

  return (
    <>
      {loading === true && propertyId && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-70 z-50 flex items-center justify-center">
          <div className="flex flex-col h-auto">
            <PageLoader />
            <p className="text-white text-sm font-light mt-1 relative bottom-[80px] md:bottom-[150px] lg:bottom-[175px]">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}

      <div className="text-gray-800 px-4 lg:min-w-[60%] mt-10">
        {/* Header with average rating */}
        <div className="flex flex-col md:flex-row lg:flex-row items-center md:gap-4 lg:gap-4">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Valet Service Feedback
          </h1>
          <div className="flex items-center gap-2 mb-4">
            {renderStars(averageRating)}
            <h1 className="text-xl font-semibold tracking-tight text-gray-500">
              ({averageRating.toFixed(1)} / 5)
            </h1>
          </div>
        </div>

        <div className="space-y-4 py-2 mb-4">
          {report
            // ?.reverse() // Show latest first
            ?.sort((a, b) => (a.id < b.id ? 1 : -1)) // Sort by ID descending
            ?.map((survey) => (
              <div
                key={survey?.id}
                className="rounded-xl border border-gray-200 p-6 mt-2"
              >
                {/* Header: Author + Rating */}
                <div className="flex flex-col md:flex-row lg:flex-row gap-2 md:gap-0 lg:gap-0 justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <PiUserCircleFill className="w-6 h-6 text-gray-500" />
                    <p className="font-bold text-gray-700 text-lg">
                      {survey?.fullName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(survey?.rating)}
                    <span className="text-gray-600 text-sm">
                      {survey?.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm">
                  {survey?.comments ? (
                    <p>{survey?.comments}</p>
                  ) : (
                    <p className="italic text-gray-400">No comment provided.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() =>
                      handleFetchTicketDetails({
                        id: survey?.ticketId,
                        setTicketDetails,
                        setIncidentParts,
                        setDescriptions,
                        setDamagedParts,
                        setShowTicketDetailsModal,
                      })
                    }
                    type="button"
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-100 transition cursor-pointer"
                  >
                    View Ticket
                  </button>
                </div>
              </div>
            ))}
        </div>

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
          formLicensePlate={""}
          findLinkedGroup={findLinkedGroup}
          frontViewLabelsMap={frontViewLabelsMap}
          rearViewLabelsMap={rearViewLabelsMap}
          passengerViewLabelsMap={passengerViewLabelsMap}
          driverViewLabelsMap={driverViewLabelsMap}
          setHasUnsavedChanges={setHasUnsavedChanges}
          saveClickedRef={saveClickedRef}
        />
      </div>
    </>
  );
};

export default Surveys;
