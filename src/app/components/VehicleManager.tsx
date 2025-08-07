"use client";
import React, { useState } from "react";
import { FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { BiSolidSprayCan } from "react-icons/bi";
import FormInput from "../components/elements/FormInput";

interface Entry {
  id: string;
  value: string;
}

function EntryManager({
  title,
  icon,
  initialData = [],
}: {
  title: string;
  icon?: React.ReactNode;
  initialData?: Entry[];
}) {
  const [entries, setEntries] = useState<Entry[]>(initialData);
  const [formValue, setFormValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId ? { ...entry, value: formValue } : entry
        )
      );
      setEditingId(null);
    } else {
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        value: formValue,
      };
      setEntries((prev) => [...prev, newEntry]);
    }
    setFormValue("");
  };

  // const handleEdit = (entry: Entry) => {
  //   setFormValue(entry.value);
  //   setEditingId(entry.id);
  // };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormValue("");
    }
  };

  return <div></div>;

  return (
    <div className="rounded-2xl shadow-md overflow-hidden bg-white text-gray-800 relative">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-white/80">{entries.length} item(s)</p>
      </div>

      {/* Card Body */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 min-h-full">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <FormInput
            name="formValue"
            placeholder={`Enter ${title.toLowerCase()}`}
            icon={icon}
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            onClear={() => setFormValue("")}
          />
          <button
            type="submit"
            className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-md tracking-tight rounded"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </form>

        {/* Scrollable Pills */}
        <div className="max-h-40 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-gray-500 italic">
              No {title.toLowerCase()}s yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center bg-[#ef6c00] text-white text-sm px-3 py-1 rounded-lg shadow"
                >
                  {entry.value}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="ml-2 text-white hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehicleCMS() {
  return (
    <div
      style={{
        background:
          "radial-gradient(circle at center, #86b2f9 10%, #e0f2ff 90%)",
      }}
      className="flex flex-col items-start overflow-y-auto pb-4 min-h-[94vh] bg-white"
    >
      {/* Hero Section */}
      <div
        className="relative w-full pt-0 pb-16 text-center bg-cover bg-center z-0 min-h-[30vh]"
        style={{ backgroundImage: "url('/carBg.jpg')" }}
      >
        <div className="absolute inset-0 bg-blue-900 opacity-40"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mt-16 mb-2">
            Vehicle CMS
          </h1>
          <p className="text-lg text-gray-100 drop-shadow-sm">
            Manage your vehicle makes, models, types, and colors.
          </p>
        </div>
      </div>

      {/* Entry Cards */}
      <div className="w-full max-w-6xl mx-auto mt-8 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <EntryManager
          title="Make"
          icon={<FaCar />}
          initialData={[
            { id: "1", value: "Toyota" },
            { id: "2", value: "Ford" },
            { id: "3", value: "BMW" },
          ]}
        />

        <EntryManager
          title="Model"
          icon={<FaCarRear />}
          initialData={[
            { id: "1", value: "Corolla" },
            { id: "2", value: "Mustang" },
            { id: "3", value: "X5" },
          ]}
        />

        <EntryManager
          title="Type"
          icon={<PiCarProfileFill />}
          initialData={[
            { id: "1", value: "SUV" },
            { id: "2", value: "Sedan" },
            { id: "3", value: "Coupe" },
          ]}
        />

        <EntryManager
          title="Color"
          icon={<BiSolidSprayCan />}
          initialData={[
            { id: "1", value: "Red" },
            { id: "2", value: "Black" },
            { id: "3", value: "White" },
          ]}
        />
      </div>
    </div>
  );
}
