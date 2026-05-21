"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";
import PageLoader from "@/app/components/elements/PageLoader";

/**
 * Payment Return Page
 *
 * This page is called by PlaceToPay after payment completion (success or pending)
 * URL format: /payment/return?requestId={requestId}&status={status}
 */

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
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      setError("Missing payment request ID");
      setLoading(false);
      return;
    }

    // Verify payment status
    verifyPaymentStatus(requestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyPaymentStatus = async (requestId: string) => {
    try {
      console.log("Payment Return: Verifying status for request ID:", requestId);

      const response = await fetch(`/api/payments/placetopay/session/${requestId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to verify payment status");
      }

      const data: PaymentStatusData = await response.json();
      console.log("Payment Return: Status verification result:", data);

      setPaymentData(data);
      setLoading(false);

      // If approved, auto-redirect to dashboard after 3 seconds
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Error
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <FaTimesCircle className="text-gray-400 text-6xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Payment Data
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to retrieve payment information.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Payment Approved
  if (paymentData.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8">
          <div className="text-center">
            <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-4 animate-bounce" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully.
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Request ID:</span>
              <span className="text-gray-900 font-semibold">
                {paymentData.requestId}
              </span>
            </div>

            {paymentData.payment?.reference && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Reference:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentData.payment.reference}
                </span>
              </div>
            )}

            {paymentData.payment?.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Amount:</span>
                <span className="text-gray-900 font-semibold">
                  ${paymentData.payment.amount.toFixed(2)}
                </span>
              </div>
            )}

            {paymentData.payment?.authorization && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Authorization:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentData.payment.authorization}
                </span>
              </div>
            )}

            {paymentData.payment?.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Method:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentData.payment.paymentMethod}
                  {paymentData.payment.franchise && ` (${paymentData.payment.franchise})`}
                </span>
              </div>
            )}

            {paymentData.payment?.receipt && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Receipt:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentData.payment.receipt}
                </span>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to dashboard in 3 seconds...
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md"
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Pending
  if (paymentData.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 px-4">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8">
          <div className="text-center">
            <FaHourglassHalf className="text-yellow-500 text-7xl mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Pending
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. This may take a few moments.
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Request ID:</span>
              <span className="text-gray-900 font-semibold">
                {paymentData.requestId}
              </span>
            </div>

            {paymentData.message && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">{paymentData.message}</p>
              </div>
            )}
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500">
              You will receive a confirmation once the payment is processed.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Rejected
  if (paymentData.isRejected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8">
          <div className="text-center">
            <FaTimesCircle className="text-red-500 text-7xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Declined
            </h1>
            <p className="text-gray-600 mb-6">
              {paymentData.message || "Your payment was declined. Please try again."}
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Request ID:</span>
              <span className="text-gray-900 font-semibold">
                {paymentData.requestId}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className="text-red-600 font-semibold">
                {paymentData.status}
              </span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unknown status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <FaTimesCircle className="text-gray-400 text-6xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unknown Status
        </h1>
        <p className="text-gray-600 mb-6">
          Payment status: {paymentData.status}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaymentReturnContent />
    </Suspense>
  );
}
