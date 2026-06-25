"use client";
import React, { useState } from "react";

const ModalTextarea = ({
  id,
  name,
  label,
  value,
  onChange,
  maxLength,
  disabled,
  autoComplete,
  rows = 4,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
  rows?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-4 relative">
      <textarea
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
        rows={rows}
        className={`w-full text-gray-800 px-2 py-2 border-b border-gray-500 text-sm tracking-tight bg-transparent resize-none focus:outline-none focus:border-amber-500 transition-all ${
          disabled ? "bg-gray-200 cursor-not-allowed" : ""
        }`}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm left-2 px-1 transition-all duration-200 bg-transparent ${
          isFocused || value
            ? "-top-2 text-xs text-amber-600"
            : "top-2.75 text-gray-500"
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default ModalTextarea;
