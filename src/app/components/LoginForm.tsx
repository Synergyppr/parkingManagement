"use client";
import {
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { validateUser } from "../auth/userStoreApi";
import { useProperty } from "../context/PropertyContext";
import { joinGroup } from "../lib/SignalRProvider";
import FloatingLabelInput from "./elements/FloatingLabelInput";
import PageLoader from "./elements/PageLoader";

const DEFAULT_THEME_COLOR = "#d97706";

const getThemeColor = (
  variableName = "--primary",
  fallback = DEFAULT_THEME_COLOR
) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

  return value || fallback;
};

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
    setShowLocationToggle((previous) => !previous);

    Swal.fire({
      toast: true,
      position: "top",
      icon: "success",
      title: "Location controls updated",
      showConfirmButton: false,
      timer: 1400,
      confirmButtonColor: getThemeColor(),
    });
  };

  const handleMobileSecretTap = () => {
    mobileTapCountRef.current += 1;

    if (mobileTapTimerRef.current) {
      clearTimeout(mobileTapTimerRef.current);
    }

    mobileTapTimerRef.current = setTimeout(() => {
      mobileTapCountRef.current = 0;
    }, 1200);

    if (mobileTapCountRef.current >= 5) {
      mobileTapCountRef.current = 0;
      unlockLocationToggle();
    }
  };

  const handleLongPressStart = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      unlockLocationToggle();
    }, 1000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    const keysPressed: string[] = [];

    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.push(event?.key?.toLowerCase());

      if (keysPressed.length > 3) {
        keysPressed.shift();
      }

      const isCtrlSyn =
        event.ctrlKey &&
        keysPressed.length === 3 &&
        keysPressed.join("") === "syn";

      if (isCtrlSyn) {
        unlockLocationToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!latitude || !longitude) {
      requestLocation();
    }
  }, [latitude, longitude, requestLocation]);

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");

        // if (!response.ok) {
        //   throw new Error(`IP request failed with status ${response.status}`);
        // }

        const data: { ip?: string } = await response.json();
        setIpAddress(data.ip || "");
      } catch (error) {
        console.error("Failed to fetch IP address:", error);
      }
    };

    const detectDeviceType = () => {
      const userAgent = navigator.userAgent.toLowerCase();

      if (/mobile|android|iphone|ipod|blackberry|phone/.test(userAgent)) {
        return "mobile";
      }

      if (/tablet|ipad/.test(userAgent)) {
        return "tablet";
      }

      return "desktop";
    };

    // void fetchIpAddress();
    fetchIpAddress();
    setDeviceType(detectDeviceType());
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      setRedirecting(true);
      router.replace("/check-in");
    } else {
      setPageLoading(false);
    }
  }, [router]);
  useEffect(() => {
    return () => {
      if (mobileTapTimerRef.current) {
        clearTimeout(mobileTapTimerRef.current);
      }

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
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
            router.push("/check-in");
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

  const handleLocationMode = async () => {
    if (locationMode === "live") {
      setLocationMode("manual");

      await Swal.fire({
        icon: "info",
        title: "Manual Mode Activated",
        text: "You can now enter your property details manually.",
        confirmButtonColor: getThemeColor(),
      });

      return;
    }

    setLocationMode("live");

    await Swal.fire({
      icon: "info",
      title: "Live Mode Activated",
      text: "Your location will be used to determine your property.",
      confirmButtonColor: getThemeColor(),
    });
  };

  const mailToSupport = () => {
    window.location.href =
      "mailto:support@parkeyvalet.com?subject=Parkey%20Valet%20Login%20Support";
  };

  return (
    <>
      {(redirecting || pageLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex h-auto flex-col gap-2 items-center">
            <PageLoader />

            <p className="relative bottom-20 mt-1 text-sm font-light text-white md:bottom-37.5 lg:bottom-43.75">
              {redirecting
                ? "Redirecting to dashboard..."
                : "Loading, please wait..."}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm animate-fade-in space-y-6 rounded-4xl border border-slate-200/80 bg-white/40 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-opacity duration-500">
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
            type="text"
            // type="email"
            value={email}
            autoComplete="email"
            onChange={(event: { target: { value: SetStateAction<string> } }) =>
              setEmail(event.target.value)
            }
            maxLength={50}
            disabled={buttonLoading}
          />

          <FloatingLabelInput
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event: { target: { value: SetStateAction<string> } }) =>
              setPassword(event.target.value)
            }
            maxLength={50}
            disabled={buttonLoading}
          />

          {showLocationToggle && (
            <div className="overflow-hidden rounded-2xl border border-(--primary-light) bg-(--primary-soft)/70 shadow-sm transition-colors duration-300">
              <div className="grid grid-cols-2 gap-1 p-1">
                <button
                  type="button"
                  onClick={handleLocationMode}
                  aria-pressed={locationMode === "live"}
                  className={`rounded-xl py-2.5 text-sm font-bold transition-all duration-300 ${
                    locationMode === "live"
                      ? "bg-primary text-white shadow-[0_10px_22px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                      : "text-slate-600 hover:bg-white/90 hover:text-primary"
                  }`}
                >
                  Live
                </button>

                <button
                  type="button"
                  onClick={handleLocationMode}
                  aria-pressed={locationMode === "manual"}
                  className={`rounded-xl py-2.5 text-sm font-bold transition-all duration-300 ${
                    locationMode === "manual"
                      ? "bg-primary text-white shadow-[0_10px_22px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                      : "text-slate-600 hover:bg-white/90 hover:text-primary"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={buttonLoading || pageLoading}
            className="h-12 w-full cursor-pointer rounded-2xl bg-primary text-sm font-bold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_30%,transparent)]
            transition-all duration-300 hover:-translate-y-0.5  hover:bg-secondary hover:shadow-[0_16px_36px_color-mix(in_srgb,var(--primary)_38%,transparent)]
            focus:outline-none focus:ring-2 focus:ring-(--primary-light) focus:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
          >
            {buttonLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Forgot your password?{" "}
          <button
            type="button"
            onClick={mailToSupport}
            className="cursor-pointer font-semibold text-primary transition-colors duration-200 hover:text-secondary hover:underline focus:outline-none
            focus-visible:rounded focus-visible:ring-2 focus-visible:ring-(--primary-light)"
          >
            Contact Support
          </button>
        </p>
      </div>
    </>
  );
}
