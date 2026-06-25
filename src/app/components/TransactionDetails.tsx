import React, { useState, useRef, useEffect } from "react";
import { RxCaretRight } from "react-icons/rx";
import { FaReceipt, FaUser } from "react-icons/fa";
import { MdPayments, MdAccessTime } from "react-icons/md";
import { VehicleData } from "../types";

const TransactionDetails = ({ vehicleData }: { vehicleData: VehicleData }) => {
  const index = 0;
  const transaction = vehicleData?.transactions?.[index];

  return (
    <CollapsibleSection title="Transaction Details">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailCard
          label="Customer"
          value={`${vehicleData?.firstName || "Unknown"} ${
            vehicleData?.lastName || ""
          }`}
          icon={<FaUser />}
        />

        <DetailCard
          label="Reference #"
          value={transaction?.referenceNumber || "-"}
          icon={<FaReceipt />}
          mono
        />

        <DetailCard
          label="Drop-Off"
          value={
            transaction?.transactionDateTime
              ? new Date(transaction.transactionDateTime as string).toLocaleString()
              : "-"
          }
          icon={<MdAccessTime />}
        />

        <DetailCard
          label={`${transaction?.paymentMethod || "Payment"} Tariff`}
          value={`$${transaction?.amount ?? "0.00"}`}
          icon={<MdPayments />}
          highlight
        />
      </div>
    </CollapsibleSection>
  );
};

export default TransactionDetails;

const DetailCard = ({
  label,
  value,
  icon,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) => {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-amber-200 bg-amber-50/80"
          : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            highlight ? "bg-amber-500 text-white" : "bg-white text-amber-600"
          }`}
        >
          {icon}
        </div>

        <p
          className={`text-[10px] font-black uppercase tracking-[0.18em] ${
            highlight ? "text-amber-700" : "text-slate-400"
          }`}
        >
          {label}
        </p>
      </div>

      <p
        className={`text-sm font-extrabold capitalize text-slate-950 ${
          mono ? "font-mono tracking-wider" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
};

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
  }, [open, children]);

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition hover:bg-amber-50/50"
        type="button"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">
            Receipt
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-slate-950">
            {title}
          </h3>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <RxCaretRight
            className={`h-5 w-5 transform transition-transform duration-300 ${
              open ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: `${height}px`,
          overflow: "hidden",
          transition: "max-height 0.4s ease, opacity 0.4s ease",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="border-t border-slate-200 px-5 pb-5 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};