"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useProperty } from "../context/PropertyContext";
import { PaymentTerminal } from "../types";
import { FaCreditCard, FaKey } from "react-icons/fa";
import { MdTerminal } from "react-icons/md";
import FormInput from "./elements/FormInput";
import ButtonLoader from "./elements/ButtonLoader";

interface TerminalManagerProps {
  data?: PaymentTerminal[];
  fetchTerminals: () => void;
}

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") return "#d6a800";

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#d6a800"
  );
};

function TerminalManager({ data, fetchTerminals }: TerminalManagerProps) {
  const { propertyId, accountUser } = useProperty();
  const [terminals, setTerminals] = useState<PaymentTerminal[]>(data || []);
  const [formName, setFormName] = useState("");
  const [formTerminalUrl, setFormTerminalUrl] = useState("");
  const [formTerminalId, setFormTerminalId] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    setTerminals(data || []);
  }, [data]);

  const resetForm = () => {
    setFormName("");
    setFormTerminalUrl("");
    setFormTerminalId("");
    setFormApiKey("");
    setFormIsDefault(false);
    setEditingId(null);
  };

  const handleEdit = (terminal: PaymentTerminal) => {
    setFormName(terminal.name);
    setFormTerminalUrl(terminal.terminal_url);
    setFormTerminalId(terminal.terminal_id);
    setFormApiKey(terminal.api_key || "");
    setFormIsDefault(terminal.is_default);
    setEditingId(terminal.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formName?.trim() ||
      !formTerminalUrl?.trim() ||
      !formTerminalId?.trim() ||
      !formApiKey?.trim()
    ) {
      return;
    }

    setButtonLoading(true);

    try {
      const payload: Record<string, unknown> = {
        property_id: propertyId || "",
        name: formName.trim(),
        terminal_url: formTerminalUrl.trim(),
        terminal_id: formTerminalId.trim(),
        api_key: formApiKey.trim(),
        is_default: formIsDefault,
      };

      if (editingId) {
        payload.id = editingId;
        payload.is_active = true;
        payload.updated_by = accountUser || "system";
      } else {
        payload.created_by = accountUser || "system";
      }

      const response = await fetch("/api/terminals/createOrEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result?.result?.status === "200" || result?.result?.status === 200) {
        fetchTerminals();

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Terminal "${formName}" ${
            editingId ? "updated" : "added"
          } successfully.`,
          confirmButtonColor: getPrimaryThemeColor(),
        });

        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.result?.message || "Failed to save terminal.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      }
    } catch (error) {
      console.error("Error saving terminal:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving this terminal.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const deleteTerminal = async (id: string) => {
    if (!id) return;

    Swal.fire({
      title: "Delete Terminal?",
      text: "This terminal will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setButtonLoading(true);

      try {
        const response = await fetch("/api/terminals/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            updated_by: accountUser || "system",
          }),
        });

        const res = await response.json();

        if (res?.result?.status === "200" || res?.result?.status === 200) {
          setTerminals((prev) => prev?.filter((t) => t?.id !== id));
          fetchTerminals();

          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "The terminal has been deleted.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res?.result?.message || "Failed to delete terminal.",
            confirmButtonColor: getPrimaryThemeColor(),
          });
        }
      } catch (err) {
        console.error("Error deleting terminal:", err);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while deleting this terminal.",
          confirmButtonColor: getPrimaryThemeColor(),
        });
      } finally {
        setButtonLoading(false);
      }
    });
  };

  return (
    <div className="bg-white text-slate-800">
      <div className="space-y-5 p-5">
        {/* Form */}
        <section className="rounded-4xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {editingId ? "Update Terminal" : "Add New Terminal"}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Configure payment ECR terminals for card and ATH Movil
              transactions.
            </p>
          </div>

          <form className="grid grid-cols-1 gap-3">
            <FormInput
              name="terminalName"
              placeholder="Terminal Name (e.g. Lobby POS)"
              icon={<MdTerminal />}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onClear={() => setFormName("")}
            />

            <FormInput
              name="terminalUrl"
              placeholder="Terminal URL (e.g. http://10.10.6.27:2030)"
              icon={<FaCreditCard />}
              value={formTerminalUrl}
              onChange={(e) => setFormTerminalUrl(e.target.value)}
              onClear={() => setFormTerminalUrl("")}
            />

            <FormInput
              name="terminalId"
              placeholder="Terminal ID (e.g. 40000267)"
              icon={<FaCreditCard />}
              value={formTerminalId}
              onChange={(e) => setFormTerminalId(e.target.value)}
              onClear={() => setFormTerminalId("")}
            />

            <FormInput
              name="apiKey"
              placeholder="API Key (required)"
              icon={<FaKey />}
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              onClear={() => setFormApiKey("")}
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
              <input
                autoFocus={false}
                type="checkbox"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-primary"
              />

              <span className="text-sm font-semibold text-slate-700">
                Set as default terminal
              </span>
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                buttonLoading ||
                !formName.trim() ||
                !formTerminalUrl.trim() ||
                !formTerminalId.trim() ||
                !formApiKey.trim()
              }
              className={`flex h-12 items-center justify-center rounded-2xl px-7 text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition ${
                buttonLoading ||
                !formName.trim() ||
                !formTerminalUrl.trim() ||
                !formTerminalId.trim() ||
                !formApiKey.trim()
                  ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] opacity-70"
                  : "cursor-pointer bg-primary hover:bg-secondary"
              }`}
            >
              {buttonLoading ? <ButtonLoader /> : editingId ? "Update" : "Add"}
            </button>
          </form>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-3 text-xs font-bold text-slate-400 transition hover:text-primary"
            >
              Cancel editing
            </button>
          )}
        </section>

        {/* Terminal List */}
        <section className="rounded-4xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Registered Terminals
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {terminals?.length || 0} terminal(s)
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
              <FaCreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto pr-1">
            {terminals?.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No terminals configured yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {terminals?.map((terminal) => (
                  <div
                    key={terminal.id}
                    className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-(--primary-light) hover:bg-[color-mix(in_srgb,var(--primary-soft)_50%,transparent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-extrabold text-slate-950">
                            {terminal.name}
                          </p>

                          {terminal.is_default && (
                            <span className="rounded-full bg-(--primary-soft) px-2 py-0.5 text-[10px] font-black text-primary">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          ID: {terminal.terminal_id}
                        </p>

                        <p className="text-xs text-slate-400">
                          {terminal.terminal_url}
                        </p>

                        <p className="text-xs text-slate-400">
                          API Key: {terminal.api_key ? "••••••••" + terminal.api_key.slice(-4) : "—"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={buttonLoading}
                          onClick={() => handleEdit(terminal)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-(--primary-soft) hover:text-primary disabled:opacity-50"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={buttonLoading}
                          onClick={() => deleteTerminal(terminal.id)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          title="Delete"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const TerminalCMS: React.FC<{
  terminals: PaymentTerminal[];
  fetchTerminals: () => void;
}> = ({ terminals, fetchTerminals }) => {
  return (
    <div className="overflow-hidden bg-white">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 text-center">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Payment Terminals
        </span>

        <h1 className="mt-3 font-serif text-3xl font-bold text-slate-950">
          Terminal Manager
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Configure ECR payment terminals for card and ATH Movil transactions on
          this property.
        </p>
      </div>

      <TerminalManager fetchTerminals={fetchTerminals} data={terminals || []} />
    </div>
  );
};

export default TerminalCMS;
