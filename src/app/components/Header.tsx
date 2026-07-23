"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock,
  Grid2X2,
  KeySquare,
  LogOut,
  Menu,
  ShieldCheck,
  User,
} from "lucide-react";
import { GoDotFill } from "react-icons/go";
import { BiCurrentLocation } from "react-icons/bi";
import { PiWarningDiamondBold } from "react-icons/pi";
import { MdClose } from "react-icons/md";

import useAuthRedirect from "../hooks/loginHook";
import { useProperty } from "../context/PropertyContext";
import usePropertyListener from "../hooks/usePropertyListener";
import { handleLogout } from "../helpers/authHelpers";
import { THEME_PALETTES } from "../lib/propertyTheme";

import Location from "./Location";
import OffCanvas from "./OffCanvas";

const DEFAULT_PRIMARY_COLOR = "#d97706";
const DEFAULT_SECONDARY_COLOR = "#f59e0b";

type AccountIdentity = {
  username: string;
  role: string;
};

const DEFAULT_ACCOUNT_IDENTITY: AccountIdentity = {
  username: "User",
  role: "Employee",
};

const formatAccountRole = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_ACCOUNT_IDENTITY.role;
  }

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStoredAccountIdentity = (): AccountIdentity => {
  if (typeof window === "undefined") {
    return DEFAULT_ACCOUNT_IDENTITY;
  }

  const directUsername =
    localStorage.getItem("username") ||
    localStorage.getItem("userName") ||
    localStorage.getItem("accountUsername") ||
    "";

  const directRole =
    localStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    localStorage.getItem("accountRole") ||
    "";

  const possibleUserKeys = [
    "accountUser",
    "currentUser",
    "user",
    "authUser",
    "loginUser",
  ];

  for (const key of possibleUserKeys) {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) continue;

    try {
      const parsedValue = JSON.parse(storedValue) as Record<string, unknown>;

      if (parsedValue && typeof parsedValue === "object") {
        const usernameCandidate =
          parsedValue.username ??
          parsedValue.userName ??
          parsedValue.name ??
          parsedValue.fullName ??
          parsedValue.email;

        const roleCandidate =
          parsedValue.role ??
          parsedValue.userRole ??
          parsedValue.accountRole ??
          parsedValue.roleName;

        const username =
          typeof usernameCandidate === "string" && usernameCandidate.trim()
            ? usernameCandidate.trim()
            : directUsername;

        const role =
          typeof roleCandidate === "string" && roleCandidate.trim()
            ? roleCandidate.trim()
            : directRole;

        if (username || role) {
          return {
            username: username || DEFAULT_ACCOUNT_IDENTITY.username,
            role: formatAccountRole(role),
          };
        }
      }
    } catch {
      if (key === "accountUser" && storedValue.trim()) {
        return {
          username: storedValue.trim(),
          role: formatAccountRole(directRole),
        };
      }
    }
  }

  return {
    username: directUsername || DEFAULT_ACCOUNT_IDENTITY.username,
    role: formatAccountRole(directRole),
  };
};

const isValidThemeColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  const color = value.trim();

  return (
    /^#[0-9a-fA-F]{3}$/.test(color) ||
    /^#[0-9a-fA-F]{6}$/.test(color) ||
    /^rgb(a)?\(/i.test(color) ||
    /^hsl(a)?\(/i.test(color)
  );
};

const normalizeThemeColor = (value: string) => value.trim().toLowerCase();

const findThemePalette = (
  primaryColor?: string | null,
  secondaryColor?: string | null
) => {
  if (!isValidThemeColor(primaryColor) || !isValidThemeColor(secondaryColor)) {
    return undefined;
  }

  const primary = normalizeThemeColor(primaryColor);
  const secondary = normalizeThemeColor(secondaryColor);

  return THEME_PALETTES.find(
    (palette) =>
      normalizeThemeColor(palette.primary) === primary &&
      normalizeThemeColor(palette.secondary) === secondary
  );
};

const applyGlobalTheme = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  const cachedPrimary = localStorage.getItem("primaryColor");
  const cachedSecondary = localStorage.getItem("secondaryColor");
  const cachedThemeName = localStorage.getItem("parkey-theme");

  const primary = isValidThemeColor(primaryColor)
    ? primaryColor.trim()
    : isValidThemeColor(cachedPrimary)
    ? cachedPrimary.trim()
    : DEFAULT_PRIMARY_COLOR;

  const secondary = isValidThemeColor(secondaryColor)
    ? secondaryColor.trim()
    : isValidThemeColor(cachedSecondary)
    ? cachedSecondary.trim()
    : DEFAULT_SECONDARY_COLOR;

  const matchedPalette =
    findThemePalette(primary, secondary) ||
    THEME_PALETTES.find((palette) => palette.name === cachedThemeName);

  if (matchedPalette) {
    root.dataset.theme = matchedPalette.name;

    root.style.setProperty("--primary", matchedPalette.primary);
    root.style.setProperty("--primary-light", matchedPalette.primaryLight);
    root.style.setProperty("--primary-soft", matchedPalette.primarySoft);

    root.style.setProperty("--secondary", matchedPalette.secondary);
    root.style.setProperty("--secondary-light", matchedPalette?.secondaryLight);
    root.style.setProperty("--secondary-soft", matchedPalette?.secondarySoft);

    localStorage.setItem("primaryColor", matchedPalette.primary);
    localStorage.setItem("secondaryColor", matchedPalette.secondary);
    localStorage.setItem("parkey-theme", matchedPalette.name);

    return;
  }

  root.removeAttribute("data-theme");

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);

  root.style.setProperty(
    "--primary-light",
    `color-mix(in srgb, ${primary} 35%, white)`
  );

  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${primary} 10%, white)`
  );

  root.style.setProperty(
    "--secondary-light",
    `color-mix(in srgb, ${secondary} 35%, white)`
  );

  root.style.setProperty(
    "--secondary-soft",
    `color-mix(in srgb, ${secondary} 10%, white)`
  );

  localStorage.setItem("primaryColor", primary);
  localStorage.setItem("secondaryColor", secondary);
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname?.split("/")?.[1] || "dashboard";

  const {
    propertyId,
    setPropertyId,
    propertyName,
    setPropertyName,
    locationMode,
    requestLocation,
    primaryColor,
    secondaryColor,
    setAccountUser,
  } = useProperty();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [isOutOfArea, setIsOutOfArea] = useState(false);
  const [showLocationToggle, setShowLocationToggle] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountIdentity, setAccountIdentity] = useState<AccountIdentity>(
    DEFAULT_ACCOUNT_IDENTITY
  );

  const accountMenuRef = useRef<HTMLDivElement>(null);

  const mobileGestureTapCountRef = useRef(0);
  const mobileGestureLastTapRef = useRef(0);
  const mobileGestureHoldTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const mobileGestureResetTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const mobileGestureHoldTriggeredRef = useRef(false);

  const MOBILE_GESTURE_TAP_WINDOW = 650;
  const MOBILE_GESTURE_HOLD_DURATION = 700;
  const MOBILE_GESTURE_SEQUENCE_TIMEOUT = 1800;

  useEffect(() => {
    if (isMenuOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useAuthRedirect();
  usePropertyListener();

  useLayoutEffect(() => {
    applyGlobalTheme({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    setMounted(true);

    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    setIsLoggedIn(loggedIn);
    setAccountIdentity(getStoredAccountIdentity());
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    setIsOutOfArea(!propertyId);
  }, [propertyId, propertyName, locationMode]);

  useEffect(() => {
    requestLocation();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setShowLocationToggle((previous) => !previous);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const clearMobileGestureTimers = () => {
    if (mobileGestureHoldTimerRef.current) {
      clearTimeout(mobileGestureHoldTimerRef.current);
      mobileGestureHoldTimerRef.current = null;
    }

    if (mobileGestureResetTimerRef.current) {
      clearTimeout(mobileGestureResetTimerRef.current);
      mobileGestureResetTimerRef.current = null;
    }
  };

  const resetMobileLocationGesture = () => {
    clearMobileGestureTimers();

    mobileGestureTapCountRef.current = 0;
    mobileGestureLastTapRef.current = 0;
    mobileGestureHoldTriggeredRef.current = false;
  };

  const scheduleMobileGestureReset = () => {
    if (mobileGestureResetTimerRef.current) {
      clearTimeout(mobileGestureResetTimerRef.current);
    }

    mobileGestureResetTimerRef.current = setTimeout(() => {
      resetMobileLocationGesture();
    }, MOBILE_GESTURE_SEQUENCE_TIMEOUT);
  };

  useEffect(() => {
    return () => {
      if (mobileGestureHoldTimerRef.current) {
        clearTimeout(mobileGestureHoldTimerRef.current);
      }

      if (mobileGestureResetTimerRef.current) {
        clearTimeout(mobileGestureResetTimerRef.current);
      }
    };
  }, []);

  const handleMobileGesturePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event.pointerType === "mouse") return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may not be available in every mobile browser.
    }

    const now = Date.now();
    const elapsedSinceLastTap = now - mobileGestureLastTapRef.current;

    if (
      mobileGestureTapCountRef.current > 0 &&
      elapsedSinceLastTap > MOBILE_GESTURE_TAP_WINDOW
    ) {
      resetMobileLocationGesture();
    }

    /*
     * First two interactions are quick taps.
     * The third interaction must be held.
     */
    if (mobileGestureTapCountRef.current === 2) {
      mobileGestureHoldTriggeredRef.current = false;

      if (mobileGestureHoldTimerRef.current) {
        clearTimeout(mobileGestureHoldTimerRef.current);
      }

      mobileGestureHoldTimerRef.current = setTimeout(() => {
        mobileGestureHoldTriggeredRef.current = true;
        mobileGestureHoldTimerRef.current = null;

        if (mobileGestureResetTimerRef.current) {
          clearTimeout(mobileGestureResetTimerRef.current);
          mobileGestureResetTimerRef.current = null;
        }

        mobileGestureTapCountRef.current = 0;
        mobileGestureLastTapRef.current = 0;

        if (
          typeof navigator !== "undefined" &&
          typeof navigator.vibrate === "function"
        ) {
          navigator.vibrate(50);
        }

        setShowLocationToggle((previous) => !previous);
      }, MOBILE_GESTURE_HOLD_DURATION);
    }
  };

  const handleMobileGesturePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event.pointerType === "mouse") return;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may not be available in every mobile browser.
    }

    if (mobileGestureHoldTimerRef.current) {
      clearTimeout(mobileGestureHoldTimerRef.current);
      mobileGestureHoldTimerRef.current = null;
    }

    if (mobileGestureHoldTriggeredRef.current) {
      mobileGestureHoldTriggeredRef.current = false;
      return;
    }

    /*
     * If the third press is released before the hold completes,
     * reset the sequence.
     */
    if (mobileGestureTapCountRef.current === 2) {
      resetMobileLocationGesture();
      return;
    }

    mobileGestureTapCountRef.current += 1;
    mobileGestureLastTapRef.current = Date.now();

    scheduleMobileGestureReset();
  };

  const handleMobileGesturePointerCancel = (
    event?: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event) {
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture may not be available in every mobile browser.
      }
    }

    resetMobileLocationGesture();
  };

  const propertyShortName = propertyName
    ? propertyName === "Condado Ocean Club"
      ? "COC"
      : propertyName === "La Concha Resort"
      ? "CRH"
      : propertyName === "Condado Vanderbilt"
      ? "CVH"
      : propertyName.substring(0, 3).toUpperCase()
    : "";

  const handleAuthAction = () => {
    if (!isLoggedIn) {
      router.push("/");
      return;
    }

    setAccountIdentity(getStoredAccountIdentity());
    setIsAccountMenuOpen((previous) => !previous);
  };

  const handleAccountLogout = () => {
    setIsAccountMenuOpen(false);

    handleLogout({
      propertyId,
      setPropertyId,
      setPropertyName,
      setAccountUser,
      router,
    });
  };

  const accountInitial =
    accountIdentity.username.trim().charAt(0).toUpperCase() || "U";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-5">
          <nav className="hidden min-w-0 items-center gap-2 md:flex">
            <Link
              href="/dashboard"
              className={`flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none
              focus-visible:ring-2 focus-visible:ring-(--primary-light) ${
                active === "dashboard"
                  ? `border border-(--primary-light) bg-(--primary-soft) text-primary shadow-sm`
                  : `text-slate-600 hover:bg-(--primary-soft) hover:text-primary`
              }
              `}
            >
              <Grid2X2 className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/check-in"
              className={`flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none
              focus-visible:ring-2 focus-visible:ring-(--primary-light)
                ${
                  active === "check-in"
                    ? `border border-(--primary-light) bg-(--primary-soft) text-primary shadow-sm`
                    : `text-slate-600 hover:bg-(--primary-soft) hover:text-primary`
                }`}
            >
              <Clock className="h-4 w-4" />
              Check-in
            </Link>
          </nav>

          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              title="Open menu"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white
                text-slate-600 transition-all duration-300 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary
                focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="absolute left-1/2 flex max-w-37.5 -translate-x-1/2 items-center justify-center gap-2 sm:max-w-none sm:gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_28px_color-mix(in_srgb,var(--primary)_32%,transparent)]
              transition-all duration-300 sm:h-10 sm:w-10"
            >
              <KeySquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <span className="truncate font-serif text-2xl font-bold text-primary transition-colors duration-300 sm:text-3xl">
              Parkey
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {/* <div className="hidden lg:block">
              <ThemeSelector />
            </div> */}

            {showLocationToggle && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenLocationModal(true)}
                  className={`hidden h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs font-bold shadow-sm
                  transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light) lg:flex
                    ${
                      locationMode === "live"
                        ? `border-red-200 bg-red-50 text-red-700 hover:bg-red-100`
                        : `border-(--primary-light) bg-(--primary-soft) text-primary hover:bg-white`
                    }`}
                >
                  {locationMode === "live" ? (
                    <GoDotFill className="blinking-dot text-red-500" />
                  ) : (
                    <BiCurrentLocation className="text-primary" />
                  )}

                  {locationMode === "live" ? "Live" : "Manual"}

                  {propertyShortName ? ` - ${propertyShortName}` : ""}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenLocationModal(true)}
                  aria-label={`${
                    locationMode === "live" ? "Live" : "Manual"
                  } location control`}
                  title={`${locationMode === "live" ? "Live" : "Manual"} ${
                    propertyShortName ? `- ${propertyShortName}` : ""
                  }`}
                  className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-all duration-300
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light) lg:hidden
                    ${
                      locationMode === "live"
                        ? `border-red-200 bg-red-50 text-red-600
                        `
                        : `border-(--primary-light) bg-(--primary-soft) text-primary`
                    }`}
                >
                  {locationMode === "live" ? (
                    <GoDotFill className="blinking-dot text-red-500" />
                  ) : (
                    <BiCurrentLocation className="text-primary" />
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              aria-label="Hidden mobile location controls"
              title=""
              onPointerDown={handleMobileGesturePointerDown}
              onPointerUp={handleMobileGesturePointerUp}
              onPointerCancel={handleMobileGesturePointerCancel}
              onContextMenu={(event) => event.preventDefault()}
              className="-mr-1 flex h-11 w-11 shrink-0 select-none bg-transparent md:hidden"
              style={{
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                touchAction: "manipulation",
              }}
            />

            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={handleAuthAction}
                aria-label={isLoggedIn ? "Open account menu" : "Login"}
                aria-haspopup={isLoggedIn ? "menu" : undefined}
                aria-expanded={isLoggedIn ? isAccountMenuOpen : undefined}
                title={isLoggedIn ? "Account" : "Login"}
                className={`relative flex h-10 items-center justify-center rounded-full transition-all duration-300 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light) ${
                  isLoggedIn
                    ? "gap-1 bg-slate-100 pl-2.5 pr-2 text-slate-600 hover:bg-(--primary-soft) hover:text-primary"
                    : "w-10 bg-slate-100 text-slate-600 hover:bg-(--primary-soft) hover:text-primary"
                }`}
              >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                  <User className="h-4 w-4" />

                  {isLoggedIn && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </span>

                {isLoggedIn && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isAccountMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {mounted && isLoggedIn && isAccountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 top-full z-100 mt-3 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border
                  border-slate-200 bg-white/98 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-xl"
                >
                  <div className="relative overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-(--primary-soft) to-white p-4">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" />

                    <div className="relative flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white shadow-lg">
                        {accountInitial}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Signed in as
                        </p>

                        <p className="mt-0.5 truncate text-sm font-bold text-slate-950">
                          {accountIdentity.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--primary-soft) text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Role
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {accountIdentity.role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleAccountLogout}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-red-600
                      transition-all duration-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <LogOut className="h-4 w-4" />
                      </span>

                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              title="Open menu"
              className="hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600
              transition-all duration-300 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary focus:outline-none focus-visible:ring-2
              focus-visible:ring-(--primary-light) md:flex"
            >
              <Menu className="h-5 w-5" />
            </button>

            <OffCanvas isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          </div>
        </div>
      </header>

      {mounted &&
        openLocationModal &&
        createPortal(
          <div className="fixed inset-0 z-99999 flex items-center justify-center  bg-slate-950/75 p-2 backdrop-blur-sm sm:p-4">
            <div
              className="relative flex h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]
              sm:h-auto sm:max-h-[92vh] sm:rounded-4xl"
            >
              <div
                className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-linear-to-r from-white via-(--primary-soft)
              to-white px-4 py-3 transition-colors duration-300 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                      <BiCurrentLocation className="h-4 w-4" />
                    </div>

                    <h3 className="truncate font-serif text-lg font-bold text-slate-950 sm:text-xl">
                      Location Control
                    </h3>
                  </div>

                  <p className="line-clamp-2 text-xs font-medium text-slate-500">
                    Manually control live or manual property location.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenLocationModal(false)}
                  aria-label="Close location modal"
                  title="Close location modal"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600
                  shadow-sm transition-all duration-300 hover:border-(--primary-light) hover:bg-(--primary-soft) hover:text-primary focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                >
                  <MdClose className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4">
                <div className="min-w-0 overflow-x-auto">
                  <Location />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {!openLocationModal && isOutOfArea && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4 text-center text-white backdrop-blur-sm">
          <div
            className="pointer-events-auto w-full max-w-md rounded-4xl border border-white/10 bg-white/10 px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)]
            backdrop-blur-xl sm:px-8 sm:py-10"
          >
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] ring-1
              ring-[color-mix(in_srgb,var(--primary-light)_42%,transparent)] transition-colors duration-300 sm:h-20 sm:w-20"
            >
              <PiWarningDiamondBold className="h-9 w-9 text-(--primary-light) transition-colors duration-300 sm:h-11 sm:w-11" />
            </div>

            <h2 className="mb-2 font-serif text-xl font-bold sm:text-2xl">
              You are not inside any of our properties
            </h2>

            <p className="text-sm leading-6 text-slate-200">
              Please return to the designated property location.
            </p>
          </div>
        </div>
      )}
    </>
  );
}