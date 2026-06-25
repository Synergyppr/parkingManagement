"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import { RxCaretRight } from "react-icons/rx";
import { IoCheckmarkOutline } from "react-icons/io5";
import { FaTicketAlt } from "react-icons/fa";

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

  const idFromUrl = searchParams.get("ticket");
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
      confirmButtonColor: "#d6a800",
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
        confirmButtonColor: "#d6a800",
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
                  confirmButtonColor: "#d6a800",
                });
              }, 800);
            }, 300);
          }
        } else {
          Swal.fire({
            title: "Error",
            text: "There was an issue requesting your vehicle. Please try again.",
            icon: "error",
            confirmButtonColor: "#d6a800",
          });
        }
      } catch (error) {
        console.error("Request error:", error);
        Swal.fire({
          title: "Network Error",
          text: "Unable to request vehicle. Please try again.",
          icon: "error",
          confirmButtonColor: "#d6a800",
        });
      } finally {
        setButtonLoader(false);
      }
    });
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

      const res = await fetch("/api/patronRating/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const data = await res.json();

      if (data?.status === "200") {
        setSubmitted(true);

        setTimeout(() => {
          Swal.fire({
            title: `Thanks for your feedback${
              vehicleData?.firstName ? `, ${vehicleData?.firstName}` : ""
            }!`,
            text: "We truly appreciate your rating and look forward to serving you again soon.",
            icon: "success",
            confirmButtonColor: "#d6a800",
          });
        }, 700);
      } else {
        Swal.fire({
          title: "Error",
          text: data?.message || "There was an error submitting your rating.",
          icon: "error",
          confirmButtonColor: "#d6a800",
        });
      }
    } catch (error) {
      console.error("Failed to submit rating", error);
      setTimeout(() => {
        Swal.fire({
          title: "Error",
          text: "There was an error submitting your rating. Please try again.",
          icon: "error",
          confirmButtonColor: "#d6a800",
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
        confirmButtonColor: "#d6a800",
      });
      return;
    }

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("ticket", ticketId.trim());
    window.history.replaceState({}, "", newUrl.toString());

    fetchVehicleByTicket(ticketId?.trim());
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f5ed]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(214,168,0,0.22),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.10),transparent_40%)]" />
  
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div 
          onClick={() => window.location.href = "/check-in"}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-amber-600 text-white 
          shadow-[0_18px_45px_rgba(214,168,0,0.35)] cursor-pointer">
            <KeySquare className="h-6 w-6" />
          </div>
  
          <h1 className="mt-4 font-serif text-4xl font-bold text-slate-950">
            Parkey Valet
          </h1>
  
          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.25em] text-amber-700">
            Premium Vehicle Retrieval
          </p>
        </div>
  
        {!idFromUrl ? (
          <section className="rounded-4xl border border-amber-200/70 bg-white/90 p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
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
                className="h-11 rounded-2xl bg-amber-500 px-5 text-sm font-extrabold text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)] transition hover:bg-amber-600"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
            <section className="relative overflow-hidden rounded-4xl border border-amber-200/80 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.13)]">
              <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-amber-100/70" />
  
              <span className="relative inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                Valet Ticket Located
              </span>
  
              <p className="relative mt-5 text-sm font-semibold text-slate-500">
                Hello,
              </p>
  
              <h2 className="relative font-serif text-4xl font-bold leading-tight text-slate-950">
                {vehicleData?.firstName || vehicleData?.lastName
                  ? `${vehicleData?.firstName || ""} ${vehicleData?.lastName || ""}`
                  : "Guest"}
              </h2>
  
              <div className="relative mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  #{vehicleData?.ticketNumber}
                </p>
  
                <h3 className="mt-2 text-xl font-extrabold capitalize text-slate-950">
                  {vehicleData?.color} {vehicleData?.make} {vehicleData?.model}
                </h3>
  
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {vehicleData?.type} • Received{" "}
                  {new Date(vehicleData?.createdDateTime as string).toLocaleString([], {
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
  
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold capitalize text-amber-700 ring-1 ring-amber-200">
                  {vehicleData?.status}
                </span>
              </div>
  
              <StatusTimeline currentStatus={vehicleData?.status as string} />
            </section>
  
            {(vehicleData?.status === "received" || vehicleData?.status === "parked") && (
              <section className="rounded-4xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-6 shadow-sm">
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
              <section className="rounded-4xl bg-linear-to-br from-amber-400 to-amber-600 p-7 text-center text-white shadow-[0_20px_55px_rgba(214,168,0,0.35)]">
                <IoCheckmarkOutline className="mx-auto mb-3 h-10 w-10" />
                <h3 className="font-serif text-3xl font-bold">
                  Vehicle Requested
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Your vehicle is on its way. Please be ready within 3–5 minutes.
                </p>
              </section>
            )}
  
            {vehicleData?.status === "ready" && (
              <section className="rounded-4xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <p className="text-sm leading-7 text-slate-700">
                  Your vehicle has been picked up. We hope you enjoyed your visit
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
  
            {vehicleData?.status !== "ready" && vehicleData?.status !== "requested" && (
              <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <input
                    checked={smsConsent}
                    onChange={() => setSmsConsent(!smsConsent)}
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-amber-500"
                    disabled={buttonLoader}
                  />
  
                  <span className="text-xs leading-6 text-slate-500">
                    I agree to receive SMS updates about my valet parking service.
                    Message & data rates may apply. Reply STOP to cancel, HELP for help.
                  </span>
                </label>
  
                <button
                  disabled={!smsConsent || buttonLoader}
                  onClick={handleRequestCar}
                  className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-black text-white shadow-[0_16px_36px_rgba(214,168,0,0.32)] transition hover:bg-amber-600 disabled:opacity-50"
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
  
            {requested && <TransactionDetails vehicleData={vehicleData!} />}
  
            {requested && (
              <ClientRating
                hoveredStars={hoveredStars}
                handleMouseEnter={handleMouseEnter}
                handleStarClick={handleStarClick}
                handleSubmitRating={handleSubmitRating}
                comment={comment}
                setComment={setComment}
                submitted={submitted}
                ratingSectionRef={ratingSectionRef as React.RefObject<HTMLDivElement>}
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
          Powered by <span className="text-amber-700">Parkey Valet</span>
        </p>
      </div>
    </div>
  );
};

export default RequestCar;