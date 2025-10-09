"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useProperty } from "../context/PropertyContext";
import { FaRegMoneyBill1, FaRegCreditCard } from "react-icons/fa6";
import FormInput from "../components/elements/FormInput";

interface Entry {
  id: number;
  name: string;
  value: number;
  isActive: boolean;
}

function EntryManager({
  title,
  data,
  fetchTransactionTypes,
}: {
  title: string;
  data?: Entry[];
  fetchTransactionTypes: () => Promise<void>;
}) {
  const router = useRouter();
  const { propertyId } = useProperty();
  const [entries, setEntries] = useState<Entry[]>(data || []);
  const [formValue1, setFormValue1] = useState("");
  const [formValue2, setFormValue2] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    setEntries(data || []);
  }, [data]);

  const handleSubmit = async () => {
    if (!formValue1?.trim() || !formValue2?.trim()) return;

    setButtonLoading(true);
    try {
      const sendForm = [
        {
          propertyId: propertyId,
          name: formValue1,
          value: formValue2,
          id: editingId || 0,
          isActive: true,
        },
      ];

      const response = await fetch(`/api/valetTransaction/types/createOrEdit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const result = await response.json();

      if (result?.result?.status === "200") {
        Swal.fire(
          "Success",
          `${title} "${formValue1}" has been saved successfully.`,
          "success"
        );
        fetchTransactionTypes();
        router.refresh();

        setFormValue1("");
        setFormValue2("");
        setEditingId(null);
      } else {
        Swal.fire(
          "Error",
          result?.result?.message ||
            `Failed to save ${title?.toLowerCase()}. Please try again.`,
          "error"
        );
        setButtonLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error saving transaction type:", error);
    } finally {
      setButtonLoading(false);
    }
  };

  const deleteEntry = (id: number) => {
    Swal.fire({
      title: `Delete this ${title?.toLowerCase()}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setButtonLoading(true);
        try {
          const response = await fetch(`/api/valetTransaction/types/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ id: id }]),
          });

          const resData = await response.json();

          if (resData?.result?.status === "200") {
            setEntries((prev) => prev?.filter((e) => e?.id !== id));
            fetchTransactionTypes?.();
            router.refresh();
            Swal.fire("Deleted!", `${title} has been deleted.`, "success");
          } else {
            Swal.fire(
              "Error",
              resData?.result?.message ||
                `Failed to delete ${title?.toLowerCase()}.`,
              "error"
            );
            setButtonLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error deleting transaction type:", error);
        } finally {
          setButtonLoading(false);
        }
      }
    });
  };

  return (
    <div className="overflow-hidden bg-white text-gray-800 relative">
      <div className="p-4 min-h-full">
        <form className="flex flex-col md:flex-row lg:flex-row items-center gap-2 mb-4">
          <FormInput
            name="formValue"
            placeholder={`Enter ${title}`}
            icon={<FaRegCreditCard />}
            value={formValue1}
            onChange={(e) => setFormValue1(e.target.value)}
            onClear={() => setFormValue1("")}
          />
          <div className="flex gap-2 items-center">
            <FormInput
              name="formValue"
              placeholder={`Enter value`}
              icon={<FaRegMoneyBill1 />}
              value={formValue2}
              onChange={(e) => setFormValue2(e.target.value)}
              onClear={() => setFormValue2("")}
            />
            <button
              type="button"
              disabled={buttonLoading}
              onClick={handleSubmit}
              className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-md tracking-tight rounded"
            >
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="max-h-40 overflow-y-auto">
          {entries?.length === 0 ? (
            <p className="text-gray-500 italic">No {title}s yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center bg-blue-600 text-white text-sm px-3 py-1 rounded-lg shadow"
                >
                  {entry.name}{" "}
                  <span className="text-gray-300 mx-2">{`($${entry?.value})`}</span>
                  <button
                    type="button"
                    disabled={buttonLoading}
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-2 text-white hover:text-red-200 cursor-pointer"
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

const TransactionTypeManager: React.FC<{
  transactionTypes: Entry[];
  fetchTransactionTypes: () => Promise<void>;
}> = ({ transactionTypes, fetchTransactionTypes }) => {
  return (
    <div>
      <div className="w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white py-4 px-4 text-center rounded-t-sm">
        <h1 className="text-2xl font-extrabold drop-shadow-lg">Rates</h1>
        <p className="text-sm drop-shadow-sm mt-2">
          Manage the available rates in your system.
        </p>
      </div>

      <EntryManager
        title="Rate Type"
        data={transactionTypes || []}
        fetchTransactionTypes={fetchTransactionTypes}
      />
    </div>
  );
};

export default TransactionTypeManager;
