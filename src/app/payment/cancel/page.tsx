"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaBan, FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import PageLoader from "@/app/components/elements/PageLoader";

/**
 * Payment Cancel Page
 *
 * This page is called by PlaceToPay when user cancels the payment
 * URL format: /payment/cancel?requestId={requestId}
 */

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const id = searchParams.get("requestId");
    setRequestId(id);

    console.log("Payment Cancel: User cancelled payment", { requestId: id });

    // Auto-redirect countdown
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
    // Navigate back to dashboard where user can retry the payment
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <FaBan className="text-orange-500 text-7xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 text-lg">
            You have cancelled the payment process.
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-400 text-xl mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                No charges were made
              </p>
              <p className="text-sm text-blue-700">
                Your payment was not processed. No amount has been charged to your card or account.
              </p>
            </div>
          </div>
        </div>

        {/* Request ID */}
        {requestId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium text-sm">Request ID:</span>
              <span className="text-gray-900 font-semibold">{requestId}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <FaArrowLeft className="text-lg" />
            Try Payment Again
          </button>

          <button
            onClick={handleReturnToDashboard}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Automatically redirecting to dashboard in{" "}
            <span className="font-semibold text-gray-700">{countdown}</span>{" "}
            seconds...
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            If you experienced any issues during payment or have questions,
            please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaymentCancelContent />
    </Suspense>
  );
}
