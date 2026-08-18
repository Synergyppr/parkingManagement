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
  const day = String(date.getDate() + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export function formatDateOfBirth(dateString: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // fallback if invalid

  // Add 1 day (in milliseconds)
  date.setDate(date.getDate() + 1);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////////

export function formatPhoneNumber(value: string): string {
  const rawValue = value.replace(/\D/g, "");

  if (!rawValue) return "";

  // Separate area code (everything before last 10 digits) and phone number
  const areaCode =
    rawValue.length > 10 ? rawValue.slice(0, rawValue.length - 10) : "";
  const phoneNumber = rawValue.slice(-10);

  let formatted = "";

  if (phoneNumber.length <= 3) {
    formatted = phoneNumber;
  } else if (phoneNumber.length <= 6) {
    formatted = `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    formatted = `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6)}`;
  }

  return areaCode ? `+${areaCode} ${formatted}` : formatted;
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

// Parses "1A-3" → "1A" (strips the rate value suffix for display)
export const parseLocationName = (
  placeToVisit: string | null | undefined
): string => {
  if (!placeToVisit) return "";
  const match = placeToVisit.match(/^(.+)-(\d+(?:\.\d+)?)$/);
  return match ? match[1] : placeToVisit;
};

// Parses "1A-3" → 3 (extracts the rate value for checkout pre-selection)
export const parseLocationValue = (
  placeToVisit: string | null | undefined
): number | null => {
  if (!placeToVisit) return null;
  const match = placeToVisit.match(/^(.+)-(\d+(?:\.\d+)?)$/);
  return match ? Number(match[2]) : null;
};

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
  onComplete?: () => void;
  logLabel?: string; // Optional debug label
};

type HandlePlayProps = {
  isPaused: boolean;
  setIsPaused: (value: boolean) => void;
  existingProps: SimulationOptions;
  simulationState: {
    route: google.maps.LatLngLiteral[];
    currentSegment: number;
    currentStep: number;
  };
  setSimulationState: React.Dispatch<
    React.SetStateAction<{
      route: google.maps.LatLngLiteral[];
      currentSegment: number;
      currentStep: number;
    }>
  >;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setPlannedPath: (path: google.maps.LatLngLiteral[]) => void;
  properties: Record<string, Property>;
  delay: number;
};

export const handlePlay = ({
  isPaused,
  setIsPaused,
  existingProps,
  simulationState,
  setSimulationState,
  intervalRef,
  setPlannedPath,
  properties,
  delay,
}: HandlePlayProps) => {
  if (isPaused) {
    setIsPaused(false);
    simulateDrive({
      ...existingProps,
      route: simulationState.route,
      currentSegment: simulationState.currentSegment,
      currentStep: simulationState.currentStep,
      setSimulationState,
      intervalRef,
      delay,
    });
  } else {
    const route = [properties?.plaza250, properties?.plaza270];
    setPlannedPath(generateInterpolatedPath(route));
    setSimulationState({ route, currentSegment: 0, currentStep: 0 });
    simulateDrive({
      ...existingProps,
      route,
      currentSegment: 0,
      currentStep: 0,
      setSimulationState,
      intervalRef,
      delay,
    });
  }
};

export const handlePause = ({
  setIsPaused,
  setSimulationInProgress,
  intervalRef,
}: {
  setIsPaused: (value: boolean) => void;
  setSimulationInProgress: (value: boolean) => void;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}) => {
  setIsPaused(true);
  setSimulationInProgress(false);
  if (intervalRef.current) clearInterval(intervalRef.current);
};

export const simulateDrive = ({
  route,
  setLatitude,
  setLongitude,
  setManualLat,
  setManualLng,
  simulationInProgress,
  setSimulationInProgress,
  setMessage,
  setSimulatedPath,
  onComplete,
  setSimulationState,
  intervalRef,
  currentSegment,
  currentStep,
  delay,
  setEta, // ✅ New
}: SimulationOptions & {
  setSimulatedPath: React.Dispatch<React.SetStateAction<LatLng[]>>;
  setSimulationState: React.Dispatch<
    React.SetStateAction<{
      route: LatLng[];
      currentSegment: number;
      currentStep: number;
    }>
  >;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  currentSegment: number;
  currentStep: number;
  delay: number;
  setEta?: (eta: string | null) => void; // ✅ Optional ETA setter
}) => {
  if (simulationInProgress || route.length < 2) return;

  const steps = 100;
  setSimulatedPath([]);
  setSimulationInProgress(true);
  setMessage("Simulation started");

  const calculateETA = (segIndex: number, stepIndex: number): string => {
    const segmentsRemaining = route.length - 1 - segIndex;
    const stepsRemaining = segmentsRemaining * steps + (steps - stepIndex);
    const totalMs = stepsRemaining * delay;

    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);

    const formula = `${minutes > 0 ? `${minutes}m ` : ""}${seconds - 7}s`;

    return formula;
  };

  const simulateSegment = (segmentIndex: number, stepIndex: number) => {
    if (segmentIndex >= route.length - 1) {
      setSimulationInProgress(false);
      setMessage("Simulation completed.");
      setEta?.(null); // ✅ Clear ETA
      if (onComplete) onComplete();
      return;
    }

    const start = route[segmentIndex];
    const end = route[segmentIndex + 1];

    intervalRef.current = setInterval(() => {
      const factor = stepIndex / steps;
      const lat = interpolate(start.lat, end.lat, factor);
      const lng = interpolate(start.lng, end.lng, factor);

      const position = { lat, lng };
      setLatitude(lat);
      setLongitude(lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());
      setSimulatedPath((prev) => [...prev, position]);

      // ✅ Update ETA each step
      setEta?.(calculateETA(segmentIndex, stepIndex));

      stepIndex++;
      if (stepIndex > steps) {
        clearInterval(intervalRef.current!);
        simulateSegment(segmentIndex + 1, 0);
      } else {
        setSimulationState({
          route,
          currentSegment: segmentIndex,
          currentStep: stepIndex,
        });
      }
    }, delay);
  };

  simulateSegment(currentSegment, currentStep);
};

export const handleStop = ({
  setSimulationInProgress,
  setMessage,
  intervalRef,
  setSimulatedPath,
  setSimulationState,
  setPlannedPath,
  onComplete,
}: {
  setSimulationInProgress: (value: boolean) => void;
  setMessage: (msg: string) => void;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setSimulatedPath: React.Dispatch<React.SetStateAction<LatLng[]>>;
  setPlannedPath: (path: LatLng[]) => void;
  setSimulationState: React.Dispatch<
    React.SetStateAction<{
      route: LatLng[];
      currentSegment: number;
      currentStep: number;
    }>
  >;
  onComplete?: () => void;
}) => {
  setSimulationInProgress(false);
  setMessage("Simulation stopped.");
  setSimulatedPath([]);
  setPlannedPath([]);
  setSimulationState({ route: [], currentSegment: 0, currentStep: 0 });
  if (intervalRef.current) clearInterval(intervalRef.current);
  if (onComplete) onComplete();
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
