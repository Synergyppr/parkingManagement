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
  const inputClass = `pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none ${className}`;

  return (
    <div className="relative w-full">
      {icon && (
        <div
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
            missing ? "text-red-600" : "text-blue-600"
          }`}
        >
          {icon}
        </div>
      )}

      {type === "select" ? (
        <select
          name={name}
          onChange={onChange}
          value={value || ""}
          className={inputClass}
        >
          <option value="">Select</option>
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
            className={`${inputClass} pr-10`} // reserve space for icon
            required={required}
          />

          {/* Show Clear Button */}
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )}

          {/* Optional password toggle */}
          {showPasswordToggle && setShowPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </>
      )}
    </div>
  );
}
