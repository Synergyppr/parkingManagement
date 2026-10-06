import Swal from "sweetalert2";
import { leaveGroup } from "../lib/SignalRProvider";

interface ManualPropertyOption {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const promptManualPropertySelection = async ({
  predefinedProperties,
  setLocationMode,
  setPropertyId,
  setPropertyName,
  setLatitude,
  setLongitude,
  confirmButtonColor,
}: {
  predefinedProperties: Record<string, ManualPropertyOption> | ManualPropertyOption[];
  setLocationMode: (mode: "live" | "manual") => void;
  setPropertyId: (id: string) => void;
  setPropertyName: (name: string) => void;
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  confirmButtonColor?: string;
}): Promise<boolean> => {
  const properties: ManualPropertyOption[] = Array.isArray(predefinedProperties)
    ? predefinedProperties
    : Object.values(predefinedProperties);

  if (properties.length === 0) {
    await Swal.fire({
      icon: "warning",
      title: "No Properties Available",
      text: "No properties found. Please log in first.",
      confirmButtonColor: confirmButtonColor || "#d6a800",
    });
    return false;
  }

  const inputOptions: Record<string, string> = {};
  for (const prop of properties) {
    inputOptions[prop.id] = prop.name;
  }

  const result = await Swal.fire({
    title: "Select Property",
    text: "Choose a property to simulate your location:",
    input: "select",
    inputOptions,
    inputPlaceholder: "Select a property",
    showCancelButton: true,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
    confirmButtonColor: confirmButtonColor || "#d6a800",
    inputValidator: (value) => {
      if (!value) return "You must select a property";
      return null;
    },
  });

  if (!result.isConfirmed || !result.value) return false;

  const selected = properties.find((p) => p.id === result.value);
  if (!selected) return false;

  setPropertyId(selected.id);
  setPropertyName(selected.name);
  setLatitude(selected.lat);
  setLongitude(selected.lng);
  localStorage.setItem("manualLatitude", String(selected.lat));
  localStorage.setItem("manualLongitude", String(selected.lng));
  setLocationMode("manual");

  await Swal.fire({
    icon: "success",
    title: "Manual Mode Activated",
    text: `Simulating location at ${selected.name}.`,
    confirmButtonColor: confirmButtonColor || "#d6a800",
  });

  return true;
};

export const handleLogout = ({
  propertyId,
  setPropertyId,
  setPropertyName,
  setAccountUser,
  router,
}: {
  propertyId: string | null;
  setPropertyId: (id: string | null) => void;
  setPropertyName: (id: string | null) => void;
  setAccountUser: (id: string | null) => void;
  router: { replace: (path: string) => void };
}) => {
  Swal.fire({
    title: "Log Out",
    text: "Are you sure you want to log out?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      if (propertyId) await leaveGroup(propertyId);
      localStorage.clear();
      sessionStorage.clear();
      setPropertyId("");
      setPropertyName("");
      setAccountUser("");
      router.replace("/");
    }
  });
};
