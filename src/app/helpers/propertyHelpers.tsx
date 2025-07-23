import Swal from "sweetalert2";
//////////////////////////////////////////////////////////////////////////
//  TENANT CREATION/UPDATE/DELETE

export const createAndUpdateTenant = async ({
  form,
  onClose,
}: {
  form: {
    id?: string;
    name: string;
    type: string;
    description?: string;
    isActive?: boolean;
  };
  onClose?: (open: boolean) => void;
}) => {
  // console.log("Creating or updating tenant with form data:", form);

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
    isActive: form?.isActive ?? true,
  };

  // console.log("Submitting payload:", payload);

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    // console.log("createAndUpdate Submission result:", response);

    if (response?.result?.status === "200") {
      Swal.fire({
        icon: "success",
        title: `Tenant ${form?.id ? "updated" : "created"} successfully!`,
        showConfirmButton: false,
        timer: 1500,
      });

      onClose?.(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
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

export const handleTenantDelete = async (tenantId: string) => {
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
        body: JSON.stringify(tenantId),
      });

      const result = await res.json();

      if (result) {
        Swal.fire({
          icon: "success",
          title: "Tenant deleted successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setTimeout(() => {
          window.location.reload();
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setUsers: any,
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

    // console.log("Users fetch response:", data);
    const result = data?.result?.data;

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

export const getPropertiesByTenant = async (
  tenantId: string,
  setSelectedTenantId: (id: string) => void,
  setLoading: (loading: boolean) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperties: any,
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
    // console.log("Properties fetch response:", data);
    const result = data?.result?.data;
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
