"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { FaPencil, FaTrash } from "react-icons/fa6";
import TenantForm from "./TenantForm";
import Modal from "./Modal";
import UsersModalContent from "./UsersModalContent";
import PropertiesModalContent from "./PropertiesModalContent";

interface Tenant {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive?: boolean;
}

interface User {
  id: string;
  role: string;
  userName: string;
  fullName: string;
  gender: string;
  identifier: string;
  isActive: boolean;
  createdDateTime: string;
}

interface Property {
  id: string;
  tenant: string;
  name: string;
  address: string;
  createdAtDateTime: string;
  isActive: boolean;
}

interface TenantsProps {
  data: {
    data: Tenant[] | null;
  };
}

const Tenants = ({ data }: TenantsProps) => {
  const tenants = data?.data;
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const getUsersByTenant = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const res = await fetch("/api/users/getUsers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tenantId }),
    });

    const data = await res.json();
    const result = data?.result?.data;
    setUsers(result || []);
    setIsUserModalOpen(true);
  };

  const getPropertiesByTenant = async (tenantId: string) => {
    const res = await fetch("/api/properties/getProperties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tenantId }),
    });

    const data = await res.json();
    const result = data?.result?.data;
    setProperties(result || []);
    setIsPropertyModalOpen(true);
  };

  const handleTenantDelete = async (tenantId: string) => {
    Swal.fire({
      theme: "dark",
      title: "Delete Tenant",
      text: "You are about to delete this tenant. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, go back",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(`/api/tenants/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tenantId),
        });

        const result = await res.json();

        if (result) {
          alert("Tenant deleted successfully!");
        } else {
          alert("Failed to delete tenant.");
        }
      }
    });
  };

  const handleOpenForCreate = () => {
    setSelectedTenant(null);
    setIsTenantModalOpen(true);
  };

  const handleOpenForEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setSelectedTenantId(tenant?.id);
    setIsTenantModalOpen(true);
  };

  const handleCloseTenantModal = () => {
    setIsTenantModalOpen(false);
    setSelectedTenant(null);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setUsers([]);
  };

  const handleClosePropertyModal = () => {
    setIsPropertyModalOpen(false);
    setProperties([]);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-20 px-4 overflow-y-auto mb-4 min-h-[81vh]">
      <h1 className="text-4xl font-bold mb-4">Tenants</h1>
      <p className="text-lg text-gray-600">Manage your tenants here.</p>

      <div className="w-full max-w-5xl mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Tenant List</h2>
            <p className="text-gray-300 text-xs">
              {tenants?.length ?? 0} records
            </p>
          </div>
          <button
            onClick={handleOpenForCreate}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors tracking-tight"
          >
            Add Tenant
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants?.map((tenant) => (
            <div
              key={tenant?.id}
              className="p-6 bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {tenant?.name}
                </h3>
                <div>
                  <button
                    onClick={() => handleOpenForEdit(tenant)}
                    className="text-sm border-y-1 border-r-0 border-l-1 py-1 px-2 rounded-l-md border-gray-100 text-white bg-blue-600"
                  >
                    <FaPencil className="inline ml-1" />
                  </button>

                  <button
                    onClick={() => handleTenantDelete(tenant?.id)}
                    className="text-sm border-y-1 border-r-1 border-l-0 py-1 px-2 rounded-r-md border-gray-100 text-white bg-gray-600"
                  >
                    <FaTrash className="inline mr-1" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-2">{tenant?.type}</p>
              {tenant?.description && (
                <p className="text-gray-600 text-sm mb-2">
                  {tenant?.description}
                </p>
              )}

              <button
                onClick={() => getUsersByTenant(tenant?.id)}
                className="text-blue-600 underline text-sm mb-2 hover:text-blue-800 block"
              >
                View Users
              </button>

              <button
                onClick={() => getPropertiesByTenant(tenant?.id)}
                className="text-blue-600 underline text-sm mb-2 hover:text-blue-800 block"
              >
                View Properties
              </button>

              <span
                className={`inline-block px-3 py-1 text-xs rounded-full ${
                  tenant.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {tenant?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Modal */}
      <Modal isOpen={isTenantModalOpen} onClose={handleCloseTenantModal}>
        <TenantForm
          initialData={selectedTenant || null}
          handleCloseTenantModal={handleCloseTenantModal}
        />
      </Modal>

      <UsersModalContent
        tenantId={selectedTenantId || ""}
        users={users}
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
      />

      <PropertiesModalContent
        tenantId={selectedTenantId || ""}
        properties={properties}
        isOpen={isPropertyModalOpen}
        onClose={handleClosePropertyModal}
      />
    </div>
  );
};

export default Tenants;
