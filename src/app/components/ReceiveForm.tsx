"use client";

import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { FaUser, FaTicketAlt, FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { IoPhonePortrait } from "react-icons/io5";
import { BiSolidSprayCan } from "react-icons/bi";
import { MdPin, MdPassword, MdLocationPin } from "react-icons/md";
import { IoCheckmarkOutline } from "react-icons/io5";
import { CiRedo } from "react-icons/ci";
import { Ticket, DropdownOption, CarBrand } from "../types";
import { useProperty } from "../context/PropertyContext";
import { formatPhoneNumber } from "../lib/clientUtils";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import CarVector from "./CarVector";
import FormInput from "./elements/FormInput";

interface ReceiveFormProps {
  carBrands: CarBrand[];
  vehicleTypes: DropdownOption[];
  vehicleColors: DropdownOption[];
  fetchData: () => void;
  form: Partial<Ticket>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
  initialForm: Partial<Ticket>;
  setInitialForm: React.Dispatch<React.SetStateAction<Partial<Ticket>>>;
  isFormChanged?: () => boolean;
  shouldBypassUnloadPromptRef?: React.MutableRefObject<boolean>;
  closeModal?: () => void;
  modalType?: "none" | "report" | "incident";
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
  initialForm,
  setInitialForm,
  isFormChanged,
  shouldBypassUnloadPromptRef,
}: ReceiveFormProps) {
  const { propertyId, latitude, longitude, propertyName, locationMode } =
    useProperty();
  const saveClickedRef = useRef(false);
  const [step, setStep] = useState<number>(1);
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [loader, setLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [noIncident, setNoIncident] = useState(false);
  const [incidentParts, setIncidentParts] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    generateTicketNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Generate a UUID, remove dashes, and take the first 6 alphanumeric characters
    const alphanumericSix = uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase();

    setForm((prev: Partial<Ticket>) => ({
      ...prev,
      ticketNumber: alphanumericSix,
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (
      !form?.phoneNumber ||
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

    if (incidentParts?.length < 1 && !noIncident) {
      Swal.fire({
        icon: "warning",
        title: "Incident Report Required",
        text: "Please complete the vehicle incident report. If there are no incidents, please check the box above before submission.",
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
      damageStatus = {};
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: userLat, longitude: userLng } = position.coords;
      const sendForm = {
        latitude: locationMode === "manual" ? latitude : userLat,
        longitude: locationMode === "manual" ? longitude : userLng,
        propertyId: propertyId,
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

          const willCharge = await Swal.fire({
            title: "Are You Sure?",
            html: `
            <p>This form submission will trigger a text message to the visitor.</p>
            <p><strong>You may incur a small charge.</strong></p>
            <p class="mt-2 text-gray-500 text-sm">Do you wish to proceed?</p>
          `,
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, submit",
            cancelButtonText: "Cancel",
          });

          if (!willCharge.isConfirmed) {
            setLoader(false);
            return;
          }

          // Successful login
          Swal.fire({
            title: "Form Sent",
            html: `<pre style="text-align: left; white-space: pre-wrap;">${JSON.stringify(
              sendForm,
              null,
              2
            )}</pre>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continue",
            cancelButtonText: "Cancel",
          }).then(async (response) => {
            if (response.isConfirmed) {
              // Swal.fire({
              //   icon: "success",
              //   title: "Success",
              //   text: "Vehicle checked in successfully!",
              //   showConfirmButton: false,
              //   timer: 1500,
              // });
              setSubmitted(true);
              setForm({});
              setIncidentParts([]);
              setDescriptions({});
              setInitialForm({});
            } //
          }); //
        } else {
          console.error("Error: Unexpected response:", result);
          Swal.fire({
            icon: "error",
            title: "Submission Failed",
            text: result?.message || "Something went wrong. Please try again.",
            html: `<pre style="text-align: left; white-space: pre-wrap;">${JSON.stringify(
              sendForm,
              null,
              2
            )}</pre>`,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (error: unknown) => {
        console.error("Geolocation error:", error);
        Swal.fire({
          icon: "error",
          title: "Location Error",
          text: "Unable to retrieve your location. Please allow location access and try again.",
        });
        setLoader(false);
      };
    });
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
          ticketNumber: form?.ticketNumber,
          damagedParts: preFill?.damagedParts || [],
          pin: "",
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

  const handleNext = () => {
    const missing: string[] = [];

    if (step === 1) {
      if (!form?.phoneNumber) missing.push("phoneNumber");
      if (!form?.ticketNumber) missing.push("ticketNumber");
    } else if (step === 2) {
      if (!form?.make) missing.push("make");
      if (!form?.model) missing.push("model");
      if (!form?.type) missing.push("type");
      if (!form?.color) missing.push("color");
      if (!form?.pin) missing.push("pin");
    }

    if (missing.length > 0) {
      setMissingFields(missing);

      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });

      return;
    }

    setMissingFields([]);
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

  const handleClearForm = () => {
    Swal.fire({
      title: "Clear Form",
      text: "Are you sure you want to clear the form?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "No, keep it",
    }).then((result) => {
      if (result.isConfirmed) {
        setForm({});
        setInitialForm({});
        setModels([]);
        setStep(1);
      }
    });
  };

  return (
    <div
      className={`${
        step === 3 ? "" : "py-4 lg:mt-[7%] md:py-16 sm:py-4 xs:py-4"
      } border-none rounded-lg  mb-2`}
    >
      <div className="p-2 sm:p-4 md:p-6 max-w-3xl mx-auto space-y-6 transition-opacity duration-500 ease-in-out animate-fade-in min-h-full">
        {!submitted ? (
          <div>
            <div className="lg:mb-10 relative lg:bottom-4">
              <h2 className="text-[23px] font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight text-center mb-1">
                Vehicle Receipt Form
              </h2>
              {step < 3 && (
                <p className="text-xs font-light text-center text-gray-700 mb-2">
                  Please complete all required fields below to park in{" "}
                  {propertyName ? (
                    propertyName
                  ) : (
                    <span className="italic">[ designated property ]</span>
                  )}
                  .
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
                  {/* Ticket Number with Auto */}
                  <FormInput
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
                    icon={<FaTicketAlt />}
                    required
                    missing={missingFields.includes("ticketNumber")}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        ticketNumber: "",
                      }))
                    }
                  />

                  {/* Phone Number */}
                  <FormInput
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={form?.phoneNumber || ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "");
                      const formatted = formatPhoneNumber(rawValue);

                      setForm((prev: Partial<Ticket>) => ({
                        ...prev,
                        phoneNumber: formatted,
                      }));

                      if (rawValue.length >= 10) {
                        fetchUserDataByPhone(rawValue);
                      }
                    }}
                    icon={<IoPhonePortrait />}
                    required
                    missing={missingFields.includes("phoneNumber")}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: "",
                      }))
                    }
                  />
                  {/* First Name */}
                  <FormInput
                    name="firstName"
                    placeholder="First Name"
                    icon={<FaUser />}
                    value={form.firstName || ""}
                    onChange={handleChange}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        firstName: "",
                      }))
                    }
                  />
                  {/* Last Name */}
                  <FormInput
                    name="lastName"
                    placeholder="Last Name"
                    icon={<FaUser />}
                    value={form?.lastName || ""}
                    onChange={handleChange}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        lastName: "",
                      }))
                    }
                  />
                  {/* Place to Visit */}
                  <FormInput
                    name="placeToVisit"
                    placeholder="Place to Visit"
                    icon={<MdLocationPin />}
                    onChange={handleChange}
                    value={form.placeToVisit || ""}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        placeToVisit: "",
                      }))
                    }
                  />
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Make */}
                  <FormInput
                    name="make"
                    value={form.make || ""}
                    onChange={handleChange}
                    icon={<FaCar />}
                    type="select"
                    options={carBrands}
                    missing={missingFields.includes("make")}
                  />

                  {/* Model */}
                  <FormInput
                    name="model"
                    value={form.model || ""}
                    onChange={handleChange}
                    icon={<FaCarRear />}
                    type="select"
                    options={models}
                    missing={missingFields.includes("model")}
                  />

                  {/* Type */}
                  <FormInput
                    name="type"
                    value={form.type || ""}
                    onChange={handleChange}
                    icon={<PiCarProfileFill />}
                    type="select"
                    options={vehicleTypes}
                    missing={missingFields.includes("type")}
                  />

                  {/* Color */}
                  <FormInput
                    name="color"
                    value={form.color || ""}
                    onChange={handleChange}
                    icon={<BiSolidSprayCan />}
                    type="select"
                    options={vehicleColors}
                    missing={missingFields.includes("color")}
                  />

                  {/* License Plate */}
                  <FormInput
                    name="licensePlate"
                    placeholder="License Plate"
                    icon={<MdPin />}
                    onChange={handleChange}
                    value={form?.licensePlate || ""}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        licensePlate: "",
                      }))
                    }
                  />

                  {/* PIN */}
                  <FormInput
                    name="pin"
                    type="text"
                    placeholder="PIN"
                    icon={<MdPassword />}
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
                    required
                    showPasswordToggle
                    showPassword={showPin}
                    setShowPassword={setShowPin}
                    missing={missingFields.includes("pin")}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        pin: "",
                      }))
                    }
                  />
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
                    saveClickedRef={saveClickedRef}
                    shouldBypassUnloadPromptRef={shouldBypassUnloadPromptRef}
                    isFormChanged={isFormChanged}
                    damagedParts={initialForm?.damagedParts || []}
                  />
                </div>
              )}
            </form>

            <div
              className={`${step === 3 ? "mt-4" : "mt-2"} flex justify-between`}
            >
              {step === 1 && (
                <button
                  type="button"
                  disabled={!isFormChanged}
                  onClick={handleClearForm}
                  className={`${
                    isFormChanged ? "cursor-pointer hover:bg-gray-400" : ""
                  } px-6 py-2 bg-gray-200/80  text-blue-700 font-semibold rounded shadow-md`}
                >
                  Clear
                </button>
              )}
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="cursor-pointer px-6 py-2 bg-gray-200/80 hover:bg-gray-400 text-blue-700 font-semibold rounded shadow-md"
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
                  disabled={loader || !propertyId}
                  className="cursor-pointer ml-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white py-2 px-6 font-semibold shadow-sm tracking-tight rounded"
                >
                  {loader ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="text-center animate-fade-in flex flex-col items-center h-full md:my-auto mt-[2vh] justify-center w-full p-4 rounded-lg"
            style={{
              background: "radial-gradient(circle at center, #E2E8F0, #CBD5E1)",
            }}
          >
            <div className="my-auto flex-1 px-4 py-10 rounded-sm bg-opacity-10">
              <div
                className="w-20 h-20 mb-5 mx-auto rounded-full p-3 flex items-center justify-center border border-orange-500 shadow-md"
                style={{
                  background: "linear-gradient(135deg, #ff9800, #ef6c00)", // vibrant orange gradient
                }}
              >
                <IoCheckmarkOutline className="text-white w-20 h-20 mx-auto my-1" />
              </div>

              <h3 className="text-2xl font-semibold text-slate-700 text-center tracking-tighter leading-5 mb-3">
                Vehicle Check-In Successful
              </h3>
              <p className="text-slate-600 mt-2 mb-6 leading-5 mx-2">
                Your vehicle has been checked in and is being parked. Relax and
                enjoy your visit — we’ve got it from here.
              </p>
              <button
                onClick={handleSubmitAnother}
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-3 rounded-md transition-colors tracking-tight flex gap-2 items-center justify-center shadow-md w-full cursor-pointer"
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
