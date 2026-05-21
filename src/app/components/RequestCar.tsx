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
    // Only register handler after component is mounted
    registerNotificationHandler((notification: NotificationHandler) => {
      // console.log("Real-time notification received:", notification);

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

      // Fetch vehicle data using ticket ID on load
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
        // console.log("Error", data?.result?.message);
        setVehicleNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      alert("Something went wrong. Try again.");
    }
  };

  const updateVehicleStatus = async (status: string) => {
    const sendForm = {
      latitude: 0, // not needed for user updates
      longitude: 0, // not needed for user updates
      propertyId: propertyId || "",
      ticketId,
      status,
      isUserUpdate: true,
      pin: "", // not needed for user updates
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

  // Request Car Submission Handler
  const handleRequestCar = async () => {
    Swal.fire({
      title: "Request Vehicle",
      text: "Please only request your vehicle when you're ready to leave. To keep wait times short, we ask that you pick up your vehicle within 3–5 minutes of requesting it.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Proceed",
      cancelButtonText: "Cancel",
      backdrop: `rgba(0,0,123,0.4)`,
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
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, submit",
        cancelButtonText: "Cancel",
      });

      if (!willCharge.isConfirmed) {
        return;
      }

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
                  backdrop: `rgba(0,0,123,0.4)`,
                  title: "Vehicle Requested",
                  text: "Your request has been received. Hang tight — your vehicle is on its way!",
                  icon: "success",
                });
              }, 800);
            }, 300);
          }
        } else {
          Swal.fire({
            title: "Error",
            text: "There was an issue requesting your vehicle. Please try again.",
            icon: "error",
          });
          return;
        }
      } catch (error) {
        console.error("Request error:", error);
        Swal.fire({
          title: "Network Error",
          text: "Unable to request vehicle. Please try again.",
          icon: "error",
        });
        return;
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
    if (submitted || ratedStars === 0) {
      return;
    }

    try {
      const sendForm = {
        valetTicketId: ticketId,
        patronId: vehicleData?.patronId || "",
        rating: ratedStars,
        comment: comment,
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
            confirmButtonColor: "#3B82F6",
          });
        }, 700);
      } else {
        Swal.fire({
          title: "Error",
          text: data?.message || "There was an error submitting your rating.",
          icon: "error",
        });
        console.log("Error", data?.result?.message);
        return;
      }
    } catch (error) {
      console.error("Failed to submit rating", error);
      setTimeout(() => {
        Swal.fire({
          title: "Error",
          text: "There was an error submitting your rating. Please try again.",
          icon: "error",
        });
      }, 700);
      return;
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
      });
      return;
    }
    // Inject ticketId into URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("ticket", ticketId.trim());
    window.history.replaceState({}, "", newUrl.toString());

    fetchVehicleByTicket(ticketId?.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-sm mx-auto px-4 py-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="text-white font-bold text-lg">API Valet Service</span>
          </div>
        </div>

        {!idFromUrl ? (
          <div className="bg-white rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Thank you for using API Valet Service!
            </h2>
            <p className="text-sm text-gray-500">
              Enter your ticket number to find your vehicle.
            </p>
            <div className="flex gap-2">
              <FormInput
                name="ticketId"
                placeholder="Ticket ID"
                icon={<FaTicketAlt />}
                value={ticketId}
                onChange={(e) => handleChange(e)}
                onClear={() => setTicketId("")}
              />
              <button
                className="px-4 h-11 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                onClick={handleSubmit}
                type="button"
              >
                Find
              </button>
            </div>
          </div>
        ) : vehicleNotFound ? (
          <div className="bg-white rounded-2xl p-6 text-center space-y-3">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Vehicle Not Found
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We couldn&apos;t find a vehicle associated with this ticket ID.
              Please make sure you&apos;re using the correct link from your
              email, or contact valet support for assistance.
            </p>
          </div>
        ) : ticketId && !vehicleData ? (
          <div className="text-center py-12">
            <PageLoader />
          </div>
        ) : ticketId ? (
          <div className="space-y-4">
            {/* Greeting Card */}
            <div className="bg-white rounded-2xl p-5">
              {vehicleData?.firstName || vehicleData?.lastName ? (
                <>
                  <p className="text-gray-500 text-sm mb-1">Hello,</p>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {vehicleData?.firstName} {vehicleData?.lastName}
                  </h2>
                </>
              ) : (
                <p className="text-gray-500 text-sm mb-3">Greetings,</p>
              )}
              <p className="text-sm text-gray-600 leading-relaxed">
                We&apos;ve located your vehicle associated with ticket{" "}
                <span className="font-mono font-semibold text-blue-600">
                  #{vehicleData?.ticketNumber}
                </span>
                {" — "}
                <span className="text-accent font-semibold capitalize">
                  {vehicleData?.color} {vehicleData?.make}{" "}
                  {vehicleData?.model}
                </span>{" "}
                ({vehicleData?.type}), received on{" "}
                <span className="font-medium">
                  {new Date(
                    vehicleData?.createdDateTime as string
                  ).toLocaleString([], {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                .
              </p>
            </div>

            {/* Status Timeline Card */}
            <div className="bg-white rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Vehicle Status</p>
              <StatusTimeline
                currentStatus={vehicleData?.status as string}
              />
            </div>

            {/* Status Message Card */}
            {(vehicleData?.status === "received" ||
              vehicleData?.status === "parked") && (
              <div className="rounded-2xl p-4 bg-blue-50 border border-blue-100">
                <p className="text-sm leading-relaxed text-gray-700">
                  If you&apos;ve finished your visit{" "}
                  {vehicleData?.placeToVisit && (
                    <span>
                      at{" "}
                      <strong className="capitalize">
                        {vehicleData?.placeToVisit}
                      </strong>
                    </span>
                  )}{" "}
                  and are ready to leave, please tap the button below to
                  request your vehicle.
                </p>
              </div>
            )}

            {vehicleData?.status === "requested" && (
              <div className="bg-orange-500 rounded-2xl p-5 text-center text-white">
                <IoCheckmarkOutline className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-semibold">Vehicle Requested</p>
                <p className="text-xs opacity-80 mt-1">
                  Your vehicle has been requested and is on its way! Please be ready within 3–5 minutes.
                </p>
              </div>
            )}

            {vehicleData?.status === "ready" && (
              <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
                <p className="text-sm leading-relaxed text-gray-700">
                  Your vehicle has been picked up. We hope you enjoyed your
                  visit{" "}
                  {vehicleData?.placeToVisit && (
                    <>
                      {" to "}
                      <strong className="capitalize">
                        {vehicleData?.placeToVisit}
                      </strong>
                    </>
                  )}{" "}
                  and look forward to seeing you again soon!
                </p>
              </div>
            )}

            {/* SMS Consent & Request Button */}
            {vehicleData?.status !== "ready" &&
              vehicleData?.status !== "requested" && (
              <div className="bg-white rounded-2xl p-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    checked={smsConsent}
                    onChange={() => setSmsConsent(!smsConsent)}
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-blue-600"
                    disabled={buttonLoader}
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    I agree to receive SMS updates about my valet parking
                    service. Message & data rates may apply. Reply STOP to
                    cancel, HELP for help.
                  </span>
                </label>
                <button
                  disabled={!smsConsent || buttonLoader}
                  onClick={handleRequestCar}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {buttonLoader ? (
                    <ButtonLoader />
                  ) : (
                    <span className="flex gap-2 items-center">
                      Request My Vehicle
                      <RxCaretRight className="w-5 h-5" />
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Transaction Details */}
            {requested && <TransactionDetails vehicleData={vehicleData!} />}

            {/* Rating Section */}
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
          <div className="text-center py-12">
            <PageLoader />
          </div>
        )}

        <p className="text-center text-slate-500 text-xs mt-8">
          Powered by API Valet Service
        </p>
      </div>
    </div>
  );
};

export default RequestCar;
