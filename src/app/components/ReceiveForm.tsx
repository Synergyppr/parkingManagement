"use client";

import { useState } from "react";
import { Vehicle, DropdownOption, CarBrand } from "../types";
import { v4 as uuidv4 } from "uuid";

interface ReceiveFormProps {
  carBrands: CarBrand[];
  vehicleTypes: DropdownOption[];
  vehicleColors: DropdownOption[];
}

export default function ReceiveForm({
  carBrands,
  vehicleTypes,
  vehicleColors,
}: ReceiveFormProps) {
  const [form, setForm] = useState<Partial<Vehicle>>({});
  const [models, setModels] = useState<DropdownOption[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "make") {
      const selectedBrand = carBrands.find((b) => b.name === value);
      setModels(selectedBrand ? selectedBrand.models : []);
    }
  };

  const generateTicketNumber = () => {
    const generated = uuidv4();
    setForm((prev) => ({ ...prev, ticketNumber: generated }));
  };

const handleSubmit = async () => {
  if (
    !form.ticketNumber ||
    !form.phoneNumber ||
    !form.firstName ||
    !form.lastName ||
    !form.make ||
    !form.model ||
    !form.type ||
    !form.color ||
    !form.pin ||
    !form.placeToVisit
  ) {
    alert("Please fill all required fields");
    return;
  }

  console.log("Form data before sending:", form);
  // This is the exact object structure your backend expects
  const sendForm = {
    ticketId: form.ticketNumber,
    appUserId: "", // 👈 Need guidance
    propertyId: "be93637a-fc6e-4477-79f6-08dd93acf26b", // 👈 Hardcoded or pass dynamically
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.phoneNumber, // 👈 Need clarification if correct or another field needed
    makeId: parseInt(form.make || "0"), // 👈 Ensure form.make is an ID
    modelId: parseInt(form.model || "0"), // 👈 Ensure form.model is an ID
    typeId: parseInt(form.type || "0"), // 👈 Ensure form.type is an ID
    colorId: parseInt(form.color || "0"), // 👈 Ensure form.color is an ID
    licensePlate: "", // 👈 Not currently in form, please clarify
    destination: form.placeToVisit,
    rate: "", // 👈 Need guidance
    status: "parked", // 👈 Default as specified
  };

  console.log("Prepared payload:", sendForm);

  const res = await fetch("/api/vehicleCheckIn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sendForm }),
  });

  const result = await res.json();
  console.log("API response:", result);
};

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-3 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-700">Receive a Vehicle</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="phoneNumber"
          placeholder="Phone Number"
          onChange={handleChange}
          className="input"
        />
        <input
          name="firstName"
          placeholder="First Name"
          onChange={handleChange}
          className="input"
        />
        <input
          name="lastName"
          placeholder="Last Name"
          onChange={handleChange}
          className="input"
        />

        <div className="flex gap-2 items-center">
          <input
            name="ticketNumber"
            placeholder="Ticket Number"
            value={form.ticketNumber || ""}
            onChange={handleChange}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={generateTicketNumber}
            className="bg-gray-200 hover:bg-gray-300 rounded-md px-3 py-2 text-sm shadow-sm"
          >
            Auto
          </button>
        </div>

        <input
          name="placeToVisit"
          placeholder="Place to Visit"
          onChange={handleChange}
          className="input"
        />

        <select name="make" onChange={handleChange} className="input">
          <option value="">Select Make</option>
          {carBrands?.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>

        <select name="model" onChange={handleChange} className="input">
          <option value="">Select Model</option>
          {models?.map((model) => (
            <option key={model.id} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>

        <select name="type" onChange={handleChange} className="input">
          <option value="">Select Type</option>
          {vehicleTypes?.map((type) => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>

        <select name="color" onChange={handleChange} className="input">
          <option value="">Select Color</option>
          {vehicleColors?.map((color) => (
            <option key={color.id} value={color.name}>
              {color.name}
            </option>
          ))}
        </select>

        <input
          name="pin"
          placeholder="PIN"
          type="password"
          onChange={handleChange}
          className="input"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 transition-colors text-white p-3 w-full rounded-md font-semibold shadow-md"
      >
        Submit
      </button>
    </div>
  );
}
