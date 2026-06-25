"use client";

import { useState, useEffect, useRef, SetStateAction } from "react";
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

  const mobileTapCountRef = useRef(0);
  const mobileTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlockLocationToggle = () => {
    setShowLocationToggle((prev) => !prev);

    Swal.fire({
      toast: true,
      position: "top",
      icon: "success",
      title: "Location controls updated",
      showConfirmButton: false,
      timer: 1400,
      confirmButtonColor: "#d6a800",
    });
  };

  const handleMobileSecretTap = () => {
    mobileTapCountRef.current += 1;

    if (mobileTapTimerRef.current) clearTimeout(mobileTapTimerRef.current);

    mobileTapTimerRef.current = setTimeout(() => {
      mobileTapCountRef.current = 0;
    }, 1200);

    if (mobileTapCountRef.current >= 5) {
      mobileTapCountRef.current = 0;
      unlockLocationToggle();
    }
  };

  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      unlockLocationToggle();
    }, 1000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  useEffect(() => {
    const keysPressed: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.push(e?.key?.toLowerCase());

      if (keysPressed.length > 3) keysPressed.shift();

      const isCtrlSyn =
        e.ctrlKey && keysPressed.join("") === "syn" && keysPressed.length === 3;

      if (isCtrlSyn) unlockLocationToggle();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!latitude || !longitude) requestLocation();
  }, [latitude, longitude, requestLocation]);

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error("Failed to fetch IP address:", error);
      }
    };

    const detectDeviceType = () => {
      const ua = navigator.userAgent.toLowerCase();

      if (/mobile|android|iphone|ipod|blackberry|phone/.test(ua)) {
        return "mobile";
      }

      if (/tablet|ipad/.test(ua)) {
        return "tablet";
      }

      return "desktop";
    };

    fetchIpAddress();
    setDeviceType(detectDeviceType());
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      setRedirecting(true);
      router.replace("/dashboard");
    } else {
      setPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (mobileTapTimerRef.current) clearTimeout(mobileTapTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter email and password.",
        confirmButtonColor: "#d6a800",
      });
      return;
    }

    setButtonLoading(true);

    const sentForm = {
      username: email,
      temporaryPassword: password,
      device: deviceType,
      location: ipAddress,
      latitude: locationMode === "live" ? Number(latitude) : 18.426434330459355,
      longitude:
        locationMode === "live" ? Number(longitude) : -66.05954507209249,
    };

    try {
      const result = await validateUser(sentForm);
      // const json = JSON.stringify(sentForm, null, 2); // FOR DEBUGGING PURPOSES ONLY

      setPredefinedProperties(result?.data?.properties || []);
      localStorage.setItem(
        "properties",
        JSON.stringify(result?.data?.properties || [])
      );

      if (!result) {
        throw new Error("Unexpected error occurred.");
      } else if (result?.status != 200) {
        setButtonLoading(false);
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          confirmButtonColor: "#d6a800",
          //   html: `
          //   <div style="text-align: left;">
          //     <p>${result?.message}</p>
          //     <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">${json}</pre>
          //   </div>
          // `,
          text:
            result?.message ||
            "Unauthorized access. Please check your credentials.",
        });
        return;
      }

      Swal.fire({
        title: "Login Successful",
        // title: "Form Successfully Sent",
        // html: `
        //   <div style="text-align: left;">
        //     <p>You are in <strong>${
        //       result?.data?.property?.name || "Unknown Property"
        //     }</strong>!</p>
        //     <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">${json}</pre>
        //   </div>
        // `,
        text: `You are now logged into ${
          result?.data?.property?.name || "Unknown Property"
        }!`,
        icon: "success",
        confirmButtonText: "Continue",
        confirmButtonColor: "#d6a800",
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

      setButtonLoading(false);

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#d6a800",
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
        confirmButtonColor: "#d6a800",
      });
    } else {
      setLocationMode("live");
      Swal.fire({
        icon: "info",
        title: "Live Mode Activated",
        text: "Your location will be used to determine your property.",
        confirmButtonColor: "#d6a800",
      });
    }
  };

  const mailToSupport = () => {};

  return (
    <>
      {(redirecting === true || pageLoading === true) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex h-auto flex-col">
            <PageLoader />
            <p className="relative bottom-20 mt-1 text-sm font-light text-white md:bottom-37.5 lg:bottom-43.75">
              {redirecting
                ? "Redirecting to dashboard..."
                : "Loading, please wait..."}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm space-y-6 rounded-4xl border border-slate-200 p-8 animate-fade-in transition-opacity duration-500">
        <button
          type="button"
          aria-label="Unlock location controls"
          onClick={handleMobileSecretTap}
          onPointerDown={handleLongPressStart}
          onPointerUp={handleLongPressEnd}
          onPointerLeave={handleLongPressEnd}
          onPointerCancel={handleLongPressEnd}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-full opacity-0"
        />

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
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
              <div className="grid grid-cols-2 p-1">
                <button
                  className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                    locationMode === "live"
                      ? "bg-amber-500 text-white shadow-[0_10px_22px_rgba(217,174,38,0.25)]"
                      : "text-slate-600 hover:bg-white"
                  }`}
                  type="button"
                  onClick={handleLocationMode}
                >
                  Live
                </button>

                <button
                  className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                    locationMode === "manual"
                      ? "bg-amber-500 text-white shadow-[0_10px_22px_rgba(217,174,38,0.25)]"
                      : "text-slate-600 hover:bg-white"
                  }`}
                  type="button"
                  onClick={handleLocationMode}
                >
                  Manual
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={buttonLoading || pageLoading}
            className="h-12 w-full cursor-pointer rounded-2xl bg-amber-500 text-sm font-bold text-white shadow-[0_12px_28px_rgba(217,174,38,0.28)] transition-all hover:bg-amber-600 hover:shadow-[0_16px_36px_rgba(217,174,38,0.35)] disabled:opacity-60"
          >
            {buttonLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Forgot your password?{" "}
          {/* <a
            href="#"
            className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
          >
            Reset it
          </a> */}
          {/* Add contact support mailto */}
          <span
            onClick={() => {
              mailToSupport();
            }}
            className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
          >
            Contact Support
          </span>
        </p>
      </div>
    </>
  );
}
