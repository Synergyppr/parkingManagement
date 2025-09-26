"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProperty } from "../context/PropertyContext";
import { FaMobileAlt } from "react-icons/fa";
import { MdOutlineContactPhone } from "react-icons/md";
import FormInput from "./elements/FormInput";

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

function DeviceManager({ data, fetchPropertyDevices }: DeviceManagerProps) {
  const { propertyId } = useProperty();
  const [devices, setDevices] = useState<Device[]>(data || []);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    setDevices(data || []);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName?.trim() || !formPhone?.trim()) return;

    setButtonLoading(true);

    try {
      const sendForm: Device = {
        id: editingId || null,
        propertyId: propertyId || "",
        name: formName,
        phone: formPhone,
      };

      const response = await fetch(`/api/devices/createOrEdit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const result = await response.json();

      if (result?.result?.status === "200") {
        fetchPropertyDevices();

        Swal.fire(
          "Success",
          `Device ${formName} added successfully.`,
          "success"
        );

        setFormName("");
        setFormPhone("");
        setEditingId(null);
      } else {
        Swal.fire(
          "Error",
          result?.result?.message || "Failed to save device.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving device:", error);
    } finally {
      setButtonLoading(false);
    }
  };

  const deleteDevice = async (id: number) => {
    if (!id) return;

    Swal.fire({
      title: "Are you sure?",
      text: "This device will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setButtonLoading(true);
        try {
          const sendForm = { id: id };
          const response = await fetch(`/api/devices/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sendForm),
          });

          const res = await response.json();

          if (res?.result?.status === "200") {
            setDevices((prev) => prev?.filter((d) => d?.id !== id));
            fetchPropertyDevices();

            Swal.fire("Deleted!", "The device has been deleted.", "success");
          } else {
            Swal.fire(
              "Error",
              res?.result?.message || "Failed to delete device.",
              "error"
            );
          }
        } catch (err) {
          console.error("Error deleting device:", err);
        } finally {
          setButtonLoading(false);
        }
      }
    });
  };

  return (
    <div className="overflow-hidden bg-white text-gray-800 relative">
      <div className="p-4 min-h-full">
        {/* Add Form */}
        <form className="flex flex-col sm:flex-row gap-2 mb-4">
          <FormInput
            name="formName"
            placeholder="Device Name"
            icon={<MdOutlineContactPhone />}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            onClear={() => setFormName("")}
          />
          <FormInput
            name="formPhone"
            placeholder="Phone Number"
            icon={<FaMobileAlt />}
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            onClear={() => setFormPhone("")}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={buttonLoading}
            className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-md tracking-tight rounded"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </form>

        {/* Device List */}
        <div className="max-h-40 overflow-y-auto">
          {devices?.length === 0 ? (
            <p className="text-gray-500 italic">No devices yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {devices?.map((device) => (
                <div
                  key={device?.id + device?.name}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm px-3 py-1 rounded-lg shadow"
                >
                  <span className="font-medium">{device?.name}</span>
                  <span className="opacity-80 text-xs">({device?.phone})</span>
                  <button
                    type="button"
                    disabled={buttonLoading}
                    onClick={() => deleteDevice(device?.id as number)}
                    className="ml-2 text-white hover:text-red-200 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DeviceCMS: React.FC<{
  devices: Device[];
  fetchPropertyDevices: () => void;
}> = ({ devices, fetchPropertyDevices }) => {
  return (
    <div>
      <div className="w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white py-4 px-4 text-center rounded-t-sm">
        <h1 className="text-2xl font-extrabold drop-shadow-lg">
          Device Manager
        </h1>
        <p className="text-sm drop-shadow-sm mt-2">
          Manage your devices with names and phone numbers.
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
