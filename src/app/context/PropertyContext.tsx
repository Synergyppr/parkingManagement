// PropertyContext.tsx

"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface Property {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

interface PropertyContextType {
  propertyId: string;
  propertyName: string;
  latitude: number | null;
  longitude: number | null;
  predefinedProperties: Record<string, Property>;
  isOutOfArea: boolean;
  setPropertyId: (id: string | null) => void;
  setPropertyName: (name: string | null) => void;
  setLatitude: (lat: number | null) => void;
  setLongitude: (lng: number | null) => void;
  setPredefinedProperties: (properties: Property[]) => void;
  setIsOutOfArea: (value: boolean) => void;
  locationMode: "live" | "manual";
  setLocationMode: (mode: "live" | "manual") => void;
  requestLocation: () => void;
  accountUser?: string | null;
  setAccountUser: (user: string | null) => void;
}

const PropertyContext = createContext<PropertyContextType>({
  propertyId: "",
  propertyName: "",
  latitude: null,
  longitude: null,
  predefinedProperties: {},
  isOutOfArea: false,
  setPropertyId: () => {},
  setPropertyName: () => {},
  setLatitude: () => {},
  setLongitude: () => {},
  setPredefinedProperties: () => {},
  setIsOutOfArea: () => {},
  locationMode: "live",
  setLocationMode: () => {},
  requestLocation: () => {},
  accountUser: undefined,
  setAccountUser: () => {},
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
  const [predefinedProperties, setPredefinedProperties] = useState<
    Record<string, Property>
  >({});
  const [isOutOfArea, setIsOutOfArea] = useState<boolean>(false);
  const [accountUser, setAccountUser] = useState<string | null>(null);

  const handleSetPredefinedProperties = (properties: Property[]) => {
    const record = properties?.reduce((acc, prop) => {
      acc[prop.id] = {
        id: prop.id,
        name: prop.name,
        lat: prop.lat,
        lng: prop.lng,
        radius: prop.radius,
      };
      return acc;
    }, {} as Record<string, Property>);
    setPredefinedProperties(record);
  };

  useEffect(() => {
    const storedId =
      sessionStorage.getItem("propertyId") ||
      localStorage.getItem("propertyId");
    const storedName =
      sessionStorage.getItem("propertyName") ||
      localStorage.getItem("propertyName");
    const storedProperties = localStorage.getItem("properties");
    const storedUser =
      sessionStorage.getItem("accountUser") ||
      localStorage.getItem("accountUser");
    if (storedUser) setAccountUser(storedUser);
    if (storedId) setPropertyId(storedId);
    if (storedName) setPropertyName(storedName);

    if (storedProperties) {
      try {
        const rawArray = JSON.parse(storedProperties);
        setPredefinedProperties(rawArray);
      } catch (error) {
        console.error("Error parsing stored properties:", error);
      }
    }
  }, []);

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

  const handleSetIsOutOfArea = (value: boolean) => {
    setIsOutOfArea(value);
    // if (value) {
    //   localStorage.removeItem("propertyId");
    //   sessionStorage.removeItem("propertyId");
    //   setPropertyId(null);
    //   setPropertyName(null);
    // }
  };

  return (
    <PropertyContext.Provider
      value={{
        propertyId: propertyId ?? "",
        propertyName: propertyName ?? "",
        latitude,
        longitude,
        predefinedProperties,
        isOutOfArea,
        setPropertyId: handlePropertyId,
        setPropertyName: handlePropertyName,
        setLatitude,
        setLongitude,
        setPredefinedProperties: handleSetPredefinedProperties,
        setIsOutOfArea: handleSetIsOutOfArea,
        locationMode,
        setLocationMode,
        requestLocation,
        accountUser,
        setAccountUser,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => useContext(PropertyContext);
