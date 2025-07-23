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
    <div className="mb-4 relative">
      <select
        id={id}
        name={name}
        value={String(value)}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className={`w-full text-gray-800 px-2 py-2 border-b border-gray-500 text-sm tracking-tight bg-transparent focus:outline-none focus:border-blue-500 appearance-none transition-all placeholder:none ${
          disabled ? "bg-gray-200 cursor-not-allowed" : ""
        }`}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className={`absolute text-sm left-2 px-1 transition-all duration-200 bg-transparent pointer-events-none ${
          isFocused || value
            ? "top-[-8px] text-xs text-blue-600"
            : "top-[11px] text-gray-500"
        }`}
      >
        {value ? label : ""}
      </label>
    </div>
  );
};

export default ModalSelect;
