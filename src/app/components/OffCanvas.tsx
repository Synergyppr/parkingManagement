"use client";
import Link from "next/link";
import {
  IoHomeOutline,
  IoSettingsOutline,
  IoCarSportOutline,
} from "react-icons/io5";
import { useProperty } from "../context/PropertyContext";

export default function OffCanvas({
  setIsMenuOpen,
  isMenuOpen,
}: {
  setIsMenuOpen: (isOpen: boolean) => void;
  isMenuOpen: boolean;
}) {
  const { propertyName } = useProperty();

  return (
    <>
      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-slate-100 border-l-2 border-blue-600 shadow-xl z-[9999] transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
          <h2 className="text-lg font-semibold">
            {propertyName ? propertyName : "Synergy"}
          </h2>
          <button
            className="text-white text-2xl hover:text-[#ef6c00] cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="flex flex-col gap-1 py-4 px-2 text-blue-900 font-medium">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded"
          >
            <IoHomeOutline /> Home
          </Link>
          <Link
            href="/tenants"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded"
          >
            <IoSettingsOutline /> Manage Tenants
          </Link>
          <Link
            href="/request"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded"
          >
            <IoCarSportOutline /> Request Car
          </Link>
          <Link
            href="/report"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded"
          >
            <IoCarSportOutline /> Report
          </Link>
        </nav>
      </div>

      {/* Background Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 bg-opacity-40 z-[9998]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
