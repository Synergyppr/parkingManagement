"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { FaBuilding } from "react-icons/fa6";

interface Tenant {
  id?: string;
  type: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface TenantFormProps {
  initialData?: Tenant | null; // If editing, pass existing data
  handleCloseTenantModal?: () => void;
}

export default function TenantForm({
  initialData,
  handleCloseTenantModal,
}: TenantFormProps) {
  const [form, setForm] = useState<Tenant>({
    type: "",
    name: "",
    description: "",
    isActive: true,
    ...initialData, // prefill if editing
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type) {
      alert("Please fill in all required fields.");
      return;
    }

    const method = "POST";
    const endpoint = "/api/tenants/createAndUpdate";

    const payload = {
      ...form,
      isActive: form.isActive ?? true,
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
          theme: "dark",
          icon: "success",
          title: `Tenant ${form?.id ? "updated" : "created"} successfully!`,
          showConfirmButton: false,
          timer: 1500,
        });
        handleCloseTenantModal?.();
      } else {
        console.error(
          "Error:",
          response?.result?.message || "Something went wrong."
        );
        Swal.fire({
          theme: "dark",
          icon: "error",
          title: "Error",
          text: response?.result?.message || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        theme: "dark",
        icon: "error",
        title: "Error",
        text: "An error occurred while processing your request.",
      });
    }
  };

  const toggleIsActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev?.isActive }));
  };

  return (
    <div className="p-4 md:p-6 min-w-full mx-auto space-y-4 rounded shadow text-gray-200 flex flex-col">
      <div className="flex gap-2 text-blue-500 items-center">
        <FaBuilding className="w-5 h-5" />
        <h2 className="text-xl font-semibold tracking-tight relative top-[2px]">
          {form?.id ? "Update Tenant" : "Create Tenant"}
        </h2>
      </div>

      <input
        type="text"
        name="name"
        placeholder="Tenant Name"
        value={form?.name}
        onChange={handleChange}
        className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        required
      />

      <input
        type="text"
        name="type"
        placeholder="Tenant Type"
        value={form?.type}
        onChange={handleChange}
        className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        required
      />

      <textarea
        name="description"
        placeholder="Description (optional)"
        value={form?.description || ""}
        onChange={handleChange}
        className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
      />

      <div className="w-full pt-0 relative flex gap-2">
        <div className="">
          <div
            className="relative flex items-center justify-between w-14 h-8 cursor-pointer"
            onClick={toggleIsActive}
          >
            <div
              className={`absolute w-full h-full rounded-full transition-all duration-300 ${
                form?.isActive ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
            <div
              className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                form?.isActive ? "translate-x-[28px]" : "translate-x-[5px]"
              }`}
            />
          </div>
        </div>
        <div className="tracking-tight text-sm text-gray-200 relative top-2">
          {form?.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 w-full rounded-md font-semibold shadow"
      >
        {form?.id ? "Update" : "Create"} Tenant
      </button>
    </div>
  );
}
