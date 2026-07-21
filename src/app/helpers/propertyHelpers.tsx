import Swal from "sweetalert2";
import { UserForm as UserFormType, Property } from "../types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Tenant {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  setTenants?: (tenants: Tenant[]) => void;
}

//////////////////////////////////////////////////////////////////////////
//  TENANT GET/CREATION/UPDATE/DELETE

export const getTenants = async ({
  setTenants,
}: {
  setTenants?: (tenants: Tenant[]) => void;
}) => {
  const method = "GET";
  const endpoint = "/api/tenants/get";

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await res.json();

    if (response?.data?.status === "200") {
      setTenants?.(response?.data?.data || []);
    } else {
      console.error("Failed to fetch tenants:", response);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: response?.result?.message || "Something went wrong.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while processing your request.",
    });
  }
};

export const createAndUpdateTenant = async ({
  form,
  onClose,
  setAllTenants,
}: {
  form: {
    id?: string;
    name: string;
    type: string;
    description?: string;
    isActive?: boolean;
  };
  onClose?: (open: boolean) => void;
  setAllTenants?: (tenants: Tenant[]) => void;
}) => {
  if (!form?.name || !form?.type) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill in all required fields.",
    });
    return;
  }

  const method = "POST";
  const endpoint = "/api/tenants/createAndUpdate";
  const payload = {
    ...form,
    isActive: form?.isActive,
  };

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response?.result?.status === "200") {
      Swal.fire({
        icon: "success",
        title: `Tenant ${form?.id ? "updated" : "created"} successfully!`,
        showConfirmButton: false,
        timer: 1500,
      });
      await getTenants({ setTenants: setAllTenants });
      onClose?.(false);
    } else {
      console.error("Failed to create/update tenant:", response);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: response?.result?.message || "Something went wrong.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while processing your request.",
    });
  }
};

export const handleTenantDelete = async (
  tenantId: string,
  router: AppRouterInstance
) => {
  Swal.fire({
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
        body: JSON.stringify({ id: tenantId }),
      });

      const result = await res.json();

      if (result?.result?.status === "200") {
        Swal.fire({
          icon: "success",
          title: "Tenant deleted successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        console.error("Failed to delete tenant:", result);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete tenant. Please try again.",
        });
      }
    }
  });
};

export const getUsersByTenant = async (
  tenantId: string,
  setLoading: (loading: boolean) => void,
  setSelectedTenantId: (id: string) => void,
  setInitialUsers: (users: UserFormType[]) => void,
  setUsers: (users: UserFormType[]) => void,
  setIsUserModalOpen: (isOpen: boolean) => void
) => {
  setLoading(true);
  setSelectedTenantId(tenantId);
  try {
    const res = await fetch("/api/users/getUsers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tenantId }),
    });

    const data = await res.json();

    const result = data?.result?.data;

    setInitialUsers(result || []);
    setUsers(result || []);
    setIsUserModalOpen(true);
    setLoading(false);
  } catch (error) {
    console.error("Error fetching users:", error);
    setLoading(false);
    Swal.fire({
      icon: "error",
      title: "Failed to fetch users",
      text: "Please try again later.",
    });
  } finally {
    setLoading(false);
  }
};

export const getUserById = async (
  userId: string,
  setLoading: (loading: boolean) => void,
  setOpen: (isOpen: boolean) => void,
  setUser: (user: UserFormType) => void
) => {
  setLoading(true);
  try {
    const res = await fetch("/api/users/getAppUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });

    const data = await res.json();

    if (data?.result?.status === "200") {
      const result = data?.result?.data;
      setUser(result || []);
      setLoading(false);
      setOpen(true);
    } else {
      console.error("Failed to fetch user:", data);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data?.result?.message || "Something went wrong.",
      });
      setLoading(false);
      return;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    setLoading(false);
    Swal.fire({
      icon: "error",
      title: "Failed to fetch user",
      text: "Please try again later.",
    });
  } finally {
    setLoading(false);
  }
};

export const getPropertiesByTenant = async (
  tenantId: string,
  setSelectedTenantId: (id: string) => void,
  setLoading: (loading: boolean) => void,
  setInitialProperties: (properties: Property[]) => void,
  setProperties: (properties: Property[]) => void,
  setIsPropertyModalOpen: (isOpen: boolean) => void
) => {
  setLoading(true);
  setSelectedTenantId(tenantId);
  try {
    const res = await fetch("/api/properties/getProperties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tenantId }),
    });

    const data = await res.json();

    const result = data?.result?.data;

    console.log("Data", data);

    setInitialProperties(result || []);
    setProperties(result || []);
    setIsPropertyModalOpen(true);
    setLoading(false);
  } catch (error) {
    console.error("Error fetching properties:", error);
    setLoading(false);
    Swal.fire({
      icon: "error",
      title: "Failed to fetch properties",
      text: "Please try again later.",
    });
    return;
  } finally {
    setLoading(false);
  }
};
