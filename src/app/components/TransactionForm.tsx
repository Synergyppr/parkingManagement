"use client";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import FormInput from "./elements/FormInput";
import { FaMoneyBillWave } from "react-icons/fa";
import { MdPayment, MdOutlineReceiptLong, MdPassword } from "react-icons/md";

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
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  latitude?: number;
  longitude?: number;
  locationMode?: "live" | "manual";
  propertyId?: string | null;
}

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string | undefined;
  pin?: string;
}

interface TransactionType {
  id: string;
  name: string;
  value: number;
}

export default function TransactionForm({
  form,
  setForm,
  ticketId,
  missingFields = [],
  setOpen,
  latitude,
  longitude,
  locationMode,
  propertyId,
  setReloadPageData,
}: TransactionFormProps) {
  const [loader, setLoader] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(
    []
  );

  useEffect(() => {
    generateTicketNumber();
    fetchTransactionTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch transaction types from API
  const fetchTransactionTypes = async () => {
    try {
      const res = await fetch("/api/valetTransaction/types/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId }),
      });
      const data = await res.json();
      if (data?.result?.status === "200") {
        setTransactionTypes(data?.result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching transaction types:", error);
    }
  };

  // Generate a ticket number
  const generateTicketNumber = () => {
    const alphanumericSix = uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase();
    setForm((prev) => ({ ...prev, referenceNumber: alphanumericSix }));
  };

  // Update form values on change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Automatically update amount when paymentMethod changes
    if (name === "paymentMethod") {
      const selected = transactionTypes?.find((t) => t.name === value);
      setForm((prev) => ({ ...prev, value: selected?.value || 0 }));
    }
  };

  // Submit Transaction
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form?.paymentMethod || !form?.referenceNumber) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoader(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: userLat, longitude: userLng } = position.coords;

      const sendForm = {
        latitude: locationMode === "manual" ? latitude : userLat,
        longitude: locationMode === "manual" ? longitude : userLng,
        ticketId: ticketId,
        pin: form?.pin || "",
        amount: Number(price) || 0,
        paymentMethod: form?.paymentMethod,
        referenceNumber: form?.referenceNumber,
        notes: form?.notes,
      };

      try {
        const res = await fetch("/api/valetTransaction/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });
        const result = await res.json();

        if (result?.result?.status == "200") {
          setOpen(false);
          setReloadPageData(true);
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
          Swal.fire({
            icon: "error",
            title: "Submission Failed",
            text:
              result?.result?.message ||
              "Something went wrong. Please try again.",
          });
          setLoader(false);
          return;
        }
      } catch (error) {
        console.error("Error submitting transaction:", error);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "Something went wrong. Please try again.",
        });
      } finally {
        setLoader(false);
      }
    });
  };

  // Get price based on selected transaction type
  const price = transactionTypes?.find(
    (t) => t?.name === form?.paymentMethod
  )?.value;

  return (
    <div>
      <form className="mt-6 px-0 md:px-8 lg:px-10 py-2">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-1 md:gap-3 lg:gap-4">
          <div className="flex justify-between">
            {/* Ticket Number */}
            <div className="py-2 px-2 md:px-[10px] lg:px-[10px] flex items-center gap-2 md:gap-[20px] lg:gap-[26px]">
              <MdOutlineReceiptLong className="text-blue-600" />
              <span className="text-gray-700 text-base">
                Ticket{" "}
                <span className="font-bold">#{form?.referenceNumber}</span>
              </span>
            </div>

            {/* Value (read-only) */}
            <div className="py-2 px-2 md:px-[10px] lg:px-[10px] flex items-center gap-2 md:gap-[20px] lg:gap-[26px]">
              <FaMoneyBillWave className="text-blue-600" />
              <span className="text-gray-700 text-base">
                Price: <span className="font-bold">${price ? price : 0}</span>
              </span>
            </div>
          </div>

          {/* Transaction Type */}
          <div className="relative w-full">
            <div
              className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600`}
            >
              <MdPayment />
            </div>

            <select
              name="paymentMethod"
              onChange={handleChange}
              value={form.paymentMethod || ""}
              className={`capitalize pl-8 sm:pl-10 xs:pl-12 indent-2 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none`}
            >
              <option value="">Select Transaction Types</option>
              {transactionTypes?.map((option) => (
                <option key={option?.id} value={option?.name}>
                  {option?.name}
                </option>
              ))}
            </select>
          </div>

          {/* PIN */}
          <FormInput
            name="pin"
            type="text"
            placeholder="PIN"
            icon={<MdPassword />}
            value={form?.pin || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d{0,4}$/.test(val)) {
                setForm((prev) => ({ ...prev, pin: val }));
              }
            }}
            required
            showPasswordToggle
            showPassword={showPin}
            setShowPassword={setShowPin}
            missing={missingFields.includes("pin")}
            onClear={() => setForm((prev) => ({ ...prev, pin: "" }))}
          />
        </div>

        {/* Notes */}
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

        <div className="mt-4">
          <button
            onClick={handleSubmit}
            type="button"
            disabled={loader || !propertyId}
            className={`${
              loader || !propertyId ? "" : "hover:to-blue-800"
            } w-full cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 transition-colors text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded`}
          >
            {loader ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
