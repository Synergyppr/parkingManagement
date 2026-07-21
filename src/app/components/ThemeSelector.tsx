"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Check, ChevronDown, LoaderCircle, Palette } from "lucide-react";

import { useProperty } from "../context/PropertyContext";

type ThemeName =
  | "amber"
  | "sapphire"
  | "emerald"
  | "royal"
  | "ruby"
  | "teal"
  | "rose"
  | "obsidian";

type ThemeOption = {
  name: ThemeName;
  label: string;
  description: string;
  primary: string;
  secondary: string;
  light: string;
  soft: string;
};

const THEMES: ThemeOption[] = [
  {
    name: "amber",
    label: "Amber",
    description: "Warm and premium",
    primary: "#d97706",
    secondary: "#f59e0b",
    light: "#fbbf24",
    soft: "#fffbeb",
  },
  {
    name: "sapphire",
    label: "Sapphire",
    description: "Clean and professional",
    primary: "#2563eb",
    secondary: "#3b82f6",
    light: "#60a5fa",
    soft: "#eff6ff",
  },
  {
    name: "emerald",
    label: "Emerald",
    description: "Fresh and confident",
    primary: "#059669",
    secondary: "#10b981",
    light: "#34d399",
    soft: "#ecfdf5",
  },
  {
    name: "royal",
    label: "Royal",
    description: "Bold and elegant",
    primary: "#7c3aed",
    secondary: "#8b5cf6",
    light: "#a78bfa",
    soft: "#f5f3ff",
  },
  {
    name: "ruby",
    label: "Ruby",
    description: "Strong and energetic",
    primary: "#dc2626",
    secondary: "#ef4444",
    light: "#f87171",
    soft: "#fef2f2",
  },
  {
    name: "teal",
    label: "Teal",
    description: "Modern and balanced",
    primary: "#0f766e",
    secondary: "#14b8a6",
    light: "#2dd4bf",
    soft: "#f0fdfa",
  },
  {
    name: "rose",
    label: "Rose",
    description: "Vibrant and refined",
    primary: "#db2777",
    secondary: "#ec4899",
    light: "#f472b6",
    soft: "#fdf2f8",
  },
  {
    name: "obsidian",
    label: "Obsidian",
    description: "Dark luxury with gold",
    primary: "#111827",
    secondary: "#b8941f",
    light: "#d4af37",
    soft: "#f9f5e7",
  },
];

const DEFAULT_THEME: ThemeName = "amber";

const THEME_STORAGE_KEY = "parkey-theme";
const PRIMARY_STORAGE_KEY = "primaryColor";
const SECONDARY_STORAGE_KEY = "secondaryColor";

const normalizeColor = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.trim();

  if (!normalized) return fallback;

  return normalized;
};

const colorsMatch = (
  first: string | null | undefined,
  second: string | null | undefined
) => {
  return first?.trim().toLowerCase() === second?.trim().toLowerCase();
};

const findThemeByColors = (
  primaryColor?: string | null,
  secondaryColor?: string | null
): ThemeOption | undefined => {
  return THEMES.find(
    (theme) =>
      colorsMatch(theme.primary, primaryColor) &&
      colorsMatch(theme.secondary, secondaryColor)
  );
};

const findThemeByName = (
  themeName: string | null | undefined
): ThemeOption | undefined => {
  return THEMES.find((theme) => theme.name === themeName);
};

const applyThemeVariables = ({
  primary,
  secondary,
  light,
  soft,
}: {
  primary: string;
  secondary: string;
  light?: string;
  soft?: string;
}) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);

  root.style.setProperty(
    "--primary-light",
    light || `color-mix(in srgb, ${primary} 38%, white)`
  );

  root.style.setProperty(
    "--primary-soft",
    soft || `color-mix(in srgb, ${primary} 9%, white)`
  );

  root.style.setProperty(
    "--secondary-light",
    `color-mix(in srgb, ${secondary} 38%, white)`
  );

  root.style.setProperty(
    "--secondary-soft",
    `color-mix(in srgb, ${secondary} 9%, white)`
  );
};

const cacheTheme = (theme: ThemeOption) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(THEME_STORAGE_KEY, theme.name);
  localStorage.setItem(PRIMARY_STORAGE_KEY, theme.primary);
  localStorage.setItem(SECONDARY_STORAGE_KEY, theme.secondary);
};

const getPrimaryThemeColor = () => {
  if (typeof window === "undefined") {
    return THEMES[0].primary;
  }

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || THEMES[0].primary
  );
};

