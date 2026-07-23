// components/elements/FormInput.tsx
import React from "react";
import { FaChevronDown, FaEye, FaEyeSlash } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";

interface Option {
  id: number | string;
  name: string;
}

interface FormInputProps {
  name: string;
  value?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: "text" | "password" | "select";
  required?: boolean;
  showPasswordToggle?: boolean;
  setShowPassword?: (show: boolean) => void;
  showPassword?: boolean;
  options?: Option[];
  className?: string;
  missing?: boolean;
  onClear?: () => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
  autoComplete?: string;
}

export default function FormInput({
  name,
  value = "",
  onChange,
  placeholder,
  icon,
  type = "text",
  required = false,
  showPasswordToggle = false,
  showPassword = false,
  setShowPassword,
  options = [],
  className = "",
  missing = false,
  onClear,
  inputMode = "text",
  disabled = false,
  autoComplete,
}: FormInputProps) {
  const hasRightAction =
    type === "select" ||
    showPasswordToggle ||
    Boolean(value && !showPasswordToggle && onClear);

  const paddingLeft = icon ? "pl-10" : "pl-3.5";
  const paddingRight = hasRightAction ? "pr-10" : "pr-3.5";

  const baseClass = `
    ${paddingLeft}
    ${paddingRight}
    h-11
    w-full
    rounded-xl
    border
    bg-white
    text-sm
    text-slate-900
    shadow-sm
    outline-none
    transition-all
    duration-300
    placeholder:text-slate-400
    hover:border-[var(--primary-light)]
    focus:border-[var(--primary)]
    focus:ring-4
    focus:ring-[var(--primary-soft)]
    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:text-slate-400
    disabled:opacity-70
    ${
      missing
        ? "border-red-300 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200"
    }
    ${className}
  `
    .replace(/\s+/g, " ")
    .trim();

  const resolvedInputType =
    type === "password" ? (showPassword ? "text" : "password") : "text";

  return (
    <div className="relative w-full">
      {icon && (
        <div
          className={`
            pointer-events-none
            absolute
            left-3
            top-1/2
            z-10
            flex
            h-4
            w-4
            -translate-y-1/2
            items-center
            justify-center
            transition-colors
            duration-300
            ${missing ? "text-red-500" : "text-primary"}
          `}
        >
          {icon}
        </div>
      )}

      {type === "select" ? (
        <>
          <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            aria-invalid={missing}
            className={`
              ${baseClass}
              cursor-pointer
              appearance-none
              capitalize
              bg-linear-to-b
              from-white
              to-(--primary-soft)
            `}
          >
            <option value="">
              Select {name.replace(/([A-Z])/g, " $1").trim()}
            </option>

            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <FaChevronDown
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              right-3.5
              top-1/2
              h-3
              w-3
              -translate-y-1/2
              transition-colors
              duration-300
              ${missing ? "text-red-500" : "text-primary"}
            `}
          />
        </>
      ) : (
        <>
          <input
            type={resolvedInputType}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            inputMode={inputMode}
            aria-invalid={missing}
            autoFocus={false}
            className={`
              ${baseClass}
              bg-linear-to-b
              from-white
              to-(--primary-soft)
            `}
          />

          {value && !showPasswordToggle && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label={`Clear ${placeholder || name}`}
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400
              transition-all duration-200 hover:bg-(--primary-soft) hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
            >
              <IoCloseOutline className="h-5 w-5" />
            </button>
          )}

          {showPasswordToggle && setShowPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute
                right-2.5
                top-1/2
                flex
                h-7
                w-7
                -translate-y-1/2
                cursor-pointer
                items-center
                justify-center
                rounded-full
                text-slate-400
                transition-all
                duration-200
                hover:bg-(--primary-soft)
                hover:text-primary
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-(--primary-light)
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {showPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
