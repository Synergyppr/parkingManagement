import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import FormInput from "./elements/FormInput";
import { FaMoneyBillWave } from "react-icons/fa";
import { MdPayment, MdOutlineReceiptLong } from "react-icons/md";

interface TransactionFormProps {
  form: TransactionForm;
  setForm: React.Dispatch<
    React.SetStateAction<{
      amount: number;
      paymentMethod: string;
      referenceNumber: string;
      notes?: string | undefined;
    }>
  >;
  ticketId?: string;
  missingFields?: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData?: () => Promise<void>;
  latitude?: number;
  longitude?: number;
}

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string | undefined;
}

export default function TransactionForm({
  form,
  setForm,
  ticketId,
  missingFields = [],
  setOpen,
  fetchData,
  latitude,
  longitude,
}: TransactionFormProps) {
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    // Generate a ticket number when the component mounts
    generateTicketNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateTicketNumber = () => {
    // Generate a UUID, remove dashes, and take the first 6 alphanumeric characters
    const alphanumericSix = uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase(); // Optional: .toUpperCase() for readability

    setForm((prev: typeof form) => ({
      ...prev,
      referenceNumber: alphanumericSix,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form?.amount || !form?.paymentMethod || !form?.referenceNumber) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoader(true);
    // const latitude = 18.426434330459355;
    // const longitude = -66.05954507209249;
    const sendForm = {
      latitude: latitude,
      longitude: longitude,
      ticketId: ticketId,
      amount: Number(form?.amount) || 0, // Ensure amount is a number
      paymentMethod: form?.paymentMethod,
      referenceNumber: form?.referenceNumber,
      notes: form?.notes,
    };

    // console.log("Submitting form:", sendForm);

    // return; // Uncomment this line to prevent actual submission during development

    try {
      const res = await fetch("/api/valetTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const result = await res.json();

      // console.log("Response from API:", result);

      if (result?.result?.status == "200") {
        setOpen(false);
        await fetchData?.(); // refresh the data from the API

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Transaction successful!",
          showConfirmButton: false,
          timer: 1500,
        });
        setForm({
          amount: 0,
          paymentMethod: "",
          referenceNumber: "",
          notes: "",
        });
      } else {
        console.error("Error: Unexpected response:", result);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: result?.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      <form className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <FormInput
            name="amount"
            placeholder="Amount"
            icon={<FaMoneyBillWave />}
            value={String(form.amount)}
            onChange={(e) => {
              const numeric = e.target.value.replace(/[^\d.]/g, "");
              if (/^\d*\.?\d{0,2}$/.test(numeric)) {
                setForm((prev) => ({
                  ...prev,
                  amount: parseInt(numeric) || 0,
                }));
              }
            }}
            missing={missingFields.includes("amount")}
            onClear={() => setForm((prev) => ({ ...prev, amount: 0 }))}
            required
          />

          {/* Payment Method */}
          <FormInput
            name="paymentMethod"
            placeholder="Payment Method"
            icon={<MdPayment />}
            type="select"
            options={[
              { id: "Cash", name: "Cash" },
              { id: "Credit Card", name: "Credit Card" },
              { id: "Debit Card", name: "Debit Card" },
              { id: "Apple Pay", name: "Apple Pay" },
              { id: "Google Pay", name: "Google Pay" },
              { id: "Zelle", name: "Zelle" },
              { id: "Venmo", name: "Venmo" },
              { id: "Other", name: "Other" },
            ]}
            value={form.paymentMethod || ""}
            onChange={handleChange}
            missing={missingFields.includes("paymentMethod")}
            onClear={() => setForm((prev) => ({ ...prev, paymentMethod: "" }))}
            required
          />

          {/* Reference Number */}
          <FormInput
            name="referenceNumber"
            placeholder="Reference Number"
            icon={<MdOutlineReceiptLong />}
            value={form.referenceNumber || ""}
            onChange={handleChange}
            missing={missingFields.includes("referenceNumber")}
            onClear={() =>
              setForm((prev) => ({ ...prev, referenceNumber: "" }))
            }
          />
        </div>

        {/* Notes (textarea) */}
        <div className="mt-6">
          <textarea
            name="notes"
            id="notes"
            value={form.notes || ""}
            onChange={handleChange}
            placeholder="Add any notes about this transaction..."
            className={`w-full px-3 py-2 border-b border-gray-500 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm resize-none h-24 ${
              missingFields.includes("notes") ? "border-red-600" : ""
            }`}
          />
        </div>
        <div>
          <button
            onClick={handleSubmit}
            type="button"
            disabled={loader}
            className="w-full cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded"
          >
            {loader ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
