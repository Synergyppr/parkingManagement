"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { Vehicle, DropdownOption, CarBrand } from "../types";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { GoCheckCircleFill } from "react-icons/go";
import { CiRedo } from "react-icons/ci";

interface ReceiveFormProps {
  carBrands: CarBrand[];
  vehicleTypes: DropdownOption[];
  vehicleColors: DropdownOption[];
  fetchData: () => void;
}

export default function ReceiveForm({
  carBrands,
  vehicleTypes,
  vehicleColors,
  fetchData,
}: ReceiveFormProps) {
  const [form, setForm] = useState<Partial<Vehicle>>({});
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [loader, setLoader] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "make") {
      const selectedBrand = carBrands.find((b) => b.id === parseInt(value));
      setModels(selectedBrand ? selectedBrand.models : []);
    }
  };

  const generateTicketNumber = () => {
    const randomSixDigit = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    setForm((prev) => ({ ...prev, ticketNumber: randomSixDigit }));
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
        theme: "dark",
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoader(true);

    const rawPhone = (form?.phoneNumber || "").replace(/\D/g, ""); // Remove non-digit characters

    const sendForm = {
      propertyId: "be93637a-fc6e-4477-79f6-08dd93acf26b",
      firstName: form?.firstName,
      lastName: form?.lastName,
      phone: rawPhone,
      pin: form?.pin,
      makeId: parseInt(form?.make || "0"),
      modelId: parseInt(form?.model || "0"),
      typeId: parseInt(form?.type || "0"),
      colorId: parseInt(form?.color || "0"),
      licensePlate: "",
      ticketNumber: form?.ticketNumber || uuidv4().slice(0, 6),
      destination: form?.placeToVisit,
    };

    try {
      const res = await fetch("/api/vehicleCheckIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendForm }),
      });

      const result = await res.json();
      console.log("Response from API:", result);

      if (result?.status === "200") {
        await fetchData(); // refresh the data from the API

        Swal.fire({
          theme: "dark",
          icon: "success",
          title: "Success",
          text: "Vehicle checked in successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        setSubmitted(true);
        setForm({});
      } else {
        console.error("Error: Unexpected response:", result);
        Swal.fire({
          theme: "dark",
          icon: "error",
          title: "Submission Failed",
          text: result?.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        theme: "dark",
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoader(false);
    }
  };

  const fetchUserDataByPhone = async (phone: string) => {
    try {
      const res = await fetch(`/api/getVehicle/byPhone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      const preFill = data?.result?.data;

      if (preFill) {
        setForm((prev) => ({
          ...prev,
          phoneNumber: preFill?.phoneNumber,
          firstName: preFill?.firstName,
          lastName: preFill?.lastName,
          placeToVisit: preFill?.placeToVisit,
          make: preFill?.make?.toString(),
          model: preFill?.model?.toString(),
          type: preFill?.type?.toString(),
          color: preFill?.color?.toString(),
        }));

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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 transition-opacity duration-500 ease-in-out animate-fade-in min-h-full">
      {!submitted ? (
        <>
          <h2 className="text-[23px] font-bold text-gray-500 tracking-tight text-center mb-1">
            Vehicle Receipt Form
          </h2>
          <p className="text-xs font-light text-center">
            Please complete all fields below.
          </p>

          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="phoneNumber"
                placeholder="Phone Number"
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  let formatted = rawValue;

                  if (rawValue?.length <= 3) {
                    formatted = rawValue;
                  } else if (rawValue?.length <= 6) {
                    formatted = `(${rawValue?.slice(0, 3)}) ${rawValue?.slice(
                      3
                    )}`;
                  } else {
                    formatted = `(${rawValue?.slice(0, 3)}) ${rawValue?.slice(
                      3,
                      6
                    )}-${rawValue?.slice(6, 10)}`;
                  }

                  setForm((prev) => ({ ...prev, phoneNumber: formatted }));

                  // Trigger API call when 10 digits are entered
                  if (rawValue.length >= 10) {
                    fetchUserDataByPhone(rawValue);
                  }
                }}
                value={form?.phoneNumber || ""}
                maxLength={14}
                className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight"
                required
              />

              <input
                name="firstName"
                placeholder="First Name"
                onChange={handleChange}
                value={form?.firstName || ""}
                className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight"
                required
              />
              <input
                name="lastName"
                placeholder="Last Name"
                onChange={handleChange}
                value={form?.lastName || ""}
                className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight"
                required
              />

              <div className="flex gap-2 items-center">
                <input
                  name="ticketNumber"
                  placeholder="Ticket Number"
                  value={form?.ticketNumber || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z0-9]{0,6}$/.test(val)) {
                      setForm((prev) => ({ ...prev, ticketNumber: val }));
                    }
                  }}
                  className="w-full border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={generateTicketNumber}
                  className="bg-gray-700 hover:bg-gray-500 text-white rounded-md px-3 py-2 text-sm shadow-sm"
                >
                  Auto
                </button>
              </div>

              <input
                name="placeToVisit"
                placeholder="Place to Visit"
                onChange={handleChange}
                value={form.placeToVisit || ""}
                className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight"
                required
              />

              <select
                name="make"
                onChange={handleChange}
                className="border-b border-gray-500 px-2 py-2 text-sm text-gray-300 placeholder-gray-700"
                value={form.make || ""}
              >
                <option value="">Select Make</option>
                {carBrands?.map((brand) => (
                  <option key={brand?.id} value={brand?.id}>
                    {brand?.name}
                  </option>
                ))}
              </select>

              <select
                name="model"
                onChange={handleChange}
                className="border-b border-gray-500 px-2 py-2 text-sm text-gray-300 placeholder-gray-700"
                value={form.model || ""}
              >
                <option value="">Select Model</option>
                {models?.map((model) => (
                  <option key={model?.id} value={model?.id}>
                    {model?.name}
                  </option>
                ))}
              </select>

              <select
                name="type"
                onChange={handleChange}
                className="border-b border-gray-500 px-2 py-2 text-sm text-gray-300 placeholder-gray-700"
                value={form.type || ""}
              >
                <option value="">Select Type</option>
                {vehicleTypes?.map((type) => (
                  <option key={type?.id} value={type?.id}>
                    {type?.name}
                  </option>
                ))}
              </select>

              <select
                name="color"
                onChange={handleChange}
                className="border-b border-gray-500 px-2 py-2 text-sm text-gray-300 placeholder-gray-700"
                value={form.color || ""}
              >
                <option value="">Select Color</option>
                {vehicleColors?.map((color) => (
                  <option key={color?.id} value={color?.id}>
                    {color?.name}
                  </option>
                ))}
              </select>

              <input
                name="licensePlate"
                placeholder="License Plate (optional)"
                type="text"
                onChange={handleChange}
                value={form?.licensePlate || ""}
                className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight"
              />

              <div className="relative w-full">
                <input
                  type={showPin ? "text" : "password"}
                  name="pin"
                  placeholder="PIN"
                  value={form?.pin || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d{0,4}$/.test(val)) {
                      setForm((prev) => ({ ...prev, pin: val }));
                    }
                  }}
                  className="border-b border-gray-500 px-2 py-2 pr-10 text-sm placeholder-gray-700 tracking-tight w-full"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="\d*"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                >
                  {showPin ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </form>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-colors text-white p-3 w-full font-semibold shadow-md tracking-tight rounded"
          >
            {loader ? "Submitting..." : "Submit"}
          </button>
        </>
      ) : (
        <div className="text-center animate-fade-in flex flex-col items-center h-full my-auto">
          <div className="my-auto flex-1 shadow-md px-4 py-10 rounded-sm mt-[9vh] bg-gray-800/70 bg-opacity-10">
            <div className="text-center mb-3">
              <GoCheckCircleFill className="w-20 h-20 mx-auto text-blue-700 border-1 border-solid rounded-full" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-blue-600 uppercase drop-shadow-[.5px_.5px_.5px_#2f68c4]">
              <span className="text-[28px]">S</span>ubmitted!
            </h2>
            <p className="text-gray-400 mt-2 mb-6 leading-5 mx-2">
              Your vehicle has been checked in and is being parked. Relax and
              enjoy your visit — we’ve got it from here.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-gray-800 hover:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors tracking-tight flex gap-2 items-center justify-center shadow-md w-full"
            >
              <CiRedo className="text-blue-500" />
              Submit Another Vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
