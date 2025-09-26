"use client";
import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { FaStar } from "react-icons/fa";
import { PiUserCircleFill } from "react-icons/pi";
import TicketDetailsModal from "./TicketDetailsModal";

const surveyList = [
  {
    id: 1,
    rating: 4.5,
    comment: "The service was great, but waiting time could be shorter.",
    author: "John Doe",
    ticketId: "8c63540c-2b3b-497c-b476-1ae4a15624f7",
  },
  {
    id: 2,
    rating: 3.8,
    comment: "Product quality is decent but packaging was damaged.",
    author: "Jane Smith",
    ticketId: "4f11d868-98f4-4aed-b6f9-fba13dd440e5",
  },
  {
    id: 3,
    rating: 4.2,
    comment: "",
    author: "Alice Johnson",
    ticketId: "f180e683-fa97-4306-a127-3a762a4dac26",
  },
];

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <FaStar
        key={i}
        className="w-5 h-5"
        color={i <= Math.floor(rating) ? "gold" : "#e5e7eb"}
      />
    );
  }
  return stars;
};

const Surveys = () => {
  const saveClickedRef = useRef(false);
  const [ticketDetails, setTicketDetails] = useState(null); // Placeholder for ticket details
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [detailsActiveTab, setDetailsActiveTab] = useState("Details");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [noIncident, setNoIncident] = useState(false);
  const [viewAllDamagedParts, setViewAllDamagedParts] = useState(false);
  const [, setHasUnsavedChanges] = useState(false);

  const [incidentParts, setIncidentParts] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<
    { partName: string; description: string; carView: string }[]
  >([]);

  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

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

              setShowTicketDetailsModal(true);
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

  const handleCloseTicketDetails = () => {
    setShowTicketDetailsModal(false);
    setTransitionState("fade-out");
    setTimeout(() => {
      setTicketDetails(null);
      setDetailsActiveTab("Details");
      setTransitionState("fade-in");
      setNoIncident(false);
      setIncidentParts([]);
      setDescriptions({});
      setDamagedParts([]);
      setViewAllDamagedParts(false);
      setHasUnsavedChanges(false);
      saveClickedRef.current = false;
    }, 300); // Match with CSS transition duration
  };

  return (
    <div className="text-gray-800 lg:min-w-[60%]">
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Valet Service Feedback
      </h1>

      <div className="space-y-4 py-2">
        {surveyList?.map((survey) => (
          <div
            key={survey.id}
            className="rounded-xl border border-gray-200 p-6 mt-2"
          >
            {/* Header: Author + Rating */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <PiUserCircleFill className="w-6 h-6 text-gray-500" />
                <p className="font-bold text-gray-700 text-lg">
                  {survey.author}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(survey.rating)}
                <span className="text-gray-600 text-sm">
                  {survey.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm">
              {survey?.comment ? (
                <p>{survey.comment}</p>
              ) : (
                <p className="italic text-gray-400">No comment provided.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() =>
                  handleFetchTicketDetails(survey?.ticketId?.toString())
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
  );
};

export default Surveys;
