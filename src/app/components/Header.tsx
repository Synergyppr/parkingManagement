"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthRedirect from "../hooks/loginHook";
import { useProperty } from "../context/PropertyContext";
import { leaveGroup } from "../lib/SignalRProvider";
import usePropertyListener from "../hooks/usePropertyListener";
import { FaUser } from "react-icons/fa6";
import { PiWarningDiamondBold } from "react-icons/pi";
import { TbLogout2 } from "react-icons/tb";
import { FaBars } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { BiCurrentLocation } from "react-icons/bi";
import Location from "./Location";
import Modal from "@/app/components/Modal";
import OffCanvas from "./OffCanvas";

export default function Header() {
  const router = useRouter();
  const {
    propertyId,
    setPropertyId,
    propertyName,
    setPropertyName,
    locationMode,
    requestLocation,
    setAccountUser,
  } = useProperty();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [isOutOfArea, setIsOutOfArea] = useState(false);
  const [showLocationToggle, setShowLocationToggle] = useState(false);

  useAuthRedirect();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  useEffect(() => {
    const keysPressed: string[] = [];
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.push(e?.key?.toLowerCase());

      if (keysPressed.length > 3) {
        keysPressed.shift();
      }

      const isCtrlSyn =
        e.ctrlKey && keysPressed.join("") === "syn" && keysPressed.length === 3;

      if (isCtrlSyn) {
        setShowLocationToggle(!showLocationToggle);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLocationToggle]);

  usePropertyListener();

  useEffect(() => {
    if (!propertyId) {
      setIsOutOfArea(true);
    } else {
      setIsOutOfArea(false);
    }
  }, [propertyId, propertyName, locationMode]);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Log Out",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (propertyId) await leaveGroup(propertyId);
        localStorage.clear();
        sessionStorage.clear();
        setPropertyId("");
        setPropertyName("");
        setAccountUser("");
        router.replace("/");
      }
    });
  };

  const toggleModal = () => {
    setIsMenuOpen(true);
  };

  return (
    <>
      <header className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-gray-800 shadow-lg sticky top-0 z-50">
        <Image
          className="relative w-auto h-auto cursor-pointer"
          src="/synergy1.png"
          alt="Synergy Logo"
          width={180}
          height={37}
          priority
          onClick={() => router.push("/dashboard")}
        />

        <div className="flex gap-4 items-center relative z-[9999]">
          {showLocationToggle && (
            <>
              <button
                type="button"
                className="py-1.5 px-2 md:px-3 bg-blue-500 text-white rounded-sm cursor-pointer hover:scale-105 m-auto"
                onClick={() => setOpenLocationModal(true)}
              >
                {locationMode === "live" ? (
                  <span className="flex items-center gap-1 text-xs md:text-sm lg:text-sm">
                    <GoDotFill className="text-red-500 animate-blink blinking-dot" />
                    Live{" "}
                    {propertyName
                      ? propertyName === "Condado Ocean Club"
                        ? "- COC"
                        : propertyName === "La Concha Resort"
                        ? "- CRH"
                        : propertyName === "Condado Vanderbilt"
                        ? "- CVH"
                        : "- " + propertyName?.substring(0, 3)
                      : ""}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs md:text-sm lg:text-sm">
                    <BiCurrentLocation className="text-blue-800" />
                    Manual{" "}
                    {propertyName
                      ? propertyName === "Condado Ocean Club"
                        ? "- COC"
                        : propertyName === "La Concha Resort"
                        ? "- CRH"
                        : propertyName === "Condado Vanderbilt"
                        ? "- CVH"
                        : "- " + propertyName?.substring(0, 3)
                      : ""}
                  </span>
                )}
              </button>

              <Modal
                isOpen={openLocationModal}
                onClose={() => setOpenLocationModal(false)}
              >
                <Location />
              </Modal>
            </>
          )}

          <button
            className="cursor-pointer"
            onClick={isLoggedIn ? handleLogout : () => router.push("/")}
          >
            {isLoggedIn ? (
              <TbLogout2 className="text-white text-lg hover:scale-110 transition-transform" />
            ) : (
              <FaUser className="text-white text-lg hover:scale-110 transition-transform" />
            )}
          </button>

          <button className="cursor-pointer" onClick={() => toggleModal()}>
            <FaBars className="text-white text-lg hover:scale-110 transition-transform" />
          </button>

          <OffCanvas isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        </div>
      </header>

      {/* 🚫 Out of Area Overlay */}
      {isOutOfArea && (
        <div className="fixed inset-0 bg-black/70 text-white z-[40] flex items-center justify-center text-center p-4 pointer-events-none">
          <div className="pointer-events-auto">
            <PiWarningDiamondBold className="w-24 h-24 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-2xl font-bold mb-2">
              You are not inside any of our properties
            </h2>
            <p className="text-lg text-slate-100">
              Please return to the designated property location.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
