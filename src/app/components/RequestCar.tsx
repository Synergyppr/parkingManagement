"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import { RxCaretRight } from "react-icons/rx";
import { IoCheckmarkOutline } from "react-icons/io5";
import { FaTicketAlt, FaCheckCircle } from "react-icons/fa";
import { MdPayment } from "react-icons/md";

import { useSignalR, joinGroup, leaveGroup } from "../lib/SignalRProvider";
import { useProperty } from "../context/PropertyContext";
import { NotificationHandler, VehicleData } from "../types";

import StatusTimeline from "./StatusTimeline";
import PageLoader from "./elements/PageLoader";
import ButtonLoader from "./elements/ButtonLoader";
import ClientRating from "./ClientRating";
import TransactionDetails from "./TransactionDetails";
import FormInput from "./elements/FormInput";
import { KeySquare } from "lucide-react";

interface RequestTransactionType {
  id: string;
  name: string;
  value: number;
  taxable?: boolean;
  stateTaxRate?: number;
  cityTaxRate?: number;
}

interface OnlinePaymentResult {
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
}

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateRateTotal(type: RequestTransactionType): number {
  if (!type.taxable) return Number(type.value) || 0;
  const base = Number(type.value) || 0;
  const stateTax = roundToTwo(base * ((type.stateTaxRate ?? 0) / 100));
  const cityTax = roundToTwo(base * ((type.cityTaxRate ?? 0) / 100));
  return roundToTwo(base + stateTax + cityTax);
}

