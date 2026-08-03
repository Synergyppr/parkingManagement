"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useProperty } from "../context/PropertyContext";
import { FaRegMoneyBill1, FaRegCreditCard } from "react-icons/fa6";
import { MdOutlinePercent, MdEdit } from "react-icons/md";
import { IoReceiptOutline } from "react-icons/io5";
import FormInput from "../components/elements/FormInput";
import { RateEntry } from "../types";
import ButtonLoader from "./elements/ButtonLoader";

const PR_DEFAULT_STATE_TAX = 10.5;
const PR_DEFAULT_CITY_TAX = 1.0;

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

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
  return roundToTwo(
    base + calcStateTax(base, stateRate) + calcCityTax(base, cityRate)
  );
}

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

  const resetForm = () => {
    setFormName("");
    setFormValue("");
    setFormTaxable(false);
    setFormStateTaxRate(PR_DEFAULT_STATE_TAX.toString());
    setFormCityTaxRate(PR_DEFAULT_CITY_TAX.toString());
    setEditingId(null);
  };

  const startEdit = (entry: RateEntry) => {
    setEditingId(entry.id);
    setFormName(entry.name);
    setFormValue(String(entry.value));
    setFormTaxable(entry.taxable ?? false);
    setFormStateTaxRate(String(entry.stateTaxRate ?? PR_DEFAULT_STATE_TAX));
    setFormCityTaxRate(String(entry.cityTaxRate ?? PR_DEFAULT_CITY_TAX));
  };

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
          propertyId,
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
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `${title} "${formName}" has been saved successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });

        fetchTransactionTypes();
        router.refresh();
        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            result?.result?.message ||
            `Failed to save ${title?.toLowerCase()}. Please try again.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error saving transaction type:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving this rate.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
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
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setButtonLoading(true);

      try {
        const response = await fetch(`/api/valetTransaction/types/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ id }]),
        });

        const resData = await response.json();

        if (resData?.result?.status === "200") {
          setEntries((prev) => prev?.filter((e) => e?.id !== id));
          fetchTransactionTypes?.();
          router.refresh();

          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: `${title} has been deleted.`,
            confirmButtonColor: getPrimaryThemeColor(),
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text:
              resData?.result?.message ||
              `Failed to delete ${title?.toLowerCase()}.`,
            confirmButtonColor: getPrimaryThemeColor(),
          });
        }
      } catch (error) {
        console.error("Error deleting transaction type:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while deleting this rate.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } finally {
        setButtonLoading(false);
      }
    });
  };

  const baseAmount = parseFloat(formValue) || 0;
  const stateRate = parseFloat(formStateTaxRate) || 0;
  const cityRate = parseFloat(formCityTaxRate) || 0;

  const previewStateTax =
    formTaxable && baseAmount > 0 ? calcStateTax(baseAmount, stateRate) : 0;
  const previewCityTax =
    formTaxable && baseAmount > 0 ? calcCityTax(baseAmount, cityRate) : 0;
  const previewTotal =
    formTaxable && baseAmount > 0
      ? calcTotal(baseAmount, stateRate, cityRate)
      : baseAmount;

  return (
    <div className="bg-white text-slate-800">
      <div className="space-y-5 p-5">
        {/* Tax Panel Toggle */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowTaxPanel((prev) => !prev)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition ${
              showTaxPanel
                ? "border-primary bg-primary text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                : "border-(--primary-light) bg-(--primary-soft) text-primary hover:bg-(--primary-soft)"
            }`}
          >
            <MdOutlinePercent className="h-4 w-4" />
            Default Tax
          </button>
        </div>

        {showTaxPanel && (
          <section className="rounded-4xl border border-(--primary-light) bg-linear-to-br from-(--primary-soft) to-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_24%,transparent)]">
                <MdOutlinePercent className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-slate-950">
                  Puerto Rico IVU
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Default tax rates for taxable valet services.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-(--primary-light) bg-white p-4 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  IVU Estatal
                </p>
                <p className="mt-1 font-serif text-3xl font-bold text-primary">
                  {PR_DEFAULT_STATE_TAX}%
                </p>
              </div>

              <div className="rounded-2xl border border-(--primary-light) bg-white p-4 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  IVU Municipal
                </p>
                <p className="mt-1 font-serif text-3xl font-bold text-primary">
                  {PR_DEFAULT_CITY_TAX}%
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              Combined default rate:{" "}
              <strong className="text-slate-950">
                {PR_DEFAULT_STATE_TAX + PR_DEFAULT_CITY_TAX}%
              </strong>
              . Tax is calculated on top of the base amount.
            </p>
          </section>
        )}

        {/* Form */}
        <section className="rounded-4xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {editingId ? "Update Rate" : "Add New Rate"}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Create valet payment rates and optionally attach IVU tax.
            </p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput
                name="formName"
                placeholder={`Enter ${title}`}
                icon={<FaRegCreditCard />}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onClear={() => setFormName("")}
              />

              <FormInput
                name="formValue"
                placeholder="Enter amount"
                icon={<FaRegMoneyBill1 />}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                onClear={() => setFormValue("")}
              />
            </div>

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={
                  buttonLoading || !formName.trim() || !formValue.trim()
                }
                onClick={handleSubmit}
                className={`flex h-12 flex-1 items-center justify-center rounded-2xl text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition ${
                  buttonLoading || !formName.trim() || !formValue.trim()
                    ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-70"
                    : "cursor-pointer bg-primary hover:bg-secondary"
                }`}
              >
                {buttonLoading ? (
                  <ButtonLoader />
                ) : editingId ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </button>
            </div>

            {/* Tax Toggle */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-950">
                    Taxable Rate
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Enable this when IVU should be added to the base rate.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormTaxable((prev) => !prev)}
                  className={`relative flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition ${
                    formTaxable ? "bg-primary" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      formTaxable ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                {formTaxable ? "Includes Tax" : "No Tax"}
              </div>

              {formTaxable && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TaxInput
                      label="IVU Estatal"
                      value={formStateTaxRate}
                      onChange={setFormStateTaxRate}
                    />

                    <TaxInput
                      label="IVU Municipal"
                      value={formCityTaxRate}
                      onChange={setFormCityTaxRate}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={applyDefaultTax}
                    className="text-xs font-bold text-primary transition hover:text-primary"
                  >
                    Reset to PR defaults
                  </button>
                </div>
              )}
            </div>

            {formTaxable && baseAmount > 0 && (
              <section className="rounded-2xl border border-(--primary-light) bg-[color-mix(in_srgb,var(--primary-soft)_70%,transparent)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <IoReceiptOutline className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    Tax Breakdown Preview
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <PreviewRow
                    label="Base amount"
                    value={`$${baseAmount.toFixed(2)}`}
                  />
                  <PreviewRow
                    label={`IVU Estatal (${stateRate}%)`}
                    value={`+$${previewStateTax.toFixed(2)}`}
                  />
                  <PreviewRow
                    label={`IVU Municipal (${cityRate}%)`}
                    value={`+$${previewCityTax.toFixed(2)}`}
                  />

                  <div className="flex justify-between border-t border-(--primary-light) pt-2 font-black text-primary">
                    <span>Total to charge</span>
                    <span>${previewTotal.toFixed(2)}</span>
                  </div>
                </div>
              </section>
            )}
          </form>
        </section>

        {/* Rate List */}
        <section className="rounded-4xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Available Rates
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {entries?.length || 0} rate(s)
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
              <FaRegMoneyBill1 className="h-4 w-4" />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto pr-1">
            {entries?.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No {title}s yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {entries.map((entry) => {
                  const base = Number(entry.value);
                  // const sRate = entry.stateTaxRate ?? 0;
                  // const cRate = entry.cityTaxRate ?? 0;
                  // const sTax = entry.taxable ? calcStateTax(base, sRate) : 0;
                  // const cTax = entry.taxable ? calcCityTax(base, cRate) : 0;
                  // const total = entry.taxable
                  //   ? calcTotal(base, sRate, cRate)
                  //   : base;

                  return (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-(--primary-light) hover:bg-[color-mix(in_srgb,var(--primary-soft)_40%,transparent)]"
                    >
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-950">
                          {entry.name}
                        </h3>

                        <p className="mt-1 font-serif text-3xl font-bold text-primary">
                          ${base.toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-(--primary-light) bg-white p-3 text-xs">
                        <div className="mb-2 inline-flex rounded-full bg-(--primary-soft) px-2.5 py-1 font-bold text-primary">
                          {entry.taxable ? "+ tax" : "flat rate"}
                        </div>

                        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-black text-slate-950">
                          <span>Total</span>
                          <span>
                            ${entry.taxable
                              ? roundToTwo(base + roundToTwo(base * 0.105) + roundToTwo(base * 0.01)).toFixed(2)
                              : base.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          disabled={buttonLoading}
                          onClick={() => startEdit(entry)}
                          className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-(--primary-light) bg-(--primary-soft) text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                        >
                          <MdEdit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={buttonLoading}
                          onClick={() => deleteEntry(entry.id)}
                          className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const TransactionTypeManager: React.FC<{
  transactionTypes: RateEntry[];
  fetchTransactionTypes: () => Promise<void>;
}> = ({ transactionTypes, fetchTransactionTypes }) => {
  return (
    <div className="overflow-hidden bg-white">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 text-center">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Rate Center
        </span>

        <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
          Rates
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Manage available valet rates, taxable services, and live tax
          calculations.
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

function TaxInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-(--primary-light) bg-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] px-4 py-3">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <div className="mt-1 flex items-center gap-2">
        <input
          autoFocus={false}
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-2xl font-black text-primary outline-none"
        />
        <span className="text-sm font-black text-primary">%</span>
      </div>
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-slate-600">
      <span>{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
