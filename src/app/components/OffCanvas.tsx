"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProperty } from "../context/PropertyContext";

import { IoSettings, IoClose } from "react-icons/io5";
import { MdHomeFilled } from "react-icons/md";
import { HiDocumentReport } from "react-icons/hi";
import { FaCar, FaComment } from "react-icons/fa6";
import { KeySquare } from "lucide-react";

// Navigation Sidebar

export default function OffCanvas({
  setIsMenuOpen,
  isMenuOpen,
}: {
  setIsMenuOpen: (isOpen: boolean) => void;
  isMenuOpen: boolean;
}) {
  const pathname = usePathname();
  const { propertyName } = useProperty();

  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (target && asideRef.current && !asideRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    /*
     * Delay listener registration so the same click that opens the menu
     * does not immediately close it.
     */
    const timeoutId = window.setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick, {
        passive: true,
      });
    }, 0);

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timeoutId);

      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen, setIsMenuOpen]);

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-9998 bg-slate-950/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 right-0 z-9999 flex h-screen min-h-screen w-[88vw] max-w-90 flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] animate-[slideInRight_0.3s_ease-out]"
      >
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
        </div>

        <nav className="h-full flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Employee
            </p>

            <div className="space-y-1.5">
              <Link
                href="/check-in"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("check-in"))}
              >
                <span className={iconClass(pathname.includes("check-in"))}>
                  <MdHomeFilled className="h-4 w-4" />
                </span>
                Check-In / Vehicles
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={navItemClass(pathname.includes("dashboard"))}
              >
                <span className={iconClass(pathname.includes("dashboard"))}>
                  <FaCar className="h-4 w-4" />
                </span>
                Dashboard
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
        </nav>

        <div className="border-t border-slate-200 bg-slate-50/80 p-4">
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
