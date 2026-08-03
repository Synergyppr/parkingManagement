"use client";

import { useEffect, useRef } from "react";
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
  onRequestClose,
  size,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  const sizeClass =
    size === "sm"
      ? "w-full max-w-sm"
      : size === "md"
      ? "w-full max-w-md"
      : size === "lg"
      ? "w-full max-w-2xl"
      : size === "xl"
      ? "w-full max-w-4xl"
      : "w-full max-w-md md:max-w-lg";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-80 flex justify-end bg-black/50 backdrop-blur-sm"
          onMouseDown={requestClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={panelRef}
            className={`relative flex h-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] ${sizeClass}`}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
          >
            <button
              type="button"
              aria-label="Close panel"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={requestClose}
            >
              <span className="text-lg leading-none">&times;</span>
            </button>

            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
