// ModalPropertyForm.tsx
"use client";
import { useMemo, useState } from "react";
import { FaBuilding } from "react-icons/fa6";
import { Palette, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";

import ModalInput from "./elements/ModalInput";
import { useProperty } from "../context/PropertyContext";
import { IoColorPaletteOutline } from "react-icons/io5";
import ThemeSelector from "./ThemeSelector";

const DEFAULT_PRIMARY_COLOR = "#d6a800";
const DEFAULT_SECONDARY_COLOR = "#8a6a00";

export interface Property {
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
  primaryColor: string;
  secondaryColor: string;
}

interface PropertyFormProps {
  tenantId?: string;
  originalData?: Property | null;
  data?: Property | null;
  onSuccess?: () => void;
  setModalOpen: (isOpen: boolean) => void;
}

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PRIMARY_COLOR;
  }

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || DEFAULT_PRIMARY_COLOR
  );
};

const normalizeHexColor = (value?: string | null, fallback = "#000000") => {
  const normalizedValue = String(value || "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(normalizedValue)) {
    return normalizedValue.toLowerCase();
  }

  if (/^[0-9A-Fa-f]{6}$/.test(normalizedValue)) {
    return `#${normalizedValue.toLowerCase()}`;
  }

  return fallback;
};

const isValidHexColor = (value: string) =>
  /^#[0-9A-Fa-f]{6}$/.test(value.trim());

export default function ModalPropertyForm({
  tenantId,
  originalData,
  data,
  onSuccess,
  setModalOpen,
}: PropertyFormProps) {
  const { latitude, longitude, setPrimaryColor, setSecondaryColor } =
    useProperty();
  const [loading, setLoading] = useState(false);

  const sourceData = data || originalData;

  const defaultForm = useMemo(
    () => ({
      id: sourceData?.id,
      tenantId: tenantId || sourceData?.tenantId,
      tenant: sourceData?.tenant,
      name: sourceData?.name || "",
      address: sourceData?.address || "",
      latitude: sourceData?.latitude ?? latitude ?? 0,
      longitude: sourceData?.longitude ?? longitude ?? 0,
      radius: sourceData?.radius ?? 0,
      createdAtDateTime:
        sourceData?.createdAtDateTime || new Date().toISOString(),
      isActive: sourceData?.isActive ?? true,
      primaryColor: normalizeHexColor(
        sourceData?.primaryColor,
        DEFAULT_PRIMARY_COLOR
      ),
      secondaryColor: normalizeHexColor(
        sourceData?.secondaryColor,
        DEFAULT_SECONDARY_COLOR
      ),
    }),
    [sourceData, tenantId, latitude, longitude]
  );

  const [form, setForm] = useState<Property>(defaultForm);

  const hasChanges = useMemo(() => {
    return JSON.stringify(defaultForm) !== JSON.stringify(form);
  }, [defaultForm, form]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const resetColors = () => {
    setForm((previousForm) => ({
      ...previousForm,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill in all required fields.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    if (
      !isValidHexColor(form.primaryColor) ||
      !isValidHexColor(form.secondaryColor)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid colors",
        text: "Primary and secondary colors must use a valid 6-digit HEX format, such as #d6a800.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    setLoading(true);

    const endpoint = "/api/properties/createAndUpdate";

    const normalizedPrimaryColor = normalizeHexColor(
      form.primaryColor,
      DEFAULT_PRIMARY_COLOR
    );

    const normalizedSecondaryColor = normalizeHexColor(
      form.secondaryColor,
      DEFAULT_SECONDARY_COLOR
    );

    const payload = form.id
      ? {
          id: form.id,
          tenantId: tenantId || form.tenantId,
          name: form.name.trim(),
          address: form.address.trim(),
          latitude: Number(form.latitude) || 0,
          longitude: Number(form.longitude) || 0,
          radiusMeters: Number(form.radius) || 0,
          isActive: form.isActive,
          primaryColor: normalizedPrimaryColor,
          secondaryColor: normalizedSecondaryColor,
        }
      : {
          ...form,
          tenantId: tenantId || form.tenantId,
          name: form.name.trim(),
          address: form.address.trim(),
          latitude: Number(form.latitude) || 0,
          longitude: Number(form.longitude) || 0,
          radius: Number(form.radius) || 0,
          radiusMeters: Number(form.radius) || 0,
          isActive: form.isActive,
          primaryColor: normalizedPrimaryColor,
          secondaryColor: normalizedSecondaryColor,
        };

    // console.log("Updating Property", payload);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result?.result?.status === "200") {
        setModalOpen(false);

        await Swal.fire({
          icon: "success",
          title: `Property ${form.id ? "updated" : "created"} successfully!`,
          showConfirmButton: false,
          timer: 1500,
        });

        setPrimaryColor(normalizedPrimaryColor);
        setSecondaryColor(normalizedSecondaryColor);

        onSuccess?.();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Something went wrong.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error saving property:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleIsActive = () => {
    setForm((previousForm) => ({
      ...previousForm,
      isActive: !previousForm.isActive,
    }));
  };

  const primaryColorIsValid = isValidHexColor(form.primaryColor);
  const secondaryColorIsValid = isValidHexColor(form.secondaryColor);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-4xl bg-white text-slate-800">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 md:px-7">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Property Setup
        </span>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)]">
            <FaBuilding className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
              {form.id ? "Update Property" : "Create Property"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Configure the location, branding, radius, and active status for
              this property.
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
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="rounded-2xl bg-slate-50/70 p-1">
          <ModalInput
            id="address"
            name="address"
            label="Address"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50/70 p-1">
            <ModalInput
              id="latitude"
              name="latitude"
              label="Latitude"
              value={String(form.latitude)}
              onChange={handleChange}
            />
          </div>

          <div className="rounded-2xl bg-slate-50/70 p-1">
            <ModalInput
              id="longitude"
              name="longitude"
              label="Longitude"
              value={String(form.longitude)}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50/70 p-1">
          <ModalInput
            id="radius"
            name="radius"
            label="Radius (meters)"
            value={String(form.radius)}
            onChange={handleChange}
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Palette className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-950">
                  Property Branding
                </p>

                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Select the colors used throughout this property.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetColors}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-primary/30 hover:text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          <div className="mx-4 my-4">
            <div className="mb-2 flex items-center gap-2 px-2">
              <IoColorPaletteOutline className="h-4 w-4 text-primary" />

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Appearance
              </p>
            </div>

            <ThemeSelector form={form} setForm={setForm} />
          </div>
        </div>

        {form.id && (
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
                role="switch"
                aria-checked={form.isActive}
                aria-label="Toggle property status"
                onClick={toggleIsActive}
                className={`relative flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ${
                  form.isActive ? "bg-primary" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    form.isActive ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
              {form.isActive ? "Active" : "Inactive"}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-xl md:px-7">
        <button
          type="button"
          disabled={
            loading ||
            !hasChanges ||
            !primaryColorIsValid ||
            !secondaryColorIsValid
          }
          onClick={handleSubmit}
          className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition ${
            loading ||
            !hasChanges ||
            !primaryColorIsValid ||
            !secondaryColorIsValid
              ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-60"
              : "cursor-pointer bg-primary hover:bg-secondary"
          }`}
        >
          {loading ? "Saving..." : `${form.id ? "Update" : "Create"} Property`}
        </button>
      </div>
    </div>
  );
}
