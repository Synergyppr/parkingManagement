"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";
import { KeySquare } from "lucide-react";
import PageLoader from "@/app/components/elements/PageLoader";

interface PaymentStatusData {
  success: boolean;
  requestId: number;
  status: string;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  message: string;
  payment?: {
    reference?: string;
    amount?: number;
    authorization?: string;
    receipt?: string;
    paymentMethod?: string;
    franchise?: string;
  };
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
  };
}

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      setError("Missing payment request ID");
      setLoading(false);
      return;
    }

    verifyPaymentStatus(requestId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyPaymentStatus = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/payments/placetopay/session/${requestId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify payment status");
      }

      const data: PaymentStatusData = await response.json();

      setPaymentData(data);
      setLoading(false);

      if (data.isApproved) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    } catch (err) {
      console.error("Payment Return: Verification error:", err);

      setError(err instanceof Error ? err.message : "Failed to verify payment");
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <PaymentShell>
        <StatusCard
          icon={<FaTimesCircle className="h-16 w-16 text-red-500" />}
          badge="Verification Error"
          title="We could not verify your payment"
          description={error}
          tone="red"
          buttonLabel="Return to Dashboard"
          onClick={() => router.push("/dashboard")}
        />
      </PaymentShell>
    );
  }

  if (!paymentData) {
    return (
      <PaymentShell>
        <StatusCard
          icon={<FaTimesCircle className="h-16 w-16 text-slate-400" />}
          badge="No Data"
          title="No Payment Data"
          description="Unable to retrieve payment information."
          tone="slate"
          buttonLabel="Return to Dashboard"
          onClick={() => router.push("/dashboard")}
        />
      </PaymentShell>
    );
  }

  if (paymentData.isApproved) {
    return (
      <PaymentShell>
        <StatusCard
          icon={
            <FaCheckCircle className="h-16 w-16 animate-bounce text-emerald-500" />
          }
          badge="Payment Approved"
          title="Payment Successful!"
          description="Your payment has been processed successfully."
          tone="emerald"
          buttonLabel="Go to Dashboard Now"
          onClick={() => router.push("/dashboard")}
          footerText="Redirecting to dashboard in 3 seconds..."
        >
          <PaymentDetails paymentData={paymentData} />
        </StatusCard>
      </PaymentShell>
    );
  }

  if (paymentData.isPending) {
    return (
      <PaymentShell>
        <StatusCard
          icon={
            <FaHourglassHalf className="h-16 w-16 animate-pulse text-primary" />
          }
          badge="Payment Pending"
          title="Payment Pending"
          description="Your payment is being processed. This may take a few moments."
          tone="primary"
          buttonLabel="Return to Dashboard"
          onClick={() => router.push("/dashboard")}
          footerText="You will receive a confirmation once the payment is processed."
        >
          <PaymentDetails paymentData={paymentData} compact />
        </StatusCard>
      </PaymentShell>
    );
  }

  if (paymentData.isRejected) {
    return (
      <PaymentShell>
        <StatusCard
          icon={<FaTimesCircle className="h-16 w-16 text-red-500" />}
          badge="Payment Declined"
          title="Payment Declined"
          description={
            paymentData.message ||
            "Your payment was declined. Please try again."
          }
          tone="red"
          buttonLabel="Return to Dashboard"
          onClick={() => router.push("/dashboard")}
        >
          <PaymentDetails paymentData={paymentData} compact />
        </StatusCard>
      </PaymentShell>
    );
  }

  return (
    <PaymentShell>
      <StatusCard
        icon={<FaTimesCircle className="h-16 w-16 text-slate-400" />}
        badge="Unknown Status"
        title="Unknown Status"
        description={`Payment status: ${paymentData.status}`}
        tone="slate"
        buttonLabel="Return to Dashboard"
        onClick={() => router.push("/dashboard")}
      />
    </PaymentShell>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaymentReturnContent />
    </Suspense>
  );
}

function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--primary-soft) px-4 py-10 text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.10),transparent_42%)]" />

      <div className="relative w-full max-w-xl">{children}</div>
    </main>
  );
}

type StatusTone = "emerald" | "primary" | "red" | "slate";

function StatusCard({
  icon,
  badge,
  title,
  description,
  tone,
  buttonLabel,
  onClick,
  footerText,
  children,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  tone: StatusTone;
  buttonLabel: string;
  onClick: () => void;
  footerText?: string;
  children?: React.ReactNode;
}) {
  const buttonClass =
    tone === "emerald"
      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
      : tone === "red"
      ? "bg-red-500 hover:bg-red-600 shadow-red-200"
      : "bg-[var(--primary)] hover:bg-[var(--secondary)] shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_24%,transparent)]";

  const badgeClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50 text-slate-600"
      : "border-[var(--primary-light)] bg-[var(--primary-soft)] text-[var(--primary)]";

  return (
    <section className="overflow-hidden rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_70%,transparent)] bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-6 py-7 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)]">
          <KeySquare className="h-7 w-7" />
        </div>

        <span
          className={`inline-flex rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm ${badgeClass}`}
        >
          {badge}
        </span>

        <div className="mt-5 flex justify-center">{icon}</div>

        <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        {children}

        {footerText && (
          <p className="text-center text-sm font-semibold text-slate-500">
            {footerText}
          </p>
        )}

        <button
          type="button"
          onClick={onClick}
          className={`h-12 w-full cursor-pointer rounded-2xl text-sm font-black text-white shadow-lg transition ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}

function PaymentDetails({
  paymentData,
  compact = false,
}: {
  paymentData: PaymentStatusData;
  compact?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <DetailRow label="Request ID" value={paymentData.requestId} />

      {paymentData.payment?.reference && !compact && (
        <DetailRow label="Reference" value={paymentData.payment.reference} />
      )}

      {paymentData.payment?.amount !== undefined && (
        <DetailRow
          label="Amount"
          value={`$${paymentData.payment.amount.toFixed(2)}`}
          highlight
        />
      )}

      {paymentData.payment?.authorization && !compact && (
        <DetailRow
          label="Authorization"
          value={paymentData.payment.authorization}
        />
      )}

      {paymentData.payment?.paymentMethod && !compact && (
        <DetailRow
          label="Method"
          value={`${paymentData.payment.paymentMethod}${
            paymentData.payment.franchise
              ? ` (${paymentData.payment.franchise})`
              : ""
          }`}
        />
      )}

      {paymentData.payment?.receipt && !compact && (
        <DetailRow label="Receipt" value={paymentData.payment.receipt} />
      )}

      {paymentData.message && compact && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-sm leading-6 text-slate-600">
            {paymentData.message}
          </p>
        </div>
      )}

      {paymentData.isRejected && (
        <DetailRow label="Status" value={paymentData.status} danger />
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
  danger = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3 last:border-b-0">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>

      <span
        className={`text-right text-sm font-black ${
          danger
            ? "text-red-600"
            : highlight
            ? "text-primary"
            : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
