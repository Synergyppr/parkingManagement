"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProperty } from "../context/PropertyContext";
import { handleLogout } from "../helpers/authHelpers";
import { IoLogOut, IoSettings } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
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
      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-slate-100 border-l-2 border-blue-600 shadow-xl z-9999 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col justify-between`}
      >
        <div>
          <div className="p-4 bg-linear-to-r from-blue-500 to-blue-700 text-white">
            <div className="flex justify-between items-center ">
              <h2 className="text-lg font-semibold">
                {/* {propertyName ? propertyName : "Synergy"} */}
                {propertyName === "250"
                  ? "250 Plaza"
                  : propertyName ?? "Synergy"}
              </h2>

              <button
                className="text-white text-2xl hover:text-[#ef6c00] cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <div>
              {propertyName === "250" ? (
                <p className="text-xs">American International Plaza</p>
              ) : null}
            </div>
          </div>

          <nav className="flex flex-col gap-1 py-4 px-2 text-blue-900 font-medium">
            <div className="flex gap-3 mb-4 mt-1 mx-1">
              <div className="">
                <CgProfile className="w-12 h-12" />
              </div>
              <div className="my-auto">
                <p>{accountUser ? accountUser : "User"}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>

            <hr className="border-slate-300 my-0 mx-1" />

            {/* Employee Section */}
            <div className="mb-2 mt-2">
              <h3 className="text-sm text-gray-800 font-semibold mb-2 px-2">
                Employee
              </h3>
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("dashboard")
                    ? "bg-slate-200 font-bold shadow-inner"
                    : ""
                } flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded`}
              >
                <MdHomeFilled /> Home
              </Link>
              <Link
                href="/tenants"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("tenants")
                    ? "bg-slate-200 font-bold shadow-inner"
                    : ""
                } flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded transition-colors duration-700`}
              >
                <IoSettings /> Tenant Configuration
              </Link>
              <Link
                href="/report"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("report")
                    ? "bg-slate-200 font-bold shadow-inner"
                    : ""
                } flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded transition-colors duration-700`}
              >
                <HiDocumentReport /> Ticket Report
              </Link>
              <Link
                href="/surveys"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("surveys")
                    ? "bg-slate-200 font-bold shadow-inner"
                    : ""
                } flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded transition-colors duration-700`}
              >
                <FaComment /> Service Feedback
              </Link>
            </div>

            <hr className="border-slate-300 my-0 mx-1" />

            {/* Client Section */}
            <div className="mt-2">
              <h3 className="text-sm text-gray-800 font-semibold mb-2 px-2">
                Client
              </h3>
              <Link
                href="/request"
                onClick={() => setIsMenuOpen(false)}
                className={`${
                  pathname.includes("request")
                    ? "bg-slate-200 font-bold shadow-inner"
                    : ""
                } flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded transition-colors duration-700`}
              >
                <FaCar /> Request Car
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer links */}
        <div className="px-4 pb-4 text-sm text-blue-900">
          <div className="mt-2">
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
              className={`flex items-center gap-2 hover:text-[#ef6c00] hover:bg-slate-200 p-2 rounded text-base transition-colors duration-700`}
            >
              <IoLogOut /> Log Out
            </Link>
          </div>
          <hr className="border-slate-300 mb-2" />
          <div className="flex flex-col gap-1">
            <Link
              href="/privacy-policy"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-[#ef6c00]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              target="_blank"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-[#ef6c00]"
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>

      {/* Background Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 bg-opacity-40 z-9998"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
