"use client";
import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import { FaUser, FaTicketAlt, FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { BiSolidSprayCan } from "react-icons/bi";
import { MdPin, MdPassword, MdLocationPin } from "react-icons/md";
import { IoCheckmarkOutline } from "react-icons/io5";
import { CiRedo } from "react-icons/ci";

import { Ticket, DropdownOption, CarPart, Vehicle } from "../types";
import { ReceiveFormProps } from "../types/pagesProps";
import { useProperty } from "../context/PropertyContext";
import { formatPhoneNumber } from "../lib/clientUtils";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";

import CarVector from "./CarVector";
import FormInput from "./elements/FormInput";
import PhoneInputWithAreaCode from "./elements/PhoneInputWithAreaCode";
import VehicleList from "./VehicleList";
import ParkingLot from "./ParkingMap";
import {
  fetchUserDataByPhone,
  generateTicketNumber,
  handleParkVehicle,
} from "../helpers/receiveFormHelpers";

const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

export default function ReceiveForm({
  carBrands, // make and model data
  vehicleTypes, // type data
  vehicleColors, // color data
  form,
  setForm,
  // initialForm,
  setInitialForm,
  isFormChanged,
  shouldBypassUnloadPromptRef,
  patronId,
  setHasUnsavedChanges,
  setReloadPageData,
}: ReceiveFormProps) {
  const router = useRouter();
  const { propertyId, propertyName, locationMode, latitude, longitude } =
    useProperty();
  const saveClickedRef = useRef(false);
  const [step, setStep] = useState<number>(1);
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [loader, setLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [noIncident, setNoIncident] = useState(false);
  const [incidentParts, setIncidentParts] = useState<CarPart[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [existingVehicles, setExistingVehicles] = useState<Vehicle[]>([]);
  const [showExistingVehicles, setShowExistingVehicles] =
    useState<boolean>(true);
  const [, setSelectedVehicleIndex] = useState<number | null>(null); // Check if being used
  // const [manageModeOn, setManageModeOn] = useState<boolean>(false); // To manage and delete vehicles from the existing vehicles list
  const [, setManageVehicleSettings] = useState({
    patronId: form?.patronId || "",
    vehicles: [
      {
        id: null as string | null,
        makeId: 0,
        modelId: 0,
        typeId: 0,
        colorId: 0,
        licensePlate: "",
      },
    ],
    deletes: [],
  }); // Commented out code related to vehicle management for now

  useEffect(() => {
    generateTicketNumber({ setForm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: Partial<Ticket>) => ({ ...prev, [name]: value }));

    if (name === "make") {
      const selectedBrand = carBrands?.find((b) => b?.id === parseInt(value));
      setModels(selectedBrand ? selectedBrand.models : []);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle, index: number) => {
    setSelectedVehicleIndex(index);

    const filled: Partial<Ticket> = {
      ...form,
      areaCode: form?.areaCode || "+1",
      firstName: form?.firstName || "",
      lastName: form?.lastName || "",
      phoneNumber: form?.phoneNumber || "",
      placeToVisit: form?.placeToVisit || "",
      patronId: patronId || form?.patronId || "",
      make: vehicle?.make?.toString(),
      model: vehicle?.model?.toString(),
      type: vehicle?.type?.toString(),
      color: vehicle?.color?.toString(),
      licensePlate: vehicle?.licensePlate || "",
      damagedParts: vehicle?.damagedParts,
      pin: form?.pin || "",
    };

    setForm(filled);

    // update model dropdown if brand selected
    const selectedBrand = carBrands?.find(
      (b) => b?.id === parseInt(vehicle?.make)
    );
    if (selectedBrand) {
      setModels(selectedBrand?.models);
    }
  };

  const handleNext = () => {
    const missing: string[] = [];

    if (!form?.areaCode) {
      setForm((prev) => ({ ...prev, areaCode: "+1" }));
    }

    if (step === 1) {
      if (!form?.phoneNumber) missing.push("phoneNumber");
      if (!form?.ticketNumber) missing.push("ticketNumber");
      const rawPhone = (form?.phoneNumber || "")?.replace(/\D/g, "");
      if (rawPhone && rawPhone?.length < 10) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Phone Number",
          text: "Please enter a valid phone number with at least 10 digits.",
        });
        return;
      }
      if (form?.ticketNumber && form?.ticketNumber!.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Ticket Number",
          text: "Ticket number must be 6 alphanumeric characters.",
        });
        return;
      }
    } else if (step === 2) {
      if (!form?.make) missing.push("make");
      if (!form?.model) missing.push("model");
      if (!form?.type) missing.push("type");
      if (!form?.color) missing.push("color");
      if (!form?.pin) missing.push("pin");
    }

    if (step === 2) {
      // Check if the vehicle entered in the form already exists in existingVehicles, if not, add it
      const isExisting = existingVehicles?.some(
        (v) =>
          v.make === form?.make &&
          v.model === form?.model &&
          v.type === form?.type &&
          v.color === form?.color &&
          v.licensePlate === form?.licensePlate
      );
      if (!isExisting) {
        // const newVehicle = {
        //   id: 0,
        //   make: form?.make,
        //   model: form?.model,
        //   type: form?.type,
        //   color: form?.color,
        //   licensePlate: form?.licensePlate || "",
        //   pin: form?.pin || "",
        // };
        // setExistingVehicles((prev) => [...prev, newVehicle]);
      }

      const sendForm = {
        vehicles: [
          {
            id: "",
            makeId: form?.make ? parseInt(form?.make) : 0,
            modelId: form?.model ? parseInt(form?.model) : 0,
            typeId: form?.type ? parseInt(form?.type) : 0,
            colorId: form?.color ? parseInt(form?.color) : 0,
            licensePlate: form?.licensePlate || "",
          },
        ],
      };

      setManageVehicleSettings((prev) => ({
        ...prev,
        ...sendForm,
      }));
      // fetchManageVehicles(sendForm);
    }

    if (missing?.length > 0) {
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
    handleClearForm(false);
    generateTicketNumber({ setForm });
  };

  const handleClearForm = (submitted: boolean) => {
    const clearFields = () => {
      setStep(1);
      setForm({});
      setIncidentParts([]);
      setDescriptions({});
      setInitialForm({});
      setExistingVehicles([]);
      setDescriptions({});
      setNoIncident(false);
      setModels([]);
    };

    if (submitted === false) {
      clearFields();
      return;
    }

    Swal.fire({
      title: "Clear Form",
      text: "Are you sure you want to clear the form?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "No, keep it",
    }).then((result) => {
      if (result.isConfirmed) {
        clearFields();
      }
    });
  };

  return (
    <div
      className={`${
        step === 3 ? "pt-2" : "py-4 lg:mt-[5%] md:py-16 sm:py-4 xs:py-4"
      } border-none rounded-lg  mb-2`}
    >
      <div className="p-2 sm:p-4 md:p-6 max-w-3xl mx-auto space-y-6 transition-opacity duration-500 ease-in-out animate-fade-in min-h-full">
        {!submitted ? (
          <div>
            <div
              className={`${
                step !== 4 ? "lg:mb-10" : "mb-4"
              }  relative lg:bottom-4`}
            >
              <h2 className="text-[23px] font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight text-center mb-1">
                Vehicle Receipt Form
              </h2>
              {step < 5 && (
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
                  step < 3 ? "mb-6" : step === 4 ? "mb-0" : "mb-16"
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
                  <PhoneInputWithAreaCode
                    areaCode={form?.areaCode || ""}
                    phoneNumber={form?.phoneNumber || ""}
                    onAreaCodeChange={(e) =>
                      setForm((prev) => ({ ...prev, areaCode: e.target.value }))
                    }
                    onPhoneNumberChange={(e) => {
                      // Limit to 10 digits
                      const rawValue = e.target.value.replace(/\D/g, "");
                      if (rawValue?.length > 10) return;
                      const formatted = formatPhoneNumber(rawValue);
                      setForm((prev) => ({ ...prev, phoneNumber: formatted }));
                      if (rawValue.length >= 10)
                        fetchUserDataByPhone(
                          rawValue,
                          form,
                          setForm,
                          setExistingVehicles
                        );
                    }}
                    onClear={() =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: "",
                      }))
                    }
                    missing={missingFields?.includes("phoneNumber")}
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
                    value={form?.placeToVisit || ""}
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
                <div className="space-y-6">
                  {/* Vehicle form (available for new vehicle entry) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="make"
                      value={form?.make || ""}
                      onChange={handleChange}
                      icon={<FaCar />}
                      type="select"
                      options={carBrands}
                      missing={missingFields.includes("make")}
                    />
                    <FormInput
                      name="model"
                      value={form?.model || ""}
                      onChange={handleChange}
                      icon={<FaCarRear />}
                      type="select"
                      options={models}
                      missing={missingFields.includes("model")}
                    />
                    <FormInput
                      name="type"
                      value={form?.type || ""}
                      onChange={handleChange}
                      icon={<PiCarProfileFill />}
                      type="select"
                      options={vehicleTypes}
                      missing={missingFields.includes("type")}
                    />
                    <FormInput
                      name="color"
                      value={form?.color || ""}
                      onChange={handleChange}
                      icon={<BiSolidSprayCan />}
                      type="select"
                      options={vehicleColors}
                      missing={missingFields.includes("color")}
                    />
                    <FormInput
                      name="licensePlate"
                      placeholder="License Plate"
                      icon={<MdPin />}
                      onChange={handleChange}
                      value={form?.licensePlate || ""}
                      onClear={() =>
                        setForm((prev) => ({ ...prev, licensePlate: "" }))
                      }
                    />
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
                      onClear={() => setForm((prev) => ({ ...prev, pin: "" }))}
                    />
                  </div>

                  {/* Existing vehicles list */}
                  {existingVehicles?.length > 0 && (
                    <VehicleList
                      existingVehicles={existingVehicles}
                      vehicleColors={vehicleColors}
                      vehicleTypes={vehicleTypes}
                      carBrands={carBrands}
                      form={form}
                      showExistingVehicles={showExistingVehicles}
                      setShowExistingVehicles={setShowExistingVehicles}
                      handleSelectVehicle={handleSelectVehicle}
                    />
                  )}
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
                    damagedParts={form?.damagedParts}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                  />
                </div>
              )}

              {step === 4 && <ParkingLot />}
            </form>

            {/*  Buttons  */}
            <div
              className={`${step === 3 ? "mt-4" : "mt-2"} flex justify-between`}
            >
              {step === 1 && (
                <button
                  type="button"
                  disabled={!isFormChanged}
                  onClick={() => handleClearForm(true)}
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
                  onClick={(e) =>
                    handleParkVehicle(
                      e,
                      form,
                      setForm,
                      incidentParts,
                      descriptions,
                      noIncident,
                      setLoader,
                      locationMode,
                      latitude as number,
                      longitude as number,
                      propertyId,
                      setReloadPageData,
                      router,
                      setSubmitted,
                      setInitialForm,
                      setIncidentParts,
                      setDescriptions,
                      frontViewLabelsMap,
                      rearViewLabelsMap,
                      passengerViewLabelsMap,
                      driverViewLabelsMap
                    )
                  }
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
            {/* After Submission */}
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
