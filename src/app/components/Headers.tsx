"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaBell, FaBars } from "react-icons/fa";
import {
  IoHomeOutline,
  IoSettingsOutline,
  IoCarSportOutline,
} from "react-icons/io5";

import { FaUser } from "react-icons/fa6";
import Modal from "@/app/components/Modal";

export default function Header() {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<"none" | "notifications" | "menu">(
    "none"
  );

  const toggleModal = (type: "notifications" | "menu") => {
    setOpenModal((prev) => (prev === type ? "none" : type));
  };

  const closeModal = () => setOpenModal("none");

  return (
    <header className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-50">
      <Image
        className="relative w-auto h-auto"
        src="/synergy1.png"
        alt="Synergy Logo"
        width={180}
        height={37}
        priority
        onClick={() => router.push("/")}
      />

      <div className="flex gap-4 items-center relative">
        <button onClick={() => router.push("/login")}>
          <FaUser
            className="text-white text-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
            onClick={() => router.push("/login")}
          />
        </button>
        <button onClick={() => toggleModal("notifications")}>
          <FaBell className="text-white text-lg hover:scale-110 transition-transform duration-200 cursor-pointer" />
        </button>
        <button onClick={() => toggleModal("menu")}>
          <FaBars className="text-white text-lg hover:scale-110 transition-transform duration-200 cursor-pointer" />
        </button>

        {/* Notification Modal */}
        <div className="absolute right-12 top-12">
          <Modal isOpen={openModal === "notifications"} onClose={closeModal}>
            <div className="text-gray-200">
              <h3 className="text-lg font-semibold text-gray-400 mb-3">
                Notifications
              </h3>
              <ul className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <li
                    key={i}
                    className="bg-gray-700 p-2 rounded shadow text-sm"
                  >
                    Notification {i + 1}
                  </li>
                ))}
              </ul>
            </div>
          </Modal>
        </div>

        {/* Menu Modal */}
        <div className="absolute right-0 top-12">
          <Modal
            isOpen={openModal === "menu"}
            onClose={closeModal}
            placementX="end"
            placementY="start"
          >
            <div className="text-gray-200">
              <nav className="flex flex-col space-y-2 gap-0">
                <Link
                  href="/"
                  className="hover:underline flex gap-3 items-center border-b-[0.5px] border-solid border-gray-700 pb-1"
                >
                  <IoHomeOutline />
                  Home
                </Link>
                <a
                  href="/tenants"
                  className="hover:underline flex gap-3 items-center border-b-[0.5px] border-solid border-gray-700 pb-1"
                >
                  <IoSettingsOutline />
                  Manage Tenants
                </a>
                <a
                  href="/request"
                  className="hover:underline flex gap-3 items-center border-b-[0.5px] border-solid border-gray-700 pb-1"
                >
                  <IoCarSportOutline />
                  Request Car
                </a>
              </nav>
            </div>
          </Modal>
        </div>
      </div>
    </header>
  );
}
