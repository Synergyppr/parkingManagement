"use client";
import { useState } from "react";
import { Tenant } from "../types";
import ModalForm, { FormFieldConfig } from "./ModalForm";
import { createAndUpdateTenant } from "../helpers/propertyHelpers";

export default function TenantFormWrapper({
  data,
  onClose,
  refresh,
  initialData,
}: {
  data?: Tenant | null;
  onClose: () => void;
  refresh: () => void;
  initialData?: Tenant[] | null;
}) {
  const [form, setForm] = useState<Tenant>({
    id: data?.id,
    name: data?.name || "",
    type: data?.type || "",
    description: data?.description || "",
    isActive: data?.isActive ?? true,
    ...data,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      createAndUpdateTenant({
        form,
        onClose,
      });
      refresh();
    } catch (err) {
      console.error("Error submitting tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  const fields: FormFieldConfig[] = [
    { id: "name", name: "name", label: "Tenant Name", required: true },
    { id: "type", name: "type", label: "Tenant Type", required: true },
    {
      id: "description",
      name: "description",
      label: "Description",
      type: "textarea",
    },
  ];

  return (
    <ModalForm
      title={form.id ? "Update Tenant" : "Create Tenant"}
      initialData={form}
      fields={fields}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isActive={form?.isActive}
      onToggleActive={() =>
        setForm((prev) => ({ ...prev, isActive: !prev?.isActive }))
      }
      showActiveToggle
      submitLabel={form?.id ? "Update Tenant" : "Create Tenant"}
      loading={loading}
    />
  );
}
