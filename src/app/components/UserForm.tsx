"use client";
import { useState, useEffect } from "react";
import { createAndUpdateUser } from "../auth/userStoreApi";
import { UserForm } from "../types/index";
import { formatDatePicker } from "../lib/clientUtils";
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
  data,
  refresh,
  setModalOpen = () => {},
}: {
  tenantId: string;
  data?: UserForm;
  refresh: (id: string) => void;
  setModalOpen?: (isOpen: boolean) => void;
}) {
  const [form, setForm] = useState<UserForm>({
    id: data?.id,
    userName: data?.userName || "",
    pin: data?.pin || "",
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    gender: data?.gender || "",
    role: data?.role as string,
    dateOfBirth: data?.dateOfBirth || "",
    isActive: data?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [, setMissingFields] = useState<string[]>([]);
  const [, setButtonLoader] = useState(false);

  useEffect(() => {
    if (data) {
      const [firstName = "", lastName = ""] = data?.fullName?.split(" ") || [];
      setForm((prev) => ({
        ...prev,
        firstName,
        lastName,
        dateOfBirth: data?.dateOfBirth
          ? formatDatePicker(data.dateOfBirth)
          : "",
        role: data?.role,
      }));
    }
  }, [data]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createAndUpdateUser(
        {
          ...form,
          role: form.role,
          id: form.id,
          tenantId: tenantId,
          // userName: form.userName,
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          isActive: form.isActive,
        },
        setMissingFields,
        setButtonLoader,
        tenantId,
        setModalOpen
      );

      refresh(tenantId);
    } catch (err) {
      console.error("Error submitting user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm
      title={form.id ? "Update User" : "Create User"}
      initialData={form as UserForm}
      fields={fields}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isActive={form.isActive}
      onToggleActive={() =>
        setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
      }
      showActiveToggle
      submitLabel={form.id ? "Update User" : "Create User"}
      loading={loading}
    />
  );
}
