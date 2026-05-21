"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  handleTenantDelete,
  getUsersByTenant,
  getPropertiesByTenant,
} from "../helpers/propertyHelpers";
import { Tenant, UserForm as UserFormType, Property, RateEntry } from "../types";
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
    useState<RateEntry[]>([]);
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
        setTransactionTypesDropdownData(result?.result?.data as RateEntry[]);
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

      <div className="min-h-screen py-6">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Tenant Configuration</h1>
            <button
              onClick={() => handleOpenTenantModal(null)}
              className="cursor-pointer flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Add Tenant
            </button>
          </div>

          <div className="space-y-3">
            {tenants?.map((tenant) => (
              <div
                key={tenant?.id}
                className="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4"
                onClick={() => {
                  if (!selectedTenantId) {
                    setSelectedTenantId(tenant?.id as string);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{tenant?.name}</h3>
                      <span className="text-xs text-gray-400">&middot; {tenant?.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tenant.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {tenant?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {tenant.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tenant?.description?.length > 130 && !seeMore
                          ? tenant?.description?.slice(0, 130) + "..."
                          : tenant?.description}
                        {tenant?.description?.length > 130 && (
                          <button
                            type="button"
                            className="text-blue-600 ml-1 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setSeeMore(!seeMore); }}
                          >
                            {seeMore ? "Less" : "More"}
                          </button>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!propertyId || loading) return;
                        getUsersByTenant(
                          tenant?.id as string,
                          setLoading,
                          setSelectedTenantId,
                          setInitialUsers,
                          setUsers,
                          setIsUserModalOpen
                        );
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Users"
                    >
                      <PiUsersThreeFill className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!propertyId || loading) return;
                        getPropertiesByTenant(
                          tenant?.id as string,
                          setSelectedTenantId,
                          setLoading,
                          setInitialProperties,
                          setProperties,
                          setIsPropertyModalOpen
                        );
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Properties"
                    >
                      <BsFillBuildingsFill className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenVehicleModal(); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Vehicles"
                    >
                      <FaCar className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenDeviceModal(); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Devices"
                    >
                      <MdOutlineImportantDevices className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenTransactionModal(); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Transactions"
                    >
                      <FaRegCreditCard className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenTenantModal(tenant); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <FaPencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTenantDelete(tenant?.id as string, router);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
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
