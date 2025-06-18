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
}: {
  isOpen: boolean;
  onClose: () => void;
  onRequestClose?: () => void; // Handles confirmation instead of direct discard
  children: React.ReactNode;
  placementX?: "center" | "start" | "end";
  placementY?: "center" | "start" | "end";
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
    if (e.target === e.currentTarget) {
      if (onRequestClose) {
        onRequestClose();
      } else {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 bg-gray-500 bg-opacity-70 flex items-${placementY} justify-${placementX} z-50 p-4`}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-200 text-white p-6 rounded-lg shadow-2xl max-h-[80vh] w-80 sm:w-96 relative mt-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 font-bold text-xl cursor-pointer"
              onClick={() => {
                if (onRequestClose) {
                  onRequestClose();
                } else {
                  onClose();
                }
              }}
            >
              ×
            </button>
            <div className="mt-6 max-h-[70vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
