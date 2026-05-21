"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProperty } from "../context/PropertyContext";
import { handleLogout } from "../helpers/authHelpers";
import { IoLogOut, IoSettings } from "react-icons/io5";
import { MdHomeFilled } from "react-icons/md";
import { HiDocumentReport } from "react-icons/hi";
import { FaCar, FaComment } from "react-icons/fa6";

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

  return (
    <>
      {/* Background Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9998"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-sidebar-bg shadow-2xl z-9999 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col justify-between`}
      >
        <div>
          <div className="p-4 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-white">
                {propertyName === "250"
                  ? "250 Plaza"
                  : propertyName ?? "Synergy"}
              </h2>

              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                &times;
              </button>
            </div>

            <div>
              {propertyName === "250" ? (
                <p className="text-xs text-white/50">American International Plaza</p>
              ) : null}
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 py-4 px-3 text-sm">
            <div className="flex items-center gap-3 mb-4 mt-1 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {accountUser ? accountUser.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{accountUser ? accountUser : "User"}</p>
                <p className="text-xs text-white/40">Admin</p>
              </div>
            </div>

            <div className="h-px bg-white/10 mx-2 mb-2" />

            {/* Employee Section */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-2">
                Employee
              </p>
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("dashboard")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } flex items-center gap-2.5 p-2.5 rounded-xl transition-colors`}
              >
                <MdHomeFilled className="w-4 h-4" /> Home
              </Link>
              <Link
                href="/tenants"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("tenants")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } flex items-center gap-2.5 p-2.5 rounded-xl transition-colors`}
              >
                <IoSettings className="w-4 h-4" /> Tenant Configuration
              </Link>
              <Link
                href="/report"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("report")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } flex items-center gap-2.5 p-2.5 rounded-xl transition-colors`}
              >
                <HiDocumentReport className="w-4 h-4" /> Ticket Report
              </Link>
              <Link
                href="/surveys"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("surveys")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } flex items-center gap-2.5 p-2.5 rounded-xl transition-colors`}
              >
                <FaComment className="w-4 h-4" /> Service Feedback
              </Link>
            </div>

            <div className="h-px bg-white/10 mx-2 mb-2" />

            {/* Client Section */}
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-2">
                Client
              </p>
              <Link
                href="/request"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("request")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } flex items-center gap-2.5 p-2.5 rounded-xl transition-colors`}
              >
                <FaCar className="w-4 h-4" /> Request Car
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer links */}
        <div className="px-3 pb-4 text-sm">
          <div className="mb-2">
            <Link
              href="#"
              onClick={() =>
                handleLogout({
                  propertyId,
                  setPropertyId,
                  setPropertyName,
                  setAccountUser,
                  router,
                })
              }
              className="flex items-center gap-2.5 text-red-400 hover:text-red-300 hover:bg-white/5 p-2.5 rounded-xl transition-colors"
            >
              <IoLogOut className="w-4 h-4" /> Log Out
            </Link>
          </div>
          <div className="h-px bg-white/10 mx-2 mb-2" />
          <div className="flex flex-col gap-1 px-2">
            <Link
              href="/privacy-policy"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="text-white/40 hover:text-white/60 text-xs transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="text-white/40 hover:text-white/60 text-xs transition-colors"
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
