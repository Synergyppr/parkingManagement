"use client";
import Link from "next/link";
import { useState } from "react";
import { FaBell, FaBars } from "react-icons/fa";
import Modal from "@/app/components/Modal";

export default function Header() {
  const [openModal, setOpenModal] = useState<"none" | "notifications" | "menu">(
    "none"
  );

  const toggleModal = (type: "notifications" | "menu") => {
    setOpenModal((prev) => (prev === type ? "none" : type));
  };

  const closeModal = () => setOpenModal("none");

  return (
    <header className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-900 to-blue-600 text-white shadow-lg sticky top-0 z-50 relative">
      <div className="text-xl font-extrabold tracking-wide">Synergy</div>
      <div className="flex gap-4 items-center relative">
        <button onClick={() => toggleModal("notifications")}>
          <FaBell className="text-white text-lg hover:scale-110 transition-transform duration-200 cursor-pointer" />
        </button>
        <button onClick={() => toggleModal("menu")}>
          <FaBars className="text-white text-lg hover:scale-110 transition-transform duration-200 cursor-pointer" />
        </button>

        {/* Notification Modal */}
        <div className="absolute right-12 top-12">
          <Modal isOpen={openModal === "notifications"} onClose={closeModal}>
            <div className="text-gray-800">
              <h3 className="text-lg font-semibold text-black mb-2">
                Notifications
              </h3>
              <ul className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <li
                    key={i}
                    className="bg-gray-100 p-2 rounded shadow text-sm"
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
          <Modal isOpen={openModal === "menu"} onClose={closeModal}>
            <div className="text-gray-800">
              <h3 className="text-lg font-semibold mb-2 text-black">Menu</h3>
              <nav className="flex flex-col space-y-2">
                <Link href="/" className="hover:underline">
                  Home
                </Link>
                <a href="/about" className="hover:underline">
                  About Us
                </a>
                <a href="/login" className="hover:underline">
                  Login
                </a>
              </nav>
            </div>
          </Modal>
        </div>
      </div>
    </header>
  );
}
