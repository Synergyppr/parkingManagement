"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface FloatingLabelInputProps {
  id: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}

const FloatingLabelInput = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  maxLength,
  disabled = false,
  autoComplete,
  required = false,
  inputMode,
  className = "",
}: FloatingLabelInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === "password";

  const inputType: React.HTMLInputTypeAttribute = isPasswordType
    ? showPassword
      ? "text"
      : "password"
    : type;

  const shouldFloatLabel = isFocused || Boolean(value);

  return (
    <div className={`relative w-full ${className}`}>
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
        required={required}
        inputMode={inputMode}
        aria-describedby={`${id}-label`}
        className={`peer h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all
        duration-200 placeholder:text-transparent
          ${isPasswordType ? "pr-12" : "pr-4"}
          ${
            disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
              : `hover:border-(--primary-light) focus:border-primary focus:ring-4 focus:ring-(--primary-soft)`
          }
          autofill:bg-white
          autofill:shadow-[inset_0_0_0px_1000px_white]
          disabled:shadow-none
        `}
      />

      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`pointer-events-none absolute left-3 rounded-lg px-1.5 transition-all duration-200
          ${
            shouldFloatLabel
              ? `-top-2 bg-white text-xs font-semibold text-primary`
              : `top-3.5 bg-transparent text-sm text-slate-400`
          }
          ${disabled && shouldFloatLabel ? "text-slate-400" : ""}
        `}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>

      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer
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
            disabled:opacity-40
          "
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
