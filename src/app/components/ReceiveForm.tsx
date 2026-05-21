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
import VehiclePhotoCapture from "./VehiclePhotoCapture";
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isPhoneLookupLoading, setIsPhoneLookupLoading] = useState(false);
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
          v?.make === form?.make &&
          v?.model === form?.model &&
          v?.type === form?.type &&
          v?.color === form?.color &&
          v?.licensePlate === form?.licensePlate
      );
      if (!isExisting) {
        const newVehicle: Vehicle = {
          id: "",
          make: form?.make || "",
          model: form?.model || "",
          type: form?.type || "",
          color: form?.color || "",
          licensePlate: form?.licensePlate || "",
        };
        setExistingVehicles((prev) => [...prev, newVehicle]);
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
        step === 3 ? "pt-2" : "py-4"
      } mb-2`}
    >
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4 transition-opacity duration-500 ease-in-out animate-fade-in min-h-full">
        {!submitted ? (
          <div>
            {/* Stepper Header */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      s < step ? "bg-blue-600 text-white" :
                      s === step ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {s < step ? <IoCheckmarkOutline className="w-4 h-4" /> : s}
                    </div>
                    {s < 3 && <div className={`w-8 h-0.5 ${s < step ? "bg-blue-600" : "bg-gray-200"}`} />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Step {step} / 3 &middot; Complete all required fields to park in{" "}
                {propertyName ? (
                  propertyName
                ) : (
                  <span className="italic">[ designated property ]</span>
                )}
              </p>
            </div>

            <form>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Guest Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    isLoading={isPhoneLookupLoading}
                    onAreaCodeChange={(e) =>
                      setForm((prev) => ({ ...prev, areaCode: e.target.value }))
                    }
                    onPhoneNumberChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "");
                      if (rawValue?.length > 10) return;
                      const formatted = formatPhoneNumber(rawValue);
                      setForm((prev) => ({ ...prev, phoneNumber: formatted }));
                      if (rawValue.length === 10)
                        fetchUserDataByPhone(
                          form?.areaCode || "+1",
                          rawValue,
                          setForm,
                          setExistingVehicles,
                          carBrands,
                          vehicleTypes,
                          vehicleColors,
                          setModels,
                          setIsPhoneLookupLoading
                        );
                    }}
                    onClear={() => {
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: "",
                        firstName: "",
                        lastName: "",
                        patronId: "",
                        placeToVisit: "",
                      }));
                      setExistingVehicles([]);
                    }}
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
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Vehicle Information</h3>
                  {/* Vehicle form (available for new vehicle entry) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Vehicle photo capture — outside form to isolate from CarVector's absolute positioning context */}
            {step === 3 && (
              <div className="w-full mt-3 px-1">
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 text-center mb-2">
                    — or capture photos instead —
                  </p>
                  <VehiclePhotoCapture
                    photos={photos}
                    onPhotoUrlsChange={setPhotos}
                  />
                </div>
              </div>
            )}

            {/*  Buttons  */}
            <div className="flex gap-3 pt-2">
              {step === 1 && (
                <button
                  type="button"
                  disabled={!isFormChanged}
                  onClick={() => handleClearForm(true)}
                  className={`flex-1 h-11 bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors text-sm ${
                    isFormChanged ? "cursor-pointer hover:bg-gray-200" : "opacity-60"
                  }`}
                >
                  Clear
                </button>
              )}

              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
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
                      driverViewLabelsMap,
                      photos,
                      setPhotos
                    )
                  }
                  type="button"
                  disabled={loader || !propertyId}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
                >
                  {loader ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center animate-fade-in flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoCheckmarkOutline className="text-emerald-500 w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vehicle Check-In Successful
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Your vehicle has been checked in and is being parked. Relax and
              enjoy your visit.
            </p>
            <button
              onClick={handleSubmitAnother}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2 cursor-pointer"
            >
              <CiRedo className="w-4 h-4" />
              Submit Another Vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