export default function ThemeSelector() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    tenantId,
    propertyId,
    latitude,
    longitude,
    // radius,
    // isActive,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
  } = useProperty();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);
  const [loadingTheme, setLoadingTheme] = useState<ThemeName | null>(null);

  /*
   * Initialize the theme.
   *
   * Priority:
   * 1. Colors retrieved from the active property endpoint/context.
   * 2. Cached colors from the last successful selection.
   * 3. Default amber theme.
   */
  useEffect(() => {
    const contextTheme = findThemeByColors(primaryColor, secondaryColor);

    const cachedThemeName =
      typeof window !== "undefined"
        ? localStorage.getItem(THEME_STORAGE_KEY)
        : null;

    const cachedPrimary =
      typeof window !== "undefined"
        ? localStorage.getItem(PRIMARY_STORAGE_KEY)
        : null;

    const cachedSecondary =
      typeof window !== "undefined"
        ? localStorage.getItem(SECONDARY_STORAGE_KEY)
        : null;

    const cachedTheme =
      findThemeByColors(cachedPrimary, cachedSecondary) ||
      findThemeByName(cachedThemeName);

    const initialTheme =
      contextTheme ||
      cachedTheme ||
      THEMES.find((option) => option.name === DEFAULT_THEME) ||
      THEMES[0];

    setTheme(initialTheme.name);

    applyThemeVariables({
      primary: normalizeColor(primaryColor, initialTheme.primary),
      secondary: normalizeColor(secondaryColor, initialTheme.secondary),
      light: contextTheme ? contextTheme.light : initialTheme.light,
      soft: contextTheme ? contextTheme.soft : initialTheme.soft,
    });

    setMounted(true);
  }, []);

  /*
   * Keep the app synchronized whenever the property colors are
   * refreshed from the endpoint or changed elsewhere.
   */
  useEffect(() => {
    if (!mounted) return;
    if (!primaryColor || !secondaryColor) return;

    const matchedTheme = findThemeByColors(primaryColor, secondaryColor);

    if (matchedTheme) {
      setTheme(matchedTheme.name);

      applyThemeVariables({
        primary: matchedTheme.primary,
        secondary: matchedTheme.secondary,
        light: matchedTheme.light,
        soft: matchedTheme.soft,
      });

      cacheTheme(matchedTheme);
      return;
    }

    /*
     * The endpoint may contain custom colors that do not match
     * one of the predefined themes.
     */
    applyThemeVariables({
      primary: primaryColor,
      secondary: secondaryColor,
    });
  }, [mounted, primaryColor, secondaryColor]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const persistPropertyTheme = async (selectedTheme: ThemeOption) => {
    if (!propertyId) {
      throw new Error("A property must be selected before changing the theme.");
    }

    const payload = {
      id: propertyId,
      tenantId: tenantId,
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      primaryColor: selectedTheme.primary,
      secondaryColor: selectedTheme.secondary,
      name: "string",
      address: "string",
      radiusMeters: 0,
      isActive: true,
    };

    const response = await fetch("/api/properties/createAndUpdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    const requestSucceeded =
      response.ok &&
      (result?.result?.status === "200" || result?.result?.status === 200);

    if (!requestSucceeded) {
      throw new Error(
        result?.result?.message || "The property theme could not be updated."
      );
    }

    return result;
  };

  const handleThemeChange = async (selectedTheme: ThemeOption) => {
    if (loadingTheme) return;
    if (selectedTheme.name === theme) {
      setIsOpen(false);
      return;
    }

    const previousTheme =
      findThemeByColors(primaryColor, secondaryColor) ||
      THEMES.find((option) => option.name === theme) ||
      THEMES[0];

    setLoadingTheme(selectedTheme.name);

    /*
     * Optimistic update:
     * Update the UI immediately without waiting for the endpoint.
     */
    setTheme(selectedTheme.name);
    setPrimaryColor(selectedTheme.primary);
    setSecondaryColor(selectedTheme.secondary);

    applyThemeVariables({
      primary: selectedTheme.primary,
      secondary: selectedTheme.secondary,
      light: selectedTheme.light,
      soft: selectedTheme.soft,
    });

    try {
      await persistPropertyTheme(selectedTheme);

      cacheTheme(selectedTheme);
      setIsOpen(false);

      Swal.fire({
        icon: "success",
        title: "Theme Updated",
        text: `${selectedTheme.label} is now the active property theme.`,
        showConfirmButton: false,
        timer: 1600,
      });
    } catch (error) {
      console.error("Theme update error:", error);

      /*
       * Roll back every theme layer when persistence fails.
       */
      setTheme(previousTheme.name);
      setPrimaryColor(previousTheme.primary);
      setSecondaryColor(previousTheme.secondary);

      applyThemeVariables({
        primary: previousTheme.primary,
        secondary: previousTheme.secondary,
        light: previousTheme.light,
        soft: previousTheme.soft,
      });

      cacheTheme(previousTheme);

      Swal.fire({
        icon: "error",
        title: "Theme Update Failed",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating the theme.",
        confirmButtonColor: getPrimaryThemeColor(),
      });
    } finally {
      setLoadingTheme(null);
    }
  };

  const selectedTheme =
    findThemeByColors(primaryColor, secondaryColor) ||
    THEMES.find((option) => option.name === theme) ||
    THEMES[0];

  if (!mounted) {
    return (
      <div className="h-11 w-full min-w-0 animate-pulse rounded-2xl bg-slate-100 lg:w-48" />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0 lg:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        disabled={Boolean(loadingTheme)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Choose property theme"
        className="
          flex min-h-11 w-full cursor-pointer items-center
          justify-between gap-3 rounded-2xl border border-slate-200
          bg-white px-3 py-2 text-left shadow-sm
          transition-all duration-300
          hover:border-(--primary-light)
          hover:bg-(--primary-soft)
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-(--primary-light)
          disabled:cursor-not-allowed
          disabled:opacity-70
          lg:min-h-10 lg:w-48
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-xl text-white
              shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_25%,transparent)]
            "
            style={{
              background: `linear-gradient(
                135deg,
                ${selectedTheme.primary},
                ${selectedTheme.secondary}
              )`,
            }}
          >
            {loadingTheme ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Palette className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Theme
            </p>

            <p className="truncate text-sm font-extrabold text-slate-900">
              {selectedTheme.label}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Choose application theme"
          className="
            absolute right-0 top-[calc(100%+0.5rem)] z-10000
            w-full min-w-65 overflow-hidden rounded-3xl
            border border-slate-200 bg-white p-2
            shadow-[0_24px_70px_rgba(15,23,42,0.2)]
            lg:w-80
          "
        >
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="text-sm font-extrabold text-slate-950">
              Choose a theme
            </p>

            <p className="mt-0.5 text-xs font-medium leading-5 text-slate-400">
              The selected colors will be saved to the active property.
            </p>
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto overscroll-contain p-1">
            {THEMES.map((option) => {
              const isSelected = option.name === selectedTheme.name;

              const isSaving = loadingTheme === option.name;

              return (
                <button
                  key={option.name}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={Boolean(loadingTheme)}
                  onClick={() => handleThemeChange(option)}
                  className={`
                    group flex w-full cursor-pointer items-center
                    gap-3 rounded-2xl border px-3 py-3 text-left
                    transition-all duration-200
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                    ${
                      isSelected
                        ? `
                            border-(--primary-light)
                            bg-(--primary-soft)
                            shadow-sm
                          `
                        : `
                            border-transparent
                            hover:border-slate-200
                            hover:bg-slate-50
                          `
                    }
                  `}
                >
                  <span
                    className="
                      relative flex h-11 w-11 shrink-0
                      overflow-hidden rounded-2xl
                      border border-black/5 shadow-sm
                    "
                    style={{
                      background: option.soft,
                    }}
                  >
                    <span
                      className="absolute bottom-0 left-0 h-full w-1/2"
                      style={{
                        background: option.primary,
                      }}
                    />

                    <span
                      className="absolute right-0 top-0 h-full w-1/2"
                      style={{
                        background: option.secondary,
                      }}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-extrabold ${
                        isSelected ? "text-primary" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </span>

                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">
                      {option.description}
                    </span>
                  </span>

                  <span
                    className={`
                      flex h-7 w-7 shrink-0 items-center
                      justify-center rounded-full transition-all
                      ${
                        isSelected
                          ? `
                              bg-primary
                              text-white
                              shadow-[0_6px_16px_color-mix(in_srgb,var(--primary)_25%,transparent)]
                            `
                          : `
                              bg-slate-100
                              text-transparent
                              group-hover:text-slate-300
                            `
                      }
                    `}
                  >
                    {isSaving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
