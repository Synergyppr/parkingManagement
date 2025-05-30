"use client";

import { useState } from "react";
import Modal from "./Modal";
import PropertyForm from "./PropertyForm";
import { FaPencil } from "react-icons/fa6";

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
          <h2 className="text-xl font-bold text-blue-500">Properties</h2>
          <button
            onClick={() => {
              setSelectedProperty(null);
              setIsPropertyFormOpen(true);
            }}
            className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 text-sm"
          >
            + Add Property
          </button>
        </div>

        {properties?.length === 0 ? (
          <p className="text-gray-500">No properties found.</p>
        ) : (
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-gray-200 text-sm">
            {properties?.map((property) => (
              <li
                key={property?.id}
                className="p-4 border border-gray-600 rounded-md shadow-sm"
              >
                <p>
                  <strong className="text-gray-400 tracking-tight">
                    Name:
                  </strong>{" "}
                  {property?.name}
                </p>
                <p>
                  <strong className="text-gray-400 tracking-tight">
                    Address:
                  </strong>{" "}
                  {property?.address}
                </p>
                <p>
                  <strong className="text-gray-400 tracking-tight">
                    Tenant:
                  </strong>{" "}
                  {property?.tenant}
                </p>
                <p>
                  <strong className="text-gray-400 tracking-tight">
                    Status:
                  </strong>{" "}
                  <span
                    className={`text-sm font-semibold ${
                      property?.isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {property?.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Created:{" "}
                  {new Date(property?.createdAtDateTime).toLocaleString()}
                </p>
                <div className="flex flex-end justify-end-safe">
                  <button
                    onClick={() => {
                      setSelectedProperty({
                        id: property?.id as string,
                        tenantId: tenantId as string,
                        name: property?.name as string,
                        address: property?.address as string,
                        isActive: property?.isActive as boolean,
                      });
                      setIsPropertyFormOpen(true);
                    }}
                    className="text-sm py-1 px-3 rounded-md text-white bg-blue-600"
                  >
                    <FaPencil className="inline" />
                  </button>
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
                  id: selectedProperty.id ?? "",
                  tenantId: selectedProperty.tenantId ?? "",
                  name: selectedProperty.name ?? "",
                  address: selectedProperty.address ?? "",
                  createdAtDateTime: selectedProperty.createdAtDateTime ?? "",
                  isActive: selectedProperty.isActive ?? false,
                }
              : null
          }
        />
      </Modal>
    </>
  );
}
