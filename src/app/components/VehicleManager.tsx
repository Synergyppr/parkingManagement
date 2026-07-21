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

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

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

  const isDuplicate = (name: string): boolean => {
    if (!name?.trim()) return false;

    if (endpoint === "Model" && parentValue?.id) {
      const parentMake = data?.find(
        (m) => Number(m?.id) === Number(parentValue?.id)
      );

      return (
        parentMake?.models?.some(
          (model) => model.name.toLowerCase() === name.toLowerCase()
        ) || false
      );
    }

    return entries.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );
  };

  const addVehicleItem = async (item: string, endpoint: string) => {
    if (!item?.trim()) return;

    if (isDuplicate(item)) {
      Swal.fire({
        icon: "warning",
        title: "Duplicate",
        text: `The ${title?.toLowerCase()} "${item}" already exists.`,
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    setButtonLoading(true);

    try {
      let sendForm;

      if (endpoint === "Make" || endpoint === "Model") {
        if (endpoint === "Make") {
          sendForm = [{ id: 0, name: item as string, isActive: true }];
        } else if (endpoint === "Model") {
          sendForm = [
            {
              id: parentValue?.id || 0,
              name: parentValue?.name || "",
              isActive: true,
              models: [{ id: 0, name: item, isActive: true }],
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        }
      );

      const result = await response.json();

      if (result?.result?.status === "200") {
        setFormValue("");
        fetchVehicleDropdownData();

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `The ${title?.toLowerCase()} "${item}" has been added successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            result?.result?.message ||
            `Failed to add the ${title?.toLowerCase()} "${item}". Please try again.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
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

    let modelsHtml = "";
    if (endpoint === "Make" && entryToDelete?.models?.length) {
      modelsHtml = `
        <div style="margin-top: 12px; text-align: left;">
          <div style="font-weight: 700; margin-bottom: 6px; color: #334155;">
            These models will also be deleted:
          </div>
          <div style="background: #f8fafc; padding: 10px 14px; border-radius: 14px; border: 1px solid #e2e8f0; max-height: 150px; overflow-y: auto;">
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
          <div style="font-size: 16px; font-weight: bold; color: ${getPrimaryThemeColor()};">
            ${entryToDelete?.name}
          </div>
          ${modelsHtml}
          <p style="margin-top: 12px; color: #64748b; font-size: 13px;">
            This action cannot be undone.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
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
          brandsAndModels: [{ id: Number(id) }],
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
          headers: { "Content-Type": "application/json" },
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

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `The ${title?.toLowerCase()} "${
            entry?.name
          }" has been deleted successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            result?.result?.message ||
            `Failed to delete the ${title?.toLowerCase()}. Please try again.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error deleting vehicle item:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `An error occurred while deleting the ${title?.toLowerCase()}. Please try again.`,
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const filteredEntries = entries?.filter((entry) =>
    entry?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  return (
    <div className="bg-white text-slate-800">
      <div className="space-y-5 p-5">
        <section className="rounded-4xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Add New {title}
          </p>

          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <FormInput
                name="formValue"
                placeholder={`Enter ${title?.toLowerCase()}`}
                icon={icon}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                onClear={() => setFormValue("")}
              />
            </div>

            <button
              type="button"
              disabled={buttonLoading}
              onClick={() => addVehicleItem(formValue, endpoint)}
              className={`h-12 rounded-2xl px-7 text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition sm:min-w-28.5 ${
                buttonLoading
                  ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)]"
                  : "cursor-pointer bg-primary hover:bg-secondary"
              }`}
            >
              {buttonLoading ? <ButtonLoader /> : editingId ? "Update" : "Add"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Current {title}s
              </p>

              <p className="text-xs font-semibold text-slate-500">
                {filteredEntries?.length || 0} result(s)
              </p>
            </div>
          </div>

          <FormInput
            name="searchQuery"
            placeholder={`Search ${title?.toLowerCase()}s...`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
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
        </section>

        <section className="max-h-56 overflow-y-auto rounded-4xl border border-slate-200 bg-white p-4">
          {Array.isArray(filteredEntries) && filteredEntries?.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center text-center">
              <p className="text-sm font-semibold text-slate-400">
                No {title?.toLowerCase()}s found.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredEntries?.map((entry) => (
                <div
                  key={entry?.id + entry?.name}
                  className="group flex items-center gap-2 rounded-2xl border border-(--primary-light) bg-(--primary-soft) px-3 py-2 text-sm font-bold text-primary shadow-sm"
                >
                  <span>{entry?.name}</span>

                  <button
                    type="button"
                    disabled={buttonLoading}
                    onClick={() => deleteVehicleItem(entry, endpoint)}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
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
}> = ({ carMakes, vehicleTypes, vehicleColors, fetchVehicleDropdownData }) => {
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

  const tabIcon = (section: string) => {
    if (section === "Make") return <FaCar />;
    if (section === "Model") return <FaCarRear />;
    if (section === "Type") return <PiCarProfileFill />;
    return <BiSolidSprayCan />;
  };

  return (
    <div className="overflow-hidden rounded-4xl bg-white">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 text-center">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Vehicle Catalog
        </span>

        <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
          Vehicle Manager
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Manage makes, models, vehicle types, and colors used across valet
          check-in forms.
        </p>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {labels?.map((section) => {
            const isActive = activeLabel === section;

            return (
              <button
                type="button"
                key={section}
                onClick={() => setActiveLabel(section)}
                className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-black transition ${
                  isActive
                    ? "border-primary bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary"
                }`}
              >
                <span>{tabIcon(section)}</span>
                {section}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-full text-slate-800">
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
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Select Make
              </p>

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
                id: carMakes?.find((m) => Number(m?.id) === Number(form?.make))
                  ?.id as number,
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
  );
};

export default VehicleCMS;
