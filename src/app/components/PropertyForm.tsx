// ModalPropertyForm.tsx
"use client";
import { useState, useMemo } from "react";
import { FaBuilding } from "react-icons/fa6";
import ModalInput from "./elements/ModalInput";
import { useProperty } from "../context/PropertyContext";
import Swal from "sweetalert2";

interface Property {
  id?: string;
  tenantId?: string;
  tenant?: string;
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
  address: string;
  createdAtDateTime: string;
  isActive: boolean;
}

interface PropertyFormProps {
  tenantId?: string;
  originalData?: Property | null;
  data?: Property | null;
  onSuccess?: () => void;
  setModalOpen: (isOpen: boolean) => void;
}

export default function ModalPropertyForm({
  tenantId,
  originalData,
  data,
  onSuccess,
  setModalOpen,
}: PropertyFormProps) {
  const { latitude, longitude } = useProperty();
  const [loading, setLoading] = useState(false);
  const originalForm = {
    tenantId: tenantId,
    name: "",
    address: "",
    latitude: latitude || 0,
    longitude: longitude || 0,
    radius: originalData?.radius || 0,
    createdAtDateTime:
      originalData?.createdAtDateTime || new Date().toISOString(),
    isActive: true,
    ...originalData,
  };
  const [form, setForm] = useState<Property>({
    tenantId: tenantId,
    name: "",
    address: "",
    latitude: latitude || 0,
    longitude: longitude || 0,
    radius: data?.radius || 0,
    createdAtDateTime: data?.createdAtDateTime || new Date().toISOString(),
    isActive: true,
    ...data,
  });

  // Compare form with originalForm
  const hasChanges = useMemo(() => {
    if (!originalForm) return true; // new user, always allow submit
    return JSON.stringify(originalForm) !== JSON.stringify(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form?.name || !form?.address) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    const method = "POST";
    const endpoint = "/api/properties/createAndUpdate";

    let payload;

    if (form?.id) {
      payload = {
        id: form?.id,
        tenantId: tenantId || form?.tenantId,
        name: form?.name,
        address: form?.address,
        latitude: Number(form?.latitude) || 0,
        longitude: Number(form?.longitude) || 0,
        radiusMeters: Number(form?.radius) || 0,
        isActive: form?.isActive,
      };
    } else {
      payload = {
        ...form,
        tenantId: tenantId || form?.tenantId,
        isActive: form?.isActive,
        latitude: Number(form?.latitude) || 0,
        longitude: Number(form?.longitude) || 0,
        radiusMeters: Number(form?.radius) || 0,
      };
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result?.result?.status === "200") {
      setModalOpen(false);
      Swal.fire({
        icon: "success",
        title: `Property ${form?.id ? "updated" : "created"} successfully!`,
        showConfirmButton: false,
        timer: 1500,
      });
      onSuccess?.();
    } else {
      const error = await res.text();
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error || "Something went wrong.",
      });
    }
  };

  const toggleIsActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev?.isActive }));
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 rounded shadow text-gray-800 flex flex-col">
      <div className="flex gap-2 text-blue-500 items-center mb-6">
        <FaBuilding className="w-5 h-5" />
        <h2 className="text-xl font-semibold tracking-tight relative top-[2px]">
          {form?.id ? "Update Property" : "Create Property"}
        </h2>
      </div>

      <ModalInput
        id="name"
        name="name"
        label="Property Name"
        value={form?.name}
        onChange={handleChange}
      />

      <ModalInput
        id="address"
        name="address"
        label="Address"
        value={form?.address}
        onChange={handleChange}
      />

      <ModalInput
        id="latitude"
        name="latitude"
        label="Latitude"
        value={String(form?.latitude)}
        onChange={handleChange}
      />

      <ModalInput
        id="longitude"
        name="longitude"
        label="Longitude"
        value={String(form?.longitude)}
        onChange={handleChange}
      />

      <ModalInput
        id="radius"
        name="radius"
        label="Radius (meters)"
        value={String(form?.radius)}
        onChange={handleChange}
      />

      {form?.id && (
        <div className="w-full pt-0 relative flex gap-2">
          <div>
            <div
              className="relative flex items-center justify-between w-14 h-8 cursor-pointer"
              onClick={toggleIsActive}
            >
              <div
                className={`absolute w-full h-full rounded-full transition-all duration-300 ${
                  form?.isActive ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  form?.isActive ? "translate-x-[28px]" : "translate-x-[5px]"
                }`}
              />
            </div>
          </div>
          <div className="tracking-tight text-sm text-gray-200 relative top-2">
            {form?.isActive ? "Active" : "Inactive"}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={loading || !hasChanges}
        onClick={handleSubmit}
        className={`${
          loading || !hasChanges
            ? "cursor-not-allowed bg-opacity-60 opacity-60"
            : "hover:bg-blue-700 cursor-pointer"
        } 
        bg-blue-600 text-white p-3 w-full rounded-md font-semibold shadow`}
      >
        {form?.id ? "Update" : "Create"} Property
      </button>
    </div>
  );
}
