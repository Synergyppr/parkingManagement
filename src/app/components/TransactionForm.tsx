"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { FaCreditCard } from "react-icons/fa";
import {
  MdCardGiftcard,
  MdOutlineReceiptLong,
  MdPassword,
  MdPayment,
} from "react-icons/md";
import { RiSecurePaymentFill } from "react-icons/ri";

import { PaymentTerminal } from "../types";
import { useProperty } from "../context/PropertyContext";

import FormInput from "./elements/FormInput";

interface TransactionForm {
  amount: number;
  paymentMethod: string;
  transactionTypeId: number;
  notes?: string;
  pin?: string;
  value?: number;
}

interface TransactionFormProps {
  form: TransactionForm;
  setForm: React.Dispatch<React.SetStateAction<TransactionForm>>;
  ticketId?: string;
  missingFields?: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReloadPageData: React.Dispatch<React.SetStateAction<boolean>>;
  latitude?: number;
  longitude?: number;
  locationMode?: "live" | "manual";
  propertyId?: string | null;
}

interface TransactionType {
  id: string;
  name: string;
  value: number;
  taxable?: boolean;
  stateTaxRate?: number;
  cityTaxRate?: number;
}

const PAYMENT_METHODS = [
  {
    key: "ecr",
    label: "Card (POS)",
    icon: <FaCreditCard className="h-4 w-4" />,
  },
  { key: "athm", label: "ATH Movil", icon: <MdPayment className="h-4 w-4" /> },
  {
    key: "p2p",
    label: "Online Payment",
    icon: <MdPayment className="h-4 w-4" />,
  },
  // { key: "cash", label: "Cash", icon: <MdPayment className="h-4 w-4" /> },
];

