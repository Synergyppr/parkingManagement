"use client";
import { useState } from "react";
import { FaPencil, FaPlus } from "react-icons/fa6";
import Modal from "./Modal";
import PropertyForm from "./PropertyForm";

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

interface Props {
  tenantId?: string;
  properties: Property[] | undefined;
  onClose: () => void;
  isOpen: boolean;
  refresh: (id: string) => void;
}

export default function PropertyListModal({
  tenantId,
  properties,
  isOpen,
  onClose,
}: Props) {
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<Partial<Property> | null>(null);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="overflow-hidden rounded-4xl bg-white">
          <div className="border-b border-slate-200 bg-linear-to-br from-white via-amber-50/60 to-white px-5 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
                  Property Directory
                </span>

                <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-950">
                  Properties
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage valet locations, addresses, tenant assignments, and
                  property status.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedProperty(null);
                  setIsPropertyFormOpen(true);
                }}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)] transition hover:bg-amber-600"
                title="Add property"
              >
                <FaPlus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Total Properties
                </p>
                <p className="text-sm font-extrabold text-slate-950">
                  {properties?.length || 0} records
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                Locations
              </span>
            </div>
          </div>

          <div className="p-5">
            {!properties || properties.length === 0 ? (
              <div className="flex min-h-45 flex-col items-center justify-center rounded-4xl border border-dashed border-amber-200 bg-amber-50/40 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600 ring-1 ring-amber-200">
                  <FaPlus className="h-4 w-4" />
                </div>

                <p className="font-serif text-xl font-bold text-slate-950">
                  No properties found
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create your first property to begin managing valet locations.
                </p>
              </div>
            ) : (
              <ul className="grid max-h-[62vh] grid-cols-1 gap-4 overflow-y-auto pr-1 text-sm sm:grid-cols-2">
                {properties.map((property) => (
                  <li
                    key={property?.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-amber-200 hover:bg-amber-50/30 hover:shadow-md"
                  >
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-100/60 transition group-hover:bg-amber-200/70" />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProperty({
                          id: property?.id as string,
                          tenantId: tenantId as string,
                          name: property?.name as string,
                          address: property?.address as string,
                          isActive: property?.isActive as boolean,
                          createdAtDateTime: property?.createdAtDateTime,
                          latitude: property?.latitude as number,
                          longitude: property?.longitude as number,
                          radius: property?.radius as number,
                        });
                        setIsPropertyFormOpen(true);
                      }}
                      className="absolute right-4 top-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-amber-200 bg-white text-amber-600 shadow-sm transition hover:scale-105 hover:bg-amber-500 hover:text-white"
                      title="Edit property"
                    >
                      <FaPencil className="h-3.5 w-3.5" />
                    </button>

                    <div className="relative z-10 p-5 pr-16">
                      <div className="mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                          Property
                        </p>

                        <h3 className="mt-1 line-clamp-2 font-serif text-2xl font-bold leading-tight text-slate-950">
                          {property?.name || "Unnamed Property"}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <InfoRow label="Address" value={property?.address} />

                        <InfoRow label="Tenant" value={property?.tenant} />

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Status
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
                              property?.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-red-50 text-red-700 ring-red-200"
                            }`}
                          >
                            {property?.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="border-t border-amber-100 pt-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Created
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {property?.createdAtDateTime
                              ? new Date(
                                  property.createdAtDateTime
                                ).toLocaleString([], {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPropertyFormOpen}
        onClose={() => {
          setIsPropertyFormOpen(false);
          setSelectedProperty(null);
        }}
      >
        <PropertyForm
          tenantId={tenantId as string}
          setModalOpen={setIsPropertyFormOpen}
          originalData={
            selectedProperty
              ? {
                  id: selectedProperty?.id ?? "",
                  tenantId: selectedProperty?.tenantId ?? "",
                  latitude: Number(selectedProperty?.latitude),
                  longitude: Number(selectedProperty?.longitude),
                  radius: selectedProperty?.radius ?? 0,
                  name: selectedProperty?.name ?? "",
                  address: selectedProperty?.address ?? "",
                  createdAtDateTime: selectedProperty?.createdAtDateTime ?? "",
                  isActive: selectedProperty?.isActive ?? false,
                }
              : null
          }
        />
      </Modal>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}