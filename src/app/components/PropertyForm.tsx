"use client";

import { useState } from "react";
import { FaBuilding } from "react-icons/fa6";

interface Property {
  id?: string;
  tenantId?: string;
  tenant?: string;
  name: string;
  address: string;
  createdAtDateTime: string;
  isActive: boolean;
}

interface PropertyFormProps {
  tenantId?: string;
  initialData?: Property | null; // For edit mode
  onSuccess?: () => void; // Callback after successful submit
  setModalOpen: (isOpen: boolean) => void; // For modal usage
}

export default function PropertyForm({
  tenantId,
  initialData,
  onSuccess,
  setModalOpen,
}: PropertyFormProps) {
  const [form, setForm] = useState<Property>({
    tenantId: "",
    name: "",
    address: "",
    createdAtDateTime:
      initialData?.createdAtDateTime || new Date().toISOString(),
    isActive: true,
    ...initialData,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form?.name || !form?.address || !form?.tenantId) {
      alert("Please fill in all required fields.");
      return;
    }

    const method = "POST";
    const endpoint = "/api/properties/createAndUpdate";

    const payload = {
      ...form,
      tenantId: tenantId || form?.tenantId,
      isActive: form?.isActive ?? true,
    };

    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result?.status === "200") {
      setModalOpen(false);
    }

    if (res.ok) {
      alert(`Property ${form?.id ? "updated" : "created"} successfully!`);
      onSuccess?.();
    } else {
      const error = await res.text();
      console.error("Error:", error);
      alert("Something went wrong.");
    }
  };
  const toggleIsActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev?.isActive }));
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4 rounded shadow text-gray-200 flex flex-col">
      <div className="flex gap-2 text-blue-500 items-center">
        <FaBuilding className="w-5 h-5" />
        <h2 className="text-xl font-semibold tracking-tight relative top-[2px]">
          {form?.id ? "Update Property" : "Create Property"}
        </h2>
      </div>

      <input
        type="text"
        name="name"
        placeholder="Property Name"
        value={form?.name}
        onChange={handleChange}
        className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        required
      />

      <input
        type="text"
        name="address"
        placeholder="Address"
        value={form?.address}
        onChange={handleChange}
        className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        required
      />

      {form?.id && (
        <div className="w-full pt-0 relative flex gap-2">
          <div>
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
      )}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 w-full rounded-md font-semibold shadow"
      >
        {form?.id ? "Update" : "Create"} Property
      </button>
    </div>
  );
}
