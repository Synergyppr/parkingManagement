"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useProperty } from "../context/PropertyContext";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const centerDefault = {
  lat: 18.426434, // default center (example)
  lng: -66.059545,
};

const Location = () => {
  const { latitude, longitude, setLatitude, setLongitude } = useProperty();
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDnd3pkF4_6xKwB7jv-3hbkupg0cAiFqDc", // Add key in .env.local
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

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setLatitude(lat);
      setLongitude(lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  const currentLat = latitude ?? centerDefault.lat;
  const currentLng = longitude ?? centerDefault.lng;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Location Page
      </h1>

      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl space-y-4">
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

        {/* Manual Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800">
          <div>
            <label className="block text-gray-600 text-sm font-medium">
              Update Latitude
            </label>
            <input
              type="text"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium">
              Update Longitude
            </label>
            <input
              type="text"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Update Coordinates
        </button>

        {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

        {/* Google Map */}
        <div className="mt-6">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={{ lat: currentLat, lng: currentLng }}
          >
            <Marker
              position={{ lat: currentLat, lng: currentLng }}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          </GoogleMap>
        </div>
      </div>
    </div>
  );
};

export default Location;
