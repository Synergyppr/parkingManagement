// app/context/PropertyContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type PropertyContextType = {
  propertyId: string | null;
  setPropertyId: (id: string | null) => void;
  latitude: number | null;
  longitude: number | null;
  setLatitude: (lat: number | null) => void;
  setLongitude: (lng: number | null) => void;
};

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export const PropertyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [propertyId, setPropertyIdState] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // const tempPropertyId = "a7e348d3-8dfb-4f71-8bc5-042ba75d53c7";

  useEffect(() => {
    const storedId =
      sessionStorage.getItem("propertyId") ||
      localStorage.getItem("propertyId");
    if (storedId) {
      setPropertyIdState(storedId);
    }
  }, [propertyId]);

  const setPropertyId = (id: string | null) => {
    setPropertyIdState(id);
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
        setPropertyId,
        latitude,
        longitude,
        setLatitude,
        setLongitude,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = (): PropertyContextType => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
};
