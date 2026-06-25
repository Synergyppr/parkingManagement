"use client";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ModalInput = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  maxLength,
  disabled,
  autoComplete,
}: {
  id: string;
  name: string;
  type?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const isPasswordType = type === "password";
  const inputType = isPasswordType && !showPassword ? "password" : "text";

  return (
    <div className="mb-4 relative">
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
        autoComplete={autoComplete}
        className={`w-full text-gray-800 px-2 py-2 pr-10 border-b border-gray-500 text-sm tracking-tight bg-transparent focus:outline-none focus:border-amber-500 transition-all ${
          disabled ? "bg-gray-200 cursor-not-allowed" : ""
        } autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_white]`}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm left-2 px-1  transition-all duration-200 ${
          isFocused || value
            ? "top-[-8px] text-xs text-amber-600"
            : "top-[11px] text-gray-500"
        }`}
      >
        {label}
      </label>

      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default ModalInput;
