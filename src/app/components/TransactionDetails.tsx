import React, { useState, useRef, useEffect } from "react";
import { RxCaretRight } from "react-icons/rx";
import { VehicleData } from "../types";

const TransactionDetails = ({ vehicleData }: { vehicleData: VehicleData }) => {
  const index = 0; // Assuming you want the first transaction

  return (
    <CollapsibleSection title="View Transaction Details">
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
        <p className="capitalize">
          <span className="font-semibold">Customer:</span>{" "}
          {vehicleData?.firstName || "Unknown"} {vehicleData?.lastName || " "}
        </p>

        <p className="capitalize">
          <span className="font-semibold">Reference #:</span>{" "}
          {vehicleData?.transactions?.[index]?.referenceNumber || "-"}
        </p>

        <p className="">
          <span className="font-semibold">Drop-Off:</span>{" "}
          {vehicleData?.transactions?.[index]?.transactionDateTime
            ? new Date(
                vehicleData?.transactions?.[index]
                  ?.transactionDateTime as string
              ).toLocaleString()
            : "-"}
        </p>
        <p>
          <span className="font-semibold">
            {vehicleData?.transactions?.[index]?.paymentMethod} Tariff:
          </span>{" "}
          <span className="capitalize">
            ${vehicleData?.transactions?.[index]?.amount}
          </span>
        </p>
      </div>
    </CollapsibleSection>
  );
};

export default TransactionDetails;

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? contentRef.current.scrollHeight : 0);
    }
  }, [open]);

  return (
    <div
      className={`${
        open ? "bg-white/20 rounded-xl" : ""
      } mb-4 border-slate-300 relative top-6 transition-all duration-500`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-3 font-semibold text-gray-700 transition rounded-t-lg"
      >
        {title}
        <RxCaretRight
          className={`w-6 h-6 transform transition-transform duration-500 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Animated wrapper */}
      <div
        ref={contentRef}
        style={{
          maxHeight: `${height}px`,
          overflow: "hidden",
          transition: "max-height 0.5s ease, opacity 0.5s ease",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="p-4 border-t-[0.5px] border-slate-300">{children}</div>
      </div>
    </div>
  );
};
