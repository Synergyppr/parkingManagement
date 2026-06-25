// components/elements/PhoneInputWithAreaCode.tsx
"use client";
import React, { useMemo } from "react";
import { IoCloseOutline, IoPhonePortrait } from "react-icons/io5";
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
      <select
        value={areaCode}
        onChange={onAreaCodeChange}
        className={`h-11 w-24 shrink-0 appearance-none rounded-xl border bg-linear-to-b from-white to-amber-50/20 px-2 text-sm font-semibold text-slate-900 outline-none shadow-sm transition-all hover:border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 ${
          missing ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
        }`}
      >
        {uniqueCountries?.map((opt) => (
          <option key={opt?.id} value={opt?.number}>
            {opt?.flag} {opt?.number}
          </option>
        ))}
      </select>

      <div className="relative flex-1">
        <IoPhonePortrait
          className={`pointer-events-none absolute left-3 top-3.5 h-4 w-4 ${
            missing ? "text-red-500" : "text-amber-500"
          }`}
        />

        <input
          type="text"
          name="phoneNumber"
          placeholder="(XXX) XXX-XXXX"
          value={phoneNumber}
          onChange={onPhoneNumberChange}
          className={`h-11 w-full rounded-xl border bg-linear-to-b from-white to-amber-50/20 pl-9 pr-8 text-sm text-slate-900 outline-none shadow-sm transition-all placeholder:text-slate-400 hover:border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 ${
            missing ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
          }`}
        />

        {isLoading ? (
          <span className="absolute right-3 top-3.5">
            <svg
              className="h-4 w-4 animate-spin text-amber-500"
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
              className="absolute right-3 top-3.5 cursor-pointer text-slate-400 transition-colors hover:text-amber-600 focus:outline-none"
            >
              <IoCloseOutline className="h-4 w-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}