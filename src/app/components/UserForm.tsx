"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import { formatDateTimePicker } from "../lib/clientUtils";
import ButtonLoader from "./elements/ButtonLoader";

interface UserformDataProps {
  tenantId?: string;
  initialData?: Partial<UserformData> | null;
  onSubmit?: (data: UserformData) => void;
  setModalOpen: (isOpen: boolean) => void;
}

export interface UserformData {
  id?: string;
  tenantId: string;
  role: number;
  userName: string;
  pin: string;
  firstName: string;
  lastName: string;
  gender: string;
  identifier: string;
  dateOfBirthDateTime: string;
  isActive: boolean;
}

const UserformData = ({
  tenantId,
  initialData,
  setModalOpen,
}: UserformDataProps) => {
  const [formData, setFormData] = useState<UserformData>({
    id: initialData?.id || "",
    tenantId: initialData?.tenantId || "",
    role: initialData?.role ?? 0,
    userName: initialData?.userName || "",
    pin: initialData?.pin || "",
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    gender: initialData?.gender || "",
    identifier: initialData?.identifier || "",
    dateOfBirthDateTime: initialData?.dateOfBirthDateTime || "",
    isActive: initialData?.isActive ?? true,
  });
  const [showPin, setShowPin] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  useEffect(() => {
    // If dateOfBirthDateTime exists, format it to match the input type
    if (initialData?.dateOfBirthDateTime) {
      setFormData((prev) => ({
        ...prev,
        dateOfBirthDateTime: formatDateTimePicker(
          initialData?.dateOfBirthDateTime as string
        ),
      }));
    }
    // console.log("Initial Data:", initialData);
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Define the required fields for both creation and update
    const requiredFields: { [key: string]: string } = {
      userName: "Username",
      firstName: "First Name",
      lastName: "Last Name",
      gender: "Gender",
      dateOfBirthDateTime: "Date of Birth",
    };

    // If creating (no id), pin is also required
    if (!formData.id) {
      requiredFields["pin"] = "PIN";
    }

    // Check for any empty fields
    const missingFields = Object.entries(requiredFields).filter(
      ([key]) => !formData[key as keyof UserformData]
    );

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(([, label]) => label).join(", ");
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: `Please fill in the following required fields: ${fieldNames}`,
      });
      return;
    }

    setButtonLoader(true);

    const method = "POST";
    const endpoint = "/api/users/createAndUpdate";

    const payload = {
      id: formData?.id || null,
      tenantId: tenantId || "",
      role: formData?.role || 1,
      userName: formData?.userName?.trim(),
      pin: formData?.pin,
      firstName: formData?.firstName?.trim(),
      lastName: formData?.lastName?.trim(),
      gender: formData?.gender,
      identifier: formData?.identifier || "",
      dateOfBirthDateTime: formData?.dateOfBirthDateTime,
      isActive: formData?.isActive ?? true,
    };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result?.result?.status === "200") {
        setModalOpen(false);
        Swal.fire({
          icon: "success",
          title: `User ${formData.id ? "updated" : "created"} successfully!`,
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        console.error("Submission failed:", result?.result?.message);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: result?.result?.message || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "An error occurred",
        text: "Please try again later.",
      });
    } finally {
      setButtonLoader(false);
    }
  };

  const generatePIN = () => {
    // Generate a random 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData((prev) => ({ ...prev, pin }));
  };

  const toggleIsActive = () => {
    setFormData((prev) => ({ ...prev, isActive: !prev?.isActive }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-gray-800">
      <div className="flex gap-2 text-blue-500 items-center">
        <FaUser className="w-5 h-5" />
        <h2 className="text-xl font-semibold tracking-tight relative top-[2px]">
          {formData.id ? "Update User" : "Create User"}
        </h2>
      </div>

      <div>
        <input
          type="text"
          name="userName"
          placeholder="Username"
          value={formData?.userName}
          onChange={handleChange}
          className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
          required
        />
      </div>

      {!formData?.id && (
        <div className="relative w-full flex items-center gap-2">
          <div className="relative w-full">
            <input
              type={showPin ? "text" : "password"}
              name="pin"
              placeholder="PIN"
              value={formData?.pin}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,4}$/.test(val)) {
                  setFormData((prev) => ({ ...prev, pin: val }));
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
          <button
            type="button"
            onClick={generatePIN}
            className="bg-gray-700 hover:bg-gray-500 text-white rounded-md px-3 py-2 text-sm shadow-sm"
          >
            Auto
          </button>
        </div>
      )}

      <div>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        />
      </div>

      <div>
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        />
      </div>

      <div className="flex w-full gap-2">
        <div className="w-full">
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border-b border-gray-500 px-2 py-2 text-sm text-gray-800 placeholder-gray-400 w-full"
          >
            <option value="">Select Role</option>
            <option value={1}>Admin</option>
            <option value={2}>General</option>
          </select>
        </div>
        <div className="w-full">
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="border-b border-gray-500 px-2 py-2 text-sm text-gray-800 placeholder-gray-400 w-full"
          >
            <option value="">Select Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
      </div>

      <div>
        <input
          type="text"
          name="pin"
          placeholder="PIN (Reset)"
          value={formData.pin}
          onChange={handleChange}
          className="border-b border-gray-500 px-2 py-2 text-sm placeholder-gray-700 tracking-tight w-full"
        />
      </div>

      <div className="flex justify-between gap-1 mb-0">
        <div className="w-full">
          <input
            type="datetime-local"
            name="dateOfBirthDateTime"
            value={formData.dateOfBirthDateTime}
            onChange={handleChange}
            className="border-b border-gray-500 px-2 py-2 text-sm text-gray-800 placeholder-gray-400 w-full"
          />
        </div>

        {formData?.id && (
          <div className="w-full pt-3 px-0 relative bottom-6 md:bottom-4 gap-0 md:justify-end md:flex md:gap-1">
            <div className="tracking-tight text-[10px] md:text-sm text-gray-200 float-left md:float-none relative left-[-1px] md:left-0 md:top-2">
              {formData?.isActive ? "Active" : "Inactive"}
            </div>
            <div className="">
              <div
                className="relative flex items-center justify-between w-14 h-8 cursor-pointer"
                onClick={toggleIsActive}
              >
                <div
                  className={`absolute w-full h-full rounded-full transition-all duration-300 ${
                    formData.isActive ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
                <div
                  className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    formData.isActive
                      ? "translate-x-[28px]"
                      : "translate-x-[5px]"
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* {formData?.id && (
        <div className="w-full">
          <p
            className="text-blue-600 underline ml-1 relative bottom-1"
            onClick={handleResetPin}
          >
            Reset PIN
          </p>
        </div>
      )} */}

      <button
        type="submit"
        className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
          formData?.id ? "mt-[-20px] md:mt-[2px]" : "mt-2"
        }`}
      >
        {buttonLoader ? (
          <ButtonLoader />
        ) : formData?.id ? (
          "Update User"
        ) : (
          "Create User"
        )}
      </button>
    </form>
  );
};

export default UserformData;
