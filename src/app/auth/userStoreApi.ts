import Swal from "sweetalert2";
import { UserForm } from "../types/index";

export async function validateUser({
  username,
  temporaryPassword,
  device,
  latitude,
  longitude,
  location,
}: {
  username: string;
  temporaryPassword: string;
  device?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}) {
  const loginForm = {
    username,
    temporaryPassword: temporaryPassword,
    device,
    location,
    latitude: latitude || 0,
    longitude: longitude || 0,
  };

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginForm),
    });

    // Only succeed if response is 200
    if (response.status === 200) {
      const data = await response.json();
      return data;
    }

    if (response.status === 401) {
      throw new Error("Invalid username or password.");
    }

    if (response.status === 403) {
      throw new Error("Your account is not authorized to access the system.");
    }

    if (response.status === 500) {
      throw new Error("Internal server error. Please try again later.");
    }

    throw new Error(`Login failed with status ${response.status}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Login fetch error:", error.message);
      throw new Error(
        error.message || "Unexpected error occurred during login."
      );
    } else {
      console.error("Login fetch error:", error);
      throw new Error("Unexpected error occurred during login.");
    }
  }
}

export const createAndUpdateUser = async (
  formData: UserForm,
  setMissingFields: React.Dispatch<React.SetStateAction<string[]>>,
  setButtonLoader: React.Dispatch<React.SetStateAction<boolean>>,
  tenantId: string,
  setModalOpen: (isOpen: boolean) => void
) => {
  const requiredFields: { [key: string]: string } = {
    userName: "Username",
    firstName: "First Name",
    lastName: "Last Name",
    gender: "Gender",
    dateOfBirth: "Date of Birth",
  };

  // If creating (no id), pin is also required
  if (!formData.id) {
    requiredFields["pin"] = "PIN";
  }

  // Check for any empty required fields
  const foundMissingFields = Object.entries(requiredFields).filter(
    ([key]) => !formData[key as keyof UserForm]
  );

  if (foundMissingFields.length > 0) {
    const missingKeys = foundMissingFields.map(([key]) => key);
    setMissingFields(missingKeys);
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      html: `<ul class="text-left">${foundMissingFields
        .map(([, label]) => `<li>• ${label}</li>`)
        .join("")}</ul>`,
    });
    return;
  } else {
    setMissingFields([]); // clear error highlights
  }

  setButtonLoader(true);

  const method = "POST";
  const endpoint = "/api/users/createAndUpdate";

  const payload = {
    id: formData?.id || null,
    tenantId: tenantId || "",
    role: formData?.role || 1,
    userName: formData?.userName?.trim(),
    pin: formData?.pin,
    firstName: formData?.firstName?.trim(),
    lastName: formData?.lastName?.trim(),
    gender: formData?.gender,
    dateOfBirth: formData?.dateOfBirth,
    isActive: formData?.isActive ?? true,
  };

  // console.log("Submitting createAndUpdate payload:", payload);

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    // console.log("Submission result:", result);

    if (result?.result?.status === "200") {
      setModalOpen(false);
      Swal.fire({
        icon: "success",
        title: `User ${formData.id ? "updated" : "created"} successfully!`,
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      console.error("Submission failed:", result?.result?.message);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: result?.result?.message || "Something went wrong.",
      });
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    Swal.fire({
      icon: "error",
      title: "An error occurred",
      text: "Please try again later.",
    });
  } finally {
    setButtonLoader(false);
  }
};
