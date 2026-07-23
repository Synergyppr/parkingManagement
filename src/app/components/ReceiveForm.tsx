"use client";
import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import { FaUser, FaTicketAlt, FaCar } from "react-icons/fa";
import { FaCarRear } from "react-icons/fa6";
import { PiCarProfileFill } from "react-icons/pi";
import { BiSolidSprayCan } from "react-icons/bi";
import { MdPin, MdPassword, MdLocationPin } from "react-icons/md";
import { IoCheckmarkOutline, IoImagesOutline } from "react-icons/io5";
import { CiRedo } from "react-icons/ci";

import {
  Ticket,
  DropdownOption,
  CarPart,
  Vehicle,
  VehiclePhoto,
} from "../types";
import { ReceiveFormProps } from "../types/pagesProps";
import { useProperty } from "../context/PropertyContext";
import { formatPhoneNumber } from "../lib/clientUtils";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import {
  fetchUserDataByPhone,
  generateTicketNumber,
  handleParkVehicle,
} from "../helpers/receiveFormHelpers";

import CarVector from "./CarVector";
import VehiclePhotoCapture from "./VehiclePhotoCapture";
import FormInput from "./elements/FormInput";
import PhoneInputWithAreaCode from "./elements/PhoneInputWithAreaCode";
import VehicleList from "./VehicleList";

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
  parkedTickets,
}: ReceiveFormProps) {
  const router = useRouter();
  const { propertyId, locationMode, latitude, longitude } = useProperty();
  const saveClickedRef = useRef(false);
  const [step, setStep] = useState<number>(1);
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [loader, setLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [noIncident, setNoIncident] = useState(true);
  const [incidentParts, setIncidentParts] = useState<CarPart[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isPhoneLookupLoading, setIsPhoneLookupLoading] = useState(false);
  const [existingVehicles, setExistingVehicles] = useState<Vehicle[]>([]);
  const [showExistingVehicles, setShowExistingVehicles] =
    useState<boolean>(true);
  const [, setSelectedVehicleIndex] = useState<number | null>(null); // Check if being used
  const [selectedVehiclePhotos, setSelectedVehiclePhotos] = useState<
    VehiclePhoto[]
  >([]);
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
    setSelectedVehiclePhotos(vehicle?.photos || []);

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
      // if (!form?.pin) missing.push("pin");
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
      setSelectedVehiclePhotos([]);
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

  const handleBack = async () => {
    if (photos.length > 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Discard pictures?",
        text: "Going back will remove the pictures you took with your camera.",
        showCancelButton: true,
        confirmButtonText: "Discard pictures",
        cancelButtonText: "Stay here",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
        focusCancel: true,
      });

      if (!result.isConfirmed) {
        return;
      }

      // Clear the photos only after confirming discard.
      setPhotos([]);
    }

    setStep((currentStep) => Math.max(1, currentStep - 1));
  };

  return (
    <div
      className={`mb-2 ${
        step === 3 ? "overflow-visible px-2 py-2 sm:px-4" : "py-6"
      }`}
    >
      <div
        className={`mx-auto w-full ${
          step === 3 ? "max-w-6xl overflow-visible" : "max-w-5xl px-4"
        }`}
      >
        {!submitted ? (
          <div className="animate-fade-in">
            {/* Header */}
            <div
              className={`text-center transition-all ${
                step === 3 ? "mb-3" : "mb-8"
              }`}
            >
              {step !== 3 && (
                <>
                  <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-5 py-1 text-[10px] font-semibold text-primary shadow-sm">
                    Guest Intake Phase
                  </span>

                  <h1 className="mt-3 font-serif text-3xl font-bold text-slate-900 md:text-4xl">
                    New Check-in Session
                  </h1>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Please initialize the valet session by providing the
                    guest&apos;s primary identification and visit details.
                  </p>
                </>
              )}

              {step === 3 && (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px max-w-24 flex-1 bg-slate-200" />

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      Vehicle Inspection
                    </p>

                    <h1 className="mt-0.5 font-serif text-lg font-bold text-slate-900 sm:text-xl">
                      Review Vehicle Condition
                    </h1>
                  </div>

                  <div className="h-px max-w-24 flex-1 bg-slate-200" />
                </div>
              )}
            </div>

            <div
              className={`relative rounded-4xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl ${
                step === 3
                  ? "overflow-visible px-2 py-3 sm:px-4 sm:py-4"
                  : "overflow-hidden px-5 py-8 md:px-10"
              }`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-(--primary-soft) -z-1" />
              {/* Stepper */}
              <div
                className={`z-10 flex items-center justify-center ${
                  step === 3 ? "mb-3 gap-2 sm:gap-4" : "mb-10 gap-4 md:gap-0"
                }`}
              >
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-sm shadow-md transition-all ${
                          s < step
                            ? "bg-primary text-slate-400"
                            : s === step
                            ? "bg-primary text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                            : "bg-white text-slate-300 ring-1 ring-slate-200"
                        }`}
                      >
                        {s < step ? (
                          <IoCheckmarkOutline className="h-5 w-5" />
                        ) : s === 1 ? (
                          <FaUser />
                        ) : s === 2 ? (
                          <FaCar />
                        ) : (
                          <IoCheckmarkOutline className="h-5 w-5" />
                        )}
                      </div>

                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-700">
                        {s === 1
                          ? "Guest Info"
                          : s === 2
                          ? "Vehicle Details"
                          : "Confirmation"}
                      </span>
                    </div>

                    {s < 3 && (
                      <div
                        className={`mx-5 hidden h-px w-20 md:block ${
                          s < step ? "bg-primary" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <form className="h-full overflow-y-visible">
                {step === 1 && (
                  <div className="space-y-9">
                    <section>
                      <h3 className="mb-5 border-l-4 border-primary pl-3 font-serif text-lg font-bold text-slate-900">
                        Basic Information
                      </h3>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

                        <PhoneInputWithAreaCode
                          areaCode={form?.areaCode || ""}
                          phoneNumber={form?.phoneNumber || ""}
                          isLoading={isPhoneLookupLoading}
                          onAreaCodeChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              areaCode: e.target.value,
                            }))
                          }
                          onPhoneNumberChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, "");
                            if (rawValue?.length > 10) return;
                            const formatted = formatPhoneNumber(rawValue);
                            setForm((prev) => ({
                              ...prev,
                              phoneNumber: formatted,
                            }));
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
                                setIsPhoneLookupLoading,
                                setSelectedVehiclePhotos
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
                            setSelectedVehiclePhotos([]);
                          }}
                          missing={missingFields?.includes("phoneNumber")}
                        />

                        <FormInput
                          name="firstName"
                          placeholder="First Name"
                          icon={<FaUser />}
                          value={form.firstName || ""}
                          onChange={handleChange}
                          onClear={() =>
                            setForm((prev) => ({ ...prev, firstName: "" }))
                          }
                        />

                        <FormInput
                          name="lastName"
                          placeholder="Last Name"
                          icon={<FaUser />}
                          value={form?.lastName || ""}
                          onChange={handleChange}
                          onClear={() =>
                            setForm((prev) => ({ ...prev, lastName: "" }))
                          }
                        />
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-5 border-l-4 border-primary pl-3 font-serif text-lg font-bold text-slate-900">
                        Visit Logistics
                      </h3>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormInput
                          name="placeToVisit"
                          placeholder="Destination / Venue"
                          icon={<MdLocationPin />}
                          onChange={handleChange}
                          value={form?.placeToVisit || ""}
                          onClear={() =>
                            setForm((prev) => ({ ...prev, placeToVisit: "" }))
                          }
                        />

                        {/* <FormInput
                          name="pin"
                          type="text"
                          inputMode="numeric"
                          placeholder="Expected Return / PIN"
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
                          showPasswordToggle
                          showPassword={showPin}
                          setShowPassword={setShowPin}
                          onClear={() =>
                            setForm((prev) => ({ ...prev, pin: "" }))
                          }
                        /> */}
                      </div>
                    </section>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h3 className="mb-5 border-l-4 border-primary pl-3 font-serif text-lg font-bold text-slate-900">
                      Vehicle Details
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                    </div>

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
                  <div className="flex flex-col gap-2 mb-10">
                    <div className="w-fulloverflow-y-visible flex justify-center relative bottom-0 min-h-full pb-10">
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
                        shouldBypassUnloadPromptRef={
                          shouldBypassUnloadPromptRef
                        }
                        isFormChanged={isFormChanged}
                        damagedParts={form?.damagedParts}
                        setHasUnsavedChanges={setHasUnsavedChanges}
                      />
                    </div>
                    <div className="relative bottom-6">
                      <FormInput
                        name="pin"
                        type="password"
                        // inputMode="numeric"
                        placeholder="Expected Return / PIN"
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
                        showPasswordToggle
                        showPassword={showPin}
                        setShowPassword={setShowPin}
                        onClear={() =>
                          setForm((prev) => ({ ...prev, pin: "" }))
                        }
                      />
                    </div>
                  </div>
                )}
              </form>

              {/* Vehicle photo capture — outside form to isolate from CarVector's absolute positioning context */}
              {step === 3 && (
                <div className="w-full mt-3 px-1">
                  {/* Existing vehicle photos from previous visits */}
                  {selectedVehiclePhotos.length > 0 && (
                    <div className="border border-gray-200 rounded-xl bg-gray-50 p-3 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <IoImagesOutline className="text-primary text-lg" />
                        <span className="text-sm font-medium text-gray-700">
                          Previous Photos
                        </span>
                        <span className="bg-(--primary-soft) text-primary text-xs rounded-full px-1.5 py-0.5 font-semibold">
                          {selectedVehiclePhotos.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {selectedVehiclePhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative rounded-lg overflow-hidden aspect-video bg-black border border-gray-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.url}
                              alt="Previous vehicle photo"
                              className="w-full h-full object-cover"
                            />
                            {photo.createdDateTime && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                                <p className="text-white text-[9px] truncate">
                                  {new Date(
                                    photo.createdDateTime
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      {selectedVehiclePhotos.length > 0
                        ? "— take new photos if needed —"
                        : "— or capture photos instead —"}
                    </p>
                    <VehiclePhotoCapture
                      photos={photos}
                      onPhotoUrlsChange={setPhotos}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons  */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={step === 1 && !isFormChanged}
                    onClick={() =>
                      step === 1 ? handleClearForm(true) : handleBack()
                    }
                    className="md:h-12 h-14 rounded-2xl px-6 text-sm font-semibold text-slate-600 transition hover:bg-primary/50 disabled:opacity-50 
                    cursor-pointer border border-primary/50"
                  >
                    {step === 1 ? "Reset Form" : "Back"}
                  </button>

                  <div className="flex gap-3 md:justify-between justify-center">
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="md:h-12 h-14 rounded-2xl bg-primary px-8 text-sm font-extrabold text-white shadow-sm transition hover:bg-secondary
                        cursor-pointer disabled:opacity-50 mx-auto w-full"
                      >
                        Confirm & Proceed
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={loader || !propertyId}
                        onClick={(e) => {
                          const normalizedPlate = (form?.licensePlate || "")
                            .trim()
                            .toLowerCase();
                          const normalizedFirstName = (form?.firstName || "")
                            .trim()
                            .toLowerCase();
                          const normalizedLastName = (form?.lastName || "")
                            .trim()
                            .toLowerCase();

                          if (normalizedPlate) {
                            const duplicate = parkedTickets?.find(
                              (t) =>
                                t?.status === "parked" &&
                                (
                                  t?.licensePlate ||
                                  t?.vehicles?.licensePlate ||
                                  ""
                                )
                                  .trim()
                                  .toLowerCase() === normalizedPlate &&
                                (t?.firstName || "").trim().toLowerCase() ===
                                  normalizedFirstName &&
                                (t?.lastName || "").trim().toLowerCase() ===
                                  normalizedLastName
                            );

                            if (duplicate) {
                              Swal.fire({
                                icon: "warning",
                                title: "Duplicate Vehicle",
                                text: `A vehicle with plate "${form?.licensePlate}" owned by ${form?.firstName} ${form?.lastName} is already parked (Ticket #${duplicate?.ticketNumber}). You cannot park the same vehicle twice.`,
                              });
                              return;
                            }
                          }

                          if (!form?.pin) {
                            Swal.fire({
                              icon: "error",
                              title: "Error",
                              text: "Please enter the employee pin to park the customer vehicle.",
                            });
                          }

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
                          );
                        }}
                        className="h-12 rounded-2xl bg-primary px-8 text-sm font-extrabold text-white shadow-sm transition hover:bg-secondary 
                        disabled:opacity-60 cursor-pointer w-full"
                      >
                        {loader ? "Submitting..." : "Submit"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center animate-fade-in flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <IoCheckmarkOutline className="text-primary w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vehicle Check-In Successful
            </h3>

            <button
              onClick={handleSubmitAnother}
              className="h-11 px-6 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2 cursor-pointer"
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
