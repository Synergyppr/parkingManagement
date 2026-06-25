// components/elements/FormInput.tsx
import React from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";

interface Option {
  id: number | string;
  name: string;
}

interface FormInputProps {
  name: string;
  value?: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
}

export default function FormInput({
  name,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  required,
  showPasswordToggle,
  showPassword,
  setShowPassword,
  options = [],
  className = "",
  missing = false,
  onClear,
}: FormInputProps) {
  const basePaddingLeft = icon ? "pl-9" : "pl-3";
  const baseClass = `${basePaddingLeft} h-11 bg-white border rounded-xl text-sm text-slate-900 w-full outline-none transition-all duration-300 shadow-sm focus:ring-4 focus:ring-amber-200/50 focus:border-amber-500 hover:border-amber-300 ${
    missing ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
  } ${className}`;

  return (
    <div className="relative w-full">
      {icon && (
        <div
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            missing ? "text-red-500" : "text-amber-500"
          } pointer-events-none`}
        >
          {icon}
        </div>
      )}

      {type === "select" ? (
        <select
          name={name}
          onChange={onChange}
          value={value || ""}
          className={`${baseClass} appearance-none pr-8 capitalize bg-linear-to-b from-white to-amber-50/20`}
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
      ) : (
        <>
          <input
            type={showPasswordToggle && !showPassword ? "password" : "text"}
            name={name}
            placeholder={placeholder}
            value={value || ""}
            onChange={onChange}
            className={`${baseClass} pr-10 capitalize bg-linear-to-b from-white to-amber-50/20`}
            required={required}
          />

          {/* Show Clear Button */}
          {value && !showPasswordToggle && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors focus:outline-none cursor-pointer"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )}

          {/* Optional password toggle */}
          {showPasswordToggle && setShowPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
