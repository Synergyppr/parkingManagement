"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaUser, FaLocationDot } from "react-icons/fa6";
import { TbLogout2, TbCar } from "react-icons/tb";
import { FaBars } from "react-icons/fa";
import {
  IoHomeOutline,
  IoSettingsOutline,
  IoCarSportOutline,
} from "react-icons/io5";
import { GoDotFill } from "react-icons/go";
import { BiCurrentLocation } from "react-icons/bi";
import Modal from "@/app/components/Modal";
import useAuthRedirect from "../lib/loginHook";
import { useProperty } from "../context/PropertyContext";
import { leaveGroup } from "../lib/SignalRProvider";
import Location from "./Location";
import { isWithinRadius } from "../lib/clientUtils";

export default function Header() {
  const router = useRouter();
  const {
    propertyId,
    setPropertyId,
    propertyName,
    setPropertyName,
    latitude,
    longitude,
    locationMode,
    requestLocation,
  } = useProperty();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openModal, setOpenModal] = useState<"none" | "notifications" | "menu">(
    "none"
  );
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

  useEffect(() => {
    const propertyMap: Record<
      string,
      { lat: number; lng: number; logo: string; radius?: number }
    > = {
      "a7e348d3-8dfb-4f71-8bc5-042ba75d53c7": {
        lat: 18.426434,
        lng: -66.059545,
        logo: "/250.jpeg",
        radius: 100, // in meters
      },
      "b2aa6b8f-29b2-4fc3-a040-09af828d1a8d": {
        lat: 18.423993,
        lng: -66.058527,
        logo: "/270.png",
        radius: 100,
      },
      "5acdd1ec-392d-4d28-80e6-8adbd08e09cd": {
        lat: 18.459366,
        lng: -66.07728,
        logo: "/coc.png",
        radius: 65,
      },
      "f82ce385-c8e4-4c09-8b08-b01bf9676dc7": {
        lat: 18.45877,
        lng: -66.076082,
        logo: "/cvh.png",
        radius: 65,
      },
      "d3f5afa9-73c4-4bfa-8309-02ab93165f46": {
        lat: 18.457303,
        lng: -66.073427,
        logo: "/laconcha.png",
        radius: 100,
      },
    };

    if (!propertyId || latitude == null || longitude == null) return;

    const prop = propertyMap[propertyId];
    if (!prop) return;

    const inside = isWithinRadius(
      prop.lat,
      prop.lng,
      latitude,
      longitude,
      prop.radius as number
    );
    if (!inside || !propertyId) {
      setIsOutOfArea(true);
      leaveGroup(propertyId);
      // resetPropertyData();
    } else {
      setIsOutOfArea(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, propertyId]);

  useEffect(() => {
    // console.log("Property ID:", propertyId);
    // console.log("Property Name:", propertyName);
    if (!propertyId && !propertyName) {
      setIsOutOfArea(true);
      // resetPropertyData();
    } else {
      setIsOutOfArea(false);
    }
  }, [propertyId, propertyName]);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (isOutOfArea) {
  //     resetPropertyData();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isOutOfArea]);

  // useEffect(() => {
  //   if (locationMode === "live" && !propertyId) {
  //     leaveGroup(propertyId as string);
  //     resetPropertyData();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [locationMode]);

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
        router.replace("/");
      }
    });
  };

  const toggleModal = (type: "notifications" | "menu") => {
    setOpenModal((prev) => (prev === type ? "none" : type));
  };

  const closeModal = () => setOpenModal("none");

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
                className="py-1 px-3 bg-blue-500 text-white rounded-sm cursor-pointer hover:scale-105 m-auto"
                onClick={() => setOpenLocationModal(true)}
              >
                {locationMode === "live" ? (
                  <span className="flex items-center gap-1">
                    <GoDotFill className="text-red-500 animate-blink blinking-dot" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <BiCurrentLocation className="text-blue-800" />
                    Manual
                  </span>
                )}
              </button>
              {propertyName && (
                <div
                  className={`flex gap-1 bg-slate-800/10 border-solid border-[0.5px] rounded-sm text-sm shadow-sm py-[5.5px] px-2 border-black uppercase my˝-auto`}
                >
                  <FaLocationDot className="w-3 h-3 my-auto text-red-600" />
                  <p className="my-auto text-white tracking-tight font-bold">
                    {propertyName === "Condado Ocean Club"
                      ? "COC"
                      : propertyName === "La Concha Resort"
                      ? "CRH"
                      : propertyName === "Condado Vanderbilt"
                      ? "CVH"
                      : propertyName?.substring(0, 3)}
                  </p>
                </div>
              )}

              <Modal
                isOpen={openLocationModal}
                onClose={() => setOpenLocationModal(false)}
              >
                <Location />
              </Modal>
            </>
          )}

          <button onClick={isLoggedIn ? handleLogout : () => router.push("/")}>
            {isLoggedIn ? (
              <TbLogout2 className="text-white text-lg hover:scale-110 transition-transform" />
            ) : (
              <FaUser className="text-white text-lg hover:scale-110 transition-transform" />
            )}
          </button>

          <button onClick={() => toggleModal("menu")}>
            <FaBars className="text-white text-lg hover:scale-110 transition-transform" />
          </button>

          <div className="absolute right-0 top-12 z-[9999]">
            <Modal
              isOpen={openModal === "menu"}
              onClose={closeModal}
              placementX="end"
              placementY="start"
            >
              <nav className="flex flex-col space-y-2 text-gray-800">
                <Link
                  href="/"
                  className="flex gap-2 items-center border-b border-gray-300 pb-1"
                >
                  <IoHomeOutline />
                  Home
                </Link>
                <Link
                  href="/tenants"
                  className="flex gap-2 items-center border-b border-gray-300 pb-1"
                >
                  <IoSettingsOutline />
                  Manage Tenants
                </Link>
                <Link
                  href="/request"
                  className="flex gap-2 items-center border-b border-gray-300 pb-1"
                >
                  <IoCarSportOutline />
                  Request Car
                </Link>
                <Link
                  href="/location"
                  className="flex gap-2 items-center border-b border-gray-300 pb-1"
                >
                  <TbCar />
                  Location
                </Link>
              </nav>
            </Modal>
          </div>
        </div>
      </header>

      {/* 🚫 Out of Area Overlay */}
      {isOutOfArea && (
        <div className="fixed inset-0 bg-black/70 text-white z-[40] flex items-center justify-center text-center p-4 pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-2xl font-bold mb-2">
              You are not inside any of our properties
            </h2>
            <p className="text-lg">
              Please return to the designated property location.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
