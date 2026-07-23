"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useProperty } from "../context/PropertyContext";
import {
  GoogleMap,
  Marker,
  Circle,
  useLoadScript,
  Polyline,
} from "@react-google-maps/api";
import {
  simulateDrive,
  generateInterpolatedPath,
  handlePlay,
  handlePause,
  // handleStop,
} from "../lib/clientUtils";
import usePropertyListener from "../hooks/usePropertyListener";
import { GoDotFill } from "react-icons/go";
import { FaMinus, FaPlus } from "react-icons/fa";
import { FaPlay, FaPause } from "react-icons/fa6"; // FaStop
// import { BsFillFastForwardFill, BsFillRewindFill } from "react-icons/bs";
import { CollapsibleSection } from "./CollapsibleSection";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const centerDefault = {
  lat: 18.426434,
  lng: -66.059545,
};

interface SimulationOptions {
  route: google.maps.LatLngLiteral[];
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  setManualLat: (lat: string) => void;
  setManualLng: (lng: string) => void;
  simulationInProgress: boolean;
  setSimulationInProgress: (inProgress: boolean) => void;
  setMessage: (message: string) => void;
  setSimulatedPath: React.Dispatch<
    React.SetStateAction<google.maps.LatLngLiteral[]>
  >;
  onComplete: () => void;
}

