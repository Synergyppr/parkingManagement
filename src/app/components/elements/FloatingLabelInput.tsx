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
        className={`peer h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed bg-slate-100"
            : "hover:border-amber-200"
        } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_white]`}
      />

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 bg-white/70 px-1.5 rounded-lg transition-all duration-200 ${
          isFocused || value
            ? "-top-2 text-xs font-semibold text-amber-600"
            : "top-3.5 text-sm text-slate-400"
        }`}
      >
        {label}
      </label>

      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-amber-600"
          tabIndex={-1}
        >
          {showPassword ? (
            <FaEyeSlash className="h-4 w-4" />
          ) : (
            <FaEye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default FloatingLabelInput;