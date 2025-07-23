"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { LuListVideo } from "react-icons/lu";
import { CiViewList } from "react-icons/ci";
import { carParts } from "../lib/carPartsLegend";
import Modal from "./Modal";
import LabelSelector from "./LabelSelector";
import ViewReportModal from "./ViewReportModal";

interface CarVectorProps {
  noIncident: boolean;
  setNoIncident: React.Dispatch<React.SetStateAction<boolean>>;
  incidentParts: string[];
  setIncidentParts: React.Dispatch<React.SetStateAction<string[]>>;
  descriptions: Record<string, string>;
  setDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  licensePlate?: string;
  findLinkedGroup: (id: string) => string[];
  frontViewLabelsMap: Record<string, string[]>;
  rearViewLabelsMap: Record<string, string[]>;
  passengerViewLabelsMap: Record<string, string[]>;
  driverViewLabelsMap: Record<string, string[]>;
  hideLabels?: boolean;
  setHasUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>; 
  saveClickedRef: React.RefObject<boolean>; 
  shouldBypassUnloadPromptRef?: React.RefObject<boolean>;
  isFormChanged?: () => boolean;
  damagedParts?: { partName: string; description: string }[];
}

const CarVector: React.FC<CarVectorProps> = ({
  noIncident,
  setNoIncident,
  incidentParts,
  setIncidentParts,
  descriptions,
  setDescriptions,
  licensePlate,
  findLinkedGroup,
  frontViewLabelsMap,
  rearViewLabelsMap,
  passengerViewLabelsMap,
  driverViewLabelsMap,
  hideLabels, 
  setHasUnsavedChanges, 
  saveClickedRef,
  shouldBypassUnloadPromptRef,
  isFormChanged,
  damagedParts,
}) => {
  const [showFrontModal, setShowFrontModal] = useState(false);
  const [showRearModal, setShowRearModal] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showFullReportModal, setShowFullReportModal] = useState(false);

  useEffect(() => {
    if (!damagedParts || damagedParts.length === 0) return;

    const allLabelsMap = {
      ...frontViewLabelsMap,
      ...rearViewLabelsMap,
      ...passengerViewLabelsMap,
      ...driverViewLabelsMap,
    };

    const normalizeLabel = (raw: string) =>
      raw.replace(/([A-Z])/g, " $1").trim();

    const newIncidentParts = new Set<string>();
    const newDescriptions: Record<string, string> = {};

    damagedParts.forEach((damage) => {
      const { partName, description } = damage;

      const label = normalizeLabel(partName); // "LeftFrontDoor" → "Left Front Door"
      const ids = allLabelsMap[label];

      if (!ids) {
        console.warn(`No IDs found for label: ${label}`);
        return;
      }

      ids.forEach((id) => newIncidentParts.add(id));

      if (!newDescriptions[label]) {
        newDescriptions[label] = description;
      } else if (!newDescriptions[label].includes(description)) {
        newDescriptions[label] += `, ${description}`;
      }
    });

    setIncidentParts(Array.from(newIncidentParts));
    setDescriptions((prev) => ({ ...prev, ...newDescriptions }));
    setNoIncident(false);
    setHasUnsavedChanges?.(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damagedParts]);

  const handlePartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const partId = target.id;
    if (!partId) return;
    if (hideLabels) return; // If labels are hidden, do nothing

    const group = findLinkedGroup(partId);
    const isGroupActive = group.some((id) => incidentParts.includes(id));

    setIncidentParts((prevParts) =>
      isGroupActive
        ? prevParts.filter((id) => !group.includes(id))
        : [...prevParts, ...group.filter((id) => !prevParts.includes(id))]
    );

    setNoIncident(false);

    // Open corresponding modal based on group, not just partId
    setTimeout(() => {
      if (Object.keys(carParts.frontViewCar).some((id) => group.includes(id))) {
        setShowFrontModal(true);
      } else if (
        Object.keys(carParts.rearViewCar).some((id) => group.includes(id))
      ) {
        setShowRearModal(true);
      } else if (
        Object.keys(carParts.passengerViewCar).some((id) => group.includes(id))
      ) {
        setShowPassengerModal(true);
      } else if (
        Object.keys(carParts.driverViewCar).some((id) => group.includes(id))
      ) {
        setShowDriverModal(true);
      }
    }, 500);
  };

  const isHighlighted = (id: string) => incidentParts.includes(id);

  const isLabelChecked =
    (labelsMap: Record<string, string[]>) => (label: string) =>
      labelsMap[label]?.some((id) => incidentParts.includes(id));

  const toggleLabel =
    (labelsMap: Record<string, string[]>) => (label: string) => {
      const allIds = labelsMap[label].flatMap(findLinkedGroup);
      const isActive = isLabelChecked(labelsMap)(label);

      setIncidentParts((prevParts) =>
        isActive
          ? prevParts.filter((id) => !allIds.includes(id))
          : [...prevParts, ...allIds.filter((id) => !prevParts.includes(id))]
      );

      setNoIncident(false);

      // Optional: clear description if unchecked
      if (isActive) {
        setDescriptions((prev) => {
          const updated = { ...prev };
          delete updated[label];
          return updated;
        });
      }
    };

  const handleSaveIncidentParts = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Combine all label maps into one map: id -> label
    const idToLabelMap: Record<string, string> = {};
    const allLabelMaps = [
      frontViewLabelsMap,
      rearViewLabelsMap,
      passengerViewLabelsMap,
      driverViewLabelsMap,
    ];

    allLabelMaps.forEach((labelMap) => {
      for (const [label, ids] of Object.entries(labelMap)) {
        ids.forEach((id) => {
          idToLabelMap[id] = label;
        });
      }
    });

    // Track labels missing descriptions
    const labelsWithMissingDescriptions = new Set<string>();

    for (const id of incidentParts) {
      const label = idToLabelMap[id];
      const desc = descriptions[label];

      if (!label || !desc || desc.trim() === "") {
        labelsWithMissingDescriptions.add(label || `Unknown (id: ${id})`);
      }
    }

    if (labelsWithMissingDescriptions.size > 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing Descriptions",
        html: `Please provide descriptions for the following labels:<br/><ul class="text-left ml-[22px] mt-2 text-[16px]">${Array.from(
          labelsWithMissingDescriptions
        )
          .map(
            (label) =>
              `<li class="my-1"><span class="text-[#ef6c00] text-lg mr-2">•</span> ${label}</li>`
          )
          .join("")}</ul>`,
      });
      return;
    }

    if (saveClickedRef) {
      saveClickedRef.current = true;
    }
    setHasUnsavedChanges?.(false);

    // Close all modals
    setShowFrontModal(false);
    setShowRearModal(false);
    setShowDriverModal(false);
    setShowPassengerModal(false);
  };

  const handleModalCloseWithConfirm = async (
    view: "passenger" | "driver" | "front" | "rear" | "all"
  ) => {
    if (isFormChanged && !isFormChanged()) {
      if (shouldBypassUnloadPromptRef?.current !== undefined) {
        shouldBypassUnloadPromptRef.current = true;
      }
      if (view === "passenger") setShowPassengerModal(false);
      if (view === "driver") setShowDriverModal(false);
      if (view === "front") setShowFrontModal(false);
      if (view === "rear") setShowRearModal(false);
      if (view === "all") setShowFullReportModal(false);
      return;
    }

    const result = await Swal.fire({
      title: "Discard changes?",
      text: "You have unsaved changes. Are you sure you want to discard them?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, discard",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    const labelMap =
      view === "all"
        ? {
            frontView: frontViewLabelsMap,
            rearView: rearViewLabelsMap,
            passengerView: passengerViewLabelsMap,
            driverView: driverViewLabelsMap,
          }
        : {
            passenger: passengerViewLabelsMap,
            driver: driverViewLabelsMap,
            front: frontViewLabelsMap,
            rear: rearViewLabelsMap,
          }[view];

    const idsToRemove = Object.values(labelMap).flat();

    setIncidentParts((prev) => prev.filter((id) => !idsToRemove.includes(id)));

    setDescriptions((prev) => {
      const updated = { ...prev };
      for (const label in labelMap) {
        delete updated[label];
      }
      return updated;
    });

    if (view === "passenger") setShowPassengerModal(false);
    if (view === "driver") setShowDriverModal(false);
    if (view === "front") setShowFrontModal(false);
    if (view === "rear") setShowRearModal(false);
    if (view === "all") setShowFullReportModal(false);
  };

  const openModal = (view: "passenger" | "driver" | "front" | "rear") => {
    if (hideLabels) return;

    if (view === "passenger") setShowPassengerModal(true);
    if (view === "driver") setShowDriverModal(true);
    if (view === "front") setShowFrontModal(true);
    if (view === "rear") setShowRearModal(true);
  };

  const isReportAvailable = incidentParts.length > 0;

  return (
    <>
      {!hideLabels ? (
        <div>
          <div
            onClick={() => openModal("front")}
            className="flex gap-2 absolute top-6 left-16 lg:left-20 lg:top-10 text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000] cursor-pointer hover:underline"
          >
            Front View
            <LuListVideo className="relative top-[2.5px]" />
          </div>

          <div
            onClick={() => openModal("rear")}
            className="flex gap-2 absolute top-6 right-12 lg:right-20 lg:top-10 text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000] cursor-pointer hover:underline"
          >
            Rear View
            <LuListVideo className="relative top-[2.5px]" />
          </div>
          <div
            onClick={() => openModal("passenger")}
            className="flex gap-2 absolute top-[42%] left-16 lg:left-20 lg:top-[43%] text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000] cursor-pointer hover:underline"
          >
            Passenger (Right-Side) View
            <LuListVideo className="relative top-[2.5px]" />
          </div>
          <div
            onClick={() => openModal("driver")}
            className="flex gap-2 absolute bottom-[-10px] right-20 lg:right-20 text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000] cursor-pointer hover:underline"
          >
            Driver (Left-Side) View
            <LuListVideo className="relative top-[2.5px]" />
          </div>
        </div>
      ) : (
        <div>
          <div
            onClick={() => openModal("front")}
            className="flex gap-2 absolute top-6 left-10 lg:left-20 lg:top-10 text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000]"
          >
            Front View
          </div>

          <div
            onClick={() => openModal("rear")}
            className="flex gap-2 absolute top-6 right-10 lg:right-20 lg:top-10 text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000]"
          >
            Rear View
          </div>
          <div
            onClick={() => openModal("passenger")}
            className="flex gap-2 absolute top-[42%] left-[30%] lg:left-20 lg:top-[43%] text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000]"
          >
            Passenger View
          </div>
          <div
            onClick={() => openModal("driver")}
            className="flex gap-2 absolute bottom-[-10px] left-[35%] lg:right-20 text-orange-500 tracking-tighter text-sm font-bold drop-shadow-[.2px_.2px_.2px_#000]"
          >
            Driver View
          </div>
        </div>
      )}

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 360 384"
        onClick={handlePartClick}
      >
        {/* FIRST CAR MODEL [  FRONT VIEW  ] */}
        <g>
          <g>
            {/* Left Tire */}
            <rect
              x="70.63"
              y="117.63"
              width="12.86"
              height="18.54"
              rx="2.82"
              ry="2.82"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Right Tire */}
            <rect
              x="144.12"
              y="117.63"
              width="12.86"
              height="18.54"
              rx="2.82"
              ry="2.82"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g>
            {/* Front Full Bumper */}
            <path
              id="fullBumper1"
              d="M71.67,122.21c1.1,0,2.21,0,3.31,0,26.45,0,52.89,0,79.34,0,1.4-2.09,4.87-7.84,4.87-15.98,0-8.14-3.47-13.9-4.87-15.99h-82.65c-1.38,3.03-3.46,8.66-3.46,15.98s2.09,12.95,3.46,15.98Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
              className={`cursor-pointer transition-colors ${
                isHighlighted("fullBumper1")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
            />
            <rect
              id="fullBumper2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("fullBumper2")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              x="67.01"
              y="112.36"
              width="94.38"
              height="14.17"
              rx="3.57"
              ry="3.57"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g>
            {/* Hood */}
            <path
              id="hood"
              className={`cursor-pointer transition-colors ${
                isHighlighted("hood") ? "fill-orange-600" : "fill-blue-100"
              }`}
              d="M71.35,106.22c1.1,0,2.21,0,3.31,0,26.45,0,52.89,0,79.34,0,1.4-1.04,4.87-3.92,4.87-7.99,0-4.07-3.47-6.95-4.87-7.99h-82.65c-1.38,1.52-3.46,4.33-3.46,7.99s2.09,6.48,3.46,7.99Z"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Grill */}
            <rect
              id="grill"
              className={`cursor-pointer transition-colors ${
                isHighlighted("grill") ? "fill-orange-600" : "fill-blue-100"
              }`}
              x="96.64"
              y="101.93"
              width="35.48"
              height="15.7"
              rx="2.29"
              ry="2.29"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Right headlight */}
          <rect
            id="rightHeadLight"
            className={`cursor-pointer transition-colors ${
              isHighlighted("rightHeadLight")
                ? "fill-orange-600"
                : "fill-blue-100"
            }`}
            x="72.41"
            y="101.44"
            width="14.6"
            height="7.05"
            rx="2.54"
            ry="2.54"
            fill="#fff"
            stroke="#000"
            strokeMiterlimit="10"
          />
          {/* Left headlight */}
          <rect
            id="leftHeadLight"
            className={`cursor-pointer transition-colors ${
              isHighlighted("leftHeadLight")
                ? "fill-orange-600"
                : "fill-blue-100"
            }`}
            x="140.03"
            y="101.38"
            width="14.6"
            height="7.05"
            rx="2.23"
            ry="2.23"
            fill="#fff"
            stroke="#000"
            strokeMiterlimit="10"
          />
          {/* Side View Mirrors */}
          <g>
            {/* Right side mirror */}
            <path
              d="M152.56,89.24h11.5c.31-.45,1.19-1.84,1.11-3.8-.07-1.66-.79-2.83-1.11-3.3-7.83,0-11.66,0-11.5,0-.34.54-.8,1.45-.96,2.66-.29,2.19.62,3.87.96,4.44Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Left side mirror */}
            <path
              d="M61.21,89.24h11.5c.31-.45,1.19-1.84,1.11-3.8-.07-1.66-.79-2.83-1.11-3.3-7.83,0-11.66,0-11.5,0-.34.54-.8,1.45-.96,2.66-.29,2.19.62,3.87.96,4.44Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Windshield */}
          <g>
            <path
              d="M82.25,70.99c-2.78,5.75-5.56,11.5-8.34,17.25,25.83-.04,51.67-.07,77.5-.11-1.79-3.94-3.17-7.1-4.09-9.23-.78-1.82-1.4-3.26-2.49-5.24-2.6-4.73-4.28-5.86-4.81-6.19-1.89-1.19-3.77-1.35-4.87-1.43-8.22-.61-17.53-.08-23.7-.13-13.74-.1-17.15-.28-17.15-.28-1.84-.09-5.42-.31-8.67,1.85-1.69,1.12-2.75,2.51-3.38,3.51Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="windShield"
              className={`cursor-pointer transition-colors ${
                isHighlighted("windShield")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              d="M84.35,72.38c-2.57,4.62-5.15,9.24-7.72,13.86,23.9-.03,47.8-.06,71.69-.09-1.65-3.17-2.93-5.71-3.78-7.42-.73-1.46-1.29-2.62-2.3-4.21-2.41-3.8-3.96-4.71-4.45-4.98-1.75-.95-3.49-1.08-4.51-1.15-7.6-.49-16.22-.07-21.92-.1-12.71-.08-15.87-.23-15.87-.23-1.71-.08-5.01-.25-8.02,1.49-1.56.9-2.54,2.02-3.12,2.82Z"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
        </g>

        {/* SECOND CAR MODEL [  REAR VIEW  ] */}
        <g>
          {/* Tires */}
          <g data-name="tires">
            {/* Left-Side Tire */}
            <rect
              x="210.31"
              y="115.23"
              width="12.86"
              height="18.54"
              rx="2.82"
              ry="2.82"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Right-Side Tire */}
            <rect
              x="283.79"
              y="115.23"
              width="12.86"
              height="18.54"
              rx="2.82"
              ry="2.82"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Rear Full Bumper */}
          <g>
            <path
              id="carBody"
              className={`cursor-pointer transition-colors ${
                isHighlighted("carBody") ? "fill-orange-600" : "fill-blue-100"
              }`}
              d="M211.35,119.8c1.1,0,2.21,0,3.31,0,26.45,0,52.89,0,79.34,0,1.4-2.09,4.87-7.84,4.87-15.98,0-8.14-3.47-13.9-4.87-15.99h-82.65c-1.38,3.03-3.46,8.66-3.46,15.98s2.09,12.95,3.46,15.98Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Left Exhaust */}
            <circle
              cx="231.88"
              cy="115.88"
              r="1.92"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Right Exhaust */}
            <circle
              cx="274.75"
              cy="115.67"
              r="1.92"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="trunk"
              className={`cursor-pointer transition-colors ${
                isHighlighted("trunk") ? "fill-orange-600" : "fill-blue-100"
              }`}
              d="M219.58,105c2.4.3,5.8.59,9.92.49h0c3.32,0,11.17,0,14.56,0,15.51,0,13.86-.03,15.86-.01,7.7.07,15.41-.2,23.11.03,7.13.22,11.27.57,13.16-2.1,1.21-1.71,1.59-4.79,1.22-7.25-.22-1.46-.62-2.55-1.02-3.37-.75-1.52-1.99-3.65-4.03-5.96h-80.32c-.97,1.84-1.69,3.57-2.23,5.13-.7,2.03-1.11,3.05-1.13,4.08,0,.46-.19,3.65,1.68,5.97.53.66,1.91,2.08,9.23,2.99Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Car Plate Outline */}
            <rect
              x="240.35"
              y="92.87"
              width="24.37"
              height="9.62"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Car License Plate */}
            <rect
              x="242.1"
              y="94.68"
              width="20.12"
              height="6.1"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
              strokeWidth=".75"
            />
            <text
              id="number"
              className="text-gray-800"
              transform="translate(243.61 99.38) scale(.97 1)"
              // fontFamily="MyriadPro-Bold, 'Myriad Pro'"
              fontSize="4.67"
              fontWeight="700"
            >
              <tspan x="0" y="0">
                {licensePlate || "ABC123"}
              </tspan>
            </text>
          </g>
          <path
            id="rearBumper"
            className={`cursor-pointer transition-colors ${
              isHighlighted("rearBumper") ? "fill-orange-600" : "fill-blue-100"
            }`}
            data-name="bumper"
            d="M283.15,122.8c.29-1.78.15-3.46-.65-4.88-1.33-2.35-4.32-2.9-9.9-3.37-7.9-.67-14.13-.48-20.92-.33-5.31.12-6.64.12-10.07.26-12.71.52-16,1.39-17.56,3.83-.55.85-1.13,2.29-.88,4.66-4.98.2-8.66.05-9.81-.17-1.12-.21-2-.67-2-.67-.29-.15-.58-.33-.88-.55-1.69-1.24-2.34-2.99-2.58-3.79-.14-1.52-.28-3.04-.42-4.56,0-1.53.25-4.59,2.42-6.42,1.93-1.62,4.42-1.47,6.83-1.32,4.89.3,9.8-.33,14.69,0,1.22.08,7.25.04,19.3-.04,10.9-.07,16.35-.11,19.26-.2-.96.03,5.89.18,19.63.48,3.12.07,8.57.18,9.85,2.99.19.41.26,1.51.43,3.71.21,2.64.3,3.99,0,5.15-.23.89-.82,2.45-2.54,4.06-1.49.77-4.2,1.91-7.76,2.05-2.75.11-4.98-.42-6.43-.89Z"
            fill="#000"
            stroke="#000"
            strokeMiterlimit="10"
          />
          {/* Side View Mirrors */}
          <g data-name="rearViewMirror">
            {/* Right Side View Mirror */}
            <path
              d="M292.24,86.83h11.5c.31-.45,1.19-1.84,1.11-3.8-.07-1.66-.79-2.83-1.11-3.3-7.83,0-11.66,0-11.5,0-.34.54-.8,1.45-.96,2.66-.29,2.19.62,3.87.96,4.44Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Left Side View Mirror */}
            <path
              data-name="left"
              d="M200.89,86.83h11.5c.31-.45,1.19-1.84,1.11-3.8-.07-1.66-.79-2.83-1.11-3.3-7.83,0-11.66,0-11.5,0-.34.54-.8,1.45-.96,2.66-.29,2.19.62,3.87.96,4.44Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Left Rear (Trunk) Light */}
          <rect
            id="leftTrunkLight"
            className={`cursor-pointer transition-colors ${
              isHighlighted("leftTrunkLight")
                ? "fill-orange-600"
                : "fill-blue-100"
            }`}
            x="212.28"
            y="92.87"
            width="14.6"
            height="7.05"
            rx="2.23"
            ry="2.23"
            fill="#000"
            stroke="#000"
            strokeMiterlimit="10"
          />
          {/* Right Rear (Trunk) Light */}
          <rect
            id="rightTrunkLight"
            className={`cursor-pointer transition-colors ${
              isHighlighted("rightTrunkLight")
                ? "fill-orange-600"
                : "fill-blue-100"
            }`}
            x="279.69"
            y="92.51"
            width="14.6"
            height="7.05"
            rx="2.23"
            ry="2.23"
            fill="#fff"
            stroke="#000"
            strokeMiterlimit="10"
          />
          <g id="windShield-2" data-name="windShield">
            {/* Windshield outline */}
            <path
              d="M221.93,68.59c-2.78,5.75-5.56,11.5-8.34,17.25,25.83-.04,51.67-.07,77.5-.11-1.79-3.94-3.17-7.1-4.09-9.23-.78-1.82-1.4-3.26-2.49-5.24-2.6-4.73-4.28-5.86-4.81-6.19-1.89-1.19-3.77-1.35-4.87-1.43-8.22-.61-17.53-.08-23.7-.13-13.74-.1-17.15-.28-17.15-.28-1.84-.09-5.42-.31-8.67,1.85-1.69,1.12-2.75,2.51-3.38,3.51Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Rear Windshield */}
            <path
              id="rearWindShield"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rearWindShield")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              d="M225.21,69.84c-2.48,4.48-4.97,8.96-7.45,13.44,23.08-.03,46.16-.06,69.23-.08-1.6-3.07-2.83-5.53-3.65-7.19-.7-1.42-1.25-2.54-2.22-4.08-2.33-3.68-3.83-4.57-4.3-4.83-1.69-.92-3.37-1.05-4.35-1.11-7.34-.47-15.66-.06-21.17-.1-12.28-.08-15.32-.22-15.32-.22-1.65-.07-4.84-.24-7.75,1.44-1.51.87-2.45,1.95-3.02,2.74Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
        </g>

        {/* THIRD CAR MODEL [  PASSENGER SIDE VIEW - RIGHT-SIDE VIEW  ] */}
        <g id="passangerSide">
          <g id="frontPassangerSide">
            {/* Front 1 */}
            <path
              id="rightFront"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightFront")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              d="M224.83,220.61c-.35-2.77-.2-5.11,0-6.69,1.78-.6,3.56-1.2,5.34-1.79,18.16,4.22,36.31,8.44,54.47,12.66.89.3,4.61,1.68,6.76,5.67,1.67,3.1,1.45,6.04,1.31,7.14v10.76c-19.16-.59-33.95-.69-41.74-.6-6.74.08-8.62.31-14.45.34,0,0-4.91.13-8.09.36-.68.05-1.37.04-2.05.14-.85.13-1.3.3-1.44.1-.16-.23.25-.7.64-1.41.37-.69.52-1.31.8-2.53.11-.47.25-1.18.46-4.28.07-1.09.13-1.86.16-2.66.1-2.47.25-6.5-.64-11.05-.66-3.37-1.18-3.27-1.54-6.15Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Headlight */}
            <path
              d="M275.04,226.14c-.04.88-.01,1.91.16,3.03.44,2.83,1.6,4.97,2.48,6.27,2.78.14,5.57.27,8.35.41.47-.32,1.32-1.03,1.59-2.14.44-1.81-.79-4.02-3.18-5.16-1.51-.56-3.21-1.1-5.1-1.57-1.53-.38-2.97-.65-4.31-.85Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front 2 */}
            <path
              id="rightFender"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightFender")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              d="M227.46,241.74c.65-.71,8-8.42,18.18-6.77,5.46.88,9.04,4.02,10.5,5.47.89,1.64,2.6,4.18,5.64,5.62,1.32.62,2.88.84,5.95,1.25,2.77.37,5.61.59,9.1.65,5.17.09,7.76.13,8.04-.43,1.15-2.35-9.53-11.55-22.5-17.13-7.21-3.1-9.16-2.52-17.51-5.79-8.89-3.48-15.63-7.64-20-10.67-.37,2.9-.21,5.19,0,6.69.57,4.2,1.81,5.16,2.17,9.59.14,1.8-.04,1.84.08,5.54.09,2.55.25,4.63.38,6Z"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front Bumper */}
            <path
              id="rightViewBumper"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightViewBumper")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="bumper"
              d="M262.55,247.75c4.24.09,7.71.18,10.13.25,4.28.12,8.56.13,12.84.34.64.03,2.36.12,4.66.07,1.51-.03,2.75-.11,3.55-.17.49-.79,1.2-2.17,1.39-4.01.34-3.34-1.25-5.82-1.76-6.55h-13.38c-3.82.82-18.26,4.08-18.21,8.38,0,.5.21,1.07.78,1.7Z"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Grill */}
            <rect
              x="289"
              y="233.11"
              width="3.81"
              height="4.56"
              rx="1.08"
              ry="1.08"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Back Bumper */}
          <g id="backPassangerSide">
            {/* Back 1 */}
            <path
              id="backBumper1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backBumper1")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="Body"
              d="M127.4,245.05c-.9-2.87.21-4.59,1.43-14.71.36-2.99.36-3.91.35-4.46-.09-4-1.26-7.05-1.85-8.56-.54-1.38-1.4-3.25-2.76-5.31-14.29-.8-28.96-1.28-43.99-1.4-3.41-.03-6.8-.03-10.17-.02-1.4,0-2.81,0-4.21,0-1.2,1.34-2.56,2.86-4.03,4.54-3.17,3.61-3.76,4.39-3.99,5.57-.16.82-.44,3.31,2.56,6.77-1.69.84-3.37,1.67-5.06,2.51-.65,1.24-1.62,3.59-1.27,6.44.57,4.58,4.32,8.54,9.54,10.15,7.72,1.16,15.45,2.33,23.17,3.49,14.99.28,29.99.57,44.98.85-3.05-2.13-4.21-4.29-4.7-5.87Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="bodyLine1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("bodyLine1") ? "fill-orange-600" : "fill-blue-100"
              }`}
              d="M126.54,236.8h-33.38c-10.81-3.11-21.61-6.22-32.42-9.33"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Back 2 */}
            <path
              id="backFender1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backFender1")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="backFender1"
              d="M127.26,239.92c-7.01-6.2-16.23-8.36-23.93-5.37-5.23,2.03-8.29,5.87-9.69,7.94-6.09-1.3-9.97-3.89-12.15-5.69-1.81-1.5-3.96-3.32-3.63-5.18.26-1.45,1.92-2.28,6.67-3.93,8.96-3.11,13.58-4.67,20.57-4.95,2.11-.08,3.82-.15,6.12.1,9.19,1.02,15.3,5.59,17.59,7.5-.21,1.25-.41,2.5-.62,3.76-.32,1.94-.63,3.88-.95,5.82Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="frontPassangerTire">
            {/* Front Tire Outline */}
            <ellipse
              id="frontTire1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("frontTire1")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="frontTire1"
              cx="246.05"
              cy="246.05"
              rx="15.73"
              ry="15.71"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front Tire */}
            <ellipse
              id="frontRim1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("frontRim1") ? "fill-orange-600" : "fill-blue-100"
              }`}
              cx="246.05"
              cy="246.05"
              rx="11.88"
              ry="11.86"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Rim */}
            <ellipse
              id="frontCap1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("frontCap1") ? "fill-orange-600" : "fill-blue-100"
              }`}
              cx="246.05"
              cy="246.05"
              rx="6.59"
              ry="6.58"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="backPassangerTire">
            {/* Back Tire Outline */}
            <ellipse
              id="backTire1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backTire1") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="body"
              cx="110.4"
              cy="247.05"
              rx="15.73"
              ry="15.71"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Back Tire */}
            <ellipse
              id="backRim1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backRim1") ? "fill-orange-600" : "fill-blue-100"
              }`}
              cx="110.52"
              cy="247.58"
              rx="11.88"
              ry="11.86"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Rim */}
            <ellipse
              id="backCap1"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backCap1") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="cap"
              cx="110.59"
              cy="247.87"
              rx="6.59"
              ry="6.58"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="frontDoorPassangerSide">
            {/* Front Door */}
            <path
              id="rightFrontDoor"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightFrontDoor")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="body"
              d="M223.73,248.65c1.47-4.62,1.89-8.59,1.99-11.38.08-2.34.2-5.68-.74-9.84-.6-2.64-1.29-4.17-1.61-7.32-.24-2.34-.13-4.3,0-5.6-19.05-.54-38.1-1.08-57.15-1.63.97,2.72,1.93,5.43,2.9,8.15.18,1.38.34,2.79.49,4.24.27,2.75.45,5.4.55,7.93.08,2.13.04,1.87.14,3.8.09,1.86.3,5.4.33,5.91.17,2.87.21,3.41-.05,4.28-.43,1.48-1.3,2.53-1.94,3.17,18.37-.57,36.73-1.14,55.1-1.71Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front Door Handle */}
            <rect
              id="rightFrontHandle"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightFrontHandle")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              x="210.42"
              y="224.51"
              width="9.91"
              height="3.18"
              rx="1.59"
              ry="1.59"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="backDoorPassengerSide">
            {/* Back Door */}
            <path
              id="rightBackDoor"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightBackDoor")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="body"
              d="M126.38,212.02c2.15,3.11,3.1,5.91,3.57,7.74,1.29,5.09.57,9.62.24,11.56-.39,2.32-.86,3.47-1.39,7.23-.45,3.21-.41,4.54-.18,5.46.06.24.12.41.17.55.23.66,1.14,3.06,3.31,4.7,1.3.98,2.51,1.28,4.18,1.67,2.14.51,3.88.55,6.32.51,3.67-.06,5.18-.25,9.91-.51,1.9-.1,3.56-.17,6.89-.31,3.02-.13,5.6-.22,7.58-.28.43-.4,1.04-1.07,1.54-2.05.46-.91.65-1.75.73-2.31-.42-8.22-.84-16.44-1.27-24.66-1.16-3.07-2.32-6.14-3.48-9.21-12.71-.03-25.41-.05-38.12-.08Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Back Door Handle */}
            <rect
              id="rightBackHandle"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightBackHandle")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="handle"
              x="152.72"
              y="222.64"
              width="10.56"
              height="3.38"
              rx="1.51"
              ry="1.51"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="passengerHood">
            {/* Hood (Top) Outline */}
            <path
              data-name="body"
              d="M86.85,210.52c45.51.93,91.02,1.85,136.53,2.78l4.98-1.95c-2.72-1.19-6.87-3.06-11.86-5.58-7.53-3.8-9.7-5.41-14.3-7.24-5.46-2.18-9.68-2.77-15.73-3.72-5.83-.92-13.2-1.41-27.95-1.29-3.84.03-9.66.05-16.87,0-4.09.17-8.18.35-12.27.52-1.31.14-2.69.34-4.14.61-2.23.41-4.27.92-6.1,1.48-2.55.71-5.2,1.52-7.94,2.46-5.52,1.9-10.5,4.02-14.94,6.17-4.35,1.94-8.7,3.89-13.05,5.83,1.21-.02,2.42-.04,3.63-.06Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Middle Glass */}
            <polygon
              id="rightMiddleGlass"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightMiddleGlass")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              points="126.54 208.14 130.19 196.89 159.49 196.89 163.28 208.14 126.54 208.14"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front Glass */}
            <path
              id="rightFrontGlass"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightFrontGlass")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              d="M164.8,196.89l4.45,11.25c7.6.27,15.2.54,22.8.82,6.12.22,12.25.45,18.37.69-1.19-1.5-2.99-3.46-5.56-5.3-2.54-1.82-4.96-2.88-6.76-3.52-2.69-.86-5.81-1.68-9.3-2.3-2.93-.52-5.65-.81-8.1-.95-5.3-.23-10.6-.46-15.9-.69Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Back Door Glass */}
            <polygon
              id="rightBackGlass"
              className={`cursor-pointer transition-colors ${
                isHighlighted("rightBackGlass")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              points="98.43 208.14 117.49 208.14 122.75 198.53 98.43 208.14"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Side View Mirror */}
          <rect
            id="passengerRearViewMirror"
            className={`cursor-pointer transition-colors ${
              isHighlighted("passengerRearViewMirror")
                ? "fill-orange-600"
                : "fill-blue-100"
            }`}
            x="207.77"
            y="208.14"
            width="10.31"
            height="8.33"
            rx="3.72"
            ry="3.72"
            fill="#000"
            stroke="#020202"
            strokeMiterlimit="10"
          />
        </g>

        {/* FOURTH CAR MODEL [  DRIVER SIDE VIEW - LEFT-SIDE VIEW  ] */}
        <g id="driverSide">
          <g id="frontDoorDriverSide">
            {/* Front Door */}
            <path
              id="leftFrontDoor"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftFrontDoor")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              d="M126.25,352.71c-1.48-5.04-1.9-9.35-2-12.39-.08-2.55-.2-6.19.75-10.72.6-2.87,1.3-4.54,1.62-7.97.24-2.55.13-4.68,0-6.1,19.18-.59,38.35-1.18,57.53-1.77-.97,2.96-1.94,5.92-2.91,8.88-.18,1.5-.35,3.04-.49,4.62-.27,2.99-.45,5.88-.55,8.64-.08,2.32-.04,2.04-.14,4.14-.09,2.03-.3,5.88-.34,6.43-.17,3.12-.21,3.71.05,4.66.44,1.62,1.31,2.76,1.95,3.46-18.49-.62-36.97-1.24-55.46-1.87Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front Door Handle */}
            <rect
              id="leftFrontHandle"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftFrontHandle")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="handle"
              x="129.66"
              y="326.42"
              width="9.98"
              height="3.47"
              rx="1.59"
              ry="1.59"
              transform="translate(269.31 656.3) rotate(180)"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="backDriverSide">
            {/* Back Bumper */}
            <path
              id="backBumper2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backBumper2")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="body"
              d="M223.21,348.79c.91-3.13-.21-5-1.44-16.02-.36-3.26-.36-4.26-.35-4.86.09-4.35,1.27-7.67,1.86-9.32.55-1.51,1.41-3.54,2.77-5.78,14.38-.87,29.15-1.39,44.28-1.52,3.43-.03,6.85-.04,10.24-.03,1.41,0,2.82,0,4.24,0,1.21,1.46,2.57,3.12,4.05,4.95,3.19,3.94,3.79,4.78,4.02,6.07.16.89.44,3.6-2.58,7.38,1.7.91,3.39,1.82,5.09,2.73.66,1.36,1.63,3.91,1.28,7.02-.57,4.99-4.35,9.3-9.6,11.06-7.77,1.27-15.55,2.53-23.32,3.8-15.09.31-30.19.62-45.28.93,3.07-2.32,4.23-4.67,4.73-6.39Z"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="bodyLine2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("bodyLine2") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="bodyLine"
              d="M224.07,339.8h33.6c10.88-3.39,21.76-6.77,32.63-10.16"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="backFender2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backFender2")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="fender"
              d="M223.34,343.2c7.06-6.76,16.34-9.11,24.09-5.84,5.26,2.21,8.34,6.39,9.75,8.65,6.13-1.41,10.03-4.23,12.22-6.2,1.82-1.63,3.98-3.62,3.65-5.64-.26-1.58-1.93-2.48-6.72-4.28-9.02-3.39-13.67-5.09-20.71-5.39-2.12-.09-3.85-.17-6.16.11-9.25,1.11-15.4,6.08-17.71,8.17.21,1.36.42,2.73.62,4.09.32,2.11.64,4.23.95,6.34Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          {/* Back Door */}
          <g id="frontDriverSide">
            {/* Front Bumper 1 */}
            <path
              id="leftFront"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftFront") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="body"
              d="M125.13,322.17c.35-3.02.2-5.56,0-7.29-1.79-.65-3.58-1.3-5.38-1.95-18.28,4.59-36.55,9.19-54.83,13.78-.89.33-4.64,1.83-6.8,6.18-1.68,3.37-1.46,6.58-1.32,7.77v11.72c19.28-.64,34.17-.75,42.01-.65,6.78.09,8.68.33,14.54.37,0,0,4.95.14,8.14.39.69.05,1.38.04,2.06.16.85.14,1.31.32,1.45.11.16-.25-.26-.76-.64-1.54-.38-.76-.52-1.42-.81-2.76-.11-.51-.25-1.28-.46-4.66-.07-1.19-.13-2.02-.16-2.9-.1-2.69-.25-7.08.65-12.03.67-3.67,1.19-3.56,1.55-6.7Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="leftFender"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftFender")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="fender"
              d="M122.49,345.18c-.66-.77-8.05-9.17-18.3-7.38-5.49.96-9.1,4.38-10.57,5.95-.89,1.79-2.62,4.55-5.68,6.12-1.33.68-2.9.92-5.98,1.36-2.79.4-5.64.64-9.16.71-5.21.09-7.81.14-8.09-.47-1.15-2.56,9.59-12.58,22.65-18.66,7.26-3.38,9.22-2.75,17.63-6.31,8.95-3.79,15.74-8.32,20.14-11.62.37,3.16.21,5.65,0,7.29-.57,4.58-1.82,5.62-2.18,10.44-.15,1.96.05,2.01-.08,6.04-.09,2.78-.25,5.04-.38,6.53Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="headlight-2"
              data-name="headlight"
              d="M74.59,328.19c.04.96.01,2.08-.16,3.3-.44,3.09-1.61,5.41-2.5,6.83-2.8.15-5.6.3-8.41.45-.47-.35-1.33-1.12-1.6-2.33-.44-1.97.8-4.38,3.2-5.62,1.52-.61,3.24-1.2,5.13-1.7,1.54-.41,2.99-.71,4.34-.93Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <rect
              id="grill-2"
              data-name="grill"
              x="56.71"
              y="335.79"
              width="3.84"
              height="4.97"
              rx="1.08"
              ry="1.08"
              transform="translate(117.26 676.54) rotate(180)"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="leftViewBumper"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftViewBumper")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="bumper"
              d="M87.16,351.73c-4.26.1-7.76.2-10.2.27-4.31.13-8.62.14-12.92.36-.65.03-2.38.13-4.69.07-1.52-.04-2.77-.12-3.57-.19-.49-.86-1.2-2.36-1.4-4.37-.35-3.63,1.26-6.33,1.77-7.13h13.47c3.84.89,18.38,4.45,18.33,9.12,0,.55-.21,1.17-.78,1.85Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g>
            {/* Back Door */}
            <path
              id="leftBackDoor"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftBackDoor")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="body"
              d="M224.23,312.81c-2.16,3.38-3.12,6.44-3.59,8.43-1.3,5.54-.57,10.48-.24,12.59.4,2.53.87,3.78,1.4,7.88.45,3.49.41,4.94.18,5.95-.06.26-.12.45-.17.6-.23.72-1.14,3.33-3.33,5.12-1.3,1.06-2.52,1.39-4.2,1.82-2.15.55-3.91.6-6.36.56-3.69-.06-5.21-.27-9.98-.56-1.91-.11-3.59-.19-6.94-.34-3.04-.14-5.63-.24-7.63-.31-.43-.44-1.05-1.17-1.55-2.23-.47-.99-.65-1.9-.74-2.52.42-8.95.85-17.91,1.27-26.86,1.17-3.34,2.34-6.68,3.51-10.03,12.79-.03,25.58-.06,38.37-.08Z"
              fill="#000"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Back Door Handle */}
            <rect
              id="leftBackHandle"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftBackHandle")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="handle"
              x="187.09"
              y="324.38"
              width="10.63"
              height="3.68"
              rx="1.51"
              ry="1.51"
              transform="translate(384.81 652.44) rotate(180)"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="driverHood">
            {/* Hood (Top) Outline */}
            <path
              id="body-10"
              data-name="body"
              d="M264.02,311.19c-45.81,1.01-91.62,2.02-137.43,3.03l-5.01-2.13c2.74-1.29,6.92-3.33,11.94-6.08,7.58-4.14,9.77-5.89,14.39-7.88,5.5-2.37,9.74-3.02,15.83-4.06,5.87-1,13.29-1.53,28.14-1.41,3.86.03,9.72.06,16.98,0,4.12.19,8.23.38,12.35.57,1.32.15,2.71.37,4.17.66,2.25.45,4.3,1.01,6.14,1.61,2.57.77,5.24,1.66,7.99,2.68,5.55,2.07,10.57,4.37,15.04,6.72,4.38,2.12,8.76,4.23,13.13,6.35-1.22-.02-2.44-.04-3.66-.07Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <polygon
              id="leftMiddleGlass"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftMiddleGlass")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              data-name="middleGlass"
              points="224.07 308.59 220.4 296.34 190.91 296.34 187.09 308.59 224.07 308.59"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <path
              id="leftFrontGlass"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftFrontGlass")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              data-name="frontGlass"
              d="M185.56,296.34l-4.48,12.25c-7.65.29-15.3.59-22.95.89-6.16.24-12.33.49-18.49.75,1.19-1.63,3.01-3.77,5.6-5.77,2.56-1.98,4.99-3.14,6.8-3.83,2.71-.94,5.85-1.83,9.36-2.5,2.95-.56,5.69-.88,8.15-1.04,5.33-.25,10.67-.5,16-.75Z"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <polygon
              id="leftBackGlass"
              className={`cursor-pointer transition-colors ${
                isHighlighted("leftBackGlass")
                  ? "fill-orange-600"
                  : "fill-blue-100/50"
              }`}
              data-name="backGlass"
              points="252.36 308.59 233.18 308.59 227.89 298.12 252.36 308.59"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <rect
            className={`cursor-pointer transition-colors ${
              isHighlighted("driverRearViewMirror")
                ? "fill-orange-600"
                : "fill-blue-100"
            }`}
            id="driverRearViewMirror"
            x="131.92"
            y="308.59"
            width="10.38"
            height="9.07"
            rx="3.72"
            ry="3.72"
            transform="translate(274.23 626.25) rotate(180)"
            fill="#fff"
            stroke="#020202"
            strokeMiterlimit="10"
          />
          <g
            id="backDriverTire"
            className={`cursor-pointer transition-colors ${
              isHighlighted("backDriverTire")
                ? "fill-orange-600"
                : "fill-gray-300"
            }`}
          >
            <ellipse
              id="backTire2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backTire2") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="body"
              cx="240.32"
              cy="350.97"
              rx="15.83"
              ry="17.11"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <ellipse
              id="backRim2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backRim2") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="rim"
              cx="240.2"
              cy="351.54"
              rx="11.96"
              ry="12.92"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            <ellipse
              id="backCap2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("backCap2") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="cap"
              cx="240.13"
              cy="351.86"
              rx="6.63"
              ry="7.16"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
          <g id="frontDriverTire">
            {/* Front Tire */}
            <ellipse
              id="frontTire2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("frontTire2")
                  ? "fill-orange-600"
                  : "fill-blue-100"
              }`}
              data-name="body"
              cx="103.78"
              cy="349.88"
              rx="15.83"
              ry="17.11"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Front Tire Rim */}
            <ellipse
              id="frontRim2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("frontRim2") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="rim"
              cx="103.78"
              cy="349.88"
              rx="11.96"
              ry="12.92"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
            {/* Rim cap */}
            <ellipse
              id="frontCap2"
              className={`cursor-pointer transition-colors ${
                isHighlighted("frontCap2") ? "fill-orange-600" : "fill-blue-100"
              }`}
              data-name="cap"
              cx="103.78"
              cy="349.88"
              rx="6.63"
              ry="7.16"
              fill="#fff"
              stroke="#000"
              strokeMiterlimit="10"
            />
          </g>
        </g>
      </svg>

      {!hideLabels && (
        <div>
          <div className="flex gap-2 items-center absolute bottom-[-55px] right-2 text-gray-800 text-sm tracking-tight">
            <div className="w-3 h-3 bg-blue-100 border-1 border-gray-800"></div>
            Selectable area
          </div>
          <div className="flex gap-2 items-center absolute bottom-[-55px] left-2 text-gray-800 text-sm tracking-tight">
            <div className="w-3 h-3 bg-orange-500 border-1 border-gray-800"></div>
            Damaged area
          </div>

          <div
            aria-disabled={!isReportAvailable}
            onClick={() => {
              if (isReportAvailable) setShowFullReportModal(true);
            }}
            className={`${
              !isReportAvailable ? "opacity-50" : ""
            } flex gap-[5px] items-center absolute bottom-[-81px] left-1 text-sm tracking-tight cursor-pointer text-gray-700`}
          >
            <CiViewList className="w-[14px] h-[14px] text-blue-600" />
            <span className="relative tracking-tight">View Full Report</span>
          </div>

          <div
            className={`${
              isReportAvailable ? "opacity-50" : ""
            } flex gap-2 absolute bottom-[-81px] right-2 text-blue-600 text-sm tracking-tight`}
          >
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="checkbox"
                id={"noIncident"}
                checked={noIncident}
                disabled={isReportAvailable}
                onChange={() => {
                  if (isReportAvailable) return;
                  setNoIncident(!noIncident);
                }}
                className="sr-only peer"
              />
              <div
                className={`w-3 h-3 border-1 transition-all duration-150 ${
                  noIncident
                    ? "bg-orange-500 border-orange-600"
                    : "border-gray-400"
                } peer-focus:ring-2 peer-focus:ring-orange-400 flex items-center justify-center`}
              >
                {noIncident && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-light text-gray-800 leading-relaxed relative top-[1px]">
                No incident(s) to report
              </span>
            </label>
          </div>
        </div>
      )}

      <Modal
        isOpen={showFrontModal}
        onClose={() => setShowFrontModal(false)}
        onRequestClose={() => handleModalCloseWithConfirm("front")}
      >
        <LabelSelector
          labelsMap={frontViewLabelsMap}
          isLabelChecked={isLabelChecked(frontViewLabelsMap)}
          toggleLabel={toggleLabel(frontViewLabelsMap)}
          title="Front View Car Parts"
          setDescriptions={setDescriptions}
          descriptions={descriptions}
        />
        <div className="mt-4 flex">
          <button
            type="button"
            onClick={(e) => handleSaveIncidentParts(e)}
            className="ml-auto cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-8 font-semibold shadow-md tracking-tight rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showRearModal}
        onClose={() => setShowRearModal(false)}
        onRequestClose={() => handleModalCloseWithConfirm("rear")}
      >
        <LabelSelector
          labelsMap={rearViewLabelsMap}
          isLabelChecked={isLabelChecked(rearViewLabelsMap)}
          toggleLabel={toggleLabel(rearViewLabelsMap)}
          title="Rear View Car Parts"
          setDescriptions={setDescriptions}
          descriptions={descriptions}
        />
        <div className="mt-4 flex">
          <button
            type="button"
            onClick={(e) => handleSaveIncidentParts(e)}
            className="ml-auto cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-8 font-semibold shadow-md tracking-tight rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        onRequestClose={() => handleModalCloseWithConfirm("passenger")}
      >
        <LabelSelector
          labelsMap={passengerViewLabelsMap}
          isLabelChecked={isLabelChecked(passengerViewLabelsMap)}
          toggleLabel={toggleLabel(passengerViewLabelsMap)}
          title="Passenger View Car Parts"
          setDescriptions={setDescriptions}
          descriptions={descriptions}
        />
        <div className="mt-4 flex">
          <button
            type="button"
            onClick={(e) => handleSaveIncidentParts(e)}
            className="ml-auto cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-8 font-semibold shadow-md tracking-tight rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        onRequestClose={() => handleModalCloseWithConfirm("driver")}
      >
        <LabelSelector
          labelsMap={driverViewLabelsMap}
          isLabelChecked={isLabelChecked(driverViewLabelsMap)}
          toggleLabel={toggleLabel(driverViewLabelsMap)}
          title="Driver View Car Parts"
          setDescriptions={setDescriptions}
          descriptions={descriptions}
        />
        <div className="mt-4 flex">
          <button
            type="button"
            onClick={(e) => handleSaveIncidentParts(e)}
            className="ml-auto cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-8 font-semibold shadow-md tracking-tight rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      <ViewReportModal
        isOpen={showFullReportModal}
        onClose={setShowFullReportModal}
        allLabelMaps={{
          frontView: frontViewLabelsMap,
          rearView: rearViewLabelsMap,
          passengerView: passengerViewLabelsMap,
          driverView: driverViewLabelsMap,
        }}
        descriptions={descriptions}
        incidentParts={incidentParts}
      />
    </>
  );
};

export default CarVector;
