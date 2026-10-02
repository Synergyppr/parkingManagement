"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProperty } from "../context/PropertyContext";
import { KeyHub, KeySlot } from "../types";
import { FaKey, FaPlus, FaTrash } from "react-icons/fa";
import { MdGridOn } from "react-icons/md";
import FormInput from "./elements/FormInput";
import ButtonLoader from "./elements/ButtonLoader";

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

interface KeyHubManagerProps {
  keyHubs: KeyHub[];
  fetchKeyHubs: () => void;
}

function KeyHubManager({ keyHubs, fetchKeyHubs }: KeyHubManagerProps) {
  const { propertyId } = useProperty();
  const [hubs, setHubs] = useState<KeyHub[]>(keyHubs || []);
  const [formName, setFormName] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState("0");
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Slot management state
  const [expandedHubId, setExpandedHubId] = useState<string | null>(null);
  const [hubSlots, setHubSlots] = useState<KeySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Bulk slot create form
  const [bulkTotal, setBulkTotal] = useState("");
  const [bulkColumns, setBulkColumns] = useState("5");
  const [bulkStartFrom, setBulkStartFrom] = useState("1");

  // Single slot edit form
  const [slotLabel, setSlotLabel] = useState("");
  const [slotRowOrder, setSlotRowOrder] = useState("1");
  const [slotColumnOrder, setSlotColumnOrder] = useState("1");
  const [slotRowName, setSlotRowName] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Multi-select for delete
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHubs(keyHubs || []);
  }, [keyHubs]);

  // Auto-suggest starting label based on existing slots
  useEffect(() => {
    if (hubSlots.length === 0) {
      setBulkStartFrom("1");
    } else {
      const maxLabel = Math.max(
        ...hubSlots.map((s) => {
          const num = parseInt(s.slotLabel, 10);
          return isNaN(num) ? 0 : num;
        })
      );
      setBulkStartFrom(String(maxLabel + 1));
    }
  }, [hubSlots]);

  const resetHubForm = () => {
    setFormName("");
    setFormDisplayOrder("0");
    setEditingHubId(null);
  };

  const resetSlotForm = () => {
    setSlotLabel("");
    setSlotRowOrder("1");
    setSlotColumnOrder("1");
    setSlotRowName("");
    setEditingSlotId(null);
  };

  const resetBulkForm = () => {
    setBulkTotal("");
    setBulkColumns("5");
  };

  // ── KeyHub CRUD ────────────────────────────────────────────

  const handleEditHub = (hub: KeyHub) => {
    setFormName(hub.name);
    setFormDisplayOrder(String(hub.displayOrder ?? 0));
    setEditingHubId(hub.id || null);
  };

  const handleSubmitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setButtonLoading(true);
    try {
      const isUpdate = !!editingHubId;
      const endpoint = isUpdate
        ? "/api/keyhub/update"
        : "/api/keyhub/create";

      const payload: Record<string, unknown> = isUpdate
        ? {
            id: editingHubId,
            name: formName.trim(),
            displayOrder: Number(formDisplayOrder) || 0,
            isActive: true,
          }
        : {
            propertyId,
            name: formName.trim(),
            displayOrder: Number(formDisplayOrder) || 0,
            slots: [],
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (
        result?.result?.status === "200" ||
        result?.result?.status === 200
      ) {
        fetchKeyHubs();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Key Hub "${formName}" ${isUpdate ? "updated" : "created"} successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
        resetHubForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Failed to save Key Hub.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error saving Key Hub:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving this Key Hub.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const deleteHub = async (id: string) => {
    if (!id) return;

    Swal.fire({
      title: "Delete Key Hub?",
      text: "This Key Hub and all its slots will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setButtonLoading(true);
      try {
        const response = await fetch("/api/keyhub/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const res = await response.json();

        if (res?.result?.status === "200" || res?.result?.status === 200) {
          setHubs((prev) => prev.filter((h) => h.id !== id));
          if (expandedHubId === id) {
            setExpandedHubId(null);
            setHubSlots([]);
          }
          fetchKeyHubs();
          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "The Key Hub has been deleted.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res?.result?.message || "Failed to delete Key Hub.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        }
      } catch (err) {
        console.error("Error deleting Key Hub:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while deleting this Key Hub.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } finally {
        setButtonLoading(false);
      }
    });
  };

  // ── KeySlot CRUD ───────────────────────────────────────────

  const fetchSlotsByHub = async (keyHubId: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch("/api/keyslot/getByKeyhub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyHubId }),
      });
      const result = await response.json();

      if (
        result?.result?.status === "200" ||
        result?.result?.status === 200
      ) {
        setHubSlots(result?.result?.data || []);
      } else {
        setHubSlots([]);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setHubSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const toggleExpandHub = (hubId: string) => {
    if (expandedHubId === hubId) {
      setExpandedHubId(null);
      setHubSlots([]);
      resetSlotForm();
    } else {
      setExpandedHubId(hubId);
      fetchSlotsByHub(hubId);
      resetSlotForm();
    }
    setSelectedSlotIds(new Set());
  };

  const handleEditSlot = (slot: KeySlot) => {
    setSlotLabel(slot.slotLabel);
    setSlotRowOrder(String(slot.rowOrder));
    setSlotColumnOrder(String(slot.columnOrder));
    setSlotRowName(slot.rowName || "");
    setEditingSlotId(slot.id || null);
  };

  // Generate the bulk slot array for preview and submission
  const generateBulkSlots = () => {
    const total = Number(bulkTotal) || 0;
    const cols = Number(bulkColumns) || 5;
    const start = Number(bulkStartFrom) || 1;
    if (total <= 0 || cols <= 0) return [];

    // Calculate starting row based on existing slots
    const existingMaxRow = hubSlots.length > 0
      ? Math.max(...hubSlots.map((s) => s.rowOrder))
      : 0;
    // Check if last existing row is full to decide offset
    const lastRowSlots = hubSlots.filter((s) => s.rowOrder === existingMaxRow);
    const startRowOffset = lastRowSlots.length >= cols || hubSlots.length === 0 ? 1 : 0;

    const slots: { keyHubId: string; slotLabel: string; rowOrder: number; columnOrder: number; rowName: string; isOccupied: boolean }[] = [];
    for (let i = 0; i < total; i++) {
      const label = String(start + i);
      slots.push({
        keyHubId: expandedHubId!,
        slotLabel: label,
        rowOrder: existingMaxRow + startRowOffset + Math.floor(i / cols),
        columnOrder: (i % cols) + 1,
        rowName: label,
        isOccupied: false,
      });
    }
    return slots;
  };

  const bulkPreviewSlots = React.useMemo(() => {
    return generateBulkSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkTotal, bulkColumns, bulkStartFrom, expandedHubId, hubSlots]);

  // Group preview slots by row for display
  const bulkPreviewGrouped = React.useMemo(() => {
    const grouped = new Map<number, { row: number; slots: typeof bulkPreviewSlots }>();
    for (const slot of bulkPreviewSlots) {
      if (!grouped.has(slot.rowOrder)) {
        grouped.set(slot.rowOrder, { row: slot.rowOrder, slots: [] });
      }
      grouped.get(slot.rowOrder)!.slots.push(slot);
    }
    return Array.from(grouped.values());
  }, [bulkPreviewSlots]);

  const handleBulkCreate = async () => {
    if (bulkPreviewSlots.length === 0 || !expandedHubId) return;

    setButtonLoading(true);
    try {
      console.log("[KeySlot BULK CREATE] Request:", { slots: bulkPreviewSlots });

      const response = await fetch("/api/keyslot/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: bulkPreviewSlots }),
      });
      const result = await response.json();

      console.log("[KeySlot BULK CREATE] Response:", result);

      if (
        result?.result?.status === "200" ||
        result?.result?.status === 200
      ) {
        fetchSlotsByHub(expandedHubId);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `${bulkPreviewSlots.length} slot${bulkPreviewSlots.length > 1 ? "s" : ""} created successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
        resetBulkForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Failed to create slots.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error creating slots:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while creating slots.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const handleUpdateSlot = async () => {
    if (!slotLabel.trim() || !slotRowName.trim() || !expandedHubId || !editingSlotId) return;

    setButtonLoading(true);
    try {
      const payload = {
        id: editingSlotId,
        slotLabel: slotLabel.trim(),
        rowOrder: Number(slotRowOrder) || 1,
        columnOrder: Number(slotColumnOrder) || 1,
        rowName: slotRowName.trim(),
        isActive: true,
        isOccupied: false,
      };

      console.log("[KeySlot UPDATE] Request:", payload);

      const response = await fetch("/api/keyslot/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      console.log("[KeySlot UPDATE] Response:", result);

      if (
        result?.result?.status === "200" ||
        result?.result?.status === 200
      ) {
        fetchSlotsByHub(expandedHubId);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Slot "${slotLabel}" updated successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
        resetSlotForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Failed to update slot.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while updating this slot.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSlotIds.size === hubSlots.length) {
      setSelectedSlotIds(new Set());
    } else {
      setSelectedSlotIds(new Set(hubSlots.map((s) => s.id!)));
    }
  };

  const deleteSelectedSlots = async () => {
    if (selectedSlotIds.size === 0 || !expandedHubId) return;

    const count = selectedSlotIds.size;
    Swal.fire({
      title: `Delete ${count} Slot${count > 1 ? "s" : ""}?`,
      text: `${count} slot${count > 1 ? "s" : ""} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: `Yes, delete ${count > 1 ? "them" : "it"}`,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setButtonLoading(true);
      try {
        const ids = Array.from(selectedSlotIds);
        console.log("[KeySlot DELETE] Request:", { ids });

        const response = await fetch("/api/keyslot/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const res = await response.json();

        console.log("[KeySlot DELETE] Response:", res);

        if (res?.result?.status === "200" || res?.result?.status === 200) {
          setHubSlots((prev) => prev.filter((s) => !selectedSlotIds.has(s.id!)));
          setSelectedSlotIds(new Set());
          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: `${count} slot${count > 1 ? "s" : ""} deleted successfully.`,
            confirmButtonColor: getPrimaryThemeColor(),
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res?.result?.message || "Failed to delete slots.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        }
      } catch (err) {
        console.error("Error deleting slots:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while deleting slots.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } finally {
        setButtonLoading(false);
      }
    });
  };

  // ── Grouped slots for preview ──────────────────────────────

  const groupedSlots = React.useMemo(() => {
    const grouped = new Map<number, { name: string; slots: KeySlot[] }>();
    const sorted = [...hubSlots].sort(
      (a, b) => a.rowOrder - b.rowOrder || a.columnOrder - b.columnOrder
    );
    for (const slot of sorted) {
      if (!grouped.has(slot.rowOrder)) {
        grouped.set(slot.rowOrder, {
          name: slot.rowName || `Row ${slot.rowOrder}`,
          slots: [],
        });
      }
      grouped.get(slot.rowOrder)!.slots.push(slot);
    }
    return Array.from(grouped.values());
  }, [hubSlots]);

  return (
    <div className="bg-white text-slate-800">
      <div className="space-y-5 p-5">
        {/* ── KeyHub Form ──────────────────────────────────── */}
        <section className="rounded-4xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {editingHubId ? "Update Key Hub" : "Add New Key Hub"}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Configure key hubs and their slot layout for this property.
            </p>
          </div>

          <form className="grid grid-cols-1 gap-3">
            <FormInput
              name="hubName"
              placeholder="Key Hub Name (e.g. Main Valet Key Box)"
              icon={<FaKey />}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onClear={() => setFormName("")}
            />

            <FormInput
              name="displayOrder"
              placeholder="Display Order (e.g. 1)"
              icon={<MdGridOn />}
              value={formDisplayOrder}
              onChange={(e) => setFormDisplayOrder(e.target.value)}
              onClear={() => setFormDisplayOrder("0")}
              inputMode="numeric"
            />

            <button
              type="button"
              onClick={handleSubmitHub}
              disabled={buttonLoading || !formName.trim()}
              className={`flex h-12 items-center justify-center rounded-2xl px-7 text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition ${
                buttonLoading || !formName.trim()
                  ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-70"
                  : "cursor-pointer bg-primary hover:bg-secondary"
              }`}
            >
              {buttonLoading ? (
                <ButtonLoader />
              ) : editingHubId ? (
                "Update"
              ) : (
                "Add"
              )}
            </button>
          </form>

          {editingHubId && (
            <button
              type="button"
              onClick={resetHubForm}
              className="mt-3 text-xs font-bold text-slate-400 transition hover:text-primary"
            >
              Cancel editing
            </button>
          )}
        </section>

        {/* ── KeyHub List ──────────────────────────────────── */}
        <section className="rounded-4xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Registered Key Hubs
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {hubs.length} key hub(s)
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
              <FaKey className="h-5 w-5" />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {hubs.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No key hubs configured yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {hubs.map((hub) => (
                  <div
                    key={hub.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 transition hover:border-(--primary-light) hover:bg-[color-mix(in_srgb,var(--primary-soft)_50%,transparent)]"
                  >
                    {/* Hub header */}
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => toggleExpandHub(hub.id!)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-extrabold text-slate-950">
                            {hub.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              hub.isActive !== false
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {hub.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Order: {hub.displayOrder}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={buttonLoading}
                          onClick={() => handleEditHub(hub)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-(--primary-soft) hover:text-primary disabled:opacity-50"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={buttonLoading}
                          onClick={() => deleteHub(hub.id!)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          title="Delete"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    {/* Expanded slots panel */}
                    {expandedHubId === hub.id && (
                      <div className="border-t border-slate-200 p-4">
                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-8">
                            <ButtonLoader />
                          </div>
                        ) : (
                          <>
                            {/* Slot form — Edit mode */}
                            {editingSlotId ? (
                              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
                                  Editing Slot
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <FormInput
                                    name="slotLabel"
                                    placeholder="Label (e.g. 1)"
                                    icon={<FaKey />}
                                    value={slotLabel}
                                    onChange={(e) =>
                                      setSlotLabel(e.target.value)
                                    }
                                    onClear={() => setSlotLabel("")}
                                  />
                                  <FormInput
                                    name="rowName"
                                    placeholder="Row Name"
                                    icon={<MdGridOn />}
                                    value={slotRowName}
                                    onChange={(e) =>
                                      setSlotRowName(e.target.value)
                                    }
                                    onClear={() => setSlotRowName("")}
                                  />
                                  <FormInput
                                    name="rowOrder"
                                    placeholder="Row Order"
                                    icon={<MdGridOn />}
                                    value={slotRowOrder}
                                    onChange={(e) =>
                                      setSlotRowOrder(e.target.value)
                                    }
                                    onClear={() => setSlotRowOrder("1")}
                                    inputMode="numeric"
                                  />
                                  <FormInput
                                    name="columnOrder"
                                    placeholder="Column Order"
                                    icon={<MdGridOn />}
                                    value={slotColumnOrder}
                                    onChange={(e) =>
                                      setSlotColumnOrder(e.target.value)
                                    }
                                    onClear={() => setSlotColumnOrder("1")}
                                    inputMode="numeric"
                                  />
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleUpdateSlot}
                                    disabled={
                                      buttonLoading ||
                                      !slotLabel.trim() ||
                                      !slotRowName.trim()
                                    }
                                    className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition ${
                                      buttonLoading ||
                                      !slotLabel.trim() ||
                                      !slotRowName.trim()
                                        ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-70"
                                        : "cursor-pointer bg-primary hover:bg-secondary"
                                    }`}
                                  >
                                    {buttonLoading ? (
                                      <ButtonLoader />
                                    ) : (
                                      "Update Slot"
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={resetSlotForm}
                                    className="rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-400 transition hover:text-primary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Slot form — Bulk create mode */
                              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3">
                                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                  Add Slots
                                </p>
                                <p className="mb-3 text-[11px] text-slate-400">
                                  {hubSlots.length > 0
                                    ? `${hubSlots.length} existing — new slots will continue from label ${bulkStartFrom}`
                                    : "Configure the grid layout and generate slots"}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  <FormInput
                                    name="bulkTotal"
                                    placeholder="How many slots"
                                    icon={<FaPlus />}
                                    value={bulkTotal}
                                    onChange={(e) =>
                                      setBulkTotal(e.target.value)
                                    }
                                    onClear={() => setBulkTotal("")}
                                    inputMode="numeric"
                                  />
                                  <FormInput
                                    name="bulkColumns"
                                    placeholder="Columns per row"
                                    icon={<MdGridOn />}
                                    value={bulkColumns}
                                    onChange={(e) =>
                                      setBulkColumns(e.target.value)
                                    }
                                    onClear={() => setBulkColumns("5")}
                                    inputMode="numeric"
                                  />
                                  <FormInput
                                    name="bulkStartFrom"
                                    placeholder="Start from"
                                    icon={<FaKey />}
                                    value={bulkStartFrom}
                                    onChange={(e) =>
                                      setBulkStartFrom(e.target.value)
                                    }
                                    onClear={() => setBulkStartFrom("1")}
                                    inputMode="numeric"
                                  />
                                </div>

                                {/* Bulk preview */}
                                {bulkPreviewGrouped.length > 0 && (
                                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2">
                                    <p className="mb-1.5 text-[10px] font-bold text-slate-400">
                                      Preview — {bulkPreviewSlots.length} slot{bulkPreviewSlots.length > 1 ? "s" : ""} in {bulkPreviewGrouped.length} row{bulkPreviewGrouped.length > 1 ? "s" : ""}
                                    </p>
                                    <div className="space-y-1.5">
                                      {bulkPreviewGrouped.map((row) => (
                                        <div key={row.row} className="flex flex-wrap gap-1">
                                          {row.slots.map((slot) => (
                                            <span
                                              key={`${slot.rowOrder}-${slot.columnOrder}`}
                                              className="flex h-8 w-8 items-center justify-center rounded border border-blue-200 bg-blue-50 text-[9px] font-bold text-blue-500"
                                            >
                                              {slot.slotLabel}
                                            </span>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={handleBulkCreate}
                                  disabled={
                                    buttonLoading ||
                                    bulkPreviewSlots.length === 0
                                  }
                                  className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition ${
                                    buttonLoading ||
                                    bulkPreviewSlots.length === 0
                                      ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-70"
                                      : "cursor-pointer bg-primary hover:bg-secondary"
                                  }`}
                                >
                                  {buttonLoading ? (
                                    <ButtonLoader />
                                  ) : (
                                    <>
                                      <FaPlus className="h-3 w-3" />
                                      Create {bulkPreviewSlots.length || ""} Slot{bulkPreviewSlots.length !== 1 ? "s" : ""}
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Slots visual preview */}
                            {groupedSlots.length > 0 && (
                              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Slot Layout Preview
                                  </p>
                                  <button
                                    type="button"
                                    onClick={toggleSelectAll}
                                    className="text-[10px] font-bold text-slate-400 transition hover:text-primary"
                                  >
                                    {selectedSlotIds.size === hubSlots.length
                                      ? "Deselect All"
                                      : "Select All"}
                                  </button>
                                </div>

                                {selectedSlotIds.size > 0 && (
                                  <div className="mb-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                                    <p className="text-xs font-bold text-red-600">
                                      {selectedSlotIds.size} slot{selectedSlotIds.size > 1 ? "s" : ""} selected
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSlotIds(new Set())}
                                        className="text-[10px] font-bold text-slate-500 transition hover:text-slate-700"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={deleteSelectedSlots}
                                        disabled={buttonLoading}
                                        className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-red-600 disabled:opacity-50"
                                      >
                                        <FaTrash className="h-2.5 w-2.5" />
                                        Delete Selected
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  {groupedSlots.map((row) => (
                                    <div key={row.name}>
                                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                        {row.name}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {row.slots.map((slot) => {
                                          const isSelected = selectedSlotIds.has(slot.id!);
                                          return (
                                            <div
                                              key={slot.id || `${slot.rowOrder}-${slot.columnOrder}`}
                                              className="group/slot relative"
                                            >
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleEditSlot(slot)
                                                }
                                                className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition ${
                                                  isSelected
                                                    ? "border-red-400 bg-red-100 text-red-500 ring-1 ring-red-300"
                                                    : slot.isOccupied
                                                      ? "border-red-200 bg-red-50 text-red-400"
                                                      : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-primary hover:bg-(--primary-soft)"
                                                }`}
                                                title={`Slot ${slot.slotLabel} — Click to edit`}
                                              >
                                                {slot.slotLabel}
                                                <span
                                                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                                                    slot.isOccupied
                                                      ? "bg-red-400"
                                                      : "bg-emerald-400"
                                                  }`}
                                                />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  toggleSlotSelection(slot.id!)
                                                }
                                                className={`absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full text-[8px] text-white transition ${
                                                  isSelected
                                                    ? "flex bg-red-500"
                                                    : "hidden bg-slate-400 group-hover/slot:flex"
                                                }`}
                                                title={isSelected ? "Deselect" : "Select for deletion"}
                                              >
                                                {isSelected ? "✓" : "○"}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Slots list */}
                            {hubSlots.length === 0 && (
                              <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                                <p className="text-xs font-semibold text-slate-400">
                                  No slots configured for this hub.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
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

const KeyHubCMS: React.FC<{
  keyHubs: KeyHub[];
  fetchKeyHubs: () => void;
}> = ({ keyHubs, fetchKeyHubs }) => {
  return (
    <div className="overflow-hidden bg-white">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 text-center">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Key Management
        </span>
        <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
          Key Hub Manager
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Configure key hubs and their slot layout for organizing valet keys on
          this property.
        </p>
      </div>
      <KeyHubManager fetchKeyHubs={fetchKeyHubs} keyHubs={keyHubs || []} />
    </div>
  );
};

export default KeyHubCMS;
