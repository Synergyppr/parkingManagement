"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useProperty } from "../context/PropertyContext";
import {
  GoogleMap,
  Marker,
  Circle,
  useLoadScript,
} from "@react-google-maps/api";
import { GoDotFill } from "react-icons/go";
import { FaMinus, FaPlus } from "react-icons/fa";
// import ToggleButton from "./elements/ToggleButton";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const centerDefault = {
  lat: 18.426434,
  lng: -66.059545,
};

const predefinedProperties = {
  plaza250: {
    // logo: "/250.jpeg",
    name: "250",
    lat: 18.426434,
    lng: -66.059545,
    id: "a7e348d3-8dfb-4f71-8bc5-042ba75d53c7",
    radius: 100,
  },
  plaza270: {
    // logo: "/270.png",
    name: "270",
    lat: 18.423993,
    lng: -66.058527,
    id: "b2aa6b8f-29b2-4fc3-a040-09af828d1a8d",
    radius: 100,
  },
  coc: {
    // logo: "/coc.png",
    name: "Condado Ocean Club",
    lat: 18.459366,
    lng: -66.07728,
    id: "5acdd1ec-392d-4d28-80e6-8adbd08e09cd",
    radius: 65,
  },
  cvh: {
    // logo: "/cvh.png",
    name: "Condado Vanderbilt",
    lat: 18.458770636752906,
    lng: -66.0760822589064,
    id: "f82ce385-c8e4-4c09-8b08-b01bf9676dc7",
    radius: 65,
  },
  laConcha: {
    // logo: "/laconcha.png",
    name: "La Concha Resort",
    lat: 18.457303,
    lng: -66.073427,
    id: "d3f5afa9-73c4-4bfa-8309-02ab93165f46",
    radius: 100,
  },
};

