"use client";
import React, { useState } from "react";
import { FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { BiSolidSprayCan } from "react-icons/bi";
import FormInput from "../components/elements/FormInput";
import Swal from "sweetalert2";

interface Entry {
  id: number;
  name: string;
  isActive: boolean;
}

function EntryManager({
  title,
  icon,
  data,
  endpoint,
}: {
  title: string;
  icon?: React.ReactNode;
  data?: Entry[];
  endpoint: string;
}) {
  const [entries, setEntries] = useState<Entry[]>(data || []);
  const [formValue, setFormValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((entry) =>
          Number(entry?.id) === Number(editingId)
            ? { ...entry, value: formValue }
            : entry
        )
      );
      setEditingId(null);
    } else {
      const newEntry: Entry = {
        id: 0,
        name: formValue,
        isActive: true,
      };
      setEntries((prev) => [...prev, newEntry]);
    }
    setFormValue("");
  };

  const addVehicleItem = (item: string, endpoint: string) => {
    if (!item?.trim()) return;

    try {
      let sendForm;

      if (endpoint === "Make" || endpoint === "Model") {
        sendForm = {
          id: 0,
          name: item,
          isActive: true,
          models: {
            id: 0,
            name: item,
            isActive: true,
          },
        };
      } else if (endpoint === "Type" || endpoint === "Color") {
        sendForm = {
          id: 0,
          name: item,
          isActive: true,
        };
      }

      const endpointName =
        endpoint === "Make" || endpoint === "Model"
          ? "makeOrModel"
          : endpoint === "Type"
          ? "type"
          : endpoint === "Color"
          ? "color"
          : "";

      fetch("/api/vehicleManager/createOrUpdate/" + endpointName, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendForm),
      });

      const newEntry: Entry = {
        id: 0,
        name: item,
        isActive: true,
      };
      setEntries((prev) => [...prev, newEntry]);
      setFormValue("");
    } catch (error) {
      console.error("Error adding vehicle item:", error);
    }
  };

  const proceedToDelete = (id: number, endpoint: string) => {
    try {
      let sendForm;

      if (endpoint === "Make" || endpoint === "Model") {
        sendForm = [Number(id)];
      } else if (endpoint === "Type" || endpoint === "Color") {
        sendForm = Number(id);
      }

      const endpointName =
        endpoint === "Make" || endpoint === "Model"
          ? "makeOrModel"
          : endpoint === "Type"
          ? "type"
          : endpoint === "Color"
          ? "color"
          : "";

      fetch("/api/vehicleManager/delete/" + endpointName, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendForm),
      });

      setEntries((prev) => prev.filter((entry) => Number(entry.id) !== id));
      if (Number(editingId) === id) {
        setEditingId(null);
        setFormValue("");
      }
    } catch (error) {
      console.error("Error adding vehicle item:", error);
    }
  };

  const deleteVehicleItem = (id: number, endpoint: string) => {
    if (!id) return;

    Swal.fire({
      title: `Are you sure you want to delete this
      ${title?.toLowerCase()}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        proceedToDelete(id, endpoint);
        Swal.fire(
          "Deleted!",
          `The ${title?.toLowerCase()} has been deleted.`,
          "success"
        );
      }
    });
  };

  return (
    <div className="overflow-hidden bg-white text-gray-800 relative">
      <div className="p-4 min-h-full">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <FormInput
            name="formValue"
            placeholder={`Enter ${title?.toLowerCase()}`}
            icon={icon}
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            onClear={() => setFormValue("")}
          />
          <button
            onClick={() => addVehicleItem(formValue, endpoint)}
            type="button"
            className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-md tracking-tight rounded"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </form>

        {/* Scrollable Pills */}
        <div className="max-h-40 overflow-y-auto">
          {Array.isArray(entries) && entries?.length === 0 ? (
            <p className="text-gray-500 italic">
              No {title?.toLowerCase()}s yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data?.map((entry) => (
                <div
                  key={entry?.id}
                  className="flex items-center bg-[#ef6c00] text-white text-sm px-3 py-1 rounded-lg shadow"
                >
                  {entry?.name}
                  <button
                    type="button"
                    onClick={() =>
                      deleteVehicleItem(Number(entry?.id), endpoint)
                    }
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

const VehicleCMS: React.FC<{
  carMakes: Entry[];
  carModels: Entry[];
  vehicleTypes: Entry[];
  vehicleColors: Entry[];
}> = ({ carMakes, carModels, vehicleTypes, vehicleColors }) => {
  const labels = ["Make", "Model", "Type", "Color"];
  const [activeLabel, setActiveLabel] = useState(labels[0]);
  const [form, setForm] = useState<{ make?: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div>
        <div className="w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white py-4 px-4 text-center rounded-t-sm">
          <h1 className="text-2xl font-extrabold drop-shadow-lg">
            Vehicle Manager
          </h1>
          <p className="text-sm drop-shadow-sm mt-2">
            Manage your vehicle makes, models, types, and colors.
          </p>
        </div>

        <div className="flex gap-1 p-3 border-b bg-gray-50 justify-center">
          {labels?.map((section) => (
            <button
              type="button"
              key={section}
              onClick={() => setActiveLabel(section)}
              className={`px-4 py-1 rounded-lg text-sm font-medium border cursor-pointer ${
                activeLabel === section
                  ? "bg-[#ef6c00] text-white border-[#ef6c00]"
                  : "bg-white text-[#ef6c00] border-[#ef6c00] hover:bg-orange-50"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        <div className="w-full max-w-full mx-auto text-gray-800">
          {activeLabel === "Make" && (
            <EntryManager
              title="Make"
              icon={<FaCar />}
              data={carMakes || []}
              endpoint={activeLabel}
            />
          )}

          {activeLabel === "Model" && (
            <>
              <div className="px-4 bg-white">
                <FormInput
                  name="make"
                  value={form?.make || ""}
                  onChange={handleChange}
                  icon={<FaCar />}
                  type="select"
                  options={carMakes}
                  // missing={missingFields.includes("make")}
                />
              </div>
              <EntryManager
                title="Model"
                icon={<FaCarRear />}
                data={carModels || []}
                endpoint={activeLabel}
              />
            </>
          )}

          {activeLabel === "Type" && (
            <EntryManager
              title="Type"
              icon={<PiCarProfileFill />}
              data={vehicleTypes || []}
              endpoint={activeLabel}
            />
          )}

          {activeLabel === "Color" && (
            <EntryManager
              title="Color"
              icon={<BiSolidSprayCan />}
              data={vehicleColors || []}
              endpoint={activeLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCMS;
