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
    <div className="relative mb-4">
      <input
        autoFocus={false}
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
        className={`w-full border-b border-gray-500 bg-transparent px-2 py-2 pr-10 text-sm tracking-tight text-gray-800 transition-all focus:border-primary 
          focus:outline-none ${
            disabled ? "cursor-not-allowed bg-gray-200" : ""
          } autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_white]`}
      />

      <label
        htmlFor={id}
        className={`absolute left-2 px-1 text-sm transition-all duration-200 ${
          isFocused || value
            ? "-top-2 text-xs text-primary"
            : "top-2.75 text-gray-500"
        }`}
      >
        {label}
      </label>

      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 transform text-gray-600 transition-colors hover:text-primary"
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default ModalInput;
