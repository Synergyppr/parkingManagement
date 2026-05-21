"use client";
import { useState, useEffect, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { validateUser } from "../auth/userStoreApi";
import { useProperty } from "../context/PropertyContext";
import { joinGroup } from "../lib/SignalRProvider";
import FloatingLabelInput from "./elements/FloatingLabelInput";
import PageLoader from "./elements/PageLoader";

export default function LoginForm() {
  const {
    setPropertyId,
    setPropertyName,
    latitude,
    longitude,
    setPredefinedProperties,
    requestLocation,
    locationMode,
    setLocationMode,
    setAccountUser,
    setUserRole,
  } = useProperty();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceType, setDeviceType] = useState("web");
  const [ipAddress, setIpAddress] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [showLocationToggle, setShowLocationToggle] = useState(false);

  useEffect(() => {
    const keysPressed: string[] = [];
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.push(e?.key?.toLowerCase());

      if (keysPressed.length > 3) {
        keysPressed.shift();
      }

      const isCtrlSyn =
        e.ctrlKey && keysPressed.join("") === "syn" && keysPressed.length === 3;

      if (isCtrlSyn) {
        setShowLocationToggle(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Request location if not already set
    if (!latitude || !longitude) {
      requestLocation();
    }
  }, [latitude, longitude, requestLocation]);

  useEffect(() => {
    // IP fetch
    const fetchIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error("Failed to fetch IP address:", error);
      }
    };

    // Device detection
    const detectDeviceType = () => {
      const ua = navigator.userAgent.toLowerCase();

      if (/mobile|android|iphone|ipod|blackberry|phone/.test(ua)) {
        return "mobile";
      } else if (/tablet|ipad/.test(ua)) {
        return "tablet";
      } else {
        return "desktop";
      }
    };

    fetchIpAddress();
    setDeviceType(detectDeviceType());
  }, []);

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      setRedirecting(true);
      router.replace("/dashboard");
    } else {
      setPageLoading(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter email and password.",
      });
      return;
    }

    setButtonLoading(true);

    const sentForm = {
      username: email,
      temporaryPassword: password,
      device: deviceType,
      location: ipAddress,
      latitude: locationMode === "live" ? Number(latitude) : 18.426434330459355, //250
      longitude:
        locationMode === "live" ? Number(longitude) : -66.05954507209249, //250
    };

    try {
      const result = await validateUser(sentForm);
      const json = JSON.stringify(sentForm, null, 2); // with indentation preserved

      setPredefinedProperties(result?.data?.properties || []);
      localStorage.setItem(
        "properties",
        JSON.stringify(result?.data?.properties || [])
      );
      // console.log("Login result:", result);

      if (!result) {
        throw new Error("Unexpected error occurred.");
      } else if (result?.status != 200) {
        setButtonLoading(false);
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          html: `
          <div style="text-align: left;">
            <p>${result?.message}</p>
            <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">${json}</pre>
          </div>
        `,
        });
        return;
      }

      // Successful login
      Swal.fire({
        title: "Form Successfully Sent",
        html: `
          <div style="text-align: left;">
            <p>You are in <strong>${
              result?.data?.property?.name || "Unknown Property"
            }</strong>!</p>
            <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">${json}</pre>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Continue",
      }).then(async (response) => {
        if (response.isConfirmed) {
          if (result?.data?.property) {
            const propertyId = result?.data?.property?.id;
            const propertyName = result?.data?.property?.name;
            sessionStorage.setItem("propertyId", propertyId as string);
            localStorage.setItem("propertyId", propertyId as string);
            setPropertyId(propertyId as string);
            localStorage.setItem("propertyName", propertyName);
            sessionStorage.setItem("propertyName", propertyName);
            setPropertyName(propertyName);
            localStorage.setItem("isLoggedIn", "true");
            if (propertyId) await joinGroup(propertyId);

            setAccountUser(email);
            localStorage.setItem("accountUser", email);
            sessionStorage.setItem("accountUser", email);

            const role = result?.data?.user?.role || result?.data?.role || null;
            if (role) {
              setUserRole(String(role));
              localStorage.setItem("userRole", String(role));
              sessionStorage.setItem("userRole", String(role));
            }
          }

          setTimeout(() => {
            setRedirecting(true);
          }, 500);

          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Error",
        text: "An error occurred during login. Please try again.",
      });
      setButtonLoading(false);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  const handleLocationMode = () => {
    if (locationMode === "live") {
      setLocationMode("manual");
      Swal.fire({
        icon: "info",
        title: "Manual Mode Activated",
        text: "You can now enter your property details manually.",
      });
    } else {
      setLocationMode("live");
      Swal.fire({
        icon: "info",
        title: "Live Mode Activated",
        text: "Your location will be used to determine your property.",
      });
    }
  };

  return (
    <>
      {(redirecting === true || pageLoading === true) && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-70 z-50 flex items-center justify-center">
          <div className="flex flex-col h-auto">
            <PageLoader />
            <p className="text-white text-sm font-light mt-1 relative bottom-[80px] md:bottom-[150px] lg:bottom-[175px]">
              {redirecting
                ? "Redirecting to dashboard..."
                : "Loading, please wait..."}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm bg-white rounded-2xl p-8 space-y-6 shadow-xl animate-fade-in transition-opacity duration-500 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-2">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Sign In
          </h2>
          <p className="text-sm text-gray-500">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <FloatingLabelInput
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
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
            autoComplete="current-password"
            onChange={(e: { target: { value: SetStateAction<string> } }) =>
              setPassword(e.target.value)
            }
            maxLength={50}
            disabled={buttonLoading}
          />

          {showLocationToggle && (
            <div className="flex justify-center rounded-xl overflow-hidden border border-gray-200">
              <button
                className={`${
                  locationMode === "live"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                } py-2 px-4 text-sm font-medium flex-1 transition-colors`}
                type="button"
                onClick={handleLocationMode}
              >
                Live
              </button>
              <button
                className={`${
                  locationMode === "manual"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                } py-2 px-4 text-sm font-medium flex-1 transition-colors`}
                type="button"
                onClick={handleLocationMode}
              >
                Manual
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={buttonLoading || pageLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 cursor-pointer text-white w-full h-11 font-semibold rounded-xl transition-colors text-sm"
          >
            {buttonLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center">
          Forgot your password?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Reset it
          </a>
        </p>
      </div>
    </>
  );
}
