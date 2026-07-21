"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaBan, FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import { KeySquare } from "lucide-react";
import PageLoader from "@/app/components/elements/PageLoader";

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const id = searchParams.get("requestId");
    setRequestId(id);

    console.log("Payment Cancel: User cancelled payment", { requestId: id });

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  const handleRetryPayment = () => {
    router.push("/dashboard");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--primary-soft) px-4 py-10 text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.10),transparent_42%)]" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_70%,transparent)] bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)] to-white px-6 py-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)]">
            <KeySquare className="h-7 w-7" />
          </div>

          <span
            className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase 
          tracking-[0.18em] text-primary shadow-sm"
          >
            Payment Cancelled
          </span>

          <div className="mt-5 flex justify-center">
            <FaBan className="h-16 w-16 text-primary" />
          </div>

          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-slate-950">
            Payment Cancelled
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            You have cancelled the payment process.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-3xl border border-(--primary-light) bg-[color-mix(in_srgb,var(--primary-soft)_70%,transparent)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary ring-1 ring-(--primary-light)">
                <FaInfoCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black text-slate-950">
                  No charges were made
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Your payment was not processed. No amount has been charged to
                  your card or account.
                </p>
              </div>
            </div>
          </div>

          {requestId && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Request ID
                </span>

                <span className="text-right text-sm font-black text-slate-900">
                  {requestId}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRetryPayment}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_24%,transparent)] transition hover:bg-secondary"
            >
              <FaArrowLeft className="h-4 w-4" />
              Try Payment Again
            </button>

            <button
              type="button"
              onClick={handleReturnToDashboard}
              className="h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-primary"
            >
              Return to Dashboard
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-center">
            <p className="text-sm text-slate-500">
              Automatically redirecting to dashboard in{" "}
              <span className="font-black text-primary">{countdown}</span>{" "}
              seconds...
            </p>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <p className="text-center text-xs leading-5 text-slate-500">
              If you experienced any issues during payment or have questions,
              please contact support.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaymentCancelContent />
    </Suspense>
  );
}
