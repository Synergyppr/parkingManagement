"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: (form?: string) => void;
  onRequestClose?: () => void;
  children: React.ReactNode;
  placementX?: "center" | "start" | "end";
  placementY?: "center" | "start" | "end";
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  children,
  placementY = "center",
  placementX = "center",
  onRequestClose,
  size,
}: ModalProps) {
  const requestClose = () => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, onRequestClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const placementYClass =
    placementY === "start"
      ? "items-start"
      : placementY === "end"
      ? "items-end"
      : "items-center";

  const placementXClass =
    placementX === "start"
      ? "justify-start"
      : placementX === "end"
      ? "justify-end"
      : "justify-center";

  const sizeClass =
    size === "sm"
      ? "max-w-sm"
      : size === "md"
      ? "max-w-md"
      : size === "lg"
      ? "max-w-lg"
      : size === "xl"
      ? "max-w-4xl"
      : "max-w-md md:max-w-lg";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-80 flex overflow-y-auto bg-black/50 p-4 pt-18 backdrop-blur-sm ${placementYClass} ${placementXClass}`}
          onMouseDown={requestClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`relative w-full max-w-[95vw] rounded-2xl bg-white shadow-xl ${sizeClass}`}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
          >
            <button
              type="button"
              aria-label="Close modal"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={requestClose}
            >
              <span className="text-lg leading-none">&times;</span>
            </button>

            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
