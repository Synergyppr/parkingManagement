"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function SignUpPage() {
  const [form, setForm] = useState({
    userName: "",
    pin: "",
    firstName: "",
    lastName: "",
    gender: "",
    identifier: "",
    dateOfBirthDateTime: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const {
      userName,
      pin,
      firstName,
      lastName,
      gender,
      identifier,
      dateOfBirthDateTime,
    } = form;

    if (
      !userName ||
      !pin ||
      !firstName ||
      !lastName ||
      !gender ||
      !identifier ||
      !dateOfBirthDateTime
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoading(true);

    // const payload = {
    //   id: crypto.randomUUID(),
    //   tenantId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    //   role: 0,
    //   isActive: true,
    //   ...form,
    // };

    try {
      // Replace this with your real API request
      await new Promise((res) => setTimeout(res, 1000));

      Swal.fire({
        icon: "success",
        title: "Account Created",
        text: "You can now log in with your credentials.",
        showConfirmButton: false,
        timer: 1800,
      });

      setForm({
        userName: "",
        pin: "",
        firstName: "",
        lastName: "",
        gender: "",
        identifier: "",
        dateOfBirthDateTime: "",
      });
    } catch (error) {
      console.log("Error creating account:", error);
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 space-y-6 animate-fade-in transition-opacity duration-500">
        <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">
          Sign Up
        </h2>
        <p className="text-sm text-gray-500 text-center">
          Create your account to get started
        </p>

        <div className="space-y-4">
          <input
            name="userName"
            placeholder="Username"
            value={form.userName}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
          />
          <input
            name="pin"
            type="password"
            placeholder="PIN"
            value={form.pin}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
          />
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            {/* <option value="nonbinary">Non-binary</option> */}
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>

          <input
            name="identifier"
            placeholder="Identifier"
            value={form.identifier}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
          />

          <input
            name="dateOfBirthDateTime"
            type="date"
            value={form.dateOfBirthDateTime}
            onChange={handleChange}
            className="w-full border-b border-gray-300 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white w-full py-3 font-semibold rounded shadow-md transition-colors"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