const Location = () => {
  const {
    latitude,
    longitude,
    setLatitude,
    setLongitude,
    propertyName,
    predefinedProperties,
    setPropertyId,
    setPropertyName,
    locationMode,
    setLocationMode,
    requestLocation,
  } = useProperty();

  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [simulationInProgress, setSimulationInProgress] = useState(false);
  const [pointA, setPointA] = useState<
    keyof typeof predefinedProperties | null
  >(null);
  const [pointB, setPointB] = useState<
    keyof typeof predefinedProperties | null
  >(null);
  const [selectionMode, setSelectionMode] = useState<"A" | "B" | null>(null);
  const [pointACoords, setPointACoords] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [pointBCoords, setPointBCoords] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [drivesOpen, setDrivesOpen] = useState(true);
  const [advancedSimOpen, setAdvancedSimOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [customizeCoordsOpen, setCustomizeCoordsOpen] = useState(true);
  const [properties, setProperties] = useState<
    Record<
      string,
      { name: string; lat: number; lng: number; id: string; radius: number }
    >
  >({});
  const [, setSimulatedPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [plannedPath, setPlannedPath] = useState<google.maps.LatLngLiteral[]>(
    []
  );
  const [currentSimulationLabel, setCurrentSimulationLabel] = useState<
    string | null
  >(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [simulationState, setSimulationState] = useState({
    route: [] as google.maps.LatLngLiteral[],
    currentSegment: 0,
    currentStep: 0,
  });
  const [delay] = useState(100); // Default to 100ms
  const [eta, setEta] = useState<string | null>(null);

  const existingProps: SimulationOptions = {
    route: simulationState.route, // or your selected predefined route
    setLatitude,
    setLongitude,
    setManualLat,
    setManualLng,
    simulationInProgress,
    setSimulationInProgress,
    setMessage,
    setSimulatedPath,
    onComplete: () => {
      setCurrentSimulationLabel(null);
    },
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  usePropertyListener();

  useEffect(() => {
    if (latitude !== null) setManualLat(latitude.toString());
    if (longitude !== null) setManualLng(longitude.toString());
  }, [latitude, longitude]);

  useEffect(() => {
    const mapElement = document.getElementById("map-container");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [simulationInProgress]);

  const keyMap = {
    "250 Plaza": "plaza250",
    "270 Plaza": "plaza270",
    "Condado Ocean Club": "coc",
    "Condado Vanderbilt": "cvh",
    "La Concha Resort": "laConcha",
  };

  useEffect(() => {
    // console.log("Predefined", predefinedProperties)
    const uniqueProperties = Array.isArray(predefinedProperties)
      ? predefinedProperties.reduce((acc, prop) => {
          const key = keyMap[prop.name as keyof typeof keyMap];
          if (!key) return acc; // skip if no matching key

          acc[key] = {
            name: prop.name,
            lat: prop.latitude as number,
            lng: prop.longitude as number,
            id: prop.id,
            radius: prop.radius,
          };

          return acc;
        }, {})
      : null;
    setProperties(uniqueProperties || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predefinedProperties]);

  // ✅ Property detection effect (replaces logic from handleMarkerDragEnd)
  useEffect(() => {
    if (latitude == null || longitude == null) return;

    let foundProperty = null;

    for (const prop of Object.values(properties)) {
      const R = 6371e3; // meters
      const dLat = (prop.lat - latitude) * (Math.PI / 180);
      const dLng = (prop.lng - longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(latitude * (Math.PI / 180)) *
          Math.cos(prop.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance <= prop.radius) {
        foundProperty = prop;
        break;
      }
    }

    if (foundProperty) {
      setPropertyId(foundProperty.id);
      setPropertyName(foundProperty.name);
      setMessage(`You are within ${foundProperty.name}.`);
    } else {
      setPropertyId("");
      setPropertyName("");
      setMessage("You are outside all known properties.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, properties]);

  const handleUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setMessage("Please enter valid numbers for latitude and longitude.");
      return;
    }

    setLatitude(lat as number);
    setLongitude(lng as number);
    setMessage("Coordinates updated successfully!");
  };

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setLatitude(lat);
        setLongitude(lng);
        setManualLat(lat.toString());
        setManualLng(lng.toString());
      }
    },
    [setLatitude, setLongitude, setManualLat, setManualLng]
  );

  // const getSpeedInfo = (delay: number) => {
  //   // These are arbitrary values; feel free to tweak them
  //   let label = "";
  //   let bg = "";
  //   let mph = 0;

  //   if (delay <= 50) {
  //     label = "Very Fast";
  //     bg = "bg-green-600 text-white";
  //     mph = 60;
  //   } else if (delay <= 100) {
  //     label = "Fast";
  //     bg = "bg-green-400 text-white";
  //     mph = 45;
  //   } else if (delay <= 200) {
  //     label = "Normal";
  //     bg = "bg-yellow-400 text-black";
  //     mph = 30;
  //   } else if (delay <= 300) {
  //     label = "Slow";
  //     bg = "bg-orange-500 text-white";
  //     mph = 15;
  //   } else {
  //     label = "Very Slow";
  //     bg = "bg-red-600 text-white";
  //     mph = 5;
  //   }

  //   return { label, bg, mph };
  // };

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  const currentLat = latitude ?? centerDefault.lat;
  const currentLng = longitude ?? centerDefault.lng;

  return (
    <div className="flex flex-col items-center max-w-full min-w-full lg:min-w-112.5">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl space-y-4">
        {/* Toggle Mode Button */}
        <div className="mb-4 mx-auto flex justify-between md:min-w-87.5 min-w-112.5">
          <button
            onClick={() => {
              const newMode = locationMode === "live" ? "manual" : "live";
              setLocationMode(newMode);
              setMessage("Location mode switched to " + newMode);
              if (newMode === "live") requestLocation();
            }}
            className="text-lg px-3 py-1 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 -mt-0.75 -ml-0.5"
          >
            Switch to {locationMode === "live" ? "Manual" : "Live"}
          </button>

          {locationMode === "live" && (
            <div className="flex items-center">
              <GoDotFill className="text-red-500 text-lg blinking-dot" />
              <span className="text-gray-600">Live</span>
            </div>
          )}
        </div>

        {/* Drives Section */}
        {locationMode === "manual" && (
          <CollapsibleSection
            title="Pre-defined Drives"
            isOpen={drivesOpen}
            toggle={() => setDrivesOpen(!drivesOpen)}
          >
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  const route = [properties?.plaza250, properties?.plaza270];
                  setPlannedPath(generateInterpolatedPath(route));
                  setCurrentSimulationLabel("250 Plaza → 270 Plaza");
                  simulateDrive({
                    route: route,
                    setLatitude,
                    setLongitude,
                    setManualLat,
                    setManualLng,
                    simulationInProgress,
                    setSimulationInProgress,
                    setMessage,
                    setSimulatedPath,
                    logLabel: "250 Plaza → 270 Plaza",
                    onComplete: () => setCurrentSimulationLabel(null),
                    setSimulationState,
                    intervalRef,
                    currentSegment: 0,
                    currentStep: 0,
                    delay,
                    setEta,
                  });
                }}
                disabled={simulationInProgress}
                className={`text-sm px-3 py-1.5 rounded-md transition ${
                  simulationInProgress &&
                  currentSimulationLabel === "250 Plaza → 270 Plaza"
                    ? "text-purple-600 bg-white border-purple-600 border rounded-sm cursor-not-allowed"
                    : simulationInProgress &&
                      currentSimulationLabel !== "250 Plaza → 270 Plaza"
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
                }`}
              >
                Simulate Drive: 250 → 270
              </button>
              <button
                onClick={() => {
                  const route = [
                    properties?.coc,
                    properties?.cvh,
                    properties?.laConcha,
                  ];
                  setPlannedPath(generateInterpolatedPath(route));
                  setCurrentSimulationLabel("COC → CVH → La Concha");
                  simulateDrive({
                    route: route?.map((p) => ({ lat: p.lat, lng: p.lng })),
                    setLatitude,
                    setLongitude,
                    setManualLat,
                    setManualLng,
                    simulationInProgress,
                    setSimulationInProgress,
                    setMessage,
                    predefinedProperties,
                    setSimulatedPath,
                    logLabel: "COC → CVH → La Concha",
                    onComplete: () => setCurrentSimulationLabel(null),
                    setSimulationState,
                    intervalRef,
                    currentSegment: 0,
                    currentStep: 0,
                    delay,
                    setEta,
                  });
                }}
                disabled={simulationInProgress}
                className={`text-sm px-3 py-1.5 rounded-md transition ${
                  simulationInProgress &&
                  currentSimulationLabel === "COC → CVH → La Concha"
                    ? "text-teal-600 bg-white border-teal-600 border rounded-sm cursor-not-allowed"
                    : simulationInProgress &&
                      currentSimulationLabel !== "COC → CVH → La Concha"
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                }`}
              >
                Simulate Drive: COC → CVH → La Concha
              </button>
            </div>
          </CollapsibleSection>
        )}

        {/* Advanced Simulations Section */}
        {locationMode === "manual" && (
          <CollapsibleSection
            title="Advanced Simulations (Custom Drives)"
            isOpen={advancedSimOpen}
            toggle={() => setAdvancedSimOpen(!advancedSimOpen)}
          >
            <div className="flex gap-2 text-gray-800 mt-2 mb-2 text-sm max-w-full flex-wrap">
              <select
                value={pointA ?? ""}
                onChange={(e) =>
                  setPointA(e.target.value as keyof typeof properties)
                }
                className="border px-2 py-1 rounded bg-orange-400 border-orange-400 text-white"
              >
                <option value="">Select Point A</option>
                {Object.entries(properties).map(([key, prop]) => (
                  <option key={key} value={key}>
                    {prop.name}
                  </option>
                ))}
              </select>

              <select
                value={pointB ?? ""}
                onChange={(e) =>
                  setPointB(e.target.value as keyof typeof properties)
                }
                className="border px-2 py-1 rounded bg-orange-400 border-orange-400 text-white"
              >
                <option value="">Select Point B</option>
                {Object.entries(properties).map(([key, prop]) => (
                  <option key={key} value={key}>
                    {prop.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const route = [
                    properties[pointA as string],
                    properties[pointB as string],
                  ];
                  setPlannedPath(generateInterpolatedPath(route));
                  setCurrentSimulationLabel(
                    `${properties[pointA as string]} → ${
                      properties[pointB as string]
                    }`
                  );
                  simulateDrive({
                    route: route,
                    setLatitude,
                    setLongitude,
                    setManualLat,
                    setManualLng,
                    simulationInProgress,
                    setSimulationInProgress,
                    setMessage,
                    setSimulatedPath,
                    logLabel: `${properties[pointA as string]} → ${
                      properties[pointB as string]
                    }`,
                    onComplete: () => setCurrentSimulationLabel(null),
                    setSimulationState,
                    intervalRef,
                    currentSegment: 0,
                    currentStep: 0,
                    delay,
                    setEta,
                  });
                }}
                disabled={!pointA || !pointB || simulationInProgress}
                className={`text-sm px-3 py-1.5 rounded-md transition ${
                  simulationInProgress || !pointA || !pointB
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                Simulate A → B
              </button>
            </div>

            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setSelectionMode("A")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  selectionMode === "A"
                    ? "bg-pink-600 text-white hover:bg-pink-700/80"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Select Point A on Map
              </button>

              <button
                onClick={() => setSelectionMode("B")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  selectionMode === "B"
                    ? "bg-pink-600 text-white hover:bg-pink-700/80"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Select Point B on Map
              </button>

              <button
                onClick={() => {
                  if (pointACoords && pointBCoords) {
                    const route = [pointACoords, pointBCoords];
                    setPlannedPath(generateInterpolatedPath(route));
                    setCurrentSimulationLabel(
                      `${pointACoords} → ${pointBCoords}`
                    );
                    simulateDrive({
                      route: route,
                      setLatitude,
                      setLongitude,
                      setManualLat,
                      setManualLng,
                      simulationInProgress,
                      setSimulationInProgress,
                      setMessage,
                      setSimulatedPath,
                      logLabel: `${pointACoords} → ${pointBCoords}`,
                      onComplete: () => setCurrentSimulationLabel(null),
                      setSimulationState,
                      intervalRef,
                      currentSegment: 0,
                      currentStep: 0,
                      delay,
                      setEta,
                    });
                  }
                }}
                disabled={
                  !pointACoords || !pointBCoords || simulationInProgress
                }
                className={`px-3 py-1 rounded ${
                  !pointACoords || !pointBCoords || simulationInProgress
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                }`}
              >
                Simulate A → B (Custom)
              </button>
            </div>
          </CollapsibleSection>
        )}

        {/* Properties Section */}
        {locationMode === "manual" && (
          <CollapsibleSection
            title="Properties"
            isOpen={propertiesOpen}
            toggle={() => setPropertiesOpen(!propertiesOpen)}
          >
            <div className="flex flex-wrap justify-start gap-2 mb-4">
              {Object.entries(properties).map(([key, prop]) => (
                <button
                  disabled={simulationInProgress}
                  key={key}
                  onClick={() => {
                    setLatitude(prop.lat as number);
                    setLongitude(prop.lng as number);
                    setPropertyId(prop.id);
                    sessionStorage.setItem("propertyId", prop.id);
                    sessionStorage.setItem("propertyName", prop.name);
                    localStorage.setItem("propertyId", prop.id);
                    localStorage.setItem("propertyName", prop.name);
                    setPropertyName(prop.name);
                    setManualLat(prop.lat.toString());
                    setManualLng(prop.lng.toString());
                    setMessage(`Coordinates set to ${prop.name}.`);
                  }}
                  className={`${
                    propertyName === prop.name
                      ? "border-green-500 bg-white text-green-500 hover:text-white hover:bg-green-600 cursor-pointer"
                      : simulationInProgress
                      ? "cursor-not-allowed border-green-500 bg-green-500 text-white hover:text-white"
                      : "border-green-500 bg-green-500 text-white hover:text-white hover:bg-green-600 cursor-pointer"
                  } text-sm px-3 py-1 border border-solid rounded-md`}
                >
                  {prop.name}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Customize Coordinates Section */}
        {locationMode === "manual" && (
          <CollapsibleSection
            title="Manually Customize Coordinates"
            isOpen={customizeCoordsOpen}
            toggle={() => setCustomizeCoordsOpen(!customizeCoordsOpen)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">
                  Update Latitude
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:ring focus:outline-none disabled:bg-gray-100"
                    autoFocus={false}
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        const newLat = parseFloat(manualLat || "0") + 0.0001;
                        setManualLat(newLat.toFixed(6));
                        setLatitude(newLat);
                      }}
                      className="px-2 bg-green-500 text-white text-sm rounded-tr-md hover:bg-green-600 border border-green-500 disabled:border-gray-300  disabled:bg-gray-100 h-full"
                    >
                      <FaPlus className="text-white w-2 h-2 cursor-pointer" />
                    </button>
                    <button
                      onClick={() => {
                        const newLat = parseFloat(manualLat || "0") - 0.0001;
                        setManualLat(newLat.toFixed(6));
                        setLatitude(newLat);
                      }}
                      className="px-2 bg-red-500 text-white text-sm rounded-br-md hover:bg-red-600 border border-red-500 disabled:border-gray-300 disabled:bg-gray-100 h-full"
                    >
                      <FaMinus className="text-white w-2 h-2 cursor-pointer" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">
                  Update Longitude
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:ring focus:outline-none disabled:bg-gray-100"
                    autoFocus={false}
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        const newLng = parseFloat(manualLng || "0") + 0.0001;
                        setManualLng(newLng.toFixed(6));
                        setLongitude(newLng);
                      }}
                      className="cursor-pointer px-2 bg-green-500 text-white text-sm rounded-tr-md hover:bg-green-600 border border-green-500 disabled:border-gray-300  disabled:bg-gray-100 h-full"
                    >
                      <FaPlus className="text-white w-2 h-2" />
                    </button>
                    <button
                      onClick={() => {
                        const newLng = parseFloat(manualLng || "0") - 0.0001;
                        setManualLng(newLng.toFixed(6));
                        setLongitude(newLng);
                      }}
                      className="cursor-pointer px-2 bg-red-500 text-white text-sm rounded-br-md hover:bg-red-600 border border-red-500 disabled:border-gray-300 disabled:bg-gray-100 h-full"
                    >
                      <FaMinus className="text-white w-2 h-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdate}
              className={`cursor-pointer w-full px-4 py-2 rounded-md transition bg-blue-600 text-white hover:bg-blue-700 mt-1`}
            >
              Update Coordinates
            </button>
          </CollapsibleSection>
        )}

        {/* Coordinates Display */}
        <div className="text-gray-700 text-sm mb-1 flex justify-between">
          <p>
            <strong>Current Latitude:</strong>{" "}
            {latitude !== null ? latitude.toFixed(6) : "N/A"}
          </p>
          <p>
            <strong>Current Longitude:</strong>{" "}
            {longitude !== null ? longitude.toFixed(6) : "N/A"}
          </p>
        </div>

        {/* Message */}
        {message && (
          <p className={`text-green-600 text-sm mt-0 mb-2 mx-auto`}>
            {message}
          </p>
        )}

        {locationMode === "manual" && (
          <div className="flex justify-between mt-0">
            <div className="flex items-center gap-1 my-auto h-full">
              {/* Play Button */}
              <button
                type="button"
                onClick={() =>
                  handlePlay({
                    isPaused,
                    setIsPaused,
                    existingProps,
                    simulationState,
                    setSimulationState,
                    intervalRef,
                    setPlannedPath,
                    properties,
                    delay,
                  })
                }
                className={`${
                  !isPaused
                    ? "cursor-not-allowed border-gray-300 text-gray-500 bg-gray-100"
                    : "cursor-pointer bg-purple-500 text-white"
                } px-2 py-1 rounded-md border`}
                disabled={!isPaused}
              >
                <FaPlay className="inline-block" />
              </button>

              {/* Pause Button */}
              <button
                onClick={() =>
                  handlePause({
                    setIsPaused,
                    setSimulationInProgress,
                    intervalRef,
                  })
                }
                className={`${
                  !simulationInProgress || isPaused
                    ? "cursor-not-allowed border-gray-300 text-gray-500 bg-gray-100"
                    : "cursor-pointer bg-purple-500 text-white"
                } px-2 py-1 rounded-md border`}
                disabled={!simulationInProgress || isPaused}
              >
                <FaPause className="inline-block" />
              </button>

              {/* Stop Button */}
              {/* Fix functionality */}
              {/* <button
                className={`${
                  !simulationInProgress
                    ? "cursor-not-allowed border-gray-300 text-gray-500 bg-gray-100"
                    : "cursor-pointer bg-purple-500 text-white"
                } px-2 py-1 rounded-md border`}
                disabled={!simulationInProgress}
                onClick={() =>
                  handleStop({
                    setSimulationInProgress,
                    setMessage,
                    intervalRef,
                    setSimulatedPath,
                    setSimulationState,
                    setPlannedPath,
                    onComplete: () => {
                      setCurrentSimulationLabel(null);
                    },
                  })
                }
              >
                <FaStop className="inline-block" />
              </button> */}
            </div>
            {/* TODO: Finish functionality */}
            {/* <div className="flex items-center gap-1 my-auto h-full">
              <button
                onClick={() => setDelay((prev) => prev + 50)}
                className={`${
                  !simulationInProgress || isPaused
                    ? "cursor-not-allowed border-gray-300 text-gray-500 bg-gray-100"
                    : "cursor-pointer bg-purple-500 text-white"
                } px-2 py-2 rounded-md border`}
                disabled={!simulationInProgress || isPaused}
              >
                <BsFillRewindFill />
              </button>

              {(() => {
                const { bg, mph } = getSpeedInfo(delay);
                return (
                  <div
                    className={`px-4 py-2 rounded-md font-semibold text-sm ${bg} text-shadow-[.2px_.2px_.2px_#000]`}
                    title={`${delay}ms delay`}
                  >
                    {mph} mph
                  </div>
                );
              })()}

              <button
                onClick={() => setDelay((prev) => Math.max(prev - 50, 10))}
                className={`${
                  !simulationInProgress || isPaused
                    ? "cursor-not-allowed border-gray-300 text-gray-500 bg-gray-100"
                    : "cursor-pointer bg-purple-500 text-white"
                } px-2 py-2 rounded-md border`}
                disabled={!simulationInProgress || isPaused}
              >
                <BsFillFastForwardFill />
              </button>
            </div> */}
          </div>
        )}

        {/* Map */}
        <div id="map-container" className="mt-0" ref={mapRef}>
          {properties && (
            <GoogleMap
              onClick={(e) => {
                if (!selectionMode || !e.latLng) return;
                const coords = {
                  lat: e.latLng.lat() as number,
                  lng: e.latLng.lng() as number,
                };
                if (selectionMode === "A") {
                  setPointACoords(coords);
                  setMessage("Point A selected.");
                } else {
                  setPointBCoords(coords);
                  setMessage("Point B selected.");
                }
                setSelectionMode(null);
              }}
              mapContainerStyle={mapContainerStyle}
              zoom={16}
              center={{ lat: currentLat, lng: currentLng }}
            >
              <Marker
                position={{
                  lat: currentLat as number,
                  lng: currentLng as number,
                }}
                draggable={locationMode === "manual"}
                onDragEnd={handleMarkerDragEnd}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/bus.png",
                }}
              />

              {pointACoords && (
                <Marker
                  position={pointACoords}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  }}
                  label="A"
                />
              )}

              {pointBCoords && (
                <Marker
                  position={pointBCoords}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  }}
                  label="B"
                />
              )}

              {/* {simulatedPath.length > 0 && (
                <Polyline
                  path={simulatedPath}
                  options={{
                    strokeColor: "#FF5733",
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                    geodesic: true,
                  }}
                />
              )} */}

              {plannedPath.length > 0 && (
                <Polyline
                  path={plannedPath}
                  options={{
                    strokeColor: "#8888FF",
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    geodesic: true,
                    zIndex: 2,
                  }}
                />
              )}

              {Object.values(properties).map((prop) => (
                <Circle
                  key={prop.id}
                  center={{ lat: prop.lat as number, lng: prop.lng as number }}
                  radius={prop.radius}
                  options={{
                    strokeColor: "#00BFFF",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#00BFFF",
                    fillOpacity: 0.15,
                    clickable: false,
                    draggable: false,
                    editable: false,
                    visible: true,
                    zIndex: 1,
                  }}
                />
              ))}
            </GoogleMap>
          )}
          {eta && (
            <div className="text-sm text-green-600 mt-2 flex justify-end font-bold">
              <span className="font-medium">ETA: </span> {eta}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Location;
