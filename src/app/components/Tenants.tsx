"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  handleTenantDelete,
  getUsersByTenant,
  getPropertiesByTenant,
} from "../helpers/propertyHelpers";
import { Tenant, UserForm as UserFormType, Property } from "../types";
import { FaPencil, FaTrash, FaRegCreditCard } from "react-icons/fa6";
import { FaCar } from "react-icons/fa";
import { MdOutlineImportantDevices } from "react-icons/md";
import { PiUsersThreeFill } from "react-icons/pi";
import { BsFillBuildingsFill } from "react-icons/bs";
import { useProperty } from "../context/PropertyContext";
import { formatDateOfBirth } from "../lib/clientUtils";
import Modal from "./Modal";
import TenantForm from "./TenantForm";
import ListModal from "./ListModal";
import PropertyForm from "./PropertyForm";
import UserForm from "./UserForm";
import VehicleManager from "./VehicleManager";
import DeviceCMS from "./DeviceManager";
import TransactionTypeManager from "./TransactionTypeManager";
import PageLoader from "./elements/PageLoader";

interface TenantsProps {
  data: {
    data: Tenant[] | null;
  };
}

interface Entry {
  id: number;
  name: string;
  isActive: boolean;
}

interface DropdownData {
  carBrands: {
    id: number;
    name: string;
    isActive: boolean;
    models: Entry[];
  }[];
  vehicleTypes: Entry[];
  vehicleColors: Entry[];
}

