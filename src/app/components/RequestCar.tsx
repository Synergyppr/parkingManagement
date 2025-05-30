"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { RxCaretRight } from "react-icons/rx";
import { BsStar, BsStarFill, BsStarHalf } from "react-icons/bs";
import { IoCheckmarkOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import StatusTimeline from "./StatusTimeline";
import PageLoader from "./elements/PageLoader";
import ButtonLoader from "./elements/ButtonLoader";

const RequestCar = () => {
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
  } | null>(null);
  const [requested, setRequested] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [ratedStars, setRatedStars] = useState(0);
  const [vehicleNotFound, setVehicleNotFound] = useState(false);
  const idFromUrl = searchParams.get("ticket");

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
      if (data?.result?.status === "200") {
        setVehicleData(data?.result?.data);
        setVehicleNotFound(false);
      } else {
        console.log("Error", data?.result?.message);
        setVehicleNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      alert("Something went wrong. Try again.");
    }
  };

  const handleRequestCar = () => {
    Swal.fire({
      theme: "dark",
      title: "Request Vehicle",
      text: "To help keep our valet service running smoothly, please only request your vehicle when you're ready to leave. If you'll be departing within the next 3–5 minutes, go ahead and place your request so we can bring your vehicle promptly.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, request it!",
      cancelButtonText: "No, go back.",
      backdrop: `rgba(0,0,123,0.4)`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        setButtonLoader(true);

        try {
          const sendForm = {
            ticketId: ticketId,
            status: "requested",
            isUserUpdate: true,
            pin: "", // if isUserUpdate is true, pin is not required
          };

          const res = await fetch("/api/vehicleStatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sendForm),
          });

          const data = await res.json();

          if (data?.result?.status === "200") {
            setTimeout(() => {
              setRequested(true);
              setVehicleData({ ...vehicleData, status: "requested" });
              setButtonLoader(false);

              setTimeout(() => {
                ratingSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
              }, 300);
            }, 800);

            setTimeout(() => {
              Swal.fire({
                theme: "dark",
                backdrop: `rgba(0,0,123,0.4)`,
                title: "Vehicle Requested",
                text: "Your request has been received. Hang tight — your vehicle is on its way!",
                icon: "success",
              });
            }, 800);
          } else {
            console.error("Error requesting vehicle:", data?.message);
            Swal.fire({
              theme: "dark",
              title: "Error",
              text: "There was an issue requesting your vehicle. Please try again.",
              icon: "error",
            });
          }
        } catch (error) {
          console.error("Network error while requesting vehicle:", error);
          Swal.fire({
            theme: "dark",
            title: "Network Error",
            text: "Unable to connect to the server. Please check your internet connection and try again.",
            icon: "error",
          });
        } finally {
          setButtonLoader(false);
        }
      }
    });
  };

  const returnVehicleToLot = async () => {
    Swal.fire({
      theme: "dark",
      title: "Return Vehicle to Lot?",
      text: "Are you sure you want to return the vehicle to the lot? This may delay your next request.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, return it",
      cancelButtonText: "No, keep it requested",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendForm = {
          ticketId: ticketId,
          status: "parked",
          isUserUpdate: true,
          pin: "", // if isUserUpdate is true, pin is not required
        };

        const res = await fetch("/api/vehicleStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendForm),
        });

        const data = await res.json();

        if (data?.result?.status === "200") {
          setRequested(false);
          setVehicleData((prev) => ({
            ...prev!,
            status: "parked", // Update status to parked
          }));
          Swal.fire({
            theme: "dark",
            icon: "success",
            title: "Vehicle Returned",
            text: "Your vehicle has been returned to the lot.",
          });
        } else {
          console.error("Error returning vehicle:", data?.message);
          Swal.fire({
            theme: "dark",
            title: "Error",
            text: "There was an issue returning your vehicle. Please try again.",
            icon: "error",
          });
        }
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

  // Dummy function
  const handleSubmitRating = async () => {
    if (submitted || ratedStars === 0) {
      return;
    }

    try {
      // Simulate success
      setSubmitted(true);

      setTimeout(() => {
        Swal.fire({
          theme: "dark",
          title: `Thanks for your feedback, ${vehicleData?.firstName}!`,
          text: "We truly appreciate your rating and look forward to serving you again soon.",
          icon: "success",
          confirmButtonColor: "#3B82F6",
        });
      }, 700);
    } catch (error) {
      console.error("Failed to submit rating", error);
      setTimeout(() => {
        Swal.fire({
          theme: "dark",
          title: "Error",
          text: "There was an error submitting your rating. Please try again.",
          icon: "error",
        });
      }, 700);
    }
  };

  if (!idFromUrl) {
    return (
      <div className="min-h-[80vh] md:min-h-[87vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            No Ticket ID Provided
          </h1>
          <p className="text-gray-400 leading-5 px-8">
            Please use the link provided in your email to view your vehicle
            details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] md:min-h-[87vh] p-6">
      <h1 className="text-2xl font-bold mt-2 mb-6 text-center text-blue-500 tracking-tight px-2 drop-shadow-[.5px_.5px_.5px_#3B82F6]">
        Thank you for using API Valet Service!
      </h1>
      <div
        className={`flex flex-col items-center justify-center h-full ${
          vehicleNotFound ? "md:mt-[20%]" : ""
        }`}
      >
        {vehicleNotFound ? (
          <div className="text-center text-gray-300 pt-6 px-6 relative top-10">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Vehicle Not Found
            </h2>
            <p className="text-gray-400 leading-6 max-w-md mx-auto">
              We couldn’t find a vehicle associated with this ticket ID. Please
              make sure you&apos;re using the correct link from your email, or
              contact valet support for assistance.
            </p>
          </div>
        ) : ticketId && !vehicleData ? (
          <div className="text-center">
            <PageLoader />
          </div>
        ) : ticketId ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md text-gray-200 w-full max-w-3xl">
            <>
              <div className="mb-6 text-justify">
                <p className="text-lg leading-relaxed ">
                  Hello{" "}
                  <strong>
                    {vehicleData?.firstName} {vehicleData?.lastName},
                  </strong>
                </p>
                <p className="indent mt-2">
                  We’ve located your vehicle associated with ticket{"  "}
                  <strong className="italic text-[#3B82F6]">
                    #
                    {vehicleData?.ticketNumber?.substring(
                      vehicleData?.ticketNumber.length - 6,
                      vehicleData?.ticketNumber.length
                    )}
                  </strong>{" "}
                  —{" "}
                  <strong className="text-blue-500">
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

                <StatusTimeline currentStatus={vehicleData?.status as string} />

                {vehicleData?.status === "received" ||
                vehicleData?.status === "parked" ? (
                  <p className="indent mt-3">
                    If you’ve finished your visit at{" "}
                    <strong>{vehicleData?.placeToVisit}</strong> and are ready
                    to leave, please click the button below to request your
                    vehicle.
                  </p>
                ) : vehicleData?.status === "requested" ? (
                  <p className="indent mt-3">
                    Your vehicle has been requested and is currently on its way!
                    Please be ready to pick it up within the next 3–5 minutes to
                    avoid any delays.
                  </p>
                ) : vehicleData?.status === "ready" ? (
                  <p className="indent mt-3">
                    Your vehicle has been picked up. We hope you enjoyed your
                    visit to <strong>{vehicleData?.placeToVisit}</strong> and
                    look forward to seeing you again soon!
                  </p>
                ) : null}

                <div className="mt-5 text-center">
                  <button
                    disabled={requested}
                    onClick={handleRequestCar}
                    className={`${
                      requested ? "bg-blue-600/20" : "bg-blue-600"
                    } text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-all duration-700`}
                  >
                    {requested ? (
                      <span className="flex gap-2 items-center justify-between">
                        Vehicle Requested
                        <IoCheckmarkOutline className="w-5 h-5 text-blue-500" />
                      </span>
                    ) : buttonLoader ? (
                      <ButtonLoader />
                    ) : (
                      <span className="flex gap-2 items-center justify-between">
                        Request your vehicle{" "}
                        <RxCaretRight className="w-5 h-5" />
                      </span>
                    )}
                  </button>
                </div>
                {requested && vehicleData?.status == "requested" && (
                  <div className="text-center text-xs relative bottom-2">
                    <p
                      className="mt-4 text-blue-600 underline cursor-pointer"
                      onClick={returnVehicleToLot}
                    >
                      Return the vehicle to the lot
                    </p>
                  </div>
                )}
              </div>
              {requested && (
                <div
                  ref={ratingSectionRef}
                  className={`${
                    submitted ? "opacity-50" : ""
                  } mt-2 border-t border-gray-700 pt-4`}
                >
                  <h2 className="text-center text-md text-gray-300 mb-2 font-bold tracking-tight">
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
                            onClick={() => handleStarClick(starIndex, true)}
                          ></div>

                          {/* Right Half */}
                          <div
                            className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                            onMouseEnter={() =>
                              handleMouseEnter(starIndex, false)
                            }
                            onClick={() => handleStarClick(starIndex, false)}
                          ></div>

                          {/* Icon Layer */}
                          <div className="z-0 flex justify-center items-center w-full h-full">
                            {hoveredStars >= fullValue ? (
                              <BsStarFill className="text-blue-500 w-5 h-5" />
                            ) : hoveredStars >= halfValue ? (
                              <BsStarHalf className="text-blue-500 w-5 h-5" />
                            ) : (
                              <BsStar className="text-primary w-5 h-5" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex mt-4 justify-center">
                    <button
                      onClick={handleSubmitRating}
                      disabled={submitted}
                      className={`${
                        submitted
                          ? "bg-blue-600/20 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                      } transition-colors text-white px-3 py-2 w-[95%] font-semibold shadow-md tracking-tight rounded`}
                    >
                      {submitted ? "Submitted" : "Submit Rating"}
                    </button>
                  </div>
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
  );
};

export default RequestCar;
