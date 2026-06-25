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
    tenantId,
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
    tenantId,
    name: "",
    address: "",
    latitude: latitude || 0,
    longitude: longitude || 0,
    radius: data?.radius || 0,
    createdAtDateTime: data?.createdAtDateTime || new Date().toISOString(),
    isActive: true,
    ...data,
  });

  const hasChanges = useMemo(() => {
    if (!originalForm) return true;
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
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill in all required fields.",
        confirmButtonColor: "#d6a800",
      });
      return;
    }

    setLoading(true);

    const endpoint = "/api/properties/createAndUpdate";

    const payload = form?.id
      ? {
          id: form?.id,
          tenantId: tenantId || form?.tenantId,
          name: form?.name,
          address: form?.address,
          latitude: Number(form?.latitude) || 0,
          longitude: Number(form?.longitude) || 0,
          radiusMeters: Number(form?.radius) || 0,
          isActive: form?.isActive,
        }
      : {
          ...form,
          tenantId: tenantId || form?.tenantId,
          isActive: form?.isActive,
          latitude: Number(form?.latitude) || 0,
          longitude: Number(form?.longitude) || 0,
          radiusMeters: Number(form?.radius) || 0,
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
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
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Something went wrong.",
          confirmButtonColor: "#d6a800",
        });
      }
    } catch (error) {
      console.error("Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
        confirmButtonColor: "#d6a800",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleIsActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev?.isActive }));
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white text-slate-800">
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-amber-50/60 to-white px-5 py-6 md:px-7">
        <span className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
          Property Setup
        </span>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)]">
            <FaBuilding className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
              {form?.id ? "Update Property" : "Create Property"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Configure the location, radius, and active status for this
              property.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-6 md:px-7">
        <div className="rounded-2xl bg-slate-50/70 p-1">
          <ModalInput
            id="name"
            name="name"
            label="Property Name"
            value={form?.name}
            onChange={handleChange}
          />
        </div>

        <div className="rounded-2xl bg-slate-50/70 p-1">
          <ModalInput
            id="address"
            name="address"
            label="Address"
            value={form?.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50/70 p-1">
            <ModalInput
              id="latitude"
              name="latitude"
              label="Latitude"
              value={String(form?.latitude)}
              onChange={handleChange}
            />
          </div>

          <div className="rounded-2xl bg-slate-50/70 p-1">
            <ModalInput
              id="longitude"
              name="longitude"
              label="Longitude"
              value={String(form?.longitude)}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50/70 p-1">
          <ModalInput
            id="radius"
            name="radius"
            label="Radius (meters)"
            value={String(form?.radius)}
            onChange={handleChange}
          />
        </div>

        {form?.id && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-slate-950">
                  Property Status
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Control whether this property is active in the system.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleIsActive}
                className={`relative flex h-8 w-14 cursor-pointer items-center rounded-full transition-all duration-300 ${
                  form?.isActive ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    form?.isActive ? "translate-x-[28px]" : "translate-x-[4px]"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
              {form?.isActive ? "Active" : "Inactive"}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-xl md:px-7">
        <button
          type="button"
          disabled={loading || !hasChanges}
          onClick={handleSubmit}
          className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)] transition ${
            loading || !hasChanges
              ? "cursor-not-allowed bg-amber-500/60 opacity-60"
              : "cursor-pointer bg-amber-500 hover:bg-amber-600"
          }`}
        >
          {loading
            ? "Saving..."
            : `${form?.id ? "Update" : "Create"} Property`}
        </button>
      </div>
    </div>
  );
}