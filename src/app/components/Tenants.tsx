"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  handleTenantDelete,
  getUsersByTenant,
  getPropertiesByTenant,
} from "../helpers/propertyHelpers";
import {
  Tenant,
  UserForm as UserFormType,
  Property,
  RateEntry,
  PaymentTerminal,
} from "../types";
import { FaPencil, FaTrash, FaRegCreditCard } from "react-icons/fa6";
import { MdTerminal } from "react-icons/md";
import { FaCar } from "react-icons/fa";
import { MdOutlineImportantDevices } from "react-icons/md";
import { PiUsersThreeFill } from "react-icons/pi";
import { BsFillBuildingsFill } from "react-icons/bs";
import { useProperty } from "../context/PropertyContext";
import { formatDateOfBirth } from "../lib/clientUtils";
import { THEME_PALETTES, ThemePalette } from "../lib/propertyTheme";

import Modal from "./Modal";
import TenantForm from "./TenantForm"; // To configure tenant
import ListModal from "./ListModal";
import PropertyForm from "./PropertyForm";
import UserForm from "./UserForm";
import VehicleManager from "./VehicleManager";
import DeviceCMS from "./DeviceManager";
import TransactionTypeManager from "./TransactionTypeManager";
import TerminalCMS from "./TerminalManager";
import PageLoader from "./elements/PageLoader";

const THEME_STORAGE_KEY = "parkey-theme";

const isValidThemeColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  const color = value.trim();

  return (
    /^#[0-9a-fA-F]{3}$/.test(color) ||
    /^#[0-9a-fA-F]{6}$/.test(color) ||
    /^#[0-9a-fA-F]{8}$/.test(color) ||
    /^rgb(a)?\(/i.test(color) ||
    /^hsl(a)?\(/i.test(color)
  );
};

const normalizeThemeColor = (value: string) => value.trim().toLowerCase();

const getStoredThemeColor = (key: "primaryColor" | "secondaryColor") => {
  if (typeof window === "undefined") return null;

  const storedColor = localStorage.getItem(key);

  return isValidThemeColor(storedColor) ? storedColor.trim() : null;
};

const findThemePalette = (
  primaryColor?: string | null,
  secondaryColor?: string | null
) => {
  if (!isValidThemeColor(primaryColor) || !isValidThemeColor(secondaryColor)) {
    return undefined;
  }

  const primary = normalizeThemeColor(primaryColor);
  const secondary = normalizeThemeColor(secondaryColor);

  return THEME_PALETTES.find(
    (palette) =>
      normalizeThemeColor(palette.primary) === primary &&
      normalizeThemeColor(palette.secondary) === secondary
  );
};

const getStoredPalette = () => {
  if (typeof window === "undefined") return undefined;

  const storedThemeName = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedThemeName) {
    const paletteByName = THEME_PALETTES.find(
      (palette) => palette.name === storedThemeName
    );

    if (paletteByName) return paletteByName;
  }

  const storedPrimary = getStoredThemeColor("primaryColor");
  const storedSecondary = getStoredThemeColor("secondaryColor");

  if (!storedPrimary || !storedSecondary) return undefined;

  return findThemePalette(storedPrimary, storedSecondary);
};

const applyPalette = (palette: ThemePalette) => {
  const root = document.documentElement;

  root.dataset.theme = palette.name;

  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--primary-light", palette.primaryLight);
  root.style.setProperty("--primary-soft", palette.primarySoft);

  root.style.setProperty("--secondary", palette.secondary);
  root.style.setProperty("--secondary-light", palette.secondaryLight);
  root.style.setProperty("--secondary-soft", palette.secondarySoft);

  localStorage.setItem("primaryColor", palette.primary);
  localStorage.setItem("secondaryColor", palette.secondary);
  localStorage.setItem(THEME_STORAGE_KEY, palette.name);
};

