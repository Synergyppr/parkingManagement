import React from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";

export const CollapsibleSection = ({
  title,
  children,
  isOpen,
  toggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  toggle: () => void;
}) => (
  <div className="border-b border-gray-300 pb-2 mb-4">
    <div
      className="flex justify-between items-center cursor-pointer"
      onClick={toggle}
    >
      <h2 className="text-sm font-bold tracking-tight text-gray-800">
        {title}
      </h2>
      {isOpen ? (
        <FaCaretUp className="text-gray-500" />
      ) : (
        <FaCaretDown className="text-gray-500" />
      )}
    </div>
    {isOpen && <div className="mt-2">{children}</div>}
  </div>
);