// const RECEIPT_OPTIONS = [
//   { key: "both", label: "POS + Digital" },
//   { key: "pos", label: "POS Only" },
//   { key: "html", label: "Digital Only" },
//   { key: "no", label: "No Receipt" },
// ];

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcDisplayTotal(base: number, taxable?: boolean): number {
  if (!taxable) return base;
  const stateTax = roundToTwo(base * 0.105);
  const cityTax = roundToTwo(base * 0.01);
  return roundToTwo(base + stateTax + cityTax);
}

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

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
  const {
    accountUser,
    userRole,
    latitude: ctxLatitude,
    longitude: ctxLongitude,
  } = useProperty();

  const isAdmin = userRole?.toLowerCase() === "admin" || userRole === "1";

  const [loader, setLoader] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [courtesyLoading, setCourtesyLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(
    [],
  );
  const [terminals, setTerminals] = useState<PaymentTerminal[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("ecr");
  const [selectedTerminalId, setSelectedTerminalId] = useState("");
  const [receiptOutput, setReceiptOutput] = useState("both");
  const [receiptEmail, setReceiptEmail] = useState("no");
  const [tip, setTip] = useState(0);

  useEffect(() => {
    fetchTransactionTypes();
    fetchTerminals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fetchTerminals = async () => {
    try {
      const res = await fetch("/api/terminals/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propertyId }),
      });

      const data = await res.json();

      if (data?.result?.status === "200" || data?.result?.status === 200) {
        const terminalList: PaymentTerminal[] = data?.result?.data || [];
        setTerminals(terminalList);

        const defaultTerminal = terminalList.find((t) => t.is_default);
        if (defaultTerminal) {
          setSelectedTerminalId(defaultTerminal.id);
        } else if (terminalList.length === 1) {
          setSelectedTerminalId(terminalList[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching terminals:", error);
    }
  };

  const selectedTransactionType = transactionTypes?.find(
    (t) => t?.name === form?.paymentMethod,
  );

  const price = selectedTransactionType?.value;
  const basePrice = Number(price) || 0;
  const totalAmount = basePrice;
  const displayTotal = calcDisplayTotal(
    basePrice,
    selectedTransactionType?.taxable,
  );

  const resetForm = () => {
    setForm({
      amount: 0,
      paymentMethod: "",
      transactionTypeId: 0,
      notes: "",
      pin: "",
      value: 0,
    });
    setSelectedPaymentMethod("");
    setTip(0);
    setReceiptOutput("both");
    setReceiptEmail("no");
  };

  const resolveLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    if (locationMode === "manual") {
      return {
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve({
            latitude: ctxLatitude ?? 0,
            longitude: ctxLongitude ?? 0,
          });
        },
      );
    });
  };

  const executePayment = async (
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    Swal.fire({
      title: "Processing Payment",
      html: `<p>Sending payment request...</p><p class="text-sm mt-2 font-semibold"</p>`,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await fetch("/api/valetTransaction/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    Swal.close();
    return result;
  };

  const handlePaymentResult = (result: Record<string, unknown>) => {
    const r = result?.result as Record<string, unknown> | undefined;

    if (r?.status == "200") {
      setOpen(false);
      setReloadPageData(true);

      Swal.fire({
        icon: "success",
        title: "Payment Successful",
        text: (r?.message as string) || "Transaction completed successfully!",
        showConfirmButton: false,
        timer: 2500,
      });

      resetForm();
    } else {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text:
          (r?.message as string) ||
          "The payment was not approved. Please try again.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    }
  };

  const isDuplicateTransaction = (result: Record<string, unknown>): boolean => {
    const r = result?.result as Record<string, unknown> | undefined;
    const message = ((r?.message as string) || "").toUpperCase();
    return message.includes("DUPLICAT");
  };

  const handleSubmit = async () => {
    if (!selectedTransactionType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a transaction type first.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    if (!selectedPaymentMethod) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a payment method.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    if (!form?.pin || form.pin.length !== 4) {
      Swal.fire({
        icon: "warning",
        title: "PIN Required",
        text: "Please enter your 4-digit PIN before continuing.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    if (!ticketId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ticket ID is missing. Please try again.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    const needsTerminal =
      selectedPaymentMethod === "ecr" || selectedPaymentMethod === "athm";

    if (needsTerminal && !selectedTerminalId) {
      Swal.fire({
        icon: "warning",
        title: "Terminal Required",
        text: "Please select a terminal for card/ATH Movil payments.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    setLoader(true);

    try {
      const location = await resolveLocation();

      const isEcr = selectedPaymentMethod === "ecr";
      const isAthm = selectedPaymentMethod === "athm";
      const effectiveTip = isEcr ? 0 : tip;

      const payload: Record<string, unknown> = {
        ticketId,
        propertyId,
        pin: form.pin,
        latitude: location.latitude,
        longitude: location.longitude,
        paymentMethod: selectedPaymentMethod,
        transactionTypeId: Number(selectedTransactionType.id),
        amount: totalAmount + effectiveTip,
        terminalId: needsTerminal ? selectedTerminalId : undefined,
        ...(isEcr ? {} : { tip: isAthm ? "0.00" : tip }),
        receiptOutput,
        receiptEmail,
        notes: form.notes || "",
      };

      console.log("[TransactionForm] ECR DEBUG:", {
        isEcr,
        tipState: tip,
        effectiveTip,
        hasTipInPayload: "tip" in payload,
        payload,
      });

      const result = await executePayment(payload);

      if (isDuplicateTransaction(result)) {
        const { isConfirmed } = await Swal.fire({
          icon: "warning",
          title: "Duplicated Transaction",
          html: `
            <p class="text-sm text-gray-600">The terminal detected a duplicated transaction.</p>
            <p class="text-sm text-gray-600 mt-2">Do you want to <strong>force</strong> the transaction through? The tip selected on the terminal will be preserved.</p>
          `,
          showCancelButton: true,
          confirmButtonText: "Yes, Force Transaction",
          cancelButtonText: "No, Decline",
          confirmButtonColor: getPrimaryThemeColor(),
          cancelButtonColor: "#64748b",
          reverseButtons: true,
        });

        if (isConfirmed) {
          const forceResult = await executePayment({
            ...payload,
            forceDuplicate: "yes",
          });
          handlePaymentResult(forceResult);
        } else {
          Swal.fire({
            icon: "info",
            title: "Force Duplicate Declined",
            text: "The transaction was not forced. You can try another payment method.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        }

        return;
      }

      handlePaymentResult(result);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setLoader(false);
    }
  };

  const handleCourtesy = async () => {
    if (!form?.pin || form.pin.length !== 4) {
      Swal.fire({
        icon: "warning",
        title: "PIN Required",
        text: "Please enter your 4-digit PIN before continuing.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
      return;
    }

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Give Courtesy",
      html: `
        <p class="text-sm text-gray-600 mb-3">This ticket will be waived. Please provide a reason.</p>
        <textarea id="courtesy-reason" class="swal2-textarea w-full" placeholder="Enter reason for courtesy..." rows="3" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:14px;"></textarea>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Apply Courtesy",
      confirmButtonColor: getPrimaryThemeColor(),
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const el = document.getElementById(
          "courtesy-reason",
        ) as HTMLTextAreaElement;
        const val = el?.value?.trim();

        if (!val) {
          Swal.showValidationMessage(
            "A reason is required to apply a courtesy.",
          );
          return false;
        }

        return val;
      },
    });

    if (!isConfirmed || !reason) return;

    setCourtesyLoading(true);

    try {
      const resolvedLat = locationMode === "manual" ? latitude : ctxLatitude;
      const resolvedLng = locationMode === "manual" ? longitude : ctxLongitude;

      const res = await fetch("/api/valetTransaction/courtesy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          reason,
          givenBy: accountUser || "Unknown",
          givenAt: new Date().toISOString(),
          propertyId,
          pin: form?.pin,
          latitude: resolvedLat ?? 0,
          longitude: resolvedLng ?? 0,
        }),
      });

      const result = await res.json();

      if (result?.result?.status === "200") {
        setOpen(false);
        setReloadPageData(true);

        Swal.fire({
          icon: "success",
          title: "Courtesy Applied",
          html: `
            <p>The valet fee has been waived.</p>
            <p class="mt-2 text-sm text-gray-500">Reason: <em>${reason}</em></p>
            <p class="text-sm text-gray-500">Given by: <strong>${
              accountUser || "Unknown"
            }</strong></p>
          `,
          showConfirmButton: false,
          timer: 3000,
        });

        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Courtesy Failed",
          text:
            result?.result?.message ||
            "Could not apply courtesy. Please try again.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Courtesy error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setCourtesyLoading(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white">
      <form className="space-y-7 p-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary transition-colors duration-300">
                Payment Session
              </p>

              <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-slate-950">
                Checkout
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Select rate, verify PIN, and complete the valet transaction.
              </p>
            </div>

            <div className="rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-2 text-xs font-extrabold text-primary transition-colors duration-300">
              Secure Checkout
            </div>
          </div>
        </div>

        {/* TRANSACTION TYPE / RATE SELECTION */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
              <MdOutlineReceiptLong className="text-primary transition-colors duration-300" />
              Select Rate
            </h3>

            {selectedTransactionType && (
              <span className="rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-extrabold text-primary transition-colors duration-300">
                {selectedTransactionType.name}
              </span>
            )}
          </div>

          {transactionTypes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
              No transaction types found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {transactionTypes.map((option) => {
                const active = form.paymentMethod === option.name;
                const optionTotal = calcDisplayTotal(
                  Number(option.value) || 0,
                  option.taxable,
                );

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        paymentMethod: option.name,
                        transactionTypeId: Number(option.id),
                        value: option.value,
                      }));
                    }}
                    className={`group flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
                      active
                        ? "border-(--primary-light) bg-(--primary-soft) shadow-[0_12px_30px_color-mix(in_srgb,var(--primary)_18%,transparent)]"
                        : "border-slate-200 bg-white hover:border-(--primary-light) hover:bg-(--primary-soft)"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-extrabold transition-colors duration-300 ${
                          active ? "text-primary" : "text-slate-900"
                        }`}
                      >
                        {option.name}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {option.taxable ? "Taxable rate" : "Flat rate"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-black transition-colors duration-300 ${
                          active ? "text-primary" : "text-slate-900"
                        }`}
                      >
                        ${option.value.toFixed(2)}
                      </p>

                      {option.taxable ? (
                        <p className="text-xs font-bold text-slate-400">
                          Total ${optionTotal.toFixed(2)}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* PAYMENT METHOD */}
        <section>
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
            Payment Method
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => {
              const active = selectedPaymentMethod === method.key;

              return (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => {
                    setSelectedPaymentMethod(method.key);
                    if (method.key === "ecr") setTip(0);
                  }}
                  className={`flex h-14 px-2 py-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-extrabold transition-all duration-300 ${
                    active
                      ? "border-primary bg-primary text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_26%,transparent)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary"
                  }`}
                >
                  {method.icon}
                  {method.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* TERMINAL SELECTION — only for card/athm */}
        {(selectedPaymentMethod === "ecr" ||
          selectedPaymentMethod === "athm") && (
          <section>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
              Terminal
            </h3>

            {terminals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400">
                No terminals configured for this property.
              </div>
            ) : terminals.length === 1 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-(--primary-light) bg-(--primary-soft) p-4 transition-colors duration-300">
                <FaCreditCard className="text-primary transition-colors duration-300" />
                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    {terminals[0].name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {terminals[0].is_default
                      ? "Default terminal"
                      : "Auto-selected (only terminal)"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {terminals.map((terminal) => {
                  const active = selectedTerminalId === terminal.id;

                  return (
                    <button
                      key={terminal.id}
                      type="button"
                      onClick={() => setSelectedTerminalId(terminal.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                        active
                          ? "border-(--primary-light) bg-(--primary-soft) shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_18%,transparent)]"
                          : "border-slate-200 bg-white hover:border-(--primary-light) hover:bg-(--primary-soft)"
                      }`}
                    >
                      <FaCreditCard
                        className={`h-4 w-4 transition-colors duration-300 ${
                          active ? "text-primary" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">
                          {terminal.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {terminal.terminal_id}
                          {terminal.is_default && " — Default"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* RECEIPT PREFERENCES */}
        {/* {(selectedPaymentMethod === "ecr" ||
          selectedPaymentMethod === "athm") && (
          <section>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
              Receipt
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RECEIPT_OPTIONS.map((opt) => {
                const active = receiptOutput === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setReceiptOutput(opt.key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-300 cursor-pointer ${
                      active
                        ? "border-primary bg-primary text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {(receiptOutput === "html" || receiptOutput === "both") && (
              <div className="mt-3">
                <input
                  type="email"
                  placeholder="Receipt email (optional)"
                  value={receiptEmail === "no" ? "" : receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value || "no")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition 
                  focus:border-primary focus:ring-4 focus:ring-(--primary-soft)"
                />
              </div>
            )}
          </section>
        )} */}

        {/* TIP — hidden for ECR (terminal handles tips) */}
        {selectedPaymentMethod === "p2p" && (
          <section>
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
              Tip (Optional)
            </h3>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {[0, 1, 2, 3, 5].map((amount) => {
                const active = tip === amount;

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTip(amount)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition-all duration-300 cursor-pointer ${
                      active
                        ? "border-primary bg-primary text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary"
                    }`}
                  >
                    {amount === 0 ? "None" : `$${amount}`}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* INTERNAL NOTES */}
        <section>
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
            Internal Notes
          </h3>

          <textarea
            name="notes"
            value={form.notes || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add any special handling instructions or transaction notes..."
            className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-(--primary-soft)"
          />
        </section>

        {/* COURTESY — ADMIN ONLY */}
        {isAdmin && (
          <section className="rounded-2xl border border-(--primary-light) bg-(--primary-soft) p-4 transition-colors duration-300">
            <button
              type="button"
              onClick={handleCourtesy}
              disabled={courtesyLoading || !form?.pin || form.pin.length !== 4}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-all duration-300 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdCardGiftcard className="h-4 w-4" />
              {courtesyLoading ? "Applying..." : "Give Courtesy"}
            </button>

            <p className="mt-2 text-center text-xs font-medium text-slate-500">
              Admin only — requires a reason and valid PIN.
            </p>
          </section>
        )}

        {/* SECURITY PIN */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
            <RiSecurePaymentFill className="text-primary transition-colors duration-300" />
            Security PIN
          </h3>

          <FormInput
            name="pin"
            type="password"
            inputMode="numeric"
            placeholder="4-digit PIN"
            icon={<MdPassword className="h-4 w-4" />}
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

          <p className="mt-2 text-xs font-medium text-slate-400">
            Required for vehicle retrieval verification.
          </p>
        </section>
      </form>

      {/* STICKY FOOTER */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Total Balance
            </p>

            <p className="font-serif text-4xl font-bold text-slate-950">
              ${(displayTotal + tip).toFixed(2)}
            </p>
            <span className="ml-2 text-xs font-medium text-slate-500 font-serif float-right">
              {selectedTransactionType?.taxable ? "incl. tax" : "flat rate"}
              {tip > 0 ? " + tip" : ""}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-14 rounded-2xl border border-slate-200 bg-white px-8 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>

            <button
              onClick={handleSubmit}
              type="button"
              disabled={
                loader ||
                !propertyId ||
                !form?.paymentMethod ||
                !selectedPaymentMethod ||
                !form?.pin ||
                form.pin.length !== 4
              }
              className="h-14 cursor-pointer rounded-2xl bg-primary px-10 text-sm font-extrabold text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-all duration-300 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loader ? "Processing..." : "Submit Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
