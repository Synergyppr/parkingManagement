// context/PropertyContext.tsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface PropertyContextType {
  propertyId: string | null;
  latitude: number | null;
  longitude: number | null;
  setPropertyId: (id: string | null) => void;
}

const PropertyContext = createContext<PropertyContextType>({
  propertyId: null,
  latitude: null,
  longitude: null,
  setPropertyId: () => {},
});

export const PropertyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
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
    } else {
      console.warn("Geolocation not supported by browser.");
    }
  }, []);

  useEffect(() => {
    const storedId =
      sessionStorage.getItem("propertyId") ||
      localStorage.getItem("propertyId");
    if (storedId) {
      setPropertyId(storedId);
    }
  }, [propertyId]);

  const handlePropertyId = (id: string | null) => {
    setPropertyId(id);
    if (id) {
      localStorage.setItem("propertyId", propertyId as string);
    } else {
      localStorage.removeItem("propertyId");
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        propertyId,
        latitude,
        longitude,
        setPropertyId: handlePropertyId,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => useContext(PropertyContext);
