"use client";
import React, { useState, useEffect } from "react";
import { FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { BiSolidSprayCan } from "react-icons/bi";
import FormInput from "../components/elements/FormInput";
import ButtonLoader from "./elements/ButtonLoader";
import Swal from "sweetalert2";

interface Entry {
  id: number;
  name: string;
  isActive: boolean;
  models?: Entry[];
}

function EntryManager({
  title,
  icon,
  data,
  endpoint,
  parentValue,
  fetchVehicleDropdownData,
}: {
  title: string;
  icon?: React.ReactNode;
  data?: Entry[];
  endpoint: string;
  parentValue?: {
    id: number;
    name: string;
  };
  fetchVehicleDropdownData: () => Promise<void>;
}) {
  const sortEntries = (arr: Entry[]) =>
    [...arr].sort((a, b) => a.name.localeCompare(b.name));
  const [entries, setEntries] = useState<Entry[]>(sortEntries(data || []));
  const [formValue, setFormValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    setEntries(sortEntries(data || []));
  }, [data]);

  // Check for duplicates
  const isDuplicate = (name: string): boolean => {
    if (!name?.trim()) return false;

    if (endpoint === "Model" && parentValue?.id) {
      // Look inside parent make's models
      const parentMake = data?.find(
        (m) => Number(m?.id) === Number(parentValue?.id)
      );
      return (
        parentMake?.models?.some(
          (model) => model.name.toLowerCase() === name.toLowerCase()
        ) || false
      );
    }

    // For Make, Type, and Color, just check entries list
    return entries.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );
  };

  const addVehicleItem = async (item: string, endpoint: string) => {
    if (!item?.trim()) return;

    if (isDuplicate(item)) {
      Swal.fire(
        "Duplicate",
        `The ${title?.toLowerCase()} "${item}" already exists.`,
        "warning"
      );
      return;
    }

    setButtonLoading(true);

    try {
      let sendForm;

      if (endpoint === "Make" || endpoint === "Model") {
        if (endpoint === "Make") {
          sendForm = [
            {
              id: 0,
              name: item as string,
              isActive: true,
            },
          ];
        } else if (endpoint === "Model") {
          sendForm = [
            {
              id: parentValue?.id || 0,
              name: parentValue?.name || "",
              isActive: true,
              models: [
                {
                  id: 0,
                  name: item,
                  isActive: true,
                },
              ],
            },
          ];
        } else return;
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

      const response = await fetch(
        "/api/vehicleManager/createOrUpdate/" + endpointName,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendForm),
        }
      );

      const result = await response.json();

      if (result?.result?.status === "200") {
        setFormValue("");
        fetchVehicleDropdownData();
        Swal.fire(
          "Success",
          `The ${title?.toLowerCase()} "${item}" has been added successfully.`,
          "success"
        );
      } else {
        Swal.fire(
          "Error",
          result?.result?.message ||
            `Failed to add the ${title?.toLowerCase()} "${item}". Please try again.`,
          "error"
        );
        return;
      }
    } catch (error) {
      console.error("Error adding vehicle item:", error);
    } finally {
      setButtonLoading(false);
    }
  };

  const deleteVehicleItem = (
    entry: { id: number; name: string; isActive: boolean },
    endpoint: string
  ) => {
    const id = entry?.id;
    if (!id) return;

    const entryToDelete = entries?.find((entry) => Number(entry?.id) === id);

    // If deleting a Make, collect its models
    let modelsHtml = "";
    if (endpoint === "Make" && entryToDelete?.models?.length) {
      modelsHtml = `
        <div style="margin-top: 12px; text-align: left;">
          <div style="font-weight: 600; margin-bottom: 6px; color: #444;">
            These models will also be deleted:
          </div>
          <div style="background: #f8f9fa; padding: 10px 14px; border-radius: 6px; border: 1px solid #e0e0e0; max-height: 150px; overflow-y: auto;">
            ${entryToDelete?.models
              .map((m) => `<div style="padding: 2px 0;">• ${m?.name}</div>`)
              .join("")}
          </div>
        </div>
      `;
    }

    Swal.fire({
      title: `Delete ${title}?`,
      html: `
        <div style="text-align: center;">
          <p style="margin-bottom: 8px;">Are you sure you want to delete:</p>
          <div style="font-size: 16px; font-weight: bold; color: #d33;">
            ${entryToDelete?.name}
          </div>
          ${modelsHtml}
          <p style="margin-top: 12px; color: #666; font-size: 13px;">
            This action cannot be undone.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        proceedToDelete(entry, endpoint);
      }
    });
  };

  const proceedToDelete = async (
    entry: { id: number; name: string; isActive: boolean },
    endpoint: string
  ) => {
    const id = entry?.id;
    setButtonLoading(true);

    try {
      let sendForm;

      if (endpoint === "Make") {
        sendForm = {
          brandsAndModels: [
            {
              id: Number(id),
            },
          ],
        };
      } else if (endpoint === "Model") {
        sendForm = {
          id: Number(id),
          name: entry?.name,
          isActive: false,
        };
      } else if (endpoint === "Type" || endpoint === "Color") {
        sendForm = { id: Number(id) };
      }

      const endpointName =
        endpoint === "Make"
          ? "makeWithModel"
          : endpoint === "Model"
          ? "model"
          : endpoint === "Type"
          ? "type"
          : endpoint === "Color"
          ? "color"
          : "";

      const response = await fetch(
        "/api/vehicleManager/delete/" + endpointName,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendForm),
        }
      );

      const result = await response.json();

      if (result?.result?.status === "200") {
        await fetchVehicleDropdownData();

        if (Number(editingId) === id) {
          setEditingId(null);
          setFormValue("");
        }
        Swal.fire(
          "Success",
          `The ${title?.toLowerCase()} "${
            entry?.name
          }" has been deleted successfully.`,
          "success"
        );
      } else {
        Swal.fire(
          "Error",
          result?.result?.message ||
            `Failed to delete the ${title?.toLowerCase()}. Please try again.`,
          "error"
        );
        setButtonLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error deleting vehicle item:", error);
      setButtonLoading(false);
      Swal.fire(
        "Error",
        `An error occurred while deleting the ${title?.toLowerCase()}. Please try again.`,
        "error"
      );
    } finally {
      setButtonLoading(false);
    }
  };

  // Filter entries by search query
  const filteredEntries = entries?.filter((entry) =>
    entry?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  return (
    <div className="overflow-hidden bg-white text-gray-800 relative">
      <div className="p-4 min-h-full">
        <form className="flex items-center gap-2 mb-4">
          <FormInput
            name="formValue"
            placeholder={`Enter ${title?.toLowerCase()}`}
            icon={icon}
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            onClear={() => setFormValue("")}
          />
          <button
            type="button"
            disabled={buttonLoading}
            onClick={() => addVehicleItem(formValue, endpoint)}
            className={`${
              buttonLoading
                ? "bg-opacity-50 cursor-not-allowed py-1"
                : "cursor-pointer py-2"
            } ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white px-6 font-semibold shadow-md tracking-tight rounded`}
          >
            {buttonLoading ? <ButtonLoader /> : editingId ? "Update" : "Add"}
          </button>
        </form>

        {/*  Search Bar  */}
        <div className="mb-3">
          <FormInput
            name="searchQuery"
            placeholder={`Search ${title?.toLowerCase()}s...`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            type="text"
          />
        </div>

        {/* Scrollable Pills */}
        <div className="max-h-40 overflow-y-auto">
          {Array.isArray(filteredEntries) && filteredEntries?.length === 0 ? (
            <p className="text-gray-500 italic">
              No {title?.toLowerCase()}s found.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredEntries?.map((entry) => (
                <div
                  key={entry?.id + entry?.name}
                  className="flex items-center bg-[#ef6c00] text-white text-sm px-3 py-1 rounded-lg shadow"
                >
                  {entry?.name}
                  <button
                    type="button"
                    disabled={buttonLoading}
                    onClick={() => deleteVehicleItem(entry, endpoint)}
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
  fetchVehicleDropdownData: () => Promise<void>;
}> = ({
  carMakes,
  // carModels,
  vehicleTypes,
  vehicleColors,
  fetchVehicleDropdownData,
}) => {
  const labels = ["Make", "Model", "Type", "Color"];
  const [activeLabel, setActiveLabel] = useState(labels[0]);
  const [form, setForm] = useState<{ make?: string }>({});
  const [filteredModels, setFilteredModels] = useState<Entry[]>([]);

  const sortEntries = (arr: Entry[]) =>
    [...arr].sort((a, b) => a.name.localeCompare(b.name));

  React.useEffect(() => {
    if (activeLabel === "Model" && form?.make) {
      const models =
        carMakes?.find((m) => Number(m?.id) == Number(form?.make))?.models ||
        [];
      setFilteredModels(sortEntries(models));
    } else {
      setFilteredModels([]);
    }
  }, [activeLabel, form?.make, carMakes, form]);

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
              data={sortEntries(carMakes || [])}
              endpoint={activeLabel}
              fetchVehicleDropdownData={fetchVehicleDropdownData}
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
                  options={sortEntries(carMakes)}
                />
              </div>
              <EntryManager
                title="Model"
                icon={<FaCarRear />}
                data={filteredModels || []}
                endpoint={activeLabel}
                parentValue={{
                  id: carMakes?.find(
                    (m) => Number(m?.id) === Number(form?.make)
                  )?.id as number,
                  name: carMakes?.find(
                    (m) => Number(m?.id) === Number(form?.make)
                  )?.name as string,
                }}
                fetchVehicleDropdownData={fetchVehicleDropdownData}
              />
            </>
          )}

          {activeLabel === "Type" && (
            <EntryManager
              title="Type"
              icon={<PiCarProfileFill />}
              data={sortEntries(vehicleTypes || [])}
              endpoint={activeLabel}
              fetchVehicleDropdownData={fetchVehicleDropdownData}
            />
          )}

          {activeLabel === "Color" && (
            <EntryManager
              title="Color"
              icon={<BiSolidSprayCan />}
              data={sortEntries(vehicleColors || [])}
              endpoint={activeLabel}
              fetchVehicleDropdownData={fetchVehicleDropdownData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCMS;
