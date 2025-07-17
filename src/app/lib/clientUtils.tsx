"use client";
import React, { useEffect } from "react";

export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.body.style.overflow = "auto";

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};

//////////////////////////////////////////////////////////////////////////////////////////////////

// Helper function to format date
export const formatDate = (dateTimeString: string | number | Date) => {
  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    return " ";
  }

  return `${
    date.getMonth() + 1
  }/${date.getDate()}/${date.getFullYear()} ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })}`;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export const formatHour = (hour: string) => {
  const date = new Date(hour);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export const formatDateTimePicker = (dateTime: string) => {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
  return formattedDate;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export const formatDatePicker = (dateTime: string) => {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export function formatPhoneNumber(value: string): string {
  const rawValue = value.replace(/\D/g, "");

  if (rawValue.length <= 3) {
    return rawValue;
  } else if (rawValue.length <= 6) {
    return `(${rawValue.slice(0, 3)}) ${rawValue.slice(3)}`;
  } else {
    return `(${rawValue.slice(0, 3)}) ${rawValue.slice(3, 6)}-${rawValue.slice(
      6,
      10
    )}`;
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////

export function isWithinRadius(
  lat1: number, // property latitude
  lon1: number, // property longitude
  lat2: number, // my manual or live latitude
  lon2: number, // my manual or live longitude
  radiusMeters: number // radius in meters
): boolean {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c <= radiusMeters;
}
//////////////////////////////////////////////////////////////////////////////////////////////////

export const interpolate = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

type LatLng = google.maps.LatLngLiteral;

type Property = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
};

type SimulationOptions = {
  route: LatLng[]; // Can be [A, B] or [A, B, C...]
  predefinedProperties?: Record<string, Property>; // Optional for future use
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  setManualLat: (lat: string) => void;
  setManualLng: (lng: string) => void;
  simulationInProgress: boolean;
  setSimulationInProgress: (val: boolean) => void;
  setMessage: (msg: string) => void;
  setSimulatedPath: React.Dispatch<
    React.SetStateAction<google.maps.LatLngLiteral[]>
  >;
  logLabel?: string; // Optional debug label
};

export const simulateDrive = ({
  route,
  // predefinedProperties,
  setLatitude,
  setLongitude,
  setManualLat,
  setManualLng,
  simulationInProgress,
  setSimulationInProgress,
  setMessage,
  setSimulatedPath, // ✅ Add here
}: // logLabel = "Custom",
SimulationOptions & {
  setSimulatedPath: React.Dispatch<
    React.SetStateAction<google.maps.LatLngLiteral[]>
  >;
}) => {
  if (simulationInProgress || route.length < 2) return;

  setSimulatedPath([]); // clear path before starting
  setSimulationInProgress(true);
  let currentSegment = 0;
  let currentStep = 0;
  const steps = 100;

  const simulateSegment = () => {
    if (currentSegment >= route.length - 1) {
      setSimulationInProgress(false);
      setMessage("Simulation completed.");
      return;
    }

    const start = route[currentSegment];
    const end = route[currentSegment + 1];

    const interval = setInterval(() => {
      const factor = currentStep / steps;
      const lat = interpolate(start.lat, end.lat, factor);
      const lng = interpolate(start.lng, end.lng, factor);

      const position = { lat, lng };
      setLatitude(lat);
      setLongitude(lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());
      setSimulatedPath((prev) => [...prev, position]); // ✅ Track path

      currentStep++;
      if (currentStep > steps) {
        clearInterval(interval);
        currentSegment++;
        currentStep = 0;
        simulateSegment(); // move to next
      }
    }, 100);
  };

  simulateSegment();
};

export const generateInterpolatedPath = (
  route: google.maps.LatLngLiteral[],
  steps = 100
): google.maps.LatLngLiteral[] => {
  const path: google.maps.LatLngLiteral[] = [];

  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];

    for (let step = 0; step <= steps; step++) {
      const factor = step / steps;
      path.push({
        lat: interpolate(start.lat, end.lat, factor),
        lng: interpolate(start.lng, end.lng, factor),
      });
    }
  }

  return path;
};
