"use client";
import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import { createAndUpdateUser } from "../auth/userStoreApi";
import { UserForm } from "../types/index";
import ModalForm, { FormFieldConfig } from "./ModalForm";

const fields: FormFieldConfig[] = [
  { id: "userName", name: "userName", label: "Username", required: true },
  {
    id: "pin",
    name: "pin",
    label: "PIN",
    type: "password",
    required: true,
    maxLength: 4,
  },
  { id: "firstName", name: "firstName", label: "First Name" },
  { id: "lastName", name: "lastName", label: "Last Name" },
  {
    id: "role",
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { label: "Admin", value: "Admin" },
      { label: "General", value: "General" },
    ],
  },
  {
    id: "gender",
    name: "gender",
    label: "Gender",
    type: "select",
    options: [
      { label: "Male", value: "m" },
      { label: "Female", value: "f" },
      { label: "Other", value: "o" },
    ],
  },
  {
    id: "dateOfBirth",
    name: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
  },
];

export default function UserFormWrapper({
  tenantId,
  originalData,
  data,
  refresh,
  setModalOpen = () => {},
}: {
  tenantId: string;
  originalData?: UserForm;
  data?: UserForm;
  refresh: (id: string) => void;
  setModalOpen?: (isOpen: boolean) => void;
}) {
  const originalForm = {
    id: originalData?.id || undefined,
    userName: originalData?.userName || "",
    pin: originalData?.pin || "",
    firstName: originalData?.fullName?.split(" ")[0] || "",
    lastName: originalData?.fullName?.split(" ")[1] || "",
    gender: originalData?.gender || "",
    role: originalData?.role as string,
    dateOfBirth: originalData?.dateOfBirth || "",
    isActive: originalData?.isActive ?? true,
  };
  const [form, setForm] = useState<UserForm>({
    id: data?.id || undefined,
    userName: data?.userName || "",
    pin: data?.pin || "",
    firstName: data?.fullName?.split(" ")[0] || "",
    lastName: data?.fullName?.split(" ")[1] || "",
    gender: data?.gender || "",
    role: data?.role as string,
    dateOfBirth: data?.dateOfBirth || "",
    isActive: data?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [, setMissingFields] = useState<string[]>([]);
  const [, setButtonLoader] = useState(false);

  // Compare form with originalForm
  const hasChanges = useMemo(() => {
    if (!originalForm) return true; // new user, always allow submit
    return JSON.stringify(originalForm) !== JSON.stringify(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Only numeric and max 4 chars for PIN
    if (name === "pin" && (value.length > 4 || /\D/.test(value))) return;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const sendForm = {
        ...form,
        tenantId,
      };
      await createAndUpdateUser(
        sendForm,
        setMissingFields,
        setButtonLoader,
        tenantId,
        setModalOpen,
        refresh
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while submitting the user. Please try again.",
      });
      console.error("Error submitting user:", err);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm
      title={form?.id ? "Update User" : "Create User"}
      initialData={form as UserForm}
      fields={fields}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isActive={form?.isActive}
      onToggleActive={() =>
        setForm((prev) => ({ ...prev, isActive: !prev?.isActive }))
      }
      showActiveToggle
      submitLabel={form?.id ? "Update User" : "Create User"}
      loading={loading}
      disableSubmit={!hasChanges} // <--- disable button if no changes
    />
  );
}
