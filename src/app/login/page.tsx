"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter both email and password.",
      });
      return;
    }

    setLoading(true);

    try {
      // Mock login logic — replace with actual auth call
      await new Promise((res) => setTimeout(res, 1000));
      Swal.fire({
        icon: "success",
        title: "Welcome!",
        text: "Login successful.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 space-y-6 animate-fade-in transition-opacity duration-500">
        <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">
          Sign In
        </h2>
        <p className="text-sm text-gray-500 text-center">
          Enter your credentials to continue
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border-b border-gray-300 px-3 py-2 text-sm placeholder-gray-700 tracking-tight focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Add Sign Up Link */}
        <p className="text-xs text-gray-500 text-center mt-1 mb-2">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>

        <button
          onClick={handleLogin}
          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white w-full py-3 font-semibold rounded shadow-md transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Forgot your password?{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Reset it
          </a>
        </p>
      </div>
    </div>
  );
}
