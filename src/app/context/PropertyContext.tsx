// PropertyContext.tsx

"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

interface Property {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  primaryColor: string;
  secondaryColor: string;
}

interface PropertyContextType {
  tenantId: string;
  propertyId: string;
  propertyName: string;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  isActive: boolean;
  predefinedProperties: Record<string, Property>;
  primaryColor: string;
  setPrimaryColor: Dispatch<SetStateAction<string>>;
  secondaryColor: string;
  setSecondaryColor: Dispatch<SetStateAction<string>>;
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
  userRole?: string | null;
  setUserRole: (role: string | null) => void;
}

const PropertyContext = createContext<PropertyContextType>({
  tenantId: "",
  propertyId: "",
  propertyName: "",
  latitude: null,
  longitude: null,
  radius: 0,
  isActive: true,
  predefinedProperties: {},
  primaryColor: "",
  setPrimaryColor: () => {},
  secondaryColor: "",
  setSecondaryColor: () => {},
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
  userRole: undefined,
  setUserRole: () => {},
});

export const PropertyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const PAULSON_TENANT_ID = "907b5b8a-3e2b-4b5f-bbb3-9f5f99fb5c37";

  const [tenantId] = useState(PAULSON_TENANT_ID);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, ] = useState<number | null>(null);
  const [isActive, ] = useState(true);
  const [locationMode, setLocationMode] = useState<"live" | "manual">("live");
  const [predefinedProperties, setPredefinedProperties] = useState<
    Record<string, Property>
  >({});
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [isOutOfArea, setIsOutOfArea] = useState<boolean>(false);
  const [accountUser, setAccountUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleSetPredefinedProperties = (properties: Property[]) => {
    const record = properties?.reduce((acc, prop) => {
      acc[prop.id] = {
        id: prop.id,
        name: prop.name,
        lat: prop.lat,
        lng: prop.lng,
        radius: prop.radius,
        primaryColor: prop.primaryColor,
        secondaryColor: prop.secondaryColor
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
    const storedRole =
      sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
    if (storedRole) setUserRole(storedRole);
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
    // console.log("[GEO-DEBUG] requestLocation called");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // console.log("[GEO-DEBUG] Browser position received:", {
          //   latitude: position.coords.latitude,
          //   longitude: position.coords.longitude,
          //   accuracy: position.coords.accuracy,
          // });
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("[GEO-DEBUG] Geolocation error:", error.code, error.message);
        }
      );
    } else {
      console.error("[GEO-DEBUG] navigator.geolocation NOT available");
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
        tenantId: tenantId ?? "",
        propertyId: propertyId ?? "",
        propertyName: propertyName ?? "",
        latitude,
        longitude,
        radius,
        isActive,
        predefinedProperties,
        primaryColor,
        setPrimaryColor,
        secondaryColor,
        setSecondaryColor,
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
        userRole,
        setUserRole,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => useContext(PropertyContext);
