"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useProperty } from "../context/PropertyContext";
import { FaRegMoneyBill1, FaRegCreditCard } from "react-icons/fa6";
import { MdOutlinePercent } from "react-icons/md";
import { IoReceiptOutline } from "react-icons/io5";
import FormInput from "../components/elements/FormInput";
import { RateEntry } from "../types";

// Puerto Rico default IVU tax rates
const PR_DEFAULT_STATE_TAX = 10.5; // IVU Estatal
const PR_DEFAULT_CITY_TAX = 1.0;   // IVU Municipal

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcStateTax(base: number, rate: number) {
  return roundToTwo(base * (rate / 100));
}

function calcCityTax(base: number, rate: number) {
  return roundToTwo(base * (rate / 100));
}

function calcTotal(base: number, stateRate: number, cityRate: number) {
  return roundToTwo(base + calcStateTax(base, stateRate) + calcCityTax(base, cityRate));
}

// ─── Entry Manager ─────────────────────────────────────────────────────────

function EntryManager({
  title,
  data,
  fetchTransactionTypes,
}: {
  title: string;
  data?: RateEntry[];
  fetchTransactionTypes: () => Promise<void>;
}) {
  const router = useRouter();
  const { propertyId } = useProperty();
  const [entries, setEntries] = useState<RateEntry[]>(data || []);
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formTaxable, setFormTaxable] = useState(false);
  const [formStateTaxRate, setFormStateTaxRate] = useState<string>(
    PR_DEFAULT_STATE_TAX.toString()
  );
  const [formCityTaxRate, setFormCityTaxRate] = useState<string>(
    PR_DEFAULT_CITY_TAX.toString()
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [showTaxPanel, setShowTaxPanel] = useState(false);

  useEffect(() => {
    setEntries(data || []);
  }, [data]);

  const applyDefaultTax = () => {
    setFormStateTaxRate(PR_DEFAULT_STATE_TAX.toString());
    setFormCityTaxRate(PR_DEFAULT_CITY_TAX.toString());
  };

  const handleSubmit = async () => {
    if (!formName?.trim() || !formValue?.trim()) return;

    setButtonLoading(true);
    try {
      const sendForm = [
        {
          propertyId: propertyId,
          name: formName,
          value: formValue,
          id: editingId || 0,
          isActive: true,
          taxable: formTaxable,
          stateTaxRate: formTaxable ? parseFloat(formStateTaxRate) || 0 : null,
          cityTaxRate: formTaxable ? parseFloat(formCityTaxRate) || 0 : null,
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
          `${title} "${formName}" has been saved successfully.`,
          "success"
        );
        fetchTransactionTypes();
        router.refresh();

        setFormName("");
        setFormValue("");
        setFormTaxable(false);
        setFormStateTaxRate(PR_DEFAULT_STATE_TAX.toString());
        setFormCityTaxRate(PR_DEFAULT_CITY_TAX.toString());
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

  // Live preview math
  const baseAmount = parseFloat(formValue) || 0;
  const stateRate = parseFloat(formStateTaxRate) || 0;
  const cityRate = parseFloat(formCityTaxRate) || 0;
  const previewStateTax = formTaxable && baseAmount > 0 ? calcStateTax(baseAmount, stateRate) : 0;
  const previewCityTax = formTaxable && baseAmount > 0 ? calcCityTax(baseAmount, cityRate) : 0;
  const previewTotal = formTaxable && baseAmount > 0
    ? calcTotal(baseAmount, stateRate, cityRate)
    : baseAmount;

  return (
    <div className="overflow-hidden bg-white text-gray-800 relative">
      <div className="p-4 min-h-full">

        {/* Default Tax reference panel toggle */}
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => setShowTaxPanel((prev) => !prev)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              showTaxPanel
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-blue-700 border-blue-400 hover:bg-blue-50"
            }`}
          >
            <MdOutlinePercent className="w-3.5 h-3.5" />
            Default Tax
          </button>
        </div>

        {/* Default Tax reference panel */}
        {showTaxPanel && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
              <MdOutlinePercent className="w-4 h-4" />
              Puerto Rico IVU — Default Tax Rates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-blue-300 rounded-md px-3 py-2 text-center">
                <p className="text-xs text-gray-500">IVU Estatal (State)</p>
                <p className="text-lg font-bold text-blue-700">{PR_DEFAULT_STATE_TAX}%</p>
              </div>
              <div className="bg-white border border-blue-300 rounded-md px-3 py-2 text-center">
                <p className="text-xs text-gray-500">IVU Municipal (City)</p>
                <p className="text-lg font-bold text-blue-700">{PR_DEFAULT_CITY_TAX}%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-tight">
              Puerto Rico standard IVU rates. Combined total:{" "}
              <strong>{PR_DEFAULT_STATE_TAX + PR_DEFAULT_CITY_TAX}%</strong>. Tax
              is calculated on top of the base amount.
            </p>
          </div>
        )}

        {/* Add Rate Form */}
        <form className="flex flex-col gap-3 mb-4">
          {/* Name + Amount row */}
          <div className="flex flex-col md:flex-row lg:flex-row items-center gap-2">
            <FormInput
              name="formName"
              placeholder={`Enter ${title}`}
              icon={<FaRegCreditCard />}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onClear={() => setFormName("")}
            />
            <div className="flex gap-2 items-center w-full md:w-auto">
              <FormInput
                name="formValue"
                placeholder="Enter amount"
                icon={<FaRegMoneyBill1 />}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                onClear={() => setFormValue("")}
              />
              <button
                type="button"
                disabled={buttonLoading}
                onClick={handleSubmit}
                className="cursor-pointer whitespace-nowrap bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-md tracking-tight rounded"
              >
                {editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>

          {/* Tax toggle row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <div
                onClick={() => setFormTaxable((prev) => !prev)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                  formTaxable ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    formTaxable ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {formTaxable ? "Includes Tax" : "No Tax"}
              </span>
            </label>

            {/* Editable tax rate inputs */}
            {formTaxable && (
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* State tax input */}
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5">
                    <span className="text-xs text-gray-500 whitespace-nowrap">IVU Estatal:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formStateTaxRate}
                      onChange={(e) => setFormStateTaxRate(e.target.value)}
                      className="w-14 text-sm font-bold text-blue-700 bg-transparent focus:outline-none text-center"
                    />
                    <span className="text-sm text-blue-700 font-bold">%</span>
                  </div>

                  {/* City tax input */}
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5">
                    <span className="text-xs text-gray-500 whitespace-nowrap">IVU Municipal:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formCityTaxRate}
                      onChange={(e) => setFormCityTaxRate(e.target.value)}
                      className="w-14 text-sm font-bold text-blue-700 bg-transparent focus:outline-none text-center"
                    />
                    <span className="text-sm text-blue-700 font-bold">%</span>
                  </div>

                  {/* Reset to defaults button */}
                  <button
                    type="button"
                    onClick={applyDefaultTax}
                    className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer whitespace-nowrap"
                  >
                    Reset to PR defaults
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live tax preview */}
          {formTaxable && baseAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <IoReceiptOutline className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Tax Breakdown Preview
                </span>
              </div>
              <div className="space-y-0.5 text-gray-600 text-xs pl-6">
                <div className="flex justify-between">
                  <span>Base amount:</span>
                  <span className="font-medium">${baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVU Estatal ({stateRate}%):</span>
                  <span className="font-medium">+${previewStateTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVU Municipal ({cityRate}%):</span>
                  <span className="font-medium">+${previewCityTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-1 mt-1 font-bold text-blue-700 text-sm">
                  <span>Total to charge:</span>
                  <span>${previewTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Rate List */}
        <div className="max-h-52 overflow-y-auto">
          {entries?.length === 0 ? (
            <p className="text-gray-500 italic">No {title}s yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {entries.map((entry) => {
                const base = Number(entry.value);
                const sRate = entry.stateTaxRate ?? 0;
                const cRate = entry.cityTaxRate ?? 0;
                const sTax = entry.taxable ? calcStateTax(base, sRate) : 0;
                const cTax = entry.taxable ? calcCityTax(base, cRate) : 0;
                const total = entry.taxable ? calcTotal(base, sRate, cRate) : base;

                return (
                  <div
                    key={entry.id}
                    className="flex flex-col bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg shadow min-w-28"
                  >
                    {/* Name + delete */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{entry.name}</span>
                      <button
                        type="button"
                        disabled={buttonLoading}
                        onClick={() => deleteEntry(entry.id)}
                        className="ml-1 text-white hover:text-red-300 cursor-pointer leading-none"
                      >
                        ×
                      </button>
                    </div>

                    {/* Base price */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-gray-300 text-xs">
                        ${base.toFixed(2)}
                      </span>
                      {entry.taxable && (
                        <span className="text-yellow-300 text-xs ml-1 font-medium">
                          + {sRate + cRate}% tax
                        </span>
                      )}
                    </div>

                    {/* Tax breakdown */}
                    {entry.taxable && (sRate > 0 || cRate > 0) && (
                      <div className="mt-1 pt-1 border-t border-blue-400 text-xs text-blue-100 space-y-0.5">
                        {sRate > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>Est. ({sRate}%):</span>
                            <span>${sTax.toFixed(2)}</span>
                          </div>
                        )}
                        {cRate > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>Mun. ({cRate}%):</span>
                            <span>${cTax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2 font-bold text-white border-t border-blue-400 pt-0.5">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TransactionTypeManager ────────────────────────────────────────────────

const TransactionTypeManager: React.FC<{
  transactionTypes: RateEntry[];
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
