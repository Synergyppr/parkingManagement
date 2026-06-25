"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Grid2X2, KeySquare, Menu, User } from "lucide-react";
import { GoDotFill } from "react-icons/go";
import { BiCurrentLocation } from "react-icons/bi";
import { PiWarningDiamondBold } from "react-icons/pi";
import { MdClose } from "react-icons/md";

import useAuthRedirect from "../hooks/loginHook";
import { useProperty } from "../context/PropertyContext";
import usePropertyListener from "../hooks/usePropertyListener";
import { handleLogout } from "../helpers/authHelpers";

import Location from "./Location";
import OffCanvas from "./OffCanvas"; // Sidebar

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname?.split("/")?.[1] || "dashboard";

  const {
    propertyId,
    setPropertyId,
    propertyName,
    setPropertyName,
    locationMode,
    requestLocation,
    setAccountUser,
  } = useProperty();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [isOutOfArea, setIsOutOfArea] = useState(false);
  const [showLocationToggle, setShowLocationToggle] = useState(false);

  useAuthRedirect();
  usePropertyListener();

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, []);

  useEffect(() => {
    setIsOutOfArea(!propertyId);
  }, [propertyId, propertyName, locationMode]);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keysPressed: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.push(e?.key?.toLowerCase());
      if (keysPressed?.length > 3) keysPressed.shift();

      const isCtrlSyn =
        e.ctrlKey && keysPressed.join("") === "syn" && keysPressed.length === 3;

      if (isCtrlSyn) setShowLocationToggle((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const propertyShortName = propertyName
    ? propertyName === "Condado Ocean Club"
      ? "COC"
      : propertyName === "La Concha Resort"
      ? "CRH"
      : propertyName === "Condado Vanderbilt"
      ? "CVH"
      : propertyName.substring(0, 3).toUpperCase()
    : "";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-5">
          {/* Desktop left nav */}
          <nav className="hidden min-w-0 items-center gap-2 md:flex">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                active === "dashboard"
                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Grid2X2 className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/check-in"
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                active === "check-in"
                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Clock className="h-4 w-4" />
              Check-in
            </Link>
          </nav>

          {/* Mobile spacer/menu side */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-100 cursor-pointer"
              title="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Center logo */}
          <Link
            href="/dashboard"
            className="absolute left-1/2 flex max-w-[150px] -translate-x-1/2 items-center justify-center gap-2 sm:max-w-none sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200 sm:h-10 sm:w-10">
              <KeySquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <span className="truncate font-serif text-2xl font-bold text-amber-600 sm:text-3xl">
              Parkey
            </span>
          </Link>

          {/* Right actions */}
          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {showLocationToggle && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenLocationModal(true)}
                  className={`hidden h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold shadow-sm transition lg:flex cursor-pointer ${
                    locationMode === "live"
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  {locationMode === "live" ? (
                    <GoDotFill className="text-red-500 blinking-dot" />
                  ) : (
                    <BiCurrentLocation className="text-amber-600" />
                  )}

                  {locationMode === "live" ? "Live" : "Manual"}
                  {propertyShortName ? ` - ${propertyShortName}` : ""}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenLocationModal(true)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition lg:hidden ${
                    locationMode === "live"
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                  title={`${locationMode === "live" ? "Live" : "Manual"} ${
                    propertyShortName ? `- ${propertyShortName}` : ""
                  }`}
                >
                  {locationMode === "live" ? (
                    <GoDotFill className="text-red-500 blinking-dot" />
                  ) : (
                    <BiCurrentLocation className="text-amber-600" />
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={
                isLoggedIn
                  ? () =>
                      handleLogout({
                        propertyId,
                        setPropertyId,
                        setPropertyName,
                        setAccountUser,
                        router,
                      })
                  : () => router.push("/")
              }
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200 cursor-pointer"
              title={isLoggedIn ? "Logout" : "Login"}
            >
              <User className="h-5 w-5 text-slate-600" />
              {isLoggedIn && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition cursor-pointer
              hover:bg-slate-100 md:flex"
              title="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            <OffCanvas isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          </div>
        </div>
      </header>

      {mounted &&
        openLocationModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-sm sm:p-4">
            <div className="relative flex h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem]">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-lg font-bold text-slate-950 sm:text-xl">
                    Location Control
                  </h3>
                  <p className="line-clamp-2 text-xs font-medium text-slate-500">
                    Manually control live or manual property location.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenLocationModal(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-amber-50 hover:text-amber-600"
                  title="Close location modal"
                >
                  <MdClose className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4">
                <div className="min-w-0 overflow-x-auto">
                  <Location />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {!openLocationModal && isOutOfArea && (
        <div className="pointer-events-none fixed inset-0 z-[40] flex items-center justify-center bg-slate-950/75 p-4 text-center text-white backdrop-blur-sm">
          <div className="pointer-events-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-300/30 sm:h-20 sm:w-20">
              <PiWarningDiamondBold className="h-9 w-9 text-amber-300 sm:h-11 sm:w-11" />
            </div>

            <h2 className="mb-2 font-serif text-xl font-bold sm:text-2xl">
              You are not inside any of our properties
            </h2>

            <p className="text-sm leading-6 text-slate-200">
              Please return to the designated property location.
            </p>
          </div>
        </div>
      )}
    </>
  );
}