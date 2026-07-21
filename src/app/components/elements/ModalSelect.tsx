"use client";
import React, { useState } from "react";

const ModalSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative mb-4">
      <select
        id={id}
        name={name}
        value={String(value)}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className={`w-full appearance-none border-b border-gray-500 bg-transparent px-2 py-2 text-sm tracking-tight text-gray-800 transition-all 
          placeholder:none focus:border-primary focus:outline-none ${
            disabled ? "cursor-not-allowed bg-gray-200" : ""
          }`}
      >
        {children}
      </select>

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-2 bg-transparent px-1 text-sm transition-all duration-200 ${
          isFocused || value
            ? "-top-2 text-xs text-primary"
            : "top-2.75 text-gray-500"
        }`}
      >
        {value ? label : ""}
      </label>
    </div>
  );
};

export default ModalSelect;
