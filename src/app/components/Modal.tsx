"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
  isOpen,
  onClose,
  children,
  placementY = "center",
  placementX = "center",
  onRequestClose,
  size,
}: {
  isOpen: boolean;
  onClose: (form?: string) => void;
  onRequestClose?: () => void; // Handles confirmation instead of direct discard
  children: React.ReactNode;
  placementX?: "center" | "start" | "end";
  placementY?: "center" | "start" | "end";
  size?: "sm" | "md" | "lg" | "xl"; // Optional size prop for future use
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onRequestClose) {
          onRequestClose();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onRequestClose, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.target === e.currentTarget) {
      if (onRequestClose) {
        onRequestClose();
      } else {
        onClose();
      }
    }
  };

  const placementYClass =
    placementY === "start" ? "items-start" : placementY === "end" ? "items-end" : "items-center";
  const placementXClass =
    placementX === "start" ? "justify-start" : placementX === "end" ? "justify-end" : "justify-center";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex ${placementYClass} ${placementXClass} z-80 p-4 max-h-[90vh] mt-14 overflow-y-auto`}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`bg-white rounded-2xl shadow-xl relative w-full max-w-[95vw]
              ${
                size === "sm"
                  ? "max-w-sm"
                  : size === "md"
                  ? "max-w-md"
                  : size === "lg"
                  ? "max-w-lg"
                  : size === "xl"
                  ? "max-w-4xl"
                  : "max-w-md md:max-w-lg"
              }`}
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 
              transition-colors cursor-pointer z-10"
              onClick={() => {
                if (onRequestClose) {
                  onRequestClose();
                } else {
                  onClose();
                }
              }}
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
            <div className="max-h-[85vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
