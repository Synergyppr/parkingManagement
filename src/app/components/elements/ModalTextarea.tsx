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
    <div className="relative mb-4">
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
        className={`w-full resize-none border-b border-gray-500 bg-transparent px-2 py-2 text-sm tracking-tight text-gray-800 transition-all 
          focus:border-primary focus:outline-none ${
            disabled ? "cursor-not-allowed bg-gray-200" : ""
          }`}
      />

      <label
        htmlFor={id}
        className={`absolute left-2 bg-transparent px-1 text-sm transition-all duration-200 ${
          isFocused || value
            ? "-top-2 text-xs text-primary"
            : "top-2.75 text-gray-500"
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default ModalTextarea;
