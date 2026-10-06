"use client";
import { useMemo, useEffect, useState, useCallback } from "react";
import { KeyHub, KeySlot } from "../types";
import { useProperty } from "../context/PropertyContext";

interface KeyBoxSelectorProps {
  selectedSlot: KeySlot | null;
  onSelectSlot: (slot: KeySlot | null) => void;
}

export default function KeyBoxSelector({
  selectedSlot,
  onSelectSlot,
}: KeyBoxSelectorProps) {
  const { propertyId } = useProperty();
  const [keyHubs, setKeyHubs] = useState<KeyHub[]>([]);
  const [activeHubId, setActiveHubId] = useState<string | null>(null);
  const [slots, setSlots] = useState<KeySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeyHubs = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/keyhub/getByProperty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const result = await response.json();
      const hubs: KeyHub[] = (result?.result?.data || []).filter(
        (h: KeyHub) => h.isActive !== false
      );
      setKeyHubs(hubs);

      if (hubs.length > 0) {
        const firstHub = hubs[0];
        setActiveHubId(firstHub.id || null);
      }
    } catch (error) {
      console.error("Error fetching key hubs:", error);
      setKeyHubs([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const fetchSlots = useCallback(async (keyHubId: string) => {
    try {
      const response = await fetch("/api/keyslot/getByKeyhub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyHubId }),
      });
      const result = await response.json();
      setSlots(result?.result?.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    }
  }, []);

  useEffect(() => {
    fetchKeyHubs();
  }, [fetchKeyHubs]);

  useEffect(() => {
    if (activeHubId) {
      fetchSlots(activeHubId);
    } else {
      setSlots([]);
    }
  }, [activeHubId, fetchSlots]);

  const activeHub = useMemo(
    () => keyHubs.find((h) => h.id === activeHubId),
    [keyHubs, activeHubId]
  );

  const rows = useMemo(() => {
    const grouped = new Map<number, { name: string; slots: KeySlot[] }>();

    const sorted = [...slots].sort(
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
  }, [slots]);

  if (loading) {
    return (
      <section>
        <h3 className="mb-5 border-l-4 border-primary pl-3 font-serif text-lg font-bold text-slate-900">
          Key Slot
        </h3>
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
          <p className="text-sm text-slate-400">Loading key hubs...</p>
        </div>
      </section>
    );
  }

  if (keyHubs.length === 0) {
    return (
      <section>
        <h3 className="mb-5 border-l-4 border-primary pl-3 font-serif text-lg font-bold text-slate-900">
          Key Slot
        </h3>
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
          <p className="text-sm text-slate-400">
            No key hubs configured for this property.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-5 border-l-4 border-primary pl-3 font-serif text-lg font-bold text-slate-900">
        Key Slot
      </h3>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
        {/* Hub selector tabs (when multiple hubs) */}
        {keyHubs.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {keyHubs.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  setActiveHubId(hub.id || null);
                  onSelectSlot(null);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeHubId === hub.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-slate-500 hover:bg-slate-100"
                }`}
              >
                {hub.name}
              </button>
            ))}
          </div>
        )}

        {/* Key box name */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg
              className="h-3.5 w-3.5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {activeHub?.name || "KEY BOX"}
          </p>
        </div>

        {/* Rows */}
        {slots.length === 0 ? (
          <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
            <p className="text-xs text-slate-400">
              No slots configured for this hub.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {rows.map((row) => (
              <div key={row.name}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {row.name}
                </p>

                {/* Slots — responsive grid */}
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
                  {row.slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.slotLabel === slot.slotLabel &&
                      selectedSlot?.rowOrder === slot.rowOrder;
                    const isOccupied = slot.isOccupied;

                    return (
                      <button
                        key={`${slot.rowOrder}-${slot.columnOrder}`}
                        type="button"
                        disabled={isOccupied}
                        onClick={() =>
                          onSelectSlot(isSelected ? null : slot)
                        }
                        className={`group relative flex flex-col items-center gap-1 rounded-xl border-2 pb-2 pt-2.5 transition-all
                          ${
                            isOccupied
                              ? "cursor-not-allowed border-transparent bg-slate-100 text-slate-300"
                              : isSelected
                                ? "border-primary bg-white text-primary shadow-[0_2px_10px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                                : "cursor-pointer border-transparent bg-white text-slate-600 shadow-sm hover:border-primary/30 hover:shadow-md active:scale-95"
                          }`}
                      >
                        {/* Hook */}
                        <div
                          className={`mx-auto h-2 w-3 rounded-t-full border-[1.5px] border-b-0 transition-colors sm:h-2.5 sm:w-3.5
                            ${
                              isOccupied
                                ? "border-slate-200"
                                : isSelected
                                  ? "border-primary"
                                  : "border-slate-300 group-hover:border-primary/50"
                            }`}
                        />

                        {/* Label */}
                        <span className="text-[11px] font-bold leading-none sm:text-xs">
                          {slot.slotLabel}
                        </span>

                        {/* Status dot */}
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOccupied ? "bg-red-400" : "bg-emerald-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selection feedback */}
        {selectedSlot && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3 py-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span className="text-xs text-slate-500">Selected:</span>
            <span className="text-sm font-bold text-primary">
              Slot {selectedSlot.slotLabel}
            </span>
            <button
              type="button"
              onClick={() => onSelectSlot(null)}
              className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
