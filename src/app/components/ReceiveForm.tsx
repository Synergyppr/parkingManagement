"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { Ticket, DropdownOption, CarBrand } from "../types";
import { FaEye, FaEyeSlash, FaUser, FaTicketAlt, FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { IoPhonePortrait } from "react-icons/io5";
import { BiSolidSprayCan } from "react-icons/bi";
import { RiAiGenerate2 } from "react-icons/ri";
import { MdPin, MdPassword, MdLocationPin } from "react-icons/md";
import { GoCheckCircleFill } from "react-icons/go";
import { CiRedo } from "react-icons/ci";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import CarVector from "./CarVector";

interface ReceiveFormProps {
  carBrands: CarBrand[];
  vehicleTypes: DropdownOption[];
  vehicleColors: DropdownOption[];
  fetchData: () => void;
  form: Partial<Ticket>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
  initialForm: Partial<Ticket>;
  setInitialForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
}

const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

export default function ReceiveForm({
  carBrands,
  vehicleTypes,
  vehicleColors,
  fetchData,
  form,
  setForm,
  // initialForm,
  setInitialForm,
}: ReceiveFormProps) {
  const [step, setStep] = useState<number>(1);
  // const [form, setForm] = useState<Partial<Vehicle>>({});
  // const [initialForm, setInitialForm] = useState<Partial<Vehicle>>({});
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [loader, setLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [noIncident, setNoIncident] = useState(false);
  const [incidentParts, setIncidentParts] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const buildDamageStatus = (
    incidentParts: string[],
    descriptions: Record<string, string>,
    labelMapsByView: { [view: string]: Record<string, string[]> }
  ): Record<
    string,
    Record<string, { isDamaged: boolean; description: string }>
  > => {
    const damageStatus: Record<
      string,
      Record<string, { isDamaged: boolean; description: string }>
    > = {};

    for (const view in labelMapsByView) {
      const labelMap = labelMapsByView[view];
      const viewDamage: Record<
        string,
        { isDamaged: boolean; description: string }
      > = {};

      for (const label in labelMap) {
        const partIds = labelMap[label];
        const isDamaged = partIds.some((id) => incidentParts.includes(id));

        if (isDamaged) {
          const cleanLabel = label.replace(/\s+/g, "").toLowerCase(); // Normalize label
          viewDamage[cleanLabel] = {
            isDamaged: true,
            description: descriptions[label] || "",
          };
        }
      }

      if (Object.keys(viewDamage).length > 0) {
        damageStatus[view] = viewDamage;
      }
    }

    return damageStatus;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: Partial<Ticket>) => ({ ...prev, [name]: value }));

    if (name === "make") {
      const selectedBrand = carBrands.find((b) => b.id === parseInt(value));
      setModels(selectedBrand ? selectedBrand.models : []);
    }
  };

  const generateTicketNumber = () => {
    const randomSixDigit = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    setForm((prev: Partial<Ticket>) => ({
      ...prev,
      ticketNumber: randomSixDigit,
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (
      !form?.phoneNumber ||
      !form?.firstName ||
      !form?.lastName ||
      !form?.make ||
      !form?.model ||
      !form?.type ||
      !form?.color ||
      !form?.pin ||
      !form?.placeToVisit
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });
      return;
    }

    if (incidentParts?.length < 1 && !noIncident) {
      Swal.fire({
        icon: "warning",
        title: "Incident Report Required",
        text: "Please complete the vehicle incident report. If there are no incidents, please check the box below before submission.",
      });
      return;
    }

    // Check for missing descriptions before submission
    const allLabelsMap = {
      ...frontViewLabelsMap,
      ...rearViewLabelsMap,
      ...passengerViewLabelsMap,
      ...driverViewLabelsMap,
    };

    // Create a reverse map: partId -> label
    const partIdToLabelMap = Object.entries(allLabelsMap).reduce(
      (acc, [label, ids]) => {
        ids.forEach((id) => {
          acc[id] = label;
        });
        return acc;
      },
      {} as Record<string, string>
    );

    const missingDescriptions = incidentParts.filter((partId) => {
      const label = partIdToLabelMap[partId];
      return (
        label && (!descriptions[label] || descriptions[label].trim() === "")
      );
    });

    if (missingDescriptions.length > 0 && !noIncident) {
      Swal.fire({
        icon: "warning",
        title: "Missing Descriptions",
        text: "Please provide a description for all marked damages before submitting.",
      });
      return;
    }

    setLoader(true);

    const rawPhone = (form?.phoneNumber || "").replace(/\D/g, ""); // Remove non-digit characters

    let damageStatus = buildDamageStatus(incidentParts, descriptions, {
      frontview: frontViewLabelsMap,
      rearview: rearViewLabelsMap,
      passengerview: passengerViewLabelsMap,
      driverview: driverViewLabelsMap,
    });

    if (Object.keys(damageStatus).length === 0) {
      damageStatus = {}; // or `null` or `undefined`
    }

    const sendForm = {
      propertyId: "A7E348D3-8DFB-4F71-8BC5-042BA75D53C7",
      firstName: form?.firstName,
      lastName: form?.lastName,
      phone: rawPhone,
      pin: form?.pin,
      makeId: parseInt(form?.make || "0"),
      modelId: parseInt(form?.model || "0"),
      typeId: parseInt(form?.type || "0"),
      colorId: parseInt(form?.color || "0"),
      licensePlate: form?.licensePlate || "",
      ticketNumber: form?.ticketNumber || uuidv4().slice(0, 6),
      destination: form?.placeToVisit,
      damageStatus,
    };

    // console.log("Submitting form:", sendForm);

    // return; // Uncomment this line to prevent actual submission during development

    try {
      const res = await fetch("/api/vehicleCheckIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendForm }),
      });

      const result = await res.json();

      if (result?.status === "200") {
        await fetchData(); // refresh the data from the API

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Vehicle checked in successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setSubmitted(true);
        setForm({});
        setIncidentParts([]);
        setDescriptions({});
        setInitialForm({});
      } else {
        console.error("Error: Unexpected response:", result);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: result?.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoader(false);
    }
  };

  const fetchUserDataByPhone = async (phone: string): Promise<void> => {
    try {
      const res = await fetch(`/api/getVehicle/byPhone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      const preFill = data?.result?.data;

      if (preFill) {
        const initial = {
          phoneNumber: preFill?.phoneNumber,
          firstName: preFill?.firstName,
          lastName: preFill?.lastName,
          placeToVisit: preFill?.placeToVisit,
          make: preFill?.make?.toString(),
          model: preFill?.model?.toString(),
          type: preFill?.type?.toString(),
          color: preFill?.color?.toString(),
          licensePlate: preFill?.licensePlate || "",
          ticketNumber: "",
          pin: "", // blank out PIN for security
        };

        setForm(initial);
        setInitialForm(initial);

        // Optionally update models dropdown
        const selectedBrand = carBrands?.find(
          (b) => b?.id === parseInt(preFill?.make)
        );
        if (selectedBrand) {
          setModels(selectedBrand?.models);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  // Handle next function. Validate that all fields are filled before proceeding
  const handleNext = () => {
    if (step === 1) {
      if (
        !form?.phoneNumber ||
        !form?.firstName ||
        !form?.lastName ||
        !form?.ticketNumber ||
        !form?.placeToVisit
      ) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Form",
          text: "Please fill all required fields.",
        });
        return;
      }
    } else if (step === 2) {
      if (
        !form?.make ||
        !form?.model ||
        !form?.type ||
        !form?.color ||
        !form?.pin
      ) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Form",
          text: "Please fill all required fields.",
        });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handleSubmitAnother = () => {
    setSubmitted(false);
    setStep(1);
    setForm({});
    setIncidentParts([]);
    setDescriptions({});
    setInitialForm({});
  };

  return (
    <div
      className={`${
        step === 3 ? "" : "lg:mt-16 py-4 sm:py-4 md:py-16"
      } border-none lg:shadow-lg lg:border-1 lg:border-solid border-[e0f2ff] rounded-lg  lg:bg-white/30 mb-2`}
    >
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 transition-opacity duration-500 ease-in-out animate-fade-in min-h-full">
        {!submitted ? (
          <>
            <div className="lg:mb-10 relative lg:bottom-4">
              <h2 className="text-[23px] font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight text-center mb-1">
                Vehicle Receipt Form
              </h2>
              {step < 3 && (
                <p className="text-xs font-light text-center text-gray-700 mb-2">
                  Please complete all fields below.
                </p>
              )}
              {step === 3 && (
                <p className="text-xs font-light text-center text-gray-700 mb-2">
                  Complete vehicle incident report. (Optional)
                </p>
              )}
              <p
                className={`${
                  step < 3 ? "mb-6" : "mb-16"
                } text-xs font-bold text-center text-blue-600 mt-0`}
              >
                Step <span className="font-bold">{step}</span> / 3
              </p>
            </div>

            <form className="mt-6">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div className="relative">
                    <IoPhonePortrait className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <input
                      name="phoneNumber"
                      placeholder="Phone Number"
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        let formatted = rawValue;

                        if (rawValue?.length <= 3) {
                          formatted = rawValue;
                        } else if (rawValue?.length <= 6) {
                          formatted = `(${rawValue?.slice(
                            0,
                            3
                          )}) ${rawValue?.slice(3)}`;
                        } else {
                          formatted = `(${rawValue?.slice(
                            0,
                            3
                          )}) ${rawValue?.slice(3, 6)}-${rawValue?.slice(
                            6,
                            10
                          )}`;
                        }

                        setForm((prev: Partial<Ticket>) => ({
                          ...prev,
                          phoneNumber: formatted,
                        }));

                        if (rawValue.length >= 10) {
                          fetchUserDataByPhone(rawValue);
                        }
                      }}
                      value={form?.phoneNumber || ""}
                      maxLength={14}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      required
                    />
                  </div>

                  {/* First Name */}
                  <div className="relative">
                    <FaUser className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <input
                      name="firstName"
                      placeholder="First Name"
                      onChange={handleChange}
                      value={form?.firstName || ""}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="relative">
                    <FaUser className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <input
                      name="lastName"
                      placeholder="Last Name"
                      onChange={handleChange}
                      value={form?.lastName || ""}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      required
                    />
                  </div>

                  {/* Ticket Number with Auto */}
                  <div className="relative flex gap-2 items-center">
                    <div className="relative w-full">
                      <FaTicketAlt className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                      <input
                        name="ticketNumber"
                        placeholder="Ticket Number"
                        value={form?.ticketNumber || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z0-9]{0,6}$/.test(val)) {
                            setForm((prev: Partial<Ticket>) => ({
                              ...prev,
                              ticketNumber: val,
                            }));
                          }
                        }}
                        className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={generateTicketNumber}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-500 focus:outline-none cursor-pointer"
                      >
                        <RiAiGenerate2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Place to Visit */}
                  <div className="relative">
                    <MdLocationPin className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <input
                      name="placeToVisit"
                      placeholder="Place to Visit"
                      onChange={handleChange}
                      value={form.placeToVisit || ""}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Make */}
                  <div className="relative">
                    <FaCar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <select
                      name="make"
                      onChange={handleChange}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      value={form.make || ""}
                    >
                      <option value="">Select Make</option>
                      {carBrands?.map((brand) => (
                        <option key={brand?.id} value={brand?.id}>
                          {brand?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div className="relative">
                    <FaCarRear className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <select
                      name="model"
                      onChange={handleChange}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      value={form.model || ""}
                    >
                      <option value="">Select Model</option>
                      {models?.map((model) => (
                        <option key={model?.id} value={model?.id}>
                          {model?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div className="relative">
                    <PiCarProfileFill className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <select
                      name="type"
                      onChange={handleChange}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      value={form.type || ""}
                    >
                      <option value="">Select Type</option>
                      {vehicleTypes?.map((type) => (
                        <option key={type?.id} value={type?.id}>
                          {type?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div className="relative">
                    <BiSolidSprayCan className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <select
                      name="color"
                      onChange={handleChange}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      value={form.color || ""}
                    >
                      <option value="">Select Color</option>
                      {vehicleColors?.map((color) => (
                        <option key={color?.id} value={color?.id}>
                          {color?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* License Plate */}
                  <div className="relative">
                    <MdPin className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <input
                      name="licensePlate"
                      placeholder="License Plate (optional)"
                      type="text"
                      onChange={handleChange}
                      value={form?.licensePlate || ""}
                      className="pl-8 border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      maxLength={8}
                      pattern="[A-Z0-9]{0,4}"
                    />
                  </div>

                  {/* PIN */}
                  <div className="relative w-full">
                    <MdPassword className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600" />
                    <input
                      type={showPin ? "text" : "password"}
                      name="pin"
                      placeholder="PIN"
                      value={form?.pin || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,4}$/.test(val)) {
                          setForm((prev: Partial<Ticket>) => ({
                            ...prev,
                            pin: val,
                          }));
                        }
                      }}
                      className="pl-8 border-b border-gray-500 px-2 py-2 pr-10 text-sm placeholder-gray-300 text-gray-700 tracking-tight w-full focus:ring-1 focus:ring-[#ef6c00] focus:rounded-sm focus:outline-none"
                      maxLength={4}
                      inputMode="numeric"
                      pattern="\d*"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((prev) => !prev)}
                      className="cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                    >
                      {showPin ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="w-full flex justify-center relative bottom-[72px]">
                  <CarVector
                    noIncident={noIncident}
                    setNoIncident={setNoIncident}
                    incidentParts={incidentParts}
                    setIncidentParts={setIncidentParts}
                    descriptions={descriptions}
                    setDescriptions={setDescriptions}
                    licensePlate={form?.licensePlate || ""}
                    findLinkedGroup={findLinkedGroup}
                    frontViewLabelsMap={frontViewLabelsMap}
                    rearViewLabelsMap={rearViewLabelsMap}
                    passengerViewLabelsMap={passengerViewLabelsMap}
                    driverViewLabelsMap={driverViewLabelsMap}
                  />
                </div>
              )}
            </form>

            <div className="flex justify-between mt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="cursor-pointer px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded shadow-md"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-md tracking-tight rounded"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  type="button"
                  disabled={loader}
                  className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded"
                >
                  {loader ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center animate-fade-in flex flex-col items-center h-full my-auto">
            <div className="my-auto flex-1 shadow-md px-4 py-10 rounded-sm mt-[9vh] bg-slate-300/70 bg-opacity-10">
              <div className="text-center mb-3">
                <GoCheckCircleFill className="w-20 h-20 mx-auto text-blue-700 border-1 border-solid rounded-full" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-blue-600 uppercase drop-shadow-[.5px_.5px_.5px_#2f68c4]">
                <span className="text-[28px]">S</span>ubmitted!
              </h2>
              <p className="text-gray-600 mt-2 mb-6 leading-5 mx-2">
                Your vehicle has been checked in and is being parked. Relax and
                enjoy your visit — we’ve got it from here.
              </p>
              <button
                onClick={handleSubmitAnother}
                className="bg-blue-600 hover:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors tracking-tight flex gap-2 items-center justify-center shadow-md w-full cursor-pointer"
              >
                <CiRedo className="text-white" />
                Submit Another Vehicle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
