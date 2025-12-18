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
  return (
    <form className="p-4 md:p-6 min-w-full mx-auto space-y-4 rounded shadow text-gray-800 flex flex-col">
      <h2 className="text-xl font-semibold tracking-tight text-blue-500 flex items-center gap-2 mb-6">
        {title}
      </h2>

      {fields?.map((field) => {
        if (field?.hidden) return null;

        switch (field.type) {
          case "textarea":
            return (
              <ModalTextarea
                key={field.id}
                id={field.id}
                name={field.name}
                label={field.label}
                value={String(
                  (initialData as Record<string, Tenant | UserForm | Property>)[
                    field.name
                  ] || ""
                )}
                onChange={onChange}
                maxLength={field?.maxLength}
                disabled={field?.disabled}
                autoComplete={field?.autoComplete}
                rows={4}
                // {...commonProps}
              />
            );
          case "select":
            return (
              <ModalSelect
                key={field.id}
                id={field.id}
                name={field.name}
                label={field.label}
                onChange={onChange}
                value={String(
                  (initialData as Record<string, Tenant | UserForm | Property>)[
                    field.name
                  ] || ""
                )}
                // {...commonProps}
              >
                <option value="">Select {field.label}</option>
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </ModalSelect>
            );
          case "date":
            return (
              <div key={field.id} className="mb-4 relative">
                <input
                  key={field.id}
                  id={field.id}
                  name={field.name}
                  type="date"
                  value={String(
                    (
                      initialData as Record<
                        string,
                        Tenant | UserForm | Property
                      >
                    ).dateOfBirth
                  )}
                  onChange={onChange}
                  placeholder=""
                  className="w-full text-gray-800 px-2 py-2 border-b border-gray-500 text-sm tracking-tight bg-transparent focus:outline-none focus:border-blue-500 transition-all"
                />

                <label
                  htmlFor={field?.id}
                  className={`absolute left-2 px-1 text-sm transition-all duration-200 ${
                    true
                      ? "top-[-8px] text-xs text-blue-600"
                      : "top-[11px] text-gray-500"
                  }`}
                >
                  {field?.label}
                </label>
              </div>
            );
          default:
            return (
              <ModalInput
                key={field.id}
                id={field.id}
                name={field.name}
                label={field.label}
                value={String(
                  (initialData as Record<string, Tenant | UserForm | Property>)[
                    field.name
                  ] || ""
                )}
                type={field.type || "text"}
                onChange={onChange}
                // {...commonProps}
              />
            );
        }
      })}

      {showActiveToggle && typeof isActive === "boolean" && (
        <div className="w-full pt-0 relative flex gap-2">
          <div
            className="relative flex items-center justify-between w-14 h-8 cursor-pointer"
            onClick={onToggleActive}
          >
            <div
              className={`absolute w-full h-full rounded-full transition-all duration-300 ${
                isActive ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
            <div
              className={`absolute w-6 h-6 bg-white  rounded-full shadow-md transition-transform duration-300 ${
                isActive ? "translate-x-[28px]" : "translate-x-[5px]"
              }`}
            />
          </div>
          <div className="tracking-tight text-sm text-blue-500 relative top-2">
            {isActive ? "Active" : "Inactive"}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={loading || disableSubmit}
        className={`${
          loading || disableSubmit
            ? "cursor-not-allowed bg-opacity-60 opacity-60"
            : "hover:bg-blue-700 cursor-pointer"
        } 
        bg-blue-600 text-white p-3 w-full rounded-md font-semibold shadow`}
        onClick={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {loading ? <ButtonLoader /> : submitLabel}
      </button>
    </form>
  );
};

export default ModalForm;
