"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProperty } from "../context/PropertyContext";
import { handleLogout } from "../helpers/authHelpers";

import {
  IoLogOut,
  IoSettings,
  IoClose,
  IoColorPaletteOutline,
} from "react-icons/io5";
import { MdHomeFilled } from "react-icons/md";
import { HiDocumentReport } from "react-icons/hi";
import { FaCar, FaComment } from "react-icons/fa6";
import { KeySquare } from "lucide-react";

import ThemeSelector from "./ThemeSelector";

// Navigation Sidebar

export default function OffCanvas({
  setIsMenuOpen,
  isMenuOpen,
}: {
  setIsMenuOpen: (isOpen: boolean) => void;
  isMenuOpen: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    propertyName,
    accountUser,
    propertyId,
    setPropertyId,
    setPropertyName,
    setAccountUser,
  } = useProperty();

  if (!isMenuOpen) return null;

  const displayPropertyName =
    propertyName === "250" ? "250 Plaza" : propertyName || "Parkey";

  const propertySubtitle =
    propertyName === "250"
      ? "American International Plaza"
      : "Valet Operations";

  const navItemClass = (active: boolean) =>
    `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all ${
      active
        ? "border border-[var(--primary-light)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  const iconClass = (active: boolean) =>
    `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
      active
        ? "bg-[var(--primary)] text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
        : "bg-slate-100 text-slate-500 group-hover:bg-[var(--primary-soft)] group-hover:text-[var(--primary)]"
    }`;

  return (
    <>
      <div
        className="fixed inset-0 z-9998 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => setIsMenuOpen(false)}
      />

      <aside className="fixed right-0 top-0 z-9999 flex h-dvh w-[88vw] max-w-90 animate-[slideInRight_0.3s_ease-out] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="relative overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-(--primary-soft) to-white p-5">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-(--primary-soft)" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)]">
                  <KeySquare className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-serif text-2xl font-bold text-slate-950">
                    {displayPropertyName}
                  </h2>

                  <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {propertySubtitle}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-(--primary-soft) hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              title="Close menu"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-5 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-(--primary-light) to-primary text-base font-black text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
                {accountUser ? accountUser.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-950">
                  {accountUser || "User"}
                </p>

                <p className="text-xs font-semibold text-slate-400">
                  Active employee session
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 h-full">
          <div className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Employee
            </p>

            <div className="space-y-1.5">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("dashboard"))}
              >
                <span className={iconClass(pathname.includes("dashboard"))}>
                  <MdHomeFilled className="h-4 w-4" />
                </span>
                Dashboard
              </Link>

              <Link
                href="/check-in"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("check-in"))}
              >
                <span className={iconClass(pathname.includes("check-in"))}>
                  <FaCar className="h-4 w-4" />
                </span>
                Check-In / Vehicles
              </Link>

              <Link
                href="/tenants"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("tenants"))}
              >
                <span className={iconClass(pathname.includes("tenants"))}>
                  <IoSettings className="h-4 w-4" />
                </span>
                Tenant Configuration
              </Link>

              <Link
                href="/report"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("report"))}
              >
                <span className={iconClass(pathname.includes("report"))}>
                  <HiDocumentReport className="h-4 w-4" />
                </span>
                Ticket Report
              </Link>

              <Link
                href="/surveys"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("surveys"))}
              >
                <span className={iconClass(pathname.includes("surveys"))}>
                  <FaComment className="h-4 w-4" />
                </span>
                Service Feedback
              </Link>
            </div>
          </div>

          <div className="my-5 h-px bg-slate-200" />

          <div className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Client
            </p>

            <Link
              href="/request"
              onClick={() => setIsMenuOpen(false)}
              className={navItemClass(pathname.includes("request"))}
            >
              <span className={iconClass(pathname.includes("request"))}>
                <FaCar className="h-4 w-4" />
              </span>
              Request Car
            </Link>
          </div>

          <div className="my-5 h-px bg-slate-200" />

          <div className="my-auto">
            <div className="mb-2 flex items-center gap-2 px-2">
              <IoColorPaletteOutline className="h-4 w-4 text-primary" />

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Appearance
              </p>
            </div>

            <ThemeSelector />
          </div>
        </nav>

        <div className="border-t border-slate-200 bg-slate-50/80 p-4">
          <button
            type="button"
            onClick={() =>
              handleLogout({
                propertyId,
                setPropertyId,
                setPropertyName,
                setAccountUser,
                router,
              })
            }
            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-red-100 bg-white px-3 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <IoLogOut className="h-4 w-4" />
            </span>
            Log Out
          </button>

          <div className="mt-4 flex flex-col gap-1 px-2">
            <Link
              href="/privacy-policy"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="text-xs font-medium text-slate-400 transition hover:text-primary"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms-and-conditions"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="text-xs font-medium text-slate-400 transition hover:text-primary"
            >
              Terms and Conditions
            </Link>

            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              Parkey Valet
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
