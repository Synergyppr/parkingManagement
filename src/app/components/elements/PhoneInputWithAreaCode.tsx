// components/elements/PhoneInputWithAreaCode.tsx
"use client";
import React, { useMemo } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { IoPhonePortrait } from "react-icons/io5";
import countries from "@/app/lib/areaCodes";

interface PhoneInputWithAreaCodeProps {
  areaCode: string;
  phoneNumber: string;
  onAreaCodeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  missing?: boolean;
  isLoading?: boolean;
}

export default function PhoneInputWithAreaCode({
  areaCode,
  phoneNumber,
  onAreaCodeChange,
  onPhoneNumberChange,
  onClear,
  missing = false,
  isLoading = false,
}: PhoneInputWithAreaCodeProps) {
  const uniqueCountries = useMemo(
    () =>
      countries?.filter(
        (c, index, self) =>
          index === self?.findIndex((t) => t?.number === c?.number)
      ),
    []
  );

  return (
    <div className="flex gap-2">
      {/* Area Code Select */}
      <select
        value={areaCode}
        onChange={onAreaCodeChange}
        className={`h-11 px-2 bg-white border rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 w-20 shrink-0 appearance-none ${
          missing ? "border-red-300" : "border-gray-200"
        }`}
      >
        {uniqueCountries?.map((opt) => (
          <option key={opt?.id} value={opt?.number}>
            {opt?.flag} {opt?.number}
          </option>
        ))}
      </select>

      {/* Phone Number Input */}
      <div className="relative flex-1">
        <IoPhonePortrait className={`absolute left-3 top-3.5 w-4 h-4 pointer-events-none ${
          missing ? "text-red-500" : "text-gray-400"
        }`} />
        <input
          type="text"
          name="phoneNumber"
          placeholder="(XXX) XXX-XXXX"
          value={phoneNumber}
          onChange={onPhoneNumberChange}
          className={`w-full h-11 pl-9 pr-8 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 text-sm ${
            missing ? "border-red-300" : "border-gray-200"
          }`}
        />

        {/* Loading spinner or clear button */}
        {isLoading ? (
          <span className="absolute right-3 top-3.5">
            <svg
              className="w-4 h-4 animate-spin text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </span>
        ) : (
          phoneNumber && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