const RequestCar = () => {
  const { propertyId, setPropertyId } = useProperty();
  const ratingSectionRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [ticketId, setTicketId] = useState("");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [requested, setRequested] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [submitted, setSubmitted] = useState(
    Boolean(vehicleData?.surveySubmitted) || false
  );
  const [hoveredStars, setHoveredStars] = useState(0);
  const [ratedStars, setRatedStars] = useState(0);
  const [comment, setComment] = useState("");
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  // Online Payment state
  const [paymentEmail, setPaymentEmail] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<RequestTransactionType[]>([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [paymentResult, setPaymentResult] = useState<OnlinePaymentResult | null>(null);
  const [onlineTip, setOnlineTip] = useState(0);
  const paymentVerifiedRef = useRef(false);

  const idFromUrl = searchParams.get("ticket");
  const paymentReturn = searchParams.get("payment");
  const { registerNotificationHandler } = useSignalR();

  useEffect(() => {
    registerNotificationHandler((notification: NotificationHandler) => {
      if (notification?.ticketId === ticketId && notification?.status) {
        setVehicleData((prev) => ({
          ...prev!,
          status: notification?.status,
        }));

        if (
          notification?.status === "requested" ||
          notification?.status === "ready"
        ) {
          setRequested(true);
        } else if (notification.status === "parked") {
          setRequested(false);
        }
      }
    });
  }, [ticketId, registerNotificationHandler, vehicleData?.status]);

  useEffect(() => {
    if (idFromUrl) {
      setTicketId(idFromUrl);
      fetchVehicleByTicket(idFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, idFromUrl]);

  useEffect(() => {
    if (
      vehicleData?.status === "requested" ||
      vehicleData?.status === "ready"
    ) {
      setRequested(true);
    }
  }, [vehicleData]);

  // Fetch transaction types when propertyId is available
  useEffect(() => {
    if (vehicleData?.propertyId) {
      fetchTransactionTypes(vehicleData.propertyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData?.propertyId]);

  // Auto-select if only one rate
  useEffect(() => {
    if (transactionTypes.length === 1) {
      setSelectedRateId(transactionTypes[0].id);
    }
  }, [transactionTypes]);

  // Handle payment return from PlaceToPay — wait for vehicleData to load first
  useEffect(() => {
    if (paymentReturn === "return" && ticketId && vehicleData && !paymentVerifiedRef.current) {
      const storedRequestId = localStorage.getItem(`p2p_requestId_${ticketId}`);
      if (storedRequestId) {
        paymentVerifiedRef.current = true;
        verifyPayment(storedRequestId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReturn, ticketId, vehicleData]);

  const fetchVehicleByTicket = async (ticketId: string) => {
    try {
      const res = await fetch("/api/getVehicle/byTicketId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId }),
      });

      const data = await res.json();

      if (data?.result?.status === "200") {
        setVehicleData(data?.result?.data);
        setVehicleNotFound(false);
        setPropertyId(data?.result?.data?.propertyId);
      } else if (
        data?.result?.status === "200" &&
        data?.result?.data?.propertyId
      ) {
        let prevPropertyId = propertyId || sessionStorage.getItem("propertyId");
        const newPropertyId = data.result.data.propertyId;

        if (prevPropertyId && prevPropertyId !== newPropertyId) {
          await leaveGroup(prevPropertyId);
        }

        await joinGroup(newPropertyId);
        prevPropertyId = newPropertyId;
        sessionStorage.setItem("propertyId", newPropertyId);
        setPropertyId(newPropertyId);
      } else {
        setVehicleNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      alert("Something went wrong. Try again.");
    }
  };

  const updateVehicleStatus = async (status: string) => {
    const sendForm = {
      latitude: 0,
      longitude: 0,
      propertyId: propertyId || "",
      ticketId,
      status,
      isUserUpdate: true,
      pin: "",
    };

    const res = await fetch("/api/vehicleStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendForm),
    });

    return res.json();
  };

  const markNotificationAsUnread = async () => {
    if (!vehicleData?.notificationId) return;

    const res = await fetch("/api/notification/unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vehicleData?.notificationId }),
    });

    return res.json();
  };

  const handleRequestCar = async () => {
    Swal.fire({
      title: "Request Vehicle",
      text: "Please only request your vehicle when you're ready to leave. To keep wait times short, we ask that you pick up your vehicle within 3–5 minutes of requesting it.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary)",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Proceed",
      cancelButtonText: "Cancel",
      backdrop: `rgba(15,23,42,0.55)`,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const willCharge = await Swal.fire({
        title: "Confirm SMS Opt-In",
        html: `
          <p>By selecting "Yes, submit," you agree to receive automated text messages from API Valet Service (SynergyPPR) about your vehicle status. Message & data rates may apply.</p>
          <p class="mt-2 text-gray-500 text-sm">Reply STOP to cancel, HELP for help.</p>
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "var(--primary)",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, submit",
        cancelButtonText: "Cancel",
      });

      if (!willCharge.isConfirmed) return;

      setButtonLoader(true);

      try {
        const data = await updateVehicleStatus("requested");

        if (data?.result?.status === "200") {
          const unreadResult = await markNotificationAsUnread();

          if (unreadResult?.status === "200") {
            setRequested(true);
            setVehicleData({ ...vehicleData, status: "requested" });

            setTimeout(() => {
              ratingSectionRef.current?.scrollIntoView({ behavior: "smooth" });

              setTimeout(() => {
                Swal.fire({
                  backdrop: `rgba(15,23,42,0.55)`,
                  title: "Vehicle Requested",
                  text: "Your request has been received. Hang tight — your vehicle is on its way!",
                  icon: "success",
                  confirmButtonColor: "var(--primary)",
                });
              }, 800);
            }, 300);
          }
        } else {
          Swal.fire({
            title: "Error",
            text: "There was an issue requesting your vehicle. Please try again.",
            icon: "error",
            confirmButtonColor: "var(--primary)",
          });
        }
      } catch (error) {
        console.error("Request error:", error);
        Swal.fire({
          title: "Network Error",
          text: "Unable to request vehicle. Please try again.",
          icon: "error",
          confirmButtonColor: "var(--primary)",
        });
      } finally {
        setButtonLoader(false);
      }
    });
  };

  const selectedRate = transactionTypes.find((t) => t.id === selectedRateId);
  const rateTotal = selectedRate ? calculateRateTotal(selectedRate) : 0;
  const totalToPay = roundToTwo(rateTotal + onlineTip);

  const fetchTransactionTypes = async (propId: string) => {
    try {
      const res = await fetch("/api/valetTransaction/types/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: propId }),
      });
      const data = await res.json();
      if (data?.result?.status === "200") {
        setTransactionTypes(data?.result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching transaction types:", error);
    }
  };

  const verifyPayment = async (requestId: string) => {
    try {
      const res = await fetch(
        `/api/payments/placetopay/session/${requestId}`
      );
      if (!res.ok) throw new Error("Failed to verify payment");
      const data: OnlinePaymentResult = await res.json();
      setPaymentResult(data);

      if (data.isApproved) {
        // Record the valet transaction if not already done
        const intent = localStorage.getItem(`p2p_intent_${ticketId}`);
        if (intent) {
          await recordValetTransaction(data, JSON.parse(intent));
          localStorage.removeItem(`p2p_intent_${ticketId}`);
        }
      }
    } catch (error) {
      console.error("Payment verification error:", error);
    }
  };

  const recordValetTransaction = async (
    paymentData: OnlinePaymentResult,
    intent: { transactionTypeId: string; propertyId?: string }
  ) => {
    try {
      const reference = paymentData.payment?.reference || "";

      const res = await fetch("/api/valetTransaction/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          propertyId: intent.propertyId || vehicleData?.propertyId || propertyId || "",
          pin: "",
          latitude: 0,
          longitude: 0,
          paymentMethod: "p2p",
          transactionTypeId: Number(intent.transactionTypeId),
          amount: paymentData.payment?.amount || 0,
          notes: `PlaceToPay Ref: ${reference}`,
          receiptOutput: "no",
          receiptEmail: "no",
        }),
      });

      const result = await res.json();
      console.log("[RequestCar] Valet transaction recorded:", result);

      if (result?.result?.status == "200") {
        setVehicleData((prev) => (prev ? { ...prev, status: "ready" } : prev));
        setRequested(true);
      }
    } catch (error) {
      console.error("Error recording valet transaction:", error);
    }
  };

  const handlePayOnline = async () => {
    if (!selectedRate || !paymentEmail || !vehicleData) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentEmail)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid email address for your receipt.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    setPaymentLoading(true);

    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/request?ticket=${ticketId}&payment=return`;

      const res = await fetch("/api/payments/placetopay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          patronName: vehicleData.firstName || "Guest",
          patronSurname: vehicleData.lastName || "",
          patronEmail: paymentEmail,
          patronPhone: vehicleData.phoneNumber
            ? `${vehicleData.areaCode || "+1"}${vehicleData.phoneNumber.replace(/\D/g, "")}`
            : undefined,
          amount: selectedRate.value,
          tip: onlineTip > 0 ? onlineTip : undefined,
          taxable: selectedRate.taxable ?? false,
          transactionTypeId: selectedRate.id,
          transactionDescription: selectedRate.name,
          propertyReference: vehicleData.propertyId || propertyId || "",
          returnUrl,
        }),
      });

      const data = await res.json();

      if (data.success && data.processUrl) {
        localStorage.setItem(
          `p2p_requestId_${ticketId}`,
          String(data.requestId)
        );
        localStorage.setItem(
          `p2p_intent_${ticketId}`,
          JSON.stringify({
            transactionTypeId: selectedRate.id,
            propertyId: vehicleData.propertyId || propertyId || "",
          })
        );
        window.location.href = data.processUrl;
      } else {
        Swal.fire({
          icon: "error",
          title: "Payment Error",
          text:
            data.message ||
            "Could not create payment session. Please try again.",
          confirmButtonColor: "var(--primary)",
        });
      }
    } catch (error) {
      console.error("Pay online error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleMouseEnter = (starIndex: number, isHalf: boolean) => {
    if (submitted) return;
    const hoverValue = isHalf ? starIndex + 0.5 : starIndex + 1;
    setHoveredStars(hoverValue);
  };

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (submitted) return;
    const ratingValue = isHalf ? starIndex + 0.5 : starIndex + 1;
    setRatedStars(ratingValue);
    setHoveredStars(ratingValue);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || ratedStars === 0) return;

    try {
      const sendForm = {
        valetTicketId: ticketId,
        patronId: vehicleData?.patronId || "",
        rating: ratedStars,
        comment,
      };

      // console.log("Rating send form", sendForm);

      const res = await fetch("/api/patronRating/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const data = await res.json();

      // console.log("Data", data);

      if (data?.status === "200") {
        setSubmitted(true);

        setTimeout(() => {
          Swal.fire({
            title: `Thanks for your feedback${
              vehicleData?.firstName ? `, ${vehicleData?.firstName}` : ""
            }!`,
            text: "We truly appreciate your rating and look forward to serving you again soon.",
            icon: "success",
            confirmButtonColor: "var(--primary)",
          });
        }, 700);
      } else {
        Swal.fire({
          title: "Error",
          text: data?.message || "There was an error submitting your rating.",
          icon: "error",
          confirmButtonColor: "var(--primary)",
        });
      }
    } catch (error) {
      console.error("Failed to submit rating", error);
      setTimeout(() => {
        Swal.fire({
          title: "Error",
          text: "There was an error submitting your rating. Please try again.",
          icon: "error",
          confirmButtonColor: "var(--primary)",
        });
      }, 700);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setTicketId(e.target.value);
  };

  const handleSubmit = () => {
    if (ticketId.trim() === "") {
      Swal.fire({
        title: "Input Required",
        text: "Please enter a valid Ticket ID.",
        icon: "warning",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("ticket", ticketId.trim());
    window.history.replaceState({}, "", newUrl.toString());

    fetchVehicleByTicket(ticketId?.trim());
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[color-mix(in_srgb,var(--primary-soft)_55%,white)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.10),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div
            onClick={() => (window.location.href = "/check-in")}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-(--primary-light) to-primary text-white 
          shadow-[0_18px_45px_color-mix(in_srgb,var(--primary)_35%,transparent)] cursor-pointer"
          >
            <KeySquare className="h-6 w-6" />
          </div>

          <h1 className="mt-4 font-serif text-4xl font-bold text-slate-950">
            Parkey Valet
          </h1>

          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
            Premium Vehicle Retrieval
          </p>
        </div>

        {!idFromUrl ? (
          <section className="rounded-4xl border border-(--primary-light) bg-white/90 p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <span
              className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase 
            tracking-[0.18em] text-primary"
            >
              Guest Access
            </span>

            <h2 className="mt-4 font-serif text-3xl font-bold text-slate-950">
              Find Your Vehicle
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your valet ticket number to view status, request retrieval,
              and follow real-time updates.
            </p>

            <div className="mt-6 flex gap-2">
              <FormInput
                name="ticketId"
                placeholder="Ticket ID"
                icon={<FaTicketAlt />}
                value={ticketId}
                onChange={(e) => handleChange(e)}
                onClear={() => setTicketId("")}
              />

              <button
                className="h-11 rounded-2xl bg-[var(--primary-soft)]0 px-5 text-sm font-extrabold text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition bg-secondary cursor-pointer"
                onClick={handleSubmit}
                type="button"
              >
                Find
              </button>
            </div>
          </section>
        ) : vehicleNotFound ? (
          <section className="rounded-4xl border border-red-100 bg-white/90 p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="font-serif text-3xl font-bold text-slate-950">
              Vehicle Not Found
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              We couldn&apos;t find a vehicle associated with this ticket ID.
              Please check your link or contact valet support.
            </p>
          </section>
        ) : ticketId && !vehicleData ? (
          <div className="py-20 text-center">
            <PageLoader />
          </div>
        ) : ticketId ? (
          <div className="space-y-5">
            {/* Hero Ticket Card */}
            <section className="relative overflow-hidden rounded-4xl border border-(--primary-light) bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.13)]">
              <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-(--primary-soft)" />

              <span
                className="relative inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase 
              tracking-[0.18em] text-primary"
              >
                Valet Ticket Located
              </span>

              <p className="relative mt-5 text-sm font-semibold text-slate-500">
                Hello,
              </p>

              <h2 className="relative font-serif text-4xl font-bold leading-tight text-slate-950">
                {vehicleData?.firstName || vehicleData?.lastName
                  ? `${vehicleData?.firstName || ""} ${
                      vehicleData?.lastName || ""
                    }`
                  : "Guest"}
              </h2>

              <div className="relative mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
                  #{vehicleData?.ticketNumber}
                </p>

                <h3 className="mt-2 text-xl font-extrabold capitalize text-slate-950">
                  {vehicleData?.color} {vehicleData?.make} {vehicleData?.model}
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {vehicleData?.type} • Received{" "}
                  {new Date(
                    vehicleData?.createdDateTime as string
                  ).toLocaleString([], {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </section>

            {/* Timeline */}
            <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Vehicle Status
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                    Live Progress
                  </h3>
                </div>

                <span className="rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-extrabold capitalize text-primary ring-1 ring-(--primary-light)">
                  {vehicleData?.status}
                </span>
              </div>

              <StatusTimeline currentStatus={vehicleData?.status as string} />
            </section>

            {/* Payment Result — after returning from PlaceToPay */}
            {paymentResult?.isApproved && (
              <section className="rounded-4xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <div className="mb-4 text-center">
                  <FaCheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <h3 className="font-serif text-2xl font-bold text-slate-950">
                    Thank You for Your Payment!
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your payment has been processed successfully.
                  </p>
                </div>

                <div className="space-y-0 rounded-2xl border border-emerald-200 bg-white p-4">
                  {paymentResult.payment?.reference && (
                    <div className="flex items-center justify-between border-b border-slate-100 py-3">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Reference
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {paymentResult.payment.reference}
                      </span>
                    </div>
                  )}
                  {paymentResult.payment?.amount !== undefined && (
                    <div className="flex items-center justify-between border-b border-slate-100 py-3">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Amount
                      </span>
                      <span className="text-sm font-black text-primary">
                        ${paymentResult.payment.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {paymentResult.payment?.authorization && (
                    <div className="flex items-center justify-between border-b border-slate-100 py-3">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Authorization
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {paymentResult.payment.authorization}
                      </span>
                    </div>
                  )}
                  {paymentResult.payment?.paymentMethod && (
                    <div className="flex items-center justify-between border-b border-slate-100 py-3">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Method
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {paymentResult.payment.paymentMethod}
                        {paymentResult.payment.franchise
                          ? ` (${paymentResult.payment.franchise})`
                          : ""}
                      </span>
                    </div>
                  )}
                  {paymentResult.payment?.receipt && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Receipt
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {paymentResult.payment.receipt}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {paymentResult?.isPending && (
              <section className="rounded-4xl border border-(--primary-light) bg-(--primary-soft) p-6 shadow-sm text-center">
                <h3 className="font-serif text-2xl font-bold text-slate-950">
                  Payment Processing
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Your payment is being verified. You will receive a
                  confirmation once it&apos;s processed.
                </p>
              </section>
            )}

            {paymentResult?.isRejected && (
              <section className="rounded-4xl border border-red-200 bg-red-50 p-6 shadow-sm text-center">
                <h3 className="font-serif text-2xl font-bold text-slate-950">
                  Payment Declined
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {paymentResult.message ||
                    "Your payment was declined. Please try again."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentResult(null);
                    localStorage.removeItem(`p2p_requestId_${ticketId}`);
                    const url = new URL(window.location.href);
                    url.searchParams.delete("payment");
                    window.history.replaceState({}, "", url.toString());
                  }}
                  className="mt-4 h-12 cursor-pointer rounded-2xl bg-secondary px-8 text-sm font-black text-white transition hover:opacity-90"
                >
                  Try Again
                </button>
              </section>
            )}

            {(vehicleData?.status === "received" ||
              vehicleData?.status === "parked") && (
              <section className="rounded-4xl border border-(--primary-light) bg-linear-to-br from-(--primary-soft) to-white p-6 shadow-sm">
                <p className="text-sm leading-7 text-slate-700">
                  If you&apos;ve finished your visit{" "}
                  {vehicleData?.placeToVisit && (
                    <span>
                      at{" "}
                      <strong className="capitalize text-slate-950">
                        {vehicleData?.placeToVisit}
                      </strong>
                    </span>
                  )}{" "}
                  and are ready to leave, request your vehicle below.
                </p>
              </section>
            )}

            {vehicleData?.status === "requested" && (
              <section className="rounded-4xl bg-linear-to-br from-(--primary-light) to-primary p-7 text-center text-white shadow-[0_20px_55px_color-mix(in_srgb,var(--primary)_35%,transparent)]">
                <IoCheckmarkOutline className="mx-auto mb-3 h-10 w-10" />
                <h3 className="font-serif text-3xl font-bold">
                  Vehicle Requested
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Your vehicle is on its way. Please be ready within 3–5
                  minutes.
                </p>
              </section>
            )}

            {vehicleData?.status === "ready" && (
              <section className="rounded-4xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <p className="text-sm leading-7 text-slate-700">
                  Your vehicle has been picked up. We hope you enjoyed your
                  visit
                  {vehicleData?.placeToVisit && (
                    <>
                      {" to "}
                      <strong className="capitalize text-slate-950">
                        {vehicleData?.placeToVisit}
                      </strong>
                    </>
                  )}
                  .
                </p>
              </section>
            )}

            {/* Online Payment — show after vehicle is requested so patron can pay */}
            {vehicleData?.status === "requested" &&
              !paymentResult?.isApproved && (
                <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="mb-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Online Payment
                    </p>
                    <h3 className="mt-1 font-serif text-2xl font-bold text-slate-950">
                      Pay Now
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      While your vehicle is being retrieved, complete your payment securely online.
                    </p>
                  </div>

                  {/* Rate Selection */}
                  {transactionTypes.length > 0 ? (
                    <div className="mb-4 space-y-2">
                      {transactionTypes.map((rate) => {
                        const total = calculateRateTotal(rate);
                        const active = selectedRateId === rate.id;
                        return (
                          <button
                            key={rate.id}
                            type="button"
                            onClick={() => setSelectedRateId(rate.id)}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                              active
                                ? "border-(--primary-light) bg-(--primary-soft) shadow-sm"
                                : "border-slate-200 bg-white hover:border-(--primary-light)"
                            }`}
                          >
                            <div>
                              <p
                                className={`text-sm font-extrabold ${
                                  active ? "text-primary" : "text-slate-900"
                                }`}
                              >
                                {rate.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {rate.taxable ? "Taxable rate" : "Flat rate"}
                              </p>
                            </div>
                            <p
                              className={`text-lg font-black ${
                                active ? "text-primary" : "text-slate-900"
                              }`}
                            >
                              ${total.toFixed(2)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
                      Loading rates...
                    </div>
                  )}

                  {/* Tip Selection — show after rate selected */}
                  {selectedRate && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Add a Tip
                      </p>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 5].map((amount) => {
                          const active = onlineTip === amount;
                          return (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setOnlineTip(amount)}
                              className={`flex-1 cursor-pointer rounded-xl border py-3 text-center text-sm font-extrabold transition-all ${
                                active
                                  ? "border-(--primary-light) bg-(--primary-soft) text-primary shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-(--primary-light)"
                              }`}
                            >
                              {amount === 0 ? "None" : `$${amount}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Email & Pay Button — show after rate selected */}
                  {selectedRate && (
                    <>
                      <div className="mb-4">
                        <FormInput
                          name="paymentEmail"
                          type="email"
                          placeholder="Email for receipt"
                          icon={<MdPayment className="h-4 w-4" />}
                          value={paymentEmail}
                          onChange={(e) => setPaymentEmail(e.target.value)}
                          onClear={() => setPaymentEmail("")}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={paymentLoading || !paymentEmail}
                        onClick={handlePayOnline}
                        className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-black text-white shadow-[0_16px_36px_color-mix(in_srgb,var(--primary)_32%,transparent)] transition disabled:opacity-50"
                      >
                        {paymentLoading ? (
                          <ButtonLoader />
                        ) : (
                          <span className="flex items-center gap-2">
                            <MdPayment className="h-5 w-5" />
                            Pay ${totalToPay.toFixed(2)} Online
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </section>
              )}

            {vehicleData?.status !== "ready" &&
              vehicleData?.status !== "requested" && (
                <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <input
                      autoFocus={false}
                      checked={smsConsent}
                      onChange={() => setSmsConsent(!smsConsent)}
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      disabled={buttonLoader}
                    />

                    <span className="text-xs leading-6 text-slate-500">
                      I agree to receive SMS updates about my valet parking
                      service. Message & data rates may apply. Reply STOP to
                      cancel, HELP for help.
                    </span>
                  </label>

                  <button
                    disabled={!smsConsent || buttonLoader}
                    onClick={handleRequestCar}
                    className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary-soft)]0 text-sm font-black text-white 
                    shadow-[0_16px_36px_color-mix(in_srgb,var(--primary)_32%,transparent)] transition bg-secondary disabled:opacity-50 cursor-pointer"
                  >
                    {buttonLoader ? (
                      <ButtonLoader />
                    ) : (
                      <span className="flex items-center gap-2">
                        Request My Vehicle
                        <RxCaretRight className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                </section>
              )}

            {vehicleData?.status === "ready" && (
              <TransactionDetails vehicleData={vehicleData} />
            )}

            {requested && (
              <ClientRating
                hoveredStars={hoveredStars}
                handleMouseEnter={handleMouseEnter}
                handleStarClick={handleStarClick}
                handleSubmitRating={handleSubmitRating}
                comment={comment}
                setComment={setComment}
                submitted={submitted}
                ratingSectionRef={
                  ratingSectionRef as React.RefObject<HTMLDivElement>
                }
                vehicleData={vehicleData as VehicleData}
              />
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <PageLoader />
          </div>
        )}

        <p className="mt-8 text-center text-xs font-semibold text-slate-500">
          Powered by <span className="text-primary">Parkey Valet</span>
        </p>
      </div>
    </div>
  );
};

export default RequestCar;
