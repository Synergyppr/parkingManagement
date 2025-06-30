"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { RxCaretRight } from "react-icons/rx";
import { BsStar, BsStarFill, BsStarHalf } from "react-icons/bs";
import { IoCheckmarkOutline } from "react-icons/io5";
import { useSignalR, joinGroup, leaveGroup } from "../lib/SignalRProvider";
import { useProperty } from "../context/PropertyContext";
import StatusTimeline from "./StatusTimeline";
import PageLoader from "./elements/PageLoader";
import ButtonLoader from "./elements/ButtonLoader";

const RequestCar = () => {
  const { propertyId, setPropertyId } = useProperty();
  const ratingSectionRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState("");
  const [vehicleData, setVehicleData] = useState<{
    firstName?: string;
    lastName?: string;
    ticketNumber?: string;
    color?: string;
    make?: string;
    model?: string;
    type?: string;
    createdDateTime?: string;
    placeToVisit?: string;
    status?: string;
    patronId?: string;
    notificationId?: string;
    surveySubmitted?: boolean;
  } | null>(null);
  const [requested, setRequested] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [submitted, setSubmitted] = useState(
    Boolean(vehicleData?.surveySubmitted) || false
  );
  const [hoveredStars, setHoveredStars] = useState(0);
  const [ratedStars, setRatedStars] = useState(0);
  const [comment, setComment] = useState("");
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
  const idFromUrl = searchParams.get("ticket");
  const { registerNotificationHandler } = useSignalR();

  useEffect(() => {
    // Only register handler after component is mounted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerNotificationHandler((notification: any) => {
      // console.log("🔄 Real-time notification received:", notification);

      if (notification.ticketId === ticketId && notification.status) {
        setVehicleData((prev) => ({
          ...prev!,
          status: notification.status,
        }));

        if (
          notification.status === "requested" ||
          notification.status === "ready"
        ) {
          setRequested(true);
        } else if (notification.status === "parked") {
          setRequested(false);
        }
      }
    });
  }, [ticketId, registerNotificationHandler]);

  useEffect(() => {
    if (idFromUrl) {
      setTicketId(idFromUrl);

      // Fetch vehicle data using ticket ID on load
      fetchVehicleByTicket(idFromUrl);
    }
  }, [searchParams, idFromUrl]);

  useEffect(() => {
    if (
      vehicleData?.status === "requested" ||
      vehicleData?.status === "ready"
    ) {
      setRequested(true);
    }
  }, [vehicleData]);

  const fetchVehicleByTicket = async (ticket: string) => {
    try {
      const res = await fetch("/api/getVehicle/byTicketId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticket }),
      });

      const data = await res.json();

      // console.log("Vehicle Data by Ticket ID:", data);

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
        console.log("Error", data?.result?.message);
        setVehicleNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      alert("Something went wrong. Try again.");
    }
  };

  const updateVehicleStatus = async (status: string) => {
    const sendForm = {
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

  const handleRequestCar = async () => {
    Swal.fire({
      title: "Request Vehicle",
      text: "Please only request your vehicle when you're ready to leave.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, request it!",
      cancelButtonText: "No, go back.",
      backdrop: `rgba(0,0,123,0.4)`,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setButtonLoader(true);

      try {
        const data = await updateVehicleStatus("requested");

        // console.log("Update Vehicle Status Result:", data);

        if (data?.result?.status === "200") {
          // console.log("Vehicle status updated successfully");
          const unreadResult = await markNotificationAsUnread();

          // console.log("Unread Notification Result:", unreadResult);

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
        }
      } catch (error) {
        console.error("Request error:", error);
        Swal.fire({
          title: "Network Error",
          text: "Unable to request vehicle. Please try again.",
          icon: "error",
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

      // console.log("Submitting Rating:", sendForm);

      const res = await fetch("/api/patronRating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const data = await res.json();

      // console.log("Rating Submission Result:", data);

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
        console.log("Error", data?.result?.message);
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
    }
  };

  return (
    <div
      style={{
        background:
          "radial-gradient(circle at center, #3B82F6 10%, #e0f2ff 90%)",
      }}
      className="min-h-[calc(100vh-50px)] p-6 mx-auto bg-white my-auto flex flex-col items-center justify-center"
    >
      <div>
        <h1 className="w-full text-2xl font-bold mt-2 mb-0 text-center pt-4 pb-3 px-3 lg:py-6 bg-gradient-to-r from-blue-700 to-blue-500 text-white tracking-tight rounded-t-lg">
          Thank you for using API Valet Service!
        </h1>
        <div
          className={`flex flex-col items-center justify-center h-full bg-gray-200 rounded-b-lg`}
        >
          {!idFromUrl ? (
            <div className="text-center text-gray-600 pt-6 px-6 relative top-10 py-2 pb-30 my-auto h-full">
              <h2 className="text-2xl font-bold text-red-500 mb-4 tracking-tight">
                No Ticket ID Provided
              </h2>
              <p className="text-gray-500 leading-6 max-w-md mx-auto">
                Please use the link provided in your email to view your vehicle
                details.
              </p>
            </div>
          ) : vehicleNotFound ? (
            <div className="text-center text-gray-600 pt-6 px-6 relative top-10 py-2 pb-30">
              <h2 className="text-2xl font-bold text-red-500 mb-4 tracking-tight">
                Vehicle Not Found
              </h2>
              <p className="text-gray-500 leading-6 max-w-md mx-auto">
                We couldn’t find a vehicle associated with this ticket ID.
                Please make sure you&apos;re using the correct link from your
                email, or contact valet support for assistance.
              </p>
            </div>
          ) : ticketId && !vehicleData ? (
            <div className="text-center">
              <PageLoader />
            </div>
          ) : ticketId ? (
            <div className="bg-slate-200 p-6 rounded-b-lg shadow-lg text-gray-800 w-full max-w-3xl md:px-[8%] lg:px-[10%]">
              <>
                <div className="mb-6 text-justify">
                  {vehicleData?.firstName || vehicleData?.lastName ? (
                    <p className="text-lg leading-relaxed">
                      Hello{" "}
                      <strong>
                        {vehicleData?.firstName} {vehicleData?.lastName},
                      </strong>
                    </p>
                  ) : (
                    <p className="text-base leading-relaxed">Greetings,</p>
                  )}
                  <p className="indent mt-2">
                    We’ve located your vehicle associated with ticket{"  "}
                    <strong className="italic text-[#ef6c00]">
                      {/* text-[#3B82F6] blue */}#
                      {/* {vehicleData?.ticketNumber?.substring(
                        vehicleData?.ticketNumber.length - 6,
                        vehicleData?.ticketNumber.length
                      )} */}
                      {vehicleData?.ticketNumber}
                    </strong>{" "}
                    —{" "}
                    <strong className="text-[#ef6c00] capitalize">
                      {vehicleData?.color} {vehicleData?.make}{" "}
                      {vehicleData?.model}
                    </strong>{" "}
                    ({vehicleData?.type}), recorded as received on{" "}
                    <strong>
                      {new Date(
                        vehicleData?.createdDateTime as string
                      ).toLocaleString([], {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                    .
                  </p>

                  <StatusTimeline
                    currentStatus={vehicleData?.status as string}
                  />

                  {/* <div className="mt-4 mx-auto w-[50%] bg-gradient-to-t to-blue-600 from-blue-700 via-blue-500 rounded px-6 py-4 shadow text-center">
                    <p className="text-lg font-medium text-white">
                      Total Paid:{" "}
                      <span className="text-[#ef6c00] font-semibold">
                        $0.00
                      </span>
                    </p>
                  </div> */}

                  {vehicleData?.status === "received" ||
                  vehicleData?.status === "parked" ? (
                    <p className="indent mt-3">
                      If you’ve finished your visit{" "}
                      {vehicleData?.placeToVisit &&
                        " at " +
                        <strong>{vehicleData?.placeToVisit}</strong>}{" "}
                      and are ready to leave, please click the button below to
                      request your vehicle.
                    </p>
                  ) : vehicleData?.status === "requested" ? (
                    <p className="indent mt-3">
                      Your vehicle has been requested and is currently on its
                      way! Please be ready to pick it up within the next 3–5
                      minutes to avoid any delays.
                    </p>
                  ) : vehicleData?.status === "ready" ? (
                    <p className="indent mt-3">
                      Your vehicle has been picked up. We hope you enjoyed your
                      visit{" "}
                      {vehicleData?.placeToVisit &&
                        " to " +
                        <strong>{vehicleData?.placeToVisit}</strong>}{" "}
                      and look forward to seeing you again soon!
                    </p>
                  ) : null}

                  <div className="mt-5 text-center">
                    <button
                      disabled={requested}
                      onClick={handleRequestCar}
                      className={`${
                        requested
                          ? "bg-blue-600/20"
                          : "bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-800 hover:bg-blue-700 transition-all duration-700"
                      } text-white py-2 px-4 rounded-md`}
                    >
                      {requested ? (
                        <span className="flex gap-2 items-center justify-between">
                          Vehicle{" "}
                          {vehicleData?.status === "requested"
                            ? "Requested"
                            : "Picked-Up"}
                          <IoCheckmarkOutline className="w-5 h-5 text-blue-500" />
                        </span>
                      ) : buttonLoader ? (
                        <ButtonLoader />
                      ) : (
                        <span className="flex gap-2 items-center justify-between cursor-pointer">
                          Request your vehicle{" "}
                          <RxCaretRight className="w-5 h-5" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Rating Section */}
                {requested && (
                  <div
                    ref={ratingSectionRef}
                    className={`${
                      submitted ? "opacity-50" : ""
                    } mt-2 border-t border-gray-200 pt-4`}
                  >
                    <hr className="border-gray-300 my-4" />

                    {vehicleData?.surveySubmitted ? (
                      <div
                        className="flex flex-col items-center justify-center mt-6 px-4 py-8 rounded shadow-inner transition-all duration-500 bg-opacity-80"
                        style={{
                          background:
                            "radial-gradient(circle at center, #E2E8F0, #CBD5E1)",
                        }}
                      >
                        <div
                          className="w-16 h-16 mb-3 rounded-full p-2 flex items-center justify-center border border-orange-500 shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, #ff9800, #ef6c00)", // vibrant orange gradient
                          }}
                        >
                          <IoCheckmarkOutline className="text-white w-10 h-10" />
                        </div>{" "}
                        <h3 className="text-lg font-semibold text-slate-700 text-center tracking-tight leading-5">
                          Thank you for your feedback
                          {vehicleData?.firstName
                            ? `, ${vehicleData.firstName}`
                            : ""}
                          !
                        </h3>
                        <p className="text-slate-600 text-sm text-center mt-1">
                          We truly appreciate your rating and look forward to
                          serving you again.
                        </p>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-center text-lg text-gray-700 mb-2 font-bold tracking-tighter italic">
                          How was your experience?
                        </h2>
                        <div className="flex justify-center space-x-1">
                          {[...Array(5)]?.map((_, starIndex) => {
                            const fullValue = starIndex + 1;
                            const halfValue = starIndex + 0.5;

                            return (
                              <div key={starIndex} className="relative w-6 h-6">
                                {/* Left Half */}
                                <div
                                  className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                                  onMouseEnter={() =>
                                    handleMouseEnter(starIndex, true)
                                  }
                                  onClick={() =>
                                    handleStarClick(starIndex, true)
                                  }
                                ></div>

                                {/* Right Half */}
                                <div
                                  className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                                  onMouseEnter={() =>
                                    handleMouseEnter(starIndex, false)
                                  }
                                  onClick={() =>
                                    handleStarClick(starIndex, false)
                                  }
                                ></div>

                                {/* Icon Layer */}
                                <div className="z-0 flex justify-center items-center w-full h-full">
                                  {hoveredStars >= fullValue ? (
                                    <BsStarFill className="text-blue-600 w-5 h-5" />
                                  ) : hoveredStars >= halfValue ? (
                                    <BsStarHalf className="text-blue-600 w-5 h-5" />
                                  ) : (
                                    <BsStar className="text-primary w-5 h-5" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mx-5">
                          <textarea
                            className="mt-4 w-full p-2 border border-gray-300 rounded"
                            placeholder="Leave a comment (optional)"
                            rows={3}
                            disabled={submitted}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          ></textarea>
                        </div>

                        <div className="flex mt-4 justify-center">
                          <button
                            type="button"
                            onClick={(e) => handleSubmitRating(e)}
                            disabled={submitted}
                            className={`${
                              submitted
                                ? "bg-blue-600/20 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                            } transition-colors text-white px-3 py-2 w-[95%] font-semibold shadow-md tracking-tight rounded`}
                          >
                            Submit Rating
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            </div>
          ) : (
            <div className="text-center">
              <PageLoader />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCar;
