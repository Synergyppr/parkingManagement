"use client";
import { Tenant, UserForm, Property } from "../types";
import ModalInput from "./elements/ModalInput";
import ModalTextarea from "./elements/ModalTextarea";
import ModalSelect from "./elements/ModalSelect";
import ButtonLoader from "./elements/ButtonLoader";

export type FieldType =
  | "text"
  | "password"
  | "textarea"
  | "select"
  | "date"
  | "number";

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type?: FieldType;
  value?: string | number;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface ModalFormProps {
  title: string;
  initialData:
    | Tenant
    | UserForm
    | Property
    | Record<string, Tenant | UserForm | Property>;
  fields: FormFieldConfig[];
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onSubmit: () => void;
  onToggleActive?: () => void;
  isActive?: boolean;
  showActiveToggle?: boolean;
  submitLabel?: string;
  loading?: boolean;
  disableSubmit?: boolean;
}

const ModalForm = ({
  title,
  initialData,
  fields,
  onChange,
  onSubmit,
  isActive,
  onToggleActive,
  showActiveToggle = false,
  submitLabel = "Submit",
  loading = false,
  disableSubmit,
}: ModalFormProps) => {
  const getFieldValue = (fieldName: string) =>
    String(
      (initialData as Record<string, Tenant | UserForm | Property>)[
        fieldName
      ] || ""
    );

  return (
    <form className="mx-auto flex w-full min-w-full flex-col rounded-4xl bg-white text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-5 py-6 md:px-7">
        <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
          Configuration
        </span>

        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Complete the required details below and save your configuration.
        </p>
      </div>

      {/* Body */}
      <div className="space-y-5 px-5 py-6 md:px-7">
        {fields?.map((field) => {
          if (field?.hidden) return null;

          switch (field.type) {
            case "textarea":
              return (
                <div key={field.id} className="rounded-2xl bg-slate-50/70 p-1">
                  <ModalTextarea
                    id={field.id}
                    name={field.name}
                    label={field.label}
                    value={getFieldValue(field.name)}
                    onChange={onChange}
                    maxLength={field?.maxLength}
                    disabled={field?.disabled}
                    autoComplete={field?.autoComplete}
                    rows={4}
                  />
                </div>
              );

            case "select":
              return (
                <div key={field.id} className="rounded-2xl bg-slate-50/70 p-1">
                  <ModalSelect
                    id={field.id}
                    name={field.name}
                    label={field.label}
                    onChange={onChange}
                    value={getFieldValue(field.name)}
                  >
                    <option value="">Select {field.label}</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </ModalSelect>
                </div>
              );

            case "date":
              return (
                <div
                  key={field.id}
                  className="relative rounded-2xl bg-slate-50/70 p-1"
                >
                  <div className="relative">
                    <input
                      id={field.id}
                      name={field.name}
                      type="date"
                      value={String(
                        (
                          initialData as Record<
                            string,
                            Tenant | UserForm | Property
                          >
                        ).dateOfBirth || ""
                      )}
                      onChange={onChange}
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 pt-4 text-sm font-medium text-slate-800 outline-none 
                      transition focus:border-primary focus:ring-4 focus:ring-(--primary-soft)"
                    />

                    <label
                      htmlFor={field?.id}
                      className="pointer-events-none absolute -top-2 left-3 bg-white px-2 text-xs font-bold text-primary"
                    >
                      {field?.label}
                    </label>
                  </div>
                </div>
              );

            default:
              return (
                <div key={field.id} className="rounded-2xl bg-slate-50/70 p-1">
                  <ModalInput
                    id={field.id}
                    name={field.name}
                    label={field.label}
                    value={getFieldValue(field.name)}
                    type={field.type || "text"}
                    onChange={onChange}
                  />
                </div>
              );
          }
        })}

        {showActiveToggle && typeof isActive === "boolean" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-slate-950">
                  Status
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Toggle whether this record is active in the system.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleActive}
                className={`relative flex h-8 w-14 cursor-pointer items-center rounded-full transition-all duration-300 ${
                  isActive ? "bg-primary" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    isActive ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
              {isActive ? "Active" : "Inactive"}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-xl md:px-7">
        <button
          type="button"
          disabled={loading || disableSubmit}
          className={`flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition ${
            loading || disableSubmit
              ? "cursor-not-allowed bg-[color-mix(in_srgb,var(--primary)_60%,transparent)] text-white opacity-60"
              : "cursor-pointer bg-primary text-white hover:bg-secondary"
          }`}
          onClick={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {loading ? <ButtonLoader /> : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ModalForm;