const Tenants = ({ data }: TenantsProps) => {
  const tenants = data?.data;
  const { propertyId } = useProperty();
  const router = useRouter();
  const [tenantData, setTenantData] = useState(data?.data);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [initialUsers, setInitialUsers] = useState<UserFormType[]>([]);
  const [users, setUsers] = useState<UserFormType[]>([]);
  const [initialProperties, setInitialProperties] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [seeMore, setSeeMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehiclesDropdownData, setVehiclesDropdownData] =
    useState<DropdownData | null>(null);
  const [devicesDropdownData, setDevicesDropdownData] = useState(null);
  const [transactionTypesDropdownData, setTransactionTypesDropdownData] =
    useState(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<
    UserFormType | Property | null
  >(null);

  const handleCloseForm = (form?: string) => {
    if (form === "user") setIsUserFormOpen(false);
    if (form === "property") setIsPropertyFormOpen(false);
    setSelectedEntity(null);
  };

  const refreshProperties = () => {
    if (!selectedTenantId) return;
    getPropertiesByTenant(
      selectedTenantId,
      setSelectedTenantId,
      setLoading,
      setInitialProperties,
      setProperties,
      setIsPropertyModalOpen
    );
  };

  const refreshUsers = (id: string) => {
    if (!id) return;
    getUsersByTenant(
      id,
      setLoading,
      setSelectedTenantId,
      setInitialUsers,
      setUsers,
      setIsUserModalOpen
    );
  };

  useEffect(() => {
    if (propertyId) {
      setLoading(false);
    }
    if (tenantData) {
      setTenantData(tenantData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tenantData) {
      setLoading(false);
    }
  }, [tenantData]);

  useEffect(() => {
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantData]);

  const fetchVehicleDropdownData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/getVehicle/dropdownData", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result?.data?.status == "200") {
        setVehiclesDropdownData(result?.data?.data);
        setIsVehicleModalOpen(true);
      } else {
        setLoading(true);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch dropdown data.",
        });
        return;
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching dropdown data:", error);
      return;
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDevices = async () => {
    setLoading(true);
    try {
      const sendForm = {
        id: propertyId as string,
      };
      const response = await fetch("/api/devices/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendForm),
      });

      const result = await response.json();

      if (result?.result?.status == "200") {
        setDevicesDropdownData(result?.result?.data);
        setIsDeviceModalOpen(true);
      } else {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch dropdown data.",
        });
        return;
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching dropdown data:", error);
      return;
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionTypes = async () => {
    setLoading(true);
    try {
      const sendForm = {
        id: propertyId as string,
      };
      const response = await fetch("/api/valetTransaction/types/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendForm),
      });

      const result = await response.json();

      if (result?.result?.status == "200") {
        setTransactionTypesDropdownData(result?.result?.data);
        setIsTransactionModalOpen(true);
      } else {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch dropdown data.",
        });
        return;
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching dropdown data:", error);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTenantModal = (tenant: Tenant | null) => {
    if (!tenant || tenant === null || !tenant.id) {
      setSelectedTenant(null);
      setIsTenantModalOpen(true);
    } else {
      setSelectedTenant(tenant);
      setSelectedTenantId(tenant?.id);
      setIsTenantModalOpen(true);
    }
  };

  const handleCloseTenantModal = () => {
    setIsTenantModalOpen(false);
    setIsUserModalOpen(false);
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

  const handleCloseVehicleModal = () => {
    setIsVehicleModalOpen(false);
  };
  const handleOpenVehicleModal = () => {
    if (!propertyId) return;
    fetchVehicleDropdownData();
  };

  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false);
  };
  const handleOpenDeviceModal = () => {
    if (!propertyId) return;
    fetchPropertyDevices();
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
  };
  const handleOpenTransactionModal = () => {
    if (!propertyId) return;
    fetchTransactionTypes();
  };

  return (
    <>
      {loading === true && propertyId && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-70 z-50 flex items-center justify-center">
          <div className="flex flex-col h-auto">
            <PageLoader />
            <p className="text-white text-sm font-light mt-1 relative bottom-[80px] md:bottom-[150px] lg:bottom-[175px]">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          background:
            "radial-gradient(circle at center, #86b2f9 10%, #e0f2ff 90%)",
        }}
        className="flex flex-col items-start overflow-y-auto pb-4 min-h-[94vh] bg-white"
      >
        <div
          className="relative w-full pt-0 pb-16 text-center bg-cover bg-center z-0 min-h-[30vh]"
          style={{ backgroundImage: "url('/valet.jpg')" }}
        >
          {/* Darker overlay for more contrast */}
          <div className="absolute inset-0 bg-blue-900 opacity-40"></div>

          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
            {/* Title with larger size, white color, shadow for contrast */}
            <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mt-16 mb-2">
              Tenants
            </h1>
            <p className="text-lg text-gray-100 drop-shadow-sm">
              Configure your tenants and manage their properties and users.
            </p>
          </div>
        </div>

        <div className="w-full max-w-full mt-8 px-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 text-shadow-[.2px_.2px_.2px_#3b82f6]">
                Tenant List
              </h2>
              <p className="text-gray-600 text-xs">
                {tenants?.length ?? 0} record(s)
              </p>
            </div>
            <button
              onClick={() => handleOpenTenantModal(null)}
              className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-102 hover:bg-opacity-80 transition duration-500 text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded"
            >
              Add Tenant
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants?.map((tenant) => (
              <div
                key={tenant?.id}
                className="rounded-2xl shadow-md overflow-hidden bg-white text-gray-800 relative"
                onClick={() => {
                  if (!selectedTenantId) {
                    setSelectedTenantId(tenant?.id as string);
                  }
                }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
                  <div>
                    <h3 className="text-lg font-bold">{tenant?.name}</h3>
                    <p className="text-sm text-white/80">{tenant?.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenTenantModal(tenant)}
                      className="p-2 rounded hover:bg-white/20 transition cursor-pointer hidden"
                      title="Edit Tenant"
                    >
                      <FaPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleTenantDelete(tenant?.id as string, router)
                      }
                      className="p-2 rounded hover:bg-white/20 transition cursor-pointer hidden"
                      title="Delete Tenant"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="py-4 bg-gradient-to-br from-blue-50 to-blue-100 min-h-full px-6">
                  {/* Description */}
                  {tenant.description && (
                    <div className="leading-[14px]">
                      <p className="text-sm text-gray-700 mb-4 inline">
                        {tenant?.description?.length > 130 && !seeMore
                          ? tenant?.description?.slice(0, 130) + "..."
                          : tenant?.description}
                      </p>
                      {tenant?.description?.length > 130 ? (
                        !seeMore ? (
                          <span
                            className="text-xs hover:underline text-blue-500 inline ml-2 cursor-pointer"
                            onClick={() => setSeeMore(true)}
                          >
                            See More
                          </span>
                        ) : (
                          <span
                            className="text-xs hover:underline text-blue-500 inline ml-2 cursor-pointer"
                            onClick={() => setSeeMore(false)}
                          >
                            See Less
                          </span>
                        )
                      ) : null}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap justify-between md:justify-start lg:justify-start gap-4 mt-4 mb-10">
                    <div
                      onClick={() => {
                        if (!propertyId) return;

                        if (!loading)
                          getUsersByTenant(
                            tenant?.id as string,
                            setLoading,
                            setSelectedTenantId,
                            setInitialUsers,
                            setUsers,
                            setIsUserModalOpen
                          );
                      }}
                      className={`${
                        loading ? "cursor-not-allowed" : "cursor-pointer "
                      } bg-orange-500 hover:bg-orange-600 rounded-xl p-3 transition transform hover:scale-105 shadow-md flex items-center justify-center`}
                      title="View Users"
                    >
                      <PiUsersThreeFill className="w-7 h-7 text-white" />
                    </div>
                    <div
                      onClick={() => {
                        if (!propertyId) return;
                        if (!loading)
                          getPropertiesByTenant(
                            tenant?.id as string,
                            setSelectedTenantId,
                            setLoading,
                            setInitialProperties,
                            setProperties,
                            setIsPropertyModalOpen
                          );
                      }}
                      className={`${
                        loading ? "cursor-not-allowed" : "cursor-pointer "
                      } bg-orange-500 hover:bg-orange-600 rounded-xl p-3 transition transform hover:scale-105 shadow-md flex items-center justify-center`}
                      title="View Properties"
                    >
                      <BsFillBuildingsFill className="w-7 h-7 text-white" />
                    </div>
                    <div
                      onClick={handleOpenVehicleModal}
                      className={`${
                        loading ? "cursor-not-allowed" : "cursor-pointer "
                      } bg-orange-500 hover:bg-orange-600 rounded-xl p-3 transition transform hover:scale-105 shadow-md flex items-center justify-center`}
                      title="View Vehicle Settings"
                    >
                      <FaCar className="w-7 h-7 text-white" />
                    </div>
                    <div
                      onClick={handleOpenDeviceModal}
                      className={`${
                        loading ? "cursor-not-allowed" : "cursor-pointer "
                      } bg-orange-500 hover:bg-orange-600 rounded-xl p-3 transition transform hover:scale-105 shadow-md flex items-center justify-center`}
                      title="View Vehicle Settings"
                    >
                      <MdOutlineImportantDevices className="w-7 h-7 text-white" />
                    </div>
                    <div
                      onClick={handleOpenTransactionModal}
                      className={`${
                        loading ? "cursor-not-allowed" : "cursor-pointer "
                      } bg-orange-500 hover:bg-orange-600 rounded-xl p-3 transition transform hover:scale-105 shadow-md flex items-center justify-center`}
                      title="View Vehicle Settings"
                    >
                      <FaRegCreditCard className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`absolute bottom-4 right-4 px-3 py-1 text-xs font-semibold rounded-full ${
                      tenant.isActive
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {tenant?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tenant Modal */}
        <Modal isOpen={isTenantModalOpen} onClose={handleCloseTenantModal}>
          <TenantForm
            data={selectedTenant || null}
            onClose={handleCloseTenantModal}
            setAllTenants={setTenantData}
          />
        </Modal>

        {/* Vehicle Modal */}
        <Modal isOpen={isVehicleModalOpen} onClose={handleCloseVehicleModal}>
          <VehicleManager
            carMakes={vehiclesDropdownData?.carBrands || []}
            carModels={
              vehiclesDropdownData?.carBrands
                ?.map((brand: { models: Entry[] }) => brand?.models)
                ?.flat() as Entry[]
            }
            vehicleTypes={vehiclesDropdownData?.vehicleTypes || []}
            vehicleColors={vehiclesDropdownData?.vehicleColors || []}
            fetchVehicleDropdownData={fetchVehicleDropdownData}
          />
        </Modal>

        {/* Device Modal */}
        <Modal isOpen={isDeviceModalOpen} onClose={handleCloseDeviceModal}>
          <div>
            <DeviceCMS
              fetchPropertyDevices={fetchPropertyDevices}
              devices={devicesDropdownData || []}
            />
          </div>
        </Modal>

        {/* Transaction Modal */}
        <Modal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
        >
          <div>
            <TransactionTypeManager
              fetchTransactionTypes={fetchTransactionTypes} // Pass the fetch function ( to refetch after adding/deleting )
              transactionTypes={transactionTypesDropdownData || []}
            />
          </div>
        </Modal>

        {/* Reusable User Modal */}
        <ListModal
          title="Users"
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          originalEntities={initialUsers as UserFormType[]}
          entities={users as UserFormType[]}
          tenantId={selectedTenantId}
          refresh={refreshUsers}
          isFormOpen={isUserFormOpen}
          setIsFormOpen={setIsUserFormOpen}
          selectedEntity={selectedEntity as UserFormType | null}
          setSelectedEntity={setSelectedEntity}
          handleCloseForm={() => handleCloseForm("user")}
          FormComponent={({ originalData, data }) => (
            <UserForm
              tenantId={selectedTenantId as string}
              originalData={originalData as UserFormType | undefined}
              data={(data as UserFormType) || null}
              refresh={refreshUsers}
              setModalOpen={setIsUserFormOpen}
            />
          )}
          filterFn={(user, activeTab) => {
            if (activeTab === "Active") return user.isActive;
            if (activeTab === "Inactive") return !user.isActive;
            return true;
          }}
          renderItem={(user, onEdit) => (
            <div className="p-4 rounded shadow bg-white text-sm space-y-1 text-gray-800">
              <p>
                <strong>Name:</strong> {(user as UserFormType)?.fullName}
              </p>
              <p>
                <strong>Username:</strong> {(user as UserFormType)?.userName}
              </p>
              <p>
                <strong>Gender:</strong>{" "}
                <span className="uppercase">
                  {(user as UserFormType)?.gender}
                </span>
              </p>
              <p>
                <strong>DOB:</strong>{" "}
                {formatDateOfBirth((user as UserFormType)?.dateOfBirth)}
              </p>
              <button
                onClick={() => onEdit(user)}
                className="mt-2 text-xs px-3 py-1 bg-blue-500 text-white rounded cursor-pointer"
              >
                Edit
              </button>
            </div>
          )}
        />

        {/* Reusable Property Modal */}
        <ListModal
          title="Properties"
          isOpen={isPropertyModalOpen}
          onClose={handleClosePropertyModal}
          originalEntities={initialProperties}
          entities={properties}
          tenantId={selectedTenantId}
          refresh={refreshProperties}
          isFormOpen={isPropertyFormOpen}
          setIsFormOpen={setIsPropertyFormOpen}
          selectedEntity={selectedEntity as Property | null}
          setSelectedEntity={setSelectedEntity}
          handleCloseForm={() => handleCloseForm("property")}
          FormComponent={({ originalData, data }) => (
            <PropertyForm
              originalData={originalData as Property}
              data={(data as Property) || null}
              tenantId={selectedTenantId}
              setModalOpen={setIsPropertyFormOpen}
              onSuccess={refreshProperties}
            />
          )}
          filterFn={(user, activeTab) => {
            if (activeTab === "Active") return user.isActive;
            if (activeTab === "Inactive") return !user.isActive;
            return true;
          }}
          renderItem={(property, onEdit) => (
            <div className="p-4 rounded shadow bg-white text-sm space-y-1 text-gray-800">
              <p>
                <strong>Name:</strong> {(property as Property)?.name}
              </p>
              <p>
                <strong>Address:</strong> {(property as Property)?.address}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    property?.isActive ? "text-green-600" : "text-red-500"
                  }
                >
                  {property?.isActive ? "Active" : "Inactive"}
                </span>
              </p>
              <button
                onClick={() => onEdit(property)}
                className="mt-2 text-xs px-3 py-1 bg-blue-500 text-white rounded cursor-pointer"
              >
                Edit
              </button>
            </div>
          )}
        />
      </div>
    </>
  );
};

export default Tenants;
