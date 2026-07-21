import React, { useState, useRef, useEffect } from "react";
import { RxCaretRight } from "react-icons/rx";
import { FaReceipt, FaUser } from "react-icons/fa";
import { MdPayments, MdAccessTime } from "react-icons/md";
import { VehicleData } from "../types";

const TransactionDetails = ({ vehicleData }: { vehicleData: VehicleData }) => {
  const transaction = vehicleData?.transactions?.[0];
  const detail = transaction?.paymentdetail;
  const customerReceipt = detail?.receipts?.find(
    (r) => r.receiptType === "CUSTOMER"
  );

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
          value={detail?.trxId || "—"}
          icon={<FaReceipt />}
          mono
        />

        <DetailCard
          label="Date"
          value={
            transaction?.transaction_date_time
              ? new Date(transaction.transaction_date_time).toLocaleString()
              : "—"
          }
          icon={<MdAccessTime />}
        />

        <DetailCard
          label={`${transaction?.payment_method || "Payment"} Tariff`}
          value={`$${transaction?.amount?.toFixed(2) ?? "0.00"}`}
          icon={<MdPayments />}
          highlight
        />
      </div>

      {/* Customer Receipt HTML */}
      {customerReceipt?.receiptHtml && (
        <div className="mt-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Customer Receipt
          </p>

          <div
            className="receipt-container overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: customerReceipt.receiptHtml }}
          />
        </div>
      )}
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
          ? "border-(--primary-light) bg-[color-mix(in_srgb,var(--primary-soft)_80%,transparent)]"
          : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            highlight ? "bg-primary text-white" : "bg-white text-primary"
          }`}
        >
          {icon}
        </div>

        <p
          className={`text-[10px] font-black uppercase tracking-[0.18em] ${
            highlight ? "text-primary" : "text-slate-400"
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
        className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition hover:bg-[color-mix(in_srgb,var(--primary-soft)_50%,transparent)]"
        type="button"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
            Receipt
          </p>

          <h3 className="mt-1 font-serif text-xl font-bold text-slate-950">
            {title}
          </h3>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
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