const applyCustomTheme = (primary: string, secondary: string) => {
  const root = document.documentElement;

  root.removeAttribute("data-theme");

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);

  root.style.setProperty(
    "--primary-light",
    `color-mix(in srgb, ${primary} 35%, white)`
  );

  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${primary} 10%, white)`
  );

  root.style.setProperty(
    "--secondary-light",
    `color-mix(in srgb, ${secondary} 35%, white)`
  );

  root.style.setProperty(
    "--secondary-soft",
    `color-mix(in srgb, ${secondary} 10%, white)`
  );

  localStorage.setItem("primaryColor", primary);
  localStorage.setItem("secondaryColor", secondary);
  localStorage.removeItem(THEME_STORAGE_KEY);
};

const applyThemeColors = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) => {
  if (typeof window === "undefined") return;

  const hasContextPrimary = isValidThemeColor(primaryColor);
  const hasContextSecondary = isValidThemeColor(secondaryColor);

  if (!hasContextPrimary || !hasContextSecondary) {
    const storedPalette = getStoredPalette();

    if (storedPalette) {
      applyPalette(storedPalette);
      return;
    }

    const storedPrimary = getStoredThemeColor("primaryColor");
    const storedSecondary = getStoredThemeColor("secondaryColor");

    if (storedPrimary && storedSecondary) {
      const storedMatchedPalette = findThemePalette(
        storedPrimary,
        storedSecondary
      );

      if (storedMatchedPalette) {
        applyPalette(storedMatchedPalette);
      } else {
        applyCustomTheme(storedPrimary, storedSecondary);
      }

      return;
    }

    applyPalette(THEME_PALETTES[0]);
    return;
  }

  const resolvedPrimary = primaryColor.trim();
  const resolvedSecondary = secondaryColor.trim();

  const contextPalette = findThemePalette(resolvedPrimary, resolvedSecondary);

  if (contextPalette) {
    applyPalette(contextPalette);
    return;
  }

  const storedPalette = getStoredPalette();

  if (
    storedPalette &&
    (normalizeThemeColor(storedPalette.primary) ===
      normalizeThemeColor(resolvedPrimary) ||
      normalizeThemeColor(storedPalette.secondary) ===
        normalizeThemeColor(resolvedSecondary))
  ) {
    applyPalette(storedPalette);
    return;
  }

  applyCustomTheme(resolvedPrimary, resolvedSecondary);
};

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

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
  const { propertyId, primaryColor, secondaryColor } = useProperty();
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
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [terminalsData, setTerminalsData] = useState<PaymentTerminal[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<
    UserFormType | Property | null
  >(null);

  useEffect(() => {
    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

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
    if (propertyId) setLoading(false);
    if (tenantData) setTenantData(tenantData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tenantData) setLoading(false);
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
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result?.data?.status == "200") {
        setVehiclesDropdownData(result?.data?.data);
        setIsVehicleModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch dropdown data.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/devices/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId as string }),
      });

      const result = await response.json();

      if (result?.result?.status == "200") {
        setDevicesDropdownData(result?.result?.data);
        setIsDeviceModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch dropdown data.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/valetTransaction/types/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId as string }),
      });

      const result = await response.json();

      if (result?.result?.status == "200") {
        setTransactionTypesDropdownData(result?.result?.data as RateEntry[]);
        setIsTransactionModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch dropdown data.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/terminals/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId as string }),
      });

      const result = await response.json();

      if (result?.result?.status == "200") {
        setTerminalsData(result?.result?.data || []);
        setIsTerminalModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch terminals data.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error fetching terminals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTerminalModal = () => {
    if (!propertyId) return;
    fetchTerminals();
  };

  const handleOpenTenantModal = (tenant: Tenant | null) => {
    if (!tenant || !tenant.id) {
      setSelectedTenant(null);
      setIsTenantModalOpen(true);
      return;
    }

    setSelectedTenant(tenant);
    setSelectedTenantId(tenant.id);
    setIsTenantModalOpen(true);
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

  const handleOpenVehicleModal = () => {
    if (!propertyId) return;
    fetchVehicleDropdownData();
  };

  const handleOpenDeviceModal = () => {
    if (!propertyId) return;
    fetchPropertyDevices();
  };

  const handleOpenTransactionModal = () => {
    if (!propertyId) return;
    fetchTransactionTypes();
  };

  return (
    <>
      {loading === true && propertyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <PageLoader />
            <p className="relative bottom-20 mt-1 text-sm font-medium text-white md:bottom-37.5 lg:bottom-43.75">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-(--primary-soft) px-4 py-8">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

        <div className="relative mx-auto max-w-6xl space-y-7">
          <section className="overflow-hidden rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_70%,transparent)] bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span
                  className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase 
                tracking-[0.18em] text-primary"
                >
                  System Settings
                </span>

                <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Tenant Configuration
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage tenants, properties, users, vehicle dropdowns, devices,
                  and valet transaction rates from one premium operations panel.
                </p>
              </div>

              <button
                onClick={() => handleOpenTenantModal(null)}
                className="flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-primary px-6 text-sm font-extrabold text-white 
                shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition hover:bg-secondary"
              >
                Add Tenant
              </button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-2">
            <SummaryCard
              label="Tenants"
              value={String(tenants?.length || 0)}
              icon={<BsFillBuildingsFill />}
            />
            <SummaryCard
              label="Config Modules"
              value="6"
              icon={<FaRegCreditCard />}
            />
          </section>

          <section className="space-y-4">
            {tenants?.map((tenant) => (
              <div
                key={tenant?.id}
                className="group rounded-4xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition"
                onClick={() => {
                  if (!selectedTenantId)
                    setSelectedTenantId(tenant?.id as string);
                }}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-2xl font-bold text-slate-950">
                        {tenant?.name}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-500">
                        {tenant?.type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          tenant.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                        }`}
                      >
                        {tenant?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {tenant.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                        {tenant?.description?.length > 130 && !seeMore
                          ? tenant?.description?.slice(0, 130) + "..."
                          : tenant?.description}

                        {tenant?.description?.length > 130 && (
                          <button
                            type="button"
                            className="ml-1 cursor-pointer font-bold text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSeeMore(!seeMore);
                            }}
                          >
                            {seeMore ? "Less" : "More"}
                          </button>
                        )}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      <QuickAction
                        label="Users"
                        icon={<PiUsersThreeFill />}
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
                      />
                      <QuickAction
                        label="Properties"
                        icon={<BsFillBuildingsFill />}
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
                      />
                      <QuickAction
                        label="Vehicles"
                        icon={<FaCar />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVehicleModal();
                        }}
                      />
                      <QuickAction
                        label="Devices"
                        icon={<MdOutlineImportantDevices />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeviceModal();
                        }}
                      />
                      <QuickAction
                        label="Terminals"
                        icon={<MdTerminal />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTerminalModal();
                        }}
                      />
                      <QuickAction
                        label="Rates"
                        icon={<FaRegCreditCard />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTransactionModal();
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTenantModal(tenant);
                      }}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-(--primary-light) bg-(--primary-soft) 
                      text-primary transition"
                      title="Edit"
                    >
                      <FaPencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTenantDelete(tenant?.id as string, router);
                      }}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 transition 
                      hover:bg-red-50"
                      title="Delete"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>

        <Modal isOpen={isTenantModalOpen} onClose={handleCloseTenantModal}>
          <TenantForm
            data={selectedTenant || null}
            onClose={handleCloseTenantModal}
            setAllTenants={setTenantData}
          />
        </Modal>

        <Modal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
        >
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

        <Modal
          isOpen={isDeviceModalOpen}
          onClose={() => setIsDeviceModalOpen(false)}
        >
          <DeviceCMS
            fetchPropertyDevices={fetchPropertyDevices}
            devices={devicesDropdownData || []}
          />
        </Modal>

        <Modal
          isOpen={isTerminalModalOpen}
          onClose={() => setIsTerminalModalOpen(false)}
        >
          <TerminalCMS
            fetchTerminals={fetchTerminals}
            terminals={terminalsData}
          />
        </Modal>

        <Modal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
        >
          <TransactionTypeManager
            fetchTransactionTypes={fetchTransactionTypes}
            transactionTypes={transactionTypesDropdownData || []}
          />
        </Modal>

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
            <EntityCard
              title={(user as UserFormType)?.fullName as string}
              fields={[
                ["Username", (user as UserFormType)?.userName],
                ["Gender", (user as UserFormType)?.gender],
                ["DOB", formatDateOfBirth((user as UserFormType)?.dateOfBirth)],
              ]}
              onEdit={() => onEdit(user)}
            />
          )}
        />

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
            <EntityCard
              title={(property as Property)?.name}
              fields={[
                ["Address", (property as Property)?.address],
                ["Status", property?.isActive ? "Active" : "Inactive"],
              ]}
              onEdit={() => onEdit(property)}
            />
          )}
        />
      </div>
    </>
  );
};

export default Tenants;

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-23 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-center 
      text-xs font-bold text-slate-600 transition"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm transition">
        {icon}
      </span>
      {label}
    </button>
  );
}

function EntityCard({
  title,
  fields,
  onEdit,
}: {
  title: string;
  fields: [string, string | undefined | null][];
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <h3 className="font-serif text-xl font-bold text-slate-950">{title}</h3>

      <div className="mt-3 space-y-1">
        {fields.map(([label, value]) => (
          <p key={label} className="text-slate-600">
            <strong className="text-slate-900">{label}:</strong>{" "}
            <span className="capitalize">{value || "—"}</span>
          </p>
        ))}
      </div>

      <button
        onClick={onEdit}
        className="mt-4 rounded-xl bg-[var(--primary-soft)]0 px-4 py-2 text-xs font-bold text-white transition bg-secondary cursor-pointer"
      >
        Edit
      </button>
    </div>
  );
}
