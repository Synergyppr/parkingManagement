"use client";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const FloatingLabelInput = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  maxLength,
  disabled,
}: {
  id: string;
  name: string;
  type?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  disabled?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const isPasswordType = type === "password";
  const inputType = isPasswordType && !showPassword ? "password" : "text";

  return (
    <div className="mb-2 relative">
      <input
        type={inputType}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=" "
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full text-gray-800 px-3 py-2 pr-10 border border-gray-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          disabled ? "bg-gray-200 cursor-not-allowed" : ""
        } bg-white autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_white]`}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm transition-all duration-200 left-3 px-1 bg-white ${
          isFocused || value
            ? "top-[-8px] text-xs text-blue-600"
            : "top-[11px] text-gray-500"
        }`}
      >
        {label}
      </label>

      {/* Toggle icon only if type is password */}
      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
          tabIndex={-1} // Avoids interfering with tab navigation
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default FloatingLabelInput;
