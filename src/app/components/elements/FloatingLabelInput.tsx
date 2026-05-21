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
    <div className="relative">
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
        className={`peer w-full h-11 text-gray-900 px-3 pr-10 border border-gray-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        } autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_white]`}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm transition-all duration-200 left-3 px-1 bg-white pointer-events-none ${
          isFocused || value
            ? "top-[-8px] text-xs text-blue-600"
            : "top-3 text-gray-400"
        }`}
      >
        {label}
      </label>

      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default FloatingLabelInput;