const Location = () => {
  const {
    latitude,
    longitude,
    setLatitude,
    setLongitude,
    // propertyId,
    propertyName,
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

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    if (latitude !== null) setManualLat(latitude.toString());
    if (longitude !== null) setManualLng(longitude.toString());
  }, [latitude, longitude]);

  const handleUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setMessage("Please enter valid numbers for latitude and longitude.");
      return;
    }

    setLatitude(lat);
    setLongitude(lng);
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

        let foundProperty = null;

        for (const prop of Object.values(predefinedProperties)) {
          const R = 6371e3; // meters
          const dLat = (prop.lat - lat) * (Math.PI / 180);
          const dLng = (prop.lng - lng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat * (Math.PI / 180)) *
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
      }
    },
    [
      setLatitude,
      setLongitude,
      setManualLat,
      setManualLng,
      setPropertyId,
      setPropertyName,
    ]
  );

  const interpolate = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const simulateDriveFrom250To270 = () => {
    if (simulationInProgress) return;
    setSimulationInProgress(true);

    const start = predefinedProperties.plaza250;
    const end = predefinedProperties.plaza270;

    const steps = 100;
    let currentStep = 0;

    let previousPropertyId: string | null = start.id; // Start inside plaza250

    setMessage(`Starting simulation from ${start.name} to ${end.name}.`);

    const interval = setInterval(() => {
      const factor = currentStep / steps;
      const lat = interpolate(start.lat, end.lat, factor);
      const lng = interpolate(start.lng, end.lng, factor);

      setLatitude(lat);
      setLongitude(lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());

      let newPropertyId: string | null = null;
      let newProperty: typeof start | null = null;

      for (const prop of Object.values(predefinedProperties)) {
        const R = 6371e3;
        const dLat = (prop.lat - lat) * (Math.PI / 180);
        const dLng = (prop.lng - lng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(lat * (Math.PI / 180)) *
            Math.cos(prop.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= prop.radius) {
          newPropertyId = prop.id;
          newProperty = prop;
          break;
        }
      }

      if (newPropertyId !== previousPropertyId) {
        if (previousPropertyId && !newPropertyId) {
          setMessage("You left the property.");
        } else if (!previousPropertyId && newProperty) {
          setMessage(`You entered ${newProperty.name}.`);
        } else if (newProperty) {
          setMessage(`You moved from ${propertyName} to ${newProperty.name}.`);
        }

        previousPropertyId = newPropertyId;
      }

      if (newProperty) {
        setPropertyId(newProperty.id);
        setPropertyName(newProperty.name);
      } else {
        setPropertyId("");
        setPropertyName("");
      }

      currentStep++;
      if (currentStep > steps) {
        clearInterval(interval);
        setSimulationInProgress(false);
      }
    }, 100);
  };

  const simulateDriveFromCocToLaConcha = () => {
    if (simulationInProgress) return;
    setSimulationInProgress(true);

    const route = [
      predefinedProperties.coc,
      predefinedProperties.cvh,
      predefinedProperties.laConcha,
    ];

    const steps = 100;
    let currentSegment = 0;
    let currentStep = 0;
    let previousPropertyId: string | null = route[0].id;

    setMessage(`Starting simulation from ${route[0].id}.`);

    const moveAlongRoute = () => {
      if (currentSegment >= route.length - 1) return;

      const start = route[currentSegment];
      const end = route[currentSegment + 1];

      const interval = setInterval(() => {
        const factor = currentStep / steps;
        const lat = interpolate(start.lat, end.lat, factor);
        const lng = interpolate(start.lng, end.lng, factor);

        setLatitude(lat);
        setLongitude(lng);
        setManualLat(lat.toString());
        setManualLng(lng.toString());

        let newPropertyId: string | null = null;
        let newProperty: typeof start | null = null;

        for (const prop of Object.values(predefinedProperties)) {
          const R = 6371e3;
          const dLat = (prop.lat - lat) * (Math.PI / 180);
          const dLng = (prop.lng - lng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat * (Math.PI / 180)) *
              Math.cos(prop.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance <= prop.radius) {
            newPropertyId = prop.id;
            newProperty = prop;
            break;
          }
        }

        if (newPropertyId !== previousPropertyId) {
          if (previousPropertyId && !newPropertyId) {
            setMessage("You left the property.");
          } else if (!previousPropertyId && newProperty) {
            setMessage(`You entered ${newProperty.name}.`);
          } else if (newProperty) {
            setMessage(
              `You moved from ${propertyName} to ${newProperty.name}.`
            );
          }

          previousPropertyId = newPropertyId;
        }

        if (newProperty) {
          setPropertyId(newProperty.id);
          setPropertyName(newProperty.name);
        } else {
          setPropertyId("");
          setPropertyName("Outside Range");
        }

        currentStep++;
        if (currentStep > steps) {
          clearInterval(interval);
          currentSegment++;
          currentStep = 0;
          moveAlongRoute(); // Move to next segment
          setSimulationInProgress(false);
        }
      }, 100);
    };

    moveAlongRoute();
  };

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  const currentLat = latitude ?? centerDefault.lat;
  const currentLng = longitude ?? centerDefault.lng;

  return (
    <div className="flex flex-col items-center min-w-full lg:min-w-[400px]">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl space-y-4">
        <div className="mb-4 mx-auto flex justify-between">
          <button
            onClick={() => {
              const newMode = locationMode === "live" ? "manual" : "live";
              setLocationMode(newMode);
              setMessage("Location mode switched to " + newMode);

              if (newMode === "live") {
                requestLocation();
              }
            }}
            className="text-lg px-3 py-1 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600"
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

        {locationMode === "manual" && (
          <div className="flex gap-2">
            <button
              onClick={simulateDriveFrom250To270}
              disabled={simulationInProgress}
              className={`text-sm px-3 py-1.5 rounded-md cursor-pointer transition ${
                simulationInProgress
                  ? "bg-gray-300 text-white cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              Simulate Drive: 250 → 270
            </button>
            <button
              onClick={simulateDriveFromCocToLaConcha}
              disabled={simulationInProgress}
              className={`text-sm px-3 py-1.5 rounded-md cursor-pointer transition ${
                simulationInProgress
                  ? "bg-gray-300 text-white cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              Simulate Drive: COC → CVH → La Concha
            </button>
          </div>
        )}

        {locationMode === "manual" && (
          <div className="flex flex-wrap justify-start gap-2 my-4">
            {Object.entries(predefinedProperties).map(([key, prop]) => (
              <button
                key={key}
                onClick={() => {
                  setLatitude(prop.lat);
                  setLongitude(prop.lng);
                  setPropertyId(prop.id);
                  setPropertyName(prop.name);
                  setManualLat(prop.lat.toString());
                  setManualLng(prop.lng.toString());
                  setMessage(`Coordinates set to ${prop.name}.`);
                }}
                className={`${
                  propertyName === prop.name
                    ? "border-green-500 bg-white text-green-500 hover:text-white"
                    : "border-green-500 bg-green-500 text-white hover:text-white"
                } text-sm px-3 py-1 border-1 border-solid rounded-md cursor-pointer hover:bg-green-600`}
              >
                {prop.name}
              </button>
            ))}
          </div>
        )}

        <div className="text-gray-700 text-sm">
          <p>
            <strong>Current Latitude:</strong>{" "}
            {latitude !== null ? latitude.toFixed(6) : "N/A"}
          </p>
          <p>
            <strong>Current Longitude:</strong>{" "}
            {longitude !== null ? longitude.toFixed(6) : "N/A"}
          </p>
        </div>

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
                disabled={locationMode === "live"}
                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:ring focus:outline-none disabled:bg-gray-100"
              />
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    const newLat = parseFloat(manualLat || "0") + 0.0001;
                    setManualLat(newLat.toFixed(6));
                    setLatitude(newLat);
                  }}
                  disabled={locationMode === "live"}
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
                  disabled={locationMode === "live"}
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
                disabled={locationMode === "live"}
                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:ring focus:outline-none disabled:bg-gray-100"
              />
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    const newLng = parseFloat(manualLng || "0") + 0.0001;
                    setManualLng(newLng.toFixed(6));
                    setLongitude(newLng);
                  }}
                  disabled={locationMode === "live"}
                  className="px-2 bg-green-500 text-white text-sm rounded-tr-md hover:bg-green-600 border border-green-500 disabled:border-gray-300  disabled:bg-gray-100 h-full"
                >
                  <FaPlus className="text-white w-2 h-2 cursor-pointer" />
                </button>
                <button
                  onClick={() => {
                    const newLng = parseFloat(manualLng || "0") - 0.0001;
                    setManualLng(newLng.toFixed(6));
                    setLongitude(newLng);
                  }}
                  disabled={locationMode === "live"}
                  className="px-2 bg-red-500 text-white text-sm rounded-br-md hover:bg-red-600 border border-red-500 disabled:border-gray-300 disabled:bg-gray-100 h-full"
                >
                  <FaMinus className="text-white w-2 h-2 cursor-pointer" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={locationMode === "live"}
          className={`w-full px-4 py-2 rounded-md transition ${
            locationMode === "live"
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Update Coordinates
        </button>

        {message && <p className="text-green-600 text-sm mt-0">{message}</p>}

        <div className="mt-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={16}
            center={{ lat: currentLat, lng: currentLng }}
          >
            <Marker
              position={{ lat: currentLat, lng: currentLng }}
              draggable={locationMode === "manual"}
              onDragEnd={handleMarkerDragEnd}
            />

            {/* Radius circles for each property */}
            {Object.values(predefinedProperties).map((prop) => (
              <Circle
                key={prop.id}
                center={{ lat: prop.lat, lng: prop.lng }}
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
        </div>
      </div>
    </div>
  );
};

export default Location;
