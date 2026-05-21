import React, { useState, useRef, useEffect } from "react";
import { RxCaretRight } from "react-icons/rx";
import { VehicleData } from "../types";

const TransactionDetails = ({ vehicleData }: { vehicleData: VehicleData }) => {
  const index = 0; // Assuming you want the first transaction

  return (
    <CollapsibleSection title="View Transaction Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Customer</p>
          <p className="text-sm font-medium text-gray-900 capitalize">
            {vehicleData?.firstName || "Unknown"} {vehicleData?.lastName || " "}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Reference #</p>
          <p className="text-sm font-medium text-gray-900">
            {vehicleData?.transactions?.[index]?.referenceNumber || "-"}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Drop-Off</p>
          <p className="text-sm font-medium text-gray-900">
            {vehicleData?.transactions?.[index]?.transactionDateTime
              ? new Date(
                  vehicleData?.transactions?.[index]
                    ?.transactionDateTime as string
                ).toLocaleString()
              : "-"}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">
            {vehicleData?.transactions?.[index]?.paymentMethod} Tariff
          </p>
          <p className="text-sm font-medium text-gray-900">
            ${vehicleData?.transactions?.[index]?.amount}
          </p>
        </div>
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
    <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 font-semibold text-gray-900 text-sm transition hover:bg-slate-50 cursor-pointer"
      >
        {title}
        <RxCaretRight
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${
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
          transition: "max-height 0.4s ease, opacity 0.4s ease",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>
      </div>
    </div>
  );
};
