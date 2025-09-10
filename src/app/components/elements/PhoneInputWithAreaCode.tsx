// components/elements/PhoneInputWithAreaCode.tsx
import React from "react";
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
}

export default function PhoneInputWithAreaCode({
  areaCode,
  phoneNumber,
  onAreaCodeChange,
  onPhoneNumberChange,
  onClear,
  missing = false,
}: PhoneInputWithAreaCodeProps) {
  const uniqueCountries = countries?.filter(
    (c, index, self) =>
      index === self?.findIndex((t) => t?.number === c?.number)
  );

  return (
    <div className="relative w-full flex items-center border-b border-gray-500 focus-within:ring-1 focus-within:ring-[#ef6c00] rounded-sm">
      {/* Phone Icon */}
      <div
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
          missing ? "text-red-600" : "text-blue-600"
        }`}
      >
        <IoPhonePortrait />
      </div>

      {/* Area Code Select */}
      <select
        value={areaCode}
        onChange={onAreaCodeChange}
        className="ml-7 bg-transparent border-gray-300 pr-2 py-2 text-sm text-gray-700 focus:outline-none text-center"
      >
        {uniqueCountries?.map((opt) => (
          <option key={opt?.id} value={opt?.number}>
            {opt?.flag} {opt?.number}
          </option>
        ))}
      </select>

      {/* Phone Number Input */}
      <input
        type="text"
        name="phoneNumber"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={onPhoneNumberChange}
        className="flex-1 px-2 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none"
      />

      {/* Clear Button */}
      {phoneNumber && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <IoCloseOutline className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
