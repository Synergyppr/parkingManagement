"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProperty } from "../context/PropertyContext";
import { formatPhoneNumber } from "../lib/clientUtils";
import { MdOutlineContactPhone } from "react-icons/md";
import FormInput from "./elements/FormInput";
import PhoneInputWithAreaCode from "./elements/PhoneInputWithAreaCode";
import ButtonLoader from "./elements/ButtonLoader";

interface Device {
  id: number | null;
  name: string;
  phone: string;
  propertyId: string;
}

interface DeviceManagerProps {
  data?: Device[];
  fetchPropertyDevices: () => void;
}

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

function DeviceManager({ data, fetchPropertyDevices }: DeviceManagerProps) {
  const { propertyId } = useProperty();
  const [devices, setDevices] = useState<Device[]>(data || []);
  const [formName, setFormName] = useState("");
  const [formAreaCode, setFormAreaCode] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    setDevices(data || []);
  }, [data]);

  const resetForm = () => {
    setFormName("");
    setFormPhone("");
    setFormAreaCode("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName?.trim() || !formPhone?.trim()) return;

    setButtonLoading(true);

    try {
      const rawPhone = (formPhone || "").replace(/\D/g, "");
      const last10 = rawPhone.slice(-10);
      const validAreaCode = formAreaCode || "+1";

      const sendForm: Device = {
        id: editingId || null,
        propertyId: propertyId || "",
        name: formName,
        phone: validAreaCode + last10,
      };

      const response = await fetch(`/api/devices/createOrEdit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const result = await response.json();

      if (result?.result?.status === "200") {
        fetchPropertyDevices();

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Device ${formName} ${editingId ? "updated" : "added"} successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });

        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Failed to save device.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error saving device:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving this device.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const deleteDevice = async (id: number) => {
    if (!id) return;

    Swal.fire({
      title: "Delete Device?",
      text: "This device will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setButtonLoading(true);

      try {
        const response = await fetch(`/api/devices/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const res = await response.json();

        if (res?.result?.status === "200") {
          setDevices((prev) => prev?.filter((d) => d?.id !== id));
          fetchPropertyDevices();

          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "The device has been deleted.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res?.result?.message || "Failed to delete device.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        }
      } catch (err) {
        console.error("Error deleting device:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while deleting this device.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } finally {
        setButtonLoading(false);
      }
    });
  };

  return (
    <div className="bg-white text-slate-800">
      <div className="space-y-5 p-5">
        {/* Form */}
        <section className="rounded-4xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {editingId ? "Update Device" : "Add New Device"}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Register a device name and phone number for valet notifications.
            </p>
          </div>

          <form className="grid grid-cols-1 gap-3 lg:grid-cols-1">
            <div className="col-span-1">
            <FormInput
              name="formName"
              placeholder="Device Name"
              icon={<MdOutlineContactPhone />}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onClear={() => setFormName("")}
            />
            </div>

            <PhoneInputWithAreaCode
              areaCode={formAreaCode || ""}
              phoneNumber={formPhone || ""}
              onAreaCodeChange={(e) => setFormAreaCode(e.target.value)}
              onPhoneNumberChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                const formatted = formatPhoneNumber(rawValue);
                setFormPhone(formatted);
              }}
              onClear={() => setFormPhone("")}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={buttonLoading || !formName.trim() || !formPhone.trim()}
              className={`flex h-12 items-center justify-center rounded-2xl px-7 text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition ${
                buttonLoading || !formName.trim() || !formPhone.trim()
                  ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-70"
                  : "cursor-pointer bg-primary hover:bg-secondary"
              }`}
            >
              {buttonLoading ? <ButtonLoader /> : editingId ? "Update" : "Add"}
            </button>
          </form>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-3 text-xs font-bold text-slate-400 transition hover:text-primary"
            >
              Cancel editing
            </button>
          )}
        </section>

        {/* Device List */}
        <section className="rounded-4xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Registered Devices
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {devices?.length || 0} device(s)
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
              <MdOutlineContactPhone className="h-5 w-5" />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            {devices?.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No devices yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {devices?.map((device) => (
                  <div
                    key={device?.id + device?.name}
                    className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-(--primary-light) hover:bg-[color-mix(in_srgb,var(--primary-soft)_50%,transparent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-950">
                          {device?.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {device?.phone}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={buttonLoading}
                        onClick={() => deleteDevice(device?.id as number)}
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const DeviceCMS: React.FC<{
  devices: Device[];
  fetchPropertyDevices: () => void;
}> = ({ devices, fetchPropertyDevices }) => {
  return (
    <div className="overflow-hidden bg-white">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 text-center">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Device Center
        </span>

        <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
          Device Manager
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Manage device names and phone numbers used for valet communication and
          notifications.
        </p>
      </div>

      <DeviceManager
        fetchPropertyDevices={fetchPropertyDevices}
        data={devices || []}
      />
    </div>
  );
};

export default DeviceCMS;