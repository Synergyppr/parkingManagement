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
const renderStars = (rating: number, size: "sm" | "md" = "md") => {
  const stars = [];
  const iconClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} className={`${iconClass} text-amber-400`} />);
    } else if (rating >= i - 0.5) {
      stars.push(<FaStarHalfAlt key={i} className={`${iconClass} text-amber-400`} />);
    } else {
      stars.push(<FaRegStar key={i} className={`${iconClass} text-gray-300`} />);
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col h-auto">
            <PageLoader />
            <p className="text-white text-sm font-light mt-1 relative bottom-[80px] md:bottom-[150px] lg:bottom-[175px]">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header with average rating */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              Service Feedback
            </h1>
            <div className="flex items-center gap-2">
              {renderStars(averageRating, "sm")}
              <span className="text-sm font-medium text-gray-500">
                ({averageRating.toFixed(1)})
              </span>
            </div>
          </div>

          {report.length === 0 && !loading ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <p className="font-medium text-gray-600">No feedback yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report
                ?.sort((a, b) => (a.id < b.id ? 1 : -1))
                ?.map((survey) => (
                  <div
                    key={survey?.id}
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
                    className="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {/* Header: Avatar + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {survey?.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {survey?.fullName}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(survey?.rating, "sm")}
                      <span className="text-xs text-gray-400">
                        {survey?.rating?.toFixed(1)}
                      </span>
                    </div>

                    {/* Comment */}
                    {survey?.comments ? (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        &ldquo;{survey?.comments}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">No comment provided.</p>
                    )}
                  </div>
                ))}
            </div>
          )}
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
