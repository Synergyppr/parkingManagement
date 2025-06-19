"use client";

import { useState, useEffect, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import FloatingLabelInput from "./elements/FloatingLabelInput";
import PageLoader from "./elements/PageLoader";
import { validateUser } from "../api/auth/userStoreApi";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter email, password, and property ID.",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await validateUser({
        username: email,
        password: password,
        propertyId: "A7E348D3-8DFB-4F71-8BC5-042BA75D53C7",
      });

      if (result === null) {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "Invalid credentials. Please try again.",
        });
        return;
      }

      if (!result) {
        throw new Error("Unexpected error occurred.");
      }

      localStorage.setItem("isLoggedIn", "true");

      // setTimeout(() => {
      //   Swal.fire({
      //     icon: "success",
      //     title: "Welcome!",
      //     text: "Login successful.",
      //     showConfirmButton: false,
      //     timer: 500,
      //   });
      // }, 200);

      setTimeout(() => {
        setRedirecting(true);
      }, 500);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <>
      {redirecting && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-70 z-50 flex items-center justify-center">
          <PageLoader />
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-xl p-8 space-y-4 animate-fade-in transition-opacity duration-500 relative z-10">
        <h2 className="text-3xl font-bold text-center tracking-tighter mb-1 bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
          Valet App Sign In
        </h2>

        <p className="text-sm text-gray-500 text-center">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <FloatingLabelInput
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e: { target: { value: SetStateAction<string> } }) =>
              setEmail(e.target.value)
            }
            maxLength={50}
          />
          <FloatingLabelInput
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e: { target: { value: SetStateAction<string> } }) =>
              setPassword(e.target.value)
            }
            maxLength={50}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white w-full py-3 font-semibold rounded shadow-md transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center">
          Forgot your password?{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Reset it
          </a>
        </p>
      </div>
    </>
  );
}
