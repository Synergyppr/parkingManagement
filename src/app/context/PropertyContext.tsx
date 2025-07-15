"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface PropertyContextType {
  propertyId: string | null;
  propertyName: string | null;
  latitude: number | null;
  longitude: number | null;
  setPropertyId: (id: string | null) => void;
  setPropertyName: (name: string | null) => void;
  setLatitude: (lat: number | null) => void;
  setLongitude: (lng: number | null) => void;
  locationMode: "live" | "manual";
  setLocationMode: (mode: "live" | "manual") => void;
  requestLocation: () => void;
}

const PropertyContext = createContext<PropertyContextType>({
  propertyId: null,
  propertyName: null,
  latitude: null,
  longitude: null,
  setPropertyId: () => {},
  setPropertyName: () => {},
  setLatitude: () => {},
  setLongitude: () => {},
  locationMode: "live",
  setLocationMode: () => {},
  requestLocation: () => {},
});

export const PropertyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationMode, setLocationMode] = useState<"live" | "manual">("live");

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error.message);
        }
      );
    }
  };

  useEffect(() => {
    const storedId =
      sessionStorage.getItem("propertyId") ||
      localStorage.getItem("propertyId");

    if (!storedId) {
      sessionStorage.removeItem("propertyName");
      localStorage.removeItem("propertyName");
    }

    const storedName =
      sessionStorage.getItem("propertyName") ||
      localStorage.getItem("propertyName");

    if (storedId) setPropertyId(storedId);
    if (storedName) setPropertyName(storedName);

    if (storedId && storedName) {
      setLocationMode("manual");
    } else {
      setLocationMode("live");
      sessionStorage.removeItem("propertyName");
      localStorage.removeItem("propertyName");
    }
  }, []);

  const handlePropertyId = (id: string | null) => {
    setPropertyId(id);
    if (id) {
      localStorage.setItem("propertyId", id);
      sessionStorage.setItem("propertyId", id);
    } else {
      localStorage.removeItem("propertyId");
      sessionStorage.removeItem("propertyId");
    }
  };

  const handlePropertyName = (name: string | null) => {
    setPropertyName(name);
    if (name) {
      localStorage.setItem("propertyName", name);
      sessionStorage.setItem("propertyName", name);
    } else {
      localStorage.removeItem("propertyName");
      sessionStorage.removeItem("propertyName");
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        propertyId,
        propertyName,
        latitude,
        longitude,
        setPropertyId: handlePropertyId,
        setPropertyName: handlePropertyName,
        setLatitude,
        setLongitude,
        locationMode,
        setLocationMode,
        requestLocation,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => useContext(PropertyContext);
