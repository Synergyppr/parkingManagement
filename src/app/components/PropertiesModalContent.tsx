"use client";

import { useState } from "react";
import Modal from "./Modal";
import PropertyForm from "./PropertyForm";
import { FaPencil, FaPlus } from "react-icons/fa6";

interface Property {
  id?: string;
  tenantId?: string;
  tenant?: string;
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
}

export default function PropertiesModalContent({
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#ef6c00] tracking-tight">
            Properties
          </h2>
          <button
            onClick={() => {
              setSelectedProperty(null);
              setIsPropertyFormOpen(true);
            }}
            className="cursor-pointer px-2.5 py-1 rounded-lg text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600/80 hover:shadow-md delay-300 duration-700 transition-colors text-white"
          >
            <FaPlus className="inline w-3 h-3" />
          </button>
        </div>

        {properties?.length === 0 ? (
          <p className="text-gray-500">No properties found.</p>
        ) : (
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto text-gray-700 text-sm">
            {properties?.map((property) => (
              <li
                key={property?.id}
                className="relative group rounded-md overflow-hidden border border-blue-200/60 bg-slate-300/60 shadow-sm"
              >
                {/* Hover Overlay */}
                {/* <div className="absolute inset-0 bg-slate/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"></div> */}

                {/* Edit Button */}
                <button
                  onClick={() => {
                    setSelectedProperty({
                      id: property?.id as string,
                      tenantId: tenantId as string,
                      name: property?.name as string,
                      address: property?.address as string,
                      isActive: property?.isActive as boolean,
                      createdAtDateTime: property?.createdAtDateTime,
                    });
                    setIsPropertyFormOpen(true);
                  }}
                  className="cursor-pointer absolute bottom-2 right-2 z-20 p-1.5 bg-white/80 text-gray-700 rounded-full hover:bg-white transition-all hover:text-sky-600 hover:shadow-md"
                  title="Edit property"
                >
                  <FaPencil className="w-3.5 h-3.5" />
                </button>

                {/* Property Info Content */}
                <div className="relative z-0 p-4 text-gray-700 text-sm">
                  <p>
                    <strong className="text-gray-800 tracking-tight">
                      Name:
                    </strong>{" "}
                    {property?.name}
                  </p>
                  <p>
                    <strong className="text-gray-800 tracking-tight">
                      Address:
                    </strong>{" "}
                    {property?.address}
                  </p>
                  <p>
                    <strong className="text-gray-800 tracking-tight">
                      Tenant:
                    </strong>{" "}
                    {property?.tenant}
                  </p>
                  <p>
                    <strong className="text-gray-800 tracking-tight">
                      Status:
                    </strong>{" "}
                    <span
                      className={`text-sm font-semibold tracking-tight ${
                        property?.isActive ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {property?.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-700">
                    Created:{" "}
                    {new Date(property?.createdAtDateTime).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
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
          initialData={
            selectedProperty
              ? {
                  id: selectedProperty?.id ?? "",
                  tenantId: selectedProperty?.tenantId ?? "",
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